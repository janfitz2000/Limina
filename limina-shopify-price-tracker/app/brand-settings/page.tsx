// Brand customization page for merchants
'use client'

import { useState, useEffect } from 'react'
import { BrandCustomizationService, BrandSettings } from '../../lib/brand-customization'

export default function BrandSettingsPage() {
  const [settings, setSettings] = useState<BrandSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadBrandSettings()
  }, [])

  const loadBrandSettings = async () => {
    try {
      const shopDomain = new URLSearchParams(window.location.search).get('shop') || 'demo-shop.myshopify.com'
      const brandSettings = await BrandCustomizationService.getBrandSettings(shopDomain)
      setSettings(brandSettings)
    } catch (error) {
      console.error('Error loading brand settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: keyof BrandSettings, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  const saveBrandSettings = async () => {
    if (!settings) return
    
    try {
      setSaving(true)
      await BrandCustomizationService.updateBrandSettings(settings.shop_domain, settings)
      alert('Brand settings saved successfully!')
    } catch (error) {
      console.error('Error saving brand settings:', error)
      alert('Failed to save brand settings')
    } finally {
      setSaving(false)
    }
  }

  const generatePreview = () => {
    if (!settings) return
    const html = BrandCustomizationService.generatePreviewEmail(settings)
    setPreviewHtml(html)
    setShowPreview(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading brand settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return <div className="p-8">Error loading brand settings</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Brand Settings</h1>
              <p className="text-gray-600">Customize how your price alert emails look</p>
            </div>
            <div className="space-x-3">
              <button
                onClick={generatePreview}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Preview Email
              </button>
              <button
                onClick={saveBrandSettings}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Settings Form */}
          <div className="space-y-6">
            
            {/* Basic Brand Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={settings.brand_name}
                    onChange={(e) => updateSetting('brand_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your Store Name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={settings.brand_logo_url || ''}
                    onChange={(e) => updateSetting('brand_logo_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://your-store.com/logo.png"
                  />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Colors</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => updateSetting('secondary_color', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => updateSetting('secondary_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Typography & Style */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Typography & Style</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Family
                  </label>
                  <select
                    value={settings.font_family}
                    onChange={(e) => updateSetting('font_family', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times">Times</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Style
                  </label>
                  <select
                    value={settings.button_style}
                    onChange={(e) => updateSetting('button_style', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="rounded">Rounded</option>
                    <option value="square">Square</option>
                    <option value="pill">Pill</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer Text */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Email Footer</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Footer Text (Optional)
                </label>
                <textarea
                  value={settings.email_footer_text || ''}
                  onChange={(e) => updateSetting('email_footer_text', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Thank you for shopping with us! Follow us on social media for more deals."
                />
              </div>
            </div>

          </div>

          {/* Live Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
            
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <div 
                style={{ 
                  background: `linear-gradient(135deg, ${settings.primary_color} 0%, ${settings.secondary_color} 100%)`,
                  color: 'white',
                  padding: '20px',
                  borderRadius: '8px 8px 0 0',
                  textAlign: 'center',
                  fontFamily: settings.font_family
                }}
              >
                {settings.brand_logo_url && (
                  <div style={{ marginBottom: '15px' }}>
                    <img 
                      src={settings.brand_logo_url} 
                      alt={settings.brand_name}
                      style={{ maxHeight: '40px', height: 'auto' }}
                    />
                  </div>
                )}
                <h2 style={{ margin: 0, fontSize: '18px' }}>🎉 Price Drop Alert!</h2>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                  The price you've been waiting for is here
                </p>
              </div>
              
              <div style={{ padding: '20px', background: 'white', borderRadius: '0 0 8px 8px' }}>
                <p style={{ margin: '0 0 15px 0', fontFamily: settings.font_family }}>
                  Hi Customer! 👋
                </p>
                
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '15px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Sample Product</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>Target: $199.99</span>
                    <span style={{ fontSize: '16px', color: '#28a745', fontWeight: 'bold' }}>Now: $149.99</span>
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div 
                    style={{
                      background: `linear-gradient(135deg, ${settings.primary_color}, ${settings.secondary_color})`,
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: settings.button_style === 'rounded' ? '6px' : settings.button_style === 'pill' ? '25px' : '0px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      display: 'inline-block',
                      fontFamily: settings.font_family
                    }}
                  >
                    🛒 Buy Now at {settings.brand_name}
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-4">
              This is a simplified preview. Click "Preview Email" above to see the full email template.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Email Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-96">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-96 border-0"
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}