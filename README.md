# LIMINA

LIMINA is building a conditional buy order checkout service. The goal is to let customers and B2C buyers commit to a purchase that only executes when predefined conditions are met – such as a specific price threshold or inventory availability. This approach helps merchants secure future sales while giving customers confidence that they’ll only pay when their terms are satisfied.

## Planned Tech Stack

- **Next.js** – front end and application framework
- **Supabase** – database and authentication
- **Shopify** – e-commerce integration
- **Stripe** – payment processing
- **Redis** – for caching and real-time messaging

## Project Structure

- **`index.html`** - Beautiful static landing page with full design and animations
- **`limina-platform-new/`** - Modern Next.js application with dashboard and Supabase integration

## Development Setup

### For the Next.js Application (Recommended)

1. Navigate to the Next.js app:
   ```bash
   cd limina-platform-new
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Visit [http://localhost:3000](http://localhost:3000)

See `limina-platform-new/README.md` for detailed setup instructions including Supabase configuration.

### For the Static HTML (Quick Preview)

Simply open `index.html` in your browser to see the landing page design.
