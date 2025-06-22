# LIMINA Project Overview

## Purpose
LIMINA is building a conditional buy order checkout service that allows customers to commit to purchases that only execute when predefined conditions are met (like price thresholds or inventory availability). This helps merchants secure future sales while giving customers confidence they'll only pay when their terms are satisfied.

## Core Business Model
- **Conditional Buy Orders**: Customers create orders that only execute when conditions are met
- **Escrow Payments**: Payment authorization on order creation, capture when conditions fulfilled
- **Multi-platform Integration**: Shopify, WooCommerce support for product/price sync
- **Merchant Dashboard**: Complete order management and analytics platform

## Tech Stack
- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with TypeScript
- **Database**: Supabase with Row Level Security (RLS) 
- **Payments**: Stripe Connect for merchant payouts and escrow
- **Integrations**: Shopify and WooCommerce APIs
- **Real-time**: Supabase real-time subscriptions
- **Styling**: Tailwind CSS with custom animations

## Key Features
- Beautiful landing page with interactive demos
- Merchant dashboard with real-time analytics
- Customer order tracking interface
- Multi-platform e-commerce integration
- Payment authorization and escrow system
- Real-time price monitoring and auto-fulfillment