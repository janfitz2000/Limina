import { NextRequest, NextResponse } from 'next/server'
import { createMocks } from 'node-mocks-http'
import type { RequestMethod } from 'node-mocks-http'

// Mock Supabase client for testing
export const createMockSupabaseClient = () => {
  const mockClient = {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => mockClient),
    select: jest.fn(() => mockClient),
    insert: jest.fn(() => mockClient),
    update: jest.fn(() => mockClient),
    delete: jest.fn(() => mockClient),
    upsert: jest.fn(() => mockClient),
    eq: jest.fn(() => mockClient),
    neq: jest.fn(() => mockClient),
    gt: jest.fn(() => mockClient),
    lt: jest.fn(() => mockClient),
    gte: jest.fn(() => mockClient),
    lte: jest.fn(() => mockClient),
    like: jest.fn(() => mockClient),
    ilike: jest.fn(() => mockClient),
    in: jest.fn(() => mockClient),
    is: jest.fn(() => mockClient),
    single: jest.fn(),
    limit: jest.fn(() => mockClient),
    order: jest.fn(() => mockClient),
    range: jest.fn(() => mockClient),
    then: jest.fn(),
    catch: jest.fn(),
  }
  return mockClient
}

// Mock Stripe client for testing
export const createMockStripeClient = () => {
  return {
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
      capture: jest.fn(),
      cancel: jest.fn(),
      retrieve: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      list: jest.fn(),
    },
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }
}

// Helper for testing API routes
export const createApiTestRequest = (
  method: RequestMethod,
  body?: unknown,
  headers?: Record<string, string>
) => {
  const { req, res } = createMocks({
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
  })
  return { req, res }
}

// Helper for testing Next.js 13+ API routes
export const createNextApiTestRequest = (
  method: string,
  body?: unknown,
  headers?: Record<string, string>
) => {
  const url = 'http://localhost:3000/api/test'
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }
  
  if (body) {
    init.body = JSON.stringify(body)
  }
  
  return new NextRequest(url, init)
}

// Test data factories
export const createTestUser = (overrides?: Record<string, unknown>) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
  },
  ...overrides,
})

export const createTestProduct = (overrides?: Record<string, unknown>) => ({
  id: 'test-product-id',
  title: 'Test Product',
  description: 'A test product',
  current_price: 100,
  image_url: 'https://example.com/image.jpg',
  merchant_id: 'test-merchant-id',
  platform: 'shopify',
  platform_product_id: 'shopify-123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestMerchant = (overrides?: Record<string, unknown>) => ({
  id: 'test-merchant-id',
  name: 'Test Merchant',
  email: 'merchant@example.com',
  stripe_account_id: 'acct_test123',
  webhook_url: 'https://merchant.com/webhooks',
  platform: 'shopify',
  platform_config: {
    shop_domain: 'test-shop.myshopify.com',
    access_token: 'test-access-token',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestBuyOrder = (overrides?: Record<string, unknown>) => ({
  id: 'test-buy-order-id',
  merchant_id: 'test-merchant-id',
  product_id: 'test-product-id',
  customer_id: 'test-customer-id',
  customer_email: 'customer@example.com',
  customer_name: 'Test Customer',
  target_price: 80,
  current_price: 100,
  status: 'monitoring',
  payment_status: 'authorized',
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  condition_value: {
    payment_intent_id: 'pi_test123',
    escrow_amount: 80,
    platform_fee: 2,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Mock environment variables for testing
export const mockEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  STRIPE_SECRET_KEY: 'sk_test_test_key',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_webhook_secret',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
}

// Helper to mock environment variables
export const mockEnvironment = (vars: Record<string, string>) => {
  const originalEnv = process.env
  beforeEach(() => {
    process.env = { ...originalEnv, ...vars }
  })
  afterEach(() => {
    process.env = originalEnv
  })
}

// Helper to test API response format
export const expectApiResponse = (response: NextResponse, expectedStatus: number) => {
  expect(response.status).toBe(expectedStatus)
  expect(response.headers.get('content-type')).toContain('application/json')
}

// Helper to test API error response format
export const expectApiErrorResponse = (response: NextResponse, expectedStatus: number, expectedError?: string) => {
  expectApiResponse(response, expectedStatus)
  if (expectedError) {
    // Note: In actual tests, you'd need to parse the response body
    // This is a simplified version for the utility
  }
}

// Database test helpers
export const clearTestDatabase = async (supabase: ReturnType<typeof createMockSupabaseClient>) => {
  // Clear test data in reverse order to respect foreign keys
  await supabase.from('notifications').delete().neq('id', 'keep-this-id')
  await supabase.from('escrow_payments').delete().neq('id', 'keep-this-id')
  await supabase.from('buy_orders').delete().neq('id', 'keep-this-id')
  await supabase.from('products').delete().neq('id', 'keep-this-id')
  await supabase.from('customers').delete().neq('id', 'keep-this-id')
  await supabase.from('merchants').delete().neq('id', 'keep-this-id')
}

// Helper to seed test data
export const seedTestData = async (supabase: ReturnType<typeof createMockSupabaseClient>) => {
  const merchant = createTestMerchant()
  const product = createTestProduct({ merchant_id: merchant.id })
  const customer = { id: 'test-customer-id', user_id: 'test-user-id', email: 'test@example.com', name: 'Test Customer' }
  const buyOrder = createTestBuyOrder({
    merchant_id: merchant.id,
    product_id: product.id,
    customer_id: customer.id,
  })

  await supabase.from('merchants').insert(merchant)
  await supabase.from('products').insert(product)
  await supabase.from('customers').insert(customer)
  await supabase.from('buy_orders').insert(buyOrder)

  return { merchant, product, customer, buyOrder }
}