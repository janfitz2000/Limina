#!/bin/bash
# 📨 Send a test webhook to trigger the complete pipeline

echo "📨 Sending Test Webhook..."
echo "========================="

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Check if app is running
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "❌ App is not running. Start demo first with: ./scripts/start-demo.sh"
    exit 1
fi

echo "🔄 Sending webhook to trigger price alerts..."

# Run the webhook test script
docker run --rm --network host \
    -e WEBHOOK_URL=http://localhost:3000/api/webhooks/shopify \
    -e SHOPIFY_WEBHOOK_SECRET=test_webhook_secret_docker \
    -e DEMO_SHOP_DOMAIN=docker-demo.myshopify.com \
    node:18-alpine \
    sh -c "
        npm install node-fetch &&
        node -e \"
        const crypto = require('crypto');
        const fetch = require('node-fetch');
        
        const webhookPayload = {
          id: 'demo_001',
          title: 'Premium Wireless Headphones - Flash Sale!',
          variants: [{ id: 'variant_001', price: '199.99' }],
          images: [{ src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300' }]
        };
        
        const bodyString = JSON.stringify(webhookPayload);
        const signature = crypto.createHmac('sha256', 'test_webhook_secret_docker').update(bodyString).digest('base64');
        
        fetch('http://localhost:3000/api/webhooks/shopify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Hmac-Sha256': signature,
            'X-Shopify-Shop-Domain': 'docker-demo.myshopify.com'
          },
          body: bodyString
        }).then(res => res.text()).then(data => {
          console.log('✅ Webhook sent! Response:', data);
          console.log('📧 Check MailHog at http://localhost:8025 for triggered emails!');
        }).catch(err => console.error('❌ Error:', err));
        \"
    "

echo ""
echo "🎯 What just happened:"
echo "1. 📨 Sent a Shopify product update webhook"
echo "2. 💰 Product price dropped to \$199.99"
echo "3. 🔔 This should trigger any price alerts set for \$200+ target"
echo "4. 📧 Check http://localhost:8025 to see triggered email alerts!"
echo ""