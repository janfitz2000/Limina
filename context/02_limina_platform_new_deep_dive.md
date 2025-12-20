
# Deep Dive: `limina-platform-new`

## 1. Overview

`limina-platform-new` is the core application of the LIMINA project. It is a modern, full-stack application built with Next.js, TypeScript, and Supabase. It serves as the central hub for both merchants and customers to manage conditional buy orders.

## 2. Key Features & Functionality

- **Merchant Dashboard**: This is the primary interface for merchants. Here, they can:
    - View and manage all active and fulfilled buy orders.
    - Analyze demand for their products at different price points.
    - Create and manage their product catalog.
    - View analytics and statistics related to their sales and buy orders.

- **Customer Dashboard**: A planned feature where customers can:
    - View their active buy orders.
    - See the status of their conditional purchases.
    - Manage their account and payment information.

- **Landing Page**: A beautifully designed, animated landing page that serves as the main marketing and entry point for the platform. It includes interactive demos and detailed explanations of the service.

- **Real-time Updates**: The application uses Supabase's real-time capabilities to provide live updates on the status of buy orders and other key metrics.

## 3. Codebase & Project Structure

The project follows a standard Next.js `app` directory structure.

- **`src/app/`**: Contains the main pages and layouts of the application.
    - **`layout.tsx`**: The root layout, which sets up the global styles and fonts.
    - **`page.tsx`**: The main landing page component.
    - **`dashboard/`**: The merchant dashboard pages.

- **`src/lib/`**: Contains the core business logic and integrations.
    - **`database.ts`**: This is a critical file that defines the data models (TypeScript types) for `Merchant`, `Customer`, `Product`, and `BuyOrder`. It also provides a comprehensive set of functions for interacting with the Supabase database, including:
        - CRUD operations for all major data models.
        - Functions for fetching analytics and statistics.
        - Real-time subscription handlers.
    - **`supabase.ts`**: Configures and exports the Supabase client for both client-side (with authentication) and server-side (with admin privileges) use.

- **`src/components/`**: Contains reusable React components, such as the animated `Logo`.

- **`supabase/migrations/`**: Stores the SQL migration files that define the database schema. This allows for version-controlled and repeatable database setups.

- **`scripts/`**: Contains utility scripts, such as `seed-test-data.ts` for populating the database with realistic test data.

## 4. Authentication & Security

- **Authentication**: The platform uses Supabase Auth to manage user and merchant authentication. The `@supabase/auth-helpers-nextjs` library is used to streamline the process of handling user sessions and protecting routes.

- **Row Level Security (RLS)**: The database schema is designed with RLS in mind. This ensures that merchants can only access data that belongs to them, providing a secure, multi-tenant architecture.

## 5. Development Scripts

The `package.json` file defines a rich set of scripts for development and testing:

- **`dev`**: Starts the Next.js development server with Turbopack for faster performance.
- **`build`**: Creates a production-ready build of the application.
- **`test`**: Runs the Jest test suite.
- **`lint`**: Lints the codebase using ESLint to enforce code quality and style.
- **`seed:test`**: Executes the `seed-test-data.ts` script to populate the database.

## 6. Next Steps & Strategic Imperatives

To transition `limina-platform-new` from a powerful prototype to a market-ready product, we must focus on the following strategic imperatives.

### 1. Stripe Integration (Critical Priority)

- **Objective**: Securely and reliably process payments when a buy order's conditions are met. This is the most critical step to generating revenue.
- **Suggested Approach**:
    1.  **Use Stripe Connect**: This will allow us to process payments on behalf of our merchants, which is essential for a platform model.
    2.  **Implement a `StripeService`**: Create a dedicated service in `src/lib` to handle all Stripe-related operations, including creating payment intents, processing charges, and managing merchant accounts.
    3.  **Tokenize Payment Methods**: When a customer creates a buy order, we must securely save their payment method with Stripe and store the token in our database. This will allow us to charge them later without handling raw credit card data.
    4.  **Build a `PaymentOrchestrator`**: This service will be responsible for monitoring fulfilled buy orders and triggering the payment process through the `StripeService`.

### 2. Customer Dashboard & Onboarding

- **Objective**: Create a seamless experience for end-customers to manage their buy orders and build trust in the platform.
- **Suggested Approach**:
    1.  **Build the UI**: Create the necessary pages and components in `src/app/customer` for customers to view their active and past buy orders.
    2.  **Implement Authentication**: Allow customers to create accounts and log in to manage their orders.
    3.  **Develop a Secure "My Wallet" Section**: This is where customers can manage their saved payment methods (via Stripe).
    4.  **Create Onboarding Emails**: Use the Resend service to send welcome emails and notifications to customers.

### 3. WooCommerce Integration

- **Objective**: Expand our market reach by supporting the second-largest e-commerce platform.
- **Suggested Approach**:
    1.  **Create a `WooCommerceService`**: Similar to the Shopify integration, this service will handle all interactions with the WooCommerce API.
    2.  **Develop a WordPress Plugin**: This plugin will be responsible for connecting a merchant's WooCommerce store to the LIMINA platform and handling webhook events.
    3.  **Abstract the E-commerce Logic**: Refactor the existing Shopify-specific logic to use a more generic `ECommerceService` interface. This will make it easier to add more integrations in the future.

### 4. B2B Pilot Program

- **Objective**: Validate our B2B features with a small group of real-world businesses.
- **Suggested Approach**:
    1.  **Identify Pilot Partners**: Reach out to a handful of B2B companies that could benefit from conditional purchase orders.
    2.  **Focus on a Core B2B Feature**: Start with a simple conditional PO system before tackling more complex features like MOQ aggregation.
    3.  **Gather Feedback**: Work closely with our pilot partners to understand their needs and pain points, and use their feedback to guide our development.
