import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Use service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { merchantId, platform } = await req.json()

    // Validate Shopify connection using environment credentials
    if (platform === 'shopify') {
      const domain = process.env.SHOPIFY_STORE_DOMAIN
      const accessToken = process.env.SHOPIFY_ACCESS_TOKEN
      
      if (!domain || !accessToken) {
        throw new Error('Shopify credentials not configured on server')
      }

      const shopifyResponse = await fetch(`https://${domain}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      })

      if (!shopifyResponse.ok) {
        throw new Error(`Shopify API error: ${shopifyResponse.status} ${shopifyResponse.statusText}`)
      }

      const shopData = await shopifyResponse.json()
      
      // Store the integration
      const { data: integration, error } = await supabase
        .from('integrations')
        .upsert({
          merchant_id: merchantId,
          platform: 'shopify',
          credentials: {
            domain,
            accessToken,
            shopId: shopData.shop.id,
            shopName: shopData.shop.name
          },
          sync_settings: {
            products: true,
            inventory: true,
            orders: true,
            customers: false
          },
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      // Also update the merchant record
      await supabase
        .from('merchants')
        .update({
          shopify_domain: domain,
          shopify_access_token: accessToken
        })
        .eq('id', merchantId)

      return NextResponse.json({
        success: true,
        integration,
        shop: shopData.shop
      })
    }

    throw new Error('Unsupported platform')

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Integration connection error:', error)
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    )
  }
}