'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowRight, Play, Check } from 'lucide-react'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const pricePoints = [
    { price: 949, customers: 2, delay: '0ms' },
    { price: 899, customers: 5, delay: '100ms' },
    { price: 849, customers: 3, delay: '200ms' },
    { price: 799, customers: 1, delay: '300ms' },
  ]

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
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-lg font-semibold tracking-tight">LIMINA</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/auth" className="text-sm text-white/60 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link
                href="/demo"
                className="text-sm px-4 py-2 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors"
              >
                See demo
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Gradient accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            {/* Pill */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-emerald-500/20 bg-emerald-500/5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-emerald-400 font-medium">Recover abandoned revenue</span>
            </div>

            {/* Headline */}
            <h1
              className={`text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Customers name
              <br />
              <span className="text-emerald-400">their price.</span>
              <br />
              <span className="text-white/40">You decide when</span>
              <br />
              <span className="text-white/40">to convert.</span>
            </h1>

            {/* Subhead */}
            <p
              className={`text-lg sm:text-xl text-white/50 max-w-lg mb-10 leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Stop losing sales to price sensitivity. Capture buyer intent, see real demand at every price point, and convert with targeted discounts.
            </p>

            {/* CTAs */}
            <div
              className={`flex flex-wrap gap-4 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <Link
                href="/demo"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black font-semibold rounded-full hover:bg-emerald-400 transition-colors"
              >
                <Play className="w-4 h-4" />
                Watch it work
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 text-white font-medium rounded-full hover:bg-white/5 transition-colors"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Visual demo - Price demand visualization */}
      <section className="relative py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Explanation */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                See exactly what
                <br />
                <span className="text-emerald-400">customers will pay</span>
              </h2>
              <p className="text-white/50 text-lg mb-8 leading-relaxed">
                Instead of guessing, see real demand aggregated by price point. When you're ready to move inventory or hit revenue targets, send targeted discounts to waiting customers.
              </p>

              <div className="space-y-4">
                {[
                  'Customer sets their max price',
                  'Payment pre-authorized (not charged)',
                  'You see aggregated demand',
                  'Send discount, instant conversion'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-white/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Interactive visualization */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm text-white/40 mb-1">iPhone 16 Pro</div>
                    <div className="text-2xl font-bold">$999 <span className="text-white/30 text-lg font-normal">retail</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/40 mb-1">Waiting</div>
                    <div className="text-2xl font-bold text-emerald-400">11 <span className="text-white/30 text-lg font-normal">customers</span></div>
                  </div>
                </div>

                <div className="space-y-3">
                  {pricePoints.map((point) => (
                    <div
                      key={point.price}
                      className="group cursor-pointer"
                      onMouseEnter={() => setHoveredPrice(point.price)}
                      onMouseLeave={() => setHoveredPrice(null)}
                      style={{ animationDelay: point.delay }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-sm font-mono text-white/60">${point.price}</div>
                        <div className="flex-1 h-10 bg-white/5 rounded-lg overflow-hidden relative">
                          <div
                            className={`h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3 ${
                              hoveredPrice === point.price
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-emerald-500/40 to-emerald-500/60'
                            }`}
                            style={{ width: `${(point.customers / 5) * 100}%` }}
                          >
                            <span className={`text-xs font-bold ${hoveredPrice === point.price ? 'text-black' : 'text-white'}`}>
                              {point.customers}
                            </span>
                          </div>
                        </div>
                        <button
                          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                            hoveredPrice === point.price
                              ? 'bg-emerald-500 text-black'
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          Convert
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-sm text-white/40">Potential revenue</span>
                  <span className="text-lg font-bold text-emerald-400">$9,747</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - simplified */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Three steps to recovered revenue
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Works with Shopify, WooCommerce, or any checkout. Setup takes minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Customer names price',
                desc: 'Widget on your checkout captures what price-sensitive customers are willing to pay. Card is authorized but not charged.'
              },
              {
                step: '02',
                title: 'You see demand',
                desc: 'Dashboard shows aggregated demand by product and price point. Understand exactly what your market will pay.'
              },
              {
                step: '03',
                title: 'Send discount, convert',
                desc: 'When ready, send targeted discount codes. Customers get notified and buy instantly. 89% conversion rate.'
              }
            ].map((item, i) => (
              <div key={i} className="group">
                <div className="text-5xl font-bold text-white/5 group-hover:text-emerald-500/20 transition-colors mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8">
            {[
              { value: '70%', label: 'of carts abandoned' },
              { value: '48%', label: 'due to price' },
              { value: '89%', label: 'convert with targeted offers' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
                  {stat.value}
                </div>
                <div className="text-white/40 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-12 sm:p-16">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

            <div className="relative max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Start recovering lost sales
              </h2>
              <p className="text-white/50 text-lg mb-8">
                See the complete customer journey. No signup required.
              </p>
              <Link
                href="/demo"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-black font-semibold rounded-full hover:bg-emerald-400 transition-colors"
              >
                <Play className="w-5 h-5" />
                Interactive demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="font-semibold">LIMINA</span>
            </div>
            <p className="text-white/30 text-sm">
              2025 LIMINA Technologies Ltd.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
