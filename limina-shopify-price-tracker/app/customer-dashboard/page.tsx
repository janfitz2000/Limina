// Customer dashboard to manage their price alerts
'use client'

import { useState, useEffect } from 'react'
import { PriceAlertService } from '../../lib/shopify-integration'

interface PriceAlert {
  id: string
  product_id: string
  email: string
  target_price: number
  customer_name?: string
  status: 'active' | 'triggered' | 'expired' | 'cancelled'
  created_at: string
  triggered_at?: string
  product?: {
    title: string
    current_price: number
    image_url?: string
    product_url?: string
  }
}

export default function CustomerDashboard() {
  const [email, setEmail] = useState('')
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [showEmailInput, setShowEmailInput] = useState(true)

  useEffect(() => {
    // Check if email is in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
      setShowEmailInput(false)
      loadAlerts(emailParam)
    }
  }, [])

  const loadAlerts = async (customerEmail: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/price-alerts?email=${encodeURIComponent(customerEmail)}`)
      const data = await response.json()
      
      if (data.alerts) {
        setAlerts(data.alerts)
      }
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    
    setShowEmailInput(false)
    loadAlerts(email)
  }

  const cancelAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/price-alerts/${alertId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setAlerts(alerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'cancelled' as const }
            : alert
        ))
      }
    } catch (error) {
      console.error('Error canceling alert:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'triggered': return 'bg-blue-100 text-blue-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢'
      case 'triggered': return '🎉'
      case 'expired': return '⏰'
      case 'cancelled': return '❌'
      default: return '⚪'
    }
  }

  const calculateSavings = (targetPrice: number, currentPrice: number) => {
    if (currentPrice >= targetPrice) return null
    const savings = targetPrice - currentPrice
    const percent = Math.round((savings / targetPrice) * 100)
    return { amount: savings, percent }
  }

  if (showEmailInput) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Price Alerts</h1>
            <p className="text-gray-600">Enter your email to view and manage your price alerts</p>
          </div>
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              View My Alerts
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Bookmark this page with your email in the URL: 
              <br />
              <code className="text-xs bg-blue-100 px-1 rounded">
                ?email=your@email.com
              </code>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Price Alerts</h1>
              <p className="text-gray-600">{email}</p>
            </div>
            <button
              onClick={() => setShowEmailInput(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Change Email
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No price alerts found</h3>
            <p className="text-gray-600 mb-6">
              You haven't set up any price alerts yet. Visit any product page to create your first alert!
            </p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{alerts.length}</div>
                <div className="text-sm text-gray-600">Total Alerts</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {alerts.filter(a => a.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {alerts.filter(a => a.status === 'triggered').length}
                </div>
                <div className="text-sm text-gray-600">Triggered</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {alerts.filter(a => a.status === 'active' && a.product && a.product.current_price <= a.target_price).length}
                </div>
                <div className="text-sm text-gray-600">Ready to Buy</div>
              </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-4">
              {alerts.map((alert) => {
                const savings = alert.product ? calculateSavings(alert.target_price, alert.product.current_price) : null
                const isReadyToBuy = savings && savings.amount > 0

                return (
                  <div key={alert.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {alert.product?.title || 'Product'}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                            {getStatusIcon(alert.status)} {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                          </span>
                          {isReadyToBuy && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              🎯 Ready to Buy!
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Target Price</p>
                            <p className="text-lg font-semibold text-gray-900">${alert.target_price.toFixed(2)}</p>
                          </div>
                          {alert.product && (
                            <div>
                              <p className="text-sm text-gray-600">Current Price</p>
                              <p className={`text-lg font-semibold ${
                                alert.product.current_price <= alert.target_price ? 'text-green-600' : 'text-gray-900'
                              }`}>
                                ${alert.product.current_price.toFixed(2)}
                              </p>
                            </div>
                          )}
                          {savings && (
                            <div>
                              <p className="text-sm text-gray-600">Potential Savings</p>
                              <p className="text-lg font-semibold text-green-600">
                                ${savings.amount.toFixed(2)} ({savings.percent}% off)
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Created {new Date(alert.created_at).toLocaleDateString()}
                            {alert.triggered_at && (
                              <span> • Triggered {new Date(alert.triggered_at).toLocaleDateString()}</span>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            {alert.product?.product_url && (
                              <a
                                href={alert.product.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                              >
                                View Product
                              </a>
                            )}
                            {alert.status === 'active' && (
                              <button
                                onClick={() => cancelAlert(alert.id)}
                                className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-colors text-sm"
                              >
                                Cancel Alert
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {alert.product?.image_url && (
                        <div className="ml-4">
                          <img
                            src={alert.product.image_url}
                            alt={alert.product.title}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}