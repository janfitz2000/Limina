# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start Next.js development server with turbopack
- `npm run build` - Build the application for production
- `npm run lint` - Run ESLint for code linting
- `npm start` - Start production server

### Local Development Setup
- `npm install --legacy-peer-deps` - Install dependencies (legacy flag needed for React 19 + lucide-react compatibility)
- `supabase start` - Start local Supabase services (requires Docker)
- `supabase db reset` - Reset database with fresh migrations and seed data
- `supabase stop` - Stop all Supabase services
- `npm run typecheck` - Run TypeScript type checking (if available)

## Production Architecture Overview

### Core Technologies
- **Next.js 15** with React 19 and TypeScript
- **Supabase** for database, auth, real-time features, and RLS
- **Stripe Connect** for payment processing and merchant payouts
- **Shopify/WooCommerce** integrations for product sync
- **Tailwind CSS** for styling with custom animations

### Key Architecture Patterns

#### Database Layer (`src/lib/database.ts`)
Centralized database operations with full TypeScript safety:
- **CRUD operations** for all entities
- **Real-time subscriptions** using Supabase channels
- **Analytics functions** with optimized queries
- **Automatic order fulfillment** via database triggers

#### Payment System (`src/lib/payments.ts`)
Stripe Connect integration with escrow functionality:
- **Payment authorization** on order creation
- **Escrow management** for conditional purchases
- **Automatic fulfillment** when conditions are met
- **Merchant onboarding** with Express accounts

#### Integration System (`src/lib/integrations/`)
Multi-platform e-commerce integration:
- **Shopify/WooCommerce** product sync
- **Real-time webhook handlers** for price updates
- **Inventory synchronization**
- **Order fulfillment coordination**

### Production Database Schema
Core tables with full RLS and indexing:
- `merchants` - Store info, Stripe accounts, webhook endpoints
- `customers` - Customer accounts with payment methods
- `products` - Catalog with price history and sync status
- `buy_orders` - Conditional orders with payment tracking
- `integrations` - Platform connections and sync logs
- `escrow_payments` - Payment authorization and fulfillment
- `merchant_discounts` - Targeted discount system for specific customers/orders
- `price_history` - Historical price tracking for analytics
- `notifications` - User notification system
- `webhook_logs` - Event processing audit trail

### Business Logic Flow
1. **Customer Order**: Customer creates buy order with payment authorization
2. **Price Monitoring**: System tracks product prices via integrations
3. **Auto-Fulfillment**: Database trigger captures payment when price drops
4. **Merchant Payout**: Stripe Connect transfers funds minus platform fee
5. **Real-time Updates**: All parties receive instant notifications

## Project Structure

### Dashboard Pages
- `/dashboard` - Merchant overview with analytics
- `/dashboard/orders` - Order management with fulfillment tools
- `/dashboard/products` - Product catalog with price controls
- `/dashboard/analytics` - Revenue and performance metrics
- `/dashboard/payments` - Stripe Connect and payout management
- `/dashboard/settings` - Integration and webhook configuration

### Customer Experience
- `/` - Landing page with order creation
- `/customer` - Personal dashboard with order tracking
- `/checkout-alternative` - Alternative checkout experience
- `/shopify-widget` - Embeddable widget for Shopify stores
- `/test-orders` - Order testing interface

### API Routes (`src/app/api/`)
- `buy-orders/` - Order lifecycle management
- `products/` - Product CRUD and price updates
- `merchants/` - Analytics and account management
- `merchant-discounts/` - Discount management for merchants
- `integrations/` - Platform sync operations
- `analytics/` - Merchant analytics and reporting
- `auth/` - Authentication and signup
- `stripe/` - Stripe Connect and payment processing
- `webhooks/` - Stripe and Shopify event handlers
- `shopify/` - Shopify-specific operations
- `test/` - Testing endpoints

### Integration Layer (`src/lib/integrations/`)
- `ShopifyIntegration` - Product sync, webhooks, price updates
- `WooCommerceIntegration` - Alternative platform support
- `IntegrationManager` - Unified sync and webhook processing

## Production Environment Setup

### Required Environment Variables
```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Stripe Connect
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Shopify Integration
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Database Migrations
Production includes comprehensive migrations:
- **20240101000000_initial_schema.sql** - Core tables and relationships
- **20240102000000_production_enhancements.sql** - RLS, indexes, functions
- **20240103000000_merchant_discounts.sql** - Merchant discount system

### Security Features
- **Row Level Security** on all tables
- **Webhook signature verification** for all platforms
- **Payment authorization** with escrow management
- **Audit trails** for all financial transactions

## Development Workflow

### Local Setup
1. Start Supabase: `supabase start`
2. Apply migrations: `supabase db reset`
3. Install deps: `npm install --legacy-peer-deps`
4. Start dev server: `npm run dev`
5. Access dashboards at http://localhost:3000

### Testing Production Features
- **Merchant Flow**: Connect Shopify store, import products, update prices
- **Customer Flow**: Create buy orders with payment authorization
- **Integration Testing**: Use webhook testing tools for Shopify/Stripe events
- **Payment Testing**: Use Stripe test cards for payment flow validation

### Webhook Testing
- **Shopify**: Use ngrok for local webhook testing
- **Stripe**: Use Stripe CLI for event forwarding
- **Integration Sync**: Test product imports and price updates

## Deployment Strategy

### Platform Recommendations
- **Vercel** (recommended) for Next.js deployment
- **Supabase Cloud** for production database
- **Stripe Connect** for payment processing

### Pre-deployment Checklist
1. Environment variables configured
2. Database migrations applied
3. Webhook endpoints registered
4. Stripe Connect onboarding flow tested
5. Integration credentials secured

### Monitoring and Maintenance
- Monitor webhook_logs table for integration issues
- Track payment failures in escrow_payments
- Use Supabase dashboard for database performance
- Set up Stripe webhook monitoring for payment events

This is a production-ready conditional buy order platform with full e-commerce integration, payment processing, and real-time order management.