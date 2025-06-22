#!/bin/bash

# Limina Platform - Docker Development Environment
# Run everything in containers - no local Node.js required

set -e

echo "🐳 Starting Limina Platform in Docker..."

# Build and start all services
docker compose up --build -d

echo "✅ Services starting..."
echo ""
echo "📊 Supabase Studio: http://localhost:3000"
echo "🚀 Limina App: http://localhost:3001"
echo "🗄️  Database: localhost:5432"
echo ""
echo "Use 'docker compose logs -f app' to follow app logs"
echo "Use 'docker compose down' to stop all services"