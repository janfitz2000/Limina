/**
 * Email Service using Resend
 * Handles all transactional emails for the platform
 */

import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Limina <hello@limina.com>';
const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || 'support@limina.com';

export interface DiscountCodeEmailParams {
  to: string;
  customerName?: string;
  productTitle: string;
  productImage?: string;
  productUrl: string;
  discountCode: string;
  discountPercentage: number;
  originalPrice: number;
  discountedPrice: number;
  currency: string;
  expiresAt?: Date;
}

export interface MerchantNotificationParams {
  to: string;
  merchantName: string;
  productTitle: string;
  customersNotified: number;
  discountPercentage: number;
  dashboardUrl: string;
}

export interface PriceAlertConfirmationParams {
  to: string;
  customerName?: string;
  productTitle: string;
  productImage?: string;
  targetPrice: number;
  currentPrice: number;
  currency: string;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Send discount code email to customer
 */
export async function sendDiscountCodeEmail(
  params: DiscountCodeEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const {
      to,
      customerName,
      productTitle,
      productImage,
      productUrl,
      discountCode,
      discountPercentage,
      originalPrice,
      discountedPrice,
      currency,
      expiresAt,
    } = params;

    const formattedOriginalPrice = formatCurrency(originalPrice, currency);
    const formattedDiscountedPrice = formatCurrency(discountedPrice, currency);
    const savings = formatCurrency(originalPrice - discountedPrice, currency);

    const subject = `🎉 Your Exclusive ${discountPercentage}% Off Code is Ready!`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #10344C 0%, #1e5b8a 100%); color: #ffffff; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; margin-bottom: 20px; color: #10344C; }
    .message { font-size: 16px; line-height: 1.8; color: #555; margin-bottom: 30px; }
    .product { background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center; }
    .product-image { max-width: 200px; height: auto; border-radius: 8px; margin-bottom: 15px; }
    .product-title { font-size: 20px; font-weight: 600; color: #10344C; margin-bottom: 10px; }
    .price-box { display: flex; justify-content: center; align-items: center; gap: 15px; margin: 20px 0; }
    .original-price { text-decoration: line-through; color: #999; font-size: 18px; }
    .discounted-price { color: #10344C; font-size: 28px; font-weight: 700; }
    .savings { background: #FACC15; color: #10344C; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; }
    .code-box { background: linear-gradient(135deg, #10344C 0%, #1e5b8a 100%); color: #ffffff; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
    .code-label { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; margin-bottom: 10px; }
    .code { font-size: 32px; font-weight: 700; letter-spacing: 3px; font-family: 'Courier New', monospace; background: rgba(255,255,255,0.2); padding: 15px 25px; border-radius: 8px; display: inline-block; margin: 10px 0; }
    .copy-hint { font-size: 13px; opacity: 0.8; margin-top: 10px; }
    .cta-button { display: inline-block; background: #FACC15; color: #10344C; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 18px; margin: 20px 0; transition: all 0.3s; }
    .cta-button:hover { background: #FDE68A; transform: translateY(-2px); }
    .expiry { background: #fff3cd; border-left: 4px solid #FACC15; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .expiry-text { font-size: 14px; color: #856404; margin: 0; }
    .footer { background: #f9f9f9; padding: 30px; text-align: center; font-size: 14px; color: #777; }
    .footer a { color: #10344C; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 Exclusive Discount Inside!</h1>
    </div>

    <div class="content">
      <div class="greeting">Hi ${customerName || 'there'}! 👋</div>

      <div class="message">
        <p><strong>Great news!</strong> You signed up to be notified when <strong>${productTitle}</strong> hits your target price, and we've got something even better for you.</p>
        <p>Instead of waiting for a public price drop, you're getting an <strong>exclusive ${discountPercentage}% discount code</strong> — just for you!</p>
      </div>

      ${
        productImage
          ? `
      <div class="product">
        <img src="${productImage}" alt="${productTitle}" class="product-image" />
        <div class="product-title">${productTitle}</div>
        <div class="price-box">
          <span class="original-price">${formattedOriginalPrice}</span>
          <span class="discounted-price">${formattedDiscountedPrice}</span>
        </div>
        <div class="savings">Save ${savings}!</div>
      </div>
      `
          : `
      <div class="product">
        <div class="product-title">${productTitle}</div>
        <div class="price-box">
          <span class="original-price">${formattedOriginalPrice}</span>
          <span class="discounted-price">${formattedDiscountedPrice}</span>
        </div>
        <div class="savings">Save ${savings}!</div>
      </div>
      `
      }

      <div class="code-box">
        <div class="code-label">Your Exclusive Code</div>
        <div class="code">${discountCode}</div>
        <div class="copy-hint">Copy this code and paste it at checkout</div>
      </div>

      ${
        expiresAt
          ? `
      <div class="expiry">
        <p class="expiry-text">⏰ <strong>Limited Time:</strong> This code expires on ${formatDate(expiresAt)}. Don't miss out!</p>
      </div>
      `
          : ''
      }

      <div style="text-align: center;">
        <a href="${productUrl}" class="cta-button">Shop Now →</a>
      </div>

      <div class="message" style="margin-top: 40px;">
        <p style="font-size: 14px; color: #777;">
          <strong>How to use your code:</strong><br>
          1. Click the button above to visit the product page<br>
          2. Add the item to your cart<br>
          3. At checkout, paste your code: <strong>${discountCode}</strong><br>
          4. Enjoy your savings!
        </p>
      </div>
    </div>

    <div class="footer">
      <p>This is an exclusive, one-time use discount code.</p>
      <p>Questions? <a href="mailto:${REPLY_TO_EMAIL}">Contact us</a></p>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        You received this email because you signed up for price alerts on Limina.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Hi ${customerName || 'there'}!

Great news! You signed up to be notified when ${productTitle} hits your target price.

Instead of waiting for a public price drop, you're getting an exclusive ${discountPercentage}% discount code — just for you!

YOUR EXCLUSIVE CODE: ${discountCode}

${productTitle}
Was: ${formattedOriginalPrice}
Now: ${formattedDiscountedPrice}
You save: ${savings}!

${expiresAt ? `⏰ This code expires on ${formatDate(expiresAt)}. Don't miss out!` : ''}

Shop now: ${productUrl}

How to use your code:
1. Visit the product page using the link above
2. Add the item to your cart
3. At checkout, paste your code: ${discountCode}
4. Enjoy your savings!

This is a one-time use discount code.

Questions? Reply to this email or contact us at ${REPLY_TO_EMAIL}

---
You received this email because you signed up for price alerts on Limina.
    `.trim();

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: REPLY_TO_EMAIL,
      subject,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('Failed to send discount code email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Error sending discount code email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send merchant notification when discount codes are generated
 */
export async function sendMerchantNotificationEmail(
  params: MerchantNotificationParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const {
      to,
      merchantName,
      productTitle,
      customersNotified,
      discountPercentage,
      dashboardUrl,
    } = params;

    const subject = `💰 ${customersNotified} Discount Codes Sent for ${productTitle}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: #10344C; color: #ffffff; padding: 30px 20px; text-align: center; }
    .content { padding: 40px 30px; }
    .stats { background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .stat-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .stat-label { color: #666; }
    .stat-value { font-weight: 700; color: #10344C; font-size: 18px; }
    .cta-button { display: inline-block; background: #FACC15; color: #10344C; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 13px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Discount Codes Sent! 🎉</h1>
    </div>

    <div class="content">
      <p>Hi ${merchantName},</p>

      <p>Great news! We've just sent exclusive discount codes to customers who were waiting for <strong>${productTitle}</strong> to drop in price.</p>

      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Customers Notified</span>
          <span class="stat-value">${customersNotified}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Discount Offered</span>
          <span class="stat-value">${discountPercentage}%</span>
        </div>
        <div class="stat-item" style="border-bottom: none;">
          <span class="stat-label">Product</span>
          <span class="stat-value">${productTitle}</span>
        </div>
      </div>

      <p>Each customer received a unique, one-time use discount code. You can track conversions in your dashboard.</p>

      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="cta-button">View Dashboard →</a>
      </div>
    </div>

    <div class="footer">
      <p>Limina - Conditional Buy Order Platform</p>
    </div>
  </div>
</body>
</html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: REPLY_TO_EMAIL,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Failed to send merchant notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Error sending merchant notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send price alert confirmation when customer signs up
 */
export async function sendPriceAlertConfirmationEmail(
  params: PriceAlertConfirmationParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const {
      to,
      customerName,
      productTitle,
      productImage,
      targetPrice,
      currentPrice,
      currency,
    } = params;

    const formattedTargetPrice = formatCurrency(targetPrice, currency);
    const formattedCurrentPrice = formatCurrency(currentPrice, currency);

    const subject = `✅ Price Alert Set for ${productTitle}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #10344C 0%, #1e5b8a 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
    .content { padding: 40px 30px; }
    .product { text-align: center; margin: 30px 0; }
    .product-image { max-width: 150px; border-radius: 8px; margin-bottom: 15px; }
    .info-box { background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 13px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ You're All Set!</h1>
    </div>

    <div class="content">
      <p>Hi ${customerName || 'there'}! 👋</p>

      <p>Thanks for setting up a price alert! We'll keep an eye on <strong>${productTitle}</strong> for you.</p>

      ${productImage ? `
      <div class="product">
        <img src="${productImage}" alt="${productTitle}" class="product-image" />
      </div>
      ` : ''}

      <div class="info-box">
        <p><strong>Product:</strong> ${productTitle}</p>
        <p><strong>Current Price:</strong> ${formattedCurrentPrice}</p>
        <p><strong>Your Target Price:</strong> ${formattedTargetPrice}</p>
      </div>

      <p><strong>What happens next?</strong></p>
      <p>When the price drops to ${formattedTargetPrice} or the merchant offers you an exclusive discount, we'll send you an email immediately with your special discount code.</p>

      <p>You'll be among the first to know!</p>
    </div>

    <div class="footer">
      <p>Limina - Get notified when prices drop</p>
    </div>
  </div>
</body>
</html>
    `;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: REPLY_TO_EMAIL,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Failed to send price alert confirmation:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Error sending price alert confirmation:', error);
    return { success: false, error: error.message };
  }
}

export const emailService = {
  sendDiscountCodeEmail,
  sendMerchantNotificationEmail,
  sendPriceAlertConfirmationEmail,
};
