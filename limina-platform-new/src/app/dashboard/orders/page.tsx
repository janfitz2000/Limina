'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Download, Eye, CheckCircle, XCircle, Clock, TrendingUp, Tag, Users, Package, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { DEMO_BUY_ORDERS, DEMO_PRODUCTS } from '@/lib/demo-data'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase-fixed'
import { DemoTour, ORDERS_TOUR_STEPS } from '@/components/DemoTour'

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
  const [discountResult, setDiscountResult] = useState<{orderId: string, success: boolean, message: string} | null>(null)

  const handleSendDiscount = async (orderId: string, customerEmail: string, productTitle: string, targetPrice: number) => {
    if (isDemo) {
      alert(`Demo Mode: Would send discount code to ${customerEmail} for ${productTitle} at ${formatCurrency(targetPrice)}`)
      return
    }

    try {
      setSendingDiscount(orderId)
      setDiscountResult(null)

      const response = await fetch('/api/discount-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyOrderId: orderId, sendEmail: true })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setDiscountResult({
          orderId,
          success: true,
          message: data.emailSent
            ? `Discount code sent to ${customerEmail}!`
            : `Code ${data.discountCode.code} generated (email not sent)`
        })
        // Refresh orders after successful send
        const { data: updatedOrders } = await supabase
          .from('buy_orders')
          .select(`*, products (*), customers (*)`)
          .eq('merchant_id', user?.merchant_id)
          .order('created_at', { ascending: false })
        if (updatedOrders) setBuyOrders(updatedOrders)
      } else {
        setDiscountResult({
          orderId,
          success: false,
          message: data.error || 'Failed to generate discount code'
        })
      }
    } catch (err) {
      setDiscountResult({
        orderId,
        success: false,
        message: 'Error generating discount code'
      })
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
          .select(`
            *,
            products (id, title, current_price, price, currency, image_url),
            customers (id, name, email)
          `)
          .eq('merchant_id', user.merchant_id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setBuyOrders(data || [])
        setLoading(false)
      } catch (err) {
        console.error('Error fetching orders:', err)
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

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  const getStatusBadge = (status: string) => {
    const badges = {
      monitoring: { class: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Waiting' },
      fulfilled: { class: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Fulfilled' },
      expired: { class: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Expired' },
      cancelled: { class: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' }
    }
    return badges[status as keyof typeof badges] || badges.monitoring
  }

  const getDaysUntilExpiry = (expiresAt: string) => {
    return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  // Filter orders
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

  // Group orders by product
  const productGroups: ProductGroup[] = Object.values(
    filteredOrders.reduce((acc, order) => {
      const productId = order.product_id || order.products?.id
      if (!productId) return acc

      if (!acc[productId]) {
        acc[productId] = {
          product: order.products || { id: productId, title: 'Unknown Product', current_price: 0, price: 0, currency: 'GBP' },
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Demo Tour */}
      {isDemo && (
        <DemoTour
          steps={ORDERS_TOUR_STEPS}
          storageKey="orders-demo-tour"
        />
      )}

      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5" />
            <span className="font-medium">Demo Mode - Sample price requests from customers</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Products with Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.productsWithRequests}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Waiting Customers</p>
              <p className="text-2xl font-bold text-blue-600">{stats.activeOrders}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fulfilled</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredOrders.filter(o => o.status === 'fulfilled').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Potential Revenue</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.potentialRevenue)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('products')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'products'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              By Product
            </button>
            <button
              onClick={() => setViewMode('orders')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'orders'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              All Orders
            </button>
          </div>

          <div className="flex gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products or customers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="monitoring">Waiting</option>
              <option value="all">All Status</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Groups View */}
      {viewMode === 'products' && (
        <div className="space-y-4">
          {productGroups.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No price requests found</p>
              <p className="text-sm text-gray-400 mt-1">
                Customers will appear here when they request specific prices for your products
              </p>
            </div>
          ) : (
            productGroups.map((group) => (
              <div key={group.product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Product Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleProductExpand(group.product.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {group.product.image_url && (
                        <img
                          src={group.product.image_url}
                          alt={group.product.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.product.title}</h3>
                        <p className="text-sm text-gray-500">
                          Current price: <span className="font-medium">{formatCurrency(group.product.current_price)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{group.totalCustomers}</p>
                        <p className="text-xs text-gray-500">waiting</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(group.lowestTarget)}</p>
                        <p className="text-xs text-gray-500">lowest ask</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-purple-600">{formatCurrency(group.averageTarget)}</p>
                        <p className="text-xs text-gray-500">avg ask</p>
                      </div>
                      {expandedProducts.has(group.product.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Customer List */}
                {expandedProducts.has(group.product.id) && (
                  <div className="border-t border-gray-200">
                    <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Requests
                    </div>
                    <div className="divide-y divide-gray-100">
                      {group.orders.map((order) => {
                        const daysLeft = getDaysUntilExpiry(order.expires_at)
                        const priceDiff = group.product.current_price - order.target_price
                        const discountPercent = ((priceDiff / group.product.current_price) * 100).toFixed(0)

                        return (
                          <div key={order.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {(order.customers?.name || 'U')[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {order.customers?.name || 'Unknown Customer'}
                                </p>
                                <p className="text-sm text-gray-500">{order.customers?.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-6">
                              <div className="text-right">
                                <p className="font-semibold text-green-600">{formatCurrency(order.target_price)}</p>
                                <p className="text-xs text-gray-500">{discountPercent}% off current</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm ${daysLeft <= 3 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {daysLeft} days left
                                </p>
                                <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                              </div>
                              {discountResult?.orderId === order.id && (
                                <span className={`text-sm mr-2 ${discountResult.success ? 'text-green-600' : 'text-red-600'}`}>
                                  {discountResult.success ? 'Sent!' : discountResult.message}
                                </span>
                              )}
                              <button
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                disabled={sendingDiscount === order.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSendDiscount(
                                    order.id,
                                    order.customers?.email || '',
                                    order.products?.title || 'Product',
                                    order.target_price
                                  )
                                }}
                              >
                                {sendingDiscount === order.id ? (
                                  <>
                                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Tag className="w-4 h-4 mr-2" />
                                    Send Discount
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const status = getStatusBadge(order.status)
                  const StatusIcon = status.icon

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {order.products?.image_url && (
                            <img src={order.products.image_url} alt="" className="w-10 h-10 rounded object-cover mr-3" />
                          )}
                          <span className="font-medium text-gray-900">{order.products?.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{order.customers?.name}</div>
                        <div className="text-sm text-gray-500">{order.customers?.email}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-green-600">{formatCurrency(order.target_price)}</td>
                      <td className="px-6 py-4 text-gray-900">{formatCurrency(order.current_price)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${status.class}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(order.expires_at)}</td>
                      <td className="px-6 py-4">
                        {order.status === 'monitoring' && (
                          <button
                            className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                            disabled={sendingDiscount === order.id}
                            onClick={() => handleSendDiscount(
                              order.id,
                              order.customers?.email || '',
                              order.products?.title || 'Product',
                              order.target_price
                            )}
                          >
                            {sendingDiscount === order.id ? (
                              <>
                                <div className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Tag className="w-3 h-3 mr-1" />
                                Send Discount
                              </>
                            )}
                          </button>
                        )}
                        {discountResult?.orderId === order.id && (
                          <span className={`text-xs block mt-1 ${discountResult.success ? 'text-green-600' : 'text-red-600'}`}>
                            {discountResult.success ? 'Sent!' : discountResult.message}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500">No orders found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OrdersPageFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
