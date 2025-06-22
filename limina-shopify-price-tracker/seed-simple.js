// Simple demo data seeding
const { v4: uuidv4 } = require('uuid')

async function runSQL(query, params = []) {
  const { exec } = require('child_process')
  const { promisify } = require('util')
  const execAsync = promisify(exec)
  
  const escapedParams = params.map(p => String(p).replace(/'/g, "''"))
  let finalQuery = query
  
  escapedParams.forEach((param, i) => {
    finalQuery = finalQuery.replace(`$${i + 1}`, `'${param}'`)
  })
  
  const command = `docker exec limina-test-db psql -U postgres -d limina_test -c "${finalQuery}"`
  const { stdout } = await execAsync(command)
  return stdout
}

async function seedData() {
  console.log('🌱 Seeding demo data...')
  
  const shopDomain = 'demo-electronics.myshopify.com'
  const productIds = []
  
  try {
    // Create demo shop
    await runSQL(`INSERT INTO shops (shop_domain, access_token, shop_name, shop_email, currency) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (shop_domain) DO NOTHING`, 
      [shopDomain, 'demo_access_token', 'TechHub Electronics', 'owner@techhub.com', 'USD'])
    
    console.log('✅ Shop created')
    
    // Create products
    const products = [
      { shopify_id: 'headphones_001', title: 'Premium Wireless Headphones', price: 299.99, current: 249.99 },
      { shopify_id: 'watch_002', title: 'Smart Fitness Watch', price: 399.99, current: 349.99 },
      { shopify_id: 'speaker_003', title: 'Bluetooth Speaker Pro', price: 149.99, current: 119.99 },
      { shopify_id: 'keyboard_004', title: 'Gaming Keyboard RGB', price: 199.99, current: 179.99 }
    ]
    
    for (const product of products) {
      const id = uuidv4()
      productIds.push(id)
      await runSQL(`INSERT INTO products (id, shopify_product_id, shop_domain, title, description, price, current_price, currency, image_url, product_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (shopify_product_id, shop_domain) DO NOTHING`, 
        [id, product.shopify_id, shopDomain, product.title, `Professional ${product.title}`, product.price, product.current, 'USD', 'https://via.placeholder.com/300x300', `https://${shopDomain}/products/${product.shopify_id}`])
    }
    
    console.log('✅ Products created')
    
    // Create price alerts
    const alerts = [
      { email: 'sarah@email.com', name: 'Sarah Johnson', target: 230.00, product: 0 },
      { email: 'mike@email.com', name: 'Mike Chen', target: 320.00, product: 1 },
      { email: 'lisa@email.com', name: 'Lisa Rodriguez', target: 100.00, product: 2 }
    ]
    
    for (const alert of alerts) {
      const productId = productIds[alert.product]
      const status = products[alert.product].current <= alert.target ? 'triggered' : 'active'
      
      await runSQL(`INSERT INTO price_alerts (id, product_id, email, target_price, customer_name, status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`, 
        [uuidv4(), productId, alert.email, alert.target, alert.name, status])
    }
    
    console.log('✅ Price alerts created')
    
    console.log('')
    console.log('🎮 INTERACTIVE DEMO READY!')
    console.log('===========================')
    console.log('')
    console.log('🌐 Open these URLs to play around:')
    console.log('📱 Main Dashboard: http://localhost:3002?shop=demo-electronics.myshopify.com')
    console.log('🎨 Brand Settings: http://localhost:3002/brand-settings?shop=demo-electronics.myshopify.com') 
    console.log('👥 Customer View: http://localhost:3002/customer-dashboard?email=sarah@email.com')
    console.log('📧 Email Capture: http://localhost:8025')
    console.log('')
    console.log('🎯 WHAT YOU CAN DO:')
    console.log('• See live product prices and customer alerts')
    console.log('• View triggered vs active alerts')
    console.log('• Customize email branding and colors')
    console.log('• See customer dashboard with their alerts')
    console.log('• All data is real and persisted!')
    console.log('')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

seedData()