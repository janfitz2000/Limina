#!/bin/sh
# Wait for the main app to be ready before seeding demo data

echo "🔄 Waiting for main app to be ready..."

# Wait for app health check
until curl -f http://app:3000/api/health; do
  echo "App is not ready - sleeping"
  sleep 5
done

echo "✅ App is ready! Starting demo data seeding..."

# Execute the command passed to this script
exec "$@"