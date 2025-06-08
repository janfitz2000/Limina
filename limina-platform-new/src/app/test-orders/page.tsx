'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, Plus } from 'lucide-react'

interface Product {
  id: string
  title: string
  current_price: number
  currency: string
  image_url?: string
}

export default function TestOrdersPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [orderForm, setOrderForm] = useState({
    productId: '',
    customerEmail: '',
    customerName: '',
    targetPrice: '',
    expiryDays: '30'
  })
  const [creating, setCreating] = useState(false)

  const MERCHANT_ID = '123e4567-e89b-12d3-a456-426614174000'

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?merchantId=${MERCHANT_ID}`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const createBuyOrder = async () => {
    try {
      setCreating(true)
      
      const response = await fetch('/api/buy-orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: MERCHANT_ID,
          productId: orderForm.productId,
          customerEmail: orderForm.customerEmail,
          customerName: orderForm.customerName,
          targetPrice: parseFloat(orderForm.targetPrice),
          expiryDays: parseInt(orderForm.expiryDays)
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Buy order created successfully!')
        setOrderForm({
          productId: '',
          customerEmail: '',
          customerName: '',
          targetPrice: '',
          expiryDays: '30'
        })
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (err) {
      console.error('Error creating buy order:', err)
      alert('Error creating buy order')
    } finally {
      setCreating(false)
    }
  }

  const selectedProduct = products.find(p => p.id === orderForm.productId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Create Test Buy Orders</h1>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Product
              </label>
              <select
                value={orderForm.productId}
                onChange={(e) => setOrderForm(prev => ({ ...prev, productId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a product...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.title} - £{product.current_price}
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Current Price:</strong> £{selectedProduct.current_price} 
                    <br />
                    <strong>Set target price below this amount to create a conditional buy order</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={orderForm.customerEmail}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Price (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={orderForm.targetPrice}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, targetPrice: e.target.value }))}
                  placeholder={selectedProduct ? `Less than ${selectedProduct.current_price}` : '0.00'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires in (days)
                </label>
                <input
                  type="number"
                  value={orderForm.expiryDays}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, expiryDays: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={createBuyOrder}
              disabled={creating || !orderForm.productId || !orderForm.customerEmail || !orderForm.targetPrice}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              {creating ? 'Creating...' : 'Create Buy Order'}
            </button>
          </div>

          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Testing Instructions:</h3>
            <ol className="text-sm text-green-800 space-y-1">
              <li>1. Create several buy orders with different target prices</li>
              <li>2. Go to Dashboard → Products</li>
              <li>3. Click the green discount button on a product</li>
              <li>4. Set discount price between some target prices</li>
              <li>5. Watch eligible orders get fulfilled instantly!</li>
              <li>6. Notice: Shopify storefront price stays unchanged</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}