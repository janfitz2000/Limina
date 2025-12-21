'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { DEMO_ANALYTICS, DEMO_DEMAND_BY_PRODUCT } from '@/lib/demo-data'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Target,
  ArrowUpRight,
  Download,
  BarChart3,
  Package
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

function AnalyticsContent() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    async function fetchAnalytics() {
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
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-sm">Performance insights and demand trends</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C9A227]/50 outline-none"
          >
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dashboard-card dashboard-card-featured p-5 dashboard-enter dashboard-enter-delay-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-[#C9A227] uppercase tracking-widest">Revenue</p>
            <span className="flex items-center text-xs text-[#C9A227]">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              12%
            </span>
          </div>
          <p className="text-3xl font-extrabold text-[#C9A227] stat-number">${overview.totalRevenue.toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 bg-[#C9A227]/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-[#C9A227]" />
            </div>
            <p className="text-xs text-white/40">Total earned</p>
          </div>
        </div>

        <div className="dashboard-card p-5 dashboard-enter dashboard-enter-delay-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Orders</p>
            <span className="flex items-center text-xs text-[#C9A227]">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              8%
            </span>
          </div>
          <p className="text-3xl font-extrabold stat-number">{overview.totalOrders}</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 bg-white/5 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-white/40" />
            </div>
            <p className="text-xs text-white/40">All time</p>
          </div>
        </div>

        <div className="dashboard-card p-5 dashboard-enter dashboard-enter-delay-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Conversion</p>
            <span className="flex items-center text-xs text-[#C9A227]">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              3%
            </span>
          </div>
          <p className="text-3xl font-extrabold stat-number">{overview.conversionRate}%</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 bg-white/5 flex items-center justify-center">
              <Target className="h-4 w-4 text-white/40" />
            </div>
            <p className="text-xs text-white/40">Success rate</p>
          </div>
        </div>

        <div className="dashboard-card p-5 dashboard-enter dashboard-enter-delay-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Avg. Order</p>
          </div>
          <p className="text-3xl font-extrabold stat-number">${overview.averageOrderValue}</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 bg-white/5 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white/40" />
            </div>
            <p className="text-xs text-white/40">Per order value</p>
          </div>
        </div>
      </div>

      {/* Weekly Trend */}
      {analytics?.weeklyTrend && (
        <div className="dashboard-card p-5 dashboard-enter dashboard-enter-delay-5">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Weekly Trend</p>
          <div className="flex items-end justify-between h-40 gap-2">
            {analytics.weeklyTrend.map((day) => {
              const maxOrders = Math.max(...analytics.weeklyTrend!.map(d => d.orders))
              const height = maxOrders > 0 ? (day.orders / maxOrders) * 100 : 0
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs text-white/40 mb-1">{day.orders}</span>
                    <div
                      className="w-full bg-gradient-to-t from-[#C9A227]/60 to-[#C9A227]/80 rounded-t transition-all hover:from-[#C9A227] hover:to-[#D4AF37]"
                      style={{ height: `${Math.max(height, 10)}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40 mt-2">{day.day}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Breakdown */}
        <div className="lg:col-span-2 dashboard-card p-5 dashboard-enter dashboard-enter-delay-6">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Order Status</p>
          <div className="space-y-4">
            {[
              { label: 'Active', value: overview.activeOrders, color: 'bg-[#C9A227]', percentage: overview.totalOrders > 0 ? (overview.activeOrders / overview.totalOrders * 100) : 0 },
              { label: 'Fulfilled', value: overview.fulfilledOrders, color: 'bg-green-500', percentage: overview.totalOrders > 0 ? (overview.fulfilledOrders / overview.totalOrders * 100) : 0 },
              { label: 'Other', value: Math.max(0, overview.totalOrders - overview.activeOrders - overview.fulfilledOrders), color: 'bg-white/20', percentage: overview.totalOrders > 0 ? ((overview.totalOrders - overview.activeOrders - overview.fulfilledOrders) / overview.totalOrders * 100) : 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">{item.label}</span>
                  <span className="font-medium">{item.value} ({item.percentage.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="dashboard-card p-5">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Summary</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40">Active orders</span>
              <span className="font-semibold text-[#C9A227]">{overview.activeOrders}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40">Fulfilled</span>
              <span className="font-semibold text-green-400">{overview.fulfilledOrders}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40">Total orders</span>
              <span className="font-semibold">{overview.totalOrders}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-white/40">Conversion</span>
              <span className="font-semibold">{overview.conversionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demand by Product */}
      <div className="dashboard-card p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Price Demand Analysis</p>
            <p className="text-xs text-white/40">Customer demand by price point</p>
          </div>
          <BarChart3 className="h-5 w-5 text-white/20" />
        </div>

        {isDemo ? (
          <div className="space-y-4">
            {DEMO_DEMAND_BY_PRODUCT.filter(p => p.totalWaiting > 0).map((item) => (
              <div key={item.product.id} className="bg-white/[0.02] border border-white/5 rounded-lg p-4 hover:border-[#C9A227]/20 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                        <Package className="w-5 h-5 text-white/20" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium">{item.product.title}</h4>
                      <p className="text-sm text-white/40">Current: ${item.product.current_price}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#C9A227]">{item.totalWaiting}</div>
                    <div className="text-xs text-white/40">waiting</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-white/30 uppercase tracking-wide">By price point</div>
                  <div className="flex flex-wrap gap-2">
                    {item.pricePoints.map((point) => (
                      <div
                        key={point.price}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-lg"
                      >
                        <span className="font-semibold text-[#C9A227]">${point.price}</span>
                        <span className="text-white/30">-</span>
                        <span className="flex items-center gap-1 text-white/60">
                          <Users className="h-3 w-3" />
                          {point.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                  <span className="text-white/40">Range: ${item.lowestAsk} - ${item.highestAsk}</span>
                  <span className="font-medium text-[#C9A227]">${item.potentialRevenue.toLocaleString()} potential</span>
                </div>
              </div>
            ))}
          </div>
        ) : analytics?.demandByPrice && analytics.demandByPrice.length > 0 ? (
          <div className="space-y-4">
            {analytics.demandByPrice.slice(0, 5).map((product) => (
              <div key={product.productId} className="border-b border-white/5 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{product.title}</span>
                  <span className="text-sm text-white/40">Current: ${product.currentPrice}</span>
                </div>
                {product.demandByPrice.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {product.demandByPrice.map((point) => (
                      <div
                        key={point.price}
                        className="px-3 py-1 bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#C9A227] rounded-lg text-sm"
                      >
                        ${point.price}: {point.orders}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/30">No demand data yet</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-center py-8">No demand data available</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="dashboard-card p-5">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Recent Activity</p>
        {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
          <div className="space-y-2">
            {analytics.recentActivity.slice(0, 8).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 px-3 bg-white/[0.02] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'fulfilled' ? 'bg-green-400' :
                    activity.status === 'monitoring' ? 'bg-[#C9A227]' : 'bg-white/30'
                  }`} />
                  <div>
                    <span className="text-sm font-medium">
                      {activity.product_title || `Order #${activity.id.slice(0, 8)}`}
                    </span>
                    {activity.customer_name && (
                      <span className="text-sm text-white/40 ml-2">- {activity.customer_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-[#C9A227]">${activity.target_price}</span>
                  <span className="text-xs text-white/30">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  )
}
