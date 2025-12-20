
# Database Schema

This document outlines the database schema for the LIMINA project, which is managed using Supabase (PostgreSQL). The schema is defined across two main sources: the migrations in `limina-platform-new/supabase/migrations` and the `supabase-schema.sql` file in `limina-shopify-price-tracker`.

## Core Tables (`limina-platform-new`)

### `merchants`
Stores information about the merchants using the platform.

- `id` (uuid, primary key): Unique identifier for the merchant.
- `name` (text): The merchant's name.
- `email` (text, unique): The merchant's email address.
- `shopify_domain` (text, nullable): The merchant's Shopify store domain.
- `shopify_access_token` (text, nullable): The access token for the merchant's Shopify store.
- `created_at` (timestampz): Timestamp of when the merchant was created.
- `updated_at` (timestampz): Timestamp of the last update.

### `customers`
Stores information about the end customers making buy orders.

- `id` (uuid, primary key): Unique identifier for the customer.
- `email` (text, unique): The customer's email address.
- `name` (text, nullable): The customer's name.
- `created_at` (timestampz): Timestamp of when the customer was created.
- `updated_at` (timestampz): Timestamp of the last update.

### `products`
Stores the product catalog for each merchant.

- `id` (uuid, primary key): Unique identifier for the product.
- `merchant_id` (uuid, foreign key to `merchants.id`): The merchant who owns this product.
- `title` (text): The product title.
- `description` (text, nullable): The product description.
- `price` (numeric): The original or list price of the product.
- `current_price` (numeric): The current selling price of the product.
- `currency` (text): The currency code (e.g., `USD`, `GBP`).
- `image_url` (text, nullable): URL for the product image.
- `shopify_product_id` (text, nullable): The product's ID from Shopify.
- `created_at` (timestampz): Timestamp of when the product was created.
- `updated_at` (timestampz): Timestamp of the last update.

### `buy_orders`
This is the central table of the application, storing all conditional buy orders.

- `id` (uuid, primary key): Unique identifier for the buy order.
- `merchant_id` (uuid, foreign key to `merchants.id`): The merchant for this order.
- `product_id` (uuid, foreign key to `products.id`): The product being ordered.
- `customer_id` (uuid, foreign key to `customers.id`): The customer who placed the order.
- `customer_email` (text): The customer's email (denormalized for easy access).
- `target_price` (numeric): The price at which the customer has committed to buy.
- `status` (enum: `pending`, `monitoring`, `fulfilled`, `cancelled`, `expired`): The current status of the buy order.
- `condition_type` (enum: `price`, `inventory`, `date`): The type of condition for the order.
- `expires_at` (timestampz): The date and time when the buy order expires.
- `fulfilled_at` (timestampz, nullable): The date and time when the order was fulfilled.
- `created_at` (timestampz): Timestamp of when the order was created.
- `updated_at` (timestampz): Timestamp of the last update.

## Shopify Price Tracker Tables (`limina-shopify-price-tracker`)

### `shops`
Stores information about the Shopify stores that have installed the app.

- `id` (uuid, primary key): Unique identifier for the shop.
- `shop_domain` (text, unique): The shop's `.myshopify.com` domain.
- `access_token` (text): The Shopify API access token.
- `created_at` (timestampz): Timestamp of when the shop was installed.

### `price_alerts`
Stores the price alert subscriptions from customers.

- `id` (uuid, primary key): Unique identifier for the price alert.
- `product_id` (uuid, foreign key to `products.id`): The product for which the alert is set.
- `email` (text): The customer's email address.
- `target_price` (numeric): The price at which the customer wants to be notified.
- `status` (enum: `active`, `triggered`, `expired`): The status of the alert.
- `created_at` (timestampz): Timestamp of when the alert was created.
- `triggered_at` (timestampz, nullable): Timestamp of when the alert was triggered.

### `price_history`
Logs the price changes for products over time.

- `id` (uuid, primary key): Unique identifier for the price history entry.
- `product_id` (uuid, foreign key to `products.id`): The product whose price was changed.
- `price` (numeric): The new price of the product.
- `recorded_at` (timestampz): The timestamp when the price change was recorded.

## Schema Evolution & Next Steps

As we move towards a market-ready product, our database schema will need to evolve to support new features. Here are the anticipated changes:

### 1. Stripe Integration

We will need to add tables to store Stripe-related information.

- **`stripe_customers`**
    - `id` (uuid, primary key)
    - `customer_id` (uuid, foreign key to `customers.id`)
    - `stripe_customer_id` (text, unique): The customer ID from Stripe.

- **`stripe_payment_methods`**
    - `id` (uuid, primary key)
    - `stripe_customer_id` (text, foreign key to `stripe_customers.stripe_customer_id`)
    - `stripe_payment_method_id` (text, unique): The payment method ID from Stripe.
    - `is_default` (boolean): Whether this is the customer's default payment method.

### 2. WooCommerce Integration

To support WooCommerce, we will need to add fields to the `merchants` table:

- `woocommerce_store_url` (text, nullable)
- `woocommerce_consumer_key` (text, nullable)
- `woocommerce_consumer_secret` (text, nullable)

We will also need to add a `woocommerce_product_id` field to the `products` table.

### 3. B2B Features

For our B2B pilot, we will need to extend the `buy_orders` table to support more complex conditions:

- `condition_metadata` (jsonb, nullable): A flexible field to store additional condition data, such as MOQ requirements or group buy targets.

We may also need a new table to manage B2B-specific entities, such as companies and purchase orders.

### 4. Analytics

To power our enhanced analytics dashboards, we will create materialized views to pre-aggregate data for faster querying. For example:

- **`daily_demand_view`**: A view that aggregates the number of active buy orders per product per day at different price points.
- **`conversion_funnel_view`**: A view that tracks the customer journey from creating a price alert to a successful purchase.
