// Full Shopify integration tests with real database operations
import { ShopifyPriceTracker, PriceAlertService } from '../../lib/shopify-integration'
import { DatabaseService } from '../../lib/database'
import { v4 as uuidv4 } from 'uuid'

// Mock fetch for Shopify API calls
global.fetch = jest.fn()

describe('ShopifyPriceTracker - Full Integration Tests', () => {
  let testShopDomain: string
  let tracker: ShopifyPriceTracker
  let testProductId: string

  beforeAll(async () => {
    testShopDomain = `integration-test-${uuidv4().slice(0, 8)}.myshopify.com`
    
    // Create test shop in database
    await DatabaseService.createShop({
      shop_domain: testShopDomain,
      access_token: 'test_access_token',
      shop_name: 'Integration Test Shop',
      currency: 'USD'
    })

    tracker = new ShopifyPriceTracker(testShopDomain, 'test_access_token')
  })

  afterAll(async () => {
    // Cleanup
    try {
      await DatabaseService.supabase
        .from('price_alerts')
        .delete()
        .match({ product_id: testProductId })

      await DatabaseService.supabase
        .from('products')
        .delete()
        .eq('shop_domain', testShopDomain)

      await DatabaseService.supabase
        .from('shops')
        .delete()
        .eq('shop_domain', testShopDomain)
    } catch (error) {
      console.warn('Integration test cleanup error:', error)
    }
  })

  beforeEach(() => {
    // Reset fetch mock
    jest.clearAllMocks()
  })

  describe('Product Sync Pipeline', () => {
    test('should sync products from Shopify API to database', async () => {
      // Mock Shopify API response
      const mockShopifyProducts = {
        products: [
          {
            id: 'shopify_product_123',
            title: 'Integration Test Headphones',
            body_html: 'Test description',
            variants: [
              {
                id: 'variant_123',
                price: '299.99'
              }
            ],
            images: [
              {
                src: 'https://example.com/test-headphones.jpg'
              }
            ]
          },
          {
            id: 'shopify_product_456',
            title: 'Integration Test Speaker',
            body_html: 'Speaker description',
            variants: [
              {
                id: 'variant_456',
                price: '149.99'
              }
            ],
            images: []
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockShopifyProducts)
      })

      // Execute sync
      const result = await tracker.syncProducts()

      // Verify API call
      expect(fetch).toHaveBeenCalledWith(
        `https://${testShopDomain}/admin/api/2024-01/products.json`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Shopify-Access-Token': 'test_access_token'
          })
        })
      )

      // Verify sync result
      expect(result.success).toBe(true)
      expect(result.synced).toBe(2)
      expect(result.errors).toHaveLength(0)

      // Verify products were saved to database
      const savedProducts = await DatabaseService.getShopProducts(testShopDomain)
      expect(savedProducts.length).toBe(2)

      const headphones = savedProducts.find(p => p.title === 'Integration Test Headphones')
      expect(headphones).toBeDefined()
      expect(headphones?.current_price).toBe(299.99)
      expect(headphones?.shopify_product_id).toBe('shopify_product_123')

      testProductId = headphones!.id
    })

    test('should handle API errors gracefully', async () => {
      // Mock API error
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

      const result = await tracker.syncProducts()

      expect(result.success).toBe(false)
      expect(result.synced).toBe(0)
      expect(result.errors).toContain('Sync failed')
    })
  })

  describe('Webhook Processing Pipeline', () => {
    test('should process product update webhook and trigger alerts', async () => {
      // Create price alerts for the test product
      await DatabaseService.createPriceAlert({
        product_id: testProductId,
        email: 'webhook-customer1@test.com',
        target_price: 250.00,
        customer_name: 'Webhook Customer 1',
        status: 'active'
      })

      await DatabaseService.createPriceAlert({
        product_id: testProductId,
        email: 'webhook-customer2@test.com',
        target_price: 280.00,
        customer_name: 'Webhook Customer 2',
        status: 'active'
      })

      // Mock webhook payload
      const webhookPayload = {
        id: 'shopify_product_123',
        title: 'Updated Integration Test Headphones',
        body_html: 'Updated description',
        variants: [
          {
            id: 'variant_123',
            price: '249.99' // Price drop that should trigger first alert
          }
        ],
        images: [
          {
            src: 'https://example.com/updated-headphones.jpg'
          }
        ]
      }

      // Process webhook
      await tracker.handleProductUpdate(webhookPayload)

      // Verify product was updated
      const updatedProduct = await DatabaseService.getProduct(
        'shopify_product_123',
        testShopDomain
      )

      expect(updatedProduct?.current_price).toBe(249.99)
      expect(updatedProduct?.title).toBe('Updated Integration Test Headphones')

      // Verify price history was recorded
      const priceHistory = await DatabaseService.getProductPriceHistory(testProductId, 1)
      expect(priceHistory.length).toBeGreaterThan(0)
      expect(priceHistory[priceHistory.length - 1].price).toBe(249.99)

      // Verify alerts were checked and potentially triggered
      const triggeredAlerts = await DatabaseService.getTriggeredAlerts(testProductId, 249.99)
      expect(triggeredAlerts.length).toBe(1) // Only the 250.00 target should trigger
      expect(triggeredAlerts[0].email).toBe('webhook-customer1@test.com')
    })
  })

  describe('Webhook Creation', () => {
    test('should create webhook via Shopify API', async () => {
      const webhookUrl = 'https://test-app.com/webhooks/shopify'

      // Mock successful webhook creation
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          webhook: {
            id: 'webhook_123',
            topic: 'products/update',
            address: webhookUrl
          }
        })
      })

      const result = await tracker.createProductUpdateWebhook(webhookUrl)

      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        `https://${testShopDomain}/admin/api/2024-01/webhooks.json`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Shopify-Access-Token': 'test_access_token'
          }),
          body: JSON.stringify({
            webhook: {
              topic: 'products/update',
              address: webhookUrl,
              format: 'json'
            }
          })
        })
      )
    })
  })
})

