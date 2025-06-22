// Email service for price alerts using Resend
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface PriceAlertEmailData {
  email: string
  customerName?: string
  productTitle: string
  targetPrice: number
  currentPrice: number
  productUrl: string
  imageUrl?: string
  shopDomain: string
}

export class EmailService {
  // Send price drop alert email
  static async sendPriceAlert(data: PriceAlertEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const savings = data.targetPrice - data.currentPrice
      const savingsPercent = Math.round((savings / data.targetPrice) * 100)

      const emailHtml = this.generatePriceAlertHtml(data, savings, savingsPercent)

      const result = await resend.emails.send({
        from: 'Limina Price Tracker <alerts@limina.app>',
        to: [data.email],
        subject: `🎉 Price Drop Alert: ${data.productTitle}`,
        html: emailHtml,
      })

      if (result.error) {
        console.error('Error sending email:', result.error)
        return { success: false, error: result.error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in sendPriceAlert:', error)
      return { success: false, error: 'Failed to send email' }
    }
  }

  // Send welcome email when user creates first price alert
  static async sendWelcomeEmail(email: string, customerName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await resend.emails.send({
        from: 'Limina Price Tracker <welcome@limina.app>',
        to: [email],
        subject: '👋 Welcome to Limina Price Tracker',
        html: this.generateWelcomeHtml(customerName),
      })

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in sendWelcomeEmail:', error)
      return { success: false, error: 'Failed to send welcome email' }
    }
  }

  // Send alert confirmation email
  static async sendAlertConfirmation(data: {
    email: string
    productTitle: string
    targetPrice: number
    productUrl: string
    customerName?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await resend.emails.send({
        from: 'Limina Price Tracker <alerts@limina.app>',
        to: [data.email],
        subject: `✅ Price Alert Set: ${data.productTitle}`,
        html: this.generateConfirmationHtml(data),
      })

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in sendAlertConfirmation:', error)
      return { success: false, error: 'Failed to send confirmation email' }
    }
  }

  // Generate price alert email HTML
  private static generatePriceAlertHtml(data: PriceAlertEmailData, savings: number, savingsPercent: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Price Drop Alert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🎉 Price Drop Alert!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">The price you've been waiting for is here</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    ${data.customerName ? `<p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.customerName},</p>` : ''}
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      ${data.imageUrl ? `
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${data.imageUrl}" alt="${data.productTitle}" style="max-width: 200px; height: auto; border-radius: 8px;">
        </div>
      ` : ''}
      
      <h2 style="margin: 0 0 15px 0; font-size: 22px; color: #333;">${data.productTitle}</h2>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div>
          <p style="margin: 0; color: #666; font-size: 14px;">Your target price:</p>
          <p style="margin: 0; font-size: 18px; color: #333;">$${data.targetPrice.toFixed(2)}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; color: #666; font-size: 14px;">Current price:</p>
          <p style="margin: 0; font-size: 24px; color: #28a745; font-weight: bold;">$${data.currentPrice.toFixed(2)}</p>
        </div>
      </div>
      
      <div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 6px; text-align: center;">
        <strong>You save $${savings.toFixed(2)} (${savingsPercent}%)</strong>
      </div>
    </div>
    
    <div style="text-align: center; margin-bottom: 25px;">
      <a href="${data.productUrl}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold; display: inline-block;">
        Buy Now on ${data.shopDomain}
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
      This price alert was triggered because the current price ($${data.currentPrice.toFixed(2)}) met or went below your target price ($${data.targetPrice.toFixed(2)}).
    </p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
    <p style="margin: 0; color: #666; font-size: 12px;">
      © 2024 Limina Price Tracker. 
      <a href="mailto:support@limina.app" style="color: #007bff;">Contact Support</a>
    </p>
  </div>
</body>
</html>
    `.trim()
  }

  // Generate welcome email HTML
  private static generateWelcomeHtml(customerName?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Limina Price Tracker</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
    <h1 style="margin: 0; font-size: 28px;">👋 Welcome to Limina!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Never miss a great deal again</p>
  </div>
  
  <div style="padding: 30px;">
    ${customerName ? `<p style="font-size: 16px;">Hi ${customerName},</p>` : '<p style="font-size: 16px;">Hello!</p>'}
    
    <p>Thanks for setting up your first price alert with Limina! 🎉</p>
    
    <p>Here's what happens next:</p>
    <ul style="color: #555;">
      <li><strong>We monitor prices</strong> - Our system tracks your selected products 24/7</li>
      <li><strong>You get notified</strong> - When prices drop to your target, we'll email you instantly</li>
      <li><strong>You save money</strong> - Buy at the perfect time and never overpay again</li>
    </ul>
    
    <p>Your price alerts are now active and monitoring. Sit back and let us do the work!</p>
    
    <p style="margin-top: 30px;">
      Happy shopping!<br>
      <strong>The Limina Team</strong>
    </p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 10px;">
    <p style="margin: 0; color: #666; font-size: 12px;">
      Questions? Reply to this email or contact us at 
      <a href="mailto:support@limina.app" style="color: #007bff;">support@limina.app</a>
    </p>
  </div>
</body>
</html>
    `.trim()
  }

  // Generate confirmation email HTML
  private static generateConfirmationHtml(data: {
    email: string
    productTitle: string
    targetPrice: number
    productUrl: string
    customerName?: string
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Price Alert Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">✅ Alert Confirmed!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">We're now tracking this product for you</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    ${data.customerName ? `<p style="font-size: 16px;">Hi ${data.customerName},</p>` : ''}
    
    <p>Your price alert has been successfully set up! 🎯</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #333;">${data.productTitle}</h3>
      <p style="margin: 0; color: #666;">Target price: <strong style="color: #28a745;">$${data.targetPrice.toFixed(2)}</strong></p>
    </div>
    
    <p>We'll monitor this product and send you an email as soon as the price drops to $${data.targetPrice.toFixed(2)} or below.</p>
    
    <div style="text-align: center; margin: 25px 0;">
      <a href="${data.productUrl}" style="background: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Product
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      <strong>Tip:</strong> You can set multiple price alerts for different products. Just repeat the process on any product page!
    </p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
    <p style="margin: 0; color: #666; font-size: 12px;">
      © 2024 Limina Price Tracker. 
      <a href="mailto:support@limina.app" style="color: #007bff;">Contact Support</a>
    </p>
  </div>
</body>
</html>
    `.trim()
  }
}