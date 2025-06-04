import { getSupabaseClient } from './supabase'

export async function getAccessToken(shop) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('shopify_tokens')
    .select('access_token')
    .eq('shop', shop)
    .single()
  if (error || !data) {
    throw new Error(`Token for ${shop} not found`)
  }
  return data.access_token
}

export async function shopifyRestRequest(shop, method, path, body) {
  const token = await getAccessToken(shop)
  const url = `https://${shop}/admin/api/2023-07/${path}`
  const response = await fetch(url, {
    method,
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!response.ok) {
    throw new Error(`Shopify REST request failed: ${response.status}`)
  }
  return response.json()
}

export async function shopifyGraphqlRequest(shop, query, variables = {}) {
  return shopifyRestRequest(shop, 'POST', 'graphql.json', { query, variables })
}
