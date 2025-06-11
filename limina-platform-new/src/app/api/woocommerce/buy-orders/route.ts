import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('[WooCommerce Buy Orders API] POST request received');
    
    // Use service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const requestBody = await req.json();
    console.log('[WooCommerce Buy Orders API] Request body:', requestBody);
    
    const {
      woocommerce_product_id,
      woocommerce_order_id,
      customer_email,
      customer_name,
      target_price,
      current_price,
      currency,
      quantity = 1,
      expires_in_days = 30
    } = requestBody

    // Validate required fields
    if (!woocommerce_product_id || !customer_email || !target_price) {
      return NextResponse.json(
        { error: 'Missing required fields: woocommerce_product_id, customer_email, target_price' },
        { status: 400 }
      )
    }

    // Find or create the product in our database
    console.log('Looking for WooCommerce product with ID:', woocommerce_product_id);
    
    let { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('woocommerce_product_id', woocommerce_product_id)
      .single()

    if (productError || !product) {
      console.log('WooCommerce product not found, attempting to create temporary product:', productError);
      
      // Use consistent merchant ID for WooCommerce integrations
      const WOOCOMMERCE_MERCHANT_ID = '123e4567-e89b-12d3-a456-426614174002' // HomeGoods Plus from seed data
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', WOOCOMMERCE_MERCHANT_ID)
        .single()
      
      if (merchantError || !merchant) {
        return NextResponse.json(
          { error: 'No WooCommerce merchant found in system' },
          { status: 404 }
        )
      }
      
      // Create a temporary product record for this buy order
      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert({
          merchant_id: merchant.id,
          woocommerce_product_id: woocommerce_product_id,
          title: `WooCommerce Product ${woocommerce_product_id}`, // Will be updated when synced
          price: current_price,
          current_price: current_price,
          currency: currency || 'USD',
          source: 'woocommerce'
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Failed to create temporary WooCommerce product:', createError);
        return NextResponse.json(
          { error: 'Product not found in our system and could not create temporary record' },
          { status: 404 }
        )
      }
      
      console.log('Created temporary WooCommerce product:', newProduct);
      product = newProduct;
    }

    // Validate that target price is below current price
    const currentProductPrice = current_price || product.current_price
    if (target_price >= currentProductPrice) {
      return NextResponse.json(
        { error: 'Target price must be below current price' },
        { status: 400 }
      )
    }

    // Get or create customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customer_email)
      .single()

    let customer = existingCustomer
    if (!customer) {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          email: customer_email,
          name: customer_name || null
        })
        .select()
        .single()

      if (customerError) {
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        )
      }
      customer = newCustomer
    }

    // Create buy order
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expires_in_days)

    const { data: buyOrder, error: orderError } = await supabase
      .from('buy_orders')
      .insert({
        merchant_id: product.merchant_id,
        product_id: product.id,
        customer_id: customer.id,
        customer_email: customer_email,
        customer_name: customer_name || customer.name,
        target_price: target_price,
        current_price: currentProductPrice,
        currency: currency || 'USD',
        quantity: quantity,
        status: 'monitoring',
        condition_type: 'price',
        condition_value: { 
          type: 'price_drop', 
          threshold: target_price,
          woocommerce_order_id: woocommerce_order_id
        },
        expires_at: expiresAt.toISOString(),
        source: 'woocommerce'
      })
      .select()
      .single()

    if (orderError) {
      console.error('WooCommerce buy order creation error:', orderError)
      return NextResponse.json(
        { error: 'Failed to create buy order' },
        { status: 500 }
      )
    }

    // Check if the target price is already met (edge case)
    if (target_price >= currentProductPrice) {
      // Immediately fulfill the order
      await supabase
        .from('buy_orders')
        .update({
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString()
        })
        .eq('id', buyOrder.id)

      return NextResponse.json({
        success: true,
        message: 'Order fulfilled immediately!',
        buy_order: { ...buyOrder, status: 'fulfilled' },
        immediately_fulfilled: true
      })
    }

    return NextResponse.json({
      success: true,
      message: 'WooCommerce buy order created successfully',
      buy_order: buyOrder,
      expires_at: expiresAt.toISOString()
    })

  } catch (error) {
    console.error('WooCommerce buy order API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check existing buy orders for a customer (WooCommerce specific)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customer_email = searchParams.get('customer_email')
    const woocommerce_product_id = searchParams.get('woocommerce_product_id')
    const woocommerce_order_id = searchParams.get('woocommerce_order_id')

    if (!customer_email && !woocommerce_order_id) {
      return NextResponse.json(
        { error: 'customer_email or woocommerce_order_id parameter required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabase
      .from('buy_orders')
      .select(`
        *,
        products (
          id,
          title,
          current_price,
          woocommerce_product_id,
          image_url
        )
      `)
      .eq('source', 'woocommerce')
      .in('status', ['monitoring', 'pending'])
      .order('created_at', { ascending: false })

    if (customer_email) {
      query = query.eq('customer_email', customer_email)
    }

    if (woocommerce_order_id) {
      // Filter by WooCommerce order ID in condition_value
      query = query.contains('condition_value', { woocommerce_order_id: woocommerce_order_id })
    }

    if (woocommerce_product_id) {
      // Filter by specific WooCommerce product
      query = query.eq('products.woocommerce_product_id', woocommerce_product_id)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching WooCommerce buy orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch buy orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      buy_orders: orders || []
    })

  } catch (error) {
    console.error('GET WooCommerce buy orders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}