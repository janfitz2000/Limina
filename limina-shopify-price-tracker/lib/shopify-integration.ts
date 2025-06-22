// Extracted and simplified Shopify integration for price tracking app
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface Product {
  id: string
  shopify_product_id: string
  shop_domain: string
  title: string
  description?: string
  price: number
  current_price: number
  currency: string
  image_url?: string
  created_at?: string
  updated_at?: string
}

export interface PriceAlert {
  id: string
  product_id: string
  email: string
  target_price: number
  customer_name?: string
  status: 'active' | 'triggered' | 'expired'
  created_at: string
  triggered_at?: string
}

export class ShopifyPriceTracker {
  private shopDomain: string
  private accessToken: string
  private apiUrl: string
  private headers: Record<string, string>

  constructor(shopDomain: string, accessToken: string) {
    this.shopDomain = shopDomain
    this.accessToken = accessToken
    this.apiUrl = `https://${shopDomain}/admin/api/2024-01`
    this.headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    }
  }

  // Sync products from Shopify to our database
  async syncProducts(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    try {
      const response = await fetch(`${this.apiUrl}/products.json`, {
        headers: this.headers
      })
      
      const data = await response.json()
      const products = data.products || []
      
      let synced = 0
      const errors: string[] = []

      for (const shopifyProduct of products) {
        try {
          const product: Omit<Product, 'id'> = {
            shopify_product_id: shopifyProduct.id.toString(),
            shop_domain: this.shopDomain,
            title: shopifyProduct.title,
            description: shopifyProduct.body_html,
            price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
            current_price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
            currency: 'USD', // Get from shop settings
            image_url: shopifyProduct.images[0]?.src
          }

          const { error } = await supabase
            .from('products')
            .upsert(product, { 
              onConflict: 'shopify_product_id,shop_domain',
              ignoreDuplicates: false 
            })

          if (error) {
            errors.push(`Failed to sync ${shopifyProduct.title}: ${error.message}`)
          } else {
            synced++
          }
        } catch (err) {
          errors.push(`Error processing ${shopifyProduct.title}: ${err}`)
        }
      }

      return { success: errors.length === 0, synced, errors }
    } catch (error) {
      console.error('Error in syncProducts:', error)
      return { success: false, synced: 0, errors: ['Sync failed'] }
    }
  }

  // Handle product update webhooks
  async handleProductUpdate(productData: any): Promise<void> {
    try {
      const variants = productData.variants || []
      const currentPrice = parseFloat(variants[0]?.price || '0')
      
      // Update product in database
      const { data: product, error } = await supabase
        .from('products')
        .update({ 
          current_price: currentPrice,
          title: productData.title,
          description: productData.body_html,
          image_url: productData.images[0]?.src,
          updated_at: new Date().toISOString()
        })
        .eq('shopify_product_id', productData.id.toString())
        .eq('shop_domain', this.shopDomain)
        .select()
        .single()

      if (error) {
        console.error('Error updating product:', error)
        return
      }

      // Record price history
      await supabase
        .from('price_history')
        .insert({
          product_id: product.id,
          price: currentPrice,
          recorded_at: new Date().toISOString()
        })

      // Check for triggered price alerts
      await this.checkPriceAlerts(product.id, currentPrice)
    } catch (error) {
      console.error('Error in handleProductUpdate:', error)
    }
  }

  // Check if any price alerts should be triggered
  private async checkPriceAlerts(productId: string, currentPrice: number): Promise<void> {
    try {
      // Get active price alerts where target price is met or exceeded (price dropped to target)
      const { data: alerts, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'active')
        .gte('target_price', currentPrice) // Target price is greater than or equal to current price

      if (error) {
        console.error('Error fetching price alerts:', error)
        return
      }

      // Trigger alerts
      for (const alert of alerts || []) {
        await this.triggerPriceAlert(alert, currentPrice)
      }
    } catch (error) {
      console.error('Error in checkPriceAlerts:', error)
    }
  }

  // Trigger a price alert (send email notification)
  private async triggerPriceAlert(alert: PriceAlert, currentPrice: number): Promise<void> {
    try {
      // Get product details
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', alert.product_id)
        .single()

      if (!product) return

      // Update alert status
      await supabase
        .from('price_alerts')
        .update({
          status: 'triggered',
          triggered_at: new Date().toISOString()
        })
        .eq('id', alert.id)

      // Send email notification (will implement email service)
      await this.sendPriceAlertEmail({
        email: alert.email,
        customerName: alert.customer_name,
        productTitle: product.title,
        targetPrice: alert.target_price,
        currentPrice: currentPrice,
        productUrl: `https://${this.shopDomain}/products/${product.shopify_product_id}`,
        imageUrl: product.image_url
      })

      console.log(`Price alert triggered for ${alert.email} - ${product.title}`)
    } catch (error) {
      console.error('Error in triggerPriceAlert:', error)
    }
  }

  // Send price alert email
  private async sendPriceAlertEmail(data: {
    email: string
    customerName?: string
    productTitle: string
    targetPrice: number
    currentPrice: number
    productUrl: string
    imageUrl?: string
  }): Promise<void> {
    // This will be implemented with email service (Resend)
    console.log('Sending price alert email:', data)
    
    // TODO: Implement actual email sending
    // await emailService.sendPriceAlert(data)
  }

  // Create webhook for product updates
  async createProductUpdateWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const webhookData = {
        webhook: {
          topic: 'products/update',
          address: webhookUrl,
          format: 'json'
        }
      }

      const response = await fetch(`${this.apiUrl}/webhooks.json`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(webhookData)
      })

      return response.ok
    } catch (error) {
      console.error('Error creating webhook:', error)
      return false
    }
  }
}

// Price Alert Service
export class PriceAlertService {
  // Create a new price alert
  static async createPriceAlert(data: {
    productId: string
    email: string
    targetPrice: number
    customerName?: string
  }): Promise<{ success: boolean; alert?: PriceAlert; error?: string }> {
    try {
      const alert: Omit<PriceAlert, 'id'> = {
        product_id: data.productId,
        email: data.email,
        target_price: data.targetPrice,
        customer_name: data.customerName,
        status: 'active',
        created_at: new Date().toISOString()
      }

      const { data: createdAlert, error } = await supabase
        .from('price_alerts')
        .insert(alert)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, alert: createdAlert }
    } catch (error) {
      return { success: false, error: 'Failed to create price alert' }
    }
  }

  // Get price alerts for a product
  static async getProductPriceAlerts(productId: string): Promise<PriceAlert[]> {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching price alerts:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getProductPriceAlerts:', error)
      return []
    }
  }

  // Cancel a price alert
  static async cancelPriceAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .update({ status: 'expired' })
        .eq('id', alertId)

      return !error
    } catch (error) {
      console.error('Error canceling price alert:', error)
      return false
    }
  }

  // Get price alerts by email
  static async getAlertsByEmail(email: string): Promise<PriceAlert[]> {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select(`
          *,
          product:products(*)
        `)
        .eq('email', email)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching alerts by email:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAlertsByEmail:', error)
      return []
    }
  }
}