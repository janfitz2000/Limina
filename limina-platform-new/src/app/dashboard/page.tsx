'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase-fixed'
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Clock,
  ChevronRight,
  Package,
  Users,
  ArrowUpRight
} from 'lucide-react'
import { DEMO_BUY_ORDERS, DEMO_STATS } from '@/lib/demo-data'

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

function DashboardOverviewContent() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (isDemo) {
      const demoOrders = DEMO_BUY_ORDERS.map(order => ({
        id: order.id,
        customer_name: order.customers.name,
        customer_email: order.customers.email,
        target_price: order.target_price,
        current_price: order.current_price,
        status: order.status,
        created_at: order.created_at,
        expires_at: order.expires_at,
        products: order.products,
      }))

      setBuyOrders(demoOrders)
      setStats({
        total: DEMO_STATS.totalOrders,
        monitoring: DEMO_STATS.activeOrders,
        fulfilled: DEMO_STATS.fulfilledOrders,
        pending: 0,
        cancelled: 0,
        totalRevenue: DEMO_STATS.totalRevenue,
        avgDiscount: 0,
        conversionRate: DEMO_STATS.conversionRate,
      })
      setLoading(false)
      return
    }

    if (authLoading || !user || !user.merchant_id) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: ordersData, error: ordersError } = await supabase
          .from('buy_orders')
          .select(`*, products (*), customers (*)`)
          .eq('merchant_id', user.merchant_id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (ordersError) throw ordersError

        const ordersCount = ordersData?.length || 0
        const monitoring = ordersData?.filter(o => o.status === 'monitoring').length || 0
        const fulfilled = ordersData?.filter(o => o.status === 'fulfilled').length || 0
        const totalRevenue = ordersData?.filter(o => o.status === 'fulfilled')
          .reduce((sum, o) => sum + Number(o.target_price), 0) || 0
        const conversionRate = ordersCount > 0 ? Math.round((fulfilled / ordersCount) * 100) : 0

        setBuyOrders(ordersData || [])
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
  }, [user, authLoading, isDemo])

  const formatCurrency = (amount: number) => `$${amount.toFixed(0)}`
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  if (!isDemo && (authLoading || loading)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isDemo && loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-white/50 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#C9A227] text-[#0C0A09] rounded-lg font-bold hover:bg-[#D4AF37] transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#161413] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-white/60" />
              </div>
              <span className="flex items-center text-xs text-[#C9A227]">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                12%
              </span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-white/40">Total orders</p>
          </div>

          <div className="bg-[#161413] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-[#C9A227]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#C9A227]">{stats.monitoring}</p>
            <p className="text-sm text-white/40">Waiting customers</p>
          </div>

          <div className="bg-[#161413] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white/60" />
              </div>
              <span className="flex items-center text-xs text-[#C9A227]">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                8%
              </span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm text-white/40">Total revenue</p>
          </div>

          <div className="bg-[#161413] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white/60" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.conversionRate}%</p>
            <p className="text-sm text-white/40">Conversion rate</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-[#161413] border border-white/10 rounded-xl">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Recent orders</h3>
              <p className="text-sm text-white/40">Latest customer demand</p>
            </div>
            <Link
              href={isDemo ? '/dashboard/orders?demo=true' : '/dashboard/orders'}
              className="text-sm text-white/50 hover:text-white flex items-center gap-1 transition-colors"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-5 space-y-2">
            {buyOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {order.products?.image_url ? (
                    <img
                      className="h-10 w-10 rounded-lg object-cover"
                      src={order.products.image_url}
                      alt={order.products.title}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Package className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm">{order.products?.title || 'Product'}</div>
                    <div className="text-xs text-white/40">
                      {order.customer_name} wants {formatCurrency(order.target_price)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    order.status === 'monitoring'
                      ? 'bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/30'
                      : order.status === 'fulfilled'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : 'bg-white/5 text-white/40'
                  }`}>
                    {order.status === 'monitoring' ? 'Waiting' : order.status}
                  </span>
                  <span className="text-xs text-white/30">{formatDate(order.created_at)}</span>
                </div>
              </div>
            ))}
            {buyOrders.length === 0 && (
              <div className="text-center py-8 text-white/30">
                No orders yet
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-[#161413] border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold mb-4">Quick actions</h3>
            <div className="space-y-2">
              <Link
                href={isDemo ? '/dashboard/orders?demo=true' : '/dashboard/orders'}
                className="flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/5 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-[#C9A227]/10 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#C9A227]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">View waiting customers</div>
                  <div className="text-xs text-white/40">{stats?.monitoring || 0} customers</div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </Link>
              <Link
                href={isDemo ? '/dashboard/products?demo=true' : '/dashboard/products'}
                className="flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/5 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white/60" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Manage products</div>
                  <div className="text-xs text-white/40">Sync & pricing</div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </Link>
              <Link
                href={isDemo ? '/dashboard/analytics?demo=true' : '/dashboard/analytics'}
                className="flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/5 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white/60" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">View analytics</div>
                  <div className="text-xs text-white/40">Demand trends</div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </Link>
            </div>
          </div>

          {/* Integration Status */}
          <div className="bg-[#161413] border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold mb-4">Integration</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-white/60">Shopify</span>
                </div>
                <span className="text-xs text-green-400">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-white/60">Stripe</span>
                </div>
                <span className="text-xs text-green-400">Active</span>
              </div>
            </div>
          </div>

          {/* Today */}
          <div className="bg-[#161413] border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold mb-4">Today</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-white/40">New orders</span>
                <span className="text-sm font-medium">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/40">Fulfilled</span>
                <span className="text-sm font-medium text-green-400">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/40">Revenue</span>
                <span className="text-sm font-medium">$1,250</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function DashboardOverview() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardOverviewContent />
    </Suspense>
  )
}
