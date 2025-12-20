'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Target, Clock, Mail, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ProductData {
  id: string
  title: string
  price: number
  currency: string
  image?: string
  merchantId: string
}

function WidgetContent() {
  const searchParams = useSearchParams()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    email: '',
    name: '',
    targetPrice: '',
    expiryDays: '30'
  })

  useEffect(() => {
    const productId = searchParams.get('productId')
    const merchantId = searchParams.get('merchantId')

    if (!productId || !merchantId) {
      setError('Missing product or merchant ID')
      setLoading(false)
      return
    }

    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products?merchantId=${merchantId}&productId=${productId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.product) {
            setProduct({
              id: data.product.id,
              title: data.product.title,
              price: data.product.current_price,
              currency: data.product.currency || 'GBP',
              image: data.product.image_url,
              merchantId: merchantId!
            })
            // Set suggested price at 10% discount
            setForm(prev => ({
              ...prev,
              targetPrice: (data.product.current_price * 0.9).toFixed(2)
            }))
          } else {
            setError('Product not found')
          }
        } else {
          setError('Failed to load product')
        }
      } catch (err) {
        setError('Error loading product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product || !form.email || !form.targetPrice) {
      return
    }

    const targetPrice = parseFloat(form.targetPrice)
    if (targetPrice >= product.price) {
      setError('Target price must be below current price')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/buy-orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: product.merchantId,
          productId: product.id,
          customerEmail: form.email,
          customerName: form.name || undefined,
          targetPrice: targetPrice,
          currentPrice: product.price,
          expiryDays: parseInt(form.expiryDays)
        })
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit order')
      }
    } catch (err) {
      setError('Error submitting order')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="p-6 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">Order Submitted!</h3>
            <p className="text-green-700 mt-1">
              We'll notify you at <strong>{form.email}</strong> if {product?.title} drops to your target price of {formatCurrency(parseFloat(form.targetPrice), product?.currency || 'GBP')}.
            </p>
            <button
              onClick={() => {
                setSubmitted(false)
                setForm({ email: '', name: '', targetPrice: '', expiryDays: '30' })
              }}
              className="mt-4 text-sm text-green-600 hover:text-green-700 underline"
            >
              Submit another offer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Product info */}
      <div className="flex items-start gap-4 mb-6 pb-4 border-b border-gray-100">
        {product?.image && (
          <img
            src={product.image}
            alt={product.title}
            className="w-16 h-16 object-cover rounded-lg"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{product?.title}</h3>
          <p className="text-lg font-bold text-blue-600 mt-1">
            {formatCurrency(product?.price || 0, product?.currency || 'GBP')}
          </p>
        </div>
      </div>

      {/* Offer form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
            <Mail className="h-4 w-4" />
            Email Address
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="your@email.com"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
            <User className="h-4 w-4" />
            Name (optional)
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Your name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <Target className="h-4 w-4" />
              Your Target Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {product?.currency === 'USD' ? '$' : product?.currency === 'EUR' ? '€' : '£'}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={product?.price}
                value={form.targetPrice}
                onChange={(e) => setForm(prev => ({ ...prev, targetPrice: e.target.value }))}
                required
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <Clock className="h-4 w-4" />
              Valid For
            </label>
            <select
              value={form.expiryDays}
              onChange={(e) => setForm(prev => ({ ...prev, expiryDays: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {form.targetPrice && product && parseFloat(form.targetPrice) < product.price && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              You'll save{' '}
              <strong>
                {formatCurrency(product.price - parseFloat(form.targetPrice), product.currency)}
              </strong>{' '}
              ({Math.round((1 - parseFloat(form.targetPrice) / product.price) * 100)}% off) if the price drops!
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !form.email || !form.targetPrice}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Price Alert'
          )}
        </button>

        <p className="text-xs text-center text-gray-500">
          Powered by <a href="/" className="text-blue-600 hover:underline">Limina</a>
        </p>
      </form>
    </div>
  )
}

function WidgetFallback() {
  return (
    <div className="p-6 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}

export default function WidgetPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<WidgetFallback />}>
          <WidgetContent />
        </Suspense>
      </div>
    </div>
  )
}
