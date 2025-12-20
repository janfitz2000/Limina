import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { discountCodeService } from '@/lib/discounts'

interface WooCommerceProduct {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  description?: string;
  short_description?: string;
  images?: Array<{ src: string }>;
}

interface WooCommerceOrder {
  id: number;
  status: string;
}

interface SupabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{ data: unknown; error: unknown }>;
      };
    };
    update: (data: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: unknown }>;
    };
    insert: (data: Record<string, unknown>) => {
      select: () => {
        single: () => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    console.log('[WooCommerce Webhook] POST request received');
    
    const body = await req.text();
    const signature = req.headers.get('x-wc-webhook-signature');
    const topic = req.headers.get('x-wc-webhook-topic');
    const source = req.headers.get('x-wc-webhook-source');
    
    console.log('[WooCommerce Webhook] Topic:', topic);
    console.log('[WooCommerce Webhook] Source:', source);
    
    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('base64');
      
      if (signature !== expectedSignature) {
        console.error('[WooCommerce Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    
    // Use service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    switch (topic) {
      case 'product.updated':
        await handleProductUpdate(supabase, data);
        break;
      
      case 'product.created':
        await handleProductCreate(supabase, data);
        break;
      
      case 'product.deleted':
        await handleProductDelete(supabase, data);
        break;
      
      case 'order.updated':
      case 'order.created':
        await handleOrderUpdate(supabase, data);
        break;
      
      default:
        console.log('[WooCommerce Webhook] Unhandled topic:', topic);
    }

    return NextResponse.json({ success: true, topic, processed: true });

  } catch (error) {
    console.error('[WooCommerce Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleProductUpdate(supabase: SupabaseClient, productData: WooCommerceProduct) {
  console.log('[WooCommerce Webhook] Processing product update:', productData.id);
  
  const woocommerceProductId = productData.id.toString();
  const newPrice = parseFloat(productData.price || productData.regular_price || '0');
  
  if (newPrice <= 0) {
    console.log('[WooCommerce Webhook] Invalid price, skipping update');
    return;
  }

  // Find the product in our database
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('woocommerce_product_id', woocommerceProductId)
    .single();

  if (productError || !product) {
    console.log('[WooCommerce Webhook] Product not found in our database, creating new one');
    await handleProductCreate(supabase, productData);
    return;
  }

  const oldPrice = product.current_price;
  
  // Update product in our database
  const { error: updateError } = await supabase
    .from('products')
    .update({
      title: productData.name,
      current_price: newPrice,
      price: newPrice,
      currency: 'USD', // WooCommerce default, could be dynamic
      image_url: productData.images?.[0]?.src || product.image_url,
      updated_at: new Date().toISOString()
    })
    .eq('id', product.id);

  if (updateError) {
    console.error('[WooCommerce Webhook] Failed to update product:', updateError);
    return;
  }

  // Add to price history
  await supabase
    .from('price_history')
    .insert({
      product_id: product.id,
      price: newPrice,
      recorded_at: new Date().toISOString()
    });

  console.log(`[WooCommerce Webhook] Product ${product.id} price updated: ${oldPrice} -> ${newPrice}`);

  // Check for buy orders that can be fulfilled
  if (newPrice < oldPrice) {
    await checkAndFulfillBuyOrders(supabase, product, newPrice);
  }
}

async function handleProductCreate(supabase: SupabaseClient, productData: WooCommerceProduct) {
  console.log('[WooCommerce Webhook] Creating new product:', productData.id);
  
  const woocommerceProductId = productData.id.toString();
  const price = parseFloat(productData.price || productData.regular_price || '0');
  
  // Get the default WooCommerce merchant
  const WOOCOMMERCE_MERCHANT_ID = '123e4567-e89b-12d3-a456-426614174002';
  
  const { data: newProduct, error: createError } = await supabase
    .from('products')
    .insert({
      merchant_id: WOOCOMMERCE_MERCHANT_ID,
      woocommerce_product_id: woocommerceProductId,
      title: productData.name,
      description: productData.description || productData.short_description,
      price: price,
      current_price: price,
      currency: 'USD',
      image_url: productData.images?.[0]?.src,
      source: 'woocommerce',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (createError) {
    console.error('[WooCommerce Webhook] Failed to create product:', createError);
    return;
  }

  // Add initial price history
  await supabase
    .from('price_history')
    .insert({
      product_id: newProduct.id,
      price: price,
      recorded_at: new Date().toISOString()
    });

  console.log('[WooCommerce Webhook] Product created successfully:', newProduct.id);
}

async function handleProductDelete(supabase: SupabaseClient, productData: WooCommerceProduct) {
  console.log('[WooCommerce Webhook] Deleting product:', productData.id);
  
  const woocommerceProductId = productData.id.toString();
  
  // Cancel all active buy orders for this product
  const { error: cancelError } = await supabase
    .from('buy_orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('products.woocommerce_product_id', woocommerceProductId)
    .in('status', ['monitoring', 'pending']);

  if (cancelError) {
    console.error('[WooCommerce Webhook] Failed to cancel buy orders:', cancelError);
  }

  // Soft delete the product (keep for historical data)
  const { error: deleteError } = await supabase
    .from('products')
    .update({
      deleted_at: new Date().toISOString()
    })
    .eq('woocommerce_product_id', woocommerceProductId);

  if (deleteError) {
    console.error('[WooCommerce Webhook] Failed to delete product:', deleteError);
    return;
  }

  console.log('[WooCommerce Webhook] Product deleted successfully');
}

async function handleOrderUpdate(supabase: SupabaseClient, orderData: any) {
  console.log('[WooCommerce Webhook] Processing order update:', orderData.id);

  // Track discount code usage if order is paid/completed
  if (orderData.status === 'processing' || orderData.status === 'completed') {
    await trackWooCommerceDiscountCode(supabase, orderData);
  }

  // Handle order status changes that might affect buy orders
  if (orderData.status === 'cancelled' || orderData.status === 'refunded') {
    const woocommerceOrderId = orderData.id.toString();
    
    // Cancel related buy orders
    const { error: cancelError } = await supabase
      .from('buy_orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .contains('condition_value', { woocommerce_order_id: woocommerceOrderId })
      .in('status', ['monitoring', 'pending']);

    if (cancelError) {
      console.error('[WooCommerce Webhook] Failed to cancel buy orders for order:', cancelError);
    } else {
      console.log('[WooCommerce Webhook] Cancelled buy orders for order:', woocommerceOrderId);
    }
  }
}

/**
 * Track WooCommerce discount code usage
 */
async function trackWooCommerceDiscountCode(supabase: SupabaseClient, orderData: any) {
  try {
    // Check if order has coupon codes applied
    const couponLines = orderData.coupon_lines || [];

    if (couponLines.length === 0) {
      return;
    }

    for (const coupon of couponLines) {
      const code = coupon.code;

      // Check if this is one of our LIMINA codes
      if (!code.startsWith('LIMINA-')) {
        continue;
      }

      // Find the discount code in our database
      const { data: codeRecord, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code)
        .eq('platform', 'woocommerce')
        .single();

      if (error || !codeRecord) {
        console.log(`[WooCommerce Webhook] Discount code ${code} not found in database`);
        continue;
      }

      // Skip if already marked as used
      if (codeRecord.status === 'used') {
        continue;
      }

      // Mark as used
      await discountCodeService.markCodeAsUsed(code, 'woocommerce');

      console.log(`[WooCommerce Webhook] Marked discount code ${code} as used for order ${orderData.id}`);

      // Create notification for merchant
      await supabase
        .from('notifications')
        .insert({
          user_id: codeRecord.merchant_id,
          user_type: 'merchant',
          buy_order_id: codeRecord.buy_order_id,
          title: 'Discount Code Redeemed! 💰',
          message: `Customer used code ${code} - Order #${orderData.number || orderData.id}`,
          type: 'order_fulfilled',
          created_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('[WooCommerce Webhook] Error tracking discount code:', error);
  }
}

async function checkAndFulfillBuyOrders(supabase: SupabaseClient, product: { id: string }, newPrice: number) {
  console.log(`[WooCommerce Webhook] Checking buy orders for product ${product.id} at new price ${newPrice}`);
  
  // Find buy orders that can be fulfilled
  const { data: buyOrders, error: buyOrdersError } = await supabase
    .from('buy_orders')
    .select('*')
    .eq('product_id', product.id)
    .eq('status', 'monitoring')
    .lte('target_price', newPrice);

  if (buyOrdersError) {
    console.error('[WooCommerce Webhook] Failed to fetch buy orders:', buyOrdersError);
    return;
  }

  if (!buyOrders || buyOrders.length === 0) {
    console.log('[WooCommerce Webhook] No buy orders to fulfill');
    return;
  }

  console.log(`[WooCommerce Webhook] Found ${buyOrders.length} buy orders to fulfill`);

  // Fulfill each buy order
  for (const buyOrder of buyOrders) {
    try {
      // Update buy order status
      const { error: updateError } = await supabase
        .from('buy_orders')
        .update({
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString(),
          fulfilled_price: newPrice
        })
        .eq('id', buyOrder.id);

      if (updateError) {
        console.error(`[WooCommerce Webhook] Failed to update buy order ${buyOrder.id}:`, updateError);
        continue;
      }

      // Create fulfillment notification
      await supabase
        .from('notifications')
        .insert({
          user_id: buyOrder.customer_id,
          user_type: 'customer',
          buy_order_id: buyOrder.id,
          title: 'Order Fulfilled! 🎉',
          message: `Your buy order for ${product.title} has been fulfilled at $${newPrice}. You saved $${(buyOrder.current_price - newPrice).toFixed(2)}!`,
          type: 'order_fulfilled',
          created_at: new Date().toISOString()
        });

      // TODO: Send email notification to customer
      // TODO: Create actual WooCommerce order for fulfillment
      // TODO: Process payment through WooCommerce

      console.log(`[WooCommerce Webhook] Buy order ${buyOrder.id} fulfilled successfully`);
      
    } catch (error) {
      console.error(`[WooCommerce Webhook] Error fulfilling buy order ${buyOrder.id}:`, error);
    }
  }
}