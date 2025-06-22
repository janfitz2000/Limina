// Test environment setup
const { config } = require('dotenv')

// Load test environment variables
config({ path: '.env.test' })

// Global test configuration
global.console = {
  ...console,
  // Uncomment to silence console during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}