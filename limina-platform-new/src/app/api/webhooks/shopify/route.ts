// src/app/api/webhooks/shopify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { IntegrationManager } from '@/lib/integrations'
import { discountCodeService } from '@/lib/discounts'
import { supabaseAdmin } from '@/lib/supabase'

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET

function verifyShopifyWebhook(body: string, signature: string): boolean {
  if (!SHOPIFY_WEBHOOK_SECRET) {
    console.warn('SHOPIFY_WEBHOOK_SECRET not set, skipping verification')
    return true // For development
  }

  const computedSignature = crypto
    .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64')

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'base64'),
    Buffer.from(computedSignature, 'base64')
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-shopify-hmac-sha256')
    const topic = request.headers.get('x-shopify-topic')
    const domain = request.headers.get('x-shopify-shop-domain')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    if (!verifyShopifyWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body)

    // Add topic and domain to payload for processing
    const enrichedPayload = {
      ...payload,
      topic,
      shop_domain: domain
    }

    // Handle discount code tracking for orders
    if (topic === 'orders/paid' || topic === 'orders/create') {
      await handleDiscountCodeTracking(payload)
    }

    // Process webhook using IntegrationManager
    const result = await IntegrationManager.handleWebhook('shopify', enrichedPayload)

    if (!result.success) {
      console.error('Webhook processing failed:', result.error)
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }

    // Log successful webhook processing
    console.log(`Shopify webhook processed: ${topic} from ${domain}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Shopify webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Track discount code usage from Shopify orders
 */
async function handleDiscountCodeTracking(orderPayload: any) {
  try {
    // Check if order has discount codes applied
    const discountCodes = orderPayload.discount_codes || []

    if (discountCodes.length === 0) {
      return
    }

    const supabase = supabaseAdmin

    for (const discountCode of discountCodes) {
      const code = discountCode.code

      // Check if this is one of our LIMINA codes
      if (!code.startsWith('LIMINA-')) {
        continue
      }

      // Find the discount code in our database
      const { data: codeRecord, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code)
        .eq('platform', 'shopify')
        .single()

      if (error || !codeRecord) {
        console.log(`Discount code ${code} not found in database`)
        continue
      }

      // Skip if already marked as used
      if (codeRecord.status === 'used') {
        continue
      }

      // Mark as used
      await discountCodeService.markCodeAsUsed(code, 'shopify')

      console.log(`Marked discount code ${code} as used for order ${orderPayload.id}`)

      // Create notification for merchant
      await supabase
        .from('notifications')
        .insert({
          user_id: codeRecord.merchant_id,
          user_type: 'merchant',
          buy_order_id: codeRecord.buy_order_id,
          title: 'Discount Code Redeemed! 💰',
          message: `Customer used code ${code} - Order #${orderPayload.order_number}`,
          type: 'order_fulfilled'
        })
    }
  } catch (error) {
    console.error('Error tracking discount code:', error)
  }
}

// Handle webhook verification for Shopify
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('hub.challenge')
  
  // Basic verification - you might want to check verify_token against a stored value
  if (challenge) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'No challenge provided' }, { status: 400 })
}