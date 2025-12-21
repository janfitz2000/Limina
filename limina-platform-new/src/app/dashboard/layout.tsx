'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { useAuth, signOut } from '@/lib/auth'
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Settings,
  BarChart3,
  Store,
  User,
  LogOut,
  Package,
  ArrowLeft
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Stores', href: '/dashboard/stores', icon: Store },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isDemo) return
    if (!loading && (!user || user.role !== 'merchant')) {
      router.push('/auth')
    }
  }, [user, loading, router, isDemo])

  const handleSignOut = async () => {
    if (!confirm('Are you sure you want to sign out?')) {
      return
    }
    try {
      await signOut()
      window.location.href = '/auth'
    } catch (error) {
      console.error('Sign out failed:', error)
      window.location.href = '/auth'
    }
  }

  if (!isDemo && loading) {
    return (
      <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isDemo && (!user || user.role !== 'merchant')) {
    return null
  }

  const displayUser = isDemo ? { name: 'Demo Merchant', email: 'demo@limina.io' } : user
  const currentPage = navigation.find(item => item.href === pathname)?.name || 'Dashboard'

  return (
    <div className="min-h-screen bg-[#0C0A09] text-[#FAF9F6]">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 w-56 bg-[#161413] border-r border-white/5">
        <div className="flex h-16 items-center px-5 border-b border-white/5">
          <Logo />
          <span className="ml-2 text-lg font-bold tracking-tight">LIMINA</span>
        </div>

        <nav className="mt-4 px-3">
          <div className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const href = isDemo ? `${item.href}?demo=true` : item.href
              return (
                <Link
                  key={item.name}
                  href={href}
                  className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#C9A227] text-[#0C0A09]'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-[#0C0A09]' : 'text-white/40 group-hover:text-white/60'}`} />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {displayUser?.name || 'Guest'}
              </p>
              <p className="text-xs text-white/40 truncate">
                {isDemo ? 'Demo Mode' : 'Merchant'}
              </p>
            </div>
          </div>
          {isDemo ? (
            <Link
              href="/auth"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-[#C9A227] text-[#0C0A09] font-bold hover:bg-[#D4AF37] rounded-lg transition-colors"
            >
              Get started
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </Link>
          ) : (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="pl-56 relative z-10">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-[#0C0A09]/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight">{currentPage}</h1>
              </div>
              <div className="flex items-center gap-4">
                {isDemo && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] animate-pulse" />
                    <span className="text-xs text-[#C9A227] font-semibold">Demo</span>
                  </div>
                )}
                <Link
                  href="/"
                  className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

function DashboardFallback() {
  return (
    <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}
