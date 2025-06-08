// src/lib/auth.ts - Enhanced Authentication System
import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export type UserRole = 'merchant' | 'customer' | 'admin'

export interface LiminaUser extends User {
  role: UserRole
  profile: MerchantProfile | CustomerProfile
}

export interface MerchantProfile {
  id: string
  name: string
  email: string
  company_name: string
  website?: string
  shopify_domain?: string
  stripe_account_id?: string
  subscription_tier: 'starter' | 'professional' | 'enterprise'
  created_at: string
}

export interface CustomerProfile {
  id: string
  name: string
  email: string
  phone?: string
  preferences: {
    notifications: boolean
    email_alerts: boolean
    sms_alerts: boolean
  }
  created_at: string
}

// Enhanced authentication functions
export class AuthService {
  
  // Sign up as merchant
  static async signUpMerchant(data: {
    email: string
    password: string
    companyName: string
    name: string
    website?: string
  }) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'merchant',
            name: data.name,
            company_name: data.companyName
          }
        }
      })

      if (authError) throw authError

      // Create merchant profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('merchants')
          .insert({
            id: authData.user.id,
            name: data.name,
            email: data.email,
            company_name: data.companyName,
            website: data.website,
            subscription_tier: 'starter'
          })

        if (profileError) throw profileError
      }

      return { data: authData, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Sign up as customer
  static async signUpCustomer(data: {
    email: string
    password: string
    name: string
    phone?: string
  }) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'customer',
            name: data.name
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('customers')
          .insert({
            id: authData.user.id,
            email: data.email,
            name: data.name,
            phone: data.phone,
            preferences: {
              notifications: true,
              email_alerts: true,
              sms_alerts: false
            }
          })

        if (profileError) throw profileError
      }

      return { data: authData, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get current user with profile
  static async getCurrentUser(): Promise<{ user: LiminaUser | null, error: any }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) return { user: null, error }

      const role = user.user_metadata.role as UserRole
      let profile = null

      if (role === 'merchant') {
        const { data } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', user.id)
          .single()
        profile = data
      } else if (role === 'customer') {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('id', user.id)
          .single()
        profile = data
      }

      return {
        user: { ...user, role, profile } as LiminaUser,
        error: null
      }
    } catch (error) {
      return { user: null, error }
    }
  }

  // Role-based route protection
  static async requireRole(requiredRole: UserRole): Promise<boolean> {
    const { user } = await this.getCurrentUser()
    return user?.role === requiredRole
  }

  // Multi-tenant data access
  static async getMerchantProducts(merchantId: string) {
    const { user } = await this.getCurrentUser()
    
    // Only allow merchants to access their own products
    if (user?.role === 'merchant' && user.id !== merchantId) {
      throw new Error('Unauthorized: Cannot access other merchant data')
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId)

    return { data, error }
  }

  // Sign out
  static async signOut() {
    return await supabase.auth.signOut()
  }
}

// React Hook for authentication
import { useState, useEffect } from 'react'

export function useAuth() {
  const [user, setUser] = useState<LiminaUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    AuthService.getCurrentUser().then(({ user }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { user } = await AuthService.getCurrentUser()
          setUser(user)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    loading,
    isMerchant: user?.role === 'merchant',
    isCustomer: user?.role === 'customer',
    signUpMerchant: AuthService.signUpMerchant,
    signUpCustomer: AuthService.signUpCustomer,
    signOut: AuthService.signOut
  }
}

// Enhanced RLS policies (SQL)
/*
-- Enhanced Row Level Security

-- Merchants can only access their own data
CREATE POLICY "merchants_own_data" ON merchants
  FOR ALL USING (auth.uid()::text = id);

CREATE POLICY "merchants_own_products" ON products
  FOR ALL USING (auth.uid()::text = merchant_id);

CREATE POLICY "merchants_own_orders" ON buy_orders
  FOR ALL USING (auth.uid()::text = merchant_id);

-- Customers can only access their own data
CREATE POLICY "customers_own_data" ON customers
  FOR ALL USING (auth.uid()::text = id);

CREATE POLICY "customers_own_orders" ON buy_orders
  FOR ALL USING (auth.uid()::text = customer_id);

-- Admins can access everything (add admin role check)
CREATE POLICY "admin_full_access" ON merchants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Enable RLS on all tables
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
*/