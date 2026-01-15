import React from 'react'
import { ArrowUpRight, LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  subtext: string
  change?: string
  isFeatured?: boolean
  delay?: number
  iconColor?: string
}

export function StatCard({ label, value, icon: Icon, subtext, change, isFeatured, delay = 1, iconColor }: StatCardProps) {
  return (
    <div className={`dashboard-card ${isFeatured ? 'dashboard-card-featured' : ''} p-5 dashboard-enter dashboard-enter-delay-${delay}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-[10px] font-semibold uppercase tracking-widest ${isFeatured ? 'text-[#C9A227]' : 'text-white/30'}`}>{label}</p>
        {change && (
          <span className="flex items-center text-xs text-[#C9A227]">
            <ArrowUpRight className="w-3 h-3 mr-0.5" />
            {change}
          </span>
        )}
      </div>
      <p className={`text-3xl font-extrabold stat-number ${isFeatured ? 'text-[#C9A227]' : ''}`}>{value}</p>
      <div className="flex items-center gap-2 mt-3">
        <div className={`w-8 h-8 flex items-center justify-center ${isFeatured ? 'bg-[#C9A227]/10' : 'bg-white/5'}`}>
          <Icon className={`h-4 w-4 ${iconColor || (isFeatured ? 'text-[#C9A227]' : 'text-white/40')}`} />
        </div>
        <p className="text-xs text-white/40">{subtext}</p>
      </div>
    </div>
  )
}
