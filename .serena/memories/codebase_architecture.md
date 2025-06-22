# Codebase Architecture

## Project Structure
```
limina-platform-new/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/          # Merchant dashboard pages
│   │   │   ├── orders/         # Order management
│   │   │   ├── products/       # Product catalog
│   │   │   └── settings/       # Integration settings
│   │   ├── api/                # Server-side API routes
│   │   │   ├── buy-orders/     # Order lifecycle management
│   │   │   ├── products/       # Product CRUD operations
│   │   │   ├── merchants/      # Merchant analytics
│   │   │   ├── webhooks/       # Stripe/Shopify webhooks
│   │   │   └── integrations/   # Platform sync operations
│   │   ├── customer/           # Customer dashboard
│   │   └── shopify-widget/     # Embeddable widget
│   ├── components/             # Reusable React components
│   ├── lib/                    # Business logic utilities
│   │   ├── integrations/       # E-commerce platform integrations
│   │   ├── database.ts         # Supabase operations
│   │   ├── payments.ts         # Stripe Connect integration
│   │   └── auth.ts             # Authentication logic
│   └── types/                  # TypeScript type definitions
└── supabase/                   # Database migrations
```

## Key Architecture Layers

### 1. Database Layer (`src/lib/database.ts`)
- Centralized Supabase operations with TypeScript safety
- CRUD operations for all entities (merchants, products, buy_orders)
- Real-time subscriptions using Supabase channels
- Analytics functions with optimized queries
- Automatic order fulfillment via database triggers

### 2. Payment System (`src/lib/payments.ts`)  
- Stripe Connect integration with escrow functionality
- Payment authorization on order creation
- Escrow management for conditional purchases
- Automatic fulfillment when conditions are met
- Merchant onboarding with Express accounts

### 3. Integration System (`src/lib/integrations/`)
- Multi-platform e-commerce integration (Shopify/WooCommerce)
- Real-time webhook handlers for price updates
- Inventory synchronization
- Order fulfillment coordination

### 4. API Layer (`src/app/api/`)
- RESTful endpoints for all business operations
- Webhook handlers for external platform events
- Authentication and authorization middleware
- Real-time notifications and updates

## Core Database Schema
- `merchants` - Store info, Stripe accounts, webhook endpoints
- `customers` - Customer accounts with payment methods  
- `products` - Catalog with price history and sync status
- `buy_orders` - Conditional orders with payment tracking
- `integrations` - Platform connections and sync logs
- `escrow_payments` - Payment authorization and fulfillment