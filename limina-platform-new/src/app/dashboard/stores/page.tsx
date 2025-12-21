'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase-fixed'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database'
import { Store, Zap, X, RefreshCw, ExternalLink } from 'lucide-react'

type StoreType = Database['public']['Tables']['stores']['Row']

export default function StoresPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stores, setStores] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!user || user.role !== 'merchant') {
      router.push('/auth')
      return
    }

    fetchStores()
  }, [user, authLoading, router])

  const fetchStores = async () => {
    if (!user?.merchant_id) return

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('merchant_id', user.merchant_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching stores:', error)
    } else {
      setStores(data || [])
    }
    setLoading(false)
  }

  const handleDisconnectStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to disconnect this store?')) return

    const { error } = await supabase
      .from('stores')
      .update({ status: 'disconnected' })
      .eq('id', storeId)

    if (error) {
      console.error('Error disconnecting store:', error)
    } else {
      fetchStores()
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
      <div className="flex justify-between items-center">
        <div>
          <p className="text-white/40 text-sm">
            Manage your e-commerce platform integrations
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="bg-[#C9A227] text-[#0C0A09] px-4 py-2 rounded-lg font-bold hover:bg-[#D4AF37] transition-colors flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Connect New Store
        </button>
      </div>

      {stores.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4">
            <Store className="w-10 h-10 text-white/30" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No stores connected</h3>
          <p className="text-white/40 mb-6 max-w-md mx-auto">
            Connect your first e-commerce store to start accepting conditional buy orders
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="bg-[#C9A227] text-[#0C0A09] px-6 py-3 rounded-lg font-bold hover:bg-[#D4AF37] transition-colors"
          >
            Connect Your First Store
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onDisconnect={handleDisconnectStore}
              onRefresh={fetchStores}
            />
          ))}
        </div>
      )}

      {showWizard && (
        <StoreConnectionWizard
          onClose={() => setShowWizard(false)}
          onSuccess={fetchStores}
          merchantId={user?.merchant_id!}
        />
      )}
    </div>
  )
}

