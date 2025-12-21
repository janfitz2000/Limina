import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname, searchParams } = req.nextUrl
  const isDemo = searchParams.get('demo') === 'true'

  // Protect dashboard routes (skip auth check in demo mode)
  if (pathname.startsWith('/dashboard') && !isDemo) {
    if (!session) {
      // Redirect to auth if no session
      const redirectUrl = new URL('/auth', req.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user has merchant role
    try {
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (!merchant) {
        // User exists but is not a merchant
        const redirectUrl = new URL('/auth', req.url)
        redirectUrl.searchParams.set('error', 'merchant_required')
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Middleware auth check error:', error)
      return NextResponse.redirect(new URL('/auth', req.url))
    }
  }

  // Redirect authenticated users away from auth page (only if they have a merchant profile)
  if (pathname === '/auth' && session) {
    // Check if user has a merchant profile before redirecting
    try {
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (merchant) {
        // Only redirect to dashboard if they're a merchant
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      // If no merchant profile, let them stay on auth page to see sign out option
    } catch (error) {
      // If error checking, let them stay on auth page
      console.error('Middleware merchant check error:', error)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth'
  ]
}