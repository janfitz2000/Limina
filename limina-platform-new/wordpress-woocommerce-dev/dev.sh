#!/bin/bash

echo "🔧 Development mode: Quick setup + rebuild..."

# First run setup to ensure everything is configured
echo "⚙️ Running setup..."
./setup.sh

echo ""
echo "🔄 Rebuilding platform container..."

# Stop and remove the current container
docker-compose down limina-platform

# Rebuild the container without cache
docker-compose build --no-cache limina-platform

# Start the container
docker-compose up -d limina-platform

# Wait for startup
sleep 3

echo ""
echo "✅ Development environment ready!"
echo ""
echo "🌐 Dashboard: http://localhost:3000"
echo "⚙️ Settings: http://localhost:3000/dashboard/settings"
echo "🛒 Shop: http://localhost:8080/shop"
echo "🗄️ WordPress Admin: http://localhost:8080/wp-admin (admin/admin123)"
echo ""
echo "📋 All containers:"
docker-compose ps