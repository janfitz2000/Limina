// Full API endpoint tests with real database
import { createMocks } from 'node-mocks-http'
import { POST, GET } from '../../app/api/price-alerts/route'
import { DatabaseService } from '../../lib/database'
import { v4 as uuidv4 } from 'uuid'

describe('/api/price-alerts - Full Pipeline Tests', () => {
  let testShopDomain: string
  let testProductId: string
  let testAlertId: string

  beforeAll(async () => {
    testShopDomain = `test-shop-${uuidv4().slice(0, 8)}.myshopify.com`

    // Create test shop
    await DatabaseService.createShop({
      shop_domain: testShopDomain,
      access_token: 'test_token',
      shop_name: 'Test Shop',
      currency: 'USD'
    })

    // Create test product
    const product = await DatabaseService.upsertProduct({
      shopify_product_id: 'test_product_api',
      shop_domain: testShopDomain,
      title: 'API Test Product',
      description: 'Test product for API testing',
      price: 199.99,
      current_price: 149.99,
      currency: 'USD'
    })
    testProductId = product.id
  })

  afterAll(async () => {
    // Cleanup
    try {
      if (testAlertId) {
        await DatabaseService.supabase
          .from('price_alerts')
          .delete()
          .eq('id', testAlertId)
      }

      await DatabaseService.supabase
        .from('products')
        .delete()
        .eq('shop_domain', testShopDomain)

      await DatabaseService.supabase
        .from('shops')
        .delete()
        .eq('shop_domain', testShopDomain)
    } catch (error) {
      console.warn('API test cleanup error:', error)
    }
  })

  describe('POST /api/price-alerts', () => {
    test('should create a price alert successfully', async () => {
      const requestBody = {
        productId: testProductId,
        email: 'api-test@customer.com',
        targetPrice: 120.00,
        customerName: 'API Test Customer',
        sendWelcome: false
      }

      const { req } = createMocks({
        method: 'POST',
        body: requestBody,
      })

      // Mock request.json() method
      req.json = jest.fn().mockResolvedValue(requestBody)

      const response = await POST(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.alert).toBeDefined()
      expect(responseData.alert.email).toBe('api-test@customer.com')
      expect(responseData.alert.target_price).toBe(120.00)

      testAlertId = responseData.alert.id
    })

    test('should validate required fields', async () => {
      const requestBody = {
        productId: testProductId,
        // Missing email and targetPrice
        customerName: 'Test Customer'
      }

      const { req } = createMocks({
        method: 'POST',
        body: requestBody,
      })

      req.json = jest.fn().mockResolvedValue(requestBody)

      const response = await POST(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Missing required fields')
    })

    test('should validate email format', async () => {
      const requestBody = {
        productId: testProductId,
        email: 'invalid-email',
        targetPrice: 120.00
      }

      const { req } = createMocks({
        method: 'POST',
        body: requestBody,
      })

      req.json = jest.fn().mockResolvedValue(requestBody)

      const response = await POST(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid email format')
    })

    test('should validate target price', async () => {
      const requestBody = {
        productId: testProductId,
        email: 'test@customer.com',
        targetPrice: -10.00 // Invalid negative price
      }

      const { req } = createMocks({
        method: 'POST',
        body: requestBody,
      })

      req.json = jest.fn().mockResolvedValue(requestBody)

      const response = await POST(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Target price must be a positive number')
    })

    test('should prevent unreasonably low target prices', async () => {
      const requestBody = {
        productId: testProductId,
        email: 'test@customer.com',
        targetPrice: 10.00 // Too low compared to current price of 149.99
      }

      const { req } = createMocks({
        method: 'POST',
        body: requestBody,
      })

      req.json = jest.fn().mockResolvedValue(requestBody)

      const response = await POST(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Target price too low')
    })
  })

  describe('GET /api/price-alerts', () => {
    test('should get alerts by product ID', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: `/api/price-alerts?productId=${testProductId}`,
      })

      const response = await GET(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.alerts).toBeDefined()
      expect(Array.isArray(responseData.alerts)).toBe(true)
      expect(responseData.alerts.length).toBeGreaterThan(0)
      expect(responseData.alerts.some((a: any) => a.product_id === testProductId)).toBe(true)
    })

    test('should get alerts by email', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/price-alerts?email=api-test@customer.com',
      })

      const response = await GET(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.alerts).toBeDefined()
      expect(Array.isArray(responseData.alerts)).toBe(true)
      expect(responseData.alerts.length).toBeGreaterThan(0)
      expect(responseData.alerts.some((a: any) => a.email === 'api-test@customer.com')).toBe(true)
    })

    test('should require either productId or email parameter', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/price-alerts', // No query parameters
      })

      const response = await GET(req as any)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Either productId or email parameter is required')
    })
  })
})