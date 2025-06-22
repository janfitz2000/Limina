# Test Suite - Limina Price Tracker

This test suite provides comprehensive end-to-end testing of the entire Limina Price Tracker system, from database operations to API endpoints to full customer journeys.

## Test Philosophy

**Real Database Testing** - All tests use a real Supabase database (test environment) to ensure the entire pipeline works correctly. No mocked database operations.

**Full Pipeline Coverage** - Tests cover the complete flow from Shopify webhook → database update → price alert triggering → email notification logging.

**API Integration Testing** - API endpoints are tested with real HTTP requests and database persistence.

## Test Structure

### 📁 Test Organization

```
__tests__/
├── lib/
│   ├── database.test.ts          # Database layer tests
│   └── shopify-integration.test.ts # Shopify API integration tests
├── api/
│   ├── price-alerts.test.ts      # Price alert API endpoint tests
│   └── webhooks.test.ts          # Shopify webhook handler tests
├── e2e/
│   └── full-pipeline.test.ts     # Complete end-to-end scenarios
└── README.md                     # This file
```

### 🧪 Test Categories

#### 1. Database Layer Tests (`lib/database.test.ts`)
- **Shop Management**: Create, read, update shop records
- **Product Management**: Sync products, update prices, track history
- **Price Alert Lifecycle**: Create alerts, trigger alerts, manage status
- **Analytics Pipeline**: Log events, retrieve analytics, calculate stats
- **Email Logging**: Track sent emails for debugging

#### 2. Shopify Integration Tests (`lib/shopify-integration.test.ts`)
- **Product Sync**: Mock Shopify API, test product import to database
- **Webhook Processing**: Process product updates, trigger price alerts
- **API Error Handling**: Handle Shopify API failures gracefully
- **Webhook Creation**: Test webhook registration with Shopify

#### 3. API Endpoint Tests (`api/`)
- **Price Alert API**: Create alerts, validate input, retrieve alerts by email/product
- **Webhook API**: HMAC signature verification, product update processing
- **Error Handling**: Invalid requests, missing parameters, authentication

#### 4. End-to-End Pipeline Tests (`e2e/full-pipeline.test.ts`)
- **Complete Customer Journey**: From app installation to alert triggering
- **Multi-Customer Scenarios**: Multiple alerts, different price points
- **Merchant Analytics**: Full analytics pipeline verification
- **Error Recovery**: Database failures, malformed webhooks, edge cases

## Test Setup

### Prerequisites

1. **Test Supabase Project**: Create a separate Supabase project for testing
2. **Test Email Account**: Use a test Resend API key (or mock email service)
3. **Environment Variables**: Configure `.env.test` with test credentials

### Configuration

```bash
# Copy test environment template
cp .env.test.example .env.test

# Edit with your test credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key
RESEND_API_KEY=your_test_resend_key
```

### Database Schema

Tests require the same database schema as production. Run the schema from `supabase-schema.sql` in your test Supabase project.

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### End-to-End Tests Only
```bash
npm run test:e2e
```

### Specific Test File
```bash
npm test __tests__/lib/database.test.ts
```

## Test Data Management

### Automatic Cleanup
- Each test uses unique identifiers (UUIDs) to avoid conflicts
- `afterAll` hooks clean up test data in dependency order
- Tests are isolated and can run in parallel

### Test Data Strategy
- **Unique IDs**: Each test run uses `uuidv4()` for shop domains and IDs
- **Real Data Flow**: Data flows through the complete pipeline
- **Cleanup**: Comprehensive cleanup prevents test database bloat

## Expected Test Coverage

### Database Operations
- ✅ CRUD operations for all entities
- ✅ Foreign key relationships and constraints
- ✅ Automatic timestamps and triggers
- ✅ Row Level Security (RLS) policies
- ✅ Analytics aggregation functions

### API Endpoints
- ✅ Request validation and error handling
- ✅ Authentication and authorization
- ✅ Database persistence after API calls
- ✅ Proper HTTP status codes and responses

### Business Logic
- ✅ Price alert triggering logic
- ✅ Email notification pipeline
- ✅ Webhook signature verification
- ✅ Brand customization system
- ✅ Analytics event tracking

### Integration Points
- ✅ Shopify API integration (mocked)
- ✅ Supabase database operations (real)
- ✅ Email service integration (real/mocked)
- ✅ Webhook processing pipeline

## Debugging Tests

### Common Issues

1. **Database Connection Failures**
   ```bash
   # Check if test database is accessible
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```

2. **Schema Mismatches**
   ```bash
   # Ensure test database has latest schema
   # Run supabase-schema.sql in test project
   ```

3. **Environment Variables**
   ```bash
   # Verify test environment is loaded
   npm test -- --verbose
   ```

### Test Debugging
```bash
# Run single test with full output
npm test -- --testNamePattern="should create price alert" --verbose

# Run tests without cleanup to inspect data
# (modify afterAll hooks temporarily)
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_KEY }}
          RESEND_API_KEY: ${{ secrets.TEST_RESEND_KEY }}
```

## Test Data Examples

### Sample Test Flow
1. **Create Shop**: `e2e-test-a1b2c3d4.myshopify.com`
2. **Sync Products**: Import 2 products from mocked Shopify API
3. **Create Alerts**: 4 customers set different target prices
4. **Price Drop**: Webhook triggers price update to $149.99
5. **Verify Results**: 3 alerts triggered, analytics logged, emails queued
6. **Cleanup**: All test data removed automatically

### Performance Expectations
- **Single Test**: < 5 seconds
- **Full Suite**: < 60 seconds
- **Database Operations**: < 100ms per operation
- **API Calls**: < 500ms per request

## Contributing

When adding new features:

1. **Add Database Tests**: Test all new database operations
2. **Add API Tests**: Test new endpoints with real HTTP requests
3. **Update E2E Tests**: Include new features in end-to-end scenarios
4. **Document Test Cases**: Update this README with new test patterns

### Test Patterns

```typescript
// Database Test Pattern
test('should perform operation end-to-end', async () => {
  // 1. Setup test data
  const testId = uuidv4()
  
  // 2. Execute operation
  const result = await DatabaseService.operation(testId)
  
  // 3. Verify in database
  const verification = await DatabaseService.verify(testId)
  expect(verification).toBeDefined()
  
  // 4. Cleanup handled in afterAll
})

// API Test Pattern  
test('should handle API request correctly', async () => {
  // 1. Create mock request
  const { req } = createMocks({ method: 'POST', body: testData })
  
  // 2. Call API handler
  const response = await APIHandler(req)
  
  // 3. Verify response
  expect(response.status).toBe(200)
  
  // 4. Verify database persistence
  const dbResult = await DatabaseService.verify(testData.id)
  expect(dbResult).toBeDefined()
})
```

This test suite ensures the Limina Price Tracker works correctly in all scenarios, from simple API calls to complex multi-customer workflows.