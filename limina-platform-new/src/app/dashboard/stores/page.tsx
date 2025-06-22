'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase-fixed'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database'

type Store = Database['public']['Tables']['stores']['Row']

export default function StoresPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Connected Stores</h1>
          <p className="text-gray-600 mt-2">
            Manage your e-commerce platform integrations
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect New Store
        </button>
      </div>

      {stores.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No stores connected</h3>
          <p className="text-gray-600 mb-6">
            Connect your first e-commerce store to start accepting conditional buy orders
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
  store: Store
  onDisconnect: (id: string) => void
  onRefresh: () => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'shopify':
        return (
          <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
        )
      case 'woocommerce':
        return (
          <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">{platform[0].toUpperCase()}</span>
          </div>
        )
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getPlatformIcon(store.platform)}
          <div>
            <h3 className="font-semibold text-gray-900">{store.name}</h3>
            <p className="text-sm text-gray-600 capitalize">{store.platform}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(store.status)}`}>
          {store.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">URL:</span>
          <span className="text-gray-900 truncate ml-2">{store.store_url}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Currency:</span>
          <span className="text-gray-900">{store.currency}</span>
        </div>
        {store.last_sync_at && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Last Sync:</span>
            <span className="text-gray-900">
              {new Date(store.last_sync_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {store.sync_error && (
        <div className="bg-red-50 border border-red-200 rounded p-2 mb-4">
          <p className="text-red-600 text-sm">{store.sync_error}</p>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={onRefresh}
          className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
        >
          Sync Products
        </button>
        <button
          onClick={() => onDisconnect(store.id)}
          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm transition-colors"
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
      icon: '🛍️',
      color: 'bg-green-600'
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      description: 'Connect your WooCommerce store with API keys',
      icon: '🔧',
      color: 'bg-purple-600'
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
    
    // Redirect to Shopify OAuth
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Connect Store</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center`}>
                      <span className="text-white text-lg">{platform.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{platform.name}</h4>
                      <p className="text-sm text-gray-600">{platform.description}</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Domain *
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={formData.shopDomain}
                    onChange={(e) => setFormData(prev => ({ ...prev, shopDomain: e.target.value }))}
                    placeholder="your-shop-name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-600">
                    .myshopify.com
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Next steps:</strong> You'll be redirected to Shopify to authorize the connection.
                  Make sure you have admin access to your Shopify store.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={handleShopifyConnection}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Store"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store URL *
                </label>
                <input
                  type="url"
                  value={formData.storeUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, storeUrl: e.target.value }))}
                  placeholder="https://yourstore.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consumer Key *
                </label>
                <input
                  type="text"
                  value={formData.consumerKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, consumerKey: e.target.value }))}
                  placeholder="ck_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consumer Secret *
                </label>
                <input
                  type="password"
                  value={formData.consumerSecret}
                  onChange={(e) => setFormData(prev => ({ ...prev, consumerSecret: e.target.value }))}
                  placeholder="cs_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>How to get API keys:</strong> Go to WooCommerce → Settings → Advanced → REST API and create new API keys with read/write permissions.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={handleWooCommerceConnection}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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