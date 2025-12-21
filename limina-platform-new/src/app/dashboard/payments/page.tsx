'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import {
  CreditCard,
  DollarSign,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowUpRight,
  Wallet
} from 'lucide-react'

interface PaymentStats {
  totalEarnings: number
  pendingPayouts: number
  availableBalance: number
  lastPayout: string | null
}

interface PayoutHistory {
  id: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  date: string
  description: string
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const [stripeConnected, setStripeConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [stats, setStats] = useState<PaymentStats>({
    totalEarnings: 0,
    pendingPayouts: 0,
    availableBalance: 0,
    lastPayout: null
  })
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([])

  useEffect(() => {
    async function checkStripeStatus() {
      if (!user?.merchantId) return

      try {
        const response = await fetch(`/api/stripe/connect?merchantId=${user.merchantId}`)
        if (response.ok) {
          const data = await response.json()
          setStripeConnected(data.connected || false)
          if (data.stats) {
            setStats(data.stats)
          }
          if (data.payouts) {
            setPayoutHistory(data.payouts)
          }
        }
      } catch (error) {
        console.error('Error checking Stripe status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkStripeStatus()
  }, [user?.merchantId])

  const handleConnectStripe = async () => {
    setConnecting(true)
    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: user?.merchantId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        }
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error)
    } finally {
      setConnecting(false)
    }
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
      {/* Header */}
      <div>
        <p className="text-white/40 text-sm">Manage your earnings and payouts</p>
      </div>

      {/* Stripe Connection Status */}
      {!stripeConnected ? (
        <div className="bg-gradient-to-r from-[#C9A227]/20 to-[#C9A227]/10 border border-[#C9A227]/30 rounded-xl p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-6 w-6 text-[#C9A227]" />
                <h2 className="text-xl font-bold">Connect with Stripe</h2>
              </div>
              <p className="text-white/60 max-w-xl mb-6">
                Connect your Stripe account to receive payouts from fulfilled buy orders.
                Stripe handles all payment processing securely.
              </p>
              <button
                onClick={handleConnectStripe}
                disabled={connecting}
                className="px-6 py-3 bg-[#C9A227] text-[#0C0A09] rounded-lg font-bold hover:bg-[#D4AF37] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Stripe Account
                    <ArrowUpRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
            <div className="hidden lg:block">
              <Building2 className="h-24 w-24 text-[#C9A227]/30" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-green-400">Stripe Connected</h3>
              <p className="text-sm text-green-400/70">Your account is ready to receive payouts</p>
            </div>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-2 px-4 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
            >
              Open Stripe Dashboard
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#161413] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-[#C9A227]" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-white/40">Total Earnings</h3>
          <p className="text-2xl font-bold mt-1">
            ${stats.totalEarnings.toLocaleString()}
          </p>
          <p className="text-sm text-white/30 mt-2">Lifetime earnings from fulfilled orders</p>
        </div>

        <div className="bg-[#161413] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-white/60" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-white/40">Pending Payouts</h3>
          <p className="text-2xl font-bold mt-1">
            ${stats.pendingPayouts.toLocaleString()}
          </p>
          <p className="text-sm text-white/30 mt-2">Processing, typically 2-3 business days</p>
        </div>

        <div className="bg-[#161413] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white/60" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-white/40">Available Balance</h3>
          <p className="text-2xl font-bold mt-1">
            ${stats.availableBalance.toLocaleString()}
          </p>
          <p className="text-sm text-white/30 mt-2">Ready for next payout</p>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-[#161413] border border-white/10 rounded-xl">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-semibold">Payout History</h3>
        </div>

        {payoutHistory.length > 0 ? (
          <div className="divide-y divide-white/5">
            {payoutHistory.map((payout) => (
              <div key={payout.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    payout.status === 'paid' ? 'bg-green-500/10' :
                    payout.status === 'pending' ? 'bg-[#C9A227]/10' : 'bg-red-500/10'
                  }`}>
                    {payout.status === 'paid' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : payout.status === 'pending' ? (
                      <Clock className="h-5 w-5 text-[#C9A227]" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{payout.description}</p>
                    <p className="text-sm text-white/40">{new Date(payout.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${payout.amount.toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    payout.status === 'paid' ? 'bg-green-500/10 text-green-400' :
                    payout.status === 'pending' ? 'bg-[#C9A227]/10 text-[#C9A227]' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-white/20" />
            </div>
            <h3 className="text-lg font-medium mb-2">No payouts yet</h3>
            <p className="text-white/40 max-w-sm mx-auto">
              {stripeConnected
                ? "Your first payout will appear here once you have fulfilled orders."
                : "Connect your Stripe account to start receiving payouts."}
            </p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-[#161413] border border-white/10 rounded-xl p-6">
        <h3 className="font-semibold mb-4">How Payments Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-full flex items-center justify-center text-[#C9A227] font-semibold">
              1
            </div>
            <div>
              <h4 className="font-medium">Customer Places Order</h4>
              <p className="text-sm text-white/40">Payment is authorized and held in escrow</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-full flex items-center justify-center text-[#C9A227] font-semibold">
              2
            </div>
            <div>
              <h4 className="font-medium">Order Fulfilled</h4>
              <p className="text-sm text-white/40">When price target is met, payment is captured</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-full flex items-center justify-center text-[#C9A227] font-semibold">
              3
            </div>
            <div>
              <h4 className="font-medium">Payout Sent</h4>
              <p className="text-sm text-white/40">Funds transferred to your bank (2-3 days)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
