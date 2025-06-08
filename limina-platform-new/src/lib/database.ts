import { createClient } from '@supabase/supabase-js'

// Use service role for backend operations to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Basic types for our data
export type Merchant = {
  id: string
  name: string
  email: string
  shopify_domain?: string | null
  shopify_access_token?: string | null
  created_at: string
  updated_at: string
}

export type Customer = {
  id: string
  email: string
  name?: string | null
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  merchant_id: string
  title: string
  description?: string | null
  price: number
  current_price: number
  currency: string
  image_url?: string | null
  shopify_product_id?: string | null
  created_at: string
  updated_at: string
}

export type BuyOrder = {
  id: string
  merchant_id: string
  product_id: string
  customer_id: string
  customer_email: string
  customer_name?: string | null
  target_price: number
  current_price: number
  currency: string
  status: 'pending' | 'monitoring' | 'fulfilled' | 'cancelled' | 'expired'
  condition_type: 'price' | 'inventory' | 'date'
  condition_value: Record<string, unknown>
  expires_at: string
  fulfilled_at?: string | null
  created_at: string
  updated_at: string
  products?: Product
  customers?: Customer
}

// Merchant Functions
export async function getMerchant(id: string) {
  try {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  } catch (error: unknown) {
    console.error('Error fetching merchant:', error)
    return { data: null, error }
  }
}

// Customer Functions
export async function getCustomer(email: string) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single()

    return { data, error }
  } catch (error: unknown) {
    console.error('Error fetching customer:', error)
    return { data: null, error }
  }
}

export async function getOrCreateCustomer(email: string, name?: string) {
  try {
    // Try to get existing customer
    const { data: existingCustomer } = await getCustomer(email)
    
    if (existingCustomer) {
      return { data: existingCustomer, error: null }
    }
    
    // Create new customer if doesn't exist
    const { data, error } = await supabase
      .from('customers')
      .insert({ email, name })
      .select()
      .single()

    return { data, error }
  } catch (error: unknown) {
    console.error('Error creating customer:', error)
    return { data: null, error }
  }
}

// Product Functions
export async function getProducts(merchantId: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })

    return { data, error }
  } catch (error: unknown) {
    console.error('Error fetching products:', error)
    return { data: null, error }
  }
}

export async function createProduct(product: {
  merchant_id: string
  title: string
  description?: string | null
  price: number
  current_price: number
  currency?: string
  image_url?: string | null
  shopify_product_id?: string | null
}) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    return { data, error }
  } catch (error: unknown) {
    console.error('Error creating product:', error)
    return { data: null, error }
  }
}

export async function updateProductPrice(productId: string, newPrice: number) {
  try {
    // Insert price history
    await supabase
      .from('price_history')
      .insert({
        product_id: productId,
        price: newPrice
      })

    // Update product current_price
    const { data, error } = await supabase
      .from('products')
      .update({ current_price: newPrice })
      .eq('id', productId)
      .select()
      .single()

    return { data, error }
  } catch (error: unknown) {
    console.error('Error updating product price:', error)
    return { data: null, error }
  }
}

