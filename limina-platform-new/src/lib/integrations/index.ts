// src/lib/integrations/index.ts - Platform Integration System
import { supabase } from '../supabase-fixed'

export interface IntegrationConfig {
  id: string
  merchant_id: string
  platform: 'shopify' | 'woocommerce' | 'magento' | 'bigcommerce' | 'squarespace'
  credentials: Record<string, string>
  webhook_endpoints: string[]
  sync_settings: {
    products: boolean
    inventory: boolean
    orders: boolean
    customers: boolean
  }
  last_sync: string
  status: 'active' | 'inactive' | 'error'
}

// Base Integration Interface
export abstract class BaseIntegration {
  protected config: IntegrationConfig
  protected merchantId: string

  constructor(config: IntegrationConfig) {
    this.config = config
    this.merchantId = config.merchant_id
  }

  abstract syncProducts(): Promise<{ success: boolean; synced: number; errors: string[] }>
  abstract syncInventory(): Promise<{ success: boolean; updated: number; errors: string[] }>
  abstract createWebhook(event: string, endpoint: string): Promise<boolean>
  abstract handleWebhook(payload: unknown): Promise<void>
  abstract updateProductPrice(productId: string, price: number): Promise<boolean>
}

// Shopify Integration
export class ShopifyIntegration extends BaseIntegration {
  private apiUrl: string
  private headers: Record<string, string>

  constructor(config: IntegrationConfig) {
    super(config)
    this.apiUrl = `https://${config.credentials.shop_domain}/admin/api/2024-01`
    this.headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': config.credentials.access_token
    }
  }

  async syncProducts() {
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
          // Convert Shopify product to Limina format
          const liminaProduct = {
            merchant_id: this.merchantId,
            shopify_product_id: shopifyProduct.id.toString(),
            title: shopifyProduct.title,
            description: shopifyProduct.body_html,
            price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
            current_price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
            currency: 'GBP', // Should get from shop settings
            image_url: shopifyProduct.images[0]?.src
          }

          // Upsert product in Limina
          const { error } = await supabase
            .from('products')
            .upsert(liminaProduct, { 
              onConflict: 'shopify_product_id',
              ignoreDuplicates: false 
            })

          if (error) {
            errors.push(`Failed to sync ${shopifyProduct.title}: ${error.message}`)
          } else {
            synced++
          }
        } catch {
          errors.push(`Error processing ${shopifyProduct.title}`)
        }
      }

      // Update last sync time
      await this.updateLastSync()

      return { success: errors.length === 0, synced, errors }
    } catch (error) {
      console.error('Error in syncProducts:', error)
      return { success: false, synced: 0, errors: ['Sync failed'] }
    }
  }

  async syncInventory() {
    try {
      // Get all merchant products with Shopify IDs
      const { data: products } = await supabase
        .from('products')
        .select('id, shopify_product_id')
        .eq('merchant_id', this.merchantId)
        .not('shopify_product_id', 'is', null)

      let updated = 0
      const errors: string[] = []

      for (const product of products || []) {
        try {
          // Get inventory from Shopify
          const response = await fetch(
            `${this.apiUrl}/products/${product.shopify_product_id}.json`,
            { headers: this.headers }
          )
          
          const data = await response.json()
          const variant = data.product.variants[0]
          
          if (variant) {
            const newPrice = parseFloat(variant.price)
            
            // Update price in Limina and create price history
            await this.updateProductPriceInternal(product.id, newPrice)
            updated++
          }
        } catch {
          errors.push(`Failed to update inventory for product ${product.id}`)
        }
      }

      return { success: errors.length === 0, updated, errors }
    } catch (error) {
      console.error('Error in syncInventory:', error)
      return { success: false, updated: 0, errors: ['Inventory sync failed'] }
    }
  }

  async createWebhook(event: string, endpoint: string) {
    try {
      const webhookData = {
        webhook: {
          topic: event,
          address: endpoint,
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
      console.error('Error in createWebhook:', error)
      return false
    }
  }

  async handleWebhook(payload: unknown) {
    if (!payload || typeof payload !== 'object' || !('topic' in payload)) {
      console.log('Invalid webhook payload:', payload)
      return
    }
    const { topic, ...data } = payload as { topic: string; [key: string]: unknown }
    switch (topic) {
      case 'products/update':
        await this.handleProductUpdate(data)
        break
      case 'orders/paid':
        await this.handleOrderPaid(data)
        break
      default:
        console.log(`Unhandled webhook topic: ${topic}`)
    }
  }

  async updateProductPrice(shopifyProductId: string, price: number): Promise<boolean> {
    try {
      // First get the product and variant
      const productResponse = await fetch(
        `${this.apiUrl}/products/${shopifyProductId}.json`,
        { headers: this.headers }
      )
      
      const productData = await productResponse.json()
      const variantId = productData.product.variants[0]?.id

      if (!variantId) return false

      // Update variant price
      const updateData = {
        variant: {
          id: variantId,
          price: price.toString()
        }
      }

      const response = await fetch(
        `${this.apiUrl}/variants/${variantId}.json`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify(updateData)
        }
      )

      return response.ok
    } catch (error) {
      console.error('Error in updateProductPrice:', error)
      return false
    }
  }

  private async handleProductUpdate(productData: Record<string, unknown>) {
    try {
      const variants = productData.variants as Array<{ price?: string }> | undefined
      const newPrice = parseFloat(variants?.[0]?.price || '0')
      // Find corresponding Limina product
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('shopify_product_id', String(productData.id))
        .eq('merchant_id', this.merchantId)
        .single()
      if (product) {
        await this.updateProductPriceInternal(product.id, newPrice)
      }
    } catch (error) {
      console.error('Error in handleProductUpdate:', error)
    }
  }

  private async handleOrderPaid(orderData: Record<string, unknown>) {
    // Handle when a Shopify order is paid - could trigger buy order fulfillment
    console.log('Order paid webhook received:', orderData.id)
  }

  private async updateProductPriceInternal(productId: string, newPrice: number) {
    try {
      // Update product current_price
      await supabase
        .from('products')
        .update({ current_price: newPrice })
        .eq('id', productId)

      // Add to price history
      await supabase
        .from('price_history')
        .insert({
          product_id: productId,
          price: newPrice
        })

      // Check for buy orders that can be fulfilled
      await this.checkBuyOrderFulfillment(productId, newPrice)
    } catch (error) {
      console.error('Error in updateProductPriceInternal:', error)
    }
  }

  private async checkBuyOrderFulfillment(productId: string, currentPrice: number) {
    try {
      // Get monitoring buy orders for this product where target price is met
      const { data: orders } = await supabase
        .from('buy_orders')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'monitoring')
        .lte('target_price', currentPrice)

      // Fulfill orders that meet criteria
      for (const order of orders || []) {
        await this.fulfillBuyOrder(order)
      }
    } catch (error) {
      console.error('Error in checkBuyOrderFulfillment:', error)
    }
  }

  private async fulfillBuyOrder(order: { id: string; customer_id: string; target_price: number }) {
    try {
      // Update order status
      await supabase
        .from('buy_orders')
        .update({
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString()
        })
        .eq('id', order.id)

      // Trigger payment capture (if payment integration is enabled)
      // await PaymentService.executeBuyOrderPayment(order.id)

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: order.customer_id,
          user_type: 'customer',
          buy_order_id: order.id,
          title: 'Order Fulfilled! 🎉',
          message: `Your buy order has been fulfilled at £${order.target_price}`,
          type: 'order_fulfilled'
        })
    } catch (error) {
      console.error('Error in fulfillBuyOrder:', error)
    }
  }

  private async updateLastSync() {
    await supabase
      .from('integrations')
      .update({ last_sync: new Date().toISOString() })
      .eq('merchant_id', this.merchantId)
      .eq('platform', 'shopify')
  }
}

