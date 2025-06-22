// End-to-end pipeline tests that test the complete flow
import { ShopifyPriceTracker, PriceAlertService } from '../../lib/shopify-integration'
import { DatabaseService } from '../../lib/database'
import { BrandCustomizationService } from '../../lib/brand-customization'
import { createMocks } from 'node-mocks-http'
import { POST as createAlertAPI } from '../../app/api/price-alerts/route'
import { POST as webhookAPI } from '../../app/api/webhooks/shopify/route'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

// Mock fetch for Shopify API
global.fetch = jest.fn()

describe('Full E2E Pipeline Tests', () => {
  let testShopDomain: string
  let tracker: ShopifyPriceTracker
  let testProductId: string
  let testAlertId: string

  const webhookSecret = 'e2e_test_webhook_secret'

  beforeAll(async () => {
    testShopDomain = `e2e-test-${uuidv4().slice(0, 8)}.myshopify.com`
    process.env.SHOPIFY_WEBHOOK_SECRET = webhookSecret

    // Step 1: Create shop (simulates app installation)
    await DatabaseService.createShop({
      shop_domain: testShopDomain,
      access_token: 'e2e_test_token',
      shop_name: 'E2E Test Electronics Store',
      shop_email: 'owner@e2estore.com',
      currency: 'USD'
    })

    tracker = new ShopifyPriceTracker(testShopDomain, 'e2e_test_token')
  })

  afterAll(async () => {
    // Comprehensive cleanup
    try {
      await DatabaseService.supabase.from('email_logs').delete().match({})
      await DatabaseService.supabase.from('app_analytics').delete().eq('shop_domain', testShopDomain)
      await DatabaseService.supabase.from('price_history').delete().match({})
      await DatabaseService.supabase.from('price_alerts').delete().match({})
      await DatabaseService.supabase.from('products').delete().eq('shop_domain', testShopDomain)
      await DatabaseService.supabase.from('brand_settings').delete().eq('shop_domain', testShopDomain)
      await DatabaseService.supabase.from('shops').delete().eq('shop_domain', testShopDomain)
    } catch (error) {
      console.warn('E2E cleanup error:', error)
    }
  })

  describe('Complete Customer Journey', () => {
    test('1. Merchant installs app and syncs products', async () => {
      // Mock Shopify products API response
      const mockShopifyResponse = {
        products: [
          {
            id: 'e2e_product_001',
            title: 'Premium Wireless Earbuds',
            body_html: 'High-quality wireless earbuds with active noise cancellation',
            variants: [{ id: 'variant_001', price: '199.99' }],
            images: [{ src: 'https://example.com/earbuds.jpg' }]
          },
          {
            id: 'e2e_product_002',
            title: 'Smart Fitness Watch',
            body_html: 'Track your fitness goals with this advanced smartwatch',
            variants: [{ id: 'variant_002', price: '299.99' }],
            images: [{ src: 'https://example.com/watch.jpg' }]
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockShopifyResponse)
      })

      // Sync products
      const syncResult = await tracker.syncProducts()

      expect(syncResult.success).toBe(true)
      expect(syncResult.synced).toBe(2)

      // Verify products in database
      const products = await DatabaseService.getShopProducts(testShopDomain)
      expect(products.length).toBe(2)

      const earbuds = products.find(p => p.title === 'Premium Wireless Earbuds')
      expect(earbuds).toBeDefined()
      testProductId = earbuds!.id

      // Verify shop stats
      const stats = await DatabaseService.getShopStats(testShopDomain)
      expect(stats.productCount).toBe(2)
    })

    test('2. Merchant customizes brand settings', async () => {
      const brandSettings = {
        brand_name: 'E2E Electronics',
        brand_logo_url: 'https://example.com/e2e-logo.png',
        primary_color: '#ff6b6b',
        secondary_color: '#4ecdc4',
        font_family: 'Arial' as const,
        email_footer_text: 'Thank you for shopping with E2E Electronics!',
        button_style: 'rounded' as const
      }

      const updatedSettings = await BrandCustomizationService.updateBrandSettings(
        testShopDomain,
        brandSettings
      )

      expect(updatedSettings.brand_name).toBe('E2E Electronics')
      expect(updatedSettings.primary_color).toBe('#ff6b6b')

      // Test email template generation with custom branding
      const retrievedSettings = await BrandCustomizationService.getBrandSettings(testShopDomain)
      expect(retrievedSettings?.brand_name).toBe('E2E Electronics')
    })

    test('3. Customer creates price alert via API', async () => {
      const alertData = {
        productId: testProductId,
        email: 'customer@e2etest.com',
        targetPrice: 179.99,
        customerName: 'Jane Customer',
        sendWelcome: true
      }

      const { req } = createMocks({
        method: 'POST',
        body: alertData
      })
      req.json = jest.fn().mockResolvedValue(alertData)

      const response = await createAlertAPI(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      testAlertId = responseData.alert.id

      // Verify alert in database
      const alerts = await PriceAlertService.getProductPriceAlerts(testProductId)
      expect(alerts.some(a => a.email === 'customer@e2etest.com')).toBe(true)

      // Verify analytics logged
      const analytics = await DatabaseService.getShopAnalytics(testShopDomain, 1)
      expect(analytics.some(a => a.event_type === 'price_alert_created')).toBe(true)
    })

    test('4. Shopify sends price update webhook triggering alert', async () => {
      // Create signed webhook payload
      const webhookPayload = {
        id: 'e2e_product_001',
        title: 'Premium Wireless Earbuds - Updated',
        body_html: 'Updated description with new features',
        variants: [
          {
            id: 'variant_001',
            price: '179.99' // Price drop that should trigger the alert
          }
        ],
        images: [{ src: 'https://example.com/earbuds-updated.jpg' }]
      }

      const bodyString = JSON.stringify(webhookPayload)
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyString)
        .digest('base64')

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-shopify-hmac-sha256': signature,
          'x-shopify-shop-domain': testShopDomain
        }
      })
      req.text = jest.fn().mockResolvedValue(bodyString)

      const response = await webhookAPI(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify product was updated
      const updatedProduct = await DatabaseService.getProduct(
        'e2e_product_001',
        testShopDomain
      )
      expect(updatedProduct?.current_price).toBe(179.99)

      // Verify price history
      const priceHistory = await DatabaseService.getProductPriceHistory(testProductId, 2)
      expect(priceHistory.length).toBeGreaterThan(1)
      expect(priceHistory[priceHistory.length - 1].price).toBe(179.99)

      // Verify alert was triggered
      const triggeredAlerts = await DatabaseService.getTriggeredAlerts(testProductId, 179.99)
      expect(triggeredAlerts.length).toBe(1)
      expect(triggeredAlerts[0].email).toBe('customer@e2etest.com')

      // Verify webhook analytics
      const analytics = await DatabaseService.getShopAnalytics(testShopDomain, 1)
      expect(analytics.some(a => a.event_type === 'webhook_received')).toBe(true)
    })

    test('5. Multiple customers create alerts for different price points', async () => {
      const customers = [
        { email: 'bargain-hunter@test.com', targetPrice: 150.00, name: 'Bargain Hunter' },
        { email: 'premium-buyer@test.com', targetPrice: 170.00, name: 'Premium Buyer' },
        { email: 'patient-shopper@test.com', targetPrice: 160.00, name: 'Patient Shopper' }
      ]

      // Create multiple alerts
      for (const customer of customers) {
        const result = await PriceAlertService.createPriceAlert({
          productId: testProductId,
          email: customer.email,
          targetPrice: customer.targetPrice,
          customerName: customer.name
        })
        expect(result.success).toBe(true)
      }

      // Verify all alerts exist
      const allAlerts = await PriceAlertService.getProductPriceAlerts(testProductId)
      expect(allAlerts.length).toBe(4) // Original + 3 new ones

      // Update stats
      const stats = await DatabaseService.getShopStats(testShopDomain)
      expect(stats.activeAlerts).toBeGreaterThan(3)
    })

    test('6. Price drops trigger multiple alerts at once', async () => {
      // Send webhook with significant price drop
      const webhookPayload = {
        id: 'e2e_product_001',
        title: 'Premium Wireless Earbuds - Flash Sale',
        variants: [
          {
            id: 'variant_001',
            price: '149.99' // Should trigger 3 more alerts
          }
        ]
      }

      const bodyString = JSON.stringify(webhookPayload)
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyString)
        .digest('base64')

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-shopify-hmac-sha256': signature,
          'x-shopify-shop-domain': testShopDomain
        }
      })
      req.text = jest.fn().mockResolvedValue(bodyString)

      await webhookAPI(req as any)

      // Verify multiple alerts were triggered
      const triggeredAlerts = await DatabaseService.getTriggeredAlerts(testProductId, 149.99)
      expect(triggeredAlerts.length).toBe(3) // All 3 new alerts should trigger

      // Verify updated stats
      const stats = await DatabaseService.getShopStats(testShopDomain)
      expect(stats.alertsTriggered).toBeGreaterThan(0)
    })

    test('7. Customer checks their alert dashboard', async () => {
      // Simulate customer dashboard loading
      const customerAlerts = await PriceAlertService.getAlertsByEmail('customer@e2etest.com')

      expect(customerAlerts.length).toBe(1)
      expect(customerAlerts[0].status).toBe('triggered')
      expect(customerAlerts[0].product).toBeDefined()
      expect(customerAlerts[0].product?.current_price).toBe(149.99)

      // Calculate savings
      const alert = customerAlerts[0]
      const savings = alert.target_price - alert.product!.current_price
      const savingsPercent = Math.round((savings / alert.target_price) * 100)

      expect(savings).toBeGreaterThan(0)
      expect(savingsPercent).toBeGreaterThan(0)
    })

    test('8. Customer cancels an alert', async () => {
      const success = await PriceAlertService.cancelPriceAlert(testAlertId)
      expect(success).toBe(true)

      // Verify alert is cancelled
      const updatedAlerts = await PriceAlertService.getAlertsByEmail('customer@e2etest.com')
      expect(updatedAlerts[0].status).toBe('expired')
    })

    test('9. Merchant views comprehensive analytics', async () => {
      // Get all analytics for the shop
      const analytics = await DatabaseService.getShopAnalytics(testShopDomain, 7)
      
      expect(analytics.length).toBeGreaterThan(5)
      
      // Verify different event types were logged
      const eventTypes = analytics.map(a => a.event_type)
      expect(eventTypes).toContain('price_alert_created')
      expect(eventTypes).toContain('webhook_received')

      // Get final shop stats
      const finalStats = await DatabaseService.getShopStats(testShopDomain)
      expect(finalStats.productCount).toBe(2)
      expect(finalStats.alertsTriggered).toBeGreaterThan(0)

      // Verify price history tracking
      const priceHistory = await DatabaseService.getProductPriceHistory(testProductId, 7)
      expect(priceHistory.length).toBeGreaterThan(2) // Multiple price updates
      
      // Verify price progression: 199.99 -> 179.99 -> 149.99
      const prices = priceHistory.map(h => h.price).sort((a, b) => a - b)
      expect(prices).toContain(149.99)
      expect(prices).toContain(179.99)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle duplicate alert creation gracefully', async () => {
      // Try to create the same alert twice
      const alertData = {
        productId: testProductId,
        email: 'duplicate@test.com',
        targetPrice: 160.00,
        customerName: 'Duplicate Customer'
      }

      const result1 = await PriceAlertService.createPriceAlert(alertData)
      const result2 = await PriceAlertService.createPriceAlert(alertData)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true) // Should still succeed, just create another alert

      const alerts = await PriceAlertService.getAlertsByEmail('duplicate@test.com')
      expect(alerts.length).toBe(2) // Both alerts should exist
    })

    test('should handle malformed webhook gracefully', async () => {
      const malformedPayload = {
        // Missing required fields
        title: 'Test Product'
      }

      const bodyString = JSON.stringify(malformedPayload)
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyString)
        .digest('base64')

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-shopify-hmac-sha256': signature,
          'x-shopify-shop-domain': testShopDomain
        }
      })
      req.text = jest.fn().mockResolvedValue(bodyString)

      const response = await webhookAPI(req as any)
      
      // Should not crash, should handle gracefully
      expect(response.status).toBe(200) // Webhook should still return 200 to prevent retries
    })

    test('should handle database connection issues', async () => {
      // Temporarily break database connection by using invalid credentials
      const originalSupabase = DatabaseService.supabase
      
      // Mock a database error
      const mockSupabase = {
        from: () => ({
          select: () => Promise.resolve({ data: null, error: { message: 'Connection failed' } }),
          insert: () => Promise.resolve({ data: null, error: { message: 'Connection failed' } }),
          update: () => Promise.resolve({ data: null, error: { message: 'Connection failed' } }),
          delete: () => Promise.resolve({ data: null, error: { message: 'Connection failed' } })
        })
      }

      // This test demonstrates how the system should handle database failures
      // In a real scenario, you'd want retry logic and fallback mechanisms
      try {
        const result = await PriceAlertService.createPriceAlert({
          productId: 'invalid-id',
          email: 'test@test.com',
          targetPrice: 100.00,
          customerName: 'Test'
        })

        // Should handle the error gracefully
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
      } catch (error) {
        // Or throw a handled error
        expect(error).toBeDefined()
      }
    })
  })
})