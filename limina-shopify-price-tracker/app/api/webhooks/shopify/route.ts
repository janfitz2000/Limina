// Shopify webhook handler for product updates
import { NextRequest, NextResponse } from 'next/server'
import { ShopifyPriceTracker } from '../../../../lib/shopify-integration'
import { DatabaseService } from '../../../../lib/database'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const body = await request.text()
    const signature = request.headers.get('x-shopify-hmac-sha256')
    const shop = request.headers.get('x-shopify-shop-domain')
    
    if (!signature || !shop) {
      return NextResponse.json({ error: 'Missing required headers' }, { status: 400 })
    }

    // Verify webhook authenticity
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('SHOPIFY_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('base64')

    if (signature !== computedSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse webhook data
    const productData = JSON.parse(body)
    
    // Get shop credentials
    const shopData = await DatabaseService.getShop(shop)
    if (!shopData) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Initialize Shopify tracker and handle the update
    const tracker = new ShopifyPriceTracker(shop, shopData.access_token)
    await tracker.handleProductUpdate(productData)

    // Log webhook event
    await DatabaseService.logEvent(shop, 'webhook_received', {
      type: 'product_update',
      product_id: productData.id,
      product_title: productData.title
    })

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error processing Shopify webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}