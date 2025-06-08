'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, Target, Clock, Mail } from 'lucide-react'

// This component can be embedded in Shopify product pages
export default function ShopifyBuyOrderWidget() {
  const [productData, setProductData] = useState(null)
  const [offerForm, setOfferForm] = useState({
    customerEmail: '',
    customerName: '',
    targetPrice: '',
    expiryDays: '30'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    // Extract product data from Shopify's global variables
    if (typeof window !== 'undefined' && window.meta?.product) {
      const shopifyProduct = window.meta.product
      setProductData({
        id: shopifyProduct.id,
        title: shopifyProduct.title,
        price: shopifyProduct.price / 100, // Shopify prices are in cents
        currency: shopifyProduct.currency || 'GBP',
        image: shopifyProduct.featured_image
      })
      
      // Set suggested offer price (10% below current price)
      const suggestedPrice = (shopifyProduct.price / 100 * 0.9).toFixed(2)
      setOfferForm(prev => ({ ...prev, targetPrice: suggestedPrice }))
    }
  }, [])

  const handleSubmitOffer = async () => {
    if (!productData || !offerForm.customerEmail || !offerForm.targetPrice) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/shopify/buy-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopify_product_id: productData.id.toString(),
          customer_email: offerForm.customerEmail,
          customer_name: offerForm.customerName,
          target_price: parseFloat(offerForm.targetPrice),
          current_price: productData.price,
          currency: productData.currency,
          expires_in_days: parseInt(offerForm.expiryDays)
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowSuccess(true)
        setShowForm(false)
        
        // Reset form
        setOfferForm({
          customerEmail: '',
          customerName: '',
          targetPrice: '',
          expiryDays: '30'
        })

        // Hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error submitting offer:', error)
      alert('Error submitting offer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!productData) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
        <p className="text-gray-600">Loading product data...</p>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Target className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-green-900">
              🎉 Offer Submitted Successfully!
            </h3>
            <p className="text-green-700 mt-1">
              We'll notify you at <strong>{offerForm.customerEmail}</strong> if the price drops to £{offerForm.targetPrice} or below.
            </p>
            <p className="text-sm text-green-600 mt-2">
              You can continue shopping or check back later!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-4">
      <div className="flex items-start space-x-3">
        <ShoppingCart className="h-6 w-6 text-blue-600 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Can't afford it right now? Make an offer!
          </h3>
          <p className="text-blue-700 mb-4">
            Get notified when <strong>{productData.title}</strong> drops to your target price.
          </p>

          {!showForm ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">Current Price:</span>
                <span className="font-bold text-blue-900">
                  £{productData.price.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Make an Offer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={offerForm.customerEmail}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={offerForm.customerName}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    <Target className="inline h-4 w-4 mr-1" />
                    Your Offer Price (£) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={offerForm.targetPrice}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, targetPrice: e.target.value }))}
                    placeholder={`Less than £${productData.price.toFixed(2)}`}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Expires in (days)
                  </label>
                  <select
                    value={offerForm.expiryDays}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, expiryDays: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-100 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>How it works:</strong> We'll monitor the price and automatically process your order 
                  (and charge your card) if the price drops to £{offerForm.targetPrice} or below.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitOffer}
                  disabled={isSubmitting || !offerForm.customerEmail || !offerForm.targetPrice}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Offer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Add type declaration for Shopify global variables
declare global {
  interface Window {
    meta?: {
      product?: {
        id: number
        title: string
        price: number
        currency: string
        featured_image: string
      }
    }
  }
}