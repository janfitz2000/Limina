import { POST } from '../route'
import { 
  createNextApiTestRequest, 
  createMockSupabaseClient, 
  createMockStripeClient,
  createTestUser,
  createTestProduct,
  createTestMerchant,
  mockEnvVars
} from '@/lib/test-utils'

// Mock external dependencies
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
}))

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
    },
  }))
})

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('/api/buy-orders/create', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  let mockStripe: ReturnType<typeof createMockStripeClient>
  
  beforeEach(() => {
    // Setup mocks
    mockSupabase = createMockSupabaseClient()
    mockStripe = createMockStripeClient()
    
    // Mock Supabase client creation
    const { createRouteHandlerClient } = jest.requireMock('@supabase/auth-helpers-nextjs')
    createRouteHandlerClient.mockReturnValue(mockSupabase)
    
    // Mock Stripe client creation
    const Stripe = jest.requireMock('stripe')
    Stripe.mockImplementation(() => mockStripe)
    
    // Setup environment variables
    process.env = { ...process.env, ...mockEnvVars }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/buy-orders/create', () => {
    const validRequestBody = {
      productId: 'test-product-id',
      targetPrice: 80,
      expiryDays: 7,
      paymentMethodId: 'pm_test123',
      customerInfo: {
        name: 'Test Customer',
        phone: '+1234567890'
      }
    }

    it('should create a buy order successfully', async () => {
      // Setup test data
      const user = createTestUser()
      const merchant = createTestMerchant()
      const product = createTestProduct({ merchant_id: merchant.id })
      
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user },
        error: null
      })
      
      // Mock product fetch
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...product, merchants: merchant },
        error: null
      })
      
      // Mock customer lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null
      })
      
      // Mock customer creation
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'test-customer-id' },
        error: null
      })
      
      // Mock Stripe payment intent creation
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test123',
        status: 'requires_confirmation'
      })
      
      // Mock Stripe payment intent confirmation
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_test123',
        status: 'requires_capture',
        client_secret: 'pi_test123_secret'
      })
      
      // Mock buy order creation
      const buyOrder = {
        id: 'test-buy-order-id',
        merchant_id: merchant.id,
        product_id: product.id,
        customer_id: 'test-customer-id',
        target_price: 80,
        status: 'monitoring',
        payment_status: 'authorized',
        products: product,
        merchants: merchant
      }
      
      mockSupabase.single.mockResolvedValueOnce({
        data: buyOrder,
        error: null
      })
      
      // Mock escrow payment creation
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null
      })
      
      // Mock notifications
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null
      })
      
      // Create request
      const request = createNextApiTestRequest('POST', validRequestBody)
      
      // Execute
      const response = await POST(request)
      const result = await response.json()
      
      // Assertions
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.buyOrder).toBeDefined()
      expect(result.paymentIntent).toBeDefined()
      expect(result.paymentIntent.id).toBe('pi_test123')
      expect(result.paymentIntent.status).toBe('requires_capture')
      
      // Verify Stripe calls
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 8000, // 80 * 100
          currency: 'gbp',
          payment_method: 'pm_test123',
          confirmation_method: 'manual',
          capture_method: 'manual',
          application_fee_amount: 200, // 2.5% of 8000
          transfer_data: {
            destination: merchant.stripe_account_id,
          },
          metadata: expect.objectContaining({
            product_id: product.id,
            merchant_id: merchant.id,
            target_price: '80',
            type: 'conditional_buy_order'
          })
        })
      )
      
      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_test123')
    })

    it('should return 500 when Stripe is not configured', async () => {
      // Remove Stripe key
      delete process.env.STRIPE_SECRET_KEY
      
      const request = createNextApiTestRequest('POST', validRequestBody)
      const response = await POST(request)
      const result = await response.json()
      
      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Payment system not configured')
    })

    it('should return 500 when user is not authenticated', async () => {
      // Mock authentication failure
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })
      
      const request = createNextApiTestRequest('POST', validRequestBody)
      const response = await POST(request)
      const result = await response.json()
      
      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })

    it('should return 500 when product is not found', async () => {
      const user = createTestUser()
      
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user },
        error: null
      })
      
      // Mock product not found
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Product not found')
      })
      
      const request = createNextApiTestRequest('POST', validRequestBody)
      const response = await POST(request)
      const result = await response.json()
      
      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Product not found')
    })

    it('should return 500 when payment authorization fails', async () => {
      const user = createTestUser()
      const merchant = createTestMerchant()
      const product = createTestProduct({ merchant_id: merchant.id })
      
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user },
        error: null
      })
      
      // Mock product fetch
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...product, merchants: merchant },
        error: null
      })
      
      // Mock existing customer
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'test-customer-id' },
        error: null
      })
      
      // Mock Stripe payment intent creation
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test123',
        status: 'requires_confirmation'
      })
      
      // Mock Stripe payment intent confirmation failure
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_test123',
        status: 'requires_payment_method', // Not requires_capture
        client_secret: 'pi_test123_secret'
      })
      
      const request = createNextApiTestRequest('POST', validRequestBody)
      const response = await POST(request)
      const result = await response.json()
      
      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Payment authorization failed')
    })

    it('should calculate platform fees correctly', async () => {
      const user = createTestUser()
      const merchant = createTestMerchant()
      const product = createTestProduct({ merchant_id: merchant.id })
      
      // Mock successful flow
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user },
        error: null
      })
      
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...product, merchants: merchant },
        error: null
      })
      
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'test-customer-id' },
        error: null
      })
      
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test123',
        status: 'requires_confirmation'
      })
      
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_test123',
        status: 'requires_capture',
        client_secret: 'pi_test123_secret'
      })
      
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'test-buy-order-id' },
        error: null
      })
      
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null
      })
      
      const requestWithCustomPrice = createNextApiTestRequest('POST', {
        ...validRequestBody,
        targetPrice: 100
      })
      
      await POST(requestWithCustomPrice)
      
      // Verify platform fee calculation (2.5% of 100 = 2.5)
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10000, // 100 * 100
          application_fee_amount: 250, // 2.5% of 10000
        })
      )
    })
  })
})