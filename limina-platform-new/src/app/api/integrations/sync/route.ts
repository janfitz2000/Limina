import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { merchantId, platform } = await request.json()

    const supabase = supabaseAdmin

    if (!merchantId || !platform) {
      return NextResponse.json(
        { error: 'Missing merchantId or platform' },
        { status: 400 }
      )
    }

    // Use environment variables for testing
    const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN
    
    if (!shopifyDomain || !accessToken) {
      throw new Error('Shopify credentials not configured')
    }

    // Fetch products from Shopify
    const shopifyResponse = await fetch(
      `https://${shopifyDomain}/admin/api/2023-10/products.json?limit=10`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!shopifyResponse.ok) {
      throw new Error(`Shopify API error: ${shopifyResponse.status}`)
    }

    const shopifyData = await shopifyResponse.json()
    const products = shopifyData.products || []

    let synced = 0
    for (const shopifyProduct of products) {
      try {
        const productData = {
          merchant_id: merchantId,
          shopify_product_id: shopifyProduct.id.toString(),
          title: shopifyProduct.title,
          description: shopifyProduct.body_html || '',
          price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
          current_price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
          currency: 'GBP',
          image_url: shopifyProduct.images[0]?.src || null
        }

        // Check if product already exists
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('shopify_product_id', shopifyProduct.id.toString())
          .eq('merchant_id', merchantId)
          .single()

        let error = null
        if (existingProduct) {
          // Update existing product
          const { error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existingProduct.id)
          error = updateError
        } else {
          // Insert new product
          const { error: insertError } = await supabase
            .from('products')
            .insert(productData)
          error = insertError
        }

        if (error) {
          console.error(`Error syncing product ${shopifyProduct.title}:`, error)
        } else {
          synced++
          console.log(`Successfully synced: ${shopifyProduct.title}`)
        }
      } catch (err) {
        console.error('Error syncing product:', err)
      }
    }

    // Update integration last_sync
    await supabase
      .from('integrations')
      .update({ 
        last_sync: new Date().toISOString(),
        metadata: { products_count: synced }
      })
      .eq('merchant_id', merchantId)
      .eq('platform', platform)

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      itemsProcessed: synced,
      totalProducts: products.length
    })
  } catch (error) {
    console.error('Integration sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get sync status for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Missing merchantId' },
        { status: 400 }
      )
    }

    // This would typically get the last sync status from the database
    // For now, return a mock response
    return NextResponse.json({
      success: true,
      status: {
        lastSync: new Date().toISOString(),
        platform: 'shopify',
        productsSync: { success: true, count: 10 },
        inventorySync: { success: true, count: 10 }
      }
    })
  } catch (error) {
    console.error('Get sync status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}