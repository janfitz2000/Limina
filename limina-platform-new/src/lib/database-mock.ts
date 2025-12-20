// Mock database implementation for testing when Supabase tables don't exist
import { BuyOrder, Customer, Merchant, Product } from './database'

// Mock data
const mockMerchants: Merchant[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Snowboard Shop',
    email: 'test@testmerchant.com',
    shopify_domain: 'limina-test.myshopify.com',
    shopify_access_token: 'test-token',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  }
]

const mockCustomers: Customer[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'customer@example.com',
    name: 'Test Customer',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  }
]

const mockProducts: Product[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    merchant_id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'The Collection Snowboard: Hydrogen',
    description: 'Stylized hydrogen bonds snowboard design',
    price: 600.00,
    current_price: 600.00,
    currency: 'GBP',
    image_url: 'https://limina-test.myshopify.com/cdn/shop/files/hydrogen.jpg',
    shopify_product_id: 'hydrogen-snowboard',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    merchant_id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'The Collection Snowboard: Liquid',
    description: 'Water, trees, mountains design',
    price: 749.95,
    current_price: 749.95,
    currency: 'GBP',
    image_url: 'https://limina-test.myshopify.com/cdn/shop/files/liquid.jpg',
    shopify_product_id: 'liquid-snowboard',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    merchant_id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'The Complete Snowboard',
    description: 'Complete snowboard with abstract design',
    price: 699.95,
    current_price: 699.95,
    currency: 'GBP',
    image_url: 'https://limina-test.myshopify.com/cdn/shop/files/complete.jpg',
    shopify_product_id: 'complete-snowboard',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  }
]

const mockBuyOrders: BuyOrder[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    merchant_id: '550e8400-e29b-41d4-a716-446655440000',
    product_id: '550e8400-e29b-41d4-a716-446655440002',
    customer_id: '550e8400-e29b-41d4-a716-446655440001',
    customer_email: 'customer@example.com',
    customer_name: 'Test Customer',
    target_price: 550.00,
    current_price: 600.00,
    currency: 'GBP',
    status: 'monitoring',
    condition_type: 'price',
    condition_value: {},
    expires_at: '2025-09-03T00:00:00.000Z',
    created_at: '2025-08-01T00:00:00.000Z',
    updated_at: '2025-08-01T00:00:00.000Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    merchant_id: '550e8400-e29b-41d4-a716-446655440000',
    product_id: '550e8400-e29b-41d4-a716-446655440003',
    customer_id: '550e8400-e29b-41d4-a716-446655440001',
    customer_email: 'customer@example.com',
    customer_name: 'Test Customer',
    target_price: 700.00,
    current_price: 749.95,
    currency: 'GBP',
    status: 'monitoring',
    condition_type: 'price',
    condition_value: {},
    expires_at: '2025-10-03T00:00:00.000Z',
    created_at: '2025-08-02T00:00:00.000Z',
    updated_at: '2025-08-02T00:00:00.000Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    merchant_id: '550e8400-e29b-41d4-a716-446655440000',
    product_id: '550e8400-e29b-41d4-a716-446655440004',
    customer_id: '550e8400-e29b-41d4-a716-446655440001',
    customer_email: 'customer@example.com',
    customer_name: 'Test Customer',
    target_price: 650.00,
    current_price: 650.00,
    currency: 'GBP',
    status: 'fulfilled',
    condition_type: 'price',
    condition_value: {},
    expires_at: '2025-09-15T00:00:00.000Z',
    fulfilled_at: '2025-07-30T12:00:00.000Z',
    created_at: '2025-07-28T00:00:00.000Z',
    updated_at: '2025-07-30T00:00:00.000Z'
  }
]

// Mock database functions
export const getMockBuyOrders = async (merchantId?: string, customerId?: string) => {
  const filtered = mockBuyOrders.filter(order => 
    (!merchantId || order.merchant_id === merchantId) &&
    (!customerId || order.customer_id === customerId)
  )
  
  return { data: filtered, error: null }
}

export const getMockMerchantStats = async (merchantId: string) => {
  const orders = mockBuyOrders.filter(o => o.merchant_id === merchantId)
  const activeOrders = orders.filter(o => o.status === 'monitoring').length
  const fulfilledOrders = orders.filter(o => o.status === 'fulfilled').length
  const totalRevenue = orders
    .filter(o => o.status === 'fulfilled')
    .reduce((sum, o) => sum + o.target_price, 0)
  
  return {
    data: {
      activeOrders,
      fulfilledOrders,
      totalRevenue,
      conversionRate: fulfilledOrders / Math.max(orders.length, 1) * 100
    },
    error: null
  }
}

export const getMockCustomerStats = async (customerId: string) => {
  const orders = mockBuyOrders.filter(o => o.customer_id === customerId)
  const activeOrders = orders.filter(o => o.status === 'monitoring').length
  const fulfilledOrders = orders.filter(o => o.status === 'fulfilled').length
  const totalSavings = orders
    .filter(o => o.status === 'fulfilled')
    .reduce((sum, o) => sum + (o.current_price - o.target_price), 0)
  
  return {
    data: {
      activeOrders,
      fulfilledOrders,
      totalSavings
    },
    error: null
  }
}

export const createMockBuyOrder = async (orderData: any) => {
  const newOrder: BuyOrder = {
    id: `mock-${Date.now()}`,
    merchant_id: orderData.merchantId,
    product_id: orderData.productId,
    customer_id: orderData.customerId || '550e8400-e29b-41d4-a716-446655440001',
    customer_email: orderData.customerEmail,
    customer_name: orderData.customerName || 'Test Customer',
    target_price: orderData.targetPrice,
    current_price: orderData.currentPrice,
    currency: 'GBP',
    status: 'monitoring',
    condition_type: 'price',
    condition_value: orderData.conditionValue || {},
    expires_at: new Date(Date.now() + orderData.expiryDays * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  mockBuyOrders.push(newOrder)
  return { data: newOrder, error: null }
}

export const getMockProducts = async (merchantId?: string) => {
  const filtered = merchantId 
    ? mockProducts.filter(p => p.merchant_id === merchantId)
    : mockProducts
  
  return { data: filtered, error: null }
}

export const getMockMerchants = async () => {
  return { data: mockMerchants, error: null }
}

export const getMockCustomers = async () => {
  return { data: mockCustomers, error: null }
}