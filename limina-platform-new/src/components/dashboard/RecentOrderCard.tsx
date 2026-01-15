import React from 'react'
import { Package } from 'lucide-react'
import { BuyOrder } from '@/types/dashboard'

interface RecentOrderCardProps {
  order: BuyOrder
}

export function RecentOrderCard({ order }: RecentOrderCardProps) {
  const formatCurrency = (amount: number) => `$${amount.toFixed(0)}`
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  return (
    <div
      className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-4">
        {order.products?.image_url ? (
          <img
            className="h-10 w-10 rounded-lg object-cover"
            src={order.products.image_url}
            alt={order.products.title}
          />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
            <Package className="w-5 h-5 text-white/30" />
          </div>
        )}
        <div>
          <div className="font-medium text-sm">{order.products?.title || 'Product'}</div>
          <div className="text-xs text-white/40">
            {order.customer_name} wants {formatCurrency(order.target_price)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          order.status === 'monitoring'
            ? 'bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/30'
            : order.status === 'fulfilled'
            ? 'bg-green-500/10 text-green-400 border border-green-500/30'
            : 'bg-white/5 text-white/40'
        }`}>
          {order.status === 'monitoring' ? 'Waiting' : order.status}
        </span>
        <span className="text-xs text-white/30">{formatDate(order.created_at)}</span>
      </div>
    </div>
  )
}
