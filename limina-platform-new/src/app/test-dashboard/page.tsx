'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BuyOrder {
  id: string
  merchant_id: string
  product_id: string
  customer_id: string
  customer_email: string
  customer_name?: string
  target_price: number
  current_price: number
  currency: string
  status: string
  condition_type: string
  condition_value: Record<string, unknown>
  expires_at: string
  fulfilled_at?: string
  created_at: string
  updated_at: string
}

interface CustomerStats {
  activeOrders: number
  fulfilledOrders: number
  totalSavings: number
}

interface MerchantStats {
  activeOrders: number
  fulfilledOrders: number
  totalRevenue: number
  conversionRate: number
}

export default function TestDashboard() {
  const [activeTab, setActiveTab] = useState<'customer' | 'merchant'>('customer')
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null)
  const [merchantStats, setMerchantStats] = useState<MerchantStats | null>(null)
  const [loading, setLoading] = useState(false)

  const customerId = '550e8400-e29b-41d4-a716-446655440001'
  const merchantId = '550e8400-e29b-41d4-a716-446655440000'

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'customer') {
        // Load customer data
        const [ordersResponse, statsResponse] = await Promise.all([
          fetch(`/api/test-mock?type=buy-orders&customerId=${customerId}`),
          fetch(`/api/test-mock?type=customer-stats&customerId=${customerId}`)
        ])
        
        const ordersData = await ordersResponse.json()
        const statsData = await statsResponse.json()
        
        setBuyOrders(ordersData.data || [])
        setCustomerStats(statsData.data || null)
      } else {
        // Load merchant data
        const [ordersResponse, statsResponse] = await Promise.all([
          fetch(`/api/test-mock?type=buy-orders&merchantId=${merchantId}`),
          fetch(`/api/test-mock?type=merchant-stats&merchantId=${merchantId}`)
        ])
        
        const ordersData = await ordersResponse.json()
        const statsData = await statsResponse.json()
        
        setBuyOrders(ordersData.data || [])
        setMerchantStats(statsData.data || null)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'monitoring': return 'text-blue-600 bg-blue-100'
      case 'fulfilled': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      case 'expired': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Limina Test Dashboard</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← Back to Main Site
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('customer')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'customer'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🛍️ Customer View
              </button>
              <button
                onClick={() => setActiveTab('merchant')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'merchant'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🏪 Merchant View
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {activeTab === 'customer' && customerStats && (
                <>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                            <span className="text-white font-semibold">📋</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Active Orders</dt>
                            <dd className="text-lg font-medium text-gray-900">{customerStats.activeOrders}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                            <span className="text-white font-semibold">✅</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Fulfilled Orders</dt>
                            <dd className="text-lg font-medium text-gray-900">{customerStats.fulfilledOrders}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                            <span className="text-white font-semibold">💰</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Savings</dt>
                            <dd className="text-lg font-medium text-gray-900">{formatCurrency(customerStats.totalSavings)}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'merchant' && merchantStats && (
                <>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                            <span className="text-white font-semibold">📋</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Active Orders</dt>
                            <dd className="text-lg font-medium text-gray-900">{merchantStats.activeOrders}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                            <span className="text-white font-semibold">💰</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                            <dd className="text-lg font-medium text-gray-900">{formatCurrency(merchantStats.totalRevenue)}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                            <span className="text-white font-semibold">📈</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                            <dd className="text-lg font-medium text-gray-900">{merchantStats.conversionRate.toFixed(1)}%</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Orders Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {activeTab === 'customer' ? 'Your Buy Orders' : 'Customer Buy Orders'}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {activeTab === 'customer' 
                    ? 'Track your conditional purchases and see when your price targets are met'
                    : 'Monitor customer conditional purchase orders and analytics'
                  }
                </p>
              </div>
              <div className="border-t border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Target Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expires
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {buyOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.id.slice(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.customer_name || order.customer_email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(order.target_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(order.current_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.expires_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Test Info */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-blue-400 text-lg">ℹ️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Test Dashboard - Mock Data
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      This dashboard is using mock data to demonstrate the functionality. 
                      The data includes {buyOrders.length} buy orders with Shopify snowboard products.
                    </p>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      <li>Customer ID: {customerId}</li>
                      <li>Merchant ID: {merchantId}</li>
                      <li>Products: Hydrogen, Liquid, and Complete Snowboards</li>
                      <li>Real-time updates would work with live Shopify integration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}