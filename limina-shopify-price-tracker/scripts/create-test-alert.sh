#!/bin/bash
# 🔔 Create a test price alert via API

echo "🔔 Creating Test Price Alert..."
echo "=============================="

# Check if app is running
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "❌ App is not running. Start demo first with: ./scripts/start-demo.sh"
    exit 1
fi

echo "📝 Creating price alert for demo product..."

# Create a price alert that will trigger with our test webhook
curl -X POST http://localhost:3000/api/price-alerts \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "demo_001",
    "email": "test-customer@example.com",
    "targetPrice": 220.00,
    "customerName": "Test Customer",
    "sendWelcome": true
  }' | jq '.'

echo ""
echo "✅ Price alert created!"
echo ""
echo "🎯 Now run the test webhook to trigger it:"
echo "  ./scripts/test-webhook.sh"
echo ""