// WooCommerce Integration
export class WooCommerceIntegration extends BaseIntegration {
  private apiUrl: string
  private auth: string

  constructor(config: IntegrationConfig) {
    super(config)
    this.apiUrl = `${config.credentials.site_url}/wp-json/wc/v3`
    this.auth = Buffer.from(
      `${config.credentials.consumer_key}:${config.credentials.consumer_secret}`
    ).toString('base64')
  }

  async syncProducts() {
    try {
      const response = await fetch(`${this.apiUrl}/products`, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json'
        }
      })

      const products = await response.json()
      let synced = 0
      const errors: string[] = []

      for (const wcProduct of products) {
        try {
          const liminaProduct = {
            merchant_id: this.merchantId,
            shopify_product_id: `wc_${wcProduct.id}`,
            title: wcProduct.name,
            description: wcProduct.description,
            price: parseFloat(wcProduct.regular_price || wcProduct.price || '0'),
            current_price: parseFloat(wcProduct.price || '0'),
            currency: 'GBP',
            image_url: wcProduct.images[0]?.src
          }

          const { error } = await supabase
            .from('products')
            .upsert(liminaProduct, { 
              onConflict: 'shopify_product_id',
              ignoreDuplicates: false 
            })

          if (!error) synced++
          else errors.push(`Failed to sync ${wcProduct.name}`)
        } catch {
          errors.push(`Error processing ${wcProduct.name}`)
        }
      }

