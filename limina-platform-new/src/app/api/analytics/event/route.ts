import { NextResponse } from 'next/server';
import { createClient } from '@/lib/database';

type WidgetEventType = 'widget_triggered' | 'widget_expanded' | 'order_created' | 'widget_dismissed';
type TriggerReason = 'exit_intent' | 'time_on_page' | 'cart_abandonment' | 'scroll_depth' | 'manual';

interface WidgetEvent {
  event: WidgetEventType;
  merchantId: string;
  productId?: string;
  data?: {
    reason?: TriggerReason;
    targetPrice?: number;
    [key: string]: unknown;
  };
  timestamp?: string;
}

export async function POST(request: Request) {
  try {
    const body: WidgetEvent = await request.json();
    const { event, merchantId, productId, data, timestamp } = body;

    // Validate required fields
    if (!event || !merchantId) {
      return NextResponse.json(
        { error: 'event and merchantId are required' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEvents: WidgetEventType[] = ['widget_triggered', 'widget_expanded', 'order_created', 'widget_dismissed'];
    if (!validEvents.includes(event)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Generate session ID from request headers
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const sessionId = Buffer.from(`${userAgent}-${forwardedFor}-${new Date().toDateString()}`).toString('base64').slice(0, 32);

    const supabase = createClient();

    // Insert analytics event
    const { error } = await supabase
      .from('widget_analytics')
      .insert({
        merchant_id: merchantId,
        product_id: productId || null,
        event_type: event,
        trigger_reason: data?.reason || null,
        session_id: sessionId,
        metadata: {
          ...data,
          timestamp: timestamp || new Date().toISOString(),
          user_agent: userAgent.slice(0, 500)
        }
      });

    if (error) {
      // Log but don't fail - analytics shouldn't break the widget
      console.error('Error inserting widget analytics:', error);
    }

    // Return success regardless (analytics should be fire-and-forget)
    return NextResponse.json({ success: true });
  } catch (error) {
    // Silently fail for analytics - shouldn't impact user experience
    console.error('Error in POST /api/analytics/event:', error);
    return NextResponse.json({ success: true });
  }
}

// GET endpoint for retrieving analytics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    let query = supabase
      .from('widget_analytics')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query.limit(1000);

    if (error) {
      console.error('Error fetching widget analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Aggregate stats
    const stats = {
      total_triggers: 0,
      trigger_breakdown: {} as Record<string, number>,
      expansion_rate: 0,
      conversion_rate: 0,
      events: data || []
    };

    if (data && data.length > 0) {
      const triggered = data.filter(e => e.event_type === 'widget_triggered').length;
      const expanded = data.filter(e => e.event_type === 'widget_expanded').length;
      const converted = data.filter(e => e.event_type === 'order_created').length;

      stats.total_triggers = triggered;
      stats.expansion_rate = triggered > 0 ? Math.round((expanded / triggered) * 100) : 0;
      stats.conversion_rate = triggered > 0 ? Math.round((converted / triggered) * 100) : 0;

      // Count by trigger reason
      data.forEach(event => {
        if (event.trigger_reason) {
          stats.trigger_breakdown[event.trigger_reason] =
            (stats.trigger_breakdown[event.trigger_reason] || 0) + 1;
        }
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in GET /api/analytics/event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
