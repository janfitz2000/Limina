'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Target, Clock, Mail, User, CheckCircle, AlertCircle, Loader2, CreditCard, Lock } from 'lucide-react'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface ProductData {
  id: string
  title: string
  price: number
  currency: string
  image?: string
  merchantId: string
  merchantHasStripe?: boolean
}

interface FormData {
  email: string
  name: string
  targetPrice: string
  expiryDays: string
}

function PaymentForm({
  product,
  form,
  setForm,
  onSuccess,
  formatCurrency
}: {
  product: ProductData
  form: FormData
  setForm: React.Dispatch<React.SetStateAction<FormData>>
  onSuccess: () => void
  formatCurrency: (amount: number, currency: string) => string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)

  const discountPercent = form.targetPrice && product
    ? Math.round((1 - parseFloat(form.targetPrice) / product.price) * 100)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setError('Payment system not loaded')
      return
    }

    if (!form.email || !form.targetPrice) {
      setError('Please fill in all required fields')
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
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email: form.email,
          name: form.name || undefined
        }
      })

      if (pmError) {
        throw new Error(pmError.message)
      }

      const response = await fetch('/api/buy-orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          targetPrice: targetPrice,
          expiryDays: parseInt(form.expiryDays),
          paymentMethodId: paymentMethod.id,
          customerInfo: {
            email: form.email,
            name: form.name || undefined
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'limina-order-created', success: true }, '*')
        }
      } else {
        throw new Error(data.error || 'Failed to create order')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating order')
    } finally {
      setSubmitting(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#FAF9F6',
        '::placeholder': {
          color: 'rgba(255, 255, 255, 0.3)'
        },
        iconColor: '#C9A227'
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444'
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
          <Mail className="h-3.5 w-3.5" />
          Email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
          placeholder="your@email.com"
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#C9A227]/50 focus:bg-white/[0.07] transition-all"
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
          <User className="h-3.5 w-3.5" />
          Name <span className="text-white/20">(optional)</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Your name"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#C9A227]/50 focus:bg-white/[0.07] transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            <Target className="h-3.5 w-3.5" />
            Target Price
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">
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
              className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#C9A227]/50 focus:bg-white/[0.07] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            <Clock className="h-3.5 w-3.5" />
            Valid For
          </label>
          <select
            value={form.expiryDays}
            onChange={(e) => setForm(prev => ({ ...prev, expiryDays: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#C9A227]/50 focus:bg-white/[0.07] transition-all appearance-none cursor-pointer"
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
          <CreditCard className="h-3.5 w-3.5" />
          Payment Card
        </label>
        <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus-within:border-[#C9A227]/50 focus-within:bg-white/[0.07] transition-all">
          <CardElement
            options={cardElementOptions}
            onChange={(e) => setCardComplete(e.complete)}
          />
        </div>
        <p className="mt-2 text-[11px] text-white/30 flex items-center gap-1">
          <Lock className="h-3 w-3" />
          Your card will only be charged if the price drops to your target
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {form.targetPrice && product && parseFloat(form.targetPrice) < product.price && (
        <div className="p-4 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Your savings</span>
            <span className="text-sm font-bold text-[#C9A227]">
              {formatCurrency(product.price - parseFloat(form.targetPrice), product.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-white/60">Discount</span>
            <span className="text-sm font-bold text-[#C9A227]">{discountPercent}% off</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !stripe || !form.email || !form.targetPrice || !cardComplete}
        className="w-full py-4 bg-[#C9A227] text-[#0C0A09] font-bold rounded-lg hover:bg-[#D4AF37] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Creating Order...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Set Price Alert & Authorize Payment
          </>
        )}
      </button>

      <p className="text-[11px] text-center text-white/30">
        Powered by{' '}
        <a
          href="https://limina-platform-new.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#C9A227] hover:text-[#D4AF37] transition-colors"
        >
          Limina
        </a>
      </p>
    </form>
  )
}

function SimpleAlertForm({
  product,
  form,
  setForm,
  onSuccess,
  formatCurrency
}: {
  product: ProductData
  form: FormData
  setForm: React.Dispatch<React.SetStateAction<FormData>>
  onSuccess: () => void
  formatCurrency: (amount: number, currency: string) => string
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const discountPercent = form.targetPrice && product
    ? Math.round((1 - parseFloat(form.targetPrice) / product.price) * 100)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.email || !form.targetPrice) {
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
      const response = await fetch('/api/buy-orders', {
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
        onSuccess()
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'limina-order-created', success: true }, '*')
        }
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
          <Mail className="h-3.5 w-3.5" />
          Email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
          placeholder="your@email.com"
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#C9A227]/50 focus:bg-white/[0.07] transition-all"
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
          <User className="h-3.5 w-3.5" />
          Name <span className="text-white/20">(optional)</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Your name"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#C9A227]/50 focus:bg-white/[0.07] transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            <Target className="h-3.5 w-3.5" />
            Target Price
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">
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
              className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#C9A227]/50 focus:bg-white/[0.07] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            <Clock className="h-3.5 w-3.5" />
            Valid For
          </label>
          <select
            value={form.expiryDays}
            onChange={(e) => setForm(prev => ({ ...prev, expiryDays: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#C9A227]/50 focus:bg-white/[0.07] transition-all appearance-none cursor-pointer"
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {form.targetPrice && product && parseFloat(form.targetPrice) < product.price && (
        <div className="p-4 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Your savings</span>
            <span className="text-sm font-bold text-[#C9A227]">
              {formatCurrency(product.price - parseFloat(form.targetPrice), product.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-white/60">Discount</span>
            <span className="text-sm font-bold text-[#C9A227]">{discountPercent}% off</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !form.email || !form.targetPrice}
        className="w-full py-4 bg-[#C9A227] text-[#0C0A09] font-bold rounded-lg hover:bg-[#D4AF37] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Setting Alert...
          </>
        ) : (
          'Set Price Alert'
        )}
      </button>

      <p className="text-[11px] text-center text-white/30">
        Powered by{' '}
        <a
          href="https://limina-platform-new.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#C9A227] hover:text-[#D4AF37] transition-colors"
        >
          Limina
        </a>
      </p>
    </form>
  )
}

function WidgetContent() {
  const searchParams = useSearchParams()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const enablePayment = searchParams.get('payment') === 'true'

  const [form, setForm] = useState<FormData>({
    email: '',
    name: '',
    targetPrice: '',
    expiryDays: '30'
  })

  useEffect(() => {
    const productId = searchParams.get('productId')
    const merchantId = searchParams.get('merchantId')
    const shopifyProductId = searchParams.get('shopifyProductId')
    const productHandle = searchParams.get('handle')

    if (!merchantId) {
      setError('Missing merchant ID')
      setLoading(false)
      return
    }

    if (!productId && !shopifyProductId && !productHandle) {
      setError('Missing product identifier')
      setLoading(false)
      return
    }

    async function fetchProduct() {
      try {
        let url = `/api/products?merchantId=${merchantId}`
        if (productId) {
          url += `&productId=${productId}`
        } else if (shopifyProductId) {
          url += `&shopifyProductId=${shopifyProductId}`
        } else if (productHandle) {
          url += `&handle=${productHandle}`
        }

        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          if (data.product) {
            setProduct({
              id: data.product.id,
              title: data.product.title,
              price: data.product.current_price,
              currency: data.product.currency || 'GBP',
              image: data.product.image_url,
              merchantId: merchantId!,
              merchantHasStripe: data.merchantHasStripe
            })
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center bg-[#0C0A09]">
        <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="p-6 bg-[#0C0A09]">
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="p-6 bg-[#0C0A09] text-[#FAF9F6]">
        <div className="bg-[#161413] border border-[#C9A227]/30 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#C9A227]/20 rounded-full flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-[#C9A227]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#C9A227] mb-2">
                {enablePayment ? 'Order Created!' : 'Price Alert Set!'}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                {enablePayment ? (
                  <>
                    Your payment has been authorized. If{' '}
                    <span className="text-white font-medium">{product?.title}</span> drops to{' '}
                    <span className="text-[#C9A227] font-bold">
                      {formatCurrency(parseFloat(form.targetPrice), product?.currency || 'GBP')}
                    </span>
                    , your order will be automatically fulfilled.
                  </>
                ) : (
                  <>
                    We'll email you at <span className="text-white font-medium">{form.email}</span> if{' '}
                    <span className="text-white font-medium">{product?.title}</span> drops to{' '}
                    <span className="text-[#C9A227] font-bold">
                      {formatCurrency(parseFloat(form.targetPrice), product?.currency || 'GBP')}
                    </span>
                  </>
                )}
              </p>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setForm({ email: '', name: '', targetPrice: '', expiryDays: '30' })
                }}
                className="mt-4 text-sm text-[#C9A227] hover:text-[#D4AF37] transition-colors"
              >
                Set another price alert
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-[#0C0A09] text-[#FAF9F6]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          margin: 0;
          background: #0C0A09;
        }
      `}</style>

      <div className="bg-[#161413] border border-white/10 rounded-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent" />

        <div className="p-6">
          {product?.image && (
            <div className="flex items-start gap-4 mb-6 pb-5 border-b border-white/10">
              <img
                src={product.image}
                alt={product.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{product?.title}</h3>
                <p className="text-2xl font-extrabold text-[#C9A227] mt-1">
                  {formatCurrency(product?.price || 0, product?.currency || 'GBP')}
                </p>
              </div>
            </div>
          )}

          {!product?.image && (
            <div className="mb-6 pb-5 border-b border-white/10">
              <h3 className="font-bold text-white">{product?.title}</h3>
              <p className="text-2xl font-extrabold text-[#C9A227] mt-1">
                {formatCurrency(product?.price || 0, product?.currency || 'GBP')}
              </p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Name Your Price
            </p>
            <p className="text-sm text-white/60">
              {enablePayment
                ? 'Set your target price and authorize payment. You only pay when the price drops.'
                : "Set your target price and we'll notify you when it drops"}
            </p>
          </div>

          {enablePayment && stripePromise ? (
            <Elements stripe={stripePromise}>
              <PaymentForm
                product={product!}
                form={form}
                setForm={setForm}
                onSuccess={() => setSubmitted(true)}
                formatCurrency={formatCurrency}
              />
            </Elements>
          ) : (
            <SimpleAlertForm
              product={product!}
              form={form}
              setForm={setForm}
              onSuccess={() => setSubmitted(true)}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function WidgetFallback() {
  return (
    <div className="p-8 flex items-center justify-center bg-[#0C0A09]">
      <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function WidgetPage() {
  return (
    <div className="min-h-screen bg-[#0C0A09]">
      <Suspense fallback={<WidgetFallback />}>
        <WidgetContent />
      </Suspense>
    </div>
  )
}