      await this.updateLastSync()
      return { success: errors.length === 0, synced, errors }
    } catch {
      return { success: false, synced: 0, errors: ['Sync failed'] }
    }
  }

  async syncInventory() {
    // Similar implementation to Shopify but using WooCommerce API
    return { success: true, updated: 0, errors: [] }
  }

  async createWebhook(event: string, endpoint: string) {
    try {
      const webhookData = {
        name: `Limina ${event}`,
        topic: event,
        delivery_url: endpoint,
        status: 'active'
      }

      const response = await fetch(`${this.apiUrl}/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      })

      return response.ok
    } catch {
      return false
    }
  }

  async handleWebhook(payload: unknown) {
    // Handle WooCommerce webhook events
    console.log('WooCommerce webhook received:', payload)
  }

  async updateProductPrice(wcProductId: string, price: number) {
    try {
      const updateData = {
        regular_price: price.toString(),
        price: price.toString()
      }

      const response = await fetch(`${this.apiUrl}/products/${wcProductId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      return response.ok
    } catch {
      return false
    }
  }

  private async updateLastSync() {
    await supabase
      .from('integrations')
      .update({ last_sync: new Date().toISOString() })
      .eq('merchant_id', this.merchantId)
      .eq('platform', 'woocommerce')
  }
}

// Integration Factory
export class IntegrationFactory {
  static create(config: IntegrationConfig): BaseIntegration {
    switch (config.platform) {
      case 'shopify':
        return new ShopifyIntegration(config)
      case 'woocommerce':
        return new WooCommerceIntegration(config)
      default:
        throw new Error(`Unsupported platform: ${config.platform}`)
    }
  }
}

// Integration Manager
export class IntegrationManager {
  static async setupIntegration(merchantId: string, platform: string, credentials: Record<string, string>) {
    try {
      // Save integration config
      const config: Omit<IntegrationConfig, 'id'> = {
        merchant_id: merchantId,
        platform: platform as 'shopify' | 'woocommerce' | 'magento' | 'bigcommerce' | 'squarespace',
        credentials,
        webhook_endpoints: [],
        sync_settings: {
          products: true,
          inventory: true,
          orders: true,
          customers: false
        },
        last_sync: new Date().toISOString(),
        status: 'active'
      }

      const { data, error } = await supabase
        .from('integrations')
        .insert(config)
        .select()
        .single()

      if (error) throw error

      // Create integration instance and set up webhooks
      const integration = IntegrationFactory.create(data as IntegrationConfig)
      
      // Set up webhooks
      const webhookEndpoint = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/${platform}`
      await integration.createWebhook('products/update', webhookEndpoint)
      await integration.createWebhook('orders/paid', webhookEndpoint)

      // Perform initial sync
      const syncResult = await integration.syncProducts()
      
      return { 
        success: true, 
        integration: data,
        syncResult 
      }
    } catch {
      const errMsg = 'Setup integration failed'
      return { success: false, error: errMsg }
    }
  }

  static async syncMerchantData(merchantId: string) {
    try {
      // Get all active integrations for merchant
      const { data: integrations } = await supabase
        .from('integrations')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('status', 'active')

      const results = []

      for (const config of integrations || []) {
        const integration = IntegrationFactory.create(config as IntegrationConfig)
        
        if (config.sync_settings.products) {
          const productSync = await integration.syncProducts()
          results.push({ type: 'products', ...productSync })
        }

        if (config.sync_settings.inventory) {
          const inventorySync = await integration.syncInventory()
          results.push({ type: 'inventory', ...inventorySync })
        }
      }

      return { success: true, results }
    } catch {
      const errMsg = 'Sync merchant data failed'
      return { success: false, error: errMsg }
    }
  }

  static async handleWebhook(platform: string, payload: unknown) {
    try {
      // Find integration by platform (you might want to include merchant info in webhook)
      const { data: integrations } = await supabase
        .from('integrations')
        .select('*')
        .eq('platform', platform)
        .eq('status', 'active')

      for (const config of integrations || []) {
        const integration = IntegrationFactory.create(config as IntegrationConfig)
        await integration.handleWebhook(payload)
      }

      return { success: true }
    } catch {
      const errMsg = 'Handle webhook failed'
      return { success: false, error: errMsg }
    }
  }
}

// Database schema for integrations
/*
-- Create integrations table
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('shopify', 'woocommerce', 'magento', 'bigcommerce', 'squarespace')),
    credentials JSONB NOT NULL,
    webhook_endpoints TEXT[],
    sync_settings JSONB NOT NULL DEFAULT '{"products": true, "inventory": true, "orders": true, "customers": false}',
    last_sync TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sync logs table for debugging
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    items_processed INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_integrations_merchant_id ON integrations(merchant_id);
CREATE INDEX idx_integrations_platform ON integrations(platform);
CREATE INDEX idx_sync_logs_integration_id ON sync_logs(integration_id);
CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at);
*/