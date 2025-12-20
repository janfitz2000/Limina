import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Test database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'

// Create test client with service role key for full access
export const supabaseTest = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Test database setup helpers
export const setupTestDatabase = async () => {
  // Clear existing test data
  await clearTestDatabase()
  
  // Create test schema if needed
  await createTestSchema()
}

export const clearTestDatabase = async () => {
  // Clear test data in reverse order to respect foreign keys
  const tables = [
    'notifications',
    'webhook_logs',
    'escrow_payments',
    'buy_orders',
    'merchant_discounts',
    'products',
    'customers',
    'integrations',
    'merchants'
  ]
  
  for (const table of tables) {
    await supabaseTest.from(table).delete().neq('id', 'keep-this-id')
  }
}

export const createTestSchema = async () => {
  // This would typically be handled by migrations
  // For now, we assume the schema exists
  console.log('Test schema assumed to exist via migrations')
}

// Test user authentication
export const createTestUser = async (email: string = 'test@example.com') => {
  const { data, error } = await supabaseTest.auth.admin.createUser({
    email,
    password: 'test-password',
    email_confirm: true,
    user_metadata: {
      name: 'Test User'
    }
  })
  
  if (error) throw error
  return data.user
}

export const signInTestUser = async (email: string = 'test@example.com') => {
  const { data, error } = await supabaseTest.auth.signInWithPassword({
    email,
    password: 'test-password'
  })
  
  if (error) throw error
  return data.user
}

// Test data factories with database insertion
export const createTestMerchantInDB = async (overrides?: Record<string, unknown>) => {
  const merchant = {
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
    status: 'active',
    ...overrides,
  }
  
  const { data, error } = await supabaseTest
    .from('merchants')
    .insert(merchant)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const createTestProductInDB = async (merchantId: string, overrides?: Record<string, unknown>) => {
  const product = {
    id: 'test-product-id',
    title: 'Test Product',
    description: 'A test product',
    current_price: 100,
    image_url: 'https://example.com/image.jpg',
    merchant_id: merchantId,
    platform: 'shopify',
    platform_product_id: 'shopify-123',
    status: 'active',
    ...overrides,
  }
  
  const { data, error } = await supabaseTest
    .from('products')
    .insert(product)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const createTestCustomerInDB = async (userId: string, overrides?: Record<string, unknown>) => {
  const customer = {
    id: 'test-customer-id',
    user_id: userId,
    email: 'customer@example.com',
    name: 'Test Customer',
    phone: '+1234567890',
    stripe_customer_id: 'cus_test123',
    ...overrides,
  }
  
  const { data, error } = await supabaseTest
    .from('customers')
    .insert(customer)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const createTestBuyOrderInDB = async (
  merchantId: string,
  productId: string,
  customerId: string,
  overrides?: Record<string, unknown>
) => {
  const buyOrder = {
    id: 'test-buy-order-id',
    merchant_id: merchantId,
    product_id: productId,
    customer_id: customerId,
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
    ...overrides,
  }
  
  const { data, error } = await supabaseTest
    .from('buy_orders')
    .insert(buyOrder)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Complete test data setup
export const setupCompleteTestData = async () => {
  // Create test user
  const user = await createTestUser()
  
  // Create test merchant
  const merchant = await createTestMerchantInDB()
  
  // Create test product
  const product = await createTestProductInDB(merchant.id)
  
  // Create test customer
  const customer = await createTestCustomerInDB(user.id)
  
  // Create test buy order
  const buyOrder = await createTestBuyOrderInDB(merchant.id, product.id, customer.id)
  
  return {
    user,
    merchant,
    product,
    customer,
    buyOrder
  }
}

// Test environment helpers
export const isTestEnvironment = () => {
  return process.env.NODE_ENV === 'test'
}

export const requireTestEnvironment = () => {
  if (!isTestEnvironment()) {
    throw new Error('This function can only be called in test environment')
  }
}

// Cleanup helper for test teardown
export const cleanupTestData = async () => {
  requireTestEnvironment()
  await clearTestDatabase()
}

// Transaction helpers for testing
export const withTestTransaction = async (testFn: () => Promise<void>) => {
  requireTestEnvironment()
  
  try {
    await setupTestDatabase()
    await testFn()
  } finally {
    await cleanupTestData()
  }
}