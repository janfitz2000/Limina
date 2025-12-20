/**
 * Discount Code Generation Service
 * Handles creation and management of platform-specific discount codes
 */

import { supabaseAdmin } from '@/lib/supabase';
import { ShopifyIntegration, WooCommerceIntegration } from '@/lib/integrations';

export interface DiscountCodeRequest {
  buyOrderId: string;
  merchantId: string;
  customerId: string;
  productId: string;
  storeId: string;
  targetPrice: number;
  originalPrice: number;
  currency?: string;
  expiresInDays?: number;
}

export interface DiscountCodeResult {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  platform: 'shopify' | 'woocommerce' | 'manual';
  platformDiscountId?: string;
  platformCodeId?: string;
  status: 'generated' | 'sent' | 'used' | 'expired' | 'failed';
  expiresAt?: Date;
  error?: string;
}

export class DiscountCodeService {
  private supabase;

  constructor() {
    this.supabase = supabaseAdmin;
  }

  /**
   * Generate a unique discount code
   * Format: LIMINA-{RANDOM6}-{RANDOM4}
   */
  private generateCode(): string {
    const randomPart1 = Math.random().toString(36).substring(2, 8).toUpperCase();
    const randomPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LIMINA-${randomPart1}-${randomPart2}`;
  }

  /**
   * Calculate discount percentage from price difference
   */
  private calculateDiscountPercentage(originalPrice: number, targetPrice: number): number {
    return Math.round(((originalPrice - targetPrice) / originalPrice) * 100);
  }

  /**
   * Create discount code for a buy order
   */
  async createDiscountCode(request: DiscountCodeRequest): Promise<DiscountCodeResult> {
    try {
      // Get store details
      const { data: store, error: storeError } = await this.supabase
        .from('stores')
        .select('*')
        .eq('id', request.storeId)
        .single();

      if (storeError || !store) {
        throw new Error(`Store not found: ${storeError?.message}`);
      }

      // Calculate discount
      const discountPercentage = this.calculateDiscountPercentage(
        request.originalPrice,
        request.targetPrice
      );

      const discountValue = discountPercentage;
      const discountType = 'percentage';

      // Generate unique code
      const code = this.generateCode();

      // Set expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (request.expiresInDays || 30));

      let platformResponse: any = {};
      let platformDiscountId: string | undefined;
      let platformCodeId: string | undefined;
      let status: 'generated' | 'failed' = 'generated';
      let errorMessage: string | undefined;

      // Create platform-specific discount code
      try {
        if (store.platform === 'shopify') {
          const result = await this.createShopifyDiscount({
            code,
            discountPercentage,
            productId: request.productId,
            storeCredentials: store.credentials,
            expiresAt,
          });
          platformDiscountId = result.priceRuleId;
          platformCodeId = result.discountCodeId;
          platformResponse = result.response;
        } else if (store.platform === 'woocommerce') {
          const result = await this.createWooCommerceDiscount({
            code,
            discountPercentage,
            productId: request.productId,
            storeCredentials: store.credentials,
            expiresAt,
          });
          platformDiscountId = result.couponId;
          platformResponse = result.response;
        } else {
          throw new Error(`Unsupported platform: ${store.platform}`);
        }
      } catch (platformError: any) {
        status = 'failed';
        errorMessage = platformError.message;
        console.error('Platform discount creation failed:', platformError);
      }

      // Save to database
      const { data: discountCode, error: dbError } = await this.supabase
        .from('discount_codes')
        .insert({
          buy_order_id: request.buyOrderId,
          merchant_id: request.merchantId,
          customer_id: request.customerId,
          product_id: request.productId,
          store_id: request.storeId,
          code,
          platform: store.platform,
          platform_discount_id: platformDiscountId,
          platform_code_id: platformCodeId,
          discount_type: discountType,
          discount_value: discountValue,
          original_price: request.originalPrice,
          target_price: request.targetPrice,
          currency: request.currency || store.currency || 'GBP',
          status,
          expires_at: expiresAt.toISOString(),
          platform_response: platformResponse,
          error_message: errorMessage,
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Failed to save discount code: ${dbError.message}`);
      }

      return {
        id: discountCode.id,
        code: discountCode.code,
        discountType: discountCode.discount_type,
        discountValue: discountCode.discount_value,
        platform: discountCode.platform,
        platformDiscountId: discountCode.platform_discount_id,
        platformCodeId: discountCode.platform_code_id,
        status: discountCode.status,
        expiresAt: new Date(discountCode.expires_at),
        error: discountCode.error_message,
      };
    } catch (error: any) {
      console.error('Failed to create discount code:', error);
      throw error;
    }
  }

  /**
   * Create Shopify discount code via API
   */
  private async createShopifyDiscount(params: {
    code: string;
    discountPercentage: number;
    productId: string;
    storeCredentials: any;
    expiresAt: Date;
  }): Promise<{ priceRuleId: string; discountCodeId: string; response: any }> {
    const shopify = new ShopifyIntegration(params.storeCredentials);

    // Get Shopify product ID
    const { data: product } = await this.supabase
      .from('products')
      .select('shopify_product_id')
      .eq('id', params.productId)
      .single();

    if (!product?.shopify_product_id) {
      throw new Error('Product not synced with Shopify');
    }

    // Create price rule
    const priceRuleResponse = await shopify.createPriceRule({
      title: `LIMINA Price Alert - ${params.code}`,
      value_type: 'percentage',
      value: `-${params.discountPercentage}.0`,
      customer_selection: 'all',
      target_type: 'line_item',
      target_selection: 'entitled',
      entitled_product_ids: [product.shopify_product_id],
      allocation_method: 'across',
      starts_at: new Date().toISOString(),
      ends_at: params.expiresAt.toISOString(),
      usage_limit: 1,
    });

    const priceRuleId = priceRuleResponse.price_rule.id;

    // Create discount code for the price rule
    const discountCodeResponse = await shopify.createDiscountCode(
      priceRuleId,
      params.code
    );

    return {
      priceRuleId: priceRuleId.toString(),
      discountCodeId: discountCodeResponse.discount_code.id.toString(),
      response: { priceRuleResponse, discountCodeResponse },
    };
  }

  /**
   * Create WooCommerce coupon via API
   */
  private async createWooCommerceDiscount(params: {
    code: string;
    discountPercentage: number;
    productId: string;
    storeCredentials: any;
    expiresAt: Date;
  }): Promise<{ couponId: string; response: any }> {
    const woocommerce = new WooCommerceIntegration(params.storeCredentials);

    // Get WooCommerce product ID
    const { data: product } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', params.productId)
      .single();

    if (!product) {
      throw new Error('Product not found');
    }

    // Extract WooCommerce product ID from metadata
    const wooProductId = product.shopify_product_id; // We'll need to add wc_product_id column later

    const couponResponse = await woocommerce.createCoupon({
      code: params.code,
      discount_type: 'percent',
      amount: params.discountPercentage.toString(),
      individual_use: true,
      product_ids: wooProductId ? [parseInt(wooProductId)] : [],
      usage_limit: 1,
      usage_limit_per_user: 1,
      date_expires: params.expiresAt.toISOString().split('T')[0], // YYYY-MM-DD format
      description: `LIMINA Price Alert - Exclusive ${params.discountPercentage}% off`,
    });

    return {
      couponId: couponResponse.id.toString(),
      response: couponResponse,
    };
  }

  /**
   * Generate discount codes for multiple buy orders (batch operation)
   */
  async createBatchDiscountCodes(
    buyOrderIds: string[]
  ): Promise<DiscountCodeResult[]> {
    const results: DiscountCodeResult[] = [];

    for (const buyOrderId of buyOrderIds) {
      try {
        // Get buy order details
        const { data: buyOrder } = await this.supabase
          .from('buy_orders')
          .select('*, products(*)')
          .eq('id', buyOrderId)
          .single();

        if (!buyOrder) {
          console.error(`Buy order ${buyOrderId} not found`);
          continue;
        }

        const result = await this.createDiscountCode({
          buyOrderId: buyOrder.id,
          merchantId: buyOrder.merchant_id,
          customerId: buyOrder.customer_id,
          productId: buyOrder.product_id,
          storeId: buyOrder.store_id,
          targetPrice: buyOrder.target_price,
          originalPrice: buyOrder.products.current_price,
          currency: buyOrder.currency,
        });

        results.push(result);
      } catch (error: any) {
        console.error(`Failed to create code for order ${buyOrderId}:`, error);
        results.push({
          id: '',
          code: '',
          discountType: 'percentage',
          discountValue: 0,
          platform: 'manual',
          status: 'failed',
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Mark discount code as sent
   */
  async markCodeAsSent(codeId: string): Promise<void> {
    await this.supabase
      .from('discount_codes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        email_sent: true,
      })
      .eq('id', codeId);
  }

  /**
   * Mark discount code as used
   */
  async markCodeAsUsed(code: string, platform: string): Promise<void> {
    const { data: discountCode } = await this.supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code)
      .eq('platform', platform)
      .single();

    if (!discountCode) {
      throw new Error(`Discount code ${code} not found`);
    }

    await this.supabase
      .from('discount_codes')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
        usage_count: discountCode.usage_count + 1,
      })
      .eq('id', discountCode.id);

    // Update buy order status
    await this.supabase
      .from('buy_orders')
      .update({
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', discountCode.buy_order_id);
  }

  /**
   * Get discount codes for a merchant
   */
  async getMerchantDiscountCodes(
    merchantId: string,
    filters?: {
      status?: string;
      productId?: string;
      limit?: number;
    }
  ): Promise<DiscountCodeResult[]> {
    let query = this.supabase
      .from('discount_codes')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.productId) {
      query = query.eq('product_id', filters.productId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch discount codes: ${error.message}`);
    }

    return (data || []).map((code) => ({
      id: code.id,
      code: code.code,
      discountType: code.discount_type,
      discountValue: code.discount_value,
      platform: code.platform,
      platformDiscountId: code.platform_discount_id,
      platformCodeId: code.platform_code_id,
      status: code.status,
      expiresAt: code.expires_at ? new Date(code.expires_at) : undefined,
      error: code.error_message,
    }));
  }

  /**
   * Get analytics for discount codes
   */
  async getDiscountCodeAnalytics(merchantId: string, days: number = 30) {
    const { data, error } = await this.supabase.rpc(
      'get_discount_code_analytics',
      {
        p_merchant_id: merchantId,
        p_days: days,
      }
    );

    if (error) {
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }

    return data[0];
  }

  /**
   * Expire old discount codes
   */
  async expireOldCodes(): Promise<number> {
    const { data, error } = await this.supabase.rpc('expire_discount_codes');

    if (error) {
      throw new Error(`Failed to expire codes: ${error.message}`);
    }

    return data || 0;
  }
}

export const discountCodeService = new DiscountCodeService();
