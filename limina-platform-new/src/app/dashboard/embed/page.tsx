'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Copy, CheckCircle, Code, ExternalLink, Monitor, Layout, Zap, Clock, ShoppingCart, ArrowDown, Save } from 'lucide-react'

interface Product {
  id: string
  title: string
  shopify_product_id?: string
  current_price: number
}

interface WidgetSettings {
  triggers: {
    exit_intent: { enabled: boolean; threshold: number }
    time_on_page: { enabled: boolean; delay_seconds: number }
    cart_abandonment: { enabled: boolean }
    scroll_depth: { enabled: boolean; threshold: number }
  }
  display: {
    style: 'inline' | 'popup'
    position: 'after_element' | 'before_element' | 'fixed'
    collapsed_text: string
    expanded_text: string
    theme: 'subtle' | 'bold'
  }
}

const DEFAULT_SETTINGS: WidgetSettings = {
  triggers: {
    exit_intent: { enabled: true, threshold: 50 },
    time_on_page: { enabled: true, delay_seconds: 30 },
    cart_abandonment: { enabled: true },
    scroll_depth: { enabled: false, threshold: 70 }
  },
  display: {
    style: 'inline',
    position: 'after_element',
    collapsed_text: 'Want a better price? Set your target',
    expanded_text: 'Get notified when this drops to your price',
    theme: 'subtle'
  }
}

