#!/bin/bash

echo "🔄 Rebuilding Limina Platform Docker container..."

# Stop and remove the current container
echo "📦 Stopping current container..."
docker-compose down limina-platform

# Rebuild the container without cache
echo "🏗️ Building new container..."
docker-compose build --no-cache limina-platform

# Start the container
echo "🚀 Starting container..."
docker-compose up -d limina-platform

# Wait a moment for the container to start
sleep 3

# Show the status
echo "✅ Rebuild complete!"
echo ""
echo "🌐 Dashboard: http://localhost:3000"
echo "⚙️ Settings: http://localhost:3000/dashboard/settings"
echo "🛒 Shop: http://localhost:8080/shop"
echo ""
echo "📋 Container status:"
docker-compose ps limina-platform