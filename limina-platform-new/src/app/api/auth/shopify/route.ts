// src/app/api/auth/shopify/route.ts - Shopify OAuth Integration
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

const supabase = supabaseAdmin

// Shopify OAuth configuration
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET
const APP_URL = process.env.NEXT_PUBLIC_APP_URL

const REQUIRED_SCOPES = [
  'read_products',
  'write_products', 
  'read_orders',
  'read_inventory',
  'write_inventory'
].join(',')

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  if (action === 'install') {
    return handleInstallation(request)
  } else if (action === 'callback') {
    return handleCallback(request)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

async function handleInstallation(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const shop = searchParams.get('shop')
    const merchantId = searchParams.get('merchant_id')

    if (!shop || !merchantId) {
      return NextResponse.json({ 
        error: 'Missing shop domain or merchant ID' 
      }, { status: 400 })
    }

    // Validate shop domain format
    if (!shop.endsWith('.myshopify.com')) {
      return NextResponse.json({ 
        error: 'Invalid shop domain format' 
      }, { status: 400 })
    }

    // Generate secure state token
    const stateToken = crypto.randomBytes(32).toString('hex')
    
    // Store OAuth state in database
    await supabase
      .from('oauth_states')
      .insert({
        merchant_id: merchantId,
        platform: 'shopify',
        state_token: stateToken,
        return_url: `${APP_URL}/dashboard/settings?connected=shopify`,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      })

    // Build Shopify OAuth URL
    const authUrl = new URL(`https://${shop}/admin/oauth/authorize`)
    authUrl.searchParams.set('client_id', SHOPIFY_API_KEY!)
    authUrl.searchParams.set('scope', REQUIRED_SCOPES)
    authUrl.searchParams.set('redirect_uri', `${APP_URL}/api/auth/shopify?action=callback`)
    authUrl.searchParams.set('state', stateToken)

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Shopify OAuth installation error:', error)
    return NextResponse.json({ 
      error: 'Failed to initiate Shopify OAuth' 
    }, { status: 500 })
  }
}

async function handleCallback(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const shop = searchParams.get('shop')
    const hmac = searchParams.get('hmac')

    if (!code || !state || !shop || !hmac) {
      return NextResponse.json({ 
        error: 'Missing required OAuth parameters' 
      }, { status: 400 })
    }

    // Verify HMAC for security
    const queryString = new URL(request.url).search.substring(1)
    const hmacParams = new URLSearchParams(queryString)
    hmacParams.delete('hmac')
    
    const computedHmac = crypto
      .createHmac('sha256', SHOPIFY_API_SECRET!)
      .update(hmacParams.toString())
      .digest('hex')

    if (computedHmac !== hmac) {
      return NextResponse.json({ 
        error: 'Invalid HMAC verification' 
      }, { status: 400 })
    }

    // Verify and get OAuth state from database
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state_token', state)
      .eq('platform', 'shopify')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (stateError || !oauthState) {
      return NextResponse.json({ 
        error: 'Invalid or expired OAuth state' 
      }, { status: 400 })
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenData.error_description}`)
    }

    // Get shop information
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': tokenData.access_token,
      },
    })

    const shopData = await shopResponse.json()

    if (!shopResponse.ok) {
      throw new Error('Failed to fetch shop information')
    }

    // Create or update store record
    const storeData = {
      merchant_id: oauthState.merchant_id,
      name: shopData.shop.name,
      platform: 'shopify' as const,
      store_url: `https://${shop}`,
      credentials: {
        shop_domain: shop,
        scope: tokenData.scope
      },
      access_token: tokenData.access_token,
      status: 'connected' as const,
      currency: shopData.shop.currency,
      timezone: shopData.shop.iana_timezone || 'Europe/London'
    }

    // Check if store already exists
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('merchant_id', oauthState.merchant_id)
      .eq('platform', 'shopify')
      .eq('store_url', `https://${shop}`)
      .single()

    if (existingStore) {
      // Update existing store
      await supabase
        .from('stores')
        .update(storeData)
        .eq('id', existingStore.id)
    } else {
      // Create new store
      await supabase
        .from('stores')
        .insert(storeData)
    }

    // Set up webhooks for the store
    await setupShopifyWebhooks(shop, tokenData.access_token)

    // Clean up OAuth state
    await supabase
      .from('oauth_states')
      .delete()
      .eq('id', oauthState.id)

    // Redirect to success page
    const returnUrl = oauthState.return_url || `${APP_URL}/dashboard/settings?connected=shopify`
    return NextResponse.redirect(returnUrl)

  } catch (error) {
    console.error('Shopify OAuth callback error:', error)
    return NextResponse.redirect(
      `${APP_URL}/dashboard/settings?error=shopify_connection_failed`
    )
  }
}

async function setupShopifyWebhooks(shop: string, accessToken: string) {
  const webhookEndpoint = `${APP_URL}/api/webhooks/shopify`
  
  const webhooks = [
    { topic: 'products/update', address: webhookEndpoint },
    { topic: 'products/create', address: webhookEndpoint },
    { topic: 'orders/paid', address: webhookEndpoint },
    { topic: 'app/uninstalled', address: webhookEndpoint }
  ]

  for (const webhook of webhooks) {
    try {
      await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          webhook: {
            topic: webhook.topic,
            address: webhook.address,
            format: 'json'
          }
        })
      })
    } catch (error) {
      console.error(`Failed to create webhook for ${webhook.topic}:`, error)
    }
  }
}