// Buy Order Functions
export async function getBuyOrders(merchantId?: string, customerId?: string) {
  try {
    let query = supabase
      .from('buy_orders')
      .select(`
        *,
        products (
          id,
          title,
          price,
          current_price,
          currency,
          image_url
        ),
        customers (
          id,
          email,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (merchantId) {
      query = query.eq('merchant_id', merchantId)
    }
    
    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    const { data, error } = await query
    return { data, error }
  } catch (error: unknown) {
    console.error('Error fetching buy orders:', error)
    return { data: null, error }
  }
}

export async function createBuyOrder(orderData: {
  merchantId: string
  productId: string
  customerEmail: string
  customerName?: string
  targetPrice: number
  currentPrice: number
  expiryDays: number
  conditionValue?: Record<string, unknown>
}) {
  try {
    // Get or create customer
    const { data: customer, error: customerError } = await getOrCreateCustomer(
      orderData.customerEmail, 
      orderData.customerName
    )
    
    if (customerError || !customer) {
      throw new Error('Failed to create customer')
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + orderData.expiryDays)

    const buyOrder = {
      merchant_id: orderData.merchantId,
      product_id: orderData.productId,
      customer_id: customer.id,
      customer_email: orderData.customerEmail,
      customer_name: orderData.customerName,
      target_price: orderData.targetPrice,
      current_price: orderData.currentPrice,
      status: 'monitoring' as const,
      condition_type: 'price' as const,
      condition_value: orderData.conditionValue || {},
      expires_at: expiresAt.toISOString()
    }

    const { data, error } = await supabase
      .from('buy_orders')
      .insert(buyOrder)
      .select(`
        *,
        products (
          id,
          title,
          price,
          current_price,
          currency,
          image_url
        )
      `)
      .single()

    return { data, error }
  } catch (error: unknown) {
    console.error('Error creating buy order:', error)
    return { data: null, error }
  }
}

export async function updateBuyOrderStatus(
  id: string, 
  status: 'pending' | 'monitoring' | 'fulfilled' | 'cancelled' | 'expired'
) {
  try {
    const updateData: Record<string, unknown> = { status }
    
    if (status === 'fulfilled') {
      updateData.fulfilled_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('buy_orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  } catch (error: unknown) {
    console.error('Error updating buy order status:', error)
    return { data: null, error }
  }
}

// Analytics Functions
export async function getMerchantStats(merchantId: string) {
  try {
    const { data: orders, error } = await supabase
      .from('buy_orders')
      .select('status, target_price, current_price')
      .eq('merchant_id', merchantId)

    if (error) throw error

    const stats = {
      total: orders?.length || 0,
      monitoring: orders?.filter(order => order.status === 'monitoring').length || 0,
      fulfilled: orders?.filter(order => order.status === 'fulfilled').length || 0,
      pending: orders?.filter(order => order.status === 'pending').length || 0,
      cancelled: orders?.filter(order => order.status === 'cancelled').length || 0,
      totalRevenue: orders
        ?.filter(order => order.status === 'fulfilled')
        .reduce((sum, order) => sum + Number(order.target_price), 0) || 0,
      avgDiscount: 0,
      conversionRate: 0
    }

    // Calculate average discount and conversion rate
    const fulfilledOrders = orders?.filter(order => order.status === 'fulfilled') || []
    if (fulfilledOrders.length > 0) {
      const totalDiscount = fulfilledOrders.reduce((sum, order) => {
        const discount = ((Number(order.current_price) - Number(order.target_price)) / Number(order.current_price)) * 100
        return sum + discount
      }, 0)
      
      stats.avgDiscount = Math.round(totalDiscount / fulfilledOrders.length)
      stats.conversionRate = Math.round((fulfilledOrders.length / (orders?.length || 1)) * 100)
    }

    return { data: stats, error: null }
  } catch (error: unknown) {
    console.error('Error fetching merchant stats:', error)
    return { data: null, error }
  }
}

export async function getCustomerStats(customerId: string) {
  try {
    const { data: orders, error } = await supabase
      .from('buy_orders')
      .select('status, target_price, current_price')
      .eq('customer_id', customerId)

    if (error) throw error

    const stats = {
      total: orders?.length || 0,
      monitoring: orders?.filter(order => order.status === 'monitoring').length || 0,
      fulfilled: orders?.filter(order => order.status === 'fulfilled').length || 0,
      totalSavings: orders
        ?.filter(order => order.status === 'fulfilled')
        .reduce((sum, order) => sum + (Number(order.current_price) - Number(order.target_price)), 0) || 0
    }

    return { data: stats, error: null }
  } catch (error: unknown) {
    console.error('Error fetching customer stats:', error)
    return { data: null, error }
  }
}

// Real-time subscriptions
export function subscribeToBuyOrders(merchantId: string, callback: (payload: Record<string, unknown>) => void) {
  return supabase
    .channel('buy_orders_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'buy_orders',
        filter: `merchant_id=eq.${merchantId}`
      },
      callback
    )
    .subscribe()
}

export function subscribeToCustomerOrders(customerId: string, callback: (payload: Record<string, unknown>) => void) {
  return supabase
    .channel('customer_orders_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'buy_orders',
        filter: `customer_id=eq.${customerId}`
      },
      callback
    )
    .subscribe()
}

// Merchant Discount Functions
export type MerchantDiscount = {
  id: string
  merchant_id: string
  product_id: string
  discount_price: number
  target_buy_order_ids?: string[] | null
  target_customer_emails?: string[] | null
  max_uses?: number | null
  current_uses: number
  expires_at?: string | null
  created_at: string
  updated_at: string
  status: 'active' | 'used_up' | 'expired' | 'cancelled'
}

export async function createMerchantDiscount(discount: {
  merchantId: string
  productId: string
  discountPrice: number
  targetBuyOrderIds?: string[]
  targetCustomerEmails?: string[]
  maxUses?: number
  expiryHours?: number
}) {
  try {
    let expiresAt = null
    if (discount.expiryHours && discount.expiryHours > 0) {
      const expiry = new Date()
      expiry.setHours(expiry.getHours() + discount.expiryHours)
      expiresAt = expiry.toISOString()
    }

    const { data, error } = await supabase
      .from('merchant_discounts')
      .insert({
        merchant_id: discount.merchantId,
        product_id: discount.productId,
        discount_price: discount.discountPrice,
        target_buy_order_ids: discount.targetBuyOrderIds || null,
        target_customer_emails: discount.targetCustomerEmails || null,
        max_uses: discount.maxUses || null,
        expires_at: expiresAt
      })
      .select()
      .single()

    return { data, error }
  } catch (error: unknown) {
    console.error('Error creating merchant discount:', error)
    return { data: null, error }
  }
}

export async function getMerchantDiscounts(merchantId: string, productId?: string) {
  try {
    let query = supabase
      .from('merchant_discounts')
      .select(`
        *,
        products (
          id,
          title,
          current_price,
          currency
        )
      `)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data, error } = await query
    return { data, error }
  } catch (error: unknown) {
    console.error('Error fetching merchant discounts:', error)
    return { data: null, error }
  }
}

export async function activateDiscount(discountId: string) {
  try {
    const { data, error } = await supabase
      .rpc('check_discount_fulfillment', { discount_id: discountId })

    return { data, error }
  } catch (error: unknown) {
    console.error('Error activating discount:', error)
    return { data: null, error }
  }
}

export async function cancelDiscount(discountId: string) {
  try {
    const { data, error } = await supabase
      .from('merchant_discounts')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', discountId)
      .select()
      .single()

    return { data, error }
  } catch (error: unknown) {
    console.error('Error cancelling discount:', error)
    return { data: null, error }
  }
}
