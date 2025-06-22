'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-fixed'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('GB')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for error messages from redirects
    const errorParam = searchParams.get('error')
    if (errorParam === 'merchant_required') {
      setError('Access denied. This application is for merchants only.')
    }

    // Check if user is already signed in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const redirectTo = searchParams.get('redirectTo') || '/dashboard'
        router.push(redirectTo)
      }
    }
    checkUser()
  }, [searchParams, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        const redirectTo = searchParams.get('redirectTo') || '/dashboard'
        router.push(redirectTo)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Sign in error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Call our registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          companyName,
          websiteUrl,
          phone,
          country,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Registration failed')
        return
      }

      // Sign in the user after successful registration
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError('Registration successful, but sign-in failed. Please try signing in.')
        return
      }

      if (data.user) {
        const redirectTo = searchParams.get('redirectTo') || '/dashboard?onboarding=true'
        router.push(redirectTo)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Sign up error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSignIn ? 'Welcome Back' : 'Join Limina'}
          </h1>
          <p className="text-gray-600">
            {isSignIn 
              ? 'Sign in to your merchant account' 
              : 'Create your merchant account to start connecting stores'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={isSignIn ? handleSignIn : handleSignUp} className="space-y-6">
          {!isSignIn && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isSignIn}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Company Ltd"
                />
              </div>

              <div>
                <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourstore.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+44 123 456 7890"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GB">United Kingdom</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading 
              ? (isSignIn ? 'Signing In...' : 'Creating Account...') 
              : (isSignIn ? 'Sign In' : 'Create Account')
            }
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignIn(!isSignIn)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            {isSignIn 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'
            }
          </button>
        </div>

        {!isSignIn && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>After creating your account:</strong>
              <br />
              • Connect your Shopify or WooCommerce stores
              <br />
              • Set up payment processing with Stripe
              <br />
              • Start accepting conditional buy orders
            </p>
          </div>
        )}
      </div>
    </div>
  )
}