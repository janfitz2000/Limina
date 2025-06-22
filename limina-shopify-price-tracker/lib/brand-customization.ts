// Brand customization service for merchant email templates
import { DatabaseService } from './database'

export interface BrandSettings {
  id: string
  shop_domain: string
  brand_name: string
  brand_logo_url?: string
  primary_color: string
  secondary_color: string
  font_family: 'Arial' | 'Helvetica' | 'Georgia' | 'Times' | 'Verdana'
  email_footer_text?: string
  button_style: 'rounded' | 'square' | 'pill'
  custom_css?: string
  created_at: string
  updated_at: string
}

export interface CustomEmailData {
  // Email content
  email: string
  customerName?: string
  productTitle: string
  targetPrice: number
  currentPrice: number
  productUrl: string
  imageUrl?: string
  shopDomain: string
  
  // Brand settings
  brandSettings: BrandSettings
}

export class BrandCustomizationService {
  // Get brand settings for a shop
  static async getBrandSettings(shopDomain: string): Promise<BrandSettings | null> {
    try {
      const { data, error } = await DatabaseService.supabase
        .from('brand_settings')
        .select('*')
        .eq('shop_domain', shopDomain)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching brand settings:', error)
        return null
      }

      return data || this.getDefaultBrandSettings(shopDomain)
    } catch (error) {
      console.error('Error in getBrandSettings:', error)
      return this.getDefaultBrandSettings(shopDomain)
    }
  }

  // Update brand settings
  static async updateBrandSettings(shopDomain: string, settings: Partial<BrandSettings>) {
    try {
      const { data, error } = await DatabaseService.supabase
        .from('brand_settings')
        .upsert({
          shop_domain: shopDomain,
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'shop_domain',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating brand settings:', error)
      throw error
    }
  }

  // Get default brand settings
  private static getDefaultBrandSettings(shopDomain: string): BrandSettings {
    return {
      id: '',
      shop_domain: shopDomain,
      brand_name: shopDomain.replace('.myshopify.com', ''),
      primary_color: '#007bff',
      secondary_color: '#6c757d',
      font_family: 'Arial',
      button_style: 'rounded',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // Generate branded price alert email
  static generateBrandedPriceAlert(data: CustomEmailData): string {
    const { brandSettings } = data
    const savings = data.targetPrice - data.currentPrice
    const savingsPercent = Math.round((savings / data.targetPrice) * 100)

    const buttonRadius = {
      rounded: '6px',
      square: '0px',
      pill: '25px'
    }[brandSettings.button_style]

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Price Drop Alert from ${brandSettings.brand_name}</title>
  <style>
    ${brandSettings.custom_css || ''}
  </style>
</head>
<body style="font-family: ${brandSettings.font_family}, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
  
  <!-- Header with Brand -->
  <div style="background: linear-gradient(135deg, ${brandSettings.primary_color} 0%, ${brandSettings.secondary_color} 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    ${brandSettings.brand_logo_url ? `
      <div style="margin-bottom: 20px;">
        <img src="${brandSettings.brand_logo_url}" alt="${brandSettings.brand_name}" style="max-height: 60px; height: auto;">
      </div>
    ` : ''}
    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎉 Price Drop Alert!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">The price you've been waiting for is here</p>
  </div>
  
  <!-- Main Content -->
  <div style="background: white; padding: 40px; border: 1px solid #e0e0e0; border-top: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    ${data.customerName ? `
      <p style="font-size: 18px; margin-bottom: 25px; color: ${brandSettings.primary_color};">
        Hi ${data.customerName}! 👋
      </p>
    ` : ''}
    
    <!-- Product Card -->
    <div style="background: linear-gradient(145deg, #f8f9fa, #ffffff); padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      ${data.imageUrl ? `
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="${data.imageUrl}" alt="${data.productTitle}" style="max-width: 250px; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        </div>
      ` : ''}
      
      <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #2c3e50; text-align: center; font-weight: bold;">
        ${data.productTitle}
      </h2>
      
      <!-- Price Comparison -->
      <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${brandSettings.primary_color};">
        <div style="display: table; width: 100%;">
          <div style="display: table-cell; width: 50%; padding-right: 10px;">
            <p style="margin: 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Target Price</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; color: #6c757d; text-decoration: line-through;">$${data.targetPrice.toFixed(2)}</p>
          </div>
          <div style="display: table-cell; width: 50%; text-align: right; padding-left: 10px;">
            <p style="margin: 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Current Price</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; color: #28a745; font-weight: bold;">$${data.currentPrice.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <!-- Savings Highlight -->
      <div style="background: linear-gradient(135deg, #d4edda, #c3e6cb); color: #155724; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #c3e6cb;">
        <div style="font-size: 16px; margin-bottom: 5px;">🎯 You're saving</div>
        <div style="font-size: 24px; font-weight: bold;">$${savings.toFixed(2)} (${savingsPercent}% off!)</div>
      </div>
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 35px 0;">
      <a href="${data.productUrl}" style="
        background: linear-gradient(135deg, ${brandSettings.primary_color}, ${brandSettings.secondary_color}); 
        color: white; 
        padding: 18px 40px; 
        text-decoration: none; 
        border-radius: ${buttonRadius}; 
        font-size: 18px; 
        font-weight: bold; 
        display: inline-block;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 1px;
      ">
        🛒 Buy Now at ${brandSettings.brand_name}
      </a>
    </div>
    
    <!-- Additional Info -->
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${brandSettings.primary_color};">
      <h4 style="margin: 0 0 10px 0; color: ${brandSettings.primary_color};">⏰ Don't wait too long!</h4>
      <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
        This price alert was triggered because the current price ($${data.currentPrice.toFixed(2)}) met your target price of $${data.targetPrice.toFixed(2)}. 
        Prices can change quickly, so we recommend purchasing soon if you're interested.
      </p>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="background: ${brandSettings.primary_color}; color: white; padding: 25px; text-align: center; border-radius: 0 0 12px 12px;">
    ${brandSettings.email_footer_text ? `
      <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">
        ${brandSettings.email_footer_text}
      </p>
    ` : ''}
    <p style="margin: 0; font-size: 12px; opacity: 0.8;">
      Powered by ${brandSettings.brand_name} Price Alerts | 
      <a href="mailto:support@${data.shopDomain}" style="color: white; opacity: 0.8;">Contact Support</a>
    </p>
  </div>
  
</body>
</html>
    `.trim()
  }

  // Generate branded welcome email
  static generateBrandedWelcome(shopDomain: string, customerName?: string, brandSettings?: BrandSettings): string {
    const settings = brandSettings || this.getDefaultBrandSettings(shopDomain)

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${settings.brand_name} Price Alerts</title>
</head>
<body style="font-family: ${settings.font_family}, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, ${settings.primary_color} 0%, ${settings.secondary_color} 100%); color: white; padding: 30px; text-align: center; border-radius: 12px;">
    ${settings.brand_logo_url ? `
      <div style="margin-bottom: 20px;">
        <img src="${settings.brand_logo_url}" alt="${settings.brand_name}" style="max-height: 60px; height: auto;">
      </div>
    ` : ''}
    <h1 style="margin: 0; font-size: 28px;">👋 Welcome to ${settings.brand_name}!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Never miss a great deal again</p>
  </div>
  
  <div style="padding: 30px;">
    ${customerName ? `<p style="font-size: 16px;">Hi ${customerName},</p>` : '<p style="font-size: 16px;">Hello!</p>'}
    
    <p>Thanks for setting up your first price alert with ${settings.brand_name}! 🎉</p>
    
    <p>Here's what happens next:</p>
    <ul style="color: #555;">
      <li><strong>We monitor prices</strong> - Our system tracks your selected products 24/7</li>
      <li><strong>You get notified</strong> - When prices drop to your target, we'll email you instantly</li>
      <li><strong>You save money</strong> - Buy at the perfect time and never overpay again</li>
    </ul>
    
    <p>Your price alerts are now active and monitoring. Sit back and let us do the work!</p>
    
    <p style="margin-top: 30px;">
      Happy shopping!<br>
      <strong>The ${settings.brand_name} Team</strong>
    </p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 10px;">
    <p style="margin: 0; color: #666; font-size: 12px;">
      Questions? Contact us at 
      <a href="mailto:support@${shopDomain}" style="color: ${settings.primary_color};">support@${shopDomain}</a>
    </p>
  </div>
</body>
</html>
    `.trim()
  }

  // Email template preview for merchants
  static generatePreviewEmail(brandSettings: BrandSettings): string {
    const sampleData: CustomEmailData = {
      email: 'customer@example.com',
      customerName: 'Sarah Johnson',
      productTitle: 'Premium Wireless Headphones',
      targetPrice: 199.99,
      currentPrice: 149.99,
      productUrl: `https://${brandSettings.shop_domain}/products/sample`,
      imageUrl: 'https://via.placeholder.com/250x250/333/fff?text=Product+Image',
      shopDomain: brandSettings.shop_domain,
      brandSettings
    }

    return this.generateBrandedPriceAlert(sampleData)
  }
}