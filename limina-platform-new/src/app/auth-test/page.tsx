'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function AuthTestPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
        
        {user ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-md">
              <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Authenticated</h2>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Role:</strong> {user.role}</p>
                {user.merchant_id && <p><strong>Merchant ID:</strong> {user.merchant_id}</p>}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 p-4 rounded-md">
              <h2 className="text-lg font-semibold text-red-800 mb-2">❌ Not Authenticated</h2>
              <p className="text-sm text-red-700">You are not signed in.</p>
            </div>

            <button
              onClick={() => router.push('/auth')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Sign In
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Test Links</h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/auth')}
              className="block w-full text-left px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Auth Page
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="block w-full text-left px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Dashboard (Protected)
            </button>
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="block w-full text-left px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Settings (Protected)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}