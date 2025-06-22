// Webhook handler tests with real database and HMAC verification
import { createMocks } from 'node-mocks-http'
import { POST } from '../../app/api/webhooks/shopify/route'
import { DatabaseService } from '../../lib/database'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

describe('/api/webhooks/shopify - Full Pipeline Tests', () => {
  let testShopDomain: string
  let testProductId: string
  const webhookSecret = 'test_webhook_secret_123'

  beforeAll(async () => {
    testShopDomain = `webhook-test-${uuidv4().slice(0, 8)}.myshopify.com`
    
    // Set up environment
    process.env.SHOPIFY_WEBHOOK_SECRET = webhookSecret

    // Create test shop
    await DatabaseService.createShop({
      shop_domain: testShopDomain,
      access_token: 'test_token',
      shop_name: 'Webhook Test Shop',
      currency: 'USD'
    })

    // Create test product
    const product = await DatabaseService.upsertProduct({
      shopify_product_id: 'webhook_product_123',
      shop_domain: testShopDomain,
      title: 'Webhook Test Product',
      description: 'Product for webhook testing',
      price: 199.99,
      current_price: 199.99,
      currency: 'USD'
    })
    testProductId = product.id
  })

  afterAll(async () => {
    // Cleanup
    try {
      await DatabaseService.supabase
        .from('price_alerts')
        .delete()
        .eq('product_id', testProductId)

      await DatabaseService.supabase
        .from('products')
        .delete()
        .eq('shop_domain', testShopDomain)

      await DatabaseService.supabase
        .from('shops')
        .delete()
        .eq('shop_domain', testShopDomain)
    } catch (error) {
      console.warn('Webhook test cleanup error:', error)
    }
  })

  function createSignedWebhookRequest(body: any, shopDomain: string) {
    const bodyString = JSON.stringify(body)
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyString)
      .digest('base64')

    const { req } = createMocks({
      method: 'POST',
      headers: {
        'x-shopify-hmac-sha256': signature,
        'x-shopify-shop-domain': shopDomain,
        'content-type': 'application/json'
      },
      body: bodyString,
    })

    // Mock request.text() method
    req.text = jest.fn().mockResolvedValue(bodyString)

    return req
  }

  describe('Product Update Webhook', () => {
    test('should process valid product update webhook', async () => {
      // Create a price alert first to test triggering
      await DatabaseService.createPriceAlert({
        product_id: testProductId,
        email: 'webhook-test@customer.com',
        target_price: 150.00,
        customer_name: 'Webhook Test Customer',
        status: 'active'
      })

      const webhookPayload = {
        id: 'webhook_product_123',
        title: 'Updated Webhook Test Product',
        body_html: 'Updated description',
        variants: [
          {
            id: 'variant_123',
            price: '149.99' // Price drop that should trigger alert
          }
        ],
        images: [
          {
            src: 'https://example.com/updated-image.jpg'
          }
        ]
      }

      const req = createSignedWebhookRequest(webhookPayload, testShopDomain)
      const response = await POST(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify product was updated in database
      const updatedProduct = await DatabaseService.getProduct(
        'webhook_product_123',
        testShopDomain
      )

      expect(updatedProduct).toBeDefined()
      expect(updatedProduct?.current_price).toBe(149.99)
      expect(updatedProduct?.title).toBe('Updated Webhook Test Product')

      // Verify price history was created
      const priceHistory = await DatabaseService.getProductPriceHistory(testProductId, 1)
      expect(priceHistory.length).toBeGreaterThan(0)
      expect(priceHistory[priceHistory.length - 1].price).toBe(149.99)

      // Verify analytics event was logged
      const analytics = await DatabaseService.getShopAnalytics(testShopDomain, 1)
      expect(analytics.some(a => a.event_type === 'webhook_received')).toBe(true)
    })

    test('should reject webhook with invalid signature', async () => {
      const webhookPayload = {
        id: 'test_product_123',
        title: 'Test Product'
      }

      const bodyString = JSON.stringify(webhookPayload)
      const invalidSignature = 'invalid_signature'

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-shopify-hmac-sha256': invalidSignature,
          'x-shopify-shop-domain': testShopDomain
        },
        body: bodyString,
      })

      req.text = jest.fn().mockResolvedValue(bodyString)

      const response = await POST(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Invalid signature')
    })

    test('should reject webhook with missing headers', async () => {
      const webhookPayload = {
        id: 'test_product_123',
        title: 'Test Product'
      }

      const { req } = createMocks({
        method: 'POST',
        headers: {
          // Missing required headers
        },
        body: JSON.stringify(webhookPayload),
      })

      req.text = jest.fn().mockResolvedValue(JSON.stringify(webhookPayload))

      const response = await POST(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Missing required headers')
    })

    test('should handle webhook for non-existent shop', async () => {
      const nonExistentShop = 'non-existent-shop.myshopify.com'
      const webhookPayload = {
        id: 'test_product_123',
        title: 'Test Product'
      }

      const req = createSignedWebhookRequest(webhookPayload, nonExistentShop)
      const response = await POST(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('Shop not found')
    })
  })

  describe('Price Alert Triggering', () => {
    test('should trigger multiple alerts when price drops significantly', async () => {
      // Create multiple price alerts with different target prices
      const alerts = [
        { target_price: 180.00, email: 'customer1@test.com' },
        { target_price: 160.00, email: 'customer2@test.com' },
        { target_price: 140.00, email: 'customer3@test.com' }
      ]

      for (const alertData of alerts) {
        await DatabaseService.createPriceAlert({
          product_id: testProductId,
          email: alertData.email,
          target_price: alertData.target_price,
          customer_name: 'Test Customer',
          status: 'active'
        })
      }

      // Send webhook with significant price drop
      const webhookPayload = {
        id: 'webhook_product_123',
        title: 'Webhook Test Product',
        variants: [
          {
            id: 'variant_123',
            price: '139.99' // Should trigger all 3 alerts
          }
        ]
      }

      const req = createSignedWebhookRequest(webhookPayload, testShopDomain)
      const response = await POST(req as any)

      expect(response.status).toBe(200)

      // Verify alerts were triggered
      const triggeredAlerts = await DatabaseService.getTriggeredAlerts(testProductId, 139.99)
      expect(triggeredAlerts.length).toBe(3)
      expect(triggeredAlerts.every(a => a.target_price >= 139.99)).toBe(true)
    })
  })
})