'use client'

import React, { useState, useEffect } from 'react'
import { Search, Download, Eye, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'

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
  fulfilled_at?: string
  products?: Product
}

export default function OrdersPage() {
  const [loading, setLoading] = useState(true)
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<BuyOrder[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')

  const MERCHANT_ID = '123e4567-e89b-12d3-a456-426614174001'

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/buy-orders?merchantId=${MERCHANT_ID}`)
        const data = await response.json()
        
        if (data.buy_orders) {
          setBuyOrders(data.buy_orders)
          setFilteredOrders(data.buy_orders)
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching orders:', err)
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  useEffect(() => {
    let filtered = buyOrders

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.products?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'target_price':
          return b.target_price - a.target_price
        case 'expires_at':
          return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
        default:
          return 0
      }
    })

    setFilteredOrders(filtered)
  }, [buyOrders, searchTerm, statusFilter, sortBy])

  const getStatusBadge = (status: string) => {
    const badges = {
      monitoring: { class: 'bg-blue-100 text-blue-800', icon: Clock },
      fulfilled: { class: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { class: 'bg-yellow-100 text-yellow-800', icon: Clock },
      expired: { class: 'bg-gray-100 text-gray-800', icon: XCircle },
      cancelled: { class: 'bg-red-100 text-red-800', icon: XCircle }
    }
    return badges[status as keyof typeof badges] || { class: 'bg-gray-100 text-gray-800', icon: Clock }
  }

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  const calculatePotentialSavings = (order: BuyOrder) => {
    return order.current_price - order.target_price
  }

  const getUrgencyLevel = (expiresAt: string) => {
    const daysUntilExpiry = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntilExpiry <= 1) return { level: 'high', color: 'text-red-600', text: 'Expires soon' }
    if (daysUntilExpiry <= 7) return { level: 'medium', color: 'text-orange-600', text: `${daysUntilExpiry} days left` }
    return { level: 'low', color: 'text-green-600', text: `${daysUntilExpiry} days left` }
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
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{buyOrders.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-blue-900">
                {buyOrders.filter(o => o.status === 'monitoring').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fulfilled</p>
              <p className="text-2xl font-bold text-green-900">
                {buyOrders.filter(o => o.status === 'fulfilled').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Potential Revenue</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(buyOrders.filter(o => o.status === 'monitoring').reduce((sum, o) => sum + o.target_price, 0))}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by customer, email, or product..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="monitoring">Monitoring</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="created_at">Newest First</option>
              <option value="target_price">Highest Value</option>
              <option value="expires_at">Expiring Soon</option>
            </select>
            
            <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Buy Orders ({filteredOrders.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Potential Savings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const statusBadge = getStatusBadge(order.status)
                const StatusIcon = statusBadge.icon
                const urgency = getUrgencyLevel(order.expires_at)
                const potentialSavings = calculatePotentialSavings(order)
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {order.products?.image_url && (
                          <img 
                            className="h-12 w-12 rounded-lg object-cover mr-3" 
                            src={order.products.image_url} 
                            alt={order.products.title} 
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.products?.title || 'Product'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(order.target_price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(order.current_price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        potentialSavings > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {potentialSavings > 0 ? '+' : ''}{formatCurrency(potentialSavings)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.class}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.expires_at)}</div>
                      <div className={`text-xs ${urgency.color}`}>{urgency.text}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-700 mr-3">
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.status === 'monitoring' && (
                        <button className="text-green-600 hover:text-green-700">
                          Fulfill
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {searchTerm || statusFilter !== 'all' ? 'No orders match your filters' : 'No buy orders found'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}