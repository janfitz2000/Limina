// Database schema and types for the Shopify price tracking app
import { createClient } from '@supabase/supabase-js'

// Database types
export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string
          shop_domain: string
          access_token: string
          shop_name: string
          shop_email?: string
          plan_name?: string
          currency: string
          timezone?: string
          webhook_endpoints: string[]
          status: 'active' | 'inactive' | 'suspended'
          installed_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['shops']['Row'], 'id' | 'installed_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['shops']['Insert']>
      }
      products: {
        Row: {
          id: string
          shopify_product_id: string
          shop_domain: string
          title: string
          description?: string
          price: number
          current_price: number
          currency: string
          image_url?: string
          product_url?: string
          variant_id?: string
          status: 'active' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      price_alerts: {
        Row: {
          id: string
          product_id: string
          email: string
          target_price: number
          customer_name?: string
          phone?: string
          status: 'active' | 'triggered' | 'expired' | 'cancelled'
          created_at: string
          triggered_at?: string
          expires_at?: string
        }
        Insert: Omit<Database['public']['Tables']['price_alerts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['price_alerts']['Insert']>
      }
      price_history: {
        Row: {
          id: string
          product_id: string
          price: number
          recorded_at: string
        }
        Insert: Omit<Database['public']['Tables']['price_history']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['price_history']['Insert']>
      }
      email_logs: {
        Row: {
          id: string
          email: string
          type: 'price_alert' | 'welcome' | 'confirmation'
          subject: string
          status: 'sent' | 'failed' | 'bounced'
          error_message?: string
          sent_at: string
        }
        Insert: Omit<Database['public']['Tables']['email_logs']['Row'], 'id' | 'sent_at'>
        Update: Partial<Database['public']['Tables']['email_logs']['Insert']>
      }
      app_analytics: {
        Row: {
          id: string
          shop_domain: string
          event_type: string
          event_data: Record<string, any>
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['app_analytics']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['app_analytics']['Insert']>
      }
    }
  }
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

// Database service functions
export class DatabaseService {
  // Shop management
  static async createShop(shopData: Database['public']['Tables']['shops']['Insert']) {
    const { data, error } = await supabase
      .from('shops')
      .insert({
        ...shopData,
        status: 'active',
        webhook_endpoints: []
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getShop(shopDomain: string) {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('shop_domain', shopDomain)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async updateShop(shopDomain: string, updates: Database['public']['Tables']['shops']['Update']) {
    const { data, error } = await supabase
      .from('shops')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('shop_domain', shopDomain)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Product management
  static async upsertProduct(productData: Database['public']['Tables']['products']['Insert']) {
    const { data, error } = await supabase
      .from('products')
      .upsert({
        ...productData,
        status: 'active'
      }, {
        onConflict: 'shopify_product_id,shop_domain',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getProduct(shopifyProductId: string, shopDomain: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shopify_product_id', shopifyProductId)
      .eq('shop_domain', shopDomain)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async getShopProducts(shopDomain: string, limit = 50) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_domain', shopDomain)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  static async updateProductPrice(productId: string, newPrice: number) {
    // Update product
    const { error: productError } = await supabase
      .from('products')
      .update({
        current_price: newPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (productError) throw productError

    // Add to price history
    const { error: historyError } = await supabase
      .from('price_history')
      .insert({
        product_id: productId,
        price: newPrice,
        recorded_at: new Date().toISOString()
      })

    if (historyError) throw historyError

    return true
  }

  // Price alert management
  static async createPriceAlert(alertData: Database['public']['Tables']['price_alerts']['Insert']) {
    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        ...alertData,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getPriceAlerts(productId: string, status?: string) {
    let query = supabase
      .from('price_alerts')
      .select('*')
      .eq('product_id', productId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getAlertsByEmail(email: string) {
    const { data, error } = await supabase
      .from('price_alerts')
      .select(`
        *,
        product:products(*)
      `)
      .eq('email', email)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async updatePriceAlert(alertId: string, updates: Database['public']['Tables']['price_alerts']['Update']) {
    const { data, error } = await supabase
      .from('price_alerts')
      .update(updates)
      .eq('id', alertId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getTriggeredAlerts(productId: string, currentPrice: number) {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'active')
      .gte('target_price', currentPrice)

    if (error) throw error
    return data || []
  }

  // Analytics
  static async logEvent(shopDomain: string, eventType: string, eventData: Record<string, any>) {
    const { error } = await supabase
      .from('app_analytics')
      .insert({
        shop_domain: shopDomain,
        event_type: eventType,
        event_data: eventData
      })

    if (error) {
      console.error('Error logging analytics event:', error)
    }
  }

  static async getShopAnalytics(shopDomain: string, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('app_analytics')
      .select('*')
      .eq('shop_domain', shopDomain)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Email logs
  static async logEmail(logData: Database['public']['Tables']['email_logs']['Insert']) {
    const { error } = await supabase
      .from('email_logs')
      .insert(logData)

    if (error) {
      console.error('Error logging email:', error)
    }
  }

  // Utility functions
  static async getProductPriceHistory(productId: string, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('product_id', productId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getShopStats(shopDomain: string) {
    // Get product count
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('shop_domain', shopDomain)
      .eq('status', 'active')

    // Get active alerts count
    const { count: alertCount } = await supabase
      .from('price_alerts')
      .select('product_id', { count: 'exact', head: true })
      .eq('status', 'active')
      .in('product_id', 
        supabase
          .from('products')
          .select('id')
          .eq('shop_domain', shopDomain)
      )

    // Get triggered alerts count (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: triggeredCount } = await supabase
      .from('price_alerts')
      .select('product_id', { count: 'exact', head: true })
      .eq('status', 'triggered')
      .gte('triggered_at', thirtyDaysAgo.toISOString())
      .in('product_id',
        supabase
          .from('products')
          .select('id')
          .eq('shop_domain', shopDomain)
      )

    return {
      productCount: productCount || 0,
      activeAlerts: alertCount || 0,
      alertsTriggered: triggeredCount || 0
    }
  }
}