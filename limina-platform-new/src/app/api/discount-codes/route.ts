/**
 * API Route: Get Discount Codes
 * GET /api/discount-codes?merchantId=xxx&status=xxx&productId=xxx
 *
 * Retrieves discount codes for a merchant with optional filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { discountCodeService } from '@/lib/discounts';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const merchantId = searchParams.get('merchantId');
    const status = searchParams.get('status');
    const productId = searchParams.get('productId');
    const limit = searchParams.get('limit');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    const filters: any = {};
    if (status) filters.status = status;
    if (productId) filters.productId = productId;
    if (limit) filters.limit = parseInt(limit);

    const codes = await discountCodeService.getMerchantDiscountCodes(
      merchantId,
      filters
    );

    return NextResponse.json({
      success: true,
      codes,
      count: codes.length,
    });
  } catch (error: any) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch discount codes' },
      { status: 500 }
    );
  }
}
