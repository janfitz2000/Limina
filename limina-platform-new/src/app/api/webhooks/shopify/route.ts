// src/app/api/webhooks/shopify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { IntegrationManager } from '@/lib/integrations'

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