// src/lib/payments.ts - Stripe Connect Payment System
import Stripe from 'stripe'
import { supabase } from './supabase-fixed'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil'
}) : null

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  client_secret: string
  metadata: {
    buy_order_id: string
    merchant_id: string
    customer_id: string
  }
}

export interface EscrowPayment {
  buy_order_id: string
  stripe_payment_intent_id: string
  stripe_payment_method_id: string
  escrow_amount: number
  platform_fee: number
  merchant_amount: number
  status: 'held' | 'released' | 'refunded'
  held_at: string
  released_at?: string
  refunded_at?: string
}

export class PaymentService {
  
  // Create buy order with payment commitment
  static async createBuyOrderWithPayment(orderData: {
    merchantId: string
    productId: string
    customerId: string
    targetPrice: number
    paymentMethodId: string
    expiryDays: number
  }) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured')
      }
      // Calculate amounts
      const platformFeeRate = 0.025 // 2.5% platform fee
      const platformFee = Math.round(orderData.targetPrice * platformFeeRate * 100) // in cents
      const merchantAmount = Math.round(orderData.targetPrice * 100) - platformFee
      const totalAmount = Math.round(orderData.targetPrice * 100)

      // Get merchant's Stripe Connect account
      const { data: merchant } = await supabase
        .from('merchants')
        .select('stripe_account_id')
        .eq('id', orderData.merchantId)
        .single()

      if (!merchant?.stripe_account_id) {
        throw new Error('Merchant has not connected their Stripe account')
      }

      // Create payment intent with funds on hold
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: 'gbp',
        payment_method: orderData.paymentMethodId,
        confirmation_method: 'manual',
        capture_method: 'manual', // Hold funds without capturing
        application_fee_amount: platformFee,
        transfer_data: {
          destination: merchant.stripe_account_id,
        },
        metadata: {
          buy_order_id: 'temp', // Will be updated after buy order creation
          merchant_id: orderData.merchantId,
          customer_id: orderData.customerId,
          type: 'conditional_buy_order'
        }
      })

      // Confirm payment intent to authorize the payment
      const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id)

      if (confirmedIntent.status !== 'requires_capture') {
        throw new Error('Payment authorization failed')
      }

      // Create buy order in database
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + orderData.expiryDays)

      const { data: buyOrder, error: orderError } = await supabase
        .from('buy_orders')
        .insert({
          merchant_id: orderData.merchantId,
          product_id: orderData.productId,
          customer_id: orderData.customerId,
          target_price: orderData.targetPrice,
          current_price: orderData.targetPrice, // Will be updated by price monitoring
          status: 'monitoring',
          expires_at: expiresAt.toISOString(),
          condition_value: {
            payment_intent_id: confirmedIntent.id,
            escrow_amount: totalAmount,
            platform_fee: platformFee
          }
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Update payment intent metadata with buy order ID
      await stripe.paymentIntents.update(confirmedIntent.id, {
        metadata: {
          ...confirmedIntent.metadata,
          buy_order_id: buyOrder.id
        }
      })

      // Create escrow record
      await supabase
        .from('escrow_payments')
        .insert({
          buy_order_id: buyOrder.id,
          stripe_payment_intent_id: confirmedIntent.id,
          stripe_payment_method_id: orderData.paymentMethodId,
          escrow_amount: totalAmount / 100, // Convert back to currency units
          platform_fee: platformFee / 100,
          merchant_amount: merchantAmount / 100,
          status: 'held'
        })

      return {
        buyOrder,
        paymentIntent: confirmedIntent,
        error: null
      }
    } catch (error) {
      console.error('Payment creation error:', error)
      return { buyOrder: null, paymentIntent: null, error }
    }
  }

  // Execute payment when buy order conditions are met
  static async executeBuyOrderPayment(buyOrderId: string) {
    try {
      // Get buy order with payment details
      const { data: buyOrder } = await supabase
        .from('buy_orders')
        .select(`
          *,
          escrow_payments (*)
        `)
        .eq('id', buyOrderId)
        .single()

      if (!buyOrder || buyOrder.status !== 'monitoring') {
        throw new Error('Invalid buy order for payment execution')
      }

      const escrowPayment = buyOrder.escrow_payments[0]
      if (!escrowPayment || escrowPayment.status !== 'held') {
        throw new Error('No valid escrow payment found')
      }

      // Capture the payment intent (release funds)
      const capturedIntent = await stripe.paymentIntents.capture(
        escrowPayment.stripe_payment_intent_id
      )

      if (capturedIntent.status === 'succeeded') {
        // Update buy order status
        await supabase
          .from('buy_orders')
          .update({
            status: 'fulfilled',
            fulfilled_at: new Date().toISOString()
          })
          .eq('id', buyOrderId)

        // Update escrow payment status
        await supabase
          .from('escrow_payments')
          .update({
            status: 'released',
            released_at: new Date().toISOString()
          })
          .eq('buy_order_id', buyOrderId)

        // Create notifications
        await this.createPaymentNotifications(buyOrder, 'executed')

        return { success: true, paymentIntent: capturedIntent }
      }

      throw new Error('Payment capture failed')
    } catch (error) {
      console.error('Payment execution error:', error)
      return { success: false, error }
    }
  }

  // Refund payment for expired/cancelled orders
  static async refundBuyOrderPayment(buyOrderId: string, reason: 'expired' | 'cancelled') {
    try {
      const { data: buyOrder } = await supabase
        .from('buy_orders')
        .select(`
          *,
          escrow_payments (*)
        `)
        .eq('id', buyOrderId)
        .single()

      if (!buyOrder) throw new Error('Buy order not found')

      const escrowPayment = buyOrder.escrow_payments[0]
      if (!escrowPayment || escrowPayment.status !== 'held') {
        throw new Error('No valid escrow payment to refund')
      }

      // Cancel the payment intent (refund authorization)
      const cancelledIntent = await stripe.paymentIntents.cancel(
        escrowPayment.stripe_payment_intent_id
      )

      if (cancelledIntent.status === 'canceled') {
        // Update buy order status
        await supabase
          .from('buy_orders')
          .update({ status: reason })
          .eq('id', buyOrderId)

        // Update escrow payment status
        await supabase
          .from('escrow_payments')
          .update({
            status: 'refunded',
            refunded_at: new Date().toISOString()
          })
          .eq('buy_order_id', buyOrderId)

        // Create notifications
        await this.createPaymentNotifications(buyOrder, 'refunded')

        return { success: true, refund: cancelledIntent }
      }

      throw new Error('Payment cancellation failed')
    } catch (error) {
      console.error('Payment refund error:', error)
      return { success: false, error }
    }
  }

  // Setup Stripe Connect for merchants
  static async createMerchantConnectAccount(merchantId: string, email: string) {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          merchant_id: merchantId
        }
      })

      // Save account ID to merchant record
      await supabase
        .from('merchants')
        .update({ stripe_account_id: account.id })
        .eq('id', merchantId)

      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/refresh`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/success`,
        type: 'account_onboarding',
      })

      return { account, onboardingUrl: accountLink.url, error: null }
    } catch (error) {
      return { account: null, onboardingUrl: null, error }
    }
  }

  // Create payment notifications
  private static async createPaymentNotifications(buyOrder: { id: string; customer_id: string; merchant_id: string; target_price: number }, type: 'executed' | 'refunded') {
    const notifications = []

    if (type === 'executed') {
      // Customer notification
      notifications.push({
        user_id: buyOrder.customer_id,
        user_type: 'customer',
        buy_order_id: buyOrder.id,
        title: 'Order Fulfilled! 🎉',
        message: `Your buy order has been completed. Payment of £${buyOrder.target_price} has been processed.`,
        type: 'order_fulfilled'
      })

      // Merchant notification
      notifications.push({
        user_id: buyOrder.merchant_id,
        user_type: 'merchant',
        buy_order_id: buyOrder.id,
        title: 'Payment Received 💰',
        message: `Buy order payment of £${buyOrder.target_price} has been processed and will be transferred to your account.`,
        type: 'order_fulfilled'
      })
    } else if (type === 'refunded') {
      // Customer notification
      notifications.push({
        user_id: buyOrder.customer_id,
        user_type: 'customer',
        buy_order_id: buyOrder.id,
        title: 'Order Refunded',
        message: `Your buy order has been cancelled and the authorized payment has been released.`,
        type: 'order_cancelled'
      })
    }

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications)
    }
  }

  // Get payment analytics for merchants
  static async getMerchantPaymentAnalytics(merchantId: string) {
    try {
      const { data: payments } = await supabase
        .from('escrow_payments')
        .select(`
          *,
          buy_orders!inner(merchant_id, status, created_at)
        `)
        .eq('buy_orders.merchant_id', merchantId)

      const analytics = {
        totalEscrowAmount: 0,
        totalReleased: 0,
        totalRefunded: 0,
        averageOrderValue: 0,
        paymentsByStatus: {
          held: 0,
          released: 0,
          refunded: 0
        }
      }

      payments?.forEach(payment => {
        analytics.totalEscrowAmount += payment.escrow_amount
        analytics.paymentsByStatus[payment.status as keyof typeof analytics.paymentsByStatus]++

        if (payment.status === 'released') {
          analytics.totalReleased += payment.merchant_amount
        } else if (payment.status === 'refunded') {
          analytics.totalRefunded += payment.escrow_amount
        }
      })

      analytics.averageOrderValue = payments?.length 
        ? analytics.totalEscrowAmount / payments.length 
        : 0

      return { analytics, error: null }
    } catch (error) {
      return { analytics: null, error }
    }
  }
}

// Database schema additions needed:
/*
-- Add escrow payments table
CREATE TABLE escrow_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buy_order_id UUID NOT NULL REFERENCES buy_orders(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    stripe_payment_method_id TEXT NOT NULL,
    escrow_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    merchant_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
    held_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add Stripe account ID to merchants
ALTER TABLE merchants ADD COLUMN stripe_account_id TEXT UNIQUE;
ALTER TABLE merchants ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

-- Add payment-related fields to buy_orders if not already present
ALTER TABLE buy_orders ADD COLUMN payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'captured', 'refunded'));

-- Indexes
CREATE INDEX idx_escrow_payments_buy_order_id ON escrow_payments(buy_order_id);
CREATE INDEX idx_escrow_payments_status ON escrow_payments(status);
CREATE INDEX idx_escrow_payments_stripe_intent ON escrow_payments(stripe_payment_intent_id);
*/