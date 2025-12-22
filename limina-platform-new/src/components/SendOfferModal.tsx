'use client'

import { useState, useEffect } from 'react'
import { X, Tag, Send, AlertCircle } from 'lucide-react'

interface SendOfferModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (offerPrice: number) => Promise<void>
  order: {
    id: string
    customerName: string
    customerEmail: string
    productTitle: string
    productImage?: string
    targetPrice: number
    currentPrice: number
    currency: string
  }
}

export function SendOfferModal({ isOpen, onClose, onSend, order }: SendOfferModalProps) {
  const [offerPrice, setOfferPrice] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setOfferPrice(order.targetPrice.toString())
      setError(null)
    }
  }, [isOpen, order.targetPrice])

  if (!isOpen) return null

  const numericOfferPrice = parseFloat(offerPrice) || 0
  const discount = order.currentPrice - numericOfferPrice
  const discountPercent = order.currentPrice > 0 ? ((discount / order.currentPrice) * 100) : 0
  const savings = order.currentPrice - numericOfferPrice

  const isValidOffer = numericOfferPrice > 0 && numericOfferPrice < order.currentPrice
  const isMatchingRequest = numericOfferPrice === order.targetPrice
  const isBetterThanRequest = numericOfferPrice < order.targetPrice

  const handleSend = async () => {
    if (!isValidOffer) {
      setError('Offer price must be between 0 and the current price')
      return
    }

    setSending(true)
    setError(null)

    try {
      await onSend(numericOfferPrice)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to send offer')
    } finally {
      setSending(false)
    }
  }

  const formatCurrency = (amount: number) => {
    const symbol = order.currency === 'GBP' ? '£' : order.currency === 'EUR' ? '€' : '$'
    return `${symbol}${amount.toFixed(2)}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 bg-[#161413] border border-white/10 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#C9A227]" />
            <h2 className="text-lg font-semibold">Send Offer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5">
            {order.productImage ? (
              <img
                src={order.productImage}
                alt={order.productTitle}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-white/5 rounded-lg" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{order.productTitle}</p>
              <p className="text-xs text-white/40">Current price: {formatCurrency(order.currentPrice)}</p>
            </div>
          </div>

          <div className="p-3 bg-[#C9A227]/5 rounded-lg border border-[#C9A227]/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#C9A227]/20 rounded-full flex items-center justify-center">
                <span className="text-[#C9A227] font-medium text-sm">
                  {order.customerName[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{order.customerName}</p>
                <p className="text-xs text-white/40">{order.customerEmail}</p>
              </div>
            </div>
            <p className="text-sm text-white/60">
              Requested: <span className="text-[#C9A227] font-semibold">{formatCurrency(order.targetPrice)}</span>
              <span className="text-white/40"> ({((order.currentPrice - order.targetPrice) / order.currentPrice * 100).toFixed(0)}% off)</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/60">Your Offer Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                {order.currency === 'GBP' ? '£' : order.currency === 'EUR' ? '€' : '$'}
              </span>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-lg font-semibold focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/50 outline-none"
                placeholder="0.00"
                step="0.01"
                min="0"
                max={order.currentPrice}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setOfferPrice(order.targetPrice.toString())}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  isMatchingRequest
                    ? 'bg-[#C9A227]/20 border-[#C9A227]/50 text-[#C9A227]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                Match request
              </button>
              <button
                type="button"
                onClick={() => setOfferPrice((order.targetPrice * 0.95).toFixed(2))}
                className="flex-1 py-2 text-xs font-medium rounded-lg bg-white/5 border border-white/10 text-white/60 hover:border-white/20 transition-colors"
              >
                5% better
              </button>
              <button
                type="button"
                onClick={() => setOfferPrice((order.currentPrice * 0.9).toFixed(2))}
                className="flex-1 py-2 text-xs font-medium rounded-lg bg-white/5 border border-white/10 text-white/60 hover:border-white/20 transition-colors"
              >
                10% off
              </button>
            </div>
          </div>

          {isValidOffer && (
            <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Customer saves</span>
                <span className="text-green-400 font-medium">{formatCurrency(savings)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Discount</span>
                <span className="font-medium">{discountPercent.toFixed(0)}% off</span>
              </div>
              {isBetterThanRequest && (
                <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  Better than their request - higher conversion chance
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-white/60 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!isValidOffer || sending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold bg-[#C9A227] text-[#0C0A09] rounded-lg hover:bg-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-[#0C0A09] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Offer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
