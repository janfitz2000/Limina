import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Use service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { productId, newPrice } = await req.json()

    if (!productId || typeof newPrice !== 'number' || newPrice <= 0) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    let shopifyUpdated = false

    // Update product price in Shopify if it has a shopify_product_id
    if (product.shopify_product_id) {
      try {
        const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN!
        const accessToken = process.env.SHOPIFY_ACCESS_TOKEN!

        // First get the product to find the variant ID
        const productResponse = await fetch(
          `https://${shopifyDomain}/admin/api/2023-10/products/${product.shopify_product_id}.json`,
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          }
        )

        if (productResponse.ok) {
          const productData = await productResponse.json()
          const variantId = productData.product.variants[0]?.id

          if (variantId) {
            // Update the variant price
            const updateResponse = await fetch(
              `https://${shopifyDomain}/admin/api/2023-10/variants/${variantId}.json`,
              {
                method: 'PUT',
                headers: {
                  'X-Shopify-Access-Token': accessToken,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  variant: {
                    id: variantId,
                    price: newPrice.toString()
                  }
                })
              }
            )

            shopifyUpdated = updateResponse.ok
            if (!shopifyUpdated) {
              console.error('Failed to update Shopify price:', await updateResponse.text())
            }
          }
        }
      } catch (error) {
        console.error('Shopify update error:', error)
      }
    }

    // Update product price in our database
    const { error: updateError } = await supabase
      .from('products')
      .update({ current_price: newPrice })
      .eq('id', productId)

    if (updateError) throw updateError

    // Add to price history
    const { error: historyError } = await supabase
      .from('price_history')
      .insert({
        product_id: productId,
        price: newPrice
      })

    if (historyError) {
      console.error('Failed to record price history:', historyError)
    }

    // Check for buy orders that can be fulfilled
    const { data: fulfillableOrders } = await supabase
      .from('buy_orders')
      .select(`
        *,
        escrow_payments!inner(*)
      `)
      .eq('product_id', productId)
      .eq('status', 'monitoring')
      .lte('target_price', newPrice)

    // Initialize fulfillment results array
    const fulfillmentResults: Array<{
      orderId: string
      success: boolean
      error?: string
    }> = []

    // Fulfill eligible orders
    for (const order of fulfillableOrders || []) {
      try {
        // Simulate successful payment capture for now
        // TODO: Implement actual Stripe payment capture
        const capturedIntent = { status: 'succeeded' }

        if (capturedIntent.status === 'succeeded') {
          // Update order status
          await supabase
            .from('buy_orders')
            .update({
              status: 'fulfilled',
              payment_status: 'captured',
              fulfilled_at: new Date().toISOString()
            })
            .eq('id', order.id)

          // Update escrow payment status
          await supabase
            .from('escrow_payments')
            .update({
              status: 'released',
              released_at: new Date().toISOString()
            })
            .eq('buy_order_id', order.id)

          fulfillmentResults.push({
            orderId: order.id,
            success: true
          })
        }
      } catch (error) {
        console.error('Order fulfillment failed:', error)
        fulfillmentResults.push({
          orderId: order.id,
          success: false,
          error: 'Failed to fulfill order'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Price updated successfully',
      shopifyUpdated,
      fulfillment: {
        ordersProcessed: fulfillableOrders?.length || 0,
        results: fulfillmentResults
      }
    })
  } catch (error) {
    console.error('Price update failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
