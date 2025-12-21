'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Play, Check } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [activePrice, setActivePrice] = useState<number | null>(899)
  const [counters, setCounters] = useState({ abandoned: 0, price: 0, convert: 0 })
  const statsRef = useRef<HTMLDivElement>(null)
  const [statsVisible, setStatsVisible] = useState(false)

  useEffect(() => {
    setMounted(true)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !statsVisible) {
          setStatsVisible(true)
          animateCounters()
        }
      },
      { threshold: 0.3 }
    )

    if (statsRef.current) {
      observer.observe(statsRef.current)
    }

    return () => observer.disconnect()
  }, [statsVisible])

  const animateCounters = () => {
    const duration = 2000
    const steps = 60
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      const eased = 1 - Math.pow(1 - progress, 3)

      setCounters({
        abandoned: Math.round(70 * eased),
        price: Math.round(48 * eased),
        convert: Math.round(89 * eased),
      })

      if (step >= steps) clearInterval(timer)
    }, interval)
  }

  const demandData = [
    { price: 949, customers: 3, names: ['Alex', 'Jordan', 'Sam'] },
    { price: 899, customers: 5, names: ['Chris', 'Morgan', 'Taylor', 'Casey', 'Riley'] },
    { price: 849, customers: 4, names: ['Drew', 'Blake', 'Sage', 'River'] },
    { price: 799, customers: 2, names: ['Jamie', 'Reese'] },
  ]

  const totalCustomers = demandData.reduce((sum, d) => sum + d.customers, 0)
  const totalRevenue = demandData.reduce((sum, d) => sum + d.price * d.customers, 0)

  return (
    <div className="min-h-screen bg-[#0C0A09] text-[#FAF9F6] antialiased overflow-x-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201, 162, 39, 0.4); }
          50% { box-shadow: 0 0 20px 4px rgba(201, 162, 39, 0.2); }
        }

        @keyframes flow-in {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        .customer-dot {
          animation: flow-in 0.5s ease-out forwards;
        }

        .float-animation {
          animation: float 6s ease-in-out infinite;
        }

        .gold-glow {
          animation: pulse-gold 3s ease-in-out infinite;
        }
      `}</style>

      {/* Nav */}
      <nav className="fixed w-full z-50 bg-[#0C0A09]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-20 items-center">
            <Link href="/" className="flex items-center gap-3">
              <Logo size="md" />
              <span className="text-xl font-bold tracking-tight">Limina</span>
            </Link>
            <div className="flex items-center gap-8">
              <Link href="/auth" className="text-sm font-medium text-white/50 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link
                href="/demo"
                className="text-sm px-5 py-2.5 bg-[#C9A227] text-[#0C0A09] font-bold hover:bg-[#D4AF37] transition-all"
              >
                See demo
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 min-h-screen flex items-center">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#C9A227]/5 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#C9A227]/5 rounded-full blur-[128px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left content */}
            <div className="lg:col-span-6">
              <div
                className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A227]/10 border border-[#C9A227]/30 mb-8">
                  <div className="w-2 h-2 bg-[#C9A227] rounded-full" />
                  <span className="text-sm font-semibold text-[#C9A227]">
                    The future of e-commerce pricing
                  </span>
                </div>
              </div>

              <h1
                className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.0] tracking-tight mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                See what
                <br />
                <span className="text-white/30">customers</span>
                <br />
                <span className="text-[#C9A227]">will pay</span>
              </h1>

              <p
                className={`text-xl text-white/50 max-w-md mb-10 leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                Capture real buying intent. Visualize demand at every price point. Convert with precision.
              </p>

              <div
                className={`flex flex-wrap items-center gap-4 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                <Link
                  href="/demo"
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C9A227] text-[#0C0A09] font-bold text-lg hover:bg-[#D4AF37] transition-all gold-glow"
                >
                  <Play className="w-5 h-5" />
                  Watch demo
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 px-8 py-4 font-semibold text-white/70 hover:text-white border border-white/10 hover:border-white/30 transition-all"
                >
                  Start free
                </Link>
              </div>
            </div>

            {/* Right - Signature Demand Visualization */}
            <div
              className={`lg:col-span-6 transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            >
              <div className="relative">
                {/* The visualization card */}
                <div className="bg-[#161413] border border-white/10 p-8 relative overflow-hidden">
                  {/* Gold accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div>
                      <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Live Demand</div>
                      <div className="text-2xl font-bold">iPhone 16 Pro</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Waiting</div>
                      <div className="text-3xl font-extrabold text-[#C9A227]">{totalCustomers}</div>
                    </div>
                  </div>

                  {/* Demand visualization - vertical stacks */}
                  <div className="grid grid-cols-4 gap-3 mb-8">
                    {demandData.map((tier, tierIndex) => (
                      <div
                        key={tier.price}
                        className="relative"
                        onMouseEnter={() => setActivePrice(tier.price)}
                        onMouseLeave={() => setActivePrice(null)}
                      >
                        {/* Customer stack - fixed height container with bottom-aligned dots */}
                        <div className="h-44 relative overflow-hidden">
                          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-1.5">
                            {tier.names.map((name, i) => (
                              <div
                                key={name}
                                className={`customer-dot w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer ${
                                  activePrice === tier.price
                                    ? 'bg-[#C9A227] text-[#0C0A09]'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                                }`}
                                style={{
                                  animationDelay: `${(tierIndex * 100) + (i * 80)}ms`
                                }}
                                title={name}
                              >
                                {name[0]}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Price label - now below the stack */}
                        <div className={`text-center mt-2 mb-1 transition-all ${activePrice === tier.price ? 'text-[#C9A227]' : 'text-white/50'}`}>
                          <div className="text-sm font-bold">${tier.price}</div>
                        </div>

                        {/* Send button */}
                        <button
                          className={`w-full py-1.5 text-xs font-bold transition-all ${
                            activePrice === tier.price
                              ? 'bg-[#C9A227] text-[#0C0A09]'
                              : 'bg-white/5 text-white/50 hover:bg-white/10'
                          }`}
                        >
                          Send offer
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Footer stats */}
                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div>
                      <div className="text-xs text-white/40 uppercase tracking-wider">Potential Revenue</div>
                      <div className="text-2xl font-extrabold">${totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/40 uppercase tracking-wider">Avg. Discount</div>
                      <div className="text-2xl font-extrabold text-[#C9A227]">12%</div>
                    </div>
                  </div>
                </div>

                {/* Floating accent */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#C9A227]/20 blur-2xl float-animation" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Massive stat section */}
      <section ref={statsRef} className="py-32 relative overflow-hidden">
        {/* Giant background number */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[40vw] font-extrabold text-white/[0.02] leading-none">
            {counters.convert}%
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-[#C9A227]" />
              <span className="text-sm font-semibold text-[#C9A227] uppercase tracking-wider">The impact</span>
              <div className="h-px w-12 bg-[#C9A227]" />
            </div>

            <div className="mb-8">
              <span className="text-8xl sm:text-9xl lg:text-[12rem] font-extrabold text-[#C9A227] leading-none">
                {counters.convert}%
              </span>
            </div>

            <p className="text-2xl sm:text-3xl font-semibold text-white/80 mb-4">
              of customers convert when you meet their price
            </p>
            <p className="text-lg text-white/40 max-w-xl mx-auto">
              Compare that to {counters.abandoned}% cart abandonment industry-wide, with {counters.price}% citing price as the reason.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-xl mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Three steps to
              <span className="text-[#C9A227]"> recovered revenue</span>
            </h2>
            <p className="text-white/40 text-lg">
              Set up in five minutes. No code required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Customer names their price',
                description: 'A widget on your checkout captures what price-sensitive customers will actually pay. Card pre-authorized, not charged.',
                highlight: false
              },
              {
                step: '02',
                title: 'You see real demand',
                description: 'Dashboard shows exactly how many customers are waiting at each price point. Real intent, not surveys.',
                highlight: true
              },
              {
                step: '03',
                title: 'One click to convert',
                description: 'Send targeted discount codes instantly. Customers are notified and 89% complete their purchase.',
                highlight: false
              }
            ].map((item, i) => (
              <div
                key={i}
                className={`group p-8 border transition-all duration-300 ${
                  item.highlight
                    ? 'bg-[#C9A227]/10 border-[#C9A227]/30 hover:border-[#C9A227]'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`text-sm font-bold mb-4 ${item.highlight ? 'text-[#C9A227]' : 'text-white/30'}`}>
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-white/50 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
                Stop losing sales to
                <span className="text-white/30"> price sensitivity</span>
              </h2>
              <p className="text-white/50 text-lg mb-10 leading-relaxed">
                Every abandoned cart is lost intent. Limina captures that intent, shows you exactly what customers will pay, and converts them when you're ready.
              </p>

              <div className="space-y-6">
                {[
                  { title: 'Capture intent', desc: 'Know exactly what each customer will pay before they leave' },
                  { title: 'Visualize demand', desc: 'See aggregated data by product and price point' },
                  { title: 'Convert with precision', desc: 'Send targeted offers only when it makes business sense' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[#C9A227]/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-[#C9A227]" />
                    </div>
                    <div>
                      <div className="font-bold mb-1">{item.title}</div>
                      <div className="text-white/50">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-[#161413] border border-white/10 p-8">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-6">Revenue Recovered This Month</div>
                <div className="text-5xl font-extrabold text-[#C9A227] mb-2">$47,293</div>
                <div className="text-white/40 mb-8">from 127 conversions</div>

                <div className="space-y-4">
                  {[
                    { product: 'iPhone 16 Pro', recovered: 12400, orders: 14 },
                    { product: 'AirPods Pro 2', recovered: 8750, orders: 35 },
                    { product: 'MacBook Air M3', recovered: 18200, orders: 16 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
                      <span className="font-medium">{item.product}</span>
                      <div className="text-right">
                        <div className="font-bold">${item.recovered.toLocaleString()}</div>
                        <div className="text-xs text-white/40">{item.orders} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -top-4 -left-4 w-32 h-32 bg-[#C9A227]/10 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-br from-[#C9A227]/20 to-transparent p-16 sm:p-20 border border-[#C9A227]/20">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A227]/10 blur-[128px] pointer-events-none" />

              <div className="relative max-w-2xl">
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
                  Start recovering lost revenue today
                </h2>
                <p className="text-white/50 text-lg mb-10">
                  See the platform in action. No signup required for the demo.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/demo"
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C9A227] text-[#0C0A09] font-bold text-lg hover:bg-[#D4AF37] transition-all"
                  >
                    <Play className="w-5 h-5" />
                    Interactive demo
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-semibold hover:bg-white/5 transition-all"
                  >
                    Get started free
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <span className="font-bold">Limina</span>
            </div>
            <p className="text-white/30 text-sm">2025 Limina Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
