#!/bin/bash
# 🚀 Start a simplified demo environment (just database + services)

echo "🎬 Starting Limina Price Tracker Demo (Simple)..."
echo "================================================="

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Start infrastructure services only
echo "🔄 Starting infrastructure services..."
docker-compose -f docker-compose.simple.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start up..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose -f docker-compose.simple.yml ps

# Set up environment for local development
echo "🔧 Setting up local environment..."
export NEXT_PUBLIC_SUPABASE_URL="postgresql://postgres:postgres@localhost:5432/limina_test"
export SUPABASE_SERVICE_ROLE_KEY="test_service_key"
export RESEND_API_KEY="test_key"
export SHOPIFY_WEBHOOK_SECRET="test_webhook_secret_local"
export NEXT_PUBLIC_APP_URL="http://localhost:3000"
export NODE_ENV="development"

# Start the Next.js app locally
echo "🌟 Starting Next.js app locally..."
echo ""
echo "🎉 Demo environment is ready!"
echo "================================"
echo ""
echo "📍 Available services:"
echo "🗄️  Database:        postgres://postgres:postgres@localhost:5432/limina_test"
echo "📧 Email Inbox:      http://localhost:8025 (MailHog)"
echo "🔴 Redis:            redis://localhost:6379"
echo ""
echo "🚀 Start the app:"
echo "  npm run dev"
echo ""
echo "🧪 Then run tests:"
echo "  npm test"
echo ""
echo "🛑 Stop services:"
echo "  docker-compose -f docker-compose.simple.yml down"
echo ""