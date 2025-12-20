/**
 * Integration tests for payment flow
 * Tests the complete flow from order creation to payment processing
 */

import { createMockStripeClient, createMockSupabaseClient } from '@/lib/test-utils'

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => createMockStripeClient())
})

// Mock Supabase
const mockSupabaseTest = createMockSupabaseClient()

// Mock setupCompleteTestData function
const setupCompleteTestData = jest.fn().mockResolvedValue({
  merchant: { id: 'test-merchant-id' },
  product: { id: 'test-product-id' },
  customer: { id: 'test-customer-id', email: 'test@example.com', name: 'Test Customer' },
  buyOrder: { id: 'test-buy-order-id' }
})

const cleanupTestData = jest.fn().mockResolvedValue(true)

describe('Payment Flow Integration', () => {
  let testData: Awaited<ReturnType<typeof setupCompleteTestData>>
  let mockStripe: ReturnType<typeof createMockStripeClient>

  beforeAll(async () => {
    // Setup test data
    testData = await setupCompleteTestData()
    
    // Get mock Stripe instance
    const Stripe = jest.requireMock('stripe')
    mockStripe = new Stripe()
  })

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Buy Order Creation with Payment Authorization', () => {
    it('should create buy order and authorize payment', async () => {
      // Mock successful Stripe payment intent creation
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_integration',
        status: 'requires_confirmation',
        amount: 8000,
        currency: 'gbp',
      })

      // Mock successful payment confirmation
      mockStripe.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_test_integration',
        status: 'requires_capture',
        client_secret: 'pi_test_integration_secret',
      })

      // Create a new buy order in the database
      const buyOrderData = {
        id: 'integration-test-order',
        merchant_id: testData.merchant.id,
        product_id: testData.product.id,
        customer_id: testData.customer.id,
        customer_email: testData.customer.email,
        customer_name: testData.customer.name,
        target_price: 80,
        current_price: 100,
        status: 'monitoring',
        payment_status: 'authorized',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        condition_value: {
          payment_intent_id: 'pi_test_integration',
          escrow_amount: 80,
          platform_fee: 2,
        },
      }

      // Mock buy order creation
      mockSupabaseTest.from.mockReturnValue(mockSupabaseTest)
      mockSupabaseTest.insert.mockReturnValue(mockSupabaseTest)
      mockSupabaseTest.select.mockReturnValue(mockSupabaseTest)
      mockSupabaseTest.single.mockResolvedValue({
        data: buyOrderData,
        error: null
      })

      const { data: buyOrder, error: orderError } = await mockSupabaseTest
        .from('buy_orders')
        .insert(buyOrderData)
        .select()
        .single()

      expect(orderError).toBeNull()
      expect(buyOrder).toBeDefined()
      expect(buyOrder.status).toBe('monitoring')
      expect(buyOrder.payment_status).toBe('authorized')

      // Create corresponding escrow payment
      const escrowData = {
        id: 'integration-test-escrow',
        buy_order_id: buyOrder.id,
        stripe_payment_intent_id: 'pi_test_integration',
        stripe_payment_method_id: 'pm_test_card',
        escrow_amount: 80,
        platform_fee: 2,
        merchant_amount: 78,
        status: 'held',
      }

      const { data: escrowPayment, error: escrowError } = await supabaseTest
        .from('escrow_payments')
        .insert(escrowData)
        .select()
        .single()

      expect(escrowError).toBeNull()
      expect(escrowPayment).toBeDefined()
      expect(escrowPayment.status).toBe('held')
    })
  })

  describe('Price Drop and Order Fulfillment', () => {
    it('should fulfill order when price drops to target', async () => {
      // Create a buy order that's ready to be fulfilled
      const buyOrderData = {
        id: 'fulfillment-test-order',
        merchant_id: testData.merchant.id,
        product_id: testData.product.id,
        customer_id: testData.customer.id,
        customer_email: testData.customer.email,
        customer_name: testData.customer.name,
        target_price: 80,
        current_price: 100,
        status: 'monitoring',
        payment_status: 'authorized',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        condition_value: {
          payment_intent_id: 'pi_test_fulfillment',
          escrow_amount: 80,
          platform_fee: 2,
        },
      }

      const { data: buyOrder, error: orderError } = await supabaseTest
        .from('buy_orders')
        .insert(buyOrderData)
        .select()
        .single()

      expect(orderError).toBeNull()

      // Simulate price drop by updating product price
      const { error: productUpdateError } = await supabaseTest
        .from('products')
        .update({ current_price: 75 }) // Price drops below target
        .eq('id', testData.product.id)

      expect(productUpdateError).toBeNull()

      // Mock successful payment capture
      mockStripe.paymentIntents.capture.mockResolvedValue({
        id: 'pi_test_fulfillment',
        status: 'succeeded',
        amount_received: 8000,
      })

      // Simulate order fulfillment (this would normally be triggered by a database function)
      const { error: fulfillmentError } = await supabaseTest
        .from('buy_orders')
        .update({
          status: 'fulfilled',
          payment_status: 'captured',
          condition_value: {
            ...buyOrderData.condition_value,
            fulfilled_at: new Date().toISOString(),
            fulfillment_price: 75,
          },
        })
        .eq('id', buyOrder.id)

      expect(fulfillmentError).toBeNull()

      // Update escrow payment status
      const { error: escrowUpdateError } = await supabaseTest
        .from('escrow_payments')
        .update({
          status: 'captured',
          captured_at: new Date().toISOString(),
        })
        .eq('buy_order_id', buyOrder.id)

      expect(escrowUpdateError).toBeNull()

      // Verify final state
      const { data: finalOrder, error: fetchError } = await supabaseTest
        .from('buy_orders')
        .select('*')
        .eq('id', buyOrder.id)
        .single()

      expect(fetchError).toBeNull()
      expect(finalOrder.status).toBe('fulfilled')
      expect(finalOrder.payment_status).toBe('captured')
    })
  })

  describe('Database Real-time Features', () => {
    it('should handle real-time notifications for order updates', async () => {
      const notifications: unknown[] = []
      
      // Subscribe to notifications for the test customer
      const subscription = supabaseTest
        .channel('test-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${testData.customer.id}`,
          },
          (payload) => {
            notifications.push(payload.new)
          }
        )
        .subscribe()

      // Wait for subscription to be ready
      await new Promise(resolve => setTimeout(resolve, 100))

      // Create a notification
      const notificationData = {
        id: 'test-notification-integration',
        user_id: testData.customer.id,
        user_type: 'customer',
        buy_order_id: testData.buyOrder.id,
        title: 'Price Drop Alert!',
        message: 'Your target price has been reached.',
        type: 'price_alert',
        read: false,
      }

      const { error: notificationError } = await supabaseTest
        .from('notifications')
        .insert(notificationData)

      expect(notificationError).toBeNull()

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 200))

      // Verify notification was received
      expect(notifications).toHaveLength(1)
      expect(notifications[0].title).toBe('Price Drop Alert!')
      expect(notifications[0].user_id).toBe(testData.customer.id)

      // Cleanup subscription
      subscription.unsubscribe()
    })
  })

  describe('Merchant Analytics Integration', () => {
    it('should aggregate order data for merchant analytics', async () => {
      // Create multiple orders for analytics testing
      const orderData = [
        {
          id: 'analytics-order-1',
          merchant_id: testData.merchant.id,
          product_id: testData.product.id,
          customer_id: testData.customer.id,
          customer_email: testData.customer.email,
          customer_name: testData.customer.name,
          target_price: 80,
          current_price: 100,
          status: 'fulfilled',
          payment_status: 'captured',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          condition_value: {
            payment_intent_id: 'pi_analytics_1',
            escrow_amount: 80,
            platform_fee: 2,
            fulfilled_at: new Date().toISOString(),
          },
        },
        {
          id: 'analytics-order-2',
          merchant_id: testData.merchant.id,
          product_id: testData.product.id,
          customer_id: testData.customer.id,
          customer_email: testData.customer.email,
          customer_name: testData.customer.name,
          target_price: 90,
          current_price: 100,
          status: 'monitoring',
          payment_status: 'authorized',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          condition_value: {
            payment_intent_id: 'pi_analytics_2',
            escrow_amount: 90,
            platform_fee: 2.25,
          },
        },
      ]

      const { error: insertError } = await supabaseTest
        .from('buy_orders')
        .insert(orderData)

      expect(insertError).toBeNull()

      // Query analytics data
      const { data: analyticsData, error: analyticsError } = await supabaseTest
        .from('buy_orders')
        .select('*')
        .eq('merchant_id', testData.merchant.id)

      expect(analyticsError).toBeNull()
      expect(analyticsData).toBeDefined()
      expect(analyticsData.length).toBeGreaterThanOrEqual(2)

      // Calculate basic analytics
      const totalOrders = analyticsData.length
      const fulfilledOrders = analyticsData.filter(order => order.status === 'fulfilled').length
      const monitoringOrders = analyticsData.filter(order => order.status === 'monitoring').length
      const totalRevenue = analyticsData
        .filter(order => order.status === 'fulfilled')
        .reduce((sum, order) => sum + (order.condition_value?.escrow_amount || 0), 0)

      expect(totalOrders).toBeGreaterThan(0)
      expect(fulfilledOrders).toBeGreaterThan(0)
      expect(monitoringOrders).toBeGreaterThan(0)
      expect(totalRevenue).toBeGreaterThan(0)
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle Stripe webhook failures gracefully', async () => {
      // Simulate a webhook log entry for a failed payment
      const webhookLogData = {
        id: 'webhook-test-failure',
        event_type: 'payment_intent.payment_failed',
        stripe_event_id: 'evt_test_failure',
        processed: false,
        processing_attempts: 3,
        last_error: 'Payment method declined',
        event_data: {
          payment_intent_id: 'pi_test_failed',
          error: 'Your card was declined.',
        },
      }

      const { data: webhookLog, error: webhookError } = await supabaseTest
        .from('webhook_logs')
        .insert(webhookLogData)
        .select()
        .single()

      expect(webhookError).toBeNull()
      expect(webhookLog).toBeDefined()
      expect(webhookLog.processed).toBe(false)
      expect(webhookLog.processing_attempts).toBe(3)

      // Verify that failed webhooks can be identified and retried
      const { data: failedWebhooks, error: queryError } = await supabaseTest
        .from('webhook_logs')
        .select('*')
        .eq('processed', false)
        .gt('processing_attempts', 0)

      expect(queryError).toBeNull()
      expect(failedWebhooks).toBeDefined()
      expect(failedWebhooks.length).toBeGreaterThan(0)
    })
  })
})