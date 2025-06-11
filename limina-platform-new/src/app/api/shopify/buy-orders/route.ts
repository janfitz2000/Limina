import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('[Buy Orders API] POST request received');
    
    // Use service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const requestBody = await req.json();
    console.log('[Buy Orders API] Request body:', requestBody);
    
    const {
      shopify_product_id,
      customer_email,
      target_price,
      current_price,
      currency,
      expires_in_days = 30,
      customer_name
    } = requestBody

    // Validate required fields
    if (!shopify_product_id || !customer_email || !target_price) {
      return NextResponse.json(
        { error: 'Missing required fields: shopify_product_id, customer_email, target_price' },
        { status: 400 }
      )
    }

    // Find the product in our database
    // Handle both product IDs and variant IDs
    const cleanProductId = shopify_product_id.toString().replace('gid://shopify/Product/', '').replace('item-', '').split('-')[0];
    console.log('Looking for product with ID:', cleanProductId);
    
    // Try to find by shopify_product_id
    let { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('shopify_product_id', cleanProductId)
      .single()

    // If not found and looks like a handle, try title matching
    if ((productError || !product) && /[a-zA-Z-]/.test(shopify_product_id)) {
      console.log('Numeric ID not found, trying to find by handle:', shopify_product_id);
      
      // Convert handle to title search: "the-collection-snowboard-liquid" -> "collection snowboard liquid"
      const titleSearch = shopify_product_id.toString()
        .replace(/^the-/, '') // Remove "the-" prefix
        .replace(/-/g, ' ') // Replace hyphens with spaces
        .toLowerCase();
        
      const { data: productByHandle, error: handleError } = await supabase
        .from('products')
        .select('*')
        .ilike('title', `%${titleSearch}%`)
        .single()
      
      if (!handleError && productByHandle) {
        console.log('Found product by handle/title match:', productByHandle);
        product = productByHandle;
        productError = null;
      }
    }

    if (productError || !product) {
      console.log('Product not found, attempting to create temporary product:', productError);
      
      // Use consistent merchant ID that matches dashboard
      const MERCHANT_ID = '123e4567-e89b-12d3-a456-426614174000'
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', MERCHANT_ID)
        .single()
      
      if (merchantError || !merchant) {
        return NextResponse.json(
          { error: 'No merchant found in system' },
          { status: 404 }
        )
      }
      
      // Create a temporary product record for this buy order
      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert({
          merchant_id: merchant.id,
          shopify_product_id: cleanProductId,
          title: `Product ${cleanProductId}`, // Will be updated when synced
          price: current_price, // Add the required price field
          current_price: current_price,
          currency: currency || 'GBP'
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Failed to create temporary product:', createError);
        return NextResponse.json(
          { error: 'Product not found in our system and could not create temporary record' },
          { status: 404 }
        )
      }
      
      console.log('Created temporary product:', newProduct);
      // Use the newly created product
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
        currency: currency || 'GBP',
        status: 'monitoring',
        condition_type: 'price',
        condition_value: { type: 'price_drop', threshold: target_price },
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (orderError) {
      console.error('Buy order creation error:', orderError)
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

    // Send confirmation email/notification (implement later)
    // await sendOrderConfirmation(customer_email, buyOrder)

    return NextResponse.json({
      success: true,
      message: 'Buy order created successfully',
      buy_order: buyOrder,
      expires_at: expiresAt.toISOString()
    })

  } catch (error) {
    console.error('Shopify buy order API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check existing buy orders for a customer
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customer_email = searchParams.get('customer_email')
    const shopify_product_id = searchParams.get('shopify_product_id')

    if (!customer_email) {
      return NextResponse.json(
        { error: 'customer_email parameter required' },
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
          shopify_product_id,
          image_url
        )
      `)
      .eq('customer_email', customer_email)
      .in('status', ['monitoring', 'pending'])
      .order('created_at', { ascending: false })

    if (shopify_product_id) {
      // Filter by specific product
      const cleanProductId = shopify_product_id.replace('gid://shopify/Product/', '')
      query = query.eq('products.shopify_product_id', cleanProductId)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching buy orders:', error)
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
    console.error('GET buy orders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}