
# Deep Dive: `limina-shopify-price-tracker`

## 1. Overview

`limina-shopify-price-tracker` is a specialized Shopify application that demonstrates a core use case of the LIMINA platform: price-based conditional purchasing. It allows customers of a Shopify store to subscribe to price alerts for products, and it automatically notifies them via email when the product's price drops to their desired level.

## 2. Key Features & Functionality

- **Shopify Product Sync**: The app can sync a merchant's entire product catalog from their Shopify store into the LIMINA database.

- **Price Monitoring**: It uses Shopify webhooks to receive real-time updates whenever a product's price is changed in the Shopify admin.

- **Email Alerts**: When a price drop triggers a customer's alert, the app sends a branded, responsive email notification using the Resend email service.

- **Customer Widget (Planned)**: The roadmap includes an embeddable JavaScript widget that merchants can place on their product pages to allow customers to easily set up price alerts.

- **Merchant Analytics**: A simple dashboard provides merchants with insights into how many price alerts are active and how many have been triggered.

## 3. Codebase & Project Structure

The application is built with Next.js and is structured to function as a Shopify app.

- **`app/`**: Contains the Next.js pages and API routes.
    - **`api/`**: This is where the backend logic resides.
        - **`price-alerts/`**: API endpoints for creating and managing price alerts.
        - **`sync-products/`**: The endpoint that triggers the synchronization of products from Shopify.
        - **`webhooks/`**: The endpoint that receives and processes webhooks from Shopify.
    - **`page.tsx`**: The main landing page for the app.

- **`lib/`**: Contains the core business logic.
    - **`shopify-integration.ts`**: A crucial file that contains the `ShopifyPriceTracker` class. This class encapsulates all the logic for interacting with the Shopify API, including:
        - Fetching products.
        - Creating and managing webhooks.
        - Handling product update events.
    - **`email-service.ts`**: The `EmailService` class, which handles the sending of all email notifications. It includes templates for price drop alerts, welcome emails, and alert confirmations.
    - **`database.ts`**: Contains functions for interacting with the Supabase database, specific to the price tracker's needs.

- **`shopify.app.toml`**: The official configuration file for the Shopify app. It defines the app's name, scopes, and other settings required by Shopify.

- **`supabase-schema.sql`**: The complete SQL schema for the tables used by this application, including `shops`, `products`, `price_alerts`, and `price_history`.

## 4. Workflow: From Price Change to Email Alert

1.  **Merchant updates a product's price** in their Shopify admin.
2.  **Shopify sends a `products/update` webhook** to the `/api/webhooks/shopify` endpoint in the LIMINA app.
3.  The **`handleProductUpdate`** function in `lib/shopify-integration.ts` is triggered.
4.  The function **updates the `current_price`** of the product in the `products` table in the Supabase database.
5.  It then calls the **`checkPriceAlerts`** function.
6.  `checkPriceAlerts` queries the `price_alerts` table to find any active alerts where the `target_price` is now met or exceeded by the new `current_price`.
7.  For each triggered alert, the **`triggerPriceAlert`** function is called.
8.  `triggerPriceAlert` updates the alert's status to `triggered` and calls the **`EmailService.sendPriceAlert`** method.
9.  The **`EmailService`** sends a formatted HTML email to the customer using the Resend API.

## 5. Next Steps & Strategic Imperatives

This application is our entry point into the market. Its success is paramount. The following steps are designed to make it a polished, valuable, and marketable product.

### 1. Customer-Facing Widget (Top Priority)

- **Objective**: Create a simple, attractive, and easy-to-install widget that merchants can embed on their product pages.
- **Suggested Approach**:
    1.  **Develop a Preact/Svelte Component**: Build the widget using a lightweight library like Preact or Svelte to keep the bundle size minimal and avoid impacting store performance.
    2.  **Create a Simple Embed Script**: The merchant should only need to copy and paste a single `<script>` tag into their theme.
    3.  **Design a User-Friendly UI**: The widget should have a clean, intuitive interface for customers to enter their target price and email address.
    4.  **Implement Smart Product Detection**: The widget should automatically detect the Shopify product ID from the page it's embedded on.

### 2. Shopify App Store Submission

- **Objective**: Get the app listed on the Shopify App Store to drive organic installs.
- **Suggested Approach**:
    1.  **Fulfill all Shopify Requirements**: Carefully review and adhere to all of Shopify's guidelines for app submission, including security, performance, and user experience.
    2.  **Create a Compelling App Listing**: Write clear, persuasive copy and create high-quality screenshots and videos to showcase the app's value.
    3.  **Implement Shopify Billing API**: To charge for the app (even if it's a freemium model), we must use the Shopify Billing API.
    4.  **Develop a Merchant Onboarding Flow**: Create a simple, guided setup process for new merchants who install the app.

### 3. Enhanced Merchant Analytics

- **Objective**: Provide merchants with actionable insights that demonstrate the app's value.
- **Suggested Approach**:
    1.  **Build a "Demand Curve" Chart**: Visualize the number of active price alerts at different price points for a given product. This is a powerful tool for merchants.
    2.  **Track Conversion Rates**: Measure the percentage of triggered alerts that result in a purchase. This will require some creative tracking, perhaps by using unique discount codes or referral links in the alert emails.
    3.  **Create a "Top Alerts" Dashboard**: Show merchants which of their products are generating the most price alerts.

### 4. Freemium Monetization Strategy

- **Objective**: Establish a pricing model that encourages adoption while creating a path to revenue.
- **Suggested Approach**:
    1.  **Free Tier**: Offer a generous free plan that includes a limited number of active price alerts (e.g., 100 per month). This will allow merchants to experience the app's value at no cost.
    2.  **Paid Tiers**: Create paid plans that offer a higher number of alerts, advanced analytics, and premium support.
    3.  **Implement a Billing System**: Use the Shopify Billing API to manage subscriptions and charge merchants.
