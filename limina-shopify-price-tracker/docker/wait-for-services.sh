#!/bin/sh
# Wait for required services to be ready before running tests

echo "🔄 Waiting for services to be ready..."

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
until nc -z postgres 5432; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for MailHog
echo "Waiting for MailHog..."
until nc -z mailhog 1025; do
  echo "MailHog is unavailable - sleeping"
  sleep 2
done
echo "✅ MailHog is ready!"

# Wait for Redis (optional)
echo "Waiting for Redis..."
until nc -z redis 6379; do
  echo "Redis is unavailable - sleeping"
  sleep 1
done
echo "✅ Redis is ready!"

echo "🚀 All services ready! Starting tests..."

# Execute the command passed to this script
exec "$@"