/**
 * API Route: Batch Generate Discount Codes
 * POST /api/discount-codes/batch
 *
 * Generates discount codes for multiple buy orders and sends emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { discountCodeService } from '@/lib/discounts';
import { emailService } from '@/lib/email';
import { supabaseAdmin } from '@/lib/supabase';

interface BatchResult {
  buyOrderId: string;
  success: boolean;
  discountCode?: any;
  emailSent?: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      buyOrderIds,
      productId,
      merchantId,
      sendEmails = true
    } = body;

    const supabase = supabaseAdmin;

    // Get buy orders either from IDs or by filtering
    let buyOrders: any[] = [];

    if (buyOrderIds && buyOrderIds.length > 0) {
      // Get specific orders by ID
      const { data, error } = await supabase
        .from('buy_orders')
        .select(`
          *,
          products (*),
          customers (*),
          merchants (*),
          stores (*)
        `)
        .in('id', buyOrderIds);

      if (error) throw error;
      buyOrders = data || [];
    } else if (productId && merchantId) {
      // Get all monitoring orders for this product
      const { data, error } = await supabase
        .from('buy_orders')
        .select(`
          *,
          products (*),
          customers (*),
          merchants (*),
          stores (*)
        `)
        .eq('product_id', productId)
        .eq('merchant_id', merchantId)
        .eq('status', 'monitoring');

      if (error) throw error;
      buyOrders = data || [];
    } else {
      return NextResponse.json(
        { error: 'Either buyOrderIds or (productId + merchantId) required' },
        { status: 400 }
      );
    }

    if (buyOrders.length === 0) {
      return NextResponse.json(
        { error: 'No buy orders found' },
        { status: 404 }
      );
    }

    const results: BatchResult[] = [];

    // Process each order
    for (const buyOrder of buyOrders) {
      try {
        // Check if code already exists
        const { data: existingCode } = await supabase
          .from('discount_codes')
          .select('*')
          .eq('buy_order_id', buyOrder.id)
          .single();

        if (existingCode) {
          results.push({
            buyOrderId: buyOrder.id,
            success: false,
            error: 'Code already exists',
          });
          continue;
        }

        // Generate discount code
        const discountCode = await discountCodeService.createDiscountCode({
          buyOrderId: buyOrder.id,
          merchantId: buyOrder.merchant_id,
          customerId: buyOrder.customer_id,
          productId: buyOrder.product_id,
          storeId: buyOrder.store_id,
          targetPrice: buyOrder.target_price,
          originalPrice: buyOrder.products.current_price,
          currency: buyOrder.currency,
          expiresInDays: 30,
        });

        let emailSent = false;

        // Send email if requested
        if (sendEmails && discountCode.status === 'generated') {
          const product = buyOrder.products;
          const customer = buyOrder.customers;
          const store = buyOrder.stores;

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
            discountedPrice: buyOrder.target_price,
            currency: buyOrder.currency,
            expiresAt: discountCode.expiresAt,
          });

          if (emailResult.success) {
            await discountCodeService.markCodeAsSent(discountCode.id);
            emailSent = true;
          }
        }

        results.push({
          buyOrderId: buyOrder.id,
          success: true,
          discountCode,
          emailSent,
        });
      } catch (error: any) {
        results.push({
          buyOrderId: buyOrder.id,
          success: false,
          error: error.message,
        });
      }
    }

    // Send merchant notification
    if (sendEmails && results.filter(r => r.success).length > 0) {
      try {
        const merchant = buyOrders[0].merchants;
        const product = buyOrders[0].products;
        const successCount = results.filter(r => r.emailSent).length;

        await emailService.sendMerchantNotificationEmail({
          to: merchant.email,
          merchantName: merchant.name,
          productTitle: product.title,
          customersNotified: successCount,
          discountPercentage: results[0].discountCode?.discountValue || 0,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        });
      } catch (error) {
        console.error('Failed to send merchant notification:', error);
      }
    }

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      emailsSent: results.filter(r => r.emailSent).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      results,
    });
  } catch (error: any) {
    console.error('Error in batch discount code generation:', error);
    return NextResponse.json(
      { error: error.message || 'Batch operation failed' },
      { status: 500 }
    );
  }
}
