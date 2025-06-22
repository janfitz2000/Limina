-- Supabase schema for Limina Price Tracker Shopify App
-- This creates the simplified database structure for email-based price tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shops table - stores Shopify shop information
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_domain TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    shop_email TEXT,
    plan_name TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    timezone TEXT,
    webhook_endpoints TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products table - stores product information from Shopify
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shopify_product_id TEXT NOT NULL,
    shop_domain TEXT NOT NULL REFERENCES shops(shop_domain) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    image_url TEXT,
    product_url TEXT,
    variant_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(shopify_product_id, shop_domain)
);

-- Price alerts table - stores customer price alert subscriptions
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    target_price DECIMAL(10,2) NOT NULL,
    customer_name TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'expired', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    triggered_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

-- Price history table - tracks price changes over time
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email logs table - tracks sent emails for debugging and analytics
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('price_alert', 'welcome', 'confirmation')),
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App analytics table - tracks usage and events
CREATE TABLE app_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_domain TEXT NOT NULL REFERENCES shops(shop_domain) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_shop_domain ON products(shop_domain);
CREATE INDEX idx_products_shopify_id ON products(shopify_product_id);
CREATE INDEX idx_products_status ON products(status);

CREATE INDEX idx_price_alerts_product_id ON price_alerts(product_id);
CREATE INDEX idx_price_alerts_email ON price_alerts(email);
CREATE INDEX idx_price_alerts_status ON price_alerts(status);
CREATE INDEX idx_price_alerts_target_price ON price_alerts(target_price);

CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at);

CREATE INDEX idx_email_logs_email ON email_logs(email);
CREATE INDEX idx_email_logs_type ON email_logs(type);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);

CREATE INDEX idx_analytics_shop_domain ON app_analytics(shop_domain);
CREATE INDEX idx_analytics_event_type ON app_analytics(event_type);
CREATE INDEX idx_analytics_created_at ON app_analytics(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for shops (service role access only)
CREATE POLICY "Service role can manage shops" ON shops
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for products (service role access only)
CREATE POLICY "Service role can manage products" ON products
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for price alerts (service role access only)
CREATE POLICY "Service role can manage price_alerts" ON price_alerts
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for price history (service role access only)
CREATE POLICY "Service role can manage price_history" ON price_history
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for email logs (service role access only)
CREATE POLICY "Service role can manage email_logs" ON email_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for analytics (service role access only)
CREATE POLICY "Service role can manage app_analytics" ON app_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamps
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check for triggered price alerts
CREATE OR REPLACE FUNCTION check_price_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- When a product price is updated, check for alerts that should be triggered
    IF OLD.current_price IS DISTINCT FROM NEW.current_price THEN
        -- Update alerts that meet the target price
        UPDATE price_alerts 
        SET status = 'triggered', triggered_at = NOW()
        WHERE product_id = NEW.id 
        AND status = 'active'
        AND target_price >= NEW.current_price;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically check alerts when price changes
CREATE TRIGGER check_price_alerts_on_update AFTER UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION check_price_alerts();

-- Sample data for development (optional)
INSERT INTO shops (shop_domain, access_token, shop_name, shop_email, currency) VALUES
('demo-shop.myshopify.com', 'demo_access_token', 'Demo Shop', 'demo@shop.com', 'USD');

COMMENT ON TABLE shops IS 'Stores Shopify shop information and credentials';
COMMENT ON TABLE products IS 'Product catalog synced from Shopify stores';
COMMENT ON TABLE price_alerts IS 'Customer email subscriptions for price drop notifications';
COMMENT ON TABLE price_history IS 'Historical price data for tracking price changes';
COMMENT ON TABLE email_logs IS 'Audit trail for all sent emails';
COMMENT ON TABLE app_analytics IS 'Usage analytics and event tracking';