'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  Store,
  Mail,
  Check,
  ArrowRight,
  Tag,
  ExternalLink
} from 'lucide-react'
import { Logo } from '@/components/Logo'

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
    <div className="min-h-screen bg-[#0C0A09] text-[#FAF9F6] antialiased selection:bg-[#C9A227]/30">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      `}</style>

      {/* Nav */}
      <nav className="fixed w-full z-50 bg-[#0C0A09]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between h-20 items-center">
            <Link href="/" className="flex items-center gap-3">
              <Logo size="md" />
              <span className="text-xl font-bold tracking-tight">Limina</span>
            </Link>
            <div className="flex items-center gap-8">
              <Link
                href="/dashboard?demo=true"
                className="text-sm font-medium text-white/50 hover:text-white transition-colors flex items-center gap-1"
              >
                Full dashboard
                <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                href="/auth"
                className="text-sm px-5 py-2.5 bg-[#C9A227] text-[#0C0A09] font-bold hover:bg-[#D4AF37] transition-all"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A227]/10 border border-[#C9A227]/30 mb-8">
              <div className="w-2 h-2 bg-[#C9A227] rounded-full" />
              <span className="text-sm font-semibold text-[#C9A227] uppercase tracking-wider">
                Interactive demo
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
              The customer journey
            </h1>
            <p className="text-lg text-white/40 max-w-md mx-auto">
              Three steps from abandoned cart to converted sale
            </p>
          </div>

          {/* Step Navigation */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex items-center bg-white/5 p-1.5 border border-white/10">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm transition-all ${
                    activeStep === step.id
                      ? 'bg-[#C9A227] text-[#0C0A09]'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                  <span>{step.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto">
            {/* Step 1: Widget */}
            {activeStep === 'widget' && (
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                {/* Explanation */}
                <div>
                  <div className="text-sm font-bold text-[#C9A227] mb-2">Step 01</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                    Customer sets their price
                  </h2>
                  <p className="text-white/40 mb-8 leading-relaxed">
                    Instead of abandoning checkout, customers tell you what they're willing to pay.
                    Payment is pre-authorized but not charged.
                  </p>

                  <div className="space-y-3 mb-8">
                    {[
                      'Card validated, not charged',
                      'Commitment to buy at target price',
                      'Automatic price monitoring'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-[#C9A227]/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-[#C9A227] stroke-[3]" />
                        </div>
                        <span className="text-white/60">{item}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveStep('dashboard')}
                    className="text-sm text-white/40 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    Next: See merchant view
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Widget Preview */}
                <div className="bg-[#161413] border border-white/10 overflow-hidden relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />

                  {/* Store header */}
                  <div className="bg-white/5 px-5 py-3 flex items-center justify-between border-b border-white/10">
                    <span className="font-semibold text-sm">TechStyle</span>
                    <ShoppingCart className="w-4 h-4 text-white/50" />
                  </div>

                  <div className="p-5">
                    {/* Product */}
                    <div className="flex gap-4 mb-5 pb-5 border-b border-white/10">
                      <img
                        src="https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=100&h=100&fit=crop"
                        alt="iPhone 16 Pro"
                        className="w-20 h-20 object-cover"
                      />
                      <div>
                        <h3 className="font-bold">iPhone 16 Pro</h3>
                        <p className="text-sm text-white/40 mb-1">256GB - Titanium</p>
                        <div className="text-xl font-extrabold">$999</div>
                      </div>
                    </div>

                    {/* Widget */}
                    <div className="bg-[#C9A227] p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-[#0C0A09]" />
                        <span className="font-bold text-sm text-[#0C0A09]">NAME YOUR PRICE</span>
                      </div>

                      {!showSuccess ? (
                        <>
                          <p className="text-sm text-[#0C0A09]/70 mb-4">
                            Set your target price and get notified when available.
                          </p>

                          <div className="mb-4">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-[#0C0A09]">$</span>
                              <input
                                type="number"
                                value={widgetPrice}
                                onChange={(e) => setWidgetPrice(Number(e.target.value))}
                                className="w-full pl-8 pr-4 py-2.5 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#0C0A09]/20 text-[#0C0A09]"
                              />
                            </div>
                            <p className="text-xs mt-2 text-[#0C0A09]/50">
                              {Math.round((1 - widgetPrice / 999) * 100)}% below retail
                            </p>
                          </div>

                          <button
                            onClick={handleCreateOrder}
                            className="w-full py-2.5 bg-[#0C0A09] text-[#FAF9F6] font-semibold text-sm hover:bg-[#0C0A09]/90 transition-colors"
                          >
                            CREATE BUY ORDER
                          </button>

                          <p className="text-xs text-center mt-3 text-[#0C0A09]/50">
                            Card authorized only, not charged
                          </p>
                        </>
                      ) : (
                        <div className="py-6 text-center">
                          <div className="w-12 h-12 bg-white mx-auto mb-3 flex items-center justify-center">
                            <Check className="w-6 h-6 stroke-[3] text-[#0C0A09]" />
                          </div>
                          <div className="font-bold text-[#0C0A09]">ORDER CREATED</div>
                          <p className="text-sm mt-1 text-[#0C0A09]/60">
                            We'll notify you at ${widgetPrice}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Dashboard */}
            {activeStep === 'dashboard' && (
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                {/* Explanation */}
                <div>
                  <div className="text-sm font-bold text-[#C9A227] mb-2">Step 02</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                    Merchant sees real demand
                  </h2>
                  <p className="text-white/40 mb-8 leading-relaxed">
                    See aggregated demand at different price points. Make data-driven decisions
                    about when to offer discounts.
                  </p>

                  <div className="space-y-3 mb-8">
                    {[
                      'View demand by price point',
                      'One-click discount sending',
                      '89% conversion rate'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-[#C9A227] flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3] text-[#0C0A09]" />
                        </div>
                        <span className="text-white/60">{item}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/dashboard?demo=true"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 font-semibold text-sm hover:bg-white/10 transition-colors"
                  >
                    Explore full dashboard
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                {/* Dashboard Preview */}
                <div className="bg-[#161413] border border-white/10 overflow-hidden relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />

                  <div className="px-5 py-3 border-b border-white/10">
                    <span className="font-bold">iPhone 16 Pro</span>
                  </div>

                  <div className="p-5">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="bg-[#C9A227] p-3 text-center">
                        <div className="text-xl font-extrabold text-[#0C0A09]">6</div>
                        <div className="text-xs text-[#0C0A09]/60">Waiting</div>
                      </div>
                      <div className="bg-white/5 p-3 text-center">
                        <div className="text-xl font-extrabold">$5.3k</div>
                        <div className="text-xs text-white/50">Potential</div>
                      </div>
                      <div className="bg-white/5 p-3 text-center">
                        <div className="text-xl font-extrabold">$899</div>
                        <div className="text-xs text-white/50">Avg</div>
                      </div>
                    </div>

                    {/* Price bars */}
                    <div className="space-y-3 mb-5">
                      {[
                        { price: 949, count: 1, width: 20 },
                        { price: 899, count: 3, width: 60 },
                        { price: 849, count: 2, width: 40 },
                      ].map((item) => (
                        <div key={item.price} className="flex items-center gap-2">
                          <div className="w-14 font-mono font-semibold text-sm text-white/50">${item.price}</div>
                          <div className="flex-1 h-8 bg-white/5 overflow-hidden">
                            <div
                              className="h-full bg-white/20 flex items-center justify-end pr-2"
                              style={{ width: `${item.width}%` }}
                            >
                              <span className="text-xs font-semibold text-white">{item.count}</span>
                            </div>
                          </div>
                          <button className="px-3 py-1.5 text-sm bg-[#C9A227] font-semibold text-[#0C0A09] hover:bg-[#D4AF37] transition-colors">
                            Send
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setActiveStep('email')}
                      className="w-full text-center text-sm text-white/40 hover:text-white flex items-center justify-center gap-2 transition-colors"
                    >
                      See what customers receive
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Email */}
            {activeStep === 'email' && (
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                {/* Explanation */}
                <div>
                  <div className="text-sm font-bold text-[#C9A227] mb-2">Step 03</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                    Customer gets notified
                  </h2>
                  <p className="text-white/40 mb-8 leading-relaxed">
                    When you send a discount, customers instantly receive an email with their
                    personalized code. They're already committed to buy.
                  </p>

                  <div className="space-y-3 mb-8">
                    {[
                      'Instant email notification',
                      'Unique discount code',
                      '89% complete purchase'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-[#C9A227]/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-[#C9A227] stroke-[3]" />
                        </div>
                        <span className="text-white/60">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#C9A227]/10 border border-[#C9A227]/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#C9A227] flex items-center justify-center">
                        <Check className="w-5 h-5 stroke-[3] text-[#0C0A09]" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">SALE COMPLETE</div>
                        <div className="text-sm text-white/50">
                          Customer buys, merchant earns
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Preview */}
                <div className="bg-[#161413] border border-white/10 overflow-hidden relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />

                  {/* Email header */}
                  <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="ml-3 text-xs text-white/40">sarah@gmail.com</span>
                  </div>

                  <div className="p-5">
                    {/* From */}
                    <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/10">
                      <div className="w-10 h-10 bg-[#C9A227] text-[#0C0A09] flex items-center justify-center font-bold text-sm">
                        TS
                      </div>
                      <div>
                        <div className="font-bold text-sm">TechStyle</div>
                        <div className="text-xs text-white/40">Your price is ready!</div>
                      </div>
                    </div>

                    <p className="text-sm text-white/60 mb-5">
                      Hi Sarah, the iPhone 16 Pro is now available at your target price.
                    </p>

                    {/* Product */}
                    <div className="bg-white/5 p-3 mb-5">
                      <div className="flex gap-3">
                        <img
                          src="https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=60&h=60&fit=crop"
                          alt="iPhone"
                          className="w-14 h-14 object-cover"
                        />
                        <div>
                          <div className="font-bold text-sm">iPhone 16 Pro</div>
                          <div className="text-xs text-white/40 mb-1">256GB</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs line-through text-white/30">$999</span>
                            <span className="font-extrabold">$899</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Code */}
                    <div className="bg-[#C9A227] p-4 mb-5 text-center">
                      <div className="text-xs uppercase mb-1 text-[#0C0A09]/60">Your code</div>
                      <div className="text-lg font-mono font-bold tracking-wider text-[#0C0A09]">
                        LIMINA-SARAH-899
                      </div>
                      <div className="text-xs mt-1 text-[#0C0A09]/50">Valid 48 hours</div>
                    </div>

                    <button className="w-full py-3 bg-[#C9A227] text-[#0C0A09] font-semibold text-sm hover:bg-[#D4AF37] transition-colors">
                      COMPLETE PURCHASE
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-20 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/dashboard?demo=true"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                <Store className="w-4 h-4" />
                Explore dashboard
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C9A227] font-bold text-sm text-[#0C0A09] hover:bg-[#D4AF37] transition-colors"
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
