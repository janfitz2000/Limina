// src/app/api/auth/register/route.ts - Merchant Registration API
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-fixed'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      password, 
      name, 
      companyName, 
      websiteUrl, 
      phone, 
      country = 'GB' 
    } = body

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json({ 
        error: 'Email, password, and name are required' 
      }, { status: 400 })
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now, you can add email verification later
      user_metadata: {
        name,
        company_name: companyName,
        role: 'merchant'
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ 
          error: 'An account with this email already exists' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to create account' 
      }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ 
        error: 'Failed to create user account' 
      }, { status: 500 })
    }

    // Create merchant profile
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .insert({
        user_id: authData.user.id,
        name,
        email,
        company_name: companyName || null,
        website_url: websiteUrl || null,
        phone: phone || null,
        country,
        onboarding_completed: false,
        subscription_plan: 'free'
      })
      .select()
      .single()

    if (merchantError) {
      console.error('Merchant creation error:', merchantError)
      
      // Clean up auth user if merchant creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json({ 
        error: 'Failed to create merchant profile' 
      }, { status: 500 })
    }

    // Return success response with minimal user data
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
      },
      merchant: {
        id: merchant.id,
        name: merchant.name,
        onboarding_completed: merchant.onboarding_completed
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}