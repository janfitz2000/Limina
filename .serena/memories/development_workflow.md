# Development Workflow

## Local Development Setup
1. **Navigate to main app**: `cd limina-platform-new`
2. **Install dependencies**: `npm install --legacy-peer-deps`
3. **Start Supabase**: `supabase start`
4. **Apply migrations**: `supabase db reset`
5. **Start dev server**: `npm run dev`
6. **Access application**: http://localhost:3000

## Environment Setup
- **Local**: `.env.local` with Supabase credentials
- **Production**: Vercel environment variables
- **Database**: Supabase with local development support
- **Payments**: Stripe test/live keys based on environment

## Development Modes

### Standard Next.js Development
- Hot reload with Turbopack enabled
- TypeScript compilation on-the-fly
- Tailwind CSS with JIT compilation
- Supabase real-time subscriptions

### Docker Development (WooCommerce)
- WordPress + WooCommerce + Limina plugin
- Complete local e-commerce environment
- Webhook testing capabilities
- Integration development and testing

## Key Development Patterns

### Database Operations
- Use centralized functions in `src/lib/database.ts`
- Leverage TypeScript types from Supabase
- Implement RLS policies for security
- Use real-time subscriptions for live updates

### API Development
- Follow Next.js App Router conventions
- Implement proper error handling
- Use TypeScript for request/response typing
- Validate webhook signatures

### Integration Development
- Abstract platform-specific logic
- Use unified interfaces for different e-commerce platforms
- Implement robust error handling and retry logic
- Test with actual platform webhooks

## Testing Strategy
- Manual testing in development environment
- Stripe test cards for payment flows
- Webhook testing with ngrok/Stripe CLI
- Integration testing with actual e-commerce platforms