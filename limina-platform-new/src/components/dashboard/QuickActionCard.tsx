import React from 'react'
import Link from 'next/link'
import { ChevronRight, LucideIcon } from 'lucide-react'

interface QuickActionCardProps {
  href: string
  icon: LucideIcon
  title: string
  subtext: string
  highlighted?: boolean
}

export function QuickActionCard({ href, icon: Icon, title, subtext, highlighted = false }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/5 rounded-lg transition-colors"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${highlighted ? 'bg-[#C9A227]/10' : 'bg-white/5'}`}>
        <Icon className={`w-4 h-4 ${highlighted ? 'text-[#C9A227]' : 'text-white/60'}`} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-white/40">{subtext}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-white/30" />
    </Link>
  )
}
