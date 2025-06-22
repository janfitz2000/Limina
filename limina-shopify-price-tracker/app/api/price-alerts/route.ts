// API routes for managing price alerts
import { NextRequest, NextResponse } from 'next/server'
import { PriceAlertService } from '../../../lib/shopify-integration'
import { EmailService } from '../../../lib/email-service'
import { DatabaseService } from '../../../lib/database'

// Create a new price alert
export async function POST(request: NextRequest) {
  try {
    const { productId, email, targetPrice, customerName, sendWelcome } = await request.json()
    
    // Validate required fields
    if (!productId || !email || !targetPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, email, targetPrice' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate target price
    if (typeof targetPrice !== 'number' || targetPrice <= 0) {
      return NextResponse.json(
        { error: 'Target price must be a positive number' },
        { status: 400 }
      )
    }

    // Get product details
    const product = await DatabaseService.getProduct(productId, '')
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if target price is reasonable (not below current price by more than 50%)
    const minimumPrice = product.current_price * 0.5
    if (targetPrice < minimumPrice) {
      return NextResponse.json(
        { error: `Target price too low. Minimum: $${minimumPrice.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Create price alert
    const result = await PriceAlertService.createPriceAlert({
      productId: product.id,
      email,
      targetPrice,
      customerName
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create price alert' },
        { status: 500 }
      )
    }

    // Send confirmation email
    await EmailService.sendAlertConfirmation({
      email,
      productTitle: product.title,
      targetPrice,
      productUrl: product.product_url || `https://${product.shop_domain}/products/${product.shopify_product_id}`,
      customerName
    })

    // Send welcome email if this is their first alert
    if (sendWelcome) {
      await EmailService.sendWelcomeEmail(email, customerName)
    }

    // Log analytics event
    await DatabaseService.logEvent(product.shop_domain, 'price_alert_created', {
      product_id: product.id,
      target_price: targetPrice,
      current_price: product.current_price
    })

    return NextResponse.json({
      success: true,
      alert: result.alert,
      message: 'Price alert created successfully'
    })
    
  } catch (error) {
    console.error('Error creating price alert:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get price alerts for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const email = searchParams.get('email')
    
    if (productId) {
      // Get alerts for a specific product
      const alerts = await PriceAlertService.getProductPriceAlerts(productId)
      return NextResponse.json({ alerts })
    }
    
    if (email) {
      // Get alerts for a specific email
      const alerts = await PriceAlertService.getAlertsByEmail(email)
      return NextResponse.json({ alerts })
    }
    
    return NextResponse.json(
      { error: 'Either productId or email parameter is required' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Error fetching price alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price alerts' },
      { status: 500 }
    )
  }
}