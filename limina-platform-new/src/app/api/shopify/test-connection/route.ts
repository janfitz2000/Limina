import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { shopDomain, accessToken } = await request.json()

    if (!shopDomain || !accessToken) {
      return NextResponse.json({ 
        error: 'Shop domain and access token are required' 
      }, { status: 400 })
    }

    // Clean up shop domain (remove .myshopify.com if present)
    const cleanDomain = shopDomain.replace(/\.myshopify\.com$/, '')
    const fullDomain = `${cleanDomain}.myshopify.com`

    // Test the connection by fetching shop information
    const response = await fetch(`https://${fullDomain}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      let errorMessage = 'Failed to connect to Shopify'

      if (response.status === 401) {
        errorMessage = 'Invalid access token'
      } else if (response.status === 404) {
        errorMessage = 'Shop not found. Check your shop domain.'
      } else if (response.status === 403) {
        errorMessage = 'Access token does not have required permissions'
      }

      return NextResponse.json({ 
        error: errorMessage,
        details: errorData
      }, { status: response.status })
    }

    const shopData = await response.json()

    // Also test if we can fetch products to verify permissions
    const productsResponse = await fetch(`https://${fullDomain}/admin/api/2024-01/products.json?limit=1`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    const canReadProducts = productsResponse.ok

    return NextResponse.json({
      success: true,
      shop: {
        name: shopData.shop.name,
        domain: shopData.shop.domain,
        currency: shopData.shop.currency,
        timezone: shopData.shop.iana_timezone
      },
      permissions: {
        canReadProducts,
        hasRequiredScopes: canReadProducts // Simplified check
      }
    })

  } catch (error) {
    console.error('Shopify connection test error:', error)
    return NextResponse.json({ 
      error: 'Failed to test connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}