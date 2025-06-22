# WordPress + WooCommerce Development Environment

Local development environment for testing the Limina Payment Gateway plugin.

## Quick Start

1. **Prerequisites**
   - Docker and Docker Compose installed
   - Your Limina platform running on `http://localhost:3000`

2. **Setup Environment**
   ```bash
   cd wordpress-woocommerce-dev
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Access Your Sites**
   - **WordPress Admin**: http://localhost:8080/wp-admin
     - Username: `admin`
     - Password: `admin123`
   - **WooCommerce Shop**: http://localhost:8080/shop
   - **phpMyAdmin**: http://localhost:8081

## What's Included

### WordPress Setup
- WordPress 6.4 with PHP 8.1
- WooCommerce plugin installed and activated
- Limina Payment Gateway plugin installed
- Sample products created for testing
- Development plugins (Query Monitor, WP Log Viewer)

### Database
- MySQL 8.0 database
- phpMyAdmin for database management
- Persistent data volumes

### Configuration
- Debug mode enabled
- Increased upload limits
- WooCommerce configured with USD currency
- Limina payment gateway pre-configured

## Testing the Integration

### 1. Configure Limina Payment Gateway
1. Go to **WooCommerce > Settings > Payments**
2. Find "Limina Pay Later" and click **Set up**
3. Configure settings:
   - **API URL**: `http://host.docker.internal:3000`
   - **Title**: "Pay when price drops - Limina"
   - **Max Discount**: 30%
4. Click **Save changes**

### 2. Test Customer Flow
1. Go to the shop: http://localhost:8080/shop
2. Add products to cart
3. Go to checkout
4. Select "Pay when price drops - Limina" payment method
5. Set target prices for each item
6. Enter email address
7. Complete the order

### 3. Test Admin Features
1. Go to **WooCommerce > Limina Buy Orders**
2. View and manage buy orders
3. Test product synchronization
4. Check analytics dashboard

### 4. Test Webhooks
1. Update product prices in WooCommerce
2. Check if buy orders are automatically fulfilled
3. View webhook logs in your Limina platform

## Development Commands

### Docker Management
```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs wordpress
docker-compose logs wordpress-db

# Access WordPress container
docker-compose exec wordpress bash

# Access database
docker-compose exec wordpress-db mysql -u wordpress -p
```

### WP-CLI Commands
```bash
# Install plugins
docker-compose run --rm wp-cli plugin install plugin-name --activate

# Update WordPress
docker-compose run --rm wp-cli core update

# Manage users
docker-compose run --rm wp-cli user create testuser test@example.com --role=customer

# Flush rewrite rules
docker-compose run --rm wp-cli rewrite flush

# Check plugin status
docker-compose run --rm wp-cli plugin list
```

### Database Management
```bash
# Backup database
docker-compose exec wordpress-db mysqldump -u root -p wordpress > backup.sql

# Restore database
docker-compose exec -T wordpress-db mysql -u root -p wordpress < backup.sql

# Reset database
docker-compose down -v
docker-compose up -d
./setup.sh
```

## Plugin Development

### File Structure
```
wp-content/plugins/limina-payment-gateway/
├── limina-payment-gateway.php      # Main plugin file
├── includes/
│   ├── class-limina-payment-gateway.php  # Payment gateway class
│   └── class-limina-admin.php             # Admin dashboard
├── assets/
│   ├── checkout.css               # Frontend checkout styles
│   ├── checkout.js                # Frontend checkout scripts
│   ├── admin.css                  # Admin dashboard styles
│   └── admin.js                   # Admin dashboard scripts
└── README.md                      # Plugin documentation
```

### Making Changes
1. Edit plugin files in `woocommerce-limina-payment/`
2. Copy changes to WordPress container:
   ```bash
   cp -r ../woocommerce-limina-payment ./wp-content/plugins/
   ```
3. Or restart containers to reload changes:
   ```bash
   docker-compose restart wordpress
   ```

### Debugging
1. **WordPress Debug Logs**
   - Location: `/var/www/html/wp-content/debug.log`
   - View: `docker-compose exec wordpress tail -f /var/www/html/wp-content/debug.log`

2. **Query Monitor Plugin**
   - Installed automatically
   - Shows database queries, hooks, and performance data
   - Visible in admin bar when logged in

3. **Browser Developer Tools**
   - Check console for JavaScript errors
   - Monitor network requests to Limina API
   - Inspect form submissions

## Environment Variables

Add these to your `.env` file in the project root:

```env
# WordPress Database
WORDPRESS_DB_NAME=wordpress
WORDPRESS_DB_USER=wordpress
WORDPRESS_DB_PASSWORD=wordpress_password

# Limina API
LIMINA_API_URL=http://host.docker.internal:3000
WOOCOMMERCE_WEBHOOK_SECRET=your_webhook_secret_here
```

## Troubleshooting

### Common Issues

1. **Containers won't start**
   - Check if ports 8080, 8081, 3307 are available
   - Run `docker-compose down` then `docker-compose up -d`

2. **Plugin not working**
   - Check WooCommerce is installed and activated
   - Verify Limina API is running on port 3000
   - Check WordPress debug logs

3. **Database connection issues**
   - Wait 30 seconds after starting containers
   - Check database container logs: `docker-compose logs wordpress-db`

4. **API calls failing**
   - Verify `host.docker.internal` resolves to your host machine
   - Check firewall settings
   - Test API manually: `curl http://localhost:3000/api/health`

### Reset Everything
```bash
# Stop containers and remove volumes
docker-compose down -v

# Remove plugin files
rm -rf wp-content/plugins/limina-payment-gateway

# Restart from scratch
./setup.sh
```

## Production Deployment

Before deploying to production:

1. **Update Configuration**
   - Change API URL to production endpoint
   - Set secure webhook secrets
   - Disable debug mode

2. **Security Checklist**
   - Update admin passwords
   - Install security plugins
   - Enable SSL certificates
   - Configure firewalls

3. **Performance Optimization**
   - Install caching plugins
   - Optimize database
   - Enable CDN
   - Monitor performance

## Support

For issues with:
- **WordPress/WooCommerce**: Check official documentation
- **Docker**: Verify Docker installation and resources
- **Limina Plugin**: Check plugin logs and API connectivity
- **Integration**: Test webhook endpoints and API responses