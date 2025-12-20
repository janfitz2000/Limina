-- Add discount codes system for generating platform-specific promo codes
-- This allows merchants to send exclusive discount codes instead of public price drops

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buy_order_id UUID NOT NULL REFERENCES buy_orders(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,

    -- The actual discount code
    code TEXT NOT NULL UNIQUE,

    -- Platform-specific IDs
    platform TEXT NOT NULL CHECK (platform IN ('shopify', 'woocommerce', 'manual')),
    platform_discount_id TEXT, -- Shopify price_rule_id or WooCommerce coupon_id
    platform_code_id TEXT, -- Shopify discount_code_id

    -- Discount configuration
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL, -- 20 for 20% or $20 off
    original_price DECIMAL(10,2) NOT NULL,
    target_price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',

    -- Usage tracking
    status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'used', 'expired', 'failed')),
    usage_limit INTEGER DEFAULT 1, -- How many times code can be used
    usage_count INTEGER DEFAULT 0,

    -- Timestamps
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Metadata
    email_sent BOOLEAN DEFAULT FALSE,
    platform_response JSONB, -- Store API response for debugging
    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure code is unique per platform
    CONSTRAINT unique_code_per_platform UNIQUE (platform, code)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_discount_codes_buy_order ON discount_codes(buy_order_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_merchant ON discount_codes(merchant_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_customer ON discount_codes(customer_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_product ON discount_codes(product_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_status ON discount_codes(status);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_platform ON discount_codes(platform, platform_discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_expires_at ON discount_codes(expires_at);

-- Add RLS policies
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Merchants can view codes for their products
CREATE POLICY "Merchants can view their discount codes" ON discount_codes
    FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

-- Merchants can insert codes for their products
CREATE POLICY "Merchants can create discount codes" ON discount_codes
    FOR INSERT WITH CHECK (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

-- Merchants can update their codes
CREATE POLICY "Merchants can update their discount codes" ON discount_codes
    FOR UPDATE USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate unique discount code
CREATE OR REPLACE FUNCTION generate_discount_code(prefix TEXT DEFAULT 'LIMINA')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate code: PREFIX-SAVE{discount}-{random}
        new_code := UPPER(prefix || '-' ||
                         substring(md5(random()::text) from 1 for 6) || '-' ||
                         substring(md5(random()::text) from 1 for 4));

        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM discount_codes WHERE code = new_code) INTO code_exists;

        -- Exit loop if code is unique
        EXIT WHEN NOT code_exists;
    END LOOP;

    RETURN new_code;
END;
$$;

-- Create function to get discount analytics for merchants
CREATE OR REPLACE FUNCTION get_discount_code_analytics(p_merchant_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE(
    total_codes_generated BIGINT,
    total_codes_sent BIGINT,
    total_codes_used BIGINT,
    conversion_rate NUMERIC,
    total_discount_value NUMERIC,
    average_discount_percentage NUMERIC,
    codes_by_status JSONB,
    top_products JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(*) as total_generated,
            COUNT(*) FILTER (WHERE status = 'sent') as total_sent,
            COUNT(*) FILTER (WHERE status = 'used') as total_used,
            SUM(discount_value) as total_value,
            AVG(discount_value) as avg_discount
        FROM discount_codes
        WHERE merchant_id = p_merchant_id
        AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    ),
    by_status AS (
        SELECT jsonb_object_agg(status, count) as status_counts
        FROM (
            SELECT status, COUNT(*) as count
            FROM discount_codes
            WHERE merchant_id = p_merchant_id
            AND created_at >= NOW() - (p_days || ' days')::INTERVAL
            GROUP BY status
        ) s
    ),
    products AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'product_id', p.id,
                'product_title', p.title,
                'codes_generated', COUNT(dc.id),
                'codes_used', COUNT(*) FILTER (WHERE dc.status = 'used')
            )
            ORDER BY COUNT(dc.id) DESC
            LIMIT 10
        ) as top_prods
        FROM discount_codes dc
        JOIN products p ON p.id = dc.product_id
        WHERE dc.merchant_id = p_merchant_id
        AND dc.created_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY p.id, p.title
    )
    SELECT
        s.total_generated,
        s.total_sent,
        s.total_used,
        CASE
            WHEN s.total_sent > 0 THEN ROUND((s.total_used::NUMERIC / s.total_sent::NUMERIC) * 100, 2)
            ELSE 0
        END as conversion_rate,
        COALESCE(s.total_value, 0),
        COALESCE(s.avg_discount, 0),
        COALESCE(bs.status_counts, '{}'::jsonb),
        COALESCE(p.top_prods, '[]'::jsonb)
    FROM stats s
    CROSS JOIN by_status bs
    CROSS JOIN products p;
END;
$$;

-- Create function to mark code as used (called by webhooks)
CREATE OR REPLACE FUNCTION mark_discount_code_used(p_code TEXT, p_platform TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_record discount_codes%ROWTYPE;
BEGIN
    -- Find the code
    SELECT * INTO code_record
    FROM discount_codes
    WHERE code = p_code
    AND platform = p_platform
    AND status IN ('sent', 'generated');

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Update the code
    UPDATE discount_codes
    SET
        status = 'used',
        used_at = NOW(),
        usage_count = usage_count + 1
    WHERE id = code_record.id;

    -- Update the buy order
    UPDATE buy_orders
    SET
        status = 'fulfilled',
        fulfilled_at = NOW()
    WHERE id = code_record.buy_order_id;

    -- Create notification for customer
    INSERT INTO notifications (
        user_id, user_type, buy_order_id, title, message, type
    ) VALUES (
        code_record.customer_id,
        'customer',
        code_record.buy_order_id,
        'Purchase Complete! 🎉',
        'Thank you for using your exclusive discount code!',
        'order_fulfilled'
    );

    -- Create notification for merchant
    INSERT INTO notifications (
        user_id, user_type, buy_order_id, title, message, type
    ) VALUES (
        (SELECT user_id FROM merchants WHERE id = code_record.merchant_id),
        'merchant',
        code_record.buy_order_id,
        'Discount Code Redeemed 💰',
        'Customer used discount code: ' || p_code,
        'order_fulfilled'
    );

    RETURN TRUE;
END;
$$;

-- Create function to expire old codes
CREATE OR REPLACE FUNCTION expire_discount_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    WITH expired AS (
        UPDATE discount_codes
        SET status = 'expired'
        WHERE status IN ('generated', 'sent')
        AND expires_at IS NOT NULL
        AND expires_at <= NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO expired_count FROM expired;

    RETURN expired_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_discount_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_discount_code_analytics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_discount_code_used(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_discount_codes() TO authenticated;

-- Add comment explaining the table
COMMENT ON TABLE discount_codes IS 'Stores platform-specific discount codes generated for customer price alerts. Codes are created via Shopify/WooCommerce APIs and tracked for conversion analytics.';
