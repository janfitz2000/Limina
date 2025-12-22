/**
 * API Route: Generate Discount Code
 * POST /api/discount-codes/generate
 *
 * Generates a discount code for a buy order and optionally sends it via email
 */

import { NextRequest, NextResponse } from 'next/server';
import { discountCodeService } from '@/lib/discounts';
import { emailService } from '@/lib/email';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buyOrderId, sendEmail = true, offerPrice } = body;

    if (!buyOrderId) {
      return NextResponse.json(
        { error: 'buyOrderId is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // Get buy order details with related data
    const { data: buyOrder, error: orderError } = await supabase
      .from('buy_orders')
      .select(`
        *,
        products (*),
        customers (*),
        merchants (*),
        stores (*)
      `)
      .eq('id', buyOrderId)
      .single();

    if (orderError || !buyOrder) {
      return NextResponse.json(
        { error: 'Buy order not found' },
        { status: 404 }
      );
    }

    // Check if code already exists for this order
    const { data: existingCode } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('buy_order_id', buyOrderId)
      .single();

    if (existingCode) {
      return NextResponse.json(
        {
          error: 'Discount code already exists for this order',
          code: existingCode
        },
        { status: 409 }
      );
    }

    // Use merchant's offer price if provided, otherwise use customer's target price
    const finalOfferPrice = offerPrice !== undefined ? Number(offerPrice) : buyOrder.target_price;

    // Generate the discount code
    const discountCode = await discountCodeService.createDiscountCode({
      buyOrderId: buyOrder.id,
      merchantId: buyOrder.merchant_id,
      customerId: buyOrder.customer_id,
      productId: buyOrder.product_id,
      storeId: buyOrder.store_id,
      targetPrice: finalOfferPrice,
      originalPrice: buyOrder.products.current_price,
      currency: buyOrder.currency,
      expiresInDays: 30,
    });

    // Send email if requested and code was successfully generated
    if (sendEmail && discountCode.status === 'generated') {
      try {
        const product = buyOrder.products;
        const customer = buyOrder.customers;
        const store = buyOrder.stores;

        // Construct product URL
        const productUrl = store.platform === 'shopify'
          ? `https://${store.store_url}/products/${product.shopify_product_id}`
          : `${store.store_url}/product/${product.shopify_product_id}`;

        const emailResult = await emailService.sendDiscountCodeEmail({
          to: customer.email,
          customerName: customer.name,
          productTitle: product.title,
          productImage: product.image_url,
          productUrl,
          discountCode: discountCode.code,
          discountPercentage: discountCode.discountValue,
          originalPrice: buyOrder.products.current_price,
          discountedPrice: finalOfferPrice,
          currency: buyOrder.currency,
          expiresAt: discountCode.expiresAt,
        });

        if (emailResult.success) {
          // Mark code as sent
          await discountCodeService.markCodeAsSent(discountCode.id);
        } else {
          console.error('Failed to send email:', emailResult.error);
        }

        return NextResponse.json({
          success: true,
          discountCode,
          emailSent: emailResult.success,
          emailError: emailResult.error,
        });
      } catch (emailError: any) {
        console.error('Error sending email:', emailError);
        return NextResponse.json({
          success: true,
          discountCode,
          emailSent: false,
          emailError: emailError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      discountCode,
      emailSent: false,
    });
  } catch (error: any) {
    console.error('Error generating discount code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate discount code' },
      { status: 500 }
    );
  }
}
