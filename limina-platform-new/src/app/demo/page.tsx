'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import {
  ShoppingCart,
  Store,
  Mail,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Play,
  Users,
  Target,
  Tag,
  Bell,
  ExternalLink,
  Sparkles
} from 'lucide-react'

type Step = 'widget' | 'dashboard' | 'email'

export default function CustomerJourneyDemo() {
  const [activeStep, setActiveStep] = useState<Step>('widget')
  const [widgetPrice, setWidgetPrice] = useState(899)
  const [showSuccess, setShowSuccess] = useState(false)

  const steps = [
    { id: 'widget' as Step, label: 'Customer Widget', icon: ShoppingCart, description: 'Customer sets their price' },
    { id: 'dashboard' as Step, label: 'Merchant Dashboard', icon: Store, description: 'Merchant sees demand' },
    { id: 'email' as Step, label: 'Customer Email', icon: Mail, description: 'Customer gets notified' },
  ]

  const handleCreateOrder = () => {
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setActiveStep('dashboard')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center">
              <Logo />
              <span className="text-xl font-bold ml-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">LIMINA</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard?demo=true"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Merchant Dashboard
              </Link>
              <Link
                href="/auth"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Interactive Demo
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            See the Complete Customer Journey
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience how LIMINA works from start to finish - from customer order to merchant conversion.
          </p>
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${
                    activeStep === step.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activeStep === step.id ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    <step.icon className={`w-4 h-4 ${activeStep === step.id ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{step.label}</div>
                    <div className={`text-xs ${activeStep === step.id ? 'text-blue-100' : 'text-gray-400'}`}>
                      {step.description}
                    </div>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-5xl mx-auto">
          {/* Step 1: Customer Widget */}
          {activeStep === 'widget' && (
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Explanation */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Step 1: Customer Sets Their Price
                </h2>
                <p className="text-gray-600 mb-6">
                  Instead of abandoning checkout because of price, customers can commit to buy at their ideal price.
                  The widget integrates directly into your product pages or checkout flow.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Payment Pre-Authorized</div>
                      <div className="text-sm text-gray-500">Card is validated but not charged until conditions are met</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Commitment to Buy</div>
                      <div className="text-sm text-gray-500">Customer agrees to purchase if their price is matched</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Automatic Monitoring</div>
                      <div className="text-sm text-gray-500">System tracks price and notifies when conditions are met</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStep('dashboard')}
                  className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  See Merchant View
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Widget Preview */}
              <div className="relative">
                <div className="absolute -top-4 -right-4 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                  Live Preview
                </div>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  {/* Fake store header */}
                  <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
                    <span className="font-medium">TechStyle Electronics</span>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="text-sm">Cart (0)</span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Product */}
                    <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
                      <img
                        src="https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=120&h=120&fit=crop"
                        alt="iPhone 16 Pro"
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">iPhone 16 Pro</h3>
                        <p className="text-sm text-gray-500 mb-2">256GB - Natural Titanium</p>
                        <div className="text-2xl font-bold text-gray-900">$999</div>
                      </div>
                    </div>

                    {/* LIMINA Widget */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                          <Target className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900">Name Your Price</span>
                        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Powered by LIMINA</span>
                      </div>

                      {!showSuccess ? (
                        <>
                          <p className="text-sm text-gray-600 mb-4">
                            Want a better deal? Set your target price and we'll notify you when it's available.
                          </p>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Your target price</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                              <input
                                type="number"
                                value={widgetPrice}
                                onChange={(e) => setWidgetPrice(Number(e.target.value))}
                                className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {Math.round((1 - widgetPrice / 999) * 100)}% off current price
                            </p>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Valid for</label>
                            <select className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                              <option>30 days</option>
                              <option>60 days</option>
                              <option>90 days</option>
                            </select>
                          </div>

                          <button
                            onClick={handleCreateOrder}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <Tag className="w-4 h-4" />
                            Create Buy Order
                          </button>

                          <p className="text-xs text-gray-500 text-center mt-3">
                            Your card will be authorized but not charged until conditions are met
                          </p>
                        </>
                      ) : (
                        <div className="py-8 text-center">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Order Created!</h4>
                          <p className="text-sm text-gray-600">
                            We'll notify you when your target price of ${widgetPrice} is available.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Merchant Dashboard */}
          {activeStep === 'dashboard' && (
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Explanation */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Step 2: Merchant Sees Real Demand
                </h2>
                <p className="text-gray-600 mb-6">
                  Merchants can see aggregated demand at different price points. This helps make data-driven pricing decisions and convert price-sensitive customers.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">See Waiting Customers</div>
                      <div className="text-sm text-gray-500">View how many customers want each product at what price</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Tag className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Send Targeted Discounts</div>
                      <div className="text-sm text-gray-500">One-click to send personalized discount codes</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">High Conversion</div>
                      <div className="text-sm text-gray-500">Customers have already committed to buy at their price</div>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dashboard?demo=true"
                  className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Explore Full Dashboard
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>

              {/* Dashboard Preview */}
              <div className="relative">
                <div className="absolute -top-4 -right-4 px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
                  Merchant View
                </div>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  {/* Dashboard header */}
                  <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
                    <span className="font-medium text-gray-900">iPhone 16 Pro - Waiting Customers</span>
                  </div>

                  <div className="p-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">6</div>
                        <div className="text-xs text-gray-500">Customers Waiting</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">$5,294</div>
                        <div className="text-xs text-gray-500">Potential Revenue</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">$899</div>
                        <div className="text-xs text-gray-500">Avg. Target Price</div>
                      </div>
                    </div>

                    {/* Price demand visualization */}
                    <div className="mb-6">
                      <div className="text-sm font-medium text-gray-700 mb-3">Demand by Price Point</div>
                      <div className="space-y-2">
                        {[
                          { price: 949, count: 1, width: 20 },
                          { price: 899, count: 3, width: 60 },
                          { price: 849, count: 2, width: 40 },
                        ].map((item) => (
                          <div key={item.price} className="flex items-center gap-3">
                            <div className="w-16 text-sm font-medium text-gray-700">${item.price}</div>
                            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-end pr-2"
                                style={{ width: `${item.width}%` }}
                              >
                                <span className="text-xs text-white font-medium">{item.count}</span>
                              </div>
                            </div>
                            <button className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                              Send Discount
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer list */}
                    <div className="border-t border-gray-100 pt-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">Individual Requests</div>
                      <div className="space-y-2">
                        {[
                          { name: 'Sarah J.', price: 899, time: '2 hours ago' },
                          { name: 'Mike C.', price: 899, time: '4 hours ago' },
                          { name: 'Emma W.', price: 899, time: '1 day ago' },
                        ].map((customer, i) => (
                          <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                                {customer.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                <div className="text-xs text-gray-500">{customer.time}</div>
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-green-600">${customer.price}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Customer Email */}
          {activeStep === 'email' && (
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Explanation */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Step 3: Customer Gets Notified
                </h2>
                <p className="text-gray-600 mb-6">
                  When the merchant decides to offer a discount or the price drops naturally, the customer receives an email with their personalized discount code.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Instant Notification</div>
                      <div className="text-sm text-gray-500">Customer gets email as soon as their price is matched</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Tag className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Unique Discount Code</div>
                      <div className="text-sm text-gray-500">Personalized code for their exact target price</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">High Conversion Rate</div>
                      <div className="text-sm text-gray-500">89% of notified customers complete their purchase</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-green-900">Full Circle Complete</div>
                      <div className="text-sm text-green-700">
                        Customer buys at their price, merchant makes the sale
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Preview */}
              <div className="relative">
                <div className="absolute -top-4 -right-4 px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
                  Email Preview
                </div>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  {/* Email client header */}
                  <div className="bg-gray-100 border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <span className="ml-4 text-sm text-gray-600">Inbox - sarah.johnson@gmail.com</span>
                    </div>
                  </div>

                  {/* Email header */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        TS
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">TechStyle Electronics</div>
                        <div className="text-sm text-gray-500">via LIMINA</div>
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      Great news! Your target price has been matched
                    </div>
                  </div>

                  {/* Email body */}
                  <div className="p-6">
                    <p className="text-gray-700 mb-6">
                      Hi Sarah,
                    </p>
                    <p className="text-gray-700 mb-6">
                      The product you've been waiting for is now available at your target price!
                    </p>

                    {/* Product card */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <div className="flex gap-4">
                        <img
                          src="https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=80&h=80&fit=crop"
                          alt="iPhone 16 Pro"
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">iPhone 16 Pro</h4>
                          <p className="text-sm text-gray-500 mb-2">256GB - Natural Titanium</p>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 line-through">$999</span>
                            <span className="text-2xl font-bold text-green-600">$899</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Save $100
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Discount code */}
                    <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center border-2 border-dashed border-blue-200">
                      <div className="text-sm text-gray-600 mb-2">Your exclusive discount code</div>
                      <div className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
                        LIMINA-SARAH-899
                      </div>
                      <div className="text-xs text-gray-500 mt-2">Valid for 48 hours</div>
                    </div>

                    <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                      Complete Your Purchase
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    <p className="text-xs text-gray-400 text-center mt-4">
                      This email was sent because you created a buy order on TechStyle Electronics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to capture more sales?
            </h2>
            <p className="text-blue-100 mb-6">
              Join merchants who are turning abandoned carts into revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard?demo=true"
                className="px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Try Full Demo
              </Link>
              <Link
                href="/auth"
                className="px-8 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-400 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
