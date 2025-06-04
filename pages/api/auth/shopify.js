import { getSupabaseClient } from '../../../lib/supabase'

export default async function handler(req, res) {
  const { shop, code } = req.query

  if (!shop) {
    res.status(400).json({ error: 'Missing shop param' })
    return
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET
  const redirectUri = process.env.SHOPIFY_REDIRECT_URI
  const scopes = process.env.SHOPIFY_SCOPES || 'read_products'

  if (!code) {
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`
    res.redirect(installUrl)
    return
  }

  const tokenUrl = `https://${shop}/admin/oauth/access_token`
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
  })

  const data = await response.json()
  if (!response.ok) {
    res.status(400).json(data)
    return
  }

  const supabase = getSupabaseClient()
  await supabase.from('shopify_tokens').upsert({ shop, access_token: data.access_token })

  res.status(200).json({ success: true })
}
