
# Project Overview: LIMINA

## 1. High-Level Summary

LIMINA is a **conditional buy order checkout service** designed to revolutionize e-commerce for both retail (B2C) and business-to-business (B2B) transactions. The core concept is to allow a customer or business to commit to a purchase that only executes when a specific, predefined condition is met.

This approach addresses common e-commerce challenges:
- **Price Sensitivity**: Captures sales from customers who are waiting for a price drop.
- **Cart Abandonment**: Converts hesitant browsers into committed future buyers.
- **B2B Procurement**: Streamlines complex procurement processes with conditional purchase orders.
- **Demand Intelligence**: Provides merchants with real-time data on customer demand at various price points.

The project is architected as a **Dockerized monorepo** containing two primary Next.js applications and a suite of shared services.

## 2. Core Applications

The LIMINA ecosystem is composed of two main applications:

### a. `limina-platform-new`
- **Purpose**: The central platform for managing conditional buy orders.
- **Features**:
    - **Merchant Dashboard**: A comprehensive interface for merchants to create, monitor, and analyze buy orders.
    - **Customer Dashboard**: A portal for customers to track their active buy orders.
    - **Landing Page**: A visually rich, animated landing page that serves as the project's main entry point.
    - **Supabase Integration**: Deep integration with Supabase for database operations, authentication, and real-time updates.
- **Technology**: Next.js, React, TypeScript, Tailwind CSS, Supabase.

### b. `limina-shopify-price-tracker`
- **Purpose**: A dedicated Shopify application that serves as a practical implementation of the conditional buy concept.
- **Features**:
    - **Price Alerts**: Allows customers to set a target price for a product and receive an email notification when the price drops.
    - **Shopify Integration**: Seamlessly syncs with a merchant's Shopify store to import products and track price changes via webhooks.
    - **Email Service**: Utilizes Resend for sending branded, responsive email notifications.
- **Technology**: Next.js, React, TypeScript, Shopify API, Resend, Supabase.

## 3. Technical Architecture

The entire development environment is containerized using **Docker and Docker Compose**, ensuring a consistent and reproducible setup.

### Key Services:
- **PostgreSQL**: The primary database, managed by Supabase.
- **Supabase**: Provides a suite of backend services, including:
    - **API Gateway**: A unified endpoint for interacting with the database.
    - **Authentication**: Manages user and merchant accounts.
    - **Real-time Subscriptions**: Pushes live data updates to the frontends.
- **Redis**: Used for caching and session storage.
- **MailHog**: An email testing tool for capturing and viewing emails sent during development.

This microservices architecture allows for independent development, scaling, and deployment of each component.

## 4. Development Workflow

The development process is streamlined through a set of shell scripts:
- **`dev.sh`**: The main script for starting, stopping, and managing the Dockerized environment.
- **`cli.sh`**: A utility for executing commands (e.g., `npm install`, `jest`) directly within the running Docker containers, eliminating the need for local Node.js or dependency installations.

This setup promotes a "Docker-only" development philosophy, where all necessary tools and dependencies are encapsulated within containers.

## 5. Go-to-Market Strategy & Roadmap

Our primary objective is to achieve a successful market launch by focusing on a core, high-value use case and then expanding. Our initial target market is **Shopify merchants**, as they are numerous, accessible, and often early adopters of new technologies.

### Phase 1: Minimum Viable Product (MVP) - The Shopify Price Alert App (Target: 1-2 Months)

The `limina-shopify-price-tracker` is our spearhead. It's a simple, yet powerful, demonstration of our core value proposition.

- **Goal**: Launch a polished, fully functional price alert app on the Shopify App Store.
- **Key Success Metrics**:
    - Number of installs.
    - Number of active price alerts.
    - Merchant satisfaction (reviews).
- **Actionable Steps**:
    1.  **Develop a Customer-Facing Widget**: This is the #1 priority. It must be easy for merchants to embed on their product pages.
    2.  **Refine the Merchant Dashboard**: Provide clear, actionable analytics.
    3.  **Submit to Shopify App Store**: This involves creating a compelling app listing, and ensuring the app meets all of Shopify's requirements.
    4.  **Marketing**: Prepare a simple marketing site and start reaching out to Shopify-focused blogs and influencers.

### Phase 2: The Core Platform - `limina-platform-new` (Target: 3-6 Months)

Once we have a foothold in the Shopify ecosystem, we will introduce the full power of the LIMINA platform.

- **Goal**: Onboard our initial Shopify merchants onto the main platform, offering them a significant upgrade in functionality.
- **Key Success Metrics**:
    - Conversion rate from the price alert app to the full platform.
    - Number of "true" conditional buy orders created.
    - Successful payment processing via Stripe.
- **Actionable Steps**:
    1.  **Stripe Integration**: This is critical. We need to be able to securely process payments when buy order conditions are met.
    2.  **Build the Customer Dashboard**: A portal for end-customers to manage their buy orders.
    3.  **WooCommerce Integration**: Develop a parallel integration for WooCommerce to expand our market reach.
    4.  **B2B Pilot Program**: Identify a small group of B2B merchants to pilot our conditional purchase order features.

### Phase 3: Expansion & B2B Focus (Target: 6-12 Months)

With a solid foundation in the B2C space, we will aggressively expand our B2B offerings.

- **Goal**: Become the go-to solution for conditional B2B e-commerce.
- **Key Success Metrics**:
    - Number of B2B merchants onboarded.
    - Total value of B2B transactions processed.
    - Successful implementation of advanced B2B features.
- **Actionable Steps**:
    1.  **Full B2B Feature Set**: Implement Minimum Order Quantity (MOQ) aggregation, group buys, and tiered pricing.
    2.  **API-first Approach**: Develop a robust public API to allow for custom integrations.
    3.  **Expand to Other Platforms**: Target BigCommerce, Magento, and other enterprise-level e-commerce platforms.
    4.  **Advanced Analytics**: Introduce predictive analytics and demand forecasting tools for merchants.
