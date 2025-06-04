# Limita

## Shopify OAuth

This project now includes a minimal Next.js setup with an API route at `/pages/api/auth/shopify`. The route performs the OAuth handshake with Shopify and stores shop domains and access tokens in a `shopify_tokens` table in Supabase.

Environment variables required:

```
SHOPIFY_CLIENT_ID
SHOPIFY_CLIENT_SECRET
SHOPIFY_REDIRECT_URI
SHOPIFY_SCOPES (optional)
SUPABASE_URL
SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY
```

Helpers for calling the Shopify Admin API are available in `lib/shopify.js`.
