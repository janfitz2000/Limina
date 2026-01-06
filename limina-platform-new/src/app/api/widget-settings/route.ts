import { NextResponse } from 'next/server';
import { createClient } from '@/lib/database';
import type { WidgetSettings } from '@/lib/database';

const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  triggers: {
    exit_intent: { enabled: true, threshold: 50 },
    time_on_page: { enabled: true, delay_seconds: 30 },
    cart_abandonment: { enabled: true },
    scroll_depth: { enabled: false, threshold: 70 }
  },
  display: {
    style: 'inline',
    position: 'after_element',
    collapsed_text: 'Want a better price? Set your target',
    expanded_text: 'Get notified when this drops to your price',
    theme: 'subtle'
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: merchant, error } = await supabase
      .from('merchants')
      .select('id, widget_settings')
      .eq('id', merchantId)
      .single();

    if (error) {
      console.error('Error fetching widget settings:', error);
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Return existing settings or defaults
    const settings = merchant.widget_settings || DEFAULT_WIDGET_SETTINGS;

    return NextResponse.json({
      merchantId: merchant.id,
      settings
    });
  } catch (error) {
    console.error('Error in GET /api/widget-settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { merchantId, settings } = body;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    if (!settings) {
      return NextResponse.json(
        { error: 'settings object is required' },
        { status: 400 }
      );
    }

    // Validate settings structure
    if (!settings.triggers || !settings.display) {
      return NextResponse.json(
        { error: 'settings must include triggers and display objects' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Update merchant widget settings
    const { data, error } = await supabase
      .from('merchants')
      .update({
        widget_settings: settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', merchantId)
      .select('id, widget_settings')
      .single();

    if (error) {
      console.error('Error updating widget settings:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      merchantId: data.id,
      settings: data.widget_settings
    });
  } catch (error) {
    console.error('Error in PUT /api/widget-settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Reset to defaults
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('merchants')
      .update({
        widget_settings: DEFAULT_WIDGET_SETTINGS,
        updated_at: new Date().toISOString()
      })
      .eq('id', merchantId)
      .select('id, widget_settings')
      .single();

    if (error) {
      console.error('Error resetting widget settings:', error);
      return NextResponse.json(
        { error: 'Failed to reset settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      merchantId: data.id,
      settings: data.widget_settings
    });
  } catch (error) {
    console.error('Error in DELETE /api/widget-settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
