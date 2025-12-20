'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { DEMO_ANALYTICS, DEMO_DEMAND_BY_PRODUCT } from '@/lib/demo-data'
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
  Download,
  Eye,
  BarChart3
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
    product_title?: string
    customer_name?: string
  }>
  weeklyTrend?: Array<{
    day: string
    orders: number
    revenue: number
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

function AnalyticsContent() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    async function fetchAnalytics() {
      // Use demo data if in demo mode
      if (isDemo) {
        setAnalytics(DEMO_ANALYTICS as AnalyticsData)
        setLoading(false)
        return
      }

      if (!user?.merchantId) {
        setLoading(false)
        return
      }

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
  }, [user?.merchantId, isDemo])

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
      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5" />
            <span className="font-medium">Demo Mode - Sample analytics data</span>
          </div>
        </div>
      )}

      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Track your performance and customer demand insights</p>
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
          change={3}
          trend="up"
          icon={Target}
        />
        <StatCard
          title="Avg. Order Value"
          value={overview.averageOrderValue}
          prefix="$"
          change={5}
          trend="up"
          icon={TrendingUp}
        />
      </div>

      {/* Weekly trend chart */}
      {analytics?.weeklyTrend && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Order Trend</h3>
          <div className="flex items-end justify-between h-48 gap-2">
            {analytics.weeklyTrend.map((day, i) => {
              const maxOrders = Math.max(...analytics.weeklyTrend!.map(d => d.orders))
              const height = (day.orders / maxOrders) * 100
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">{day.orders}</span>
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all hover:from-blue-700 hover:to-blue-500"
                      style={{ height: `${height}%`, minHeight: '20px' }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{day.day}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

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

      {/* Demand by product - Enhanced visualization */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Price Demand Analysis</h3>
            <p className="text-sm text-gray-500 mt-1">See how many customers want each product at different price points</p>
          </div>
          <BarChart3 className="h-5 w-5 text-gray-400" />
        </div>

        {isDemo ? (
          <div className="space-y-6">
            {DEMO_DEMAND_BY_PRODUCT.filter(p => p.totalWaiting > 0).map((item) => (
              <div key={item.product.id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product.image_url}
                      alt={item.product.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{item.product.title}</h4>
                      <p className="text-sm text-gray-500">Current: ${item.product.current_price}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{item.totalWaiting}</div>
                    <div className="text-xs text-gray-500">customers waiting</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Demand by Price Point</div>
                  <div className="flex flex-wrap gap-2">
                    {item.pricePoints.map((point) => (
                      <div
                        key={point.price}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg"
                      >
                        <span className="font-semibold text-blue-700">${point.price}</span>
                        <span className="text-gray-500">-</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-700">{point.count} {point.count === 1 ? 'customer' : 'customers'}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Price range: ${item.lowestAsk} - ${item.highestAsk}
                  </span>
                  <span className="font-medium text-green-600">
                    ${item.potentialRevenue.toLocaleString()} potential revenue
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : analytics?.demandByPrice && analytics.demandByPrice.length > 0 ? (
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
        ) : (
          <p className="text-gray-500 text-center py-8">No demand data available</p>
        )}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {analytics.recentActivity.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'fulfilled' ? 'bg-green-500' :
                    activity.status === 'monitoring' ? 'bg-blue-500' :
                    activity.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}></div>
                  <div>
                    <span className="text-sm text-gray-900 font-medium">
                      {activity.product_title || `Order #${activity.id.slice(0, 8)}`}
                    </span>
                    {activity.customer_name && (
                      <span className="text-sm text-gray-500 ml-2">- {activity.customer_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">${activity.target_price}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </span>
                </div>
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

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  )
}
