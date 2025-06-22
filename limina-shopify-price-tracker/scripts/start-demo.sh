#!/bin/bash
# 🚀 Start the complete Limina Price Tracker demo environment

echo "🎬 Starting Limina Price Tracker Demo Environment..."
echo "=================================================="

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Start all services
echo "🔄 Starting all services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start up..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Seed demo data
echo "🌱 Seeding demo data..."
docker-compose --profile demo up demo-seeder

echo ""
echo "🎉 Demo environment is ready!"
echo "================================"
echo ""
echo "📍 Available services:"
echo "🌐 App Dashboard:    http://localhost:3000"
echo "📧 Email Inbox:      http://localhost:8025 (MailHog)"
echo "🗄️  Database:        postgres://postgres:postgres@localhost:5432/limina_test"
echo "🔴 Redis:            redis://localhost:6379"
echo ""
echo "🧪 Run tests:"
echo "  ./scripts/run-tests.sh"
echo ""
echo "🔧 Send test webhook:"
echo "  ./scripts/test-webhook.sh"
echo ""
echo "🛑 Stop demo:"
echo "  ./scripts/stop-demo.sh"
echo ""