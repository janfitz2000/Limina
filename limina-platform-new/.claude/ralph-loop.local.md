# Ralph Loop Configuration

prompt: |
  Implement the critical MVP gaps for Limina platform:

  1. **Price Monitoring Service** - Create an API route `/api/cron/price-check` that:
     - Fetches all buy_orders with status='monitoring' that haven't expired
     - For each order, fetches current price from the connected store (Shopify/WooCommerce)
     - Updates the current_price in buy_orders table
     - If current_price <= target_price, triggers auto-fulfillment

  2. **Auto-Fulfillment** - When price condition is met:
     - Call PaymentService.executeBuyOrderPayment() to capture the held payment
     - Update buy_order status to 'fulfilled'
     - Create notifications for customer and merchant

  3. **Stripe Elements in Widget** - Update `/widget` page to:
     - Add Stripe Elements for payment method collection
     - Call `/api/buy-orders/create` with the payment method ID
     - Show success/error states

  4. **Wire Email Notifications** - Connect the notifications table to actual email sending using the email lib

  Use Docker commands via ./cli.sh for all npm operations. Test your changes work.

  Output <promise>MVP GAPS IMPLEMENTED</promise> when all 4 items are complete and tested.

completion_promise: "MVP GAPS IMPLEMENTED"
max_iterations: 25
current_iteration: 1
started_at: 2026-01-04T00:00:00Z
status: active
