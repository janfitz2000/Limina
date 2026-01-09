import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PaymentService } from '@/lib/payments'
import { emailService } from '@/lib/email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CRON_SECRET = process.env.CRON_SECRET

interface BuyOrder {
  id: string
  merchant_id: string
  product_id: string
  customer_id: string
  target_price: number
  current_price: number
  status: string
  expires_at: string
  products: {
    id: string
    shopify_product_id: string | null
    title: string
  }
  stores: {
    id: string
    platform: string
    store_url: string
    credentials: Record<string, string>
  } | null
}

interface PriceCheckResult {
  orderId: string
  productId: string
  previousPrice: number
  newPrice: number
  targetPrice: number
  action: 'updated' | 'fulfilled' | 'error'
  error?: string
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: PriceCheckResult[] = []
    const now = new Date().toISOString()

    const { data: orders, error: ordersError } = await supabase
      .from('buy_orders')
      .select(`
        id,
        merchant_id,
        product_id,
        customer_id,
        target_price,
        current_price,
        status,
        expires_at,
        products!inner (
          id,
          shopify_product_id,
          title
        )
      `)
      .eq('status', 'monitoring')
      .gt('expires_at', now)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No monitoring orders found',
        checked: 0,
        results: []
      })
    }

    const productPrices = new Map<string, number>()
    const productIds = [...new Set(orders.map(o => o.product_id))]

    for (const productId of productIds) {
      const order = orders.find(o => o.product_id === productId)
      if (!order) continue

      const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('merchant_id', order.merchant_id)
        .eq('status', 'connected')
        .single()

      if (!store) {
        console.log(`No connected store for merchant ${order.merchant_id}`)
        continue
      }

      try {
        const price = await fetchProductPrice(
          store.platform,
          store.store_url,
          store.credentials,
          (order.products as { shopify_product_id: string | null }).shopify_product_id
        )
        if (price !== null) {
          productPrices.set(productId, price)
        }
      } catch (err) {
        console.error(`Error fetching price for product ${productId}:`, err)
      }
    }

    for (const order of orders) {
      const newPrice = productPrices.get(order.product_id)

      if (newPrice === undefined) {
        results.push({
          orderId: order.id,
          productId: order.product_id,
          previousPrice: order.current_price,
          newPrice: order.current_price,
          targetPrice: order.target_price,
          action: 'error',
          error: 'Could not fetch current price'
        })
        continue
      }

      if (newPrice !== order.current_price) {
        await supabase
          .from('buy_orders')
          .update({ current_price: newPrice })
          .eq('id', order.id)

        await supabase
          .from('price_history')
          .insert({
            product_id: order.product_id,
            price: newPrice
          })

        await supabase
          .from('products')
          .update({ current_price: newPrice })
          .eq('id', order.product_id)
      }

      if (newPrice <= order.target_price) {
        try {
          const paymentResult = await PaymentService.executeBuyOrderPayment(order.id)

          if (paymentResult.success) {
            results.push({
              orderId: order.id,
              productId: order.product_id,
              previousPrice: order.current_price,
              newPrice,
              targetPrice: order.target_price,
              action: 'fulfilled'
            })

            await createFulfillmentNotifications(order, newPrice)
          } else {
            results.push({
              orderId: order.id,
              productId: order.product_id,
              previousPrice: order.current_price,
              newPrice,
              targetPrice: order.target_price,
              action: 'error',
              error: 'Payment capture failed'
            })
          }
        } catch (err) {
          console.error(`Error fulfilling order ${order.id}:`, err)
          results.push({
            orderId: order.id,
            productId: order.product_id,
            previousPrice: order.current_price,
            newPrice,
            targetPrice: order.target_price,
            action: 'error',
            error: err instanceof Error ? err.message : 'Fulfillment failed'
          })
        }
      } else {
        results.push({
          orderId: order.id,
          productId: order.product_id,
          previousPrice: order.current_price,
          newPrice,
          targetPrice: order.target_price,
          action: 'updated'
        })
      }
    }

    const fulfilled = results.filter(r => r.action === 'fulfilled').length
    const updated = results.filter(r => r.action === 'updated').length
    const errors = results.filter(r => r.action === 'error').length

    return NextResponse.json({
      success: true,
      checked: orders.length,
      fulfilled,
      updated,
      errors,
      results
    })

  } catch (error) {
    console.error('Price check cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function fetchProductPrice(
  platform: string,
  storeUrl: string,
  credentials: Record<string, string>,
  externalProductId: string | null
): Promise<number | null> {
  if (!externalProductId) return null

  try {
    if (platform === 'shopify') {
      const shopDomain = credentials.shop_domain || storeUrl.replace('https://', '').replace('http://', '')
      const accessToken = credentials.access_token

      if (!accessToken) return null

      const productId = externalProductId.replace('gid://shopify/Product/', '')
      const response = await fetch(
        `https://${shopDomain}/admin/api/2024-01/products/${productId}.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) return null

      const data = await response.json()
      const price = parseFloat(data.product?.variants?.[0]?.price || '0')
      return price

    } else if (platform === 'woocommerce') {
      const consumerKey = credentials.consumer_key
      const consumerSecret = credentials.consumer_secret

      if (!consumerKey || !consumerSecret) return null

      const productId = externalProductId.replace('wc_', '')
      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

      const response = await fetch(
        `${storeUrl}/wp-json/wc/v3/products/${productId}`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) return null

      const data = await response.json()
      const price = parseFloat(data.price || '0')
      return price
    }

    return null
  } catch (error) {
    console.error(`Error fetching price from ${platform}:`, error)
    return null
  }
}

async function createFulfillmentNotifications(
  order: { id: string; customer_id: string; merchant_id: string; target_price: number; products: { title: string } | { title: string }[] },
  finalPrice: number
) {
  const productTitle = Array.isArray(order.products) ? order.products[0]?.title : order.products?.title

  // Create database notifications
  await supabase.from('notifications').insert([
    {
      user_id: order.customer_id,
      user_type: 'customer',
      buy_order_id: order.id,
      title: 'Price Target Reached!',
      message: `Great news! ${productTitle} dropped to your target price of £${order.target_price}. Your order has been automatically fulfilled.`,
      type: 'order_fulfilled'
    },
    {
      user_id: order.merchant_id,
      user_type: 'merchant',
      buy_order_id: order.id,
      title: 'Order Auto-Fulfilled',
      message: `Buy order for ${productTitle} has been fulfilled at £${finalPrice}. Payment has been captured.`,
      type: 'order_fulfilled'
    }
  ])

  // Send email notifications
  try {
    // Fetch customer email
    const { data: customer } = await supabase
      .from('customers')
      .select('email, name')
      .eq('id', order.customer_id)
      .single()

    // Fetch merchant email
    const { data: merchant } = await supabase
      .from('merchants')
      .select('email, business_name')
      .eq('id', order.merchant_id)
      .single()

    // Send customer email
    if (customer?.email) {
      await emailService.sendOrderFulfilledEmail({
        to: customer.email,
        customerName: customer.name || undefined,
        productTitle: productTitle || 'Product',
        targetPrice: order.target_price,
        currency: 'GBP'
      })
    }

    // Send merchant email
    if (merchant?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://limina.io'
      await emailService.sendMerchantOrderFulfilledEmail({
        to: merchant.email,
        merchantName: merchant.business_name || 'Merchant',
        productTitle: productTitle || 'Product',
        customerEmail: customer?.email || 'customer',
        targetPrice: order.target_price,
        currency: 'GBP',
        dashboardUrl: `${appUrl}/dashboard/orders`
      })
    }
  } catch (emailError) {
    console.error('Error sending fulfillment emails:', emailError)
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
