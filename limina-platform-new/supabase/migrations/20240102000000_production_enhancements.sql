-- Production Database Enhancements for Limina Platform
-- This migration adds all necessary tables, indexes, and RLS policies for production use

-- Add missing columns to existing tables
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS stripe_account_id TEXT UNIQUE;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS webhook_endpoints JSONB DEFAULT '[]';

-- Add payment status to buy_orders if not exists
ALTER TABLE buy_orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'authorized', 'captured', 'refunded', 'failed'));

-- Create integrations table for platform connections
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('shopify', 'woocommerce', 'magento', 'bigcommerce', 'squarespace')),
    credentials JSONB NOT NULL,
    webhook_endpoints TEXT[],
    sync_settings JSONB NOT NULL DEFAULT '{"products": true, "inventory": true, "orders": true, "customers": false}',
    last_sync TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(merchant_id, platform)
);

-- Create sync logs table for debugging
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    items_processed INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}'
);

-- Create merchant Stripe accounts table
CREATE TABLE IF NOT EXISTS merchant_stripe_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    stripe_account_id TEXT UNIQUE NOT NULL,
    charges_enabled BOOLEAN DEFAULT FALSE,
    payouts_enabled BOOLEAN DEFAULT FALSE,
    details_submitted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payment intents table
CREATE TABLE IF NOT EXISTS payment_intents (
    id TEXT PRIMARY KEY,
    buy_order_id UUID NOT NULL REFERENCES buy_orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'gbp',
    application_fee_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL,
    stripe_account_id TEXT NOT NULL,
    captured_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create escrow payments table
CREATE TABLE IF NOT EXISTS escrow_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buy_order_id UUID NOT NULL REFERENCES buy_orders(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    stripe_payment_method_id TEXT NOT NULL,
    escrow_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    merchant_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
    held_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payouts tracking table
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id TEXT NOT NULL REFERENCES payment_intents(id),
    buy_order_id UUID NOT NULL REFERENCES buy_orders(id),
    merchant_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'gbp',
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
    stripe_payout_id TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create webhooks log table for debugging
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    processing_time_ms INTEGER
);

-- Add currency column to price_history if not exists
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'GBP';

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_integrations_merchant_id ON integrations(merchant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_platform ON integrations(platform);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration_id ON sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_merchant_stripe_accounts_merchant_id ON merchant_stripe_accounts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_stripe_accounts_stripe_id ON merchant_stripe_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_buy_order_id ON payment_intents(buy_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_buy_order_id ON escrow_payments(buy_order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_status ON escrow_payments(status);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_stripe_intent ON escrow_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payouts_buy_order_id ON payouts(buy_order_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_platform ON webhook_logs(platform);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_at ON webhook_logs(processed_at);

-- Optimize existing indexes
CREATE INDEX IF NOT EXISTS idx_buy_orders_payment_status ON buy_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_buy_orders_expires_at ON buy_orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_buy_orders_fulfilled_at ON buy_orders(fulfilled_at);
CREATE INDEX IF NOT EXISTS idx_products_shopify_id ON products(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_stripe_accounts_updated_at BEFORE UPDATE ON merchant_stripe_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integrations (merchants can only see their own)
CREATE POLICY "Merchants can view own integrations" ON integrations
    FOR SELECT USING (auth.uid()::text = merchant_id::text);

CREATE POLICY "Merchants can insert own integrations" ON integrations
    FOR INSERT WITH CHECK (auth.uid()::text = merchant_id::text);

CREATE POLICY "Merchants can update own integrations" ON integrations
    FOR UPDATE USING (auth.uid()::text = merchant_id::text);

-- RLS Policies for sync_logs
CREATE POLICY "Merchants can view own sync logs" ON sync_logs
    FOR SELECT USING (
        integration_id IN (
            SELECT id FROM integrations WHERE merchant_id::text = auth.uid()::text
        )
    );

-- RLS Policies for merchant Stripe accounts
CREATE POLICY "Merchants can view own stripe accounts" ON merchant_stripe_accounts
    FOR SELECT USING (auth.uid()::text = merchant_id::text);

CREATE POLICY "Merchants can manage own stripe accounts" ON merchant_stripe_accounts
    FOR ALL USING (auth.uid()::text = merchant_id::text);

-- RLS Policies for payment intents
CREATE POLICY "Related parties can view payment intents" ON payment_intents
    FOR SELECT USING (
        buy_order_id IN (
            SELECT id FROM buy_orders 
            WHERE merchant_id::text = auth.uid()::text 
               OR customer_id::text = auth.uid()::text
        )
    );

-- RLS Policies for escrow payments
CREATE POLICY "Related parties can view escrow payments" ON escrow_payments
    FOR SELECT USING (
        buy_order_id IN (
            SELECT id FROM buy_orders 
            WHERE merchant_id::text = auth.uid()::text 
               OR customer_id::text = auth.uid()::text
        )
    );

-- RLS Policies for payouts
CREATE POLICY "Merchants can view own payouts" ON payouts
    FOR SELECT USING (
        buy_order_id IN (
            SELECT id FROM buy_orders WHERE merchant_id::text = auth.uid()::text
        )
    );

-- Service role can access webhook logs for system operations
CREATE POLICY "Service role can manage webhook logs" ON webhook_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create helpful database functions

-- Function to get merchant analytics
CREATE OR REPLACE FUNCTION get_merchant_analytics(merchant_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_orders', COUNT(*),
        'active_orders', COUNT(*) FILTER (WHERE status = 'monitoring'),
        'fulfilled_orders', COUNT(*) FILTER (WHERE status = 'fulfilled'),
        'total_revenue', COALESCE(SUM(target_price) FILTER (WHERE status = 'fulfilled'), 0),
        'avg_order_value', COALESCE(AVG(target_price), 0),
        'conversion_rate', 
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND((COUNT(*) FILTER (WHERE status = 'fulfilled')::DECIMAL / COUNT(*)) * 100, 2)
                ELSE 0 
            END
    ) INTO result
    FROM buy_orders 
    WHERE merchant_id = merchant_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for buy order fulfillment
CREATE OR REPLACE FUNCTION check_buy_order_fulfillment()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if any monitoring buy orders can be fulfilled with the new price
    UPDATE buy_orders 
    SET 
        status = 'fulfilled',
        fulfilled_at = NOW()
    WHERE 
        product_id = NEW.id 
        AND status = 'monitoring'
        AND target_price >= NEW.current_price
        AND expires_at > NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically fulfill orders when product prices drop
DROP TRIGGER IF EXISTS trigger_check_fulfillment ON products;
CREATE TRIGGER trigger_check_fulfillment
    AFTER UPDATE OF current_price ON products
    FOR EACH ROW
    WHEN (OLD.current_price IS DISTINCT FROM NEW.current_price)
    EXECUTE FUNCTION check_buy_order_fulfillment();

-- Function to expire old buy orders
CREATE OR REPLACE FUNCTION expire_old_buy_orders()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE buy_orders 
    SET status = 'expired'
    WHERE status = 'monitoring' 
      AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for merchant dashboard data
CREATE OR REPLACE VIEW merchant_dashboard_view AS
SELECT 
    m.id as merchant_id,
    m.name as merchant_name,
    COUNT(bo.id) as total_orders,
    COUNT(bo.id) FILTER (WHERE bo.status = 'monitoring') as active_orders,
    COUNT(bo.id) FILTER (WHERE bo.status = 'fulfilled') as fulfilled_orders,
    COALESCE(SUM(bo.target_price) FILTER (WHERE bo.status = 'fulfilled'), 0) as total_revenue,
    COUNT(p.id) as total_products,
    COALESCE(AVG(p.current_price), 0) as avg_product_price,
    i.last_sync as last_integration_sync,
    msa.charges_enabled as stripe_charges_enabled
FROM merchants m
LEFT JOIN buy_orders bo ON m.id = bo.merchant_id
LEFT JOIN products p ON m.id = p.merchant_id  
LEFT JOIN integrations i ON m.id = i.merchant_id AND i.platform = 'shopify'
LEFT JOIN merchant_stripe_accounts msa ON m.id = msa.merchant_id
GROUP BY m.id, m.name, i.last_sync, msa.charges_enabled;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON merchant_dashboard_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_merchant_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_buy_orders TO service_role;