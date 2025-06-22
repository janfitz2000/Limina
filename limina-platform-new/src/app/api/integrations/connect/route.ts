import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { merchantId, platform, credentials } = await request.json()

    if (!merchantId || !platform) {
      return NextResponse.json({ 
        error: 'Merchant ID and platform are required' 
      }, { status: 400 })
    }

    const db = createClient()

    if (platform === 'shopify') {
      return await handleShopifyConnection(db, merchantId, credentials)
    } else if (platform === 'woocommerce') {
      return await handleWooCommerceConnection(db, merchantId, credentials)
    }

    return NextResponse.json({ 
      error: 'Unsupported platform' 
    }, { status: 400 })

  } catch (error) {
    console.error('Integration connection error:', error)
    return NextResponse.json({ 
      error: 'Failed to connect integration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function handleShopifyConnection(db: any, merchantId: string, credentials?: any) {
  try {
    if (!credentials || !credentials.shopDomain || !credentials.accessToken) {
      // If no manual credentials provided, use OAuth flow or server-side credentials
      // For now, return error asking for credentials
      return NextResponse.json({ 
        error: 'Shopify credentials required. Please use manual setup or OAuth flow.' 
      }, { status: 400 })
    }

    const cleanDomain = credentials.shopDomain.replace(/\.myshopify\.com$/, '')
    const fullDomain = `${cleanDomain}.myshopify.com`

    // Test connection first
    const shopResponse = await fetch(`https://${fullDomain}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': credentials.accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!shopResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to connect to Shopify. Please check your credentials.' 
      }, { status: 400 })
    }

    const shopData = await shopResponse.json()

    // Create or update integration record
    const integrationData = {
      merchant_id: merchantId,
      platform: 'shopify',
      name: shopData.shop.name,
      credentials: {
        shop_domain: fullDomain,
        api_key: credentials.apiKey || null,
        api_secret: credentials.apiSecret || null
      },
      access_token: credentials.accessToken,
      status: 'connected',
      last_sync: new Date().toISOString(),
      metadata: {
        shop_id: shopData.shop.id,
        currency: shopData.shop.currency,
        timezone: shopData.shop.iana_timezone
      }
    }

    // Check if integration already exists
    const { data: existingIntegration } = await db
      .from('integrations')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('platform', 'shopify')
      .single()

    if (existingIntegration) {
      // Update existing integration
      await db
        .from('integrations')
        .update(integrationData)
        .eq('id', existingIntegration.id)
    } else {
      // Create new integration
      await db
        .from('integrations')
        .insert(integrationData)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Shopify store connected successfully',
      shop: shopData.shop
    })

  } catch (error) {
    console.error('Shopify connection error:', error)
    return NextResponse.json({ 
      error: 'Failed to connect Shopify store' 
    }, { status: 500 })
  }
}

async function handleWooCommerceConnection(db: any, merchantId: string, credentials?: any) {
  // Placeholder for WooCommerce connection logic
  return NextResponse.json({ 
    success: true,
    message: 'WooCommerce connection not yet implemented' 
  })
}