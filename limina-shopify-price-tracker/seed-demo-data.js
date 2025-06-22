// Seed interactive demo data
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
  console.log('🌱 Seeding interactive demo data...')
  
  const shopDomain = 'demo-electronics.myshopify.com'
  
  try {
    // Create demo shop
    await runSQL(`INSERT INTO shops (shop_domain, access_token, shop_name, shop_email, currency) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (shop_domain) DO NOTHING`, 
      [shopDomain, 'demo_access_token', 'TechHub Electronics', 'owner@techhub.com', 'USD'])
    
    // Create demo products
    const products = [
      {
        id: uuidv4(),
        shopify_id: 'demo_headphones_001',
        title: 'Premium Wireless Headphones',
        price: 299.99,
        current_price: 249.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop'
      },
      {
        id: uuidv4(),
        shopify_id: 'demo_watch_002', 
        title: 'Smart Fitness Watch',
        price: 399.99,
        current_price: 349.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'
      },
      {
        id: uuidv4(),
        shopify_id: 'demo_speaker_003',
        title: 'Bluetooth Speaker Pro',
        price: 149.99,
        current_price: 119.99,
        image: 'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=300&h=300&fit=crop'
      },
      {
        id: uuidv4(),
        shopify_id: 'demo_keyboard_004',
        title: 'Mechanical Gaming Keyboard',
        price: 199.99,
        current_price: 179.99,
        image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=300&fit=crop'
      },
      {
        id: uuidv4(),
        shopify_id: 'demo_charger_005',
        title: 'Wireless Charging Pad',
        price: 79.99,
        current_price: 59.99,
        image: 'https://images.unsplash.com/photo-1616353071855-2c5eb4ecc1a3?w=300&h=300&fit=crop'
      },
      {
        id: uuidv4(),
        shopify_id: 'demo_mouse_006',
        title: 'Ergonomic Wireless Mouse',
        price: 89.99,
        current_price: 69.99,
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop'
      }
    ]
    
    for (const product of products) {
      await runSQL(`INSERT INTO products (id, shopify_product_id, shop_domain, title, description, price, current_price, currency, image_url, product_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (shopify_product_id, shop_domain) DO NOTHING`, 
        [product.id, product.shopify_id, shopDomain, product.title, `Professional ${product.title.toLowerCase()} with premium features`, product.price, product.current_price, 'USD', product.image, `https://${shopDomain}/products/${product.shopify_id}`])
      
      // Add price history
      await runSQL(`INSERT INTO price_history (product_id, price) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [product.id, product.current_price])
    }
    
    // Create demo price alerts
    const alerts = [
      { email: 'sarah.tech@email.com', name: 'Sarah Johnson', product_idx: 0, target: 230.00 },
      { email: 'mike.gadgets@email.com', name: 'Mike Chen', product_idx: 1, target: 320.00 },
      { email: 'lisa.music@email.com', name: 'Lisa Rodriguez', product_idx: 2, target: 100.00 },
      { email: 'alex.gamer@email.com', name: 'Alex Thompson', product_idx: 3, target: 160.00 },
      { email: 'emma.wireless@email.com', name: 'Emma Wilson', product_idx: 4, target: 50.00 },
      { email: 'david.ergonomic@email.com', name: 'David Kim', product_idx: 5, target: 60.00 }
    ]
    
    for (let i = 0; i < alerts.length; i++) {
      const alert = alerts[i]
      const product = products[alert.product_idx]
      const status = product.current_price <= alert.target ? 'triggered' : 'active'
      
      await runSQL(`INSERT INTO price_alerts (id, product_id, email, target_price, customer_name, status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`, 
        [uuidv4(), product.id, alert.email, alert.target, alert.name, status])
    }
    
    // Create brand settings
    await runSQL(`INSERT INTO brand_settings (shop_domain, brand_name, brand_logo_url, primary_color, secondary_color, email_footer_text) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (shop_domain) DO NOTHING`, 
      [shopDomain, 'TechHub Electronics', 'https://via.placeholder.com/120x40/667eea/ffffff?text=TechHub', '#667eea', '#764ba2', 'Thanks for shopping with TechHub! Follow us for exclusive deals.'])
    
    // Add analytics events
    const analyticsEvents = [
      'price_alert_created',
      'product_synced', 
      'webhook_received',
      'email_sent'
    ]
    
    for (const event of analyticsEvents) {
      await runSQL(`INSERT INTO app_analytics (shop_domain, event_type, event_data) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, 
        [shopDomain, event, '{"demo": true}'])
    }
    
    console.log('✅ Demo data seeded successfully!')
    console.log('')
    console.log('🌐 Interactive demo ready at:')
    console.log('📱 Main Dashboard: http://localhost:3002')
    console.log('🎨 Brand Settings: http://localhost:3002/brand-settings?shop=demo-electronics.myshopify.com')
    console.log('👥 Customer Dashboard: http://localhost:3002/customer-dashboard?email=sarah.tech@email.com')
    console.log('📧 Email Capture: http://localhost:8025')
    console.log('')
    console.log('🎮 PLAY AROUND WITH:')
    console.log('• View products and their current prices')
    console.log('• See active price alerts from customers')
    console.log('• Check which alerts have been triggered')
    console.log('• Customize email branding')
    console.log('• View customer alert dashboard')
    console.log('')
    
  } catch (error) {
    console.error('❌ Error seeding data:', error.message)
  }
}

seedData()