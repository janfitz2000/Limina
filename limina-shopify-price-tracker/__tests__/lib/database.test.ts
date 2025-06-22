// Full end-to-end database tests
import { DatabaseService } from '../../lib/database'
import { v4 as uuidv4 } from 'uuid'

describe('DatabaseService - Full Pipeline Tests', () => {
  let testShopDomain: string
  let testProductId: string
  let testAlertId: string

  beforeAll(async () => {
    // Use unique identifiers for each test run
    testShopDomain = `test-shop-${uuidv4().slice(0, 8)}.myshopify.com`
  })

  afterAll(async () => {
    // Cleanup test data
    try {
      // Clean up in reverse dependency order
      if (testAlertId) {
        await DatabaseService.supabase
          .from('price_alerts')
          .delete()
          .eq('id', testAlertId)
      }

      if (testProductId) {
        await DatabaseService.supabase
          .from('products')
          .delete()
          .eq('id', testProductId)
      }

      await DatabaseService.supabase
        .from('shops')
        .delete()
        .eq('shop_domain', testShopDomain)
    } catch (error) {
      console.warn('Cleanup error:', error)
    }
  })

  describe('Shop Management Pipeline', () => {
    test('should create a new shop and retrieve it', async () => {
      // Create shop
      const shopData = {
        shop_domain: testShopDomain,
        access_token: 'test_access_token_123',
        shop_name: 'Test Shop',
        shop_email: 'test@testshop.com',
        currency: 'USD'
      }

      const createdShop = await DatabaseService.createShop(shopData)
      
      expect(createdShop).toBeDefined()
      expect(createdShop.shop_domain).toBe(testShopDomain)
      expect(createdShop.shop_name).toBe('Test Shop')
      expect(createdShop.status).toBe('active')
      expect(createdShop.id).toBeDefined()

      // Retrieve shop
      const retrievedShop = await DatabaseService.getShop(testShopDomain)
      
      expect(retrievedShop).toBeDefined()
      expect(retrievedShop?.shop_domain).toBe(testShopDomain)
      expect(retrievedShop?.access_token).toBe('test_access_token_123')
    })

    test('should update shop information', async () => {
      const updates = {
        shop_name: 'Updated Test Shop',
        plan_name: 'premium'
      }

      const updatedShop = await DatabaseService.updateShop(testShopDomain, updates)
      
      expect(updatedShop.shop_name).toBe('Updated Test Shop')
      expect(updatedShop.plan_name).toBe('premium')
      expect(new Date(updatedShop.updated_at).getTime()).toBeGreaterThan(
        new Date(updatedShop.installed_at).getTime()
      )
    })
  })

  describe('Product Management Pipeline', () => {
    test('should create and manage products', async () => {
      // Create product
      const productData = {
        shopify_product_id: 'test_product_123',
        shop_domain: testShopDomain,
        title: 'Test Wireless Headphones',
        description: 'Premium test headphones',
        price: 299.99,
        current_price: 249.99,
        currency: 'USD',
        image_url: 'https://example.com/test-image.jpg',
        product_url: `https://${testShopDomain}/products/test-headphones`,
        variant_id: 'variant_123'
      }

      const createdProduct = await DatabaseService.upsertProduct(productData)
      testProductId = createdProduct.id
      
      expect(createdProduct).toBeDefined()
      expect(createdProduct.title).toBe('Test Wireless Headphones')
      expect(createdProduct.current_price).toBe(249.99)
      expect(createdProduct.status).toBe('active')

      // Retrieve product
      const retrievedProduct = await DatabaseService.getProduct(
        'test_product_123', 
        testShopDomain
      )
      
      expect(retrievedProduct).toBeDefined()
      expect(retrievedProduct?.id).toBe(testProductId)
      expect(retrievedProduct?.title).toBe('Test Wireless Headphones')
    })

    test('should update product price and create price history', async () => {
      const newPrice = 199.99

      await DatabaseService.updateProductPrice(testProductId, newPrice)

      // Verify product price was updated
      const updatedProduct = await DatabaseService.getProduct(
        'test_product_123',
        testShopDomain
      )
      
      expect(updatedProduct?.current_price).toBe(newPrice)

      // Verify price history was created
      const priceHistory = await DatabaseService.getProductPriceHistory(testProductId, 1)
      
      expect(priceHistory.length).toBeGreaterThan(0)
      expect(priceHistory[priceHistory.length - 1].price).toBe(newPrice)
    })

    test('should get shop products', async () => {
      const products = await DatabaseService.getShopProducts(testShopDomain)
      
      expect(products.length).toBeGreaterThan(0)
      expect(products.some(p => p.id === testProductId)).toBe(true)
    })
  })

  describe('Price Alert Pipeline', () => {
    test('should create and manage price alerts', async () => {
      // Create price alert
      const alertData = {
        product_id: testProductId,
        email: 'test@customer.com',
        target_price: 180.00,
        customer_name: 'Test Customer',
        status: 'active' as const
      }

      const createdAlert = await DatabaseService.createPriceAlert(alertData)
      testAlertId = createdAlert.id
      
      expect(createdAlert).toBeDefined()
      expect(createdAlert.email).toBe('test@customer.com')
      expect(createdAlert.target_price).toBe(180.00)
      expect(createdAlert.status).toBe('active')

      // Get alerts for product
      const productAlerts = await DatabaseService.getPriceAlerts(testProductId)
      
      expect(productAlerts.length).toBeGreaterThan(0)
      expect(productAlerts.some(a => a.id === testAlertId)).toBe(true)

      // Get alerts by email
      const emailAlerts = await DatabaseService.getAlertsByEmail('test@customer.com')
      
      expect(emailAlerts.length).toBeGreaterThan(0)
      expect(emailAlerts.some(a => a.id === testAlertId)).toBe(true)
    })

    test('should trigger alerts when price drops', async () => {
      // Update product price to trigger alert (below target price of 180)
      const triggerPrice = 175.00
      await DatabaseService.updateProductPrice(testProductId, triggerPrice)

      // Get triggered alerts
      const triggeredAlerts = await DatabaseService.getTriggeredAlerts(testProductId, triggerPrice)
      
      expect(triggeredAlerts.length).toBeGreaterThan(0)
      expect(triggeredAlerts.some(a => a.target_price >= triggerPrice)).toBe(true)
    })

    test('should update alert status', async () => {
      const updates = {
        status: 'triggered' as const,
        triggered_at: new Date().toISOString()
      }

      const updatedAlert = await DatabaseService.updatePriceAlert(testAlertId, updates)
      
      expect(updatedAlert.status).toBe('triggered')
      expect(updatedAlert.triggered_at).toBeDefined()
    })
  })

  describe('Analytics Pipeline', () => {
    test('should log and retrieve analytics events', async () => {
      const eventData = {
        action: 'price_alert_created',
        product_id: testProductId,
        target_price: 180.00
      }

      // Log event
      await DatabaseService.logEvent(testShopDomain, 'price_alert_created', eventData)

      // Retrieve analytics
      const analytics = await DatabaseService.getShopAnalytics(testShopDomain, 1)
      
      expect(analytics.length).toBeGreaterThan(0)
      expect(analytics.some(a => a.event_type === 'price_alert_created')).toBe(true)
    })

    test('should get shop statistics', async () => {
      const stats = await DatabaseService.getShopStats(testShopDomain)
      
      expect(stats).toBeDefined()
      expect(stats.productCount).toBeGreaterThan(0)
      expect(stats.activeAlerts).toBeGreaterThanOrEqual(0)
      expect(stats.alertsTriggered).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Email Logging Pipeline', () => {
    test('should log email events', async () => {
      const emailLogData = {
        email: 'test@customer.com',
        type: 'price_alert' as const,
        subject: 'Test Price Drop Alert',
        status: 'sent' as const
      }

      await DatabaseService.logEmail(emailLogData)

      // Verify email was logged (check via direct query since no getter method)
      const { data: emailLogs } = await DatabaseService.supabase
        .from('email_logs')
        .select('*')
        .eq('email', 'test@customer.com')
        .eq('type', 'price_alert')

      expect(emailLogs?.length).toBeGreaterThan(0)
      expect(emailLogs?.[0].subject).toBe('Test Price Drop Alert')
      expect(emailLogs?.[0].status).toBe('sent')
    })
  })
})