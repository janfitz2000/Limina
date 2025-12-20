/**
 * API Route: Discount Code Analytics
 * GET /api/discount-codes/analytics?merchantId=xxx&days=30
 *
 * Returns analytics for discount code performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { discountCodeService } from '@/lib/discounts';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const merchantId = searchParams.get('merchantId');
    const days = searchParams.get('days');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    const daysParam = days ? parseInt(days) : 30;

    const analytics = await discountCodeService.getDiscountCodeAnalytics(
      merchantId,
      daysParam
    );

    return NextResponse.json({
      success: true,
      analytics,
      period: `Last ${daysParam} days`,
    });
  } catch (error: any) {
    console.error('Error fetching discount code analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
