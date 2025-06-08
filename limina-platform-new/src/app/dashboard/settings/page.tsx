'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Store, Zap, AlertCircle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react'

interface ShopifyConnection {
  connected: boolean
  storeDomain?: string
  lastSync?: string
  productsCount?: number
  webhooksConfigured?: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [shopifyConnection, setShopifyConnection] = useState<ShopifyConnection>({ connected: false })
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const MERCHANT_ID = '123e4567-e89b-12d3-a456-426614174000'

  useEffect(() => {
    checkShopifyConnection()
  }, [])

  const checkShopifyConnection = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/integrations?merchantId=${MERCHANT_ID}&platform=shopify`)
      const data = await response.json()
      
      if (data.integration) {
        setShopifyConnection({
          connected: true,
          storeDomain: data.integration.credentials.domain,
          lastSync: data.integration.last_sync,
          productsCount: data.integration.metadata?.products_count || 0,
          webhooksConfigured: data.integration.webhook_endpoints?.length > 0
        })
      }
    } catch (err) {
      console.error('Error checking Shopify connection:', err)
    } finally {
      setLoading(false)
    }
  }

  const connectShopify = async () => {
    try {
      setConnecting(true)
      
      // For testing, we'll connect directly using server-side credentials
      const response = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: MERCHANT_ID,
          platform: 'shopify'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await checkShopifyConnection()
        alert('Shopify store connected successfully!')
      } else {
        alert(`Connection failed: ${data.error}`)
      }
    } catch (err) {
      console.error('Error connecting Shopify:', err)
      alert('Error connecting to Shopify')
    } finally {
      setConnecting(false)
    }
  }

  const syncProducts = async () => {
    try {
      setSyncing(true)
      
      const response = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: MERCHANT_ID,
          platform: 'shopify'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await checkShopifyConnection()
        alert(`Sync completed! ${data.itemsProcessed || 0} products synced.`)
      } else {
        alert(`Sync failed: ${data.error}`)
      }
    } catch (err) {
      console.error('Error syncing products:', err)
      alert('Error syncing products')
    } finally {
      setSyncing(false)
    }
  }

  const disconnectShopify = async () => {
    if (!confirm('Are you sure you want to disconnect your Shopify store?')) return

    try {
      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: MERCHANT_ID,
          platform: 'shopify'
        }),
      })

      if (response.ok) {
        setShopifyConnection({ connected: false })
        alert('Shopify store disconnected successfully!')
      }
    } catch (err) {
      console.error('Error disconnecting Shopify:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Manage your integrations and platform settings</p>
      </div>

      {/* Shopify Integration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Store className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Shopify Integration</h3>
              <p className="text-sm text-gray-600">Connect your Shopify store to sync products and prices</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            shopifyConnection.connected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {shopifyConnection.connected ? 'Connected' : 'Not Connected'}
          </div>
        </div>

        {shopifyConnection.connected ? (
          <div className="space-y-4">
            {/* Connection Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Store Domain</p>
                <p className="font-medium">{shopifyConnection.storeDomain}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Products Synced</p>
                <p className="font-medium">{shopifyConnection.productsCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Sync</p>
                <p className="font-medium">
                  {shopifyConnection.lastSync 
                    ? new Date(shopifyConnection.lastSync).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700">Store connection active</span>
              </div>
              <div className="flex items-center space-x-2">
                {shopifyConnection.webhooksConfigured ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                )}
                <span className="text-sm text-gray-700">
                  Webhooks {shopifyConnection.webhooksConfigured ? 'configured' : 'not configured'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={syncProducts}
                disabled={syncing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Products'}
              </button>
              <button
                onClick={() => window.open(`https://${shopifyConnection.storeDomain}/admin`, '_blank')}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Shopify Admin
              </button>
              <button
                onClick={disconnectShopify}
                className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Connect Your Shopify Store</h4>
            <p className="text-gray-600 mb-6">
              Sync your products and enable real-time price monitoring for conditional buy orders
            </p>
            <button
              onClick={connectShopify}
              disabled={connecting}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 mx-auto"
            >
              <Zap className="w-4 h-4 mr-2" />
              {connecting ? 'Connecting...' : 'Connect Shopify Store'}
            </button>
          </div>
        )}
      </div>

      {/* Discount System Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Discount System</h3>
            <p className="text-sm text-gray-600">How targeted discounts work with your Shopify store</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How It Works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your Shopify store prices remain unchanged on the storefront</li>
              <li>• Create targeted discounts for specific customers or buy orders</li>
              <li>• Customers with eligible buy orders get automatically fulfilled at discount prices</li>
              <li>• Perfect for VIP customers, bulk orders, or promotional campaigns</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Benefits:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Maintain public pricing while offering selective discounts</li>
              <li>• Automatic order fulfillment when conditions are met</li>
              <li>• Track discount usage and customer engagement</li>
              <li>• Seamless integration with your existing Shopify workflow</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}