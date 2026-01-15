'use client'

import React, { useState, useEffect, Suspense, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase-browser'
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Clock,
  ChevronRight,
  Package,
  Users
} from 'lucide-react'
import { DEMO_BUY_ORDERS, DEMO_STATS } from '@/lib/demo-data'
import { StatCard } from '@/components/dashboard/StatCard'
import { RecentOrderCard } from '@/components/dashboard/RecentOrderCard'
import { QuickActionCard } from '@/components/dashboard/QuickActionCard'
import { BuyOrder, Stats } from '@/types/dashboard'

function DashboardOverviewContent() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])
  const [error, setError] = useState<string | null>(null)
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [retryCount, setRetryCount] = useState(0)

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

    if (authLoading) return

    if (!user) {
      setError('Please sign in to access the dashboard')
      setLoading(false)
      return
    }

    // Auto-retry if merchant_id is missing (race condition after registration)
    if (!user.merchant_id) {
      if (retryCount < 3) {
        const timer = setTimeout(() => {
          setRetryCount(prev => prev + 1)
          refreshUser()
        }, 1000)
        return () => clearTimeout(timer)
      }
      setError('Your merchant profile is being set up. Please refresh in a moment.')
      setLoading(false)
      return
    }

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
  }, [user, authLoading, isDemo, retryCount, refreshUser])

  const formatCurrency = (amount: number) => `$${amount.toFixed(0)}`

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
          <StatCard
            label="Total Orders"
            value={stats.total}
            icon={ShoppingCart}
            subtext="All time orders placed"
            change="12%"
            delay={1}
          />
          <StatCard
            label="Waiting"
            value={stats.monitoring}
            icon={Clock}
            subtext="Ready to convert"
            isFeatured={true}
            delay={2}
          />
          <StatCard
            label="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            subtext="From fulfilled orders"
            change="8%"
            delay={3}
          />
          <StatCard
            label="Conversion"
            value={`${stats.conversionRate}%`}
            icon={TrendingUp}
            subtext="Success rate"
            delay={4}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 dashboard-card dashboard-enter dashboard-enter-delay-5">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Recent Orders</p>
              <p className="text-xs text-white/40">Latest customer demand</p>
            </div>
            <Link
              href={isDemo ? '/dashboard/orders?demo=true' : '/dashboard/orders'}
              className="text-xs text-white/40 hover:text-[#C9A227] flex items-center gap-1 transition-colors uppercase tracking-wider font-medium"
            >
              View all
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-5 space-y-2">
            {buyOrders.slice(0, 5).map((order) => (
              <RecentOrderCard key={order.id} order={order} />
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
          <div className="dashboard-card p-5 dashboard-enter dashboard-enter-delay-6">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Quick Actions</p>
            <div className="space-y-2">
              <QuickActionCard
                href={isDemo ? '/dashboard/orders?demo=true' : '/dashboard/orders'}
                icon={Users}
                title="View waiting customers"
                subtext={`${stats?.monitoring || 0} customers`}
                highlighted={true}
              />
              <QuickActionCard
                href={isDemo ? '/dashboard/products?demo=true' : '/dashboard/products'}
                icon={Package}
                title="Manage products"
                subtext="Sync & pricing"
              />
              <QuickActionCard
                href={isDemo ? '/dashboard/analytics?demo=true' : '/dashboard/analytics'}
                icon={TrendingUp}
                title="View analytics"
                subtext="Demand trends"
              />
            </div>
          </div>

          {/* Integration Status */}
          <div className="dashboard-card p-5">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Integration</p>
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
          <div className="dashboard-card p-5">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Today</p>
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
