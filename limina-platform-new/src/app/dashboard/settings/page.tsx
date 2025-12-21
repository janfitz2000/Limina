'use client'

import React, { useState, useEffect } from 'react'
import { Store, Zap, AlertCircle, CheckCircle, RefreshCw, ExternalLink, Key, Eye, EyeOff, Unlink } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useRouter, useSearchParams } from 'next/navigation'

interface StoreConnection {
  connected: boolean
  storeDomain?: string
  storeName?: string
  lastSync?: string
  productsCount?: number
  webhooksConfigured?: boolean
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [shopifyConnection, setShopifyConnection] = useState<StoreConnection>({ connected: false })
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showManualSetup, setShowManualSetup] = useState(false)
  const [shopifyCredentials, setShopifyCredentials] = useState({
    shopDomain: '',
    accessToken: ''
  })
  const [showAccessToken, setShowAccessToken] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user || user.role !== 'merchant') {
      router.push('/auth')
      return
    }

    if (user.merchantId) {
      checkShopifyConnection()
    }

    const connected = searchParams.get('connected')
    if (connected === 'shopify') {
      setNotification({ type: 'success', message: 'Shopify store connected successfully! Products are syncing.' })
      setTimeout(() => setNotification(null), 5000)
    }
  }, [user, authLoading, router, searchParams])

  const checkShopifyConnection = async () => {
    if (!user?.merchantId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/integrations?merchantId=${user.merchantId}&platform=shopify`)
      const data = await response.json()

      if (data.store || data.integration) {
        const store = data.store || data.integration
        setShopifyConnection({
          connected: true,
          storeDomain: store.credentials?.shop_domain || store.store_url?.replace('https://', ''),
          storeName: store.name,
          lastSync: store.last_sync_at || store.last_sync,
          productsCount: store.metadata?.products_count || 0,
          webhooksConfigured: true
        })
      }
    } catch (err) {
      console.error('Error checking Shopify connection:', err)
    } finally {
      setLoading(false)
    }
  }

  const startOAuthFlow = () => {
    if (!user?.merchantId) return

    const shopDomain = prompt('Enter your Shopify store domain (e.g., your-store.myshopify.com):')
    if (!shopDomain) return

    const cleanDomain = shopDomain.includes('.myshopify.com')
      ? shopDomain
      : `${shopDomain}.myshopify.com`

    window.location.href = `/api/auth/shopify?action=install&shop=${cleanDomain}&merchant_id=${user.merchantId}`
  }

  const connectWithManualCredentials = async () => {
    if (!user?.merchantId) return

    try {
      if (!shopifyCredentials.shopDomain || !shopifyCredentials.accessToken) {
        setNotification({ type: 'error', message: 'Please fill in all required fields' })
        return
      }

      setConnecting(true)

      const response = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: user.merchantId,
          platform: 'shopify',
          credentials: shopifyCredentials
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await checkShopifyConnection()
        setShowManualSetup(false)
        setShopifyCredentials({ shopDomain: '', accessToken: '' })
        setNotification({ type: 'success', message: 'Shopify store connected successfully!' })

        syncProducts()
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to connect' })
      }
    } catch (err) {
      console.error('Error connecting with manual credentials:', err)
      setNotification({ type: 'error', message: 'Error connecting to Shopify' })
    } finally {
      setConnecting(false)
    }
  }

  const syncProducts = async () => {
    if (!user?.merchantId) return

    try {
      setSyncing(true)

      const response = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: user.merchantId,
          platform: 'shopify'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await checkShopifyConnection()
        setNotification({ type: 'success', message: `Synced ${data.itemsProcessed || 0} products` })
      } else {
        setNotification({ type: 'error', message: data.error || 'Sync failed' })
      }
    } catch (err) {
      console.error('Error syncing products:', err)
      setNotification({ type: 'error', message: 'Error syncing products' })
    } finally {
      setSyncing(false)
    }
  }

  const disconnectShopify = async () => {
    if (!user?.merchantId) return
    if (!confirm('Are you sure you want to disconnect your Shopify store?')) return

    try {
      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: user.merchantId,
          platform: 'shopify'
        }),
      })

      if (response.ok) {
        setShopifyConnection({ connected: false })
        setNotification({ type: 'success', message: 'Shopify store disconnected' })
      }
    } catch (err) {
      console.error('Error disconnecting Shopify:', err)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-white/40 text-sm">Manage your integrations and settings</p>
      </div>

      {notification && (
        <div className={`p-4 rounded-lg flex items-center gap-3 dashboard-enter ${
          notification.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto text-white/40 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      <div className="dashboard-card p-6 dashboard-enter">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#96BF48]/20 rounded-lg">
              <Store className="h-6 w-6 text-[#96BF48]" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Shopify Integration</h3>
              <p className="text-sm text-white/40">Connect your Shopify store to sync products</p>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            shopifyConnection.connected
              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
              : 'bg-white/5 text-white/40 border border-white/10'
          }`}>
            {shopifyConnection.connected ? 'Connected' : 'Not Connected'}
          </div>
        </div>

        {shopifyConnection.connected ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Store</p>
                <p className="font-medium text-white truncate">{shopifyConnection.storeName || shopifyConnection.storeDomain}</p>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Products</p>
                <p className="font-medium text-white">{shopifyConnection.productsCount || 0} synced</p>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Last Sync</p>
                <p className="font-medium text-white">
                  {shopifyConnection.lastSync
                    ? new Date(shopifyConnection.lastSync).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-white/60">Store connected and webhooks active</span>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
              <button
                onClick={syncProducts}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A227] text-[#0C0A09] font-bold rounded-lg hover:bg-[#D4AF37] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Products'}
              </button>
              <a
                href={`https://${shopifyConnection.storeDomain}/admin`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 text-white/70 font-medium rounded-lg hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Shopify Admin
              </a>
              <button
                onClick={disconnectShopify}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 font-medium rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <Unlink className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8">
            {!showManualSetup ? (
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-[#96BF48]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="h-8 w-8 text-[#96BF48]" />
                </div>
                <h4 className="text-lg font-bold mb-2">Connect Your Shopify Store</h4>
                <p className="text-white/50 text-sm mb-6">
                  Sync your products and enable price alerts for customers
                </p>
                <div className="space-y-3">
                  <button
                    onClick={startOAuthFlow}
                    disabled={connecting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#96BF48] text-[#0C0A09] font-bold rounded-lg hover:bg-[#A6CF58] transition-colors disabled:opacity-50"
                  >
                    <Zap className="h-5 w-5" />
                    {connecting ? 'Connecting...' : 'Connect with Shopify'}
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-[#161413] text-white/30">or</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowManualSetup(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-white/5 text-white/70 font-medium rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Key className="h-4 w-4" />
                    Enter API Credentials
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-[#C9A227]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Key className="h-6 w-6 text-[#C9A227]" />
                  </div>
                  <h4 className="text-lg font-bold mb-1">Enter API Credentials</h4>
                  <p className="text-white/50 text-sm">
                    Get these from your Shopify admin under Apps → Develop apps
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                      Shop Domain
                    </label>
                    <input
                      type="text"
                      placeholder="your-store"
                      value={shopifyCredentials.shopDomain}
                      onChange={(e) => setShopifyCredentials(prev => ({ ...prev, shopDomain: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#C9A227]/50 transition-all"
                    />
                    <p className="text-xs text-white/30 mt-1">Without .myshopify.com</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                      Admin API Access Token
                    </label>
                    <div className="relative">
                      <input
                        type={showAccessToken ? 'text' : 'password'}
                        placeholder="shpat_xxxxx"
                        value={shopifyCredentials.accessToken}
                        onChange={(e) => setShopifyCredentials(prev => ({ ...prev, accessToken: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#C9A227]/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccessToken(!showAccessToken)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={connectWithManualCredentials}
                      disabled={connecting || !shopifyCredentials.shopDomain || !shopifyCredentials.accessToken}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#C9A227] text-[#0C0A09] font-bold rounded-lg hover:bg-[#D4AF37] transition-colors disabled:opacity-50"
                    >
                      <Zap className="h-5 w-5" />
                      {connecting ? 'Connecting...' : 'Connect Store'}
                    </button>
                    <button
                      onClick={() => {
                        setShowManualSetup(false)
                        setShopifyCredentials({ shopDomain: '', accessToken: '' })
                      }}
                      className="px-6 py-3 bg-white/5 text-white/70 font-medium rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="dashboard-card p-6 dashboard-enter dashboard-enter-delay-1">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">How It Works</p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-full flex items-center justify-center text-[#C9A227] font-bold text-sm">
              1
            </div>
            <div>
              <h4 className="font-medium text-white mb-1">Connect Store</h4>
              <p className="text-sm text-white/40">Link your Shopify store and sync products</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-full flex items-center justify-center text-[#C9A227] font-bold text-sm">
              2
            </div>
            <div>
              <h4 className="font-medium text-white mb-1">Add Widget</h4>
              <p className="text-sm text-white/40">Embed the price alert widget on your product pages</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-full flex items-center justify-center text-[#C9A227] font-bold text-sm">
              3
            </div>
            <div>
              <h4 className="font-medium text-white mb-1">Convert Sales</h4>
              <p className="text-sm text-white/40">Send targeted discounts to interested customers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
