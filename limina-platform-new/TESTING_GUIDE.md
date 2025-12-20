# Limina Platform Testing Guide

This document provides a comprehensive guide to the testing infrastructure set up for the Limina Platform.

## 🎯 Quick Start

### Pre-Session Health Check
```bash
# Run comprehensive health check before each development session
./health-check.sh

# Quick health check (containers + API only)
./health-check.sh quick
```

### Running Tests
```bash
# Docker environment (recommended)
./cli.sh platform test                    # Run all tests
./cli.sh platform test:coverage           # Run tests with coverage
./cli.sh platform test:watch             # Watch mode for development
./cli.sh platform typecheck              # TypeScript type checking
./cli.sh platform lint                   # Code linting

# Test pipeline (comprehensive)
./test-pipeline.sh                        # Full pipeline
./test-pipeline.sh quick                  # Quick pre-commit checks
./test-pipeline.sh ci                     # CI/CD pipeline with coverage
```

## 📁 Testing Infrastructure

### Core Configuration Files

| File | Purpose |
|------|---------|
| `jest.config.js` | Jest configuration for Next.js with TypeScript |
| `jest.setup.js` | Global test setup, mocks, and environment configuration |
| `src/lib/test-utils.ts` | Shared testing utilities and factories |
| `src/lib/supabase-test.ts` | Database testing client and helpers |

### Test Scripts

| Script | Description |
|--------|-------------|
| `health-check.sh` | Comprehensive system health verification |
| `test-pipeline.sh` | Multi-stage testing pipeline |
| `scripts/seed-test-data.ts` | Database seeding for consistent testing |

## 🧪 Test Types and Structure

### Unit Tests
- **Location**: `src/**/__tests__/` or `src/**/*.test.ts`
- **Purpose**: Test individual functions and components
- **Example**: `src/app/api/buy-orders/create/__tests__/route.test.ts`

### Integration Tests
- **Location**: `src/__tests__/integration/`
- **Purpose**: Test complete workflows and system interactions
- **Example**: `src/__tests__/integration/payment-flow.test.ts`

### API Route Testing
```typescript
import { POST } from '../route'
import { createNextApiTestRequest, mockEnvironment } from '@/lib/test-utils'

describe('/api/endpoint', () => {
  it('should handle requests correctly', async () => {
    const request = createNextApiTestRequest('POST', { data: 'test' })
    const response = await POST(request)
    const result = await response.json()
    
    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
  })
})
```

## 🗄️ Database Testing

### Setup Test Database
```typescript
import { supabaseTest, setupCompleteTestData, cleanupTestData } from '@/lib/supabase-test'

beforeAll(async () => {
  const testData = await setupCompleteTestData()
})

afterAll(async () => {
  await cleanupTestData()
})
```

### Seed Test Data
```bash
# Seed fresh test data
npm run seed:test

# Clear existing data first, then seed
npm run seed:test:clean

# Clear all test data
npm run seed:clear

# Validate existing test data
npm run seed:validate
```

## 🔧 Mocking and Test Utilities

### Supabase Mocking
```typescript
import { createMockSupabaseClient } from '@/lib/test-utils'

const mockSupabase = createMockSupabaseClient()
mockSupabase.from.mockReturnValue(mockSupabase)
mockSupabase.select.mockReturnValue(mockSupabase)
mockSupabase.single.mockResolvedValue({ data: testData, error: null })
```

### Stripe Mocking
```typescript
import { createMockStripeClient } from '@/lib/test-utils'

const mockStripe = createMockStripeClient()
mockStripe.paymentIntents.create.mockResolvedValue({
  id: 'pi_test123',
  status: 'requires_capture'
})
```

### Test Data Factories
```typescript
import { createTestUser, createTestProduct, createTestBuyOrder } from '@/lib/test-utils'

const user = createTestUser({ email: 'custom@test.com' })
const product = createTestProduct({ current_price: 299 })
const order = createTestBuyOrder({ target_price: 250 })
```

## 🏃‍♂️ Development Workflow

### Before Each Session
1. **Health Check**: `./health-check.sh`
2. **Verify Tests**: `./cli.sh platform test`
3. **Check Types**: `./cli.sh platform typecheck`
4. **Lint Code**: `./cli.sh platform lint`

### During Development
1. **Watch Mode**: `./cli.sh platform test:watch`
2. **Quick Pipeline**: `./test-pipeline.sh quick`
3. **Seed Fresh Data**: `npm run seed:test:clean`

### Before Committing
1. **Pre-commit Check**: `npm run pre-commit`
2. **Full Pipeline**: `./test-pipeline.sh`
3. **Health Check**: `./health-check.sh`

## 📊 Coverage and Reporting

### Generate Coverage Reports
```bash
./cli.sh platform test:coverage
```

Coverage reports are generated in the `coverage/` directory and include:
- HTML report: `coverage/lcov-report/index.html`
- LCOV format: `coverage/lcov.info`
- Text summary in terminal

### Coverage Configuration
- **Target**: All files in `src/` directory
- **Excludes**: Type definitions, stories, test files
- **Formats**: HTML, LCOV, text summary

## 🔍 Troubleshooting

### Common Issues

**Tests not running?**
```bash
# Check Docker containers
./cli.sh status

# Restart if needed
cd .. && ./dev.sh
```

**Database connection issues?**
```bash
# Check database status
./health-check.sh

# Reset test database
npm run seed:test:clean
```

**TypeScript errors?**
```bash
# Run type checking
./cli.sh platform typecheck

# Install dependencies
./cli.sh platform install
```

**Environment variables missing?**
```bash
# Check environment configuration
./health-check.sh

# Verify .env.local exists (optional)
ls -la .env.local
```

### Debug Mode
```bash
# Run tests with debug output
./cli.sh platform test -- --verbose

# Run single test file
./cli.sh platform test -- specific-test.test.ts

# Run tests matching pattern
./cli.sh platform test -- --testNamePattern="should create"
```

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: Test Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start services
        run: ./dev.sh
      - name: Run CI pipeline
        run: ./test-pipeline.sh ci
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Docker Commands for CI
```bash
# Install dependencies
./cli.sh platform install

# Run full CI pipeline
./cli.sh platform pipeline:ci

# Generate coverage reports
./cli.sh platform test:coverage
```

## 📝 Writing New Tests

### API Route Tests
1. Create test file: `src/app/api/[route]/__tests__/route.test.ts`
2. Import utilities: `import { createNextApiTestRequest } from '@/lib/test-utils'`
3. Mock dependencies: Supabase, Stripe, external APIs
4. Test success and error cases
5. Verify response format and status codes

### Integration Tests
1. Create test file: `src/__tests__/integration/[feature].test.ts`
2. Use real database with test data
3. Test complete user workflows
4. Verify data persistence and side effects
5. Clean up test data in teardown

### Component Tests (Future)
1. Use React Testing Library
2. Mock API calls and external dependencies
3. Test user interactions and state changes
4. Verify accessibility and responsive behavior

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Next.js Testing](https://nextjs.org/docs/testing)

## 🎉 Benefits

With this testing infrastructure, you can:

✅ **Catch bugs early** with comprehensive test coverage  
✅ **Ensure quality** with automated linting and type checking  
✅ **Maintain consistency** with seeded test data  
✅ **Debug quickly** with detailed health checks  
✅ **Deploy confidently** with CI/CD pipeline integration  
✅ **Develop efficiently** with watch mode and hot reloading  

The testing infrastructure is now ready to support your development workflow and ensure code quality throughout the project lifecycle.