'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Logo } from '@/components/Logo'
import { ShoppingCart, Store, Building, Target, ArrowRight, CheckCircle, Rocket, Info, ArrowDown, Heart, BarChart3, Users, Eye, Activity } from 'lucide-react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('retail')
  const [heroPrice, setHeroPrice] = useState(849)
  
  // Animation effects
  useEffect(() => {
    // Scroll animation observer
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in')
          scrollObserver.unobserve(entry.target)
        }
      })
    }, observerOptions)

    document.querySelectorAll('.scroll-animate').forEach(el => {
      scrollObserver.observe(el)
    })

    return () => scrollObserver.disconnect()
  }, [])

  const handleHeroOrderSubmit = () => {
    // Demo functionality
    alert(`Demo: Buy Order created for £${heroPrice}! \n\nThis would normally:\n• Monitor price changes\n• Notify when conditions are met\n• Complete purchase automatically`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center">
              <div className="flex items-center group cursor-pointer">
                <Logo />
                <span className="text-2xl font-bold ml-3 logo-text group-hover:text-primary transition-colors">LIMINA</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#what-we-do" className="nav-link text-gray-700 font-medium hover:text-primary">What We Do</a>
              <a href="#how-it-works" className="nav-link text-gray-700 font-medium hover:text-primary">How It Works</a>
              <a href="#solutions" className="nav-link text-gray-700 font-medium hover:text-primary">Solutions</a>
              <a href="#demo" className="nav-link text-gray-700 font-medium hover:text-primary">Demo</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="hidden lg:inline-flex items-center px-4 py-2 border border-primary/20 rounded-full text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                🏪 Merchant Demo
              </a>
              <a href="/customer" className="hidden lg:inline-flex items-center px-4 py-2 border border-primary/20 rounded-full text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                🛍️ Customer Demo
              </a>
              <button className="hidden md:inline-flex items-center px-6 py-3 btn-primary rounded-full text-base font-medium shadow-lg pulse-glow">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
              
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden ml-4 p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              >
                <span className="sr-only">Open main menu</span>
                <div className={`hamburger-icon space-y-1.5 ${mobileMenuOpen ? 'hamburger-open' : ''}`}>
                  <span className="hamburger-line line1 block w-6 h-0.5 bg-gray-700"></span>
                  <span className="hamburger-line line2 block w-6 h-0.5 bg-gray-700"></span>
                  <span className="hamburger-line line3 block w-6 h-0.5 bg-gray-700"></span>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mobile-menu">
            <div className="px-4 py-6 space-y-4">
              <a href="#what-we-do" className="nav-link block text-gray-700 font-medium hover:text-primary transition-colors">What We Do</a>
              <a href="#how-it-works" className="nav-link block text-gray-700 font-medium hover:text-primary transition-colors">How It Works</a>
              <a href="#solutions" className="nav-link block text-gray-700 font-medium hover:text-primary transition-colors">Solutions</a>
              <a href="#demo" className="nav-link block text-gray-700 font-medium hover:text-primary transition-colors">Demo</a>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <a href="/dashboard" className="nav-link block text-primary font-medium hover:text-primary-medium transition-colors">🏪 Merchant Demo</a>
                <a href="/customer" className="nav-link block text-primary font-medium hover:text-primary-medium transition-colors mt-2">🛍️ Customer Demo</a>
              </div>
              <button className="block w-full text-center px-6 py-3 btn-primary rounded-full font-medium mt-4">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient pt-32 pb-20 section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hero-layout">
            <div className="scroll-animate">
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-md rounded-full mb-8">
                <span className="text-accent font-medium">🚀 In Development</span>
                <span className="ml-2 px-2 py-1 bg-accent text-primary text-xs rounded-full font-bold">EARLY ACCESS</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6 text-white">
                Conditional Buy Orders
                <span className="block text-accent">That Convert Intent into Sales</span>
              </h1>
              
              <p className="text-xl text-gray-200 mb-8 max-w-2xl">
                Enable customers and businesses to commit to purchase when their conditions are met. 
                <span className="font-semibold text-white">Capture demand you&apos;re currently losing to price sensitivity, timing, and complex B2B procurement.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button 
                  onClick={() => document.getElementById('what-we-do')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-glimmer px-8 py-4 rounded-full text-lg font-medium inline-flex items-center justify-center text-primary shadow-lg font-semibold"
                >
                  Discover LIMINA
                  <ArrowDown className="ml-2 w-5 h-5" />
                </button>
                <button className="btn-secondary px-8 py-4 rounded-full text-lg font-medium inline-flex items-center justify-center">
                  Get Early Access
                  <Rocket className="ml-2 w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/20">
                <div className="text-center stagger-item scroll-animate">
                  <div className="text-3xl font-bold text-accent mb-1">70%</div>
                  <div className="text-sm text-gray-300">Cart Abandonment Rate</div>
                </div>
                <div className="text-center stagger-item scroll-animate">
                  <div className="text-3xl font-bold text-accent mb-1">48%</div>
                  <div className="text-sm text-gray-300">Abandon Due to Price</div>
                </div>
                <div className="text-center stagger-item scroll-animate">
                  <div className="text-3xl font-bold text-accent mb-1">£260B</div>
                  <div className="text-sm text-gray-300">Recoverable Revenue</div>
                </div>
              </div>
            </div>
            
            {/* Hero Card */}
            <div className="hero-card-container">
              <div className="hero-card floating rounded-3xl p-8 w-full max-w-md scroll-animate">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Image 
                      className="h-16 w-16 rounded-2xl object-cover" 
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMxOTE5MTkiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxyZWN0IHdpZHRoPSI3IiBoZWlnaHQ9IjciIHg9IjMiIHk9IjMiIHJ4PSIxIi8+CjxyZWN0IHdpZHRoPSI3IiBoZWlnaHQ9IjciIHg9IjE0IiB5PSIzIiByeD0iMSIvPgo8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI3IiB4PSIxNCIgeT0iMTQiIHJ4PSIxIi8+CjxyZWN0IHdpZHRoPSI3IiBoZWlnaHQ9IjciIHg9IjMiIHk9IjE0IiByeD0iMSIvPgo8L3N2Zz4KPC9zdmc+"
                      alt="iPhone 16 Pro"
                      width={64}
                      height={64}
                    />
                    <div className="ml-4">
                      <h3 className="font-semibold text-gray-800 text-lg">iPhone 16 Pro</h3>
                      <p className="text-gray-600">Current: <span className="text-xl font-bold">£999</span></p>
                    </div>
                  </div>
                  <span className="status-badge status-prototype">Demo</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-800 font-medium mb-2">I&apos;ll buy at this price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">£</span>
                      <input 
                        type="number" 
                        value={heroPrice}
                        onChange={(e) => setHeroPrice(Number(e.target.value))}
                        className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all" 
                        placeholder="Enter price"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-800 font-medium mb-2">Valid for</label>
                    <select className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all">
                      <option>7 days</option>
                      <option>30 days</option>
                      <option>60 days</option>
                      <option>90 days</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={handleHeroOrderSubmit}
                    className="btn-primary w-full text-lg py-4 rounded-lg font-semibold flex items-center justify-center"
                  >
                    <Heart className="mr-2 w-5 h-5" />
                    Create Buy Order
                  </button>
                  
                  <p className="text-center text-gray-500 text-sm flex items-center justify-center">
                    <Info className="mr-1 w-4 h-4 text-blue-500" />
                    Concept demonstration. Not processing real orders.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* What We Do Section */}
      <section id="what-we-do" className="section-padding bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 scroll-animate">What is LIMINA?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto scroll-animate">
              LIMINA is a conditional buy order checkout service that merchants and businesses integrate into their platforms. 
              We enable customers and B2B buyers to commit to purchase when specific conditions are met - turning abandoned carts 
              and unmet procurement needs into future guaranteed sales.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card p-8 text-center stagger-item scroll-animate">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-primary-medium flex items-center justify-center text-white">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">For Shoppers</h3>
              <p className="text-gray-600 leading-relaxed">
                Commit to buy at your ideal price. We automatically complete the purchase when conditions are met - 
                no more missing deals or checking prices daily.
              </p>
            </div>
            
            <div className="feature-card p-8 text-center stagger-item scroll-animate">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-primary">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">For Merchants</h3>
              <p className="text-gray-600 leading-relaxed">
                Convert price-sensitive browsers into committed buyers. See real demand at different price points and 
                capture sales you&apos;d otherwise lose.
              </p>
            </div>
            
            <div className="feature-card p-8 text-center stagger-item scroll-animate">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <Building className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">For B2B</h3>
              <p className="text-gray-600 leading-relaxed">
                Facilitate conditional B2B transactions. Buyers can submit binding purchase orders with specific price, 
                quantity, and timeline conditions. Supports MOQ aggregation and group buys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="section-padding bg-gradient-to-br from-primary/5 to-primary-medium/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 scroll-animate">Live Demo: See LIMINA in Action</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto scroll-animate">Experience how conditional buy orders work for different use cases</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white/50 backdrop-blur-md rounded-2xl p-2 shadow-lg">
              <button 
                onClick={() => setActiveTab('retail')}
                className={`dashboard-tab flex items-center space-x-2 ${activeTab === 'retail' ? 'active' : ''}`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Retail Demo</span>
              </button>
              <button 
                onClick={() => setActiveTab('b2b')}
                className={`dashboard-tab flex items-center space-x-2 ${activeTab === 'b2b' ? 'active' : ''}`}
              >
                <Building className="w-4 h-4" />
                <span>B2B Demo</span>
              </button>
              <button 
                onClick={() => setActiveTab('merchant')}
                className={`dashboard-tab flex items-center space-x-2 ${activeTab === 'merchant' ? 'active' : ''}`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Merchant View</span>
              </button>
            </div>
          </div>

          {/* Demo Content */}
          <div className="max-w-4xl mx-auto">
            {activeTab === 'retail' && (
              <div className="feature-card overflow-hidden floating scroll-animate">
                <div className="p-6 bg-gradient-to-r from-primary to-primary-medium text-white">
                  <h3 className="text-xl font-bold flex items-center">
                    <Users className="mr-3 w-6 h-6" />
                    Shopper Dashboard - Active Buy Orders
                  </h3>
                  <p className="mt-2 text-primary-light">Your conditional purchases at a glance</p>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold text-gray-800">Active Orders</h4>
                    <div className="flex items-center space-x-2">
                      <span className="status-badge status-monitoring">3 Active</span>
                      <div className="pulse-dot w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">MacBook Pro 14&quot;</h4>
                          <p className="text-sm text-gray-600">Buy at: £1,699 | Current: £1,799</p>
                        </div>
                        <span className="status-badge status-monitoring">Monitoring</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-600 font-medium flex items-center">
                          <Activity className="mr-1 w-4 h-4" />
                          94% chance based on price history
                        </span>
                        <span className="text-gray-500">23 days left</span>
                      </div>
                      <div className="mt-2">
                        <div className="progress-bar">
                          <div className="progress-fill bg-blue-500" style={{width: '94%'}}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">Sony WH-1000XM5</h4>
                          <p className="text-sm text-gray-600">Buy at: £279 | Purchased: £279</p>
                        </div>
                        <span className="status-badge status-monitoring">✓ Complete</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-600 font-medium flex items-center">
                          <CheckCircle className="mr-1 w-4 h-4" />
                          Saved £50 (15%) from original price
                        </span>
                        <span className="text-gray-500">2 days ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'merchant' && (
              <div className="feature-card overflow-hidden floating scroll-animate">
                <div className="p-6 bg-gradient-to-r from-accent to-orange-400 text-primary">
                  <h3 className="text-xl font-bold flex items-center">
                    <Eye className="mr-3 w-6 h-6" />
                    Merchant Analytics Dashboard
                  </h3>
                  <p className="mt-2 text-primary/80">Real-time demand intelligence</p>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold text-gray-800">Buy Order Analytics</h4>
                    <div className="flex items-center space-x-2">
                      <span className="status-badge status-monitoring flex items-center">
                        <Eye className="mr-1 w-4 h-4" />
                        247 Active Orders
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">iPhone 16 Pro</h4>
                          <p className="text-sm text-gray-600">Current: £999 | Your cost: £720</p>
                        </div>
                        <div className="bid-indicator bid-high">
                          87
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">87 customers</span> will buy at <span className="font-bold text-red-600">£899</span>
                      </div>
                      <div className="demand-bar mb-2">
                        <div className="demand-fill bg-red-500" style={{width: '89%'}}></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-600 font-medium text-sm">Revenue opportunity: £78,213</span>
                        <button className="px-3 py-1 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700">
                          Execute Orders
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-gray-600 text-sm">Total Potential</p>
                        <p className="text-2xl font-bold text-primary">£142K</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 text-sm">Avg Discount</p>
                        <p className="text-2xl font-bold text-accent">12%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 text-sm">Conversion Rate</p>
                        <p className="text-2xl font-bold text-green-600">89%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'b2b' && (
              <div className="feature-card b2b-card overflow-hidden floating scroll-animate">
                <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <h3 className="text-xl font-bold flex items-center">
                    <Target className="mr-3 w-6 h-6" />
                    B2B Conditional PO Management
                  </h3>
                  <p className="mt-2 text-blue-100">Buyer & Supplier View (Demo)</p>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="border-2 border-blue-300 rounded-lg p-6 bg-blue-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">Steel Components (Grade S275)</h4>
                          <p className="text-gray-600">Buyer: Acme Construction Ltd.</p>
                        </div>
                        <span className="status-badge status-pending">Pending Supplier Review</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Committed Quantity</p>
                          <p className="text-2xl font-bold text-gray-800">500 units</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Target Price/unit</p>
                          <p className="text-2xl font-bold text-blue-600">£45.00</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">PO Validity</p>
                          <p className="text-xl font-bold text-gray-800">45 days</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Supplier Action Required</span>
                          <span className="font-semibold text-orange-500">Awaiting Acceptance</span>
                        </div>
                        <div className="demand-bar">
                          <div className="demand-fill bg-orange-400" style={{width: '30%'}}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 flex items-center">
                          <Building className="mr-1 w-4 h-4" />
                          Supplier: Global Steel Inc. (Demo)
                        </p>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center">
                          <CheckCircle className="mr-1 w-4 h-4" />
                          Accept Conditional PO
                        </button>
                      </div>
                    </div>
                    
                    <div className="border border-green-200 rounded-lg p-6 bg-green-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">Bulk Order: Fasteners M12</h4>
                          <p className="text-sm text-gray-600">Buyer: ConstructCo | Supplier: BoltWorld</p>
                          <p className="text-sm text-gray-600">Status: Accepted, Awaiting Price Match for Execution</p>
                        </div>
                        <span className="status-badge status-accepted">PO Accepted</span>
                      </div>
                      <p className="text-green-600 font-medium flex items-center">
                        <Heart className="mr-1 w-4 h-4" />
                        Order will execute if price drops to £0.85/unit by July 15th.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <Logo />
                <span className="text-2xl font-bold ml-3">LIMINA</span>
              </div>
              <p className="text-primary-light text-lg mb-6 max-w-md">
                Pioneering conditional commerce through intelligent buy order technology. Converting abandoned intent 
                and complex B2B needs into guaranteed sales.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-3">
                <li><a href="#what-we-do" className="text-primary-light hover:text-white transition-colors">What We Do</a></li>
                <li><a href="#how-it-works" className="text-primary-light hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#solutions" className="text-primary-light hover:text-white transition-colors">Solutions</a></li>
                <li><a href="#demo" className="text-primary-light hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-primary-light hover:text-white transition-colors">Documentation (Coming Soon)</a></li>
                <li><a href="#" className="text-primary-light hover:text-white transition-colors">Integration Guide (Coming Soon)</a></li>
                <li><a href="#" className="text-primary-light hover:text-white transition-colors">Contact / Early Access</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-primary-light">© 2025 LIMINA Technologies Ltd. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-primary-light hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-primary-light hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
