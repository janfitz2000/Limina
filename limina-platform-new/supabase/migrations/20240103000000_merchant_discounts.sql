-- Add merchant discount system for targeted pricing without affecting storefront
-- This allows merchants to fulfill buy orders at specific prices without changing public product prices

-- Create merchant discounts table
CREATE TABLE IF NOT EXISTS merchant_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    discount_price DECIMAL(10,2) NOT NULL,
    target_buy_order_ids UUID[], -- Specific buy orders this discount applies to (NULL = all eligible)
    target_customer_emails TEXT[], -- Specific customers this applies to (NULL = all eligible)
    max_uses INTEGER, -- Maximum number of times this discount can be used (NULL = unlimited)
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used_up', 'expired', 'cancelled'))
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_merchant_discounts_merchant_product ON merchant_discounts(merchant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_merchant_discounts_status ON merchant_discounts(status);
CREATE INDEX IF NOT EXISTS idx_merchant_discounts_expires_at ON merchant_discounts(expires_at);

-- Add RLS policies
ALTER TABLE merchant_discounts ENABLE ROW LEVEL SECURITY;

-- Merchants can only see their own discounts  
CREATE POLICY "Merchants can view their own discounts" ON merchant_discounts
    FOR ALL USING (merchant_id IN (SELECT id FROM merchants WHERE email = auth.email()));

-- Create function to check and fulfill buy orders with merchant discounts
CREATE OR REPLACE FUNCTION check_discount_fulfillment(discount_id UUID)
RETURNS TABLE(
    order_id UUID,
    customer_email TEXT,
    fulfillment_price DECIMAL(10,2),
    status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    discount_record merchant_discounts%ROWTYPE;
    eligible_order RECORD;
    remaining_uses INTEGER;
BEGIN
    -- Get the discount details
    SELECT * INTO discount_record FROM merchant_discounts WHERE id = discount_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Check if discount is still valid
    IF discount_record.status != 'active' THEN
        RETURN;
    END IF;
    
    IF discount_record.expires_at IS NOT NULL AND discount_record.expires_at <= NOW() THEN
        -- Mark discount as expired
        UPDATE merchant_discounts SET status = 'expired' WHERE id = discount_id;
        RETURN;
    END IF;
    
    -- Calculate remaining uses
    remaining_uses := COALESCE(discount_record.max_uses, 999999) - discount_record.current_uses;
    
    IF remaining_uses <= 0 THEN
        -- Mark discount as used up
        UPDATE merchant_discounts SET status = 'used_up' WHERE id = discount_id;
        RETURN;
    END IF;
    
    -- Find eligible buy orders
    FOR eligible_order IN
        SELECT bo.*, ep.stripe_payment_intent_id
        FROM buy_orders bo
        LEFT JOIN escrow_payments ep ON ep.buy_order_id = bo.id
        WHERE bo.product_id = discount_record.product_id
        AND bo.status = 'monitoring'
        AND bo.target_price >= discount_record.discount_price
        AND (
            discount_record.target_buy_order_ids IS NULL 
            OR bo.id = ANY(discount_record.target_buy_order_ids)
        )
        AND (
            discount_record.target_customer_emails IS NULL 
            OR bo.customer_email = ANY(discount_record.target_customer_emails)
        )
        ORDER BY bo.created_at ASC
        LIMIT remaining_uses
    LOOP
        -- Update buy order status
        UPDATE buy_orders 
        SET 
            status = 'fulfilled',
            payment_status = 'captured',
            fulfilled_at = NOW()
        WHERE id = eligible_order.id;
        
        -- Update escrow payment
        UPDATE escrow_payments 
        SET 
            status = 'released',
            released_at = NOW()
        WHERE buy_order_id = eligible_order.id;
        
        -- Increment discount usage
        UPDATE merchant_discounts 
        SET 
            current_uses = current_uses + 1,
            updated_at = NOW()
        WHERE id = discount_id;
        
        -- Create notification for customer
        INSERT INTO notifications (
            user_id, user_type, buy_order_id, title, message, type
        ) VALUES (
            eligible_order.customer_id,
            'customer',
            eligible_order.id,
            'Order Fulfilled! 🎉',
            'Your buy order has been completed at the special price of £' || discount_record.discount_price || '!',
            'order_fulfilled'
        );
        
        -- Create notification for merchant
        INSERT INTO notifications (
            user_id, user_type, buy_order_id, title, message, type
        ) VALUES (
            (SELECT user_id FROM merchants WHERE id = discount_record.merchant_id),
            'merchant',
            eligible_order.id,
            'Discount Order Fulfilled 💰',
            'Buy order payment of £' || eligible_order.target_price || ' processed via discount.',
            'order_fulfilled'
        );
        
        -- Return fulfillment details
        order_id := eligible_order.id;
        customer_email := eligible_order.customer_email;
        fulfillment_price := discount_record.discount_price;
        status := 'fulfilled';
        
        RETURN NEXT;
    END LOOP;
    
    -- Check if discount is now used up
    IF discount_record.max_uses IS NOT NULL 
       AND (SELECT current_uses FROM merchant_discounts WHERE id = discount_id) >= discount_record.max_uses THEN
        UPDATE merchant_discounts SET status = 'used_up' WHERE id = discount_id;
    END IF;
    
    RETURN;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_discount_fulfillment(UUID) TO authenticated;