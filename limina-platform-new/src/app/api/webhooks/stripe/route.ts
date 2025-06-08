import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = await cookies().getAll()
    const signature = headersList.find(h => h.name === 'stripe-signature')?.value
    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('Webhook signature verification failed:', errMsg)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        if (paymentIntent.metadata.type === 'conditional_buy_order') {
          await supabase
            .from('buy_orders')
            .update({ payment_status: 'captured' })
            .eq('id', paymentIntent.metadata.buy_order_id)
        }
        break
      }
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        if (account.charges_enabled && account.payouts_enabled) {
          await supabase
            .from('merchants')
            .update({ stripe_onboarding_complete: true })
            .eq('stripe_account_id', account.id)
        }
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Webhook processing failed'
    console.error('Webhook error:', errMsg)
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    )
  }
}
