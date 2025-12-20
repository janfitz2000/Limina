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
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">Manage your earnings and payouts</p>
      </div>

      {/* Stripe Connection Status */}
      {!stripeConnected ? (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-6 w-6" />
                <h2 className="text-xl font-bold">Connect with Stripe</h2>
              </div>
              <p className="text-purple-100 max-w-xl mb-6">
                Connect your Stripe account to receive payouts from fulfilled buy orders.
                Stripe handles all payment processing securely.
              </p>
              <button
                onClick={handleConnectStripe}
                disabled={connecting}
                className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2 disabled:opacity-50"
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
              <Building2 className="h-24 w-24 text-purple-200" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Stripe Connected</h3>
              <p className="text-sm text-green-700">Your account is ready to receive payouts</p>
            </div>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
            >
              Open Stripe Dashboard
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Total Earnings</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${stats.totalEarnings.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">Lifetime earnings from fulfilled orders</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Pending Payouts</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${stats.pendingPayouts.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">Processing, typically 2-3 business days</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Available Balance</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${stats.availableBalance.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">Ready for next payout</p>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Payout History</h3>
        </div>

        {payoutHistory.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {payoutHistory.map((payout) => (
              <div key={payout.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    payout.status === 'paid' ? 'bg-green-100' :
                    payout.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {payout.status === 'paid' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : payout.status === 'pending' ? (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{payout.description}</p>
                    <p className="text-sm text-gray-500">{new Date(payout.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${payout.amount.toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    payout.status === 'paid' ? 'bg-green-100 text-green-700' :
                    payout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payouts yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {stripeConnected
                ? "Your first payout will appear here once you have fulfilled orders."
                : "Connect your Stripe account to start receiving payouts."}
            </p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4">How Payments Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
              1
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Customer Places Order</h4>
              <p className="text-sm text-blue-700">Payment is authorized and held in escrow</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
              2
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Order Fulfilled</h4>
              <p className="text-sm text-blue-700">When price target is met, payment is captured</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
              3
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Payout Sent</h4>
              <p className="text-sm text-blue-700">Funds transferred to your bank (2-3 days)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
