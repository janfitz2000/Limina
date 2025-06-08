import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PaymentService } from '@/lib/payments'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('Webhook signature verification failed:', errMsg)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Use PaymentService to handle webhook events
    await PaymentService.handleStripeWebhook(event)

    console.log(`Stripe webhook processed: ${event.type}`)
    return NextResponse.json({ received: true })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Webhook processing failed'
    console.error('Stripe webhook error:', errMsg)
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    )
  }
}
