// Test webhook sender for demo purposes
const crypto = require('crypto')
const fetch = require('node-fetch')

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/shopify'
const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || 'test_webhook_secret_docker'
const SHOP_DOMAIN = process.env.DEMO_SHOP_DOMAIN || 'docker-demo.myshopify.com'

// Sample webhook payload for product price update
const webhookPayload = {
  id: 'demo_001',
  title: 'Premium Wireless Headphones - Flash Sale!',
  body_html: 'Limited time offer - premium wireless headphones with noise cancellation',
  variants: [
    {
      id: 'variant_001',
      price: '199.99' // Price drop that should trigger alerts
    }
  ],
  images: [
    {
      src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop'
    }
  ]
}

async function sendTestWebhook() {
  try {
    console.log('🔄 Sending test webhook...')
    console.log('Webhook URL:', WEBHOOK_URL)
    console.log('Shop Domain:', SHOP_DOMAIN)
    console.log('Payload:', JSON.stringify(webhookPayload, null, 2))

    const bodyString = JSON.stringify(webhookPayload)
    
    // Generate HMAC signature
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(bodyString)
      .digest('base64')

    console.log('Generated signature:', signature)

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Hmac-Sha256': signature,
        'X-Shopify-Shop-Domain': SHOP_DOMAIN
      },
      body: bodyString
    })

    const responseData = await response.text()
    
    if (response.ok) {
      console.log('✅ Webhook sent successfully!')
      console.log('Response:', responseData)
      console.log('\n📧 Check MailHog at http://localhost:8025 for triggered email alerts!')
    } else {
      console.log('❌ Webhook failed:', response.status, responseData)
    }

  } catch (error) {
    console.error('❌ Error sending webhook:', error)
  }
}

sendTestWebhook()