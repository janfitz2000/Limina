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
  Bell,
  User,
  LogOut,
  Package
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
    // Skip auth check in demo mode
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
      // Force a complete page refresh to clear all state
      window.location.href = '/auth'
    } catch (error) {
      console.error('Sign out failed:', error)
      // Even if sign out fails, redirect to auth page
      alert('Sign out failed, but you will be redirected to the login page.')
      window.location.href = '/auth'
    }
  }

  // In demo mode, skip auth loading state
  if (!isDemo && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // In demo mode, allow access without auth
  if (!isDemo && (!user || user.role !== 'merchant')) {
    return null
  }

  // Demo user for display purposes
  const displayUser = isDemo ? { name: 'Demo Merchant', email: 'demo@limina.io' } : user

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-start px-6 border-b border-gray-200">
          <Logo />
          <h1 className="ml-2 text-xl font-bold text-blue-600">Limina</h1>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const href = isDemo ? `${item.href}?demo=true` : item.href
              return (
                <Link
                  key={item.name}
                  href={href}
                  className={`${
                    isActive
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 h-5 w-5`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {displayUser?.name || 'Guest'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {isDemo ? 'Demo Mode' : 'Merchant Account'}
              </p>
            </div>
          </div>
          {isDemo ? (
            <Link
              href="/auth"
              className="w-full flex items-center justify-center px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors font-medium"
            >
              Sign Up Free
            </Link>
          ) : (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign out
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Top navigation */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                </h2>
              </div>
              <div className="flex items-center space-x-4">
                <button className="relative p-2 text-gray-400 hover:text-gray-500">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 block h-2 w-2 bg-red-400 rounded-full"></span>
                </button>
                <Link 
                  href="/" 
                  className="text-sm text-gray-600 hover:text-blue-600"
                >
                  ← Back to Site
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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