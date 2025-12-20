'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import {
  ShoppingCart,
  Store,
  Mail,
  Check,
  ArrowRight,
  ChevronRight,
  Tag,
  ExternalLink
} from 'lucide-react'

type Step = 'widget' | 'dashboard' | 'email'

export default function CustomerJourneyDemo() {
  const [activeStep, setActiveStep] = useState<Step>('widget')
  const [widgetPrice, setWidgetPrice] = useState(899)
  const [showSuccess, setShowSuccess] = useState(false)

  const steps = [
    { id: 'widget' as Step, label: 'Widget', icon: ShoppingCart },
    { id: 'dashboard' as Step, label: 'Dashboard', icon: Store },
    { id: 'email' as Step, label: 'Email', icon: Mail },
  ]

  const handleCreateOrder = () => {
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setActiveStep('dashboard')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white antialiased">
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Nav */}
      <nav className="fixed w-full z-50 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
              <span className="text-lg font-semibold tracking-tight">LIMINA</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard?demo=true"
                className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1"
              >
                Full dashboard
                <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                href="/auth"
                className="text-sm px-4 py-2 bg-emerald-500 text-black font-medium rounded-full hover:bg-emerald-400 transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative pt-24 pb-16">
        {/* Gradient accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              The customer journey
            </h1>
            <p className="text-white/50 text-lg">
              Three steps from abandoned cart to converted sale
            </p>
          </div>

          {/* Step Navigation */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center bg-white/[0.02] border border-white/10 rounded-full p-1.5">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
                      activeStep === step.id
                        ? 'bg-emerald-500 text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <step.icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{step.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-white/20 mx-1" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto">
            {/* Step 1: Widget */}
            {activeStep === 'widget' && (
              <div className="grid lg:grid-cols-2 gap-10 items-start">
                {/* Explanation */}
                <div>
                  <div className="text-emerald-400 text-sm font-medium mb-2">Step 1</div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">
                    Customer sets their price
                  </h2>
                  <p className="text-white/50 mb-6 leading-relaxed">
                    Instead of abandoning checkout, customers tell you what they're willing to pay.
                    Payment is pre-authorized but not charged until you send a matching discount.
                  </p>

                  <div className="space-y-3 mb-8">
                    {[
                      'Card validated, not charged',
                      'Commitment to buy at target price',
                      'Automatic price monitoring'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="text-white/70 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveStep('dashboard')}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1"
                  >
                    Next: See merchant view
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Widget Preview */}
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-2xl blur-xl" />
                  <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl">
                    {/* Store header */}
                    <div className="bg-gray-900 text-white px-4 py-2.5 flex items-center justify-between text-sm">
                      <span className="font-medium">TechStyle</span>
                      <ShoppingCart className="w-4 h-4 text-white/60" />
                    </div>

                    <div className="p-5 bg-white">
                      {/* Product */}
                      <div className="flex gap-4 mb-5 pb-5 border-b border-gray-100">
                        <img
                          src="https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=100&h=100&fit=crop"
                          alt="iPhone 16 Pro"
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">iPhone 16 Pro</h3>
                          <p className="text-xs text-gray-500 mb-1">256GB - Titanium</p>
                          <div className="text-xl font-bold text-gray-900">$999</div>
                        </div>
                      </div>

                      {/* Widget */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
                            <Tag className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-semibold text-gray-900 text-sm">Name your price</span>
                        </div>

                        {!showSuccess ? (
                          <>
                            <p className="text-xs text-gray-500 mb-3">
                              Set your target price and get notified when available.
                            </p>

                            <div className="mb-3">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                <input
                                  type="number"
                                  value={widgetPrice}
                                  onChange={(e) => setWidgetPrice(Number(e.target.value))}
                                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-200 text-gray-900 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                {Math.round((1 - widgetPrice / 999) * 100)}% below retail
                              </p>
                            </div>

                            <button
                              onClick={handleCreateOrder}
                              className="w-full py-2.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors"
                            >
                              Create buy order
                            </button>

                            <p className="text-[10px] text-gray-400 text-center mt-2">
                              Card authorized only, not charged
                            </p>
                          </>
                        ) : (
                          <div className="py-6 text-center">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Check className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="font-semibold text-gray-900 text-sm">Order created</div>
                            <p className="text-xs text-gray-500 mt-1">
                              We'll notify you at ${widgetPrice}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Dashboard */}
            {activeStep === 'dashboard' && (
              <div className="grid lg:grid-cols-2 gap-10 items-start">
                {/* Explanation */}
                <div>
                  <div className="text-emerald-400 text-sm font-medium mb-2">Step 2</div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">
                    Merchant sees real demand
                  </h2>
                  <p className="text-white/50 mb-6 leading-relaxed">
                    See aggregated demand at different price points. Make data-driven decisions
                    about when to offer discounts and convert waiting customers.
                  </p>

                  <div className="space-y-3 mb-8">
                    {[
                      'View demand by price point',
                      'One-click discount sending',
                      '89% conversion rate'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="text-white/70 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/dashboard?demo=true"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    Explore full dashboard
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                {/* Dashboard Preview */}
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-2xl blur-xl" />
                  <div className="relative bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-3 border-b border-white/5">
                      <span className="text-sm text-white/60">iPhone 16 Pro</span>
                    </div>

                    <div className="p-5">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-emerald-400">6</div>
                          <div className="text-[10px] text-white/40">Waiting</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold">$5.3k</div>
                          <div className="text-[10px] text-white/40">Potential</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold">$899</div>
                          <div className="text-[10px] text-white/40">Avg. target</div>
                        </div>
                      </div>

                      {/* Price bars */}
                      <div className="space-y-2 mb-5">
                        {[
                          { price: 949, count: 1, width: 20 },
                          { price: 899, count: 3, width: 60 },
                          { price: 849, count: 2, width: 40 },
                        ].map((item) => (
                          <div key={item.price} className="flex items-center gap-3">
                            <div className="w-12 text-xs font-mono text-white/50">${item.price}</div>
                            <div className="flex-1 h-7 bg-white/5 rounded overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500/50 to-emerald-500/70 rounded flex items-center justify-end pr-2"
                                style={{ width: `${item.width}%` }}
                              >
                                <span className="text-[10px] font-bold text-white">{item.count}</span>
                              </div>
                            </div>
                            <button className="px-2 py-1 bg-emerald-500 text-black text-[10px] font-medium rounded hover:bg-emerald-400 transition-colors">
                              Send
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setActiveStep('email')}
                        className="w-full py-2 text-center text-xs text-white/40 hover:text-white/60 transition-colors"
                      >
                        See what customers receive →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Email */}
            {activeStep === 'email' && (
              <div className="grid lg:grid-cols-2 gap-10 items-start">
                {/* Explanation */}
                <div>
                  <div className="text-emerald-400 text-sm font-medium mb-2">Step 3</div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">
                    Customer gets notified
                  </h2>
                  <p className="text-white/50 mb-6 leading-relaxed">
                    When you send a discount, customers instantly receive an email with their
                    personalized code. They're already committed to buy at this price.
                  </p>

                  <div className="space-y-3 mb-8">
                    {[
                      'Instant email notification',
                      'Unique discount code',
                      '89% complete purchase'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="text-white/70 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Sale complete</div>
                        <div className="text-xs text-white/50">
                          Customer buys, merchant earns
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Preview */}
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-2xl blur-xl" />
                  <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl">
                    {/* Email header */}
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      <span className="ml-3 text-xs text-gray-500">sarah@gmail.com</span>
                    </div>

                    <div className="p-5">
                      {/* From */}
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                        <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                          TS
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">TechStyle</div>
                          <div className="text-xs text-gray-500">Your price is ready!</div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">
                        Hi Sarah, the iPhone 16 Pro is now available at your target price.
                      </p>

                      {/* Product */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex gap-3">
                          <img
                            src="https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=60&h=60&fit=crop"
                            alt="iPhone"
                            className="w-14 h-14 rounded object-cover"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">iPhone 16 Pro</div>
                            <div className="text-xs text-gray-500 mb-1">256GB</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 line-through">$999</span>
                              <span className="text-lg font-bold text-emerald-600">$899</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Code */}
                      <div className="bg-emerald-50 rounded-lg p-4 mb-4 text-center border border-dashed border-emerald-200">
                        <div className="text-xs text-gray-500 mb-1">Your code</div>
                        <div className="text-lg font-mono font-bold text-emerald-600 tracking-wider">
                          LIMINA-SARAH-899
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">Valid 48 hours</div>
                      </div>

                      <button className="w-full py-3 bg-emerald-500 text-white rounded-lg font-medium text-sm">
                        Complete purchase
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard?demo=true"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full font-medium hover:bg-white/10 transition-colors"
              >
                <Store className="w-4 h-4" />
                Explore dashboard
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-black rounded-full font-semibold hover:bg-emerald-400 transition-colors"
              >
                Start free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
