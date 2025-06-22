#!/bin/bash

echo "🚀 Quick WordPress + WooCommerce setup..."

# Bring down everything and remove volumes to start fresh
echo "🧹 Cleaning up old containers..."
docker-compose down -v

# Remove any existing WordPress files
rm -rf wp-content/*

# Start containers
echo "📦 Starting fresh containers..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 45

# Install WordPress
echo "🔧 Installing WordPress..."
docker-compose run --rm wp-cli core install \
  --url="http://localhost:8080" \
  --title="Limina WooCommerce Dev" \
  --admin_user="admin" \
  --admin_password="admin123" \
  --admin_email="admin@limina.local" \
  --skip-email

# Update WordPress to latest
echo "⬆️ Updating WordPress..."
docker-compose run --rm wp-cli core update

# Install WooCommerce
echo "🛒 Installing WooCommerce..."
docker-compose run --rm wp-cli plugin install woocommerce --activate

# Set permalink structure
echo "🔗 Setting permalinks..."
docker-compose run --rm wp-cli rewrite structure '/%postname%/'
docker-compose run --rm wp-cli rewrite flush

# Configure WooCommerce
echo "⚙️ Configuring WooCommerce..."
docker-compose run --rm wp-cli option update woocommerce_store_address "123 Limina Street"
docker-compose run --rm wp-cli option update woocommerce_store_city "Tech City"
docker-commerce run --rm wp-cli option update woocommerce_default_country "US:CA"
docker-compose run --rm wp-cli option update woocommerce_store_postcode "90210"
docker-compose run --rm wp-cli option update woocommerce_currency "USD"
docker-compose run --rm wp-cli option update woocommerce_allow_tracking "no"

# Install our plugin
echo "💳 Installing Limina Payment Gateway..."
mkdir -p wp-content/plugins
cp -r ../woocommerce-limina-payment wp-content/plugins/
docker-compose run --rm wp-cli plugin activate limina-payment-gateway

# Create sample products
echo "📦 Creating sample products..."

# Create some simple posts as products first
docker-compose run --rm wp-cli post create \
  --post_type=product \
  --post_title="iPhone 15 Pro" \
  --post_content="Latest iPhone with advanced camera system" \
  --post_status=publish

docker-compose run --rm wp-cli post create \
  --post_type=product \
  --post_title="MacBook Pro 14" \
  --post_content="Powerful M3 MacBook Pro" \
  --post_status=publish

docker-compose run --rm wp-cli post create \
  --post_type=product \
  --post_title="Sony Headphones" \
  --post_content="Noise-cancelling headphones" \
  --post_status=publish

# Add product metadata
docker-compose run --rm wp-cli post meta update 10 _price "999"
docker-compose run --rm wp-cli post meta update 10 _regular_price "999"
docker-compose run --rm wp-cli post meta update 10 _manage_stock "yes"
docker-compose run --rm wp-cli post meta update 10 _stock "10"
docker-compose run --rm wp-cli post meta update 10 _visibility "visible"

docker-compose run --rm wp-cli post meta update 11 _price "1799"
docker-compose run --rm wp-cli post meta update 11 _regular_price "1799"
docker-compose run --rm wp-cli post meta update 11 _manage_stock "yes"
docker-compose run --rm wp-cli post meta update 11 _stock "5"
docker-compose run --rm wp-cli post meta update 11 _visibility "visible"

docker-compose run --rm wp-cli post meta update 12 _price "299"
docker-compose run --rm wp-cli post meta update 12 _regular_price "299"
docker-compose run --rm wp-cli post meta update 12 _manage_stock "yes"
docker-compose run --rm wp-cli post meta update 12 _stock "20"
docker-compose run --rm wp-cli post meta update 12 _visibility "visible"

echo "✅ Setup complete!"
echo ""
echo "🌐 WordPress Admin: http://localhost:8080/wp-admin"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🛒 WooCommerce Shop: http://localhost:8080/shop"
echo "🗄️  phpMyAdmin: http://localhost:8081"
echo ""
echo "Try visiting the shop and adding products to cart to test the Limina payment gateway!"