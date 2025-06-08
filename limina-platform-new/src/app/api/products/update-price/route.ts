import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { productId, newPrice } = await req.json()

    // Get current user and verify merchant ownership
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Authentication required')

    // Verify merchant owns this product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        merchants!inner(user_id)
      `)
      .eq('id', productId)
      .single()

    if (productError || !product) throw new Error('Product not found')
    if (product.merchants.user_id !== user.id) throw new Error('Unauthorized')

    // Update product price
    const { error: updateError } = await supabase
      .from('products')
      .update({ current_price: newPrice })
      .eq('id', productId)

    if (updateError) throw updateError

    // Add to price history
    await supabase
      .from('price_history')
      .insert({
        product_id: productId,
        price: newPrice
      })

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

    // Fulfill eligible orders
    const fulfillmentResults: any[] = []
    for (const order of fulfillableOrders || []) {
      try {
        // Capture payment
        // NOTE: You must import and initialize Stripe here if you want to use it
        // const capturedIntent = await stripe.paymentIntents.capture(
        //   order.escrow_payments[0].stripe_payment_intent_id
        // )
        // For now, just simulate success:
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

          // Update escrow payment
          await supabase
            .from('escrow_payments')
            .update({
              status: 'released',
              released_at: new Date().toISOString()
            })
            .eq('buy_order_id', order.id)

          // Send fulfillment notifications
          await Promise.all([
            supabase.from('notifications').insert({
              user_id: order.customer_id,
              user_type: 'customer',
              buy_order_id: order.id,
              title: 'Order Fulfilled! 🎉',
              message: `Your buy order has been completed! Payment of £${order.target_price} processed successfully.`,
              type: 'order_fulfilled'
            }),
            supabase.from('notifications').insert({
              user_id: product.merchants.user_id,
              user_type: 'merchant',
              buy_order_id: order.id,
              title: 'Payment Received 💰',
              message: `Buy order payment of £${order.target_price} has been processed.`,
              type: 'order_fulfilled'
            })
          ])

          fulfillmentResults.push({ orderId: order.id, status: 'fulfilled' })
        }
      } catch (fulfillmentError) {
        console.error('Order fulfillment error:', fulfillmentError)
        fulfillmentResults.push({ orderId: order.id, status: 'error', error: fulfillmentError })
      }
    }

    return NextResponse.json({
      success: true,
      newPrice,
      ordersChecked: fulfillableOrders?.length || 0,
      fulfillmentResults
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Price update error:', error)
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    )
  }
}