describe('PriceAlertService - Full Database Integration', () => {
  let testProductId: string
  let testShopDomain: string

  beforeAll(async () => {
    testShopDomain = `alert-service-test-${uuidv4().slice(0, 8)}.myshopify.com`

    // Create test shop and product
    await DatabaseService.createShop({
      shop_domain: testShopDomain,
      access_token: 'test_token',
      shop_name: 'Alert Service Test Shop',
      currency: 'USD'
    })

    const product = await DatabaseService.upsertProduct({
      shopify_product_id: 'alert_service_product',
      shop_domain: testShopDomain,
      title: 'Alert Service Test Product',
      description: 'Product for alert service testing',
      price: 199.99,
      current_price: 179.99,
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
      console.warn('Alert service test cleanup error:', error)
    }
  })

  test('should create price alert end-to-end', async () => {
    const alertData = {
      productId: testProductId,
      email: 'alert-service@test.com',
      targetPrice: 150.00,
      customerName: 'Alert Service Customer'
    }

    const result = await PriceAlertService.createPriceAlert(alertData)

    expect(result.success).toBe(true)
    expect(result.alert).toBeDefined()
    expect(result.alert?.email).toBe('alert-service@test.com')
    expect(result.alert?.target_price).toBe(150.00)

    // Verify alert was saved to database
    const alerts = await PriceAlertService.getProductPriceAlerts(testProductId)
    expect(alerts.some(a => a.email === 'alert-service@test.com')).toBe(true)
  })

  test('should get alerts by email with product data', async () => {
    const alerts = await PriceAlertService.getAlertsByEmail('alert-service@test.com')

    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts[0].email).toBe('alert-service@test.com')
    expect(alerts[0].product).toBeDefined()
    expect(alerts[0].product?.title).toBe('Alert Service Test Product')
  })

  test('should cancel price alert', async () => {
    // Get existing alert
    const alerts = await PriceAlertService.getAlertsByEmail('alert-service@test.com')
    const alertId = alerts[0].id

    const success = await PriceAlertService.cancelPriceAlert(alertId)

    expect(success).toBe(true)

    // Verify alert status was updated
    const updatedAlerts = await PriceAlertService.getProductPriceAlerts(testProductId)
    const cancelledAlert = updatedAlerts.find(a => a.id === alertId)
    expect(cancelledAlert?.status).toBe('expired')
  })
})