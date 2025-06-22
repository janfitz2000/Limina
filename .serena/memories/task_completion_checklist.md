# Task Completion Checklist

## After Code Changes
1. **Run Linting**: `npm run lint` - Fix any ESLint errors
2. **Type Check**: TypeScript compilation happens during build, but manually verify with IDE
3. **Build Test**: `npm run build` - Ensure production build succeeds
4. **Local Testing**: `npm run dev` - Test changes in development mode

## Database Changes
1. **Migration Check**: Ensure Supabase migrations are applied
2. **RLS Verification**: Confirm Row Level Security policies are correct
3. **Type Generation**: Regenerate TypeScript types if schema changed

## Integration Testing
1. **API Routes**: Test API endpoints manually or with tools
2. **Webhook Testing**: Use ngrok for Shopify/Stripe webhook testing
3. **Payment Flow**: Test with Stripe test cards for payment functionality

## Before Deployment
1. **Environment Variables**: Verify all required env vars are set
2. **Production Build**: Confirm `npm run build` succeeds
3. **Database Migrations**: Apply any pending Supabase migrations
4. **Webhook Registration**: Ensure production webhook URLs are configured

## Quality Gates
- ✅ ESLint passes (`npm run lint`)
- ✅ TypeScript compilation succeeds
- ✅ Production build completes
- ✅ No console errors in development
- ✅ Database operations work correctly
- ✅ Payment flows function properly (if applicable)

## Notes
- No dedicated test suite currently configured
- Manual testing required for UI and integration flows
- Monitor Supabase logs for database issues
- Check Stripe dashboard for payment processing errors