# 🚀 LIMINA Local Development Setup Guide

## Quick Start

Run these commands in your terminal:

```bash
# 1. Navigate to the project
cd limina-platform-new

# 2. Install Supabase CLI (if you haven't already)
npm install -g supabase

# 3. Install project dependencies
npm install --legacy-peer-deps

# 4. Initialize and start local Supabase
supabase init
supabase start

# 5. Set up environment variables (see step below)
cp .env.local.example .env.local
# Edit .env.local with the URLs from supabase start

# 6. Run database migrations and seed data
supabase db reset

# 7. Start the Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## 📋 Prerequisites

- **Docker Desktop** - Must be installed and running
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - For version control

## 🗄️ Database Setup

### Step 1: Install Supabase CLI

Choose one method:

```bash
# Option 1: NPM (Recommended)
npm install -g supabase

# Option 2: Homebrew (macOS)
brew install supabase/tap/supabase

# Option 3: Manual download from GitHub releases
```

### Step 2: Initialize Local Supabase

```bash
cd limina-platform-new
supabase init
```

This creates the `supabase/` folder with configuration files.

### Step 3: Start Local Services

```bash
supabase start
```

**Important**: Copy the output! You'll see something like:

```
Started supabase local development setup.

         API URL: http://localhost:54321
      GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token...
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Configure Environment Variables

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your local Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase_start_output
```

### Step 5: Run Database Setup

```bash
# This runs migrations and seeds the database with sample data
supabase db reset
```

## 🖥️ Application Setup

### Install Dependencies

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is needed because lucide-react doesn't officially support React 19 yet.

### Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎯 What You Get

### 📱 Landing Page (`/`)
- Beautiful design inspired by your original index.html
- Interactive hero section with buy order demo
- Animated logo and smooth scrolling
- Mobile-responsive design

### 🏪 Merchant Dashboard (`/dashboard`)
- **Real-time buy order management**
- **Live statistics and analytics**
- **Product price updates**
- **Order fulfillment controls**
- **Search and filter functionality**

Key features:
- View all customer buy orders
- Update product prices (triggers automatic order fulfillment)
- Monitor order probabilities and expiration dates
- Real-time updates when orders change

### 🛍️ Customer Dashboard (`/customer`)
- **Personal buy order tracking**
- **Product browsing and ordering**
- **Savings calculator**
- **Order history and status**

Key features:
- Browse products and create buy orders
- Track order progress with probability indicators
- View fulfilled orders and savings
- Cancel active orders

## 🗄️ Database Features

### Tables Created
- **merchants** - Store information
- **customers** - Customer accounts
- **products** - Product catalog with current prices
- **buy_orders** - Conditional purchase orders
- **price_history** - Track price changes over time
- **notifications** - User notifications

### Sample Data Included
- 3 merchants (TechStore, Fashion Forward, HomeGoods)
- 5 customers with realistic names
- 10 products with images and descriptions
- 8 buy orders in various states
- Price history showing trends
- Notifications for users

### Real-time Features
- **Automatic order fulfillment** when prices drop
- **Live updates** in dashboards
- **Price change tracking**
- **Notification system**

## 🔧 Key Functionality

### Price Monitoring
- Products have current_price that can be updated
- Price changes are tracked in price_history
- Orders automatically fulfill when target price is reached

### Order Management
- Orders have status: monitoring, fulfilled, cancelled, expired
- Probability calculation based on price history
- Expiration date tracking

### Real-time Updates
- Dashboard updates automatically when data changes
- WebSocket connections for live order status
- Instant notifications

## 🛠️ Development Commands

```bash
# Database commands
supabase status              # Check running services
supabase db reset           # Reset database with fresh seed data
supabase db diff            # Show database changes
supabase stop               # Stop all services

# Application commands
npm run dev                 # Start development server
npm run build              # Build for production
npm run lint               # Run ESLint

# Useful for development
supabase logs              # View service logs
```

## 🌐 Access Points

When everything is running:

- **Next.js App**: [http://localhost:3000](http://localhost:3000)
- **Supabase Studio**: [http://localhost:54323](http://localhost:54323) (Database GUI)
- **API**: [http://localhost:54321](http://localhost:54321)
- **Email Testing**: [http://localhost:54324](http://localhost:54324) (Inbucket)

## 🎮 Testing the App

### Test Merchant Dashboard
1. Go to [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
2. See active buy orders from customers
3. Click "Update Price" and lower a product price
4. Watch orders automatically fulfill when price conditions are met

### Test Customer Dashboard  
1. Go to [http://localhost:3000/customer](http://localhost:3000/customer)
2. Browse products and create a new buy order
3. Set a target price below current price
4. Go back to merchant dashboard and lower the price
5. Watch your order get fulfilled automatically!

### Test Real-time Updates
1. Open merchant dashboard in one browser tab
2. Open customer dashboard in another tab
3. Create an order in customer dashboard
4. See it appear in real-time in merchant dashboard

## 🔍 Database Management

### Supabase Studio
Visit [http://localhost:54323](http://localhost:54323) to:
- Browse tables and data
- Run SQL queries
- View real-time subscriptions
- Monitor API usage

### SQL Access
Connect directly to PostgreSQL:
```
Host: localhost
Port: 54322
Database: postgres
Username: postgres
Password: postgres
```

## 🎨 Customization

### Colors
Edit `tailwind.config.ts` to change the color scheme:
```typescript
colors: {
  primary: '#10344C',      // Main brand color
  accent: '#FACC15',       // Accent/gold color
  // Add your colors here
}
```

### Sample Data
Edit `supabase/seed_data.sql` to add your own:
- Products
- Customers  
- Merchants
- Buy orders

Then run `supabase db reset` to reload.

## 🚨 Troubleshooting

### Docker Issues
```bash
# Make sure Docker is running
docker --version

# Restart Docker Desktop if needed
# Then try: supabase start
```

### Port Conflicts
```bash
# If ports are in use, stop other services or change ports in config.toml
supabase stop
supabase start
```

### Database Issues
```bash
# Reset everything
supabase db reset

# Check logs
supabase logs db
```

### React/Dependencies Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 🚀 Production Deployment

When ready to deploy:

1. **Create hosted Supabase project**
2. **Update environment variables** to use hosted URLs
3. **Run migrations** on hosted database
4. **Deploy to Vercel** or your preferred platform

## 📞 Need Help?

- Check the [Supabase docs](https://supabase.com/docs)
- Look at the [Next.js docs](https://nextjs.org/docs)
- Review the database schema in `supabase/migrations/`

Your LIMINA platform is now ready for development! 🎉