function StoreCard({
  store,
  onDisconnect,
  onRefresh
}: {
  store: StoreType
  onDisconnect: (id: string) => void
  onRefresh: () => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/30'
      case 'pending': return 'text-[#C9A227] bg-[#C9A227]/10 border-[#C9A227]/30'
      default: return 'text-white/40 bg-white/5 border-white/10'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'shopify':
        return (
          <div className="w-10 h-10 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center">
            <span className="text-green-400 font-bold text-sm">S</span>
          </div>
        )
      case 'woocommerce':
        return (
          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center">
            <span className="text-purple-400 font-bold text-sm">W</span>
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
            <span className="text-white/60 font-bold text-sm">{platform[0].toUpperCase()}</span>
          </div>
        )
    }
  }

  return (
    <div className="bg-[#161413] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getPlatformIcon(store.platform)}
          <div>
            <h3 className="font-semibold">{store.name}</h3>
            <p className="text-sm text-white/40 capitalize">{store.platform}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(store.status)}`}>
          {store.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-white/40">URL:</span>
          <span className="text-white/60 truncate ml-2 max-w-[180px]">{store.store_url}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/40">Currency:</span>
          <span className="text-white/60">{store.currency}</span>
        </div>
        {store.last_sync_at && (
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Last Sync:</span>
            <span className="text-white/60">
              {new Date(store.last_sync_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {store.sync_error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-4">
          <p className="text-red-400 text-sm">{store.sync_error}</p>
        </div>
      )}

      <div className="flex space-x-2 pt-4 border-t border-white/5">
        <button
          onClick={onRefresh}
          className="flex-1 flex items-center justify-center gap-2 bg-white/5 text-white/60 px-3 py-2 rounded-lg text-sm hover:bg-white/10 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Sync
        </button>
        <button
          onClick={() => onDisconnect(store.id)}
          className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}

function StoreConnectionWizard({
  onClose,
  onSuccess,
  merchantId
}: {
  onClose: () => void
  onSuccess: () => void
  merchantId: string
}) {
  const [step, setStep] = useState(1)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    storeUrl: '',
    shopDomain: '',
    consumerKey: '',
    consumerSecret: ''
  })

  const platforms = [
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Connect your Shopify store with OAuth',
      color: 'bg-green-500/10 border-green-500/30 hover:border-green-500/50',
      textColor: 'text-green-400'
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      description: 'Connect your WooCommerce store with API keys',
      color: 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50',
      textColor: 'text-purple-400'
    }
  ]

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId)
    setStep(2)
  }

  const handleShopifyConnection = async () => {
    if (!formData.shopDomain) {
      alert('Please enter your shop domain')
      return
    }

    setLoading(true)
    const authUrl = `/api/auth/shopify?action=install&shop=${formData.shopDomain}&merchant_id=${merchantId}`
    window.location.href = authUrl
  }

  const handleWooCommerceConnection = async () => {
    if (!formData.name || !formData.storeUrl || !formData.consumerKey || !formData.consumerSecret) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          merchant_id: merchantId,
          name: formData.name,
          platform: 'woocommerce',
          store_url: formData.storeUrl,
          credentials: {
            consumer_key: formData.consumerKey,
            consumer_secret: formData.consumerSecret
          },
          status: 'connected'
        })

      if (error) throw error

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error connecting WooCommerce store:', error)
      alert('Failed to connect store. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#161413] border border-white/10 rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Connect Store</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 1 && (
          <div>
            <h3 className="text-lg font-medium mb-4">Choose your platform</h3>
            <div className="space-y-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformSelect(platform.id)}
                  className={`w-full p-4 border rounded-xl transition-colors text-left ${platform.color}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${platform.color}`}>
                      <span className={`${platform.textColor} text-lg font-bold`}>
                        {platform.id === 'shopify' ? 'S' : 'W'}
                      </span>
                    </div>
                    <div>
                      <h4 className={`font-medium ${platform.textColor}`}>{platform.name}</h4>
                      <p className="text-sm text-white/40">{platform.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedPlatform === 'shopify' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Connect Shopify Store</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Shop Domain *
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={formData.shopDomain}
                    onChange={(e) => setFormData(prev => ({ ...prev, shopDomain: e.target.value }))}
                    placeholder="your-shop-name"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-l-lg focus:outline-none focus:border-[#C9A227]/50 text-white placeholder:text-white/30"
                  />
                  <span className="px-3 py-2 bg-white/5 border border-l-0 border-white/10 rounded-r-lg text-white/40">
                    .myshopify.com
                  </span>
                </div>
              </div>
              <div className="bg-[#C9A227]/10 border border-[#C9A227]/30 p-3 rounded-lg">
                <p className="text-sm text-[#C9A227]">
                  <strong>Next steps:</strong> You'll be redirected to Shopify to authorize the connection.
                </p>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 text-white/60 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleShopifyConnection}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#C9A227] text-[#0C0A09] rounded-lg font-bold hover:bg-[#D4AF37] disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Connecting...' : 'Connect Shopify'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && selectedPlatform === 'woocommerce' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Connect WooCommerce Store</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Store Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Store"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#C9A227]/50 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Store URL *
                </label>
                <input
                  type="url"
                  value={formData.storeUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, storeUrl: e.target.value }))}
                  placeholder="https://yourstore.com"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#C9A227]/50 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Consumer Key *
                </label>
                <input
                  type="text"
                  value={formData.consumerKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, consumerKey: e.target.value }))}
                  placeholder="ck_..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#C9A227]/50 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Consumer Secret *
                </label>
                <input
                  type="password"
                  value={formData.consumerSecret}
                  onChange={(e) => setFormData(prev => ({ ...prev, consumerSecret: e.target.value }))}
                  placeholder="cs_..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#C9A227]/50 text-white placeholder:text-white/30"
                />
              </div>
              <div className="bg-[#C9A227]/10 border border-[#C9A227]/30 p-3 rounded-lg">
                <p className="text-sm text-[#C9A227]">
                  <strong>How to get API keys:</strong> WooCommerce &rarr; Settings &rarr; Advanced &rarr; REST API
                </p>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 text-white/60 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleWooCommerceConnection}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#C9A227] text-[#0C0A09] rounded-lg font-bold hover:bg-[#D4AF37] disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Connecting...' : 'Connect Store'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
