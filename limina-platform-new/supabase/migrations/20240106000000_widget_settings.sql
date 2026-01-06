-- Add widget_settings column to merchants table for smart trigger configuration
-- This allows merchants to customize how and when the Limina widget appears

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS widget_settings JSONB DEFAULT '{
  "triggers": {
    "exit_intent": { "enabled": true, "threshold": 50 },
    "time_on_page": { "enabled": true, "delay_seconds": 30 },
    "cart_abandonment": { "enabled": true },
    "scroll_depth": { "enabled": false, "threshold": 70 }
  },
  "display": {
    "style": "inline",
    "position": "after_element",
    "collapsed_text": "Want a better price? Set your target",
    "expanded_text": "Get notified when this drops to your price",
    "theme": "subtle"
  }
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN merchants.widget_settings IS 'JSON configuration for smart widget triggers and display options';

-- Create index for efficient querying of widget settings
CREATE INDEX IF NOT EXISTS idx_merchants_widget_settings ON merchants USING GIN (widget_settings);

-- Create widget_analytics table to track trigger performance
CREATE TABLE IF NOT EXISTS widget_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'widget_triggered',
        'widget_expanded',
        'order_created',
        'widget_dismissed'
    )),
    trigger_reason TEXT CHECK (trigger_reason IN (
        'exit_intent',
        'time_on_page',
        'cart_abandonment',
        'scroll_depth',
        'manual'
    )),
    session_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_widget_analytics_merchant_id ON widget_analytics(merchant_id);
CREATE INDEX IF NOT EXISTS idx_widget_analytics_event_type ON widget_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_widget_analytics_trigger_reason ON widget_analytics(trigger_reason);
CREATE INDEX IF NOT EXISTS idx_widget_analytics_created_at ON widget_analytics(created_at);

-- Add comment for documentation
COMMENT ON TABLE widget_analytics IS 'Tracks widget trigger events and user interactions for analytics';
