import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Authentication required')

    // Get merchant record
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (merchantError || !merchant) throw new Error('Merchant profile not found')

    let accountId = merchant.stripe_account_id

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: merchant.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          merchant_id: merchant.id,
          limina_user_id: user.id
        }
      })

      accountId = account.id

      // Save account ID
      await supabase
        .from('merchants')
        .update({ stripe_account_id: accountId })
        .eq('id', merchant.id)
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      success: true,
      accountId,
      onboardingUrl: accountLink.url
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Stripe Connect error:', error)
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    )
  }
}
