#!/bin/bash
# 🧪 Run the complete test suite in Docker

echo "🧪 Running Limina Price Tracker Test Suite..."
echo "============================================="

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Make sure base services are running
echo "🔄 Starting base services for testing..."
docker-compose up -d postgres mailhog redis

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 5

# Run tests with detailed output
echo "🚀 Running tests..."
echo ""
docker-compose --profile test up --build test-runner

# Show test results
echo ""
echo "📊 Test Results Summary:"
echo "======================="
docker-compose logs test-runner | tail -20

echo ""
echo "📧 Check MailHog for any test emails: http://localhost:8025"
echo "🗄️  Check database for test data: postgres://postgres:postgres@localhost:5432/limina_test"