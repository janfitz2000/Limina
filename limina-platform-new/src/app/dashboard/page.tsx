'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase-fixed'
import { ShoppingCart, TrendingUp, DollarSign, Activity, AlertTriangle, Store, ArrowUpRight, ArrowDownRight } from 'lucide-react'

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
  customer_name: string
  customer_email: string
  target_price: number
  current_price: number
  status: string
  created_at: string
  expires_at: string
  products?: Product
}

interface Stats {
  total: number
  monitoring: number
  fulfilled: number
  pending: number
  cancelled: number
  totalRevenue: number
  avgDiscount: number
  conversionRate: number
}

export default function DashboardOverview() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [stores, setStores] = useState<any[]>([])

  useEffect(() => {
    if (authLoading || !user || !user.merchant_id) return

    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch buy orders for this merchant
        const { data: ordersData, error: ordersError } = await supabase
          .from('buy_orders')
          .select(`
            *,
            products (
              id,
              title,
              current_price,
              price,
              currency,
              image_url
            ),
            customers (
              id,
              email,
              name
            )
          `)
          .eq('merchant_id', user.merchant_id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (ordersError) throw ordersError
        
        // Fetch stores for this merchant
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('*')
          .eq('merchant_id', user.merchant_id)

        if (storesError) throw storesError

        // Calculate basic stats from orders
        const ordersCount = ordersData?.length || 0
        const monitoring = ordersData?.filter(o => o.status === 'monitoring').length || 0
        const fulfilled = ordersData?.filter(o => o.status === 'fulfilled').length || 0
        const totalRevenue = ordersData?.filter(o => o.status === 'fulfilled')
          .reduce((sum, o) => sum + Number(o.target_price), 0) || 0
        const conversionRate = ordersCount > 0 ? Math.round((fulfilled / ordersCount) * 100) : 0

        setBuyOrders(ordersData || [])
        setStores(storesData || [])
        setStats({
          total: ordersCount,
          monitoring,
          fulfilled,
          pending: 0,
          cancelled: 0,
          totalRevenue,
          avgDiscount: 0,
          conversionRate
        })
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load dashboard data')
        setLoading(false)
      }
    }

    fetchData()
  }, [user, authLoading])

  const getStatusBadge = (status: string) => {
    const badges = {
      monitoring: 'bg-blue-100 text-blue-800',
      fulfilled: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading merchant dashboard...</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Welcome back, TechStore!</h3>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your conditional buy orders today.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link 
              href="/dashboard/products" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Store className="w-4 h-4 mr-2" />
              Manage Products
            </Link>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="flex-shrink-0">
                <ShoppingCart className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Monitoring</p>
                <p className="text-3xl font-bold text-gray-900">{stats.monitoring}</p>
                <p className="text-sm text-blue-600 mt-1">
                  {stats.monitoring > 0 ? 'Orders waiting for price drops' : 'No active orders'}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Activity className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  +8% from last month
                </p>
              </div>
              <div className="flex-shrink-0">
                <DollarSign className="h-12 w-12 text-purple-600 opacity-20" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                  -2% from last month
                </p>
              </div>
              <div className="flex-shrink-0">
                <TrendingUp className="h-12 w-12 text-orange-600 opacity-20" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Buy Orders */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Buy Orders</h3>
                <p className="text-sm text-gray-600 mt-1">Latest customer demand signals</p>
              </div>
              <Link 
                href="/dashboard/orders" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all →
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {buyOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {order.products?.image_url && (
                      <img 
                        className="h-12 w-12 rounded-lg object-cover" 
                        src={order.products.image_url} 
                        alt={order.products.title} 
                      />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {order.products?.title || 'Product'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer_name} • {formatCurrency(order.target_price)} target
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                    <div className="text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              {buyOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No buy orders yet. Customer orders will appear here.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          {/* Integration Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Integration</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Shopify Connected</span>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm">Configure</button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Payment Setup</span>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm">Setup</button>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Alerts
            </h3>
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  <strong>Price Alert:</strong> 3 orders waiting for MacBook price drop to £1,200
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>New Order:</strong> Customer wants iPhone 15 at £650
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Orders</span>
                <span className="text-sm font-medium">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fulfilled</span>
                <span className="text-sm font-medium text-green-600">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue</span>
                <span className="text-sm font-medium">£1,250</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
