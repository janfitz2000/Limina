-- Initialize PostgreSQL database for Limina Price Tracker testing
-- This runs automatically when the postgres container starts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create limina_test database if it doesn't exist
SELECT 'CREATE DATABASE limina_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'limina_test')\gexec

-- Connect to the test database
\c limina_test;

-- Enable extensions in test database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create our tables (simplified schema for Docker testing)
-- Shops table
CREATE TABLE IF NOT EXISTS shops (
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

-- Products table
CREATE TABLE IF NOT EXISTS products (
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

-- Price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
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

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('price_alert', 'welcome', 'confirmation')),
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App analytics table
CREATE TABLE IF NOT EXISTS app_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_domain TEXT NOT NULL REFERENCES shops(shop_domain) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brand settings table
CREATE TABLE IF NOT EXISTS brand_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_domain TEXT NOT NULL REFERENCES shops(shop_domain) ON DELETE CASCADE UNIQUE,
    brand_name TEXT NOT NULL,
    brand_logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#007bff',
    secondary_color TEXT NOT NULL DEFAULT '#6c757d',
    font_family TEXT NOT NULL DEFAULT 'Arial' CHECK (font_family IN ('Arial', 'Helvetica', 'Georgia', 'Times', 'Verdana')),
    email_footer_text TEXT,
    button_style TEXT NOT NULL DEFAULT 'rounded' CHECK (button_style IN ('rounded', 'square', 'pill')),
    custom_css TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_shop_domain ON products(shop_domain);
CREATE INDEX IF NOT EXISTS idx_products_shopify_id ON products(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_product_id ON price_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_email ON price_alerts(email);
CREATE INDEX IF NOT EXISTS idx_price_alerts_status ON price_alerts(status);
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_shop_domain ON app_analytics(shop_domain);

-- Function for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamps
DROP TRIGGER IF EXISTS update_shops_updated_at ON shops;
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_settings_updated_at ON brand_settings;
CREATE TRIGGER update_brand_settings_updated_at BEFORE UPDATE ON brand_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check for triggered price alerts
CREATE OR REPLACE FUNCTION check_price_alerts()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.current_price IS DISTINCT FROM NEW.current_price THEN
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
DROP TRIGGER IF EXISTS check_price_alerts_on_update ON products;
CREATE TRIGGER check_price_alerts_on_update AFTER UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION check_price_alerts();

-- Insert demo shop for testing
INSERT INTO shops (shop_domain, access_token, shop_name, shop_email, currency) 
VALUES ('docker-demo.myshopify.com', 'demo_access_token_docker', 'Docker Demo Shop', 'demo@dockershop.com', 'USD')
ON CONFLICT (shop_domain) DO NOTHING;

-- Grant permissions (for Docker environment)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;