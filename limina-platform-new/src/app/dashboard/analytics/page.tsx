'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalOrders: number
    activeOrders: number
    fulfilledOrders: number
    totalRevenue: number
    averageOrderValue: number
    conversionRate: number
  }
  demandByPrice: Array<{
    productId: string
    title: string
    currentPrice: number
    demandByPrice: Array<{
      price: number
      orders: number
      revenue: number
    }>
  }>
  recentActivity: Array<{
    id: string
    status: string
    target_price: number
    created_at: string
  }>
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  prefix = '',
  suffix = ''
}: {
  title: string
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  prefix?: string
  suffix?: string
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-sm ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend === 'up' ? (
              <ArrowUpRight className="h-4 w-4 mr-1" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="h-4 w-4 mr-1" />
            ) : null}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </p>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user?.merchantId) return

      try {
        const response = await fetch(`/api/analytics/merchant/${user.merchantId}`)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user?.merchantId])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  const overview = analytics?.overview || {
    totalOrders: 0,
    activeOrders: 0,
    fulfilledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Track your performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={overview.totalRevenue}
          prefix="$"
          change={12}
          trend="up"
          icon={DollarSign}
        />
        <StatCard
          title="Total Orders"
          value={overview.totalOrders}
          change={8}
          trend="up"
          icon={ShoppingCart}
        />
        <StatCard
          title="Conversion Rate"
          value={overview.conversionRate}
          suffix="%"
          change={-2}
          trend="down"
          icon={Target}
        />
        <StatCard
          title="Avg. Order Value"
          value={overview.averageOrderValue.toFixed(2)}
          prefix="$"
          change={5}
          trend="up"
          icon={TrendingUp}
        />
      </div>

      {/* Orders breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: 'Active / Monitoring', value: overview.activeOrders, color: 'bg-blue-500', percentage: overview.totalOrders > 0 ? (overview.activeOrders / overview.totalOrders * 100).toFixed(1) : 0 },
              { label: 'Fulfilled', value: overview.fulfilledOrders, color: 'bg-green-500', percentage: overview.totalOrders > 0 ? (overview.fulfilledOrders / overview.totalOrders * 100).toFixed(1) : 0 },
              { label: 'Other (Pending/Cancelled)', value: overview.totalOrders - overview.activeOrders - overview.fulfilledOrders, color: 'bg-gray-400', percentage: overview.totalOrders > 0 ? ((overview.totalOrders - overview.activeOrders - overview.fulfilledOrders) / overview.totalOrders * 100).toFixed(1) : 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Active Orders</span>
              <span className="font-semibold text-blue-600">{overview.activeOrders}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Fulfilled Orders</span>
              <span className="font-semibold text-green-600">{overview.fulfilledOrders}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Total Orders</span>
              <span className="font-semibold text-gray-900">{overview.totalOrders}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-semibold text-gray-900">{overview.conversionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demand by product */}
      {analytics?.demandByPrice && analytics.demandByPrice.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Demand Analysis</h3>
          <div className="space-y-6">
            {analytics.demandByPrice.slice(0, 5).map((product) => (
              <div key={product.productId} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{product.title}</span>
                  <span className="text-sm text-gray-500">Current: ${product.currentPrice}</span>
                </div>
                {product.demandByPrice.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {product.demandByPrice.map((point) => (
                      <div
                        key={point.price}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        ${point.price}: {point.orders} orders
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No demand data yet</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {analytics.recentActivity.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'fulfilled' ? 'bg-green-500' :
                    activity.status === 'monitoring' ? 'bg-blue-500' :
                    activity.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    Order #{activity.id.slice(0, 8)} - ${activity.target_price}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  )
}
