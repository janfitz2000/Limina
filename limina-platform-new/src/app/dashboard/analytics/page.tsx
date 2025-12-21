'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { DEMO_ANALYTICS } from '@/lib/demo-data'
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  ArrowRight,
  Zap,
  Package
} from 'lucide-react'

interface ProductPerformance {
  product: {
    id: string
    title: string
    current_price: number
    image_url?: string
  }
  waitingCustomers: number
  fulfilledOrders: number
  potentialRevenue: number
  capturedRevenue: number
  avgDiscountRequested: number
  conversionRate: number
}

interface PriceSensitivity {
  discountPercent: number
  targetPrice: number
  currentPrice: number
  productTitle: string
}

interface AnalyticsData {
  overview: {
    totalOrders: number
    activeOrders: number
    fulfilledOrders: number
    totalRevenue: number
    averageOrderValue: number
    conversionRate: number
    potentialRevenue: number
    totalCustomers: number
  }
  demandCurve: Array<{
    discountRange: string
    customers: number
    revenue: number
    avgDiscount: number
  }>
  productPerformance: ProductPerformance[]
  activityHeatmap: number[][]
  priceSensitivity: PriceSensitivity[]
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    conversionRate: 0,
    potentialRevenue: 0,
    totalCustomers: 0
  }

  const maxPotentialRevenue = Math.max(
    ...(analytics?.productPerformance?.map(p => p.potentialRevenue) || [1])
  )

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const maxHeatmapValue = Math.max(
    ...(analytics?.activityHeatmap?.flat() || [1])
  )

  return (
    <div className="space-y-8">
      {/* Hero: Revenue Opportunity */}
      <div
        className={`relative overflow-hidden transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="dashboard-card p-8">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A227]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[10px] font-semibold text-[#C9A227] uppercase tracking-widest mb-2">Revenue Opportunity</p>
              <h2 className="text-4xl font-extrabold mb-2">
                <span className="text-[#C9A227]">${overview.potentialRevenue.toLocaleString()}</span>
              </h2>
              <p className="text-white/40 mb-6">
                from {overview.activeOrders} customers waiting to convert
              </p>

              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Captured</p>
                  <p className="text-2xl font-bold text-green-400">${overview.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div>
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Conversion</p>
                  <p className="text-2xl font-bold">{overview.conversionRate}%</p>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div>
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Avg. Order</p>
                  <p className="text-2xl font-bold">${overview.averageOrderValue}</p>
                </div>
              </div>
            </div>

            {/* Revenue Gauge */}
            <div className="flex justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#goldGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(overview.totalRevenue / (overview.totalRevenue + overview.potentialRevenue)) * 251.2} 251.2`}
                    className="transition-all duration-1000"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(201, 162, 39, 0.5))'
                    }}
                  />
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#C9A227" />
                      <stop offset="100%" stopColor="#D4AF37" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Captured</p>
                  <p className="text-2xl font-extrabold text-[#C9A227]">
                    {Math.round((overview.totalRevenue / (overview.totalRevenue + overview.potentialRevenue)) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Performance Racing Bars */}
      <div
        className={`dashboard-card p-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Product Performance</p>
            <p className="text-xs text-white/40">Ranked by revenue potential</p>
          </div>
          <Zap className="h-5 w-5 text-[#C9A227]" />
        </div>

        <div className="space-y-4">
          {analytics?.productPerformance?.slice(0, 5).map((item, index) => (
            <div key={item.product.id} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-white/20 w-4">{String(index + 1).padStart(2, '0')}</span>
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.title}
                      className="w-8 h-8 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-white/5 flex items-center justify-center">
                      <Package className="w-4 h-4 text-white/20" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{item.product.title}</p>
                    <p className="text-xs text-white/40">{item.waitingCustomers} waiting</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#C9A227]">${item.potentialRevenue.toLocaleString()}</p>
                  <p className="text-xs text-white/40">-{item.avgDiscountRequested}% avg</p>
                </div>
              </div>

              {/* Racing bar */}
              <div className="relative h-2 bg-white/5 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#C9A227] to-[#D4AF37] transition-all duration-1000 ease-out group-hover:brightness-110"
                  style={{
                    width: mounted ? `${(item.potentialRevenue / maxPotentialRevenue) * 100}%` : '0%',
                    transitionDelay: `${index * 100}ms`
                  }}
                />
                {item.capturedRevenue > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 bg-green-500"
                    style={{
                      width: `${(item.capturedRevenue / maxPotentialRevenue) * 100}%`
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-[#C9A227] to-[#D4AF37]" />
            <span className="text-white/40">Potential</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500" />
            <span className="text-white/40">Captured</span>
          </div>
        </div>
      </div>

      {/* Two Column: Price Sensitivity + Activity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Sensitivity Visualization */}
        <div
          className={`dashboard-card p-6 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Price Sensitivity</p>
              <p className="text-xs text-white/40">Discount distribution of waiting customers</p>
            </div>
            <Target className="h-5 w-5 text-white/20" />
          </div>

          {/* Dot visualization */}
          <div className="relative h-32 mb-4">
            <div className="absolute inset-0 flex items-end">
              {analytics?.priceSensitivity?.map((item, i) => {
                const xPos = (item.discountPercent / 25) * 100
                const size = 8 + Math.random() * 4
                return (
                  <div
                    key={i}
                    className="absolute group cursor-pointer"
                    style={{
                      left: `${Math.min(xPos, 95)}%`,
                      bottom: `${20 + Math.random() * 60}%`,
                    }}
                  >
                    <div
                      className="rounded-full bg-[#C9A227] transition-all duration-300 hover:scale-150 hover:bg-[#D4AF37]"
                      style={{
                        width: size,
                        height: size,
                        opacity: 0.6 + Math.random() * 0.4,
                        animation: mounted ? `fadeIn 0.5s ease-out ${i * 50}ms forwards` : 'none',
                      }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0C0A09] border border-white/10 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {item.productTitle}: -{item.discountPercent}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between text-[10px] text-white/30 uppercase tracking-wider border-t border-white/5 pt-3">
            <span>0%</span>
            <span>5%</span>
            <span>10%</span>
            <span>15%</span>
            <span>20%+</span>
          </div>

          {/* Insight */}
          <div className="mt-4 p-3 bg-[#C9A227]/5 border border-[#C9A227]/20">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-[#C9A227] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-white/60">
                <span className="text-[#C9A227] font-semibold">Most customers</span> are asking for 5-15% off.
                Consider targeted offers in this range to maximize conversions.
              </p>
            </div>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div
          className={`dashboard-card p-6 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Activity Patterns</p>
              <p className="text-xs text-white/40">When customers submit orders</p>
            </div>
            <TrendingUp className="h-5 w-5 text-white/20" />
          </div>

          {/* Heatmap grid */}
          <div className="space-y-1">
            {days.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-1">
                <span className="text-[10px] text-white/30 w-8 flex-shrink-0">{day}</span>
                <div className="flex gap-px flex-1">
                  {hours.filter((_, i) => i % 3 === 0).map((hour) => {
                    const value = analytics?.activityHeatmap?.[dayIndex]?.[hour] || 0
                    const intensity = maxHeatmapValue > 0 ? value / maxHeatmapValue : 0
                    return (
                      <div
                        key={hour}
                        className="flex-1 h-4 transition-colors hover:brightness-125 cursor-pointer group relative"
                        style={{
                          backgroundColor: intensity > 0
                            ? `rgba(201, 162, 39, ${0.15 + intensity * 0.85})`
                            : 'rgba(255, 255, 255, 0.02)'
                        }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#0C0A09] border border-white/10 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {day} {hour}:00 - {value} orders
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* X-axis */}
          <div className="flex ml-9 mt-2">
            {['12am', '6am', '12pm', '6pm'].map((time, i) => (
              <span key={time} className="flex-1 text-[10px] text-white/30">{time}</span>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-white/30">
            <span>Less</span>
            <div className="flex gap-px">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity) => (
                <div
                  key={opacity}
                  className="w-3 h-3"
                  style={{ backgroundColor: `rgba(201, 162, 39, ${opacity})` }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Demand Curve */}
      <div
        className={`dashboard-card p-6 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Demand by Discount Level</p>
            <p className="text-xs text-white/40">How many customers are waiting at each discount tier</p>
          </div>
          <Users className="h-5 w-5 text-white/20" />
        </div>

        {/* Stepped waterfall chart */}
        <div className="flex items-end gap-2 h-48">
          {analytics?.demandCurve?.map((tier, index) => {
            const maxCustomers = Math.max(...(analytics.demandCurve?.map(t => t.customers) || [1]))
            const height = (tier.customers / maxCustomers) * 100

            return (
              <div key={tier.discountRange} className="flex-1 flex flex-col items-center group">
                <div className="w-full flex flex-col items-center relative">
                  {/* Value label */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="px-2 py-1 bg-[#0C0A09] border border-[#C9A227]/30 text-xs whitespace-nowrap">
                      <span className="text-[#C9A227] font-bold">{tier.customers}</span>
                      <span className="text-white/40"> @ ${tier.revenue.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full bg-gradient-to-t from-[#C9A227]/80 to-[#C9A227] transition-all duration-500 hover:from-[#D4AF37] hover:to-[#D4AF37] relative"
                    style={{
                      height: mounted ? `${Math.max(height, 8)}%` : '0%',
                      transitionDelay: `${index * 100}ms`
                    }}
                  >
                    {/* Customer count inside bar */}
                    <span className="absolute inset-0 flex items-center justify-center text-[#0C0A09] font-bold text-sm">
                      {tier.customers}
                    </span>
                  </div>
                </div>

                {/* Label */}
                <span className="text-[10px] text-white/40 mt-2 text-center">{tier.discountRange}</span>
              </div>
            )
          })}
        </div>

        {/* Insight */}
        <div className="mt-6 p-4 bg-[#C9A227]/5 border border-[#C9A227]/20 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#C9A227]/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-[#C9A227]" />
            </div>
            <div>
              <p className="font-medium text-sm">Recommended Action</p>
              <p className="text-xs text-white/50 mt-1">
                Offering <span className="text-[#C9A227] font-semibold">10% discounts</span> could convert
                the majority of waiting customers and capture an estimated
                <span className="text-[#C9A227] font-semibold"> ${overview.potentialRevenue.toLocaleString()}</span> in revenue.
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-[#C9A227] text-[#0C0A09] font-bold text-sm hover:bg-[#D4AF37] transition-colors flex items-center gap-2">
            Send Offers
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekly Trend */}
      {analytics?.weeklyTrend && (
        <div
          className={`dashboard-card p-6 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-6">Weekly Order Trend</p>

          <div className="flex items-end justify-between h-32 gap-3">
            {analytics.weeklyTrend.map((day, index) => {
              const maxOrders = Math.max(...analytics.weeklyTrend!.map(d => d.orders))
              const height = maxOrders > 0 ? (day.orders / maxOrders) * 100 : 0

              return (
                <div key={day.day} className="flex-1 flex flex-col items-center group">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs text-white/40 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      ${day.revenue.toLocaleString()}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-[#C9A227]/60 to-[#C9A227]/80 transition-all duration-500 hover:from-[#C9A227] hover:to-[#D4AF37]"
                      style={{
                        height: mounted ? `${Math.max(height, 10)}%` : '0%',
                        transitionDelay: `${index * 50}ms`
                      }}
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-xs text-white/40">{day.day}</span>
                    <p className="text-sm font-bold">{day.orders}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
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
