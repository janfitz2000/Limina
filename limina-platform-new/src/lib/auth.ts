// Real authentication using Supabase Auth
import { supabase } from './supabase-fixed'
import { Database } from '@/types/database'

export type User = {
  id: string
  email: string
  name: string
  role: 'merchant' | 'customer'
  merchant_id?: string
}

export type MerchantProfile = Database['public']['Tables']['merchants']['Row']

// Get current authenticated user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get merchant profile if user is a merchant
    const { data: merchant } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (merchant) {
      return {
        id: user.id,
        email: user.email!,
        name: merchant.name,
        role: 'merchant',
        merchant_id: merchant.id
      }
    }

    // Default to customer role if no merchant profile
    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email!,
      role: 'customer'
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Get full merchant profile
export const getMerchantProfile = async (): Promise<MerchantProfile | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (merchantError) {
      console.error('Error getting merchant profile:', merchantError)
      return null
    }

    return merchant
  } catch (error) {
    console.error('Error getting merchant profile:', error)
    return null
  }
}

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser()
  return user !== null
}

// Require authentication (throws if not authenticated)
export const requireAuth = async (): Promise<User> => {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

// Require merchant authentication
export const requireMerchantAuth = async (): Promise<{ user: User; merchant: MerchantProfile }> => {
  const user = await requireAuth()
  
  if (user.role !== 'merchant' || !user.merchant_id) {
    throw new Error('Merchant authentication required')
  }

  const merchant = await getMerchantProfile()
  if (!merchant) {
    throw new Error('Merchant profile not found')
  }

  return { user, merchant }
}

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
    
    // Clear any local storage or session data if needed
    if (typeof window !== 'undefined') {
      // Clear any cached data
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
    }
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

// Update merchant profile
export const updateMerchantProfile = async (updates: Partial<MerchantProfile>): Promise<MerchantProfile | null> => {
  try {
    const { user } = await requireMerchantAuth()
    
    const { data, error } = await supabase
      .from('merchants')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating merchant profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error updating merchant profile:', error)
    return null
  }
}

// Complete onboarding
export const completeOnboarding = async (): Promise<boolean> => {
  try {
    const updated = await updateMerchantProfile({ 
      onboarding_completed: true 
    })
    return updated !== null
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return false
  }
}

// React Hook for authentication
import { useState, useEffect } from 'react'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Get initial user
    getCurrentUser().then((user) => {
      if (mounted) {
        setUser(user)
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state change:', event, session?.user?.id)
        
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          try {
            const user = await getCurrentUser()
            setUser(user)
          } catch (error) {
            console.error('Error getting user after auth change:', error)
            setUser(null)
          }
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    loading,
    isMerchant: user?.role === 'merchant',
    isCustomer: user?.role === 'customer',
    signOut
  }
}