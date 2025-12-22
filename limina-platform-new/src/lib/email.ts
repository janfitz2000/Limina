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

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Limina <hello@limina.io>';
const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || 'support@limina.io';

const BRAND_COLORS = {
  background: '#0C0A09',
  cardBg: '#161413',
  gold: '#C9A227',
  goldHover: '#D4AF37',
  textPrimary: '#FAF9F6',
  textSecondary: 'rgba(250, 249, 246, 0.6)',
  textMuted: 'rgba(250, 249, 246, 0.4)',
};

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

    const subject = `Your Exclusive ${discountPercentage}% Off Code is Ready`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${BRAND_COLORS.textPrimary}; margin: 0; padding: 0; background-color: ${BRAND_COLORS.background}; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${BRAND_COLORS.cardBg}; }
    .header { background: ${BRAND_COLORS.background}; color: ${BRAND_COLORS.textPrimary}; padding: 40px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header .subtitle { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: ${BRAND_COLORS.gold}; margin-top: 8px; }
    .content { padding: 40px 30px; background: ${BRAND_COLORS.cardBg}; }
    .greeting { font-size: 18px; margin-bottom: 20px; color: ${BRAND_COLORS.textPrimary}; }
    .message { font-size: 15px; line-height: 1.8; color: ${BRAND_COLORS.textSecondary}; margin-bottom: 30px; }
    .message strong { color: ${BRAND_COLORS.textPrimary}; }
    .product { background: ${BRAND_COLORS.background}; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center; border: 1px solid rgba(255,255,255,0.05); }
    .product-image { max-width: 180px; height: auto; border-radius: 8px; margin-bottom: 16px; }
    .product-title { font-size: 18px; font-weight: 600; color: ${BRAND_COLORS.textPrimary}; margin-bottom: 16px; }
    .price-box { display: flex; justify-content: center; align-items: center; gap: 16px; margin: 16px 0; }
    .original-price { text-decoration: line-through; color: ${BRAND_COLORS.textMuted}; font-size: 16px; }
    .discounted-price { color: ${BRAND_COLORS.gold}; font-size: 28px; font-weight: 700; }
    .savings { background: rgba(201, 162, 39, 0.15); color: ${BRAND_COLORS.gold}; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 13px; border: 1px solid rgba(201, 162, 39, 0.3); }
    .code-box { background: ${BRAND_COLORS.background}; border: 2px solid ${BRAND_COLORS.gold}; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
    .code-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: ${BRAND_COLORS.textMuted}; margin-bottom: 12px; }
    .code { font-size: 28px; font-weight: 700; letter-spacing: 4px; font-family: 'Courier New', monospace; color: ${BRAND_COLORS.gold}; background: rgba(201, 162, 39, 0.1); padding: 16px 24px; border-radius: 8px; display: inline-block; margin: 8px 0; }
    .copy-hint { font-size: 12px; color: ${BRAND_COLORS.textMuted}; margin-top: 12px; }
    .cta-button { display: inline-block; background: ${BRAND_COLORS.gold}; color: ${BRAND_COLORS.background}; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0; }
    .expiry { background: rgba(201, 162, 39, 0.1); border-left: 3px solid ${BRAND_COLORS.gold}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .expiry-text { font-size: 14px; color: ${BRAND_COLORS.textSecondary}; margin: 0; }
    .footer { background: ${BRAND_COLORS.background}; padding: 30px; text-align: center; font-size: 13px; color: ${BRAND_COLORS.textMuted}; border-top: 1px solid rgba(255,255,255,0.05); }
    .footer a { color: ${BRAND_COLORS.gold}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="subtitle">Limina</div>
      <h1>Exclusive Offer Inside</h1>
    </div>

    <div class="content">
      <div class="greeting">Hi ${customerName || 'there'},</div>

      <div class="message">
        <p><strong>Great news!</strong> You signed up to be notified when <strong>${productTitle}</strong> hits your target price, and we've got something even better for you.</p>
        <p>Instead of waiting for a public price drop, you're getting an <strong>exclusive ${discountPercentage}% discount code</strong> - just for you.</p>
      </div>

      <div class="product">
        ${productImage ? `<img src="${productImage}" alt="${productTitle}" class="product-image" />` : ''}
        <div class="product-title">${productTitle}</div>
        <div class="price-box">
          <span class="original-price">${formattedOriginalPrice}</span>
          <span class="discounted-price">${formattedDiscountedPrice}</span>
        </div>
        <div class="savings">Save ${savings}</div>
      </div>

      <div class="code-box">
        <div class="code-label">Your Exclusive Code</div>
        <div class="code">${discountCode}</div>
        <div class="copy-hint">Copy this code and paste it at checkout</div>
      </div>

      ${expiresAt ? `
      <div class="expiry">
        <p class="expiry-text"><strong>Limited Time:</strong> This code expires on ${formatDate(expiresAt)}. Don't miss out.</p>
      </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="${productUrl}" class="cta-button">Shop Now</a>
      </div>

      <div class="message" style="margin-top: 40px;">
        <p style="font-size: 13px; color: ${BRAND_COLORS.textMuted};">
          <strong style="color: ${BRAND_COLORS.textSecondary};">How to use your code:</strong><br>
          1. Click the button above to visit the product page<br>
          2. Add the item to your cart<br>
          3. At checkout, paste your code: <strong style="color: ${BRAND_COLORS.gold};">${discountCode}</strong><br>
          4. Enjoy your savings
        </p>
      </div>
    </div>

    <div class="footer">
      <p>This is an exclusive, one-time use discount code.</p>
      <p>Questions? <a href="mailto:${REPLY_TO_EMAIL}">Contact us</a></p>
      <p style="margin-top: 20px; font-size: 11px;">
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

    const subject = `${customersNotified} Discount Codes Sent for ${productTitle}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: ${BRAND_COLORS.textPrimary}; margin: 0; padding: 0; background-color: ${BRAND_COLORS.background}; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${BRAND_COLORS.cardBg}; }
    .header { background: ${BRAND_COLORS.background}; color: ${BRAND_COLORS.textPrimary}; padding: 30px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header .subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: ${BRAND_COLORS.gold}; margin-bottom: 8px; }
    .content { padding: 40px 30px; }
    .content p { color: ${BRAND_COLORS.textSecondary}; }
    .content strong { color: ${BRAND_COLORS.textPrimary}; }
    .stats { background: ${BRAND_COLORS.background}; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid rgba(255,255,255,0.05); }
    .stat-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .stat-label { color: ${BRAND_COLORS.textMuted}; font-size: 14px; }
    .stat-value { font-weight: 700; color: ${BRAND_COLORS.gold}; font-size: 16px; }
    .cta-button { display: inline-block; background: ${BRAND_COLORS.gold}; color: ${BRAND_COLORS.background}; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 700; margin: 20px 0; }
    .footer { background: ${BRAND_COLORS.background}; padding: 24px; text-align: center; font-size: 12px; color: ${BRAND_COLORS.textMuted}; border-top: 1px solid rgba(255,255,255,0.05); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="subtitle">Limina</div>
      <h1>Discount Codes Sent</h1>
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
          <span class="stat-value" style="color: ${BRAND_COLORS.textPrimary};">${productTitle}</span>
        </div>
      </div>

      <p>Each customer received a unique, one-time use discount code. You can track conversions in your dashboard.</p>

      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="cta-button">View Dashboard</a>
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

    const subject = `Price Alert Set for ${productTitle}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: ${BRAND_COLORS.textPrimary}; margin: 0; padding: 0; background-color: ${BRAND_COLORS.background}; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${BRAND_COLORS.cardBg}; }
    .header { background: ${BRAND_COLORS.background}; color: ${BRAND_COLORS.textPrimary}; padding: 30px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header .subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: ${BRAND_COLORS.gold}; margin-bottom: 8px; }
    .content { padding: 40px 30px; }
    .content p { color: ${BRAND_COLORS.textSecondary}; margin-bottom: 16px; }
    .content strong { color: ${BRAND_COLORS.textPrimary}; }
    .product { text-align: center; margin: 24px 0; }
    .product-image { max-width: 150px; border-radius: 8px; margin-bottom: 15px; }
    .info-box { background: ${BRAND_COLORS.background}; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid rgba(255,255,255,0.05); }
    .info-box p { margin: 8px 0; font-size: 14px; }
    .info-box .label { color: ${BRAND_COLORS.textMuted}; }
    .info-box .value { color: ${BRAND_COLORS.textPrimary}; font-weight: 600; }
    .info-box .target { color: ${BRAND_COLORS.gold}; font-weight: 700; font-size: 18px; }
    .footer { background: ${BRAND_COLORS.background}; padding: 24px; text-align: center; font-size: 12px; color: ${BRAND_COLORS.textMuted}; border-top: 1px solid rgba(255,255,255,0.05); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="subtitle">Limina</div>
      <h1>You're All Set</h1>
    </div>

    <div class="content">
      <p>Hi ${customerName || 'there'},</p>

      <p>Thanks for setting up a price alert! We'll keep an eye on <strong>${productTitle}</strong> for you.</p>

      ${productImage ? `
      <div class="product">
        <img src="${productImage}" alt="${productTitle}" class="product-image" />
      </div>
      ` : ''}

      <div class="info-box">
        <p><span class="label">Product:</span> <span class="value">${productTitle}</span></p>
        <p><span class="label">Current Price:</span> <span class="value">${formattedCurrentPrice}</span></p>
        <p><span class="label">Your Target Price:</span> <span class="target">${formattedTargetPrice}</span></p>
      </div>

      <p><strong>What happens next?</strong></p>
      <p>When the price drops to ${formattedTargetPrice} or the merchant offers you an exclusive discount, we'll send you an email immediately with your special discount code.</p>

      <p style="color: ${BRAND_COLORS.gold};">You'll be among the first to know.</p>
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
