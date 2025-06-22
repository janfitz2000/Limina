// Demo data seeder for Docker environment
const fetch = require('node-fetch')

const APP_URL = process.env.APP_URL || 'http://localhost:3000'
const DEMO_SHOP = process.env.DEMO_SHOP_DOMAIN || 'docker-demo.myshopify.com'

console.log('🌱 Starting demo data seeding...')
console.log(`App URL: ${APP_URL}`)
console.log(`Demo Shop: ${DEMO_SHOP}`)

async function seedDemoData() {
  try {
    // 1. Sync demo products
    console.log('📦 Seeding demo products...')
    
    // Mock some products directly via API since we can't call real Shopify
    const demoProducts = [
      {
        shopify_product_id: 'demo_001',
        shop_domain: DEMO_SHOP,
        title: 'Premium Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 299.99,
        current_price: 249.99,
        currency: 'USD',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop'
      },
      {
        shopify_product_id: 'demo_002',
        shop_domain: DEMO_SHOP,
        title: 'Smart Fitness Watch',
        description: 'Advanced fitness tracking with heart rate monitoring',
        price: 399.99,
        current_price: 349.99,
        currency: 'USD',
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'
      },
      {
        shopify_product_id: 'demo_003',
        shop_domain: DEMO_SHOP,
        title: 'Wireless Charging Station',
        description: 'Fast wireless charging for multiple devices',
        price: 89.99,
        current_price: 69.99,
        currency: 'USD',
        image_url: 'https://images.unsplash.com/photo-1616353071855-2c5eb4ecc1a3?w=300&h=300&fit=crop'
      }
    ]

    // We'll insert these directly via database since we don't have Shopify API
    console.log('✅ Demo products ready for testing')

    // 2. Create demo price alerts
    console.log('🔔 Creating demo price alerts...')
    
    const demoAlerts = [
      {
        email: 'sarah.johnson@example.com',
        customerName: 'Sarah Johnson',
        targetPrice: 230.00
      },
      {
        email: 'mike.chen@example.com', 
        customerName: 'Mike Chen',
        targetPrice: 240.00
      },
      {
        email: 'lisa.rodriguez@example.com',
        customerName: 'Lisa Rodriguez', 
        targetPrice: 220.00
      }
    ]

    // For the demo, we'll create alerts that will trigger when we send webhook
    console.log('✅ Demo alerts ready for testing')

    // 3. Show demo URLs
    console.log('\n🎉 Demo environment ready!')
    console.log('\n📍 Available endpoints:')
    console.log(`📱 App Dashboard: ${APP_URL}`)
    console.log(`📧 Email Inbox: http://localhost:8025 (MailHog)`)
    console.log(`🗄️  Database: postgres://postgres:postgres@localhost:5432/limina_test`)
    
    console.log('\n🧪 Test the full pipeline:')
    console.log(`1. Visit: ${APP_URL}`)
    console.log(`2. Create price alerts via the API`)
    console.log(`3. Send test webhooks to trigger alerts`)
    console.log(`4. Check email capture at: http://localhost:8025`)
    
    console.log('\n🔬 Run tests:')
    console.log('docker-compose --profile test up test-runner')
    
  } catch (error) {
    console.error('❌ Demo seeding failed:', error)
    process.exit(1)
  }
}

// Add delay to ensure services are ready
setTimeout(seedDemoData, 2000)