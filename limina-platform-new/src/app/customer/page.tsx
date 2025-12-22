'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { Clock, CheckCircle2, XCircle, Activity, ArrowLeft, Package, Tag, TrendingDown } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { DEMO_BUY_ORDERS, DEMO_CUSTOMERS } from '@/lib/demo-data'

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

interface Customer {
  id: string
  email: string
  name: string | null
}

function CustomerDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'
  const { user, loading: authLoading, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    if (isDemo) {
      const demoCustomer = DEMO_CUSTOMERS[0]
      setCustomer(demoCustomer)
      const customerOrders = DEMO_BUY_ORDERS.filter(o => o.customer_id === demoCustomer.id)
      setBuyOrders(customerOrders)
      setLoading(false)
      return
    }

    const fetchData = async () => {
      if (authLoading) return

      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const customerResponse = await fetch(`/api/customers?email=${encodeURIComponent(user.email)}`)
        const customerData = await customerResponse.json()

        if (customerData.customer) {
          setCustomer(customerData.customer)
          const response = await fetch(`/api/buy-orders?customerId=${customerData.customer.id}`)
          const data = await response.json()

          if (data.buy_orders) {
            setBuyOrders(data.buy_orders)
          }
        } else {
          setCustomer(null)
          setBuyOrders([])
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load your orders')
        setLoading(false)
      }
    }

    fetchData()
  }, [user, authLoading, isDemo])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const formatCurrency = (amount: number, currency = 'GBP') => {
    const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'
    return `${symbol}${amount.toFixed(0)}`
  }
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const getDaysUntilExpiry = (expiresAt: string) => {
    return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  const activeOrders = buyOrders.filter(order => order.status === 'monitoring')
  const fulfilledOrders = buyOrders.filter(order => order.status === 'fulfilled')
  const totalSavings = fulfilledOrders.reduce((sum, order) => sum + (order.current_price - order.target_price), 0)

  if (!isDemo && (authLoading || loading)) {
    return (
      <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isDemo && loading) {
    return (
      <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isDemo && !user) {
    return (
      <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Logo />
          <h1 className="text-2xl font-bold text-[#FAF9F6] mt-6 mb-2">Your Orders</h1>
          <p className="text-white/60 mb-8">
            Sign in to view and track your price alerts
          </p>
          <Link
            href="/auth?redirectTo=/customer"
            className="inline-block px-8 py-3 bg-[#C9A227] text-[#0C0A09] font-bold rounded-lg hover:bg-[#D4AF37] transition-colors"
          >
            Sign In
          </Link>
          <p className="mt-6 text-sm text-white/40">
            Or{' '}
            <Link href="/customer?demo=true" className="text-[#C9A227] hover:text-[#D4AF37]">
              view demo
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error</div>
          <p className="text-white/60 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#C9A227] text-[#0C0A09] font-bold rounded-lg hover:bg-[#D4AF37]"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0C0A09] text-[#FAF9F6]">
      {isDemo && (
        <div className="bg-[#C9A227]/10 border-b border-[#C9A227]/20 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C9A227] animate-pulse" />
              <span className="text-sm text-[#C9A227] font-medium">Demo Mode - Viewing as Sarah Johnson</span>
            </div>
            <Link
              href="/auth"
              className="bg-[#C9A227] text-[#0C0A09] px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-[#D4AF37] transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}

      <nav className="border-b border-white/5 bg-[#161413]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
              <span className="font-bold text-lg tracking-tight">LIMINA</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/60">
                {customer?.name || (isDemo ? 'Sarah Johnson' : user?.email)}
              </span>
              {!isDemo && (
                <button
                  onClick={handleSignOut}
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Your Dashboard</p>
            <h1 className="text-2xl font-bold tracking-tight">Price Alerts</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Waiting</p>
                <p className="text-3xl font-bold text-[#C9A227] mt-1">{activeOrders.length}</p>
              </div>
              <Activity className="h-8 w-8 text-white/10" />
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Fulfilled</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{fulfilledOrders.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-white/10" />
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Total Saved</p>
                <p className="text-3xl font-bold text-[#C9A227] mt-1">{formatCurrency(totalSavings)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-white/10" />
            </div>
          </div>
        </div>

        {activeOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[#C9A227]" />
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Waiting for Price Drop</h2>
            </div>

            <div className="space-y-3">
              {activeOrders.map((order) => {
                const daysLeft = getDaysUntilExpiry(order.expires_at)
                const priceDiff = order.current_price - order.target_price
                const discountPercent = ((priceDiff / order.current_price) * 100).toFixed(0)

                return (
                  <div key={order.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      {order.products?.image_url ? (
                        <img
                          className="h-16 w-16 rounded-lg object-cover"
                          src={order.products.image_url}
                          alt={order.products.title}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-white/5 flex items-center justify-center">
                          <Package className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#FAF9F6] truncate">{order.products?.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-white/40">Current: {formatCurrency(order.current_price)}</span>
                          <span className="text-sm text-[#C9A227] font-medium">Target: {formatCurrency(order.target_price)}</span>
                        </div>
                        <p className="text-xs text-white/30 mt-1">{discountPercent}% below current price</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/20">
                          <Clock className="w-3 h-3" />
                          Watching
                        </span>
                        <p className={`text-xs mt-2 ${daysLeft <= 3 ? 'text-red-400' : 'text-white/40'}`}>
                          {daysLeft}d left
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {fulfilledOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Completed</h2>
            </div>

            <div className="space-y-3">
              {fulfilledOrders.map((order) => {
                const savings = order.current_price - order.target_price

                return (
                  <div key={order.id} className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      {order.products?.image_url ? (
                        <img
                          className="h-16 w-16 rounded-lg object-cover"
                          src={order.products.image_url}
                          alt={order.products.title}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-white/5 flex items-center justify-center">
                          <Package className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#FAF9F6] truncate">{order.products?.title}</h3>
                        <p className="text-sm text-white/40 mt-1">Purchased at {formatCurrency(order.target_price)}</p>
                        <p className="text-xs text-white/30 mt-1">
                          Fulfilled {order.fulfilled_at ? formatDate(order.fulfilled_at) : 'recently'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Complete
                        </span>
                        <p className="text-sm text-green-400 font-semibold mt-2">
                          Saved {formatCurrency(savings)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {buyOrders.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white/60 mb-2">No price alerts yet</h3>
            <p className="text-sm text-white/40 mb-6">Set your first price alert to start saving</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A227] text-[#0C0A09] font-bold rounded-lg hover:bg-[#D4AF37] transition-colors"
            >
              <Tag className="w-4 h-4" />
              Name Your Price
            </Link>
          </div>
        )}

        <div className="mt-8 p-6 bg-white/[0.02] border border-white/5 rounded-xl">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">How It Works</h3>
          <div className="space-y-3 text-sm text-white/40">
            <p><span className="text-[#C9A227]">1.</span> You set a target price for products you want</p>
            <p><span className="text-[#C9A227]">2.</span> We notify the merchant about your interest</p>
            <p><span className="text-[#C9A227]">3.</span> When they offer a discount, you get an exclusive code</p>
            <p><span className="text-[#C9A227]">4.</span> Use the code to buy at your target price</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomerDashboardFallback() {
  return (
    <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function CustomerDashboard() {
  return (
    <Suspense fallback={<CustomerDashboardFallback />}>
      <CustomerDashboardContent />
    </Suspense>
  )
}
