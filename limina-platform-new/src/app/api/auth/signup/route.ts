// src/app/api/auth/signup/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { email, password, role, profile } = await req.json()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, ...profile }
      }
    })

    if (authError) throw authError

    if (authData.user) {
      // Create profile based on role
      if (role === 'merchant') {
        const { error: profileError } = await supabase
          .from('merchants')
          .insert({
            user_id: authData.user.id,
            name: profile.name,
            email: email,
            company_name: profile.companyName,
            website: profile.website,
            subscription_tier: 'starter',
            subscription_status: 'trial'
          })

        if (profileError) throw profileError
      } else if (role === 'customer') {
        const { error: profileError } = await supabase
          .from('customers')
          .insert({
            user_id: authData.user.id,
            email: email,
            name: profile.name,
            phone: profile.phone,
            preferences: {
              notifications: true,
              email_alerts: true,
              sms_alerts: false
            }
          })

        if (profileError) throw profileError
      }
    }

    return NextResponse.json({ 
      success: true, 
      user: authData.user,
      message: 'Account created successfully'
    })
  } catch (error) {
    // TypeScript: error is unknown, so check for message property
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 400 }
    )
  }
}