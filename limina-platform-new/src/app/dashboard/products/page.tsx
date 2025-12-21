'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, RefreshCw, TrendingUp, TrendingDown, AlertCircle, Store, Target, Users, Clock } from 'lucide-react'

interface Product {
  id: string
  title: string
  description?: string
  current_price: number
  price: number
  currency: string
  image_url?: string
  shopify_product_id?: string
  created_at: string
  updated_at: string
}


export default function ProductsPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [showPriceUpdate, setShowPriceUpdate] = useState<string | null>(null)
  const [priceUpdateValue, setPriceUpdateValue] = useState('')
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [showCreateDiscount, setShowCreateDiscount] = useState<string | null>(null)
  const [discountForm, setDiscountForm] = useState({
    discountPrice: '',
    targetEmails: '',
    maxUses: '',
    expiryHours: '24'
  })
  const [isCreatingDiscount, setIsCreatingDiscount] = useState(false)

  const MERCHANT_ID = '123e4567-e89b-12d3-a456-426614174000'

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const filtered = products.filter(product =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProducts(filtered)
  }, [products, searchTerm])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products?merchantId=${MERCHANT_ID}`)
      const data = await response.json()

      if (data.products) {
        setProducts(data.products)
        setFilteredProducts(data.products)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching products:', err)
      setLoading(false)
    }
  }

  const handlePriceUpdate = async (productId: string, newPrice: number) => {
    try {
      setIsUpdatingPrice(true)

      const response = await fetch('/api/products/update-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          newPrice,
        }),
      })

      if (response.ok) {
        await fetchProducts()
        setShowPriceUpdate(null)
        setPriceUpdateValue('')
      } else {
        console.error('Failed to update price')
      }
    } catch (err) {
      console.error('Error updating price:', err)
    } finally {
      setIsUpdatingPrice(false)
    }
  }

  const syncWithShopify = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: MERCHANT_ID,
          platform: 'shopify'
        }),
      })

      if (response.ok) {
        await fetchProducts()
        setLastSync(new Date().toISOString())
      }
    } catch (err) {
      console.error('Error syncing with Shopify:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDiscount = async (productId: string) => {
    try {
      setIsCreatingDiscount(true)

      const targetEmails = discountForm.targetEmails
        ? discountForm.targetEmails.split(',').map(email => email.trim()).filter(email => email)
        : null

      const response = await fetch('/api/merchant-discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          discountPrice: parseFloat(discountForm.discountPrice),
          targetCustomerEmails: targetEmails,
          maxUses: discountForm.maxUses ? parseInt(discountForm.maxUses) : null,
          expiryHours: parseInt(discountForm.expiryHours)
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateDiscount(null)
        setDiscountForm({
          discountPrice: '',
          targetEmails: '',
          maxUses: '',
          expiryHours: '24'
        })

        if (data.fulfillmentResults && data.fulfillmentResults.length > 0) {
          alert(`Discount created! ${data.fulfillmentResults.length} orders were immediately fulfilled.`)
        } else {
          alert('Discount created successfully! It will be applied when eligible buy orders are found.')
        }
      } else {
        alert(`Error creating discount: ${data.error}`)
      }
    } catch (err) {
      console.error('Error creating discount:', err)
      alert('Error creating discount')
    } finally {
      setIsCreatingDiscount(false)
    }
  }

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  const getPriceChangeIndicator = (product: Product) => {
    const difference = product.current_price - product.price
    if (difference > 0) {
      return {
        icon: TrendingUp,
        color: 'text-red-400',
        text: `+${formatCurrency(Math.abs(difference))}`
      }
    } else if (difference < 0) {
      return {
        icon: TrendingDown,
        color: 'text-green-400',
        text: `-${formatCurrency(Math.abs(difference))}`
      }
    }
    return null
  }

  const getProductDemand = () => {
    const demandLevels = ['Low', 'Medium', 'High']
    return demandLevels[Math.floor(Math.random() * demandLevels.length)]
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#C9A227]">Product Catalog</h2>
          <p className="text-white/40">Manage your products and monitor pricing</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={syncWithShopify}
            className="flex items-center px-4 py-2 bg-[#C9A227] text-[#0C0A09] rounded-lg font-semibold hover:bg-[#D4AF37] transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync with Shopify
          </button>
          <button className="flex items-center px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#161413] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/40">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <Store className="h-8 w-8 text-white/10" />
          </div>
        </div>
        <div className="bg-[#161413] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/40">Avg. Price</p>
              <p className="text-2xl font-bold">
                {formatCurrency(products.length > 0 ? products.reduce((sum, p) => sum + p.current_price, 0) / products.length : 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-white/10" />
          </div>
        </div>
        <div className="bg-[#161413] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/40">Price Changes</p>
              <p className="text-2xl font-bold">
                {products.filter(p => p.current_price !== p.price).length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-white/10" />
          </div>
        </div>
        <div className="bg-[#161413] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/40">Last Sync</p>
              <p className="text-sm font-medium">
                {lastSync ? formatDate(lastSync) : 'Never'}
              </p>
            </div>
            <RefreshCw className="h-8 w-8 text-white/10" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#161413] border border-white/10 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30 h-4 w-4" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/50 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const priceChange = getPriceChangeIndicator(product)
          const PriceIcon = priceChange?.icon
          const demand = getProductDemand()

          return (
            <div key={product.id} className="bg-[#161413] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors relative">
              {product.image_url && (
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    className="w-full h-48 object-cover"
                    src={product.image_url}
                    alt={product.title}
                  />
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold line-clamp-2">
                    {product.title}
                  </h3>
                  {product.shopify_product_id && (
                    <span className="ml-2 px-2 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                      Shopify
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="text-sm text-white/40 line-clamp-2 mb-4">
                    {product.description.replace(/<[^>]*>/g, '')}
                  </p>
                )}

                <div className="space-y-3">
                  {/* Price section */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold">
                          {formatCurrency(product.current_price)}
                        </span>
                        {priceChange && PriceIcon && (
                          <div className={`flex items-center ${priceChange.color}`}>
                            <PriceIcon className="w-4 h-4" />
                            <span className="text-sm font-medium ml-1">
                              {priceChange.text}
                            </span>
                          </div>
                        )}
                      </div>
                      {product.current_price !== product.price && (
                        <span className="text-sm text-white/30 line-through">
                          Original: {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Demand indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/40">Demand:</span>
                    <span className={`text-sm font-medium ${
                      demand === 'High' ? 'text-red-400' :
                      demand === 'Medium' ? 'text-[#C9A227]' : 'text-green-400'
                    }`}>
                      {demand}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-white/5">
                    <button
                      onClick={() => {
                        setShowPriceUpdate(product.id)
                        setPriceUpdateValue(product.current_price.toString())
                      }}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-[#C9A227]/10 text-[#C9A227] rounded-lg hover:bg-[#C9A227]/20 transition-colors border border-[#C9A227]/20"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Update Price
                    </button>
                    <button
                      onClick={() => setShowCreateDiscount(product.id)}
                      className="flex items-center justify-center px-3 py-2 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                      title="Create Targeted Discount"
                    >
                      <TrendingDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Price update modal */}
              {showPriceUpdate === product.id && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                  <div className="bg-[#161413] border border-white/10 rounded-xl p-6 max-w-sm w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Update Price: {product.title}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/60 mb-1">
                          New Price (£)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={priceUpdateValue}
                          onChange={(e) => setPriceUpdateValue(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/50 outline-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowPriceUpdate(null)
                            setPriceUpdateValue('')
                          }}
                          className="flex-1 px-4 py-2 text-white/60 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handlePriceUpdate(product.id, parseFloat(priceUpdateValue))}
                          disabled={isUpdatingPrice}
                          className="flex-1 px-4 py-2 bg-[#C9A227] text-[#0C0A09] rounded-lg font-semibold hover:bg-[#D4AF37] transition-colors disabled:opacity-50"
                        >
                          {isUpdatingPrice ? 'Updating...' : 'Update'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Create discount modal */}
              {showCreateDiscount === product.id && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                  <div className="bg-[#161413] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Create Targeted Discount: {product.title}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/60 mb-1">
                          Discount Price (£)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={discountForm.discountPrice}
                          onChange={(e) => setDiscountForm(prev => ({ ...prev, discountPrice: e.target.value }))}
                          placeholder={`Less than ${formatCurrency(product.current_price)}`}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/50 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/60 mb-1">
                          <Users className="w-4 h-4 inline mr-1" />
                          Target Customer Emails (optional)
                        </label>
                        <input
                          type="text"
                          value={discountForm.targetEmails}
                          onChange={(e) => setDiscountForm(prev => ({ ...prev, targetEmails: e.target.value }))}
                          placeholder="email1@example.com, email2@example.com"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/50 outline-none"
                        />
                        <p className="text-xs text-white/30 mt-1">Leave empty to target all eligible customers</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-white/60 mb-1">
                            <Target className="w-4 h-4 inline mr-1" />
                            Max Uses
                          </label>
                          <input
                            type="number"
                            value={discountForm.maxUses}
                            onChange={(e) => setDiscountForm(prev => ({ ...prev, maxUses: e.target.value }))}
                            placeholder="Unlimited"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/50 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white/60 mb-1">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Expires (hours)
                          </label>
                          <input
                            type="number"
                            value={discountForm.expiryHours}
                            onChange={(e) => setDiscountForm(prev => ({ ...prev, expiryHours: e.target.value }))}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/50 outline-none"
                          />
                        </div>
                      </div>

                      <div className="bg-[#C9A227]/10 border border-[#C9A227]/20 p-3 rounded-lg">
                        <p className="text-sm text-[#C9A227]">
                          <strong>Note:</strong> This discount will not change the storefront price. It will only fulfill existing buy orders at or above the discount price.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowCreateDiscount(null)
                            setDiscountForm({
                              discountPrice: '',
                              targetEmails: '',
                              maxUses: '',
                              expiryHours: '24'
                            })
                          }}
                          className="flex-1 px-4 py-2 text-white/60 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCreateDiscount(product.id)}
                          disabled={isCreatingDiscount || !discountForm.discountPrice}
                          className="flex-1 px-4 py-2 bg-[#C9A227] text-[#0C0A09] rounded-lg font-semibold hover:bg-[#D4AF37] transition-colors disabled:opacity-50"
                        >
                          {isCreatingDiscount ? 'Creating...' : 'Create Discount'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-white/20" />
          </div>
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-white/40 max-w-sm mx-auto mb-6">
            {searchTerm ? 'No products match your search' : 'Sync with Shopify to import your products'}
          </p>
          {!searchTerm && (
            <button
              onClick={syncWithShopify}
              className="px-6 py-3 bg-[#C9A227] text-[#0C0A09] rounded-lg font-bold hover:bg-[#D4AF37] transition-colors"
            >
              Sync with Shopify to import products
            </button>
          )}
        </div>
      )}
    </div>
  )
}
