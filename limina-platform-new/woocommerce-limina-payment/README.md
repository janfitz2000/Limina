# Limina Pay Later - WooCommerce Payment Gateway

A WooCommerce payment gateway that allows customers to set target prices and pay only when items go on sale.

## Features

- **Pay Later Functionality**: Customers can set target prices instead of paying upfront
- **Price Monitoring**: Automatically monitors product prices for 30 days
- **Conditional Orders**: Payment is only processed when items reach target prices
- **Seamless Integration**: Works as a standard WooCommerce payment gateway
- **Rich UI**: Beautiful checkout interface with real-time savings calculations
- **Order Management**: Custom order status for monitoring buy orders

## Installation

1. **Upload Plugin**
   - Upload the `woocommerce-limina-payment` folder to `/wp-content/plugins/`
   - Or install via WordPress admin: Plugins > Add New > Upload Plugin

2. **Activate Plugin**
   - Go to Plugins > Installed Plugins
   - Activate "Limina Pay Later Gateway"

3. **Configure Settings**
   - Go to WooCommerce > Settings > Payments
   - Find "Limina Pay Later" and click "Set up"
   - Configure your API URL and other settings

## Configuration

### Required Settings

- **API URL**: Your Limina platform API endpoint (e.g., `https://your-domain.com`)
- **Title**: Payment method title shown to customers
- **Description**: Description shown during checkout

### Optional Settings

- **Max Discount Percentage**: Maximum discount customers can request (default: 30%)

## How It Works

### Customer Experience

1. **Add to Cart**: Customer adds products to their cart normally
2. **Choose Limina**: At checkout, customer selects "Pay when price drops - Limina"
3. **Set Target Prices**: Customer sets their desired target price for each item
4. **Submit Order**: Order is created with "Limina Monitoring" status
5. **Price Monitoring**: System monitors prices for 30 days
6. **Automatic Payment**: When prices drop to targets, payment is processed automatically

### Merchant Experience

1. **Order Notifications**: Receive notifications for new buy orders
2. **Order Management**: View buy orders in WooCommerce admin
3. **Price Control**: Update product prices to trigger fulfillments
4. **Analytics**: Track conversion rates and customer demand

## Order Statuses

- **Limina Monitoring**: Buy order is active and monitoring prices
- **Processing**: Price target met, payment processed
- **Completed**: Order fulfilled and delivered

## API Integration

The plugin integrates with your Limina platform via REST API:

- **Endpoint**: `/api/woocommerce/buy-orders`
- **Method**: POST
- **Authentication**: API key (configured in settings)

### Data Sent to API

```json
{
  "woocommerce_product_id": 123,
  "woocommerce_order_id": 456,
  "customer_email": "customer@example.com",
  "customer_name": "John Doe",
  "target_price": 79.99,
  "current_price": 99.99,
  "currency": "USD",
  "quantity": 1,
  "expires_in_days": 30,
  "source": "woocommerce_checkout"
}
```

## Customization

### Styling

Edit `/assets/checkout.css` to customize the appearance:

- Colors and gradients
- Layout and spacing
- Responsive design
- Animation effects

### JavaScript

Modify `/assets/checkout.js` to customize behavior:

- Form validation
- Real-time calculations
- User interactions
- AJAX handling

### PHP Hooks

Use WordPress/WooCommerce hooks to extend functionality:

```php
// Customize buy order data before sending to API
add_filter('limina_buy_order_data', function($data, $product, $customer) {
    // Modify $data as needed
    return $data;
}, 10, 3);

// Handle successful buy order creation
add_action('limina_buy_order_created', function($buy_order, $wc_order) {
    // Custom logic after buy order creation
}, 10, 2);
```

## Troubleshooting

### Common Issues

1. **Plugin Not Showing**
   - Ensure WooCommerce is installed and activated
   - Check PHP error logs for any conflicts

2. **API Errors**
   - Verify API URL is correct and accessible
   - Check network connectivity between WordPress and Limina platform

3. **Orders Not Creating**
   - Verify required fields are filled
   - Check target prices are below current prices
   - Review API response in browser developer tools

### Debug Mode

Enable WooCommerce logging to see detailed API requests:

1. Go to WooCommerce > Status > Logs
2. Select "limina-payment" logs
3. Review API requests and responses

## Support

For technical support:

1. Check the troubleshooting section above
2. Review WordPress/WooCommerce error logs
3. Contact Limina support with:
   - WordPress version
   - WooCommerce version
   - Plugin version
   - Error messages or logs

## Changelog

### Version 1.0.0
- Initial release
- Basic payment gateway functionality
- Price monitoring integration
- Custom order status
- Responsive checkout UI