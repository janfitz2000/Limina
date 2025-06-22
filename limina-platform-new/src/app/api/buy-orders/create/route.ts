import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
}) : null

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { success: false, error: 'Payment system not configured' },
        { status: 500 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    const { 
      productId, 
      targetPrice, 
      expiryDays, 
      paymentMethodId,
      customerInfo 
    } = await req.json()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        merchants!inner(id, name, stripe_account_id)
      `)
      .eq('id', productId)
      .single()

    if (productError || !product) {
      throw new Error('Product not found')
    }

    // Calculate fees
    const platformFeeRate = 0.025 // 2.5%
    const totalAmount = Math.round(targetPrice * 100) // Convert to cents
    const platformFee = Math.round(totalAmount * platformFeeRate)
    const merchantAmount = totalAmount - platformFee

    // Get or create customer profile
    let customerId = user.id
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!existingCustomer && customerInfo) {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          email: user.email!,
          name: customerInfo.name,
          phone: customerInfo.phone
        })
        .select('id')
        .single()

      if (customerError) throw customerError
      customerId = newCustomer.id
    } else if (existingCustomer) {
      customerId = existingCustomer.id
    }

    // Create payment intent with funds on hold
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'gbp',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      capture_method: 'manual', // Hold funds without capturing
      application_fee_amount: platformFee,
      transfer_data: {
        destination: product.merchants.stripe_account_id,
      },
      metadata: {
        product_id: productId,
        merchant_id: product.merchant_id,
        customer_id: customerId,
        target_price: targetPrice.toString(),
        type: 'conditional_buy_order'
      }
    })

    // Confirm payment intent
    const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id)

    if (confirmedIntent.status !== 'requires_capture') {
      throw new Error('Payment authorization failed')
    }

    // Create buy order
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiryDays)

    const { data: buyOrder, error: orderError } = await supabase
      .from('buy_orders')
      .insert({
        merchant_id: product.merchant_id,
        product_id: productId,
        customer_id: customerId,
        customer_email: user.email!,
        customer_name: customerInfo?.name || user.user_metadata?.name,
        target_price: targetPrice,
        current_price: product.current_price,
        status: 'monitoring',
        payment_status: 'authorized',
        expires_at: expiresAt.toISOString(),
        condition_value: {
          payment_intent_id: confirmedIntent.id,
          escrow_amount: totalAmount / 100,
          platform_fee: platformFee / 100
        }
      })
      .select(`
        *,
        products!inner(id, title, image_url, current_price),
        merchants!inner(id, name)
      `)
      .single()

    if (orderError) throw orderError

    // Create escrow payment record
    await supabase
      .from('escrow_payments')
      .insert({
        buy_order_id: buyOrder.id,
        stripe_payment_intent_id: confirmedIntent.id,
        stripe_payment_method_id: paymentMethodId,
        escrow_amount: totalAmount / 100,
        platform_fee: platformFee / 100,
        merchant_amount: merchantAmount / 100,
        status: 'held'
      })

    // Create notifications
    await Promise.all([
      // Notify customer
      supabase.from('notifications').insert({
        user_id: customerId,
        user_type: 'customer',
        buy_order_id: buyOrder.id,
        title: 'Buy Order Created! 🎯',
        message: `Your buy order for ${product.title} at £${targetPrice} is now monitoring for price changes.`,
        type: 'new_order'
      }),
      // Notify merchant
      supabase.from('notifications').insert({
        user_id: product.merchant_id,
        user_type: 'merchant',
        buy_order_id: buyOrder.id,
        title: 'New Buy Order Received 📈',
        message: `New conditional order for ${product.title} at £${targetPrice} (${Math.round((targetPrice / product.current_price) * 100)}% of current price).`,
        type: 'new_order'
      })
    ])

    return NextResponse.json({
      success: true,
      buyOrder,
      paymentIntent: {
        id: confirmedIntent.id,
        status: confirmedIntent.status,
        client_secret: confirmedIntent.client_secret
      }
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Buy order creation error:', error)
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    )
  }
}
