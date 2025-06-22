#!/bin/bash

echo "🚀 Setting up Complete Limina + WooCommerce Environment..."
echo "This will run everything in containers - no local dependencies needed!"

# Stop any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down -v

# Build and start all services
echo "🏗️  Building and starting all services..."
docker-compose up -d --build

echo "⏳ Waiting for services to be ready..."
sleep 60

# Install WordPress
echo "🔧 Installing WordPress..."
docker-compose run --rm wp-cli core install \
  --url="http://localhost:8080" \
  --title="Limina WooCommerce Dev" \
  --admin_user="admin" \
  --admin_password="admin123" \
  --admin_email="admin@limina.local"

# Install and activate WooCommerce
echo "🛒 Installing WooCommerce..."
docker-compose run --rm wp-cli plugin install woocommerce --activate

# Install development plugins
echo "🔧 Installing development plugins..."
docker-compose run --rm wp-cli plugin install query-monitor --activate
docker-compose run --rm wp-cli plugin install wp-log-viewer --activate

# Copy our Limina payment plugin
echo "💳 Installing Limina Payment Gateway..."
docker-compose exec wordpress mkdir -p /var/www/html/wp-content/plugins/limina-payment-gateway
docker cp ../woocommerce-limina-payment/limina-payment-gateway.php limina-wordpress:/var/www/html/wp-content/plugins/limina-payment-gateway/
docker cp ../woocommerce-limina-payment/includes limina-wordpress:/var/www/html/wp-content/plugins/limina-payment-gateway/
docker cp ../woocommerce-limina-payment/assets limina-wordpress:/var/www/html/wp-content/plugins/limina-payment-gateway/
docker-compose run --rm wp-cli plugin activate limina-payment-gateway

# Set up WooCommerce basics
echo "⚙️ Configuring WooCommerce..."
docker-compose run --rm wp-cli option update woocommerce_store_address "123 Limina Street"
docker-compose run --rm wp-cli option update woocommerce_store_city "Tech City"
docker-compose run --rm wp-cli option update woocommerce_default_country "US:CA"
docker-compose run --rm wp-cli option update woocommerce_store_postcode "90210"
docker-compose run --rm wp-cli option update woocommerce_currency "USD"
docker-compose run --rm wp-cli option update woocommerce_product_type "both"
docker-compose run --rm wp-cli option update woocommerce_allow_tracking "no"

# Enable Limina payment gateway
docker-compose run --rm wp-cli option update woocommerce_limina_payment_settings '{
  "enabled": "yes",
  "title": "Pay when price drops - Limina",
  "description": "Set your target price and only pay if items go on sale. No upfront payment required.",
  "api_url": "http://limina-platform:3000",
  "max_discount_percentage": "30"
}' --format=json

# Create sample products
echo "📦 Creating sample products..."
docker-compose run --rm wp-cli post create \
  --post_type=product \
  --post_title="iPhone 15 Pro" \
  --post_content="Latest iPhone with advanced camera system" \
  --post_status=publish \
  --meta_input='{"_price":"999","_regular_price":"999","_manage_stock":"yes","_stock":"10","_virtual":"no","_downloadable":"no"}'

docker-compose run --rm wp-cli post create \
  --post_type=product \
  --post_title="MacBook Pro 14" \
  --post_content="Powerful M3 MacBook Pro" \
  --post_status=publish \
  --meta_input='{"_price":"1799","_regular_price":"1799","_manage_stock":"yes","_stock":"5","_virtual":"no","_downloadable":"no"}'

docker-compose run --rm wp-cli post create \
  --post_type=product \
  --post_title="Sony Headphones" \
  --post_content="Noise-cancelling headphones" \
  --post_status=publish \
  --meta_input='{"_price":"299","_regular_price":"299","_manage_stock":"yes","_stock":"20","_virtual":"no","_downloadable":"no"}'

# Set permalink structure
docker-compose run --rm wp-cli rewrite structure '/%postname%/'
docker-compose run --rm wp-cli rewrite flush

echo "✅ Setup complete!"
echo ""
echo "🌐 Services running:"
echo "   Limina Platform: http://localhost:3000"
echo "   WordPress Admin: http://localhost:8080/wp-admin"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🛒 WooCommerce: http://localhost:8080/shop"
echo "🗄️  phpMyAdmin: http://localhost:8081"
echo "🗄️  Supabase DB: localhost:5432"
echo ""
echo "💡 Next steps:"
echo "   1. Visit the shop and add products to cart"
echo "   2. Go to checkout and select 'Pay when price drops - Limina'"
echo "   3. Set target prices and test the integration"
echo ""
echo "🔧 Useful commands:"
echo "   docker-compose logs limina-platform    # View Limina platform logs"
echo "   docker-compose logs wordpress          # View WordPress logs"
echo "   docker-compose down                    # Stop all containers"
echo "   docker-compose up -d                   # Start all containers"