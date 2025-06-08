'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ShoppingCart, TrendingDown, Clock, CheckCircle2, XCircle, Activity, DollarSign } from 'lucide-react'

interface Product {
  id: string
  title: string
  current_price: number
  price: number
  currency: string
  image_url?: string
}

interface BuyOrder {
  id: string
  target_price: number
  current_price: number
  status: string
  created_at: string
  expires_at: string
  fulfilled_at?: string
  products?: Product
}

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  
  // Using Mike Chen's customer ID from our seed data (he has multiple orders)
  const CUSTOMER_ID = '223e4567-e89b-12d3-a456-426614174002'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch buy orders for this customer
        const response = await fetch(`/api/buy-orders?customerId=${CUSTOMER_ID}`)
        const data = await response.json()
        
        if (data.buy_orders) {
          setBuyOrders(data.buy_orders)
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load your buy orders')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    const badges = {
      monitoring: { class: 'bg-blue-100 text-blue-800', icon: Activity },
      fulfilled: { class: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      pending: { class: 'bg-yellow-100 text-yellow-800', icon: Clock },
      expired: { class: 'bg-gray-100 text-gray-800', icon: XCircle },
      cancelled: { class: 'bg-red-100 text-red-800', icon: XCircle }
    }
    return badges[status as keyof typeof badges] || { class: 'bg-gray-100 text-gray-800', icon: Clock }
  }

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()
  const calculateSavings = (target: number, current: number) => current - target

  const activeOrders = buyOrders.filter(order => order.status === 'monitoring')
  const fulfilledOrders = buyOrders.filter(order => order.status === 'fulfilled')
  const totalSavings = fulfilledOrders.reduce((sum, order) => sum + calculateSavings(order.target_price, order.current_price), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your buy orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Logo />
              <h1 className="text-2xl font-bold text-blue-600">Limina</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Customer Dashboard</span>
              <Link href="/" className="text-gray-600 hover:text-blue-600">
                ← Back to Site
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Your Buy Orders</h2>
          <p className="text-gray-600 mt-2">
            Track your conditional purchases and see when your price targets are met
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Fulfilled Orders</p>
                <p className="text-2xl font-bold text-gray-900">{fulfilledOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSavings)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Active Monitoring Orders
              </h3>
              <p className="text-sm text-gray-600 mt-1">We're watching these products for you</p>
            </div>
            
            <div className="p-6 space-y-4">
              {activeOrders.map((order) => {
                const isClose = order.current_price <= order.target_price * 1.1 // Within 10%
                const probability = Math.max(30, Math.min(95, Math.round((order.current_price - order.target_price) / order.current_price * 100 + 60)))
                
                return (
                  <div key={order.id} className={`border rounded-lg p-4 ${isClose ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        {order.products?.image_url && (
                          <img 
                            className="h-16 w-16 rounded-lg object-cover" 
                            src={order.products.image_url} 
                            alt={order.products.title} 
                          />
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{order.products?.title}</h4>
                          <p className="text-sm text-gray-600">Target: {formatCurrency(order.target_price)} | Current: {formatCurrency(order.current_price)}</p>
                          <p className="text-sm text-gray-500">Created: {formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800`}>
                          Monitoring
                        </span>
                        <p className="text-sm text-blue-600 mt-2 font-medium">
                          {probability}% probability based on trends
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Price Progress</span>
                        <span>{formatCurrency(Math.abs(order.current_price - order.target_price))} to go</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${isClose ? 'bg-blue-500' : 'bg-gray-400'}`}
                          style={{
                            width: `${Math.min(100, Math.max(20, (order.target_price / order.current_price) * 100))}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Fulfilled Orders */}
        {fulfilledOrders.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                Completed Purchases
              </h3>
              <p className="text-sm text-gray-600 mt-1">Your successful buy orders and savings</p>
            </div>
            
            <div className="p-6 space-y-4">
              {fulfilledOrders.map((order) => {
                const savings = calculateSavings(order.target_price, order.current_price)
                const savingsPercent = Math.round((savings / order.current_price) * 100)
                
                return (
                  <div key={order.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {order.products?.image_url && (
                          <img 
                            className="h-16 w-16 rounded-lg object-cover" 
                            src={order.products.image_url} 
                            alt={order.products.title} 
                          />
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{order.products?.title}</h4>
                          <p className="text-sm text-gray-600">Purchased at: {formatCurrency(order.target_price)}</p>
                          <p className="text-sm text-gray-500">Fulfilled: {order.fulfilled_at ? formatDate(order.fulfilled_at) : 'Recently'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                          ✓ Complete
                        </span>
                        <p className="text-sm text-green-600 mt-2 font-bold">
                          Saved {formatCurrency(savings)} ({savingsPercent}%)
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* All Orders Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All Buy Orders</h3>
            <p className="text-sm text-gray-600 mt-1">Complete history of your conditional purchases</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
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
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {buyOrders.length > 0 ? buyOrders.map((order) => {
                  const status = getStatusBadge(order.status)
                  const StatusIcon = status.icon
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {order.products?.image_url && (
                            <img 
                              className="h-10 w-10 rounded-lg object-cover mr-3" 
                              src={order.products.image_url} 
                              alt={order.products.title} 
                            />
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {order.products?.title || 'Product'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(order.target_price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(order.current_price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${status.class}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No buy orders found. Create your first buy order on our landing page!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Merchant View
            </Link>
            <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center">
              <TrendingDown className="w-4 h-4 mr-2" />
              Create Buy Order
            </Link>
            <a href="http://127.0.0.1:54323" target="_blank" className="text-blue-600 hover:text-blue-800 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Database View
            </a>
            <button className="text-blue-600 hover:text-blue-800 flex items-center" onClick={() => window.location.reload()}>
              <Clock className="w-4 h-4 mr-2" />
              Refresh Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
