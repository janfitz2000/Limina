import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="limina-logo cursor-pointer">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="10" width="80" height="80" rx="12" fill="#10344C" />
                  <path
                    id="header-check"
                    d="M30 50 L43 63 L70 36"
                    stroke="white"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle id="header-coin" cx="39" cy="50" r="16" fill="#FACC15" stroke="#10344C" strokeWidth="2" />
                  <text x="39" y="55" textAnchor="middle" fill="#10344C" fontSize="14" fontWeight="bold">$</text>
                </svg>
              </div>
              <h1 className="text-xl font-bold logo-text">LIMINA</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="nav-link text-gray-700 hover:text-primary font-medium">Features</a>
              <a href="#how-it-works" className="nav-link text-gray-700 hover:text-primary font-medium">How It Works</a>
              <a href="#pricing" className="nav-link text-gray-700 hover:text-primary font-medium">Pricing</a>
              <Link href="/dashboard" className="btn-primary">View Demo</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient pt-32 pb-20 px-6 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <div className="limina-logo mx-auto mb-6" style={{ width: '80px', height: '80px' }}>
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="5" width="90" height="90" rx="16" fill="white" />
                <path
                  d="M25 50 L40 65 L75 30"
                  stroke="#10344C"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="42" cy="50" r="20" fill="#FACC15" stroke="white" strokeWidth="3" />
                <text x="42" y="57" textAnchor="middle" fill="#10344C" fontSize="18" fontWeight="bold">$</text>
              </svg>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Conditional Buy Orders<br />
              <span className="text-accent">That Convert Intent into Sales</span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Enable customers to commit to purchase when specific conditions are met.
              Revolutionary conditional commerce for retail and B2B.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Link href="/dashboard" className="btn-primary inline-block">
              🎯 Interactive Demo
            </Link>
            <a
              href="mailto:contact@limina.tech"
              className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              How Limina Works for Shopify Merchants
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform customer interest into guaranteed sales with our conditional commerce platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="feature-card p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center">
                <i className="fas fa-envelope text-2xl text-white"></i>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-primary">Email Price Alerts</h3>
              <p className="text-gray-600 leading-relaxed">
                Customers set their target price and get notified instantly when products drop to their desired level.
              </p>
            </div>
            
            <div className="feature-card p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-accent to-yellow-400 rounded-2xl flex items-center justify-center">
                <i className="fas fa-palette text-2xl text-primary"></i>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-primary">Brand Customization</h3>
              <p className="text-gray-600 leading-relaxed">
                Customize email templates with your brand colors, fonts, and logos for a seamless customer experience.
              </p>
            </div>

            <div className="feature-card p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center">
                <i className="fas fa-chart-line text-2xl text-white"></i>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-primary">Real-time Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Track customer demand, price sensitivity, and alert performance with comprehensive dashboard analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Simple Setup for Shopify Stores
            </h2>
            <p className="text-xl text-gray-600">
              Get started in minutes with our seamless integration
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Install App", desc: "Add Limina to your Shopify store in one click", icon: "download" },
              { step: "2", title: "Sync Products", desc: "Automatically import your product catalog", icon: "sync-alt" },
              { step: "3", title: "Customize Emails", desc: "Brand your price alert emails", icon: "paint-brush" },
              { step: "4", title: "Start Converting", desc: "Customers create alerts, you get sales", icon: "rocket" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-primary">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="hero-gradient py-20 px-6 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Turn Price Interest into Sales?</h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join forward-thinking Shopify merchants who are capturing demand before the sale happens.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/dashboard" className="btn-primary inline-block">
              🎯 See Interactive Demo
            </Link>
            <a
              href="mailto:contact@limina.tech"
              className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
            >
              Get Started Today
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="limina-logo">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                  <rect x="10" y="10" width="80" height="80" rx="12" fill="#10344C" />
                  <path
                    d="M30 50 L43 63 L70 36"
                    stroke="white"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="39" cy="50" r="16" fill="#FACC15" stroke="#10344C" strokeWidth="2" />
                  <text x="39" y="55" textAnchor="middle" fill="#10344C" fontSize="14" fontWeight="bold">$</text>
                </svg>
              </div>
              <span className="text-lg font-bold text-primary">LIMINA</span>
            </div>
            <div className="text-gray-600">
              © 2024 LIMINA Technologies Ltd. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
