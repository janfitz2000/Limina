#!/usr/bin/env tsx

/**
 * Test Data Seeding Script
 * 
 * This script seeds the database with consistent test data for development and testing.
 * Can be run in test or development environments.
 * 
 * Usage:
 *   npm run seed:test              # Seed test data
 *   npm run seed:test -- --clean   # Clean existing data first
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '../src/types/database'

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-key',
  isTestEnvironment: process.env.NODE_ENV === 'test',
  cleanFirst: process.argv.includes('--clean'),
}

// Create Supabase client with service role key for full access
const supabase = createClient<Database>(config.supabaseUrl, config.supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Logging utilities
const log = {
  info: (msg: string) => console.log(`🌱 ${msg}`),
  success: (msg: string) => console.log(`✅ ${msg}`),
  warning: (msg: string) => console.log(`⚠️  ${msg}`),
  error: (msg: string) => console.error(`❌ ${msg}`),
}

// Test data definitions
const testMerchants = [
  {
    id: 'test-merchant-1',
    name: 'Test Electronics Store',
    email: 'electronics@teststore.com',
    stripe_account_id: 'acct_test_electronics',
    webhook_url: 'https://electronics.teststore.com/webhooks',
    platform: 'shopify',
    platform_config: {
      shop_domain: 'electronics-test.myshopify.com',
      access_token: 'test_electronics_token',
    },
    status: 'active',
  },
  {
    id: 'test-merchant-2',
    name: 'Test Clothing Boutique',
    email: 'clothing@testboutique.com',
    stripe_account_id: 'acct_test_clothing',
    webhook_url: 'https://clothing.testboutique.com/webhooks',
    platform: 'woocommerce',
    platform_config: {
      store_url: 'https://clothing.testboutique.com',
      consumer_key: 'ck_test_clothing',
      consumer_secret: 'cs_test_clothing',
    },
    status: 'active',
  },
  {
    id: 'test-merchant-3',
    name: 'Test Book Store',
    email: 'books@testbooks.com',
    stripe_account_id: 'acct_test_books',
    webhook_url: 'https://books.testbooks.com/webhooks',
    platform: 'shopify',
    platform_config: {
      shop_domain: 'books-test.myshopify.com',
      access_token: 'test_books_token',
    },
    status: 'pending',
  },
]

const testProducts = [
  {
    id: 'test-product-1',
    merchant_id: 'test-merchant-1',
    title: 'iPhone 15 Pro',
    description: 'Latest iPhone with advanced features',
    current_price: 999,
    original_price: 1099,
    image_url: 'https://example.com/iphone15pro.jpg',
    platform: 'shopify',
    platform_product_id: 'shopify_iphone_15_pro',
    status: 'active',
    inventory_quantity: 50,
    category: 'Electronics',
  },
  {
    id: 'test-product-2',
    merchant_id: 'test-merchant-1',
    title: 'MacBook Air M2',
    description: 'Powerful laptop for professionals',
    current_price: 1299,
    original_price: 1399,
    image_url: 'https://example.com/macbook-air.jpg',
    platform: 'shopify',
    platform_product_id: 'shopify_macbook_air_m2',
    status: 'active',
    inventory_quantity: 25,
    category: 'Electronics',
  },
  {
    id: 'test-product-3',
    merchant_id: 'test-merchant-2',
    title: 'Designer Dress',
    description: 'Elegant evening dress',
    current_price: 299,
    original_price: 399,
    image_url: 'https://example.com/designer-dress.jpg',
    platform: 'woocommerce',
    platform_product_id: 'woo_designer_dress_001',
    status: 'active',
    inventory_quantity: 10,
    category: 'Clothing',
  },
  {
    id: 'test-product-4',
    merchant_id: 'test-merchant-3',
    title: 'Programming Book Collection',
    description: 'Complete guide to modern programming',
    current_price: 79,
    original_price: 99,
    image_url: 'https://example.com/programming-books.jpg',
    platform: 'shopify',
    platform_product_id: 'shopify_programming_books',
    status: 'active',
    inventory_quantity: 100,
    category: 'Books',
  },
]

const testCustomers = [
  {
    id: 'test-customer-1',
    user_id: 'test-user-1',
    email: 'customer1@test.com',
    name: 'John Doe',
    phone: '+1234567890',
    stripe_customer_id: 'cus_test_customer_1',
  },
  {
    id: 'test-customer-2',
    user_id: 'test-user-2',
    email: 'customer2@test.com',
    name: 'Jane Smith',
    phone: '+1987654321',
    stripe_customer_id: 'cus_test_customer_2',
  },
  {
    id: 'test-customer-3',
    user_id: 'test-user-3',
    email: 'customer3@test.com',
    name: 'Bob Johnson',
    phone: '+1122334455',
    stripe_customer_id: 'cus_test_customer_3',
  },
]

const testBuyOrders = [
  {
    id: 'test-buy-order-1',
    merchant_id: 'test-merchant-1',
    product_id: 'test-product-1',
    customer_id: 'test-customer-1',
    customer_email: 'customer1@test.com',
    customer_name: 'John Doe',
    target_price: 899,
    current_price: 999,
    status: 'monitoring',
    payment_status: 'authorized',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    condition_value: {
      payment_intent_id: 'pi_test_order_1',
      escrow_amount: 899,
      platform_fee: 22.48,
    },
  },
  {
    id: 'test-buy-order-2',
    merchant_id: 'test-merchant-1',
    product_id: 'test-product-2',
    customer_id: 'test-customer-2',
    customer_email: 'customer2@test.com',
    customer_name: 'Jane Smith',
    target_price: 1199,
    current_price: 1299,
    status: 'monitoring',
    payment_status: 'authorized',
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    condition_value: {
      payment_intent_id: 'pi_test_order_2',
      escrow_amount: 1199,
      platform_fee: 29.98,
    },
  },
  {
    id: 'test-buy-order-3',
    merchant_id: 'test-merchant-2',
    product_id: 'test-product-3',
    customer_id: 'test-customer-3',
    customer_email: 'customer3@test.com',
    customer_name: 'Bob Johnson',
    target_price: 249,
    current_price: 299,
    status: 'fulfilled',
    payment_status: 'captured',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    condition_value: {
      payment_intent_id: 'pi_test_order_3',
      escrow_amount: 249,
      platform_fee: 6.23,
      fulfilled_at: new Date().toISOString(),
    },
  },
]

const testMerchantDiscounts = [
  {
    id: 'test-discount-1',
    merchant_id: 'test-merchant-1',
    customer_email: 'customer1@test.com',
    discount_type: 'percentage',
    discount_value: 10,
    max_uses: 1,
    used_count: 0,
    active: true,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    conditions: {
      min_order_amount: 500,
      products: ['test-product-1', 'test-product-2'],
    },
  },
]

const testEscrowPayments = [
  {
    id: 'test-escrow-1',
    buy_order_id: 'test-buy-order-1',
    stripe_payment_intent_id: 'pi_test_order_1',
    stripe_payment_method_id: 'pm_test_card_1',
    escrow_amount: 899,
    platform_fee: 22.48,
    merchant_amount: 876.52,
    status: 'held',
  },
  {
    id: 'test-escrow-2',
    buy_order_id: 'test-buy-order-2',
    stripe_payment_intent_id: 'pi_test_order_2',
    stripe_payment_method_id: 'pm_test_card_2',
    escrow_amount: 1199,
    platform_fee: 29.98,
    merchant_amount: 1169.02,
    status: 'held',
  },
  {
    id: 'test-escrow-3',
    buy_order_id: 'test-buy-order-3',
    stripe_payment_intent_id: 'pi_test_order_3',
    stripe_payment_method_id: 'pm_test_card_3',
    escrow_amount: 249,
    platform_fee: 6.23,
    merchant_amount: 242.77,
    status: 'captured',
    captured_at: new Date().toISOString(),
  },
]

// Utility functions
const clearTable = async (tableName: string) => {
  const { error } = await supabase.from(tableName).delete().neq('id', '__never_match__')
  if (error) {
    log.error(`Failed to clear table ${tableName}: ${error.message}`)
    throw error
  }
  log.info(`Cleared table: ${tableName}`)
}

const seedTable = async (tableName: string, data: any[]) => {
  if (data.length === 0) {
    log.warning(`No data to seed for table: ${tableName}`)
    return
  }

  const { error } = await supabase.from(tableName).insert(data)
  if (error) {
    log.error(`Failed to seed table ${tableName}: ${error.message}`)
    throw error
  }
  log.success(`Seeded ${data.length} records in table: ${tableName}`)
}

// Main seeding functions
const clearAllTestData = async () => {
  log.info('Clearing existing test data...')
  
  // Clear in reverse order of dependencies
  const tables = [
    'notifications',
    'webhook_logs',
    'escrow_payments',
    'merchant_discounts',
    'buy_orders',
    'products',
    'customers',
    'integrations',
    'merchants',
  ]
  
  for (const table of tables) {
    await clearTable(table)
  }
  
  log.success('All test data cleared')
}

const seedAllTestData = async () => {
  log.info('Seeding test data...')
  
  // Seed in order of dependencies
  await seedTable('merchants', testMerchants)
  await seedTable('customers', testCustomers)
  await seedTable('products', testProducts)
  await seedTable('buy_orders', testBuyOrders)
  await seedTable('merchant_discounts', testMerchantDiscounts)
  await seedTable('escrow_payments', testEscrowPayments)
  
  log.success('All test data seeded successfully')
}

const validateSeededData = async () => {
  log.info('Validating seeded data...')
  
  const checks = [
    { table: 'merchants', expected: testMerchants.length },
    { table: 'customers', expected: testCustomers.length },
    { table: 'products', expected: testProducts.length },
    { table: 'buy_orders', expected: testBuyOrders.length },
    { table: 'merchant_discounts', expected: testMerchantDiscounts.length },
    { table: 'escrow_payments', expected: testEscrowPayments.length },
  ]
  
  for (const check of checks) {
    const { count, error } = await supabase
      .from(check.table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      log.error(`Failed to validate ${check.table}: ${error.message}`)
      continue
    }
    
    if (count === check.expected) {
      log.success(`${check.table}: ${count} records (expected: ${check.expected})`)
    } else {
      log.warning(`${check.table}: ${count} records (expected: ${check.expected})`)
    }
  }
}

// Main execution
const main = async () => {
  try {
    log.info('Starting test data seeding process...')
    log.info(`Environment: ${config.isTestEnvironment ? 'test' : 'development'}`)
    log.info(`Supabase URL: ${config.supabaseUrl}`)
    log.info(`Clean first: ${config.cleanFirst}`)
    
    if (config.cleanFirst) {
      await clearAllTestData()
    }
    
    await seedAllTestData()
    await validateSeededData()
    
    log.success('Test data seeding completed successfully!')
    log.info('')
    log.info('You can now:')
    log.info('  - Run tests: npm run test')
    log.info('  - View data in Supabase Studio: http://localhost:54323')
    log.info('  - Test API endpoints with the seeded data')
    
  } catch (error) {
    log.error(`Seeding failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

// Handle different script modes
if (process.argv.includes('--clear-only')) {
  clearAllTestData()
    .then(() => log.success('Test data cleared'))
    .catch((error) => {
      log.error(`Clear failed: ${error.message}`)
      process.exit(1)
    })
} else if (process.argv.includes('--validate-only')) {
  validateSeededData()
    .then(() => log.success('Validation completed'))
    .catch((error) => {
      log.error(`Validation failed: ${error.message}`)
      process.exit(1)
    })
} else {
  main()
}