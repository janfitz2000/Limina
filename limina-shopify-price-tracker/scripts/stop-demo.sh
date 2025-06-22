#!/bin/bash
# 🛑 Stop the demo environment and clean up

echo "🛑 Stopping Limina Price Tracker Demo..."
echo "======================================="

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Stop all services
echo "🔄 Stopping all services..."
docker-compose down

# Show option to clean up volumes
echo ""
echo "✅ Demo stopped!"
echo ""
echo "🧹 To completely clean up (remove all data):"
echo "  docker-compose down -v"
echo "  docker system prune -f"
echo ""