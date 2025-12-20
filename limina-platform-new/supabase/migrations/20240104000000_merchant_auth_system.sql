-- Migration: Merchant Authentication & Multi-Store System
-- This migration transforms the platform to support real merchant accounts with multiple stores

-- Drop existing fake data and constraints
DELETE FROM buy_orders;
DELETE FROM products;
DELETE FROM merchant_discounts;
DELETE FROM merchants;

-- Update merchants table for real authentication
ALTER TABLE merchants 
DROP COLUMN IF EXISTS shopify_domain,
DROP COLUMN IF EXISTS shopify_access_token;

ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'GB',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise'));

-- Make user_id unique and required
ALTER TABLE merchants ALTER COLUMN user_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);

-- Create stores table to separate merchants from their individual stores
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('shopify', 'woocommerce', 'magento', 'bigcommerce', 'squarespace')),
    store_url TEXT NOT NULL,
    
    -- Platform-specific credentials (encrypted)
    credentials JSONB NOT NULL DEFAULT '{}',
    
    -- OAuth tokens for platforms that support it
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Connection status
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT,
    
    -- Store metadata
    currency TEXT DEFAULT 'GBP',
    timezone TEXT DEFAULT 'Europe/London',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update products table to reference stores instead of merchants directly
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- Migrate existing products (if any) to use store_id
-- Note: This will be empty after we deleted the fake data above

-- Update buy_orders to reference stores
ALTER TABLE buy_orders
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- Update integrations table to reference stores
ALTER TABLE integrations
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- Create merchant_invitations table for team management (future feature)
CREATE TABLE IF NOT EXISTS merchant_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create oauth_states table for secure OAuth flows
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    state_token TEXT NOT NULL UNIQUE,
    return_url TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update indexes for performance
CREATE INDEX IF NOT EXISTS idx_stores_merchant_id ON stores(merchant_id);
CREATE INDEX IF NOT EXISTS idx_stores_platform ON stores(platform);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_buy_orders_store_id ON buy_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_integrations_store_id ON integrations(store_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_token ON oauth_states(state_token);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

-- Row Level Security Policies

-- Merchants can only see their own data
CREATE POLICY "Merchants can view own profile" ON merchants
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Merchants can update own profile" ON merchants
    FOR UPDATE USING (user_id = auth.uid());

-- Stores policies
CREATE POLICY "Merchants can view own stores" ON stores
    FOR SELECT USING (merchant_id IN (
        SELECT id FROM merchants WHERE user_id = auth.uid()
    ));

CREATE POLICY "Merchants can manage own stores" ON stores
    FOR ALL USING (merchant_id IN (
        SELECT id FROM merchants WHERE user_id = auth.uid()
    ));

-- Products policies (through store ownership)
CREATE POLICY "Merchants can view own store products" ON products
    FOR SELECT USING (store_id IN (
        SELECT s.id FROM stores s 
        JOIN merchants m ON s.merchant_id = m.id 
        WHERE m.user_id = auth.uid()
    ));

CREATE POLICY "Merchants can manage own store products" ON products
    FOR ALL USING (store_id IN (
        SELECT s.id FROM stores s 
        JOIN merchants m ON s.merchant_id = m.id 
        WHERE m.user_id = auth.uid()
    ));

-- Buy orders policies
CREATE POLICY "Merchants can view own store orders" ON buy_orders
    FOR SELECT USING (store_id IN (
        SELECT s.id FROM stores s 
        JOIN merchants m ON s.merchant_id = m.id 
        WHERE m.user_id = auth.uid()
    ));

CREATE POLICY "Merchants can manage own store orders" ON buy_orders
    FOR ALL USING (store_id IN (
        SELECT s.id FROM stores s 
        JOIN merchants m ON s.merchant_id = m.id 
        WHERE m.user_id = auth.uid()
    ));

-- Enable RLS
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_orders ENABLE ROW LEVEL SECURITY;

-- Create helper function to get merchant from auth user
CREATE OR REPLACE FUNCTION get_current_merchant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    merchant_id UUID;
BEGIN
    SELECT id INTO merchant_id 
    FROM merchants 
    WHERE user_id = auth.uid();
    
    RETURN merchant_id;
END;
$$;

-- Create function to validate store credentials
CREATE OR REPLACE FUNCTION validate_store_credentials(
    platform_name TEXT,
    credentials_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Basic validation based on platform
    CASE platform_name
        WHEN 'shopify' THEN
            RETURN credentials_data ? 'shop_domain' AND credentials_data ? 'access_token';
        WHEN 'woocommerce' THEN
            RETURN credentials_data ? 'site_url' AND credentials_data ? 'consumer_key' AND credentials_data ? 'consumer_secret';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist to avoid conflicts
DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;

CREATE TRIGGER update_merchants_updated_at
    BEFORE UPDATE ON merchants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample merchant for development (will be replaced with real registration)
-- This creates a merchant tied to a real auth user that can be created via Supabase Auth
COMMENT ON TABLE merchants IS 'Merchants are business owners who connect their e-commerce stores to the platform';
COMMENT ON TABLE stores IS 'Stores represent individual e-commerce platforms connected to a merchant account';
COMMENT ON COLUMN stores.credentials IS 'Encrypted platform-specific credentials like API keys, stored as JSONB';
COMMENT ON COLUMN stores.access_token IS 'OAuth access token for platforms that support OAuth (like Shopify)';