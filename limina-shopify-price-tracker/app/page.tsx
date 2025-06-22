import Link from 'next/link'

export default function LandingPage() {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="LIMINA: The buy order checkout service that lets shoppers commit to purchase when conditions are met. Revolutionary conditional commerce for retail and B2B." />
        <title>LIMINA | Conditional Buy Orders for E-commerce</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      'primary': '#10344C',
                      'primary-medium': '#1e5b8a',
                      'primary-light': '#2d81c4',
                      'accent': '#FACC15',
                      'accent-light': '#FDE68A'
                    },
                    fontFamily: {
                      'poppins': ['Poppins', 'sans-serif']
                    }
                  }
                }
              }
            `
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body {
                font-family: 'Poppins', sans-serif;
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                color: #10344C;
              }
              
              .hero-gradient {
                background: linear-gradient(135deg, #10344C 0%, #1e5b8a 100%);
              }
              
              .limina-logo {
                width: 60px;
                height: 60px;
              }
              
              .limina-logo svg {
                width: 100%;
                height: 100%;
                display: block;
                overflow: visible;
              }
              
              #header-check {
                stroke-dasharray: 200;
                stroke-dashoffset: 200;
                animation: draw-check 0.8s ease-out forwards;
              }
              
              @keyframes draw-check {
                to { stroke-dashoffset: 0; }
              }
              
              #header-coin {
                transform-origin: 39px 50px;
                opacity: 0;
                animation: coin-emerge-spin 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s forwards;
                filter: drop-shadow(0px 2px 6px rgba(250, 204, 21, 0.6));
              }
              
              @keyframes coin-emerge-spin {
                0% {
                  transform: scale(0.3) translateY(20px) rotateY(0deg);
                  opacity: 0;
                }
                60% {
                  transform: scale(1.15) translateY(-10px) rotateY(180deg);
                  opacity: 1;
                }
                100% {
                  transform: scale(1) translateY(0px) rotateY(360deg);
                  opacity: 1;
                }
              }

              .logo-text {
                background: linear-gradient(90deg, #10344C 30%, #1e5b8a 70%);
                background-size: 0% 100%;
                background-repeat: no-repeat;
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                opacity: 0;
                animation: text-reveal-fade-in 0.8s ease-out 0.15s forwards;
              }

              @keyframes text-reveal-fade-in {
                0% {
                  background-size: 0% 100%;
                  opacity: 0;
                  transform: translateY(5px);
                }
                100% {
                  background-size: 100% 100%;
                  opacity: 1;
                  transform: translateY(0px);
                }
              }
              
              .nav-link {
                position: relative;
                transition: all 0.3s ease;
              }
              
              .nav-link::after {
                content: '';
                position: absolute;
                width: 0;
                height: 2px;
                bottom: -2px;
                left: 0;
                background: #FACC15;
                transition: width 0.3s ease;
              }
              
              .nav-link:hover::after,
              .nav-link.active::after {
                width: 100%;
              }
              
              .feature-card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(16, 52, 76, 0.1);
                border-radius: 1rem;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
              }
              
              .feature-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
                border-color: rgba(16, 52, 76, 0.2);
              }
              
              .btn-primary {
                background: linear-gradient(135deg, #10344C 0%, #1e5b8a 100%);
                color: white;
                border: none;
                padding: 16px 32px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 18px;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
              }
              
              .btn-primary::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s;
              }
              
              .btn-primary:hover::before {
                left: 100%;
              }
              
              .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 20px 40px -12px rgba(16, 52, 76, 0.4);
              }
            `
          }}
        />
      </head>
      <body>
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
      </body>
    </html>
  )
}