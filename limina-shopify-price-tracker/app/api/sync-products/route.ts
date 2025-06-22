// API route to sync products from Shopify
import { NextRequest, NextResponse } from 'next/server'
import { ShopifyPriceTracker } from '../../../lib/shopify-integration'
import { DatabaseService } from '../../../lib/database'

export async function POST(request: NextRequest) {
  try {
    const { shop } = await request.json()
    
    if (!shop) {
      return NextResponse.json({ error: 'Shop domain is required' }, { status: 400 })
    }

    // Get shop credentials from database
    const shopData = await DatabaseService.getShop(shop)
    
    if (!shopData) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Initialize Shopify integration
    const tracker = new ShopifyPriceTracker(shop, shopData.access_token)
    
    // Sync products
    const result = await tracker.syncProducts()
    
    // Log analytics event
    await DatabaseService.logEvent(shop, 'products_synced', {
      synced_count: result.synced,
      error_count: result.errors.length
    })

    return NextResponse.json({
      success: result.success,
      synced: result.synced,
      errors: result.errors
    })
    
  } catch (error) {
    console.error('Error in sync-products API:', error)
    return NextResponse.json(
      { error: 'Failed to sync products' },
      { status: 500 }
    )
  }
}