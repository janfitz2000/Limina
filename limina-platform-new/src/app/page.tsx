'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import {
  ArrowRight,
  CheckCircle,
  Play,
  ShoppingCart,
  TrendingUp,
  Target,
  Users,
  Zap,
  BarChart3,
  Tag,
  ChevronDown,
  Store,
  Building
} from 'lucide-react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)

    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Capture Price Intent',
      description: 'Customers commit to buy at their ideal price. No more lost sales from price-sensitive shoppers.',
      stat: '48%',
      statLabel: 'abandon due to price'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'See Real Demand',
      description: 'View aggregated demand at every price point. Make data-driven pricing decisions.',
      stat: '3.2x',
      statLabel: 'more pricing insights'
    },
    {
      icon: <Tag className="w-6 h-6" />,
      title: 'Convert with Discounts',
      description: 'Send targeted discount codes to waiting customers. They buy instantly.',
      stat: '89%',
      statLabel: 'conversion rate'
    }
  ]

  const scrollToDemo = () => {
    document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed w-full bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Logo />
              <span className="text-xl font-bold ml-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">LIMINA</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">How It Works</a>
              <a href="#demo-section" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Demo</a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard?demo=true"
                className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Try Demo
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <div className="w-5 h-5 flex flex-col justify-center gap-1">
                  <span className={`block h-0.5 w-5 bg-current transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                  <span className={`block h-0.5 w-5 bg-current transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                  <span className={`block h-0.5 w-5 bg-current transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-600 hover:text-gray-900 font-medium">Features</a>
              <a href="#how-it-works" className="block text-gray-600 hover:text-gray-900 font-medium">How It Works</a>
              <a href="#demo-section" className="block text-gray-600 hover:text-gray-900 font-medium">Demo</a>
              <div className="pt-3 border-t border-gray-100">
                <Link href="/dashboard?demo=true" className="block text-blue-600 font-medium mb-2">Try Demo</Link>
                <Link href="/auth" className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <section ref={heroRef} className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="absolute top-20 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-indigo-100/50 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Turn Cart Abandonment into Sales
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Let Customers
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Name Their Price
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                Customers set target prices. You see real demand. Send discount codes when you're ready to convert. Simple.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/dashboard?demo=true"
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-200 group"
                >
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Try Merchant Demo
                </Link>
                <button
                  onClick={scrollToDemo}
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  See How It Works
                  <ChevronDown className="w-5 h-5 ml-2" />
                </button>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <div className="text-3xl font-bold text-gray-900">70%</div>
                  <div className="text-sm text-gray-500">of carts abandoned</div>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div>
                  <div className="text-3xl font-bold text-blue-600">48%</div>
                  <div className="text-sm text-gray-500">due to price</div>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div>
                  <div className="text-3xl font-bold text-green-600">89%</div>
                  <div className="text-sm text-gray-500">convert with discounts</div>
                </div>
              </div>
            </div>

            <div className={`relative transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                  </div>
                  <span className="text-white/80 text-sm font-medium ml-2">Merchant Dashboard</span>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Waiting Customers</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Live</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: 'Sarah M.', product: 'iPhone 16 Pro', target: 899, current: 999, time: '2h ago' },
                      { name: 'James K.', product: 'MacBook Pro 14"', target: 1599, current: 1799, time: '4h ago' },
                      { name: 'Emma L.', product: 'AirPods Pro', target: 199, current: 249, time: '6h ago' },
                    ].map((order, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                            {order.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{order.product}</div>
                            <div className="text-xs text-gray-500">{order.name} - {order.time}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-semibold text-green-600 text-sm">${order.target}</div>
                            <div className="text-xs text-gray-400 line-through">${order.current}</div>
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg transition-all">
                            Send Discount
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">3 customers waiting</span>
                    <span className="text-sm font-medium text-blue-600">$2,697 potential revenue</span>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg border border-gray-100 p-3 animate-bounce">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-900">Order Converted!</div>
                    <div className="text-xs text-gray-500">Sarah bought at $899</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Stop Losing Sales to Price Sensitivity
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every abandoned cart is lost revenue. LIMINA captures that intent and converts it into guaranteed sales.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`relative p-8 rounded-2xl transition-all duration-300 cursor-pointer ${
                  activeFeature === i
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setActiveFeature(i)}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  activeFeature === i ? 'bg-white/20' : 'bg-blue-100'
                }`}>
                  <div className={activeFeature === i ? 'text-white' : 'text-blue-600'}>
                    {feature.icon}
                  </div>
                </div>

                <h3 className={`text-xl font-bold mb-2 ${activeFeature === i ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={`mb-4 ${activeFeature === i ? 'text-blue-100' : 'text-gray-600'}`}>
                  {feature.description}
                </p>

                <div className={`flex items-baseline gap-2 ${activeFeature === i ? 'text-white' : 'text-blue-600'}`}>
                  <span className="text-3xl font-bold">{feature.stat}</span>
                  <span className={`text-sm ${activeFeature === i ? 'text-blue-100' : 'text-gray-500'}`}>
                    {feature.statLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Three Steps to More Sales
            </h2>
            <p className="text-lg text-gray-600">
              Simple for you. Simple for your customers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: <ShoppingCart className="w-6 h-6" />,
                title: 'Customer Sets Price',
                description: 'Instead of abandoning, customers tell you exactly what they\'ll pay. Payment is pre-authorized but not charged.',
              },
              {
                step: '2',
                icon: <BarChart3 className="w-6 h-6" />,
                title: 'You See Demand',
                description: 'View aggregated demand by product and price point. Understand exactly what customers will pay.',
              },
              {
                step: '3',
                icon: <Tag className="w-6 h-6" />,
                title: 'Send Discount & Convert',
                description: 'When ready, send personalized discount codes. Customers get notified and buy instantly.',
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-transparent -translate-x-1/2" />
                )}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {item.step}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo-section" className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              See It In Action
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Explore our interactive demo. No signup required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Link
              href="/demo"
              className="group bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all md:col-span-3 mb-4"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Customer Journey Demo</h3>
                  <p className="text-gray-600">
                    See the complete flow: widget on checkout, merchant dashboard view, and customer email notification.
                  </p>
                </div>
                <span className="inline-flex items-center text-blue-600 font-semibold group-hover:gap-3 transition-all">
                  Start Interactive Demo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </span>
              </div>
            </Link>

            <Link
              href="/dashboard?demo=true"
              className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Merchant Dashboard</h3>
              <p className="text-blue-100 mb-4 text-sm">
                View customer demand, analyze pricing, and send discount codes.
              </p>
              <span className="inline-flex items-center text-white font-medium text-sm group-hover:gap-2 transition-all">
                Explore Dashboard
                <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </Link>

            <Link
              href="/dashboard/analytics?demo=true"
              className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
              <p className="text-blue-100 mb-4 text-sm">
                See demand trends, revenue metrics, and conversion analytics.
              </p>
              <span className="inline-flex items-center text-white font-medium text-sm group-hover:gap-2 transition-all">
                View Analytics
                <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </Link>

            <Link
              href="/customer?demo=true"
              className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Customer View</h3>
              <p className="text-blue-100 mb-4 text-sm">
                Track buy orders and see when target prices are met.
              </p>
              <span className="inline-flex items-center text-white font-medium text-sm group-hover:gap-2 transition-all">
                View Customer Demo
                <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-4">
                <Store className="w-4 h-4" />
                E-Commerce
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Online Stores</h3>
              <ul className="space-y-3">
                {[
                  'Shopify & WooCommerce integration',
                  'Embeddable widget for any website',
                  'Real-time price sync',
                  'Automatic discount code generation',
                  'Email notifications to customers'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-4">
                <Building className="w-4 h-4" />
                B2B
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For B2B Procurement</h3>
              <ul className="space-y-3">
                {[
                  'Conditional purchase orders',
                  'Volume-based pricing triggers',
                  'Group buying & MOQ aggregation',
                  'Supplier acceptance workflow',
                  'Enterprise-grade security'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Convert More Sales?
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Join merchants who are turning abandoned carts into revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard?demo=true"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Play className="w-5 h-5 mr-2" />
              Try Demo First
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Logo />
              <span className="text-xl font-bold ml-2 text-white">LIMINA</span>
            </div>
            <p className="text-gray-500 text-sm">
              2025 LIMINA Technologies Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
