'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, Target, Clock, Mail, ArrowRight } from 'lucide-react'

// Define types for cart items and customer information
interface CartItem {
  id: string;
  shopify_id?: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
}

interface CustomerInfo {
  email: string;
  name: string;
  phone: string;
}

interface TargetPrices {
  [key: string]: string;
}

// This page can be used as an alternative checkout flow
export default function CheckoutAlternative() {
  const [cartData, setCartData] = useState<CartItem[] | null>(null)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: '',
    name: '',
    phone: ''
  })
  const [targetPrices, setTargetPrices] = useState<TargetPrices>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // Get cart data from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search)
    const cartParam = urlParams.get('cart')
    
    if (cartParam) {
      try {
        const cartItems: CartItem[] = JSON.parse(decodeURIComponent(cartParam))
        setCartData(cartItems)
        
        // Set default target prices (20% off)
        const defaultPrices: TargetPrices = {}
        cartItems.forEach((item: CartItem) => {
          defaultPrices[item.id] = (item.price * 0.8).toFixed(2)
        })
        setTargetPrices(defaultPrices)
      } catch (error) {
        console.error('Error parsing cart data:', error)
      }
    } else {
      // Mock cart data for demo
      const mockCart: CartItem[] = [
        {
          id: '1',
          title: 'Sample Product',
          price: 50.00,
          quantity: 1,
          image: '/api/placeholder/100/100',
          variant: 'Default'
        }
      ]
      setCartData(mockCart)
      setTargetPrices({ '1': '40.00' })
    }
  }, [])

  const handleSubmitOrders = async () => {
    if (!cartData || !customerInfo.email) {
      alert('Please fill in your email address')
      return
    }

    setIsSubmitting(true)

    try {
      const orderPromises = cartData.map(async (item: CartItem) => {
        const targetPrice = parseFloat(targetPrices[item.id])
        if (!targetPrice || targetPrice >= item.price) {
          return null
        }

        console.log('Creating buy order for item:', item);
        console.log('API URL:', `${window.location.origin}/api/shopify/buy-orders`);
        
        const requestData = {
          shopify_product_id: item.shopify_id || item.id,
          customer_email: customerInfo.email,
          customer_name: customerInfo.name,
          target_price: targetPrice,
          current_price: item.price,
          currency: 'GBP',
          quantity: item.quantity,
          expires_in_days: 30,
          source: 'checkout_alternative'
        };
        
        console.log('Request data:', requestData);
        
        console.log('Making API call to:', '/api/shopify/buy-orders');
        console.log('Request data being sent:', requestData);
        
        const response = await fetch('/api/shopify/buy-orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        })
        
        console.log('Raw response:', response);
        console.log('Response status:', response.status, response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        let responseData;
        try {
          const responseText = await response.text();
          console.log('Raw response text:', responseText);
          responseData = JSON.parse(responseText);
          console.log('Parsed response data:', responseData);
        } catch (jsonError) {
          console.error('Failed to parse response as JSON:', jsonError);
          throw new Error(`API returned invalid JSON. Status: ${response.status}`);
        }
        
        if (!response.ok) {
          console.error('Buy order failed:', {
            status: response.status,
            statusText: response.statusText,
            data: responseData
          });
          throw new Error(responseData?.error || `API error: ${response.status} - ${responseData?.error || 'Unknown error'}`);
        }
        
        console.log('API call successful!', responseData);

        return response.ok ? { success: true, item } : { success: false, item }
      })

      const results = await Promise.all(orderPromises.filter(Boolean))
      const successCount = results.filter((r): r is { success: boolean; item: CartItem } => r !== null && r.success).length

      if (successCount > 0) {
        setShowSuccess(true)
      } else {
        alert('Failed to create buy orders. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting orders:', error)
      alert('Error submitting orders. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalCurrentPrice = cartData?.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0) || 0
  const totalTargetPrice = cartData?.reduce((sum: number, item: CartItem) => {
    const targetPrice = parseFloat(targetPrices[item.id]) || 0
    return sum + (targetPrice * item.quantity)
  }, 0) || 0
  const totalSavings = totalCurrentPrice - totalTargetPrice
  const savingsPercentage = totalCurrentPrice > 0 ? ((totalSavings / totalCurrentPrice) * 100).toFixed(1) : 0

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Buy Orders Created!
          </h1>
          <p className="text-gray-600 mb-6">
            We&apos;ll monitor prices and notify you at <strong>{customerInfo.email}</strong> when any items drop to your target prices.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm">
              <strong>Potential savings:</strong> £{totalSavings.toFixed(2)} ({savingsPercentage}% off)
            </p>
          </div>
          <button
            onClick={() => window.location.href = 'https://limina-test.myshopify.com'}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  if (!cartData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Target className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pay Later with Limina
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Can&apos;t afford the full price right now? Set your target prices and we&apos;ll notify you when items go on sale.
            <strong> No payment until prices drop!</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Your Items
              </h2>
              
              <div className="space-y-4">
                {cartData.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      {item.variant && (
                        <p className="text-sm text-gray-600">{item.variant}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-semibold text-gray-900">
                          £{item.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Target Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={targetPrices[item.id] || ''}
                        onChange={(e) => setTargetPrices(prev => ({
                          ...prev,
                          [item.id]: e.target.value
                        }))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="£0.00"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Contact Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name (optional)
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Total:</span>
                  <span className="font-medium">£{totalCurrentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Target Total:</span>
                  <span className="font-medium text-green-600">£{totalTargetPrice.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Potential Savings:</span>
                    <span className="font-bold text-green-600">
                      £{totalSavings.toFixed(2)} ({savingsPercentage}% off)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                How It Works
              </h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li key="monitor-prices">✓ We monitor prices for 30 days</li>
                <li key="notify-drops">✓ Get notified when prices drop to your targets</li>
                <li key="pay-on-drop">✓ Only pay when prices actually drop</li>
                <li key="no-upfront-payment">✓ No upfront payment required</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitOrders}
              disabled={isSubmitting || !customerInfo.email || totalTargetPrice >= totalCurrentPrice}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg flex items-center justify-center"
            >
              {isSubmitting ? (
                'Creating Buy Orders...'
              ) : (
                <>
                  Create Buy Orders
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}