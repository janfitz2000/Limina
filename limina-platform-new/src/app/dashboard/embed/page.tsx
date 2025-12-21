'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Copy, CheckCircle, Code, ExternalLink, Smartphone, Monitor, Layout } from 'lucide-react'

interface Product {
  id: string
  title: string
  shopify_product_id?: string
  current_price: number
}

export default function EmbedPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [copied, setCopied] = useState<string | null>(null)
  const [embedType, setEmbedType] = useState<'iframe' | 'popup' | 'inline'>('iframe')

  useEffect(() => {
    if (user?.merchantId) {
      fetchProducts()
    }
  }, [user?.merchantId])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?merchantId=${user?.merchantId}`)
      const data = await response.json()
      if (data.products) {
        setProducts(data.products)
        if (data.products.length > 0) {
          setSelectedProduct(data.products[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://limina-platform-new.vercel.app'
  const widgetUrl = `${baseUrl}/widget?merchantId=${user?.merchantId}&productId=${selectedProduct}`

  const embedCodes = {
    iframe: `<!-- Limina Price Alert Widget -->
<iframe
  src="${widgetUrl}"
  width="100%"
  height="520"
  frameborder="0"
  style="border: none; max-width: 400px;"
  title="Set Price Alert"
></iframe>`,

    popup: `<!-- Limina Price Alert Button -->
<button
  onclick="window.open('${widgetUrl}', 'limina-widget', 'width=420,height=600,scrollbars=no')"
  style="
    background: #C9A227;
    color: #0C0A09;
    padding: 12px 24px;
    font-weight: bold;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: system-ui, sans-serif;
  "
>
  Set Price Alert
</button>`,

    inline: `<!-- Limina Widget Script -->
<div id="limina-widget" data-merchant="${user?.merchantId}" data-product="${selectedProduct}"></div>
<script src="${baseUrl}/embed.js" async></script>`
  }

  const shopifyLiquidCode = `{% comment %}
  Limina Price Alert Widget
  Add this to your product.liquid or product-template.liquid file
{% endcomment %}

<div class="limina-widget-container" style="margin: 20px 0;">
  <iframe
    src="${baseUrl}/widget?merchantId=${user?.merchantId}&shopifyProductId={{ product.id }}"
    width="100%"
    height="520"
    frameborder="0"
    style="border: none; max-width: 400px;"
    title="Set Price Alert for {{ product.title }}"
  ></iframe>
</div>`

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-white/40 text-sm">Add price alerts to your store</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="dashboard-card p-6 dashboard-enter">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Product Selection</p>

            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#C9A227]/50 transition-all"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id} className="bg-[#161413]">
                  {product.title} - £{product.current_price}
                </option>
              ))}
            </select>

            <p className="text-xs text-white/40 mt-2">
              For Shopify, use the Liquid template code which auto-detects the product
            </p>
          </div>

          <div className="dashboard-card p-6 dashboard-enter dashboard-enter-delay-1">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Embed Type</p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'iframe', label: 'Embedded', icon: Monitor, desc: 'Widget on page' },
                { type: 'popup', label: 'Popup', icon: Layout, desc: 'Opens in window' },
                { type: 'inline', label: 'Script', icon: Code, desc: 'Dynamic load' },
              ].map((option) => (
                <button
                  key={option.type}
                  onClick={() => setEmbedType(option.type as typeof embedType)}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    embedType === option.type
                      ? 'bg-[#C9A227]/10 border-[#C9A227]/50 text-[#C9A227]'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  <option.icon className="h-5 w-5 mb-2" />
                  <div className="font-semibold text-sm">{option.label}</div>
                  <div className="text-xs text-white/40 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-card p-6 dashboard-enter dashboard-enter-delay-2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Embed Code</p>
              <button
                onClick={() => copyToClipboard(embedCodes[embedType], embedType)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#C9A227]/10 text-[#C9A227] text-xs font-semibold rounded hover:bg-[#C9A227]/20 transition-all"
              >
                {copied === embedType ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-black/30 rounded-lg overflow-x-auto text-xs text-white/70 font-mono leading-relaxed">
              {embedCodes[embedType]}
            </pre>
          </div>

          <div className="dashboard-card dashboard-card-featured p-6 dashboard-enter dashboard-enter-delay-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold text-[#C9A227] uppercase tracking-widest">Shopify Liquid Template</p>
              <button
                onClick={() => copyToClipboard(shopifyLiquidCode, 'shopify')}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#C9A227] text-[#0C0A09] text-xs font-bold rounded hover:bg-[#D4AF37] transition-all"
              >
                {copied === 'shopify' ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <p className="text-sm text-white/60 mb-4">
              Add this to your Shopify theme's product template to automatically show the widget on all product pages
            </p>

            <pre className="p-4 bg-black/30 rounded-lg overflow-x-auto text-xs text-white/70 font-mono leading-relaxed">
              {shopifyLiquidCode}
            </pre>
          </div>
        </div>

        <div className="space-y-6">
          <div className="dashboard-card p-6 dashboard-enter dashboard-enter-delay-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Preview</p>
              <a
                href={widgetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#C9A227] hover:text-[#D4AF37] transition-colors"
              >
                Open in new tab
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="bg-[#0C0A09] rounded-lg overflow-hidden" style={{ height: '540px' }}>
              {selectedProduct && (
                <iframe
                  src={widgetUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  title="Widget Preview"
                />
              )}
            </div>
          </div>

          <div className="dashboard-card p-6 dashboard-enter dashboard-enter-delay-2">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Installation Guide</p>

            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#C9A227]/20 rounded-full flex items-center justify-center text-[#C9A227] font-bold text-xs">
                  1
                </div>
                <div>
                  <p className="font-medium text-white">Connect your Shopify store</p>
                  <p className="text-white/50 text-xs mt-1">Go to Settings → Connect with OAuth</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#C9A227]/20 rounded-full flex items-center justify-center text-[#C9A227] font-bold text-xs">
                  2
                </div>
                <div>
                  <p className="font-medium text-white">Copy the Liquid template</p>
                  <p className="text-white/50 text-xs mt-1">Use the Shopify code above for automatic product detection</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#C9A227]/20 rounded-full flex items-center justify-center text-[#C9A227] font-bold text-xs">
                  3
                </div>
                <div>
                  <p className="font-medium text-white">Add to your theme</p>
                  <p className="text-white/50 text-xs mt-1">Online Store → Themes → Edit code → product-template.liquid</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#C9A227]/20 rounded-full flex items-center justify-center text-[#C9A227] font-bold text-xs">
                  4
                </div>
                <div>
                  <p className="font-medium text-white">Start collecting price alerts</p>
                  <p className="text-white/50 text-xs mt-1">Customers can now name their price on your products</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
