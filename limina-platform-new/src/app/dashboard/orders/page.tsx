'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Tag,
  Users,
  Package,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { DEMO_BUY_ORDERS, DEMO_PRODUCTS } from '@/lib/demo-data'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase-fixed'

interface Product {
  id: string
  title: string
  current_price: number
  price: number
  currency: string
  image_url?: string
}

interface Customer {
  id: string
  name: string
  email: string
}

interface BuyOrder {
  id: string
  customer_id: string
  product_id: string
  target_price: number
  current_price: number
  status: string
  created_at: string
  expires_at: string
  fulfilled_at?: string
  products?: Product
  customers?: Customer
}

interface ProductGroup {
  product: Product
  orders: BuyOrder[]
  totalCustomers: number
  lowestTarget: number
  highestTarget: number
  averageTarget: number
}

function OrdersPageContent() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  const [viewMode, setViewMode] = useState<'products' | 'orders'>('products')
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('monitoring')
  const [sendingDiscount, setSendingDiscount] = useState<string | null>(null)

  const handleSendDiscount = async (orderId: string, customerEmail: string, productTitle: string, targetPrice: number) => {
    if (isDemo) {
      alert(`Demo: Would send discount to ${customerEmail} for ${productTitle} at $${targetPrice}`)
      return
    }

    try {
      setSendingDiscount(orderId)
      const response = await fetch('/api/discount-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyOrderId: orderId, sendEmail: true })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        alert(data.emailSent ? `Discount sent to ${customerEmail}!` : `Code generated: ${data.discountCode.code}`)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSendingDiscount(null)
    }
  }

  useEffect(() => {
    if (isDemo) {
      setBuyOrders(DEMO_BUY_ORDERS as BuyOrder[])
      setLoading(false)
      return
    }

    if (!user?.merchant_id) return

    const fetchOrders = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('buy_orders')
          .select(`*, products (*), customers (*)`)
          .eq('merchant_id', user.merchant_id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setBuyOrders(data || [])
        setLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setLoading(false)
      }
    }

    fetchOrders()
  }, [isDemo, user])

  const toggleProductExpand = (productId: string) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedProducts(newExpanded)
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(0)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  const getDaysUntilExpiry = (expiresAt: string) => {
    return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  const filteredOrders = buyOrders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        order.products?.title?.toLowerCase().includes(search) ||
        order.customers?.name?.toLowerCase().includes(search) ||
        order.customers?.email?.toLowerCase().includes(search)
      )
    }
    return true
  })

  const productGroups: ProductGroup[] = Object.values(
    filteredOrders.reduce((acc, order) => {
      const productId = order.product_id || order.products?.id
      if (!productId) return acc

      if (!acc[productId]) {
        acc[productId] = {
          product: order.products || { id: productId, title: 'Unknown', current_price: 0, price: 0, currency: 'USD' },
          orders: [],
          totalCustomers: 0,
          lowestTarget: Infinity,
          highestTarget: 0,
          averageTarget: 0
        }
      }

      acc[productId].orders.push(order)
      acc[productId].totalCustomers++
      acc[productId].lowestTarget = Math.min(acc[productId].lowestTarget, order.target_price)
      acc[productId].highestTarget = Math.max(acc[productId].highestTarget, order.target_price)

      return acc
    }, {} as Record<string, ProductGroup>)
  ).map(group => ({
    ...group,
    averageTarget: group.orders.reduce((sum, o) => sum + o.target_price, 0) / group.orders.length
  })).sort((a, b) => b.totalCustomers - a.totalCustomers)

  const stats = {
    totalOrders: filteredOrders.length,
    activeOrders: filteredOrders.filter(o => o.status === 'monitoring').length,
    productsWithRequests: productGroups.length,
    potentialRevenue: filteredOrders.filter(o => o.status === 'monitoring').reduce((sum, o) => sum + o.target_price, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/40">Products</p>
              <p className="text-2xl font-bold">{stats.productsWithRequests}</p>
            </div>
            <Package className="h-8 w-8 text-white/10" />
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/40">Waiting</p>
              <p className="text-2xl font-bold text-[#C9A227]">{stats.activeOrders}</p>
            </div>
            <Users className="h-8 w-8 text-white/10" />
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/40">Fulfilled</p>
              <p className="text-2xl font-bold text-blue-400">
                {filteredOrders.filter(o => o.status === 'fulfilled').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-white/10" />
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/40">Potential</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.potentialRevenue)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-white/10" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('products')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'products'
                  ? 'bg-[#C9A227] text-[#0C0A09]'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              By Product
            </button>
            <button
              onClick={() => setViewMode('orders')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'orders'
                  ? 'bg-[#C9A227] text-[#0C0A09]'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              All Orders
            </button>
          </div>

          <div className="flex gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/50 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#C9A227]/50 outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="monitoring">Waiting</option>
              <option value="all">All</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Groups View */}
      {viewMode === 'products' && (
        <div className="space-y-3">
          {productGroups.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-12 text-center">
              <Package className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40">No price requests found</p>
            </div>
          ) : (
            productGroups.map((group) => (
              <div key={group.product.id} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleProductExpand(group.product.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {group.product.image_url ? (
                        <img
                          src={group.product.image_url}
                          alt={group.product.title}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center">
                          <Package className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{group.product.title}</h3>
                        <p className="text-sm text-white/40">
                          Current: <span className="text-white/60">{formatCurrency(group.product.current_price)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#C9A227]">{group.totalCustomers}</p>
                        <p className="text-xs text-white/40">waiting</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{formatCurrency(group.lowestTarget)}</p>
                        <p className="text-xs text-white/40">lowest</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-[#C9A227]">{formatCurrency(group.averageTarget)}</p>
                        <p className="text-xs text-white/40">average</p>
                      </div>
                      {expandedProducts.has(group.product.id) ? (
                        <ChevronUp className="w-5 h-5 text-white/30" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/30" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedProducts.has(group.product.id) && (
                  <div className="border-t border-white/5">
                    <div className="bg-white/[0.01] px-4 py-2 text-xs font-medium text-white/30 uppercase tracking-wider">
                      Customer Requests
                    </div>
                    <div className="divide-y divide-white/5">
                      {group.orders.map((order) => {
                        const daysLeft = getDaysUntilExpiry(order.expires_at)
                        const priceDiff = group.product.current_price - order.target_price
                        const discountPercent = ((priceDiff / group.product.current_price) * 100).toFixed(0)

                        return (
                          <div key={order.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-[#C9A227]/10 border border-[#C9A227]/20 rounded-full flex items-center justify-center">
                                <span className="text-[#C9A227] font-medium text-sm">
                                  {(order.customers?.name || 'U')[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{order.customers?.name || 'Customer'}</p>
                                <p className="text-xs text-white/40">{order.customers?.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="font-semibold text-[#C9A227]">{formatCurrency(order.target_price)}</p>
                                <p className="text-xs text-white/40">{discountPercent}% off</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm ${daysLeft <= 3 ? 'text-red-400' : 'text-white/60'}`}>
                                  {daysLeft}d left
                                </p>
                                <p className="text-xs text-white/30">{formatDate(order.created_at)}</p>
                              </div>
                              <button
                                className="flex items-center gap-2 px-4 py-2 bg-[#C9A227] text-[#0C0A09] rounded-lg text-sm font-medium hover:bg-[#D4AF37] transition-colors disabled:opacity-50"
                                disabled={sendingDiscount === order.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSendDiscount(order.id, order.customers?.email || '', order.products?.title || '', order.target_price)
                                }}
                              >
                                {sendingDiscount === order.id ? (
                                  <div className="w-4 h-4 border-2 border-[#0C0A09] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Tag className="w-4 h-4" />
                                    Send offer
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* All Orders View */}
      {viewMode === 'orders' && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">Current</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {order.products?.image_url ? (
                          <img src={order.products.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                            <Package className="w-4 h-4 text-white/20" />
                          </div>
                        )}
                        <span className="text-sm font-medium">{order.products?.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{order.customers?.name}</div>
                      <div className="text-xs text-white/40">{order.customers?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#C9A227]">{formatCurrency(order.target_price)}</td>
                    <td className="px-6 py-4 text-white/60">{formatCurrency(order.current_price)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                        order.status === 'monitoring'
                          ? 'bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/20'
                          : order.status === 'fulfilled'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-white/5 text-white/40'
                      }`}>
                        {order.status === 'monitoring' ? <Clock className="w-3 h-3" /> : order.status === 'fulfilled' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {order.status === 'monitoring' ? 'Waiting' : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/40">{formatDate(order.expires_at)}</td>
                    <td className="px-6 py-4">
                      {order.status === 'monitoring' && (
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#C9A227] text-[#0C0A09] text-xs font-medium rounded hover:bg-[#D4AF37] transition-colors disabled:opacity-50"
                          disabled={sendingDiscount === order.id}
                          onClick={() => handleSendDiscount(order.id, order.customers?.email || '', order.products?.title || '', order.target_price)}
                        >
                          {sendingDiscount === order.id ? (
                            <div className="w-3 h-3 border-2 border-[#0C0A09] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Tag className="w-3 h-3" />
                              Send offer
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-white/30">No orders found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OrdersPageFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersPageFallback />}>
      <OrdersPageContent />
    </Suspense>
  )
}