export default function EmbedPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [copied, setCopied] = useState<string | null>(null)
  const [embedType, setEmbedType] = useState<'iframe' | 'popup' | 'inline'>('inline')
  const [activeTab, setActiveTab] = useState<'code' | 'triggers' | 'display'>('triggers')
  const [settings, setSettings] = useState<WidgetSettings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user?.merchantId) {
      fetchProducts()
      fetchSettings()
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

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/widget-settings?merchantId=${user?.merchantId}`)
      const data = await response.json()
      if (data.settings) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching widget settings:', error)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/widget-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: user?.merchantId,
          settings
        })
      })
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error saving widget settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateTrigger = (trigger: keyof WidgetSettings['triggers'], updates: Partial<WidgetSettings['triggers'][typeof trigger]>) => {
    setSettings(prev => ({
      ...prev,
      triggers: {
        ...prev.triggers,
        [trigger]: { ...prev.triggers[trigger], ...updates }
      }
    }))
  }

  const updateDisplay = (updates: Partial<WidgetSettings['display']>) => {
    setSettings(prev => ({
      ...prev,
      display: { ...prev.display, ...updates }
    }))
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://limina-platform-new.vercel.app'
  const widgetUrl = `${baseUrl}/widget?merchantId=${user?.merchantId}&productId=${selectedProduct}`

  const smartEmbedCode = `<!-- Limina Smart Widget -->
<div
  data-limina-widget
  data-merchant-id="${user?.merchantId}"
  data-product-id="${selectedProduct}"
  data-current-price="${products.find(p => p.id === selectedProduct)?.current_price || 0}"
  data-triggers='${JSON.stringify(settings.triggers)}'
></div>
<script src="${baseUrl}/embed.js" async></script>`

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

    inline: smartEmbedCode
  }

  const shopifyLiquidCode = `{% comment %}
  Limina Smart Widget - with behavior triggers
  Add this to your product.liquid or product-template.liquid file
{% endcomment %}

<div class="limina-widget-container"
  data-limina-widget
  data-merchant-id="${user?.merchantId}"
  data-shopify-product-id="{{ product.id }}"
  data-current-price="{{ product.price | money_without_currency }}"
  data-triggers='${JSON.stringify(settings.triggers)}'
></div>
<script src="${baseUrl}/embed.js" async></script>`

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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-sm">Add smart price alerts to your store</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#C9A227] text-[#0C0A09] font-bold rounded-lg hover:bg-[#D4AF37] transition-all disabled:opacity-50"
        >
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Saved!
            </>
          ) : saving ? (
            <>
              <div className="w-4 h-4 border-2 border-[#0C0A09] border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Tabs */}
          <div className="dashboard-card p-2 dashboard-enter">
            <div className="flex gap-1">
              {[
                { id: 'triggers', label: 'Smart Triggers', icon: Zap },
                { id: 'display', label: 'Display', icon: Layout },
                { id: 'code', label: 'Embed Code', icon: Code },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#C9A227]/20 text-[#C9A227]'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Triggers Tab */}
          {activeTab === 'triggers' && (
            <div className="dashboard-card p-6 dashboard-enter space-y-6">
              <div>
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Smart Triggers</p>
                <p className="text-sm text-white/50">
                  Configure when the price alert option appears. Widget only shows when conditions are met.
                </p>
              </div>

              {/* Exit Intent */}
              <div className="p-4 bg-white/5 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Exit Intent</p>
                      <p className="text-xs text-white/40">Shows when user moves to leave</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.triggers.exit_intent.enabled}
                      onChange={(e) => updateTrigger('exit_intent', { enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A227]"></div>
                  </label>
                </div>
                {settings.triggers.exit_intent.enabled && (
                  <div className="flex items-center gap-3 ml-13">
                    <label className="text-xs text-white/50">Threshold:</label>
                    <input
                      type="number"
                      value={settings.triggers.exit_intent.threshold}
                      onChange={(e) => updateTrigger('exit_intent', { threshold: parseInt(e.target.value) || 50 })}
                      className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white"
                    />
                    <span className="text-xs text-white/40">px from top</span>
                  </div>
                )}
              </div>

              {/* Time on Page */}
              <div className="p-4 bg-white/5 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Time on Page</p>
                      <p className="text-xs text-white/40">Shows after browsing delay</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.triggers.time_on_page.enabled}
                      onChange={(e) => updateTrigger('time_on_page', { enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A227]"></div>
                  </label>
                </div>
                {settings.triggers.time_on_page.enabled && (
                  <div className="flex items-center gap-3 ml-13">
                    <label className="text-xs text-white/50">Delay:</label>
                    <input
                      type="number"
                      value={settings.triggers.time_on_page.delay_seconds}
                      onChange={(e) => updateTrigger('time_on_page', { delay_seconds: parseInt(e.target.value) || 30 })}
                      className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white"
                    />
                    <span className="text-xs text-white/40">seconds</span>
                  </div>
                )}
              </div>

              {/* Cart Abandonment */}
              <div className="p-4 bg-white/5 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Cart Abandonment</p>
                      <p className="text-xs text-white/40">Shows when returning after leaving</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.triggers.cart_abandonment.enabled}
                      onChange={(e) => updateTrigger('cart_abandonment', { enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A227]"></div>
                  </label>
                </div>
              </div>

              {/* Scroll Depth */}
              <div className="p-4 bg-white/5 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <ArrowDown className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Scroll Depth</p>
                      <p className="text-xs text-white/40">Shows when scrolling back up</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.triggers.scroll_depth.enabled}
                      onChange={(e) => updateTrigger('scroll_depth', { enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A227]"></div>
                  </label>
                </div>
                {settings.triggers.scroll_depth.enabled && (
                  <div className="flex items-center gap-3 ml-13">
                    <label className="text-xs text-white/50">Threshold:</label>
                    <input
                      type="number"
                      value={settings.triggers.scroll_depth.threshold}
                      onChange={(e) => updateTrigger('scroll_depth', { threshold: parseInt(e.target.value) || 70 })}
                      className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white"
                    />
                    <span className="text-xs text-white/40">% scroll</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Display Tab */}
          {activeTab === 'display' && (
            <div className="dashboard-card p-6 dashboard-enter space-y-6">
              <div>
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Display Settings</p>
                <p className="text-sm text-white/50">
                  Customize how the widget appears to customers.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Collapsed Text</label>
                  <input
                    type="text"
                    value={settings.display.collapsed_text}
                    onChange={(e) => updateDisplay({ collapsed_text: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#C9A227]/50 transition-all"
                    placeholder="Want a better price? Set your target"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Expanded Text</label>
                  <input
                    type="text"
                    value={settings.display.expanded_text}
                    onChange={(e) => updateDisplay({ expanded_text: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#C9A227]/50 transition-all"
                    placeholder="Get notified when this drops to your price"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['subtle', 'bold'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => updateDisplay({ theme: theme as 'subtle' | 'bold' })}
                        className={`p-4 rounded-lg border transition-all text-left capitalize ${
                          settings.display.theme === theme
                            ? 'bg-[#C9A227]/10 border-[#C9A227]/50 text-[#C9A227]'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Code Tab */}
          {activeTab === 'code' && (
            <>
              <div className="dashboard-card p-6 dashboard-enter">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Product Selection</p>

                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#C9A227]/50 transition-all"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id} className="bg-[#161413]">
                      {product.title} - ${product.current_price}
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
                    { type: 'inline', label: 'Smart', icon: Zap, desc: 'Trigger-based' },
                    { type: 'iframe', label: 'Embedded', icon: Monitor, desc: 'Always visible' },
                    { type: 'popup', label: 'Popup', icon: Layout, desc: 'Opens in window' },
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
                  Add this to your Shopify theme&apos;s product template for smart, trigger-based widgets
                </p>

                <pre className="p-4 bg-black/30 rounded-lg overflow-x-auto text-xs text-white/70 font-mono leading-relaxed">
                  {shopifyLiquidCode}
                </pre>
              </div>
            </>
          )}
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <div className="dashboard-card p-6 dashboard-enter dashboard-enter-delay-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Live Preview</p>
              <span className="text-[10px] px-2 py-1 bg-green-500/20 text-green-400 rounded">Updates in real-time</span>
            </div>

            {/* Fake product page context */}
            <div className="bg-[#1a1918] rounded-lg overflow-hidden border border-white/10">
              {/* Browser bar */}
              <div className="bg-white/5 px-3 py-2 flex items-center gap-2 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                </div>
                <div className="flex-1 text-center text-[10px] text-white/30">yourstore.com/products/item</div>
              </div>

              {/* Product page mockup */}
              <div className="p-4 space-y-4">
                {/* Product info */}
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-white/10 rounded" />
                  <div className="flex-1">
                    <div className="h-3 bg-white/20 rounded w-3/4 mb-2" />
                    <div className="h-2 bg-white/10 rounded w-1/2 mb-2" />
                    <div className="text-white font-bold">$99.99</div>
                  </div>
                </div>

                {/* Add to cart button */}
                <button className="w-full py-2.5 bg-white/10 text-white/70 text-sm font-medium rounded border border-white/20">
                  Add to Cart
                </button>

                {/* Limina Widget Preview */}
                <div className={`rounded-lg overflow-hidden transition-all ${
                  settings.display.theme === 'bold'
                    ? 'bg-[#C9A227]/10 border border-[#C9A227]/30'
                    : 'bg-white/[0.03] border border-white/10'
                }`}>
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        settings.display.theme === 'bold'
                          ? 'border-[#C9A227]/50 bg-[#C9A227]/20'
                          : 'border-white/20 bg-white/5'
                      }`}>
                        <CheckCircle className={`w-3 h-3 ${
                          settings.display.theme === 'bold' ? 'text-[#C9A227]' : 'text-[#C9A227]'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          settings.display.theme === 'bold' ? 'text-white' : 'text-white/90'
                        }`}>{settings.display.collapsed_text || 'Name your price'}</p>
                        <p className="text-xs text-white/40">{settings.display.expanded_text || 'Get notified when it drops'}</p>
                      </div>
                      <span className="text-[10px] text-white/30 uppercase tracking-wider">Limina</span>
                    </div>

                    <div className="pt-3 border-t border-white/10 space-y-3">
                      <div>
                        <label className="text-xs text-white/40">Your target</label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white/50">$</span>
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white"
                            placeholder="85"
                            readOnly
                          />
                        </div>
                      </div>
                      <button className={`w-full py-2 font-semibold text-sm rounded transition-colors ${
                        settings.display.theme === 'bold'
                          ? 'bg-[#C9A227] text-black hover:bg-[#D4AF37]'
                          : 'bg-[#C9A227] text-black hover:bg-[#D4AF37]'
                      }`}>
                        Set Alert
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-white/40 text-center mt-4">
              Widget appears inline below the Add to Cart button
            </p>
          </div>

          <div className="dashboard-card p-6 dashboard-enter dashboard-enter-delay-2">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Active Triggers</p>

            <div className="space-y-2">
              {Object.entries(settings.triggers).map(([key, value]) => (
                <div
                  key={key}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    value.enabled ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <span className="text-sm text-white capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className={`text-xs font-medium ${value.enabled ? 'text-green-400' : 'text-white/40'}`}>
                    {value.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card p-6 dashboard-enter dashboard-enter-delay-3">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">How It Works</p>

            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#C9A227]/20 rounded-full flex items-center justify-center text-[#C9A227] font-bold text-xs">
                  1
                </div>
                <div>
                  <p className="font-medium text-white">Widget stays hidden</p>
                  <p className="text-white/50 text-xs mt-1">Doesn&apos;t devalue products by default</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#C9A227]/20 rounded-full flex items-center justify-center text-[#C9A227] font-bold text-xs">
                  2
                </div>
                <div>
                  <p className="font-medium text-white">Monitors user behavior</p>
                  <p className="text-white/50 text-xs mt-1">Exit intent, time delays, cart abandonment</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#C9A227]/20 rounded-full flex items-center justify-center text-[#C9A227] font-bold text-xs">
                  3
                </div>
                <div>
                  <p className="font-medium text-white">Shows at the right moment</p>
                  <p className="text-white/50 text-xs mt-1">Captures sales that would be lost</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#C9A227]/20 rounded-full flex items-center justify-center text-[#C9A227] font-bold text-xs">
                  4
                </div>
                <div>
                  <p className="font-medium text-white">Customer sets target price</p>
                  <p className="text-white/50 text-xs mt-1">You get a committed buyer at their price</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
