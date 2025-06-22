# Limina Price Tracker - Shopify App

A Shopify app that enables customers to set price alerts via email for products they're interested in purchasing. When prices drop to their target price, customers receive email notifications.

## 🚀 Features

- **Product Sync**: Automatically sync products from Shopify stores
- **Price Monitoring**: Real-time price tracking via webhooks
- **Email Alerts**: Beautiful email notifications when target prices are reached
- **Merchant Dashboard**: Simple interface for merchants to view analytics
- **Customer Widget**: Easy-to-embed price alert widget for product pages

## 🏗️ Architecture

- **Next.js 15** - App framework with API routes
- **Supabase** - Database and real-time subscriptions
- **Resend** - Email delivery service
- **Shopify API** - Product sync and webhooks
- **TypeScript** - Type safety throughout

## 📁 Project Structure

```
limina-shopify-price-tracker/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── price-alerts/  # Price alert management
│   │   ├── sync-products/ # Product synchronization
│   │   └── webhooks/      # Shopify webhook handlers
│   ├── page.tsx           # Main dashboard
│   └── layout.tsx         # App layout
├── lib/                   # Core business logic
│   ├── shopify-integration.ts  # Shopify API wrapper
│   ├── email-service.ts        # Email sending service
│   └── database.ts             # Database operations
├── shopify.app.toml       # Shopify app configuration
├── supabase-schema.sql    # Database schema
└── package.json           # Dependencies
```

## 🔧 Setup Instructions

### 1. Prerequisites

- Node.js 18+
- Shopify Partner account
- Supabase account
- Resend account

### 2. Clone and Install

```bash
cd limina-shopify-price-tracker
npm install
```

### 3. Environment Configuration

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:
- `SHOPIFY_API_KEY` - From your Shopify Partner dashboard
- `SHOPIFY_API_SECRET` - From your Shopify Partner dashboard
- `SHOPIFY_WEBHOOK_SECRET` - Generate a secure random string
- `NEXT_PUBLIC_SUPABASE_URL` - From your Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` - From your Supabase project
- `RESEND_API_KEY` - From your Resend account

### 4. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Verify all tables and policies are created

### 5. Shopify App Setup

1. Create a new app in your Shopify Partner dashboard
2. Set the app URL to your domain (e.g., `https://your-app.com`)
3. Configure the allowed redirection URLs
4. Set the required scopes: `read_products,write_products,read_orders,read_customers,write_customers`

### 6. Development

```bash
npm run dev
```

Your app will be available at `http://localhost:3000`

## 🔗 Integration Guide

### For Merchants

1. **Install the App**: Install from the Shopify App Store
2. **Sync Products**: Click "Sync Products" to import your catalog
3. **Monitor Dashboard**: View price alerts and analytics
4. **Webhook Setup**: App automatically configures webhooks for price updates

### For Customers

Customers can set price alerts directly on product pages using the embedded widget:

```javascript
// Example widget integration
<script src="https://your-app.com/widget.js"></script>
<div id="limina-price-alert" data-product-id="123"></div>
```

## 📊 Database Schema

### Core Tables

- **shops** - Shopify shop credentials and settings
- **products** - Product catalog synced from Shopify
- **price_alerts** - Customer email subscriptions
- **price_history** - Historical price tracking
- **email_logs** - Email delivery audit trail
- **app_analytics** - Usage analytics

## 🔄 API Endpoints

### Price Alerts

- `POST /api/price-alerts` - Create new price alert
- `GET /api/price-alerts?email=user@example.com` - Get alerts by email
- `GET /api/price-alerts?productId=123` - Get alerts for product

### Product Management

- `POST /api/sync-products` - Sync products from Shopify
- `POST /api/webhooks/shopify` - Handle Shopify webhooks

## 📧 Email Templates

The app includes responsive email templates for:

- **Price Drop Alerts** - Notifies when target price is reached
- **Welcome Emails** - Sent to first-time users
- **Confirmation Emails** - Confirms price alert setup

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm start
```

## 📈 Analytics & Monitoring

The app tracks:
- Products synced
- Price alerts created
- Emails sent successfully
- Alert trigger rates
- Customer engagement metrics

## 🔒 Security Features

- **Webhook Verification** - HMAC signature validation
- **Row Level Security** - Database access controls
- **Input Validation** - All API endpoints validated
- **Rate Limiting** - Prevents abuse of email alerts

## 🛠️ Development Tools

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
```

## 📝 Next Steps

1. **App Store Submission** - Submit to Shopify App Store
2. **Customer Widget** - Create embeddable JavaScript widget
3. **Advanced Analytics** - Add more detailed reporting
4. **SMS Alerts** - Add SMS notification option
5. **Price Prediction** - ML-based price forecasting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, email support@limina.app or create an issue in this repository.