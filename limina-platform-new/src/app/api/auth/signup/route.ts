// src/app/api/auth/signup/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { email, password, role, profile } = await req.json()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, ...profile }
      }
    })

    if (authError) throw authError

    if (authData.user) {
      // Create profile based on role
      if (role === 'merchant') {
        const { error: profileError } = await supabase
          .from('merchants')
          .insert({
            user_id: authData.user.id,
            name: profile.name,
            email: email,
            company_name: profile.companyName,
            website: profile.website,
            subscription_tier: 'starter',
            subscription_status: 'trial'
          })

        if (profileError) throw profileError
      } else if (role === 'customer') {
        const { error: profileError } = await supabase
          .from('customers')
          .insert({
            user_id: authData.user.id,
            email: email,
            name: profile.name,
            phone: profile.phone,
            preferences: {
              notifications: true,
              email_alerts: true,
              sms_alerts: false
            }
          })

        if (profileError) throw profileError
      }
    }

    return NextResponse.json({ 
      success: true, 
      user: authData.user,
      message: 'Account created successfully'
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    )
  }
}

// src/app/api/buy-orders/create/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function POST(req: NextRequest) {
  try {
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

  } catch (error: any) {
    console.error('Buy order creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// src/app/api/products/update-price/route.ts
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
    const fulfillmentResults = []
    for (const order of fulfillableOrders || []) {
      try {
        // Capture payment
        const capturedIntent = await stripe.paymentIntents.capture(
          order.escrow_payments[0].stripe_payment_intent_id
        )

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

  } catch (error: any) {
    console.error('Price update error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// src/app/api/stripe/connect/route.ts
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) throw new Error('Authentication required')

    // Get merchant record
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (merchantError || !merchant) throw new Error('Merchant profile not found')

    let accountId = merchant.stripe_account_id

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: merchant.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          merchant_id: merchant.id,
          limina_user_id: user.id
        }
      })

      accountId = account.id

      // Save account ID
      await supabase
        .from('merchants')
        .update({ stripe_account_id: accountId })
        .eq('id', merchant.id)
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      success: true,
      accountId,
      onboardingUrl: accountLink.url
    })

  } catch (error: any) {
    console.error('Stripe Connect error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// src/app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update buy order if this was a conditional purchase
        if (paymentIntent.metadata.type === 'conditional_buy_order') {
          await supabase
            .from('buy_orders')
            .update({ payment_status: 'captured' })
            .eq('id', paymentIntent.metadata.buy_order_id)
        }
        break

      case 'account.updated':
        const account = event.data.object as Stripe.Account
        
        // Update merchant onboarding status
        if (account.charges_enabled && account.payouts_enabled) {
          await supabase
            .from('merchants')
            .update({ stripe_onboarding_complete: true })
            .eq('stripe_account_id', account.id)
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// src/app/api/analytics/merchant/[merchantId]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) throw new Error('Authentication required')

    // Verify merchant ownership
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', params.merchantId)
      .eq('user_id', user.id)
      .single()

    if (merchantError || !merchant) throw new Error('Unauthorized')

    // Get comprehensive analytics
    const [
      { data: orders },
      { data: products },
      { data: payments },
      { data: recentActivity }
    ] = await Promise.all([
      // Buy orders analytics
      supabase
        .from('buy_orders')
        .select(`
          *,
          products!inner(title, current_price, price)
        `)
        .eq('merchant_id', params.merchantId),
      
      // Products with demand data
      supabase
        .from('products')
        .select(`
          *,
          buy_orders(count)
        `)
        .eq('merchant_id', params.merchantId),
      
      // Payment analytics
      supabase
        .from('escrow_payments')
        .select(`
          *,
          buy_orders!inner(merchant_id)
        `)
        .eq('buy_orders.merchant_id', params.merchantId),
      
      // Recent activity
      supabase
        .from('buy_orders')
        .select(`
          id,
          status,
          target_price,
          created_at,
          fulfilled_at,
          products!inner(title),
          customers!inner(name, email)
        `)
        .eq('merchant_id', params.merchantId)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    // Calculate analytics
    const analytics = {
      overview: {
        totalOrders: orders?.length || 0,
        activeOrders: orders?.filter(o => o.status === 'monitoring').length || 0,
        fulfilledOrders: orders?.filter(o => o.status === 'fulfilled').length || 0,
        totalRevenue: payments?.filter(p => p.status === 'released')
          .reduce((sum, p) => sum + p.merchant_amount, 0) || 0,
        averageOrderValue: orders?.length ? 
          orders.reduce((sum, o) => sum + o.target_price, 0) / orders.length : 0,
        conversionRate: orders?.length ? 
          (orders.filter(o => o.status === 'fulfilled').length / orders.length) * 100 : 0
      },
      
      demandByPrice: products?.map(product => {
        const productOrders = orders?.filter(o => o.product_id === product.id) || []
        const demandByPricePoint = {}
        
        productOrders.forEach(order => {
          const pricePoint = Math.round(order.target_price / 50) * 50 // Round to nearest £50
          demandByPricePoint[pricePoint] = (demandByPricePoint[pricePoint] || 0) + 1
        })
        
        return {
          productId: product.id,
          title: product.title,
          currentPrice: product.current_price,
          demandByPrice: Object.entries(demandByPricePoint).map(([price, count]) => ({
            price: parseInt(price),
            orders: count,
            revenue: parseInt(price) * count
          }))
        }
      }),
      
      recentActivity,
      
      trends: {
        daily: [], // Would calculate from historical data
        weekly: [],
        monthly: []
      }
    }

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}