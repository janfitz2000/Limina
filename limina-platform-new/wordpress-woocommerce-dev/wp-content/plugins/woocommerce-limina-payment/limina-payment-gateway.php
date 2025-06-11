<?php
/**
 * Plugin Name: Limina Pay Later Gateway
 * Plugin URI: https://limina.com
 * Description: Allow customers to set target prices and pay only when items go on sale
 * Version: 1.0.0
 * Author: Limina
 * Text Domain: limina-payment-gateway
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('LIMINA_PAYMENT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('LIMINA_PAYMENT_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('LIMINA_PAYMENT_VERSION', '1.0.0');

// Check if WooCommerce is active
add_action('plugins_loaded', 'limina_payment_init');

function limina_payment_init() {
    if (!class_exists('WC_Payment_Gateway')) {
        add_action('admin_notices', 'limina_payment_woocommerce_missing_notice');
        return;
    }

    // Include the gateway class
    include_once(LIMINA_PAYMENT_PLUGIN_PATH . 'includes/class-limina-payment-gateway.php');
    
    // Include admin class
    if (is_admin()) {
        include_once(LIMINA_PAYMENT_PLUGIN_PATH . 'includes/class-limina-admin.php');
        new WC_Limina_Admin();
    }

    // Add the gateway to WooCommerce
    add_filter('woocommerce_payment_gateways', 'limina_add_payment_gateway');
}

function limina_add_payment_gateway($gateways) {
    $gateways[] = 'WC_Limina_Payment_Gateway';
    return $gateways;
}

function limina_payment_woocommerce_missing_notice() {
    echo '<div class="error"><p><strong>' . sprintf(esc_html__('Limina Payment Gateway requires WooCommerce to be installed and active. You can download %s here.', 'limina-payment-gateway'), '<a href="https://woocommerce.com/" target="_blank">WooCommerce</a>') . '</strong></p></div>';
}

// Add custom CSS and JavaScript
add_action('wp_enqueue_scripts', 'limina_payment_enqueue_scripts');

function limina_payment_enqueue_scripts() {
    if (is_checkout() || is_cart()) {
        wp_enqueue_style('limina-payment-styles', LIMINA_PAYMENT_PLUGIN_URL . 'assets/limina-payment.css', array(), LIMINA_PAYMENT_VERSION);
        wp_enqueue_script('limina-payment-scripts', LIMINA_PAYMENT_PLUGIN_URL . 'assets/limina-payment.js', array('jquery'), LIMINA_PAYMENT_VERSION, true);
        
        // Localize script with ajax URL and nonce
        wp_localize_script('limina-payment-scripts', 'limina_payment_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('limina_payment_nonce'),
            'checkout_url' => wc_get_checkout_url()
        ));
    }
}

// AJAX handlers for buy order creation
add_action('wp_ajax_limina_create_buy_order', 'limina_handle_create_buy_order');
add_action('wp_ajax_nopriv_limina_create_buy_order', 'limina_handle_create_buy_order');

function limina_handle_create_buy_order() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'], 'limina_payment_nonce')) {
        wp_die('Security check failed');
    }

    $cart_items = WC()->cart->get_cart();
    $customer_email = sanitize_email($_POST['customer_email']);
    $target_prices = $_POST['target_prices']; // Array of product_id => target_price

    if (empty($customer_email) || !is_email($customer_email)) {
        wp_send_json_error('Valid email address required');
        return;
    }

    $buy_orders = array();
    
    foreach ($cart_items as $cart_item_key => $cart_item) {
        $product = $cart_item['data'];
        $product_id = $product->get_id();
        $target_price = floatval($target_prices[$product_id] ?? 0);
        $current_price = floatval($product->get_price());
        
        if ($target_price > 0 && $target_price < $current_price) {
            // Create buy order via Limina API
            $buy_order_data = array(
                'woocommerce_product_id' => $product_id,
                'customer_email' => $customer_email,
                'target_price' => $target_price,
                'current_price' => $current_price,
                'currency' => get_woocommerce_currency(),
                'quantity' => $cart_item['quantity'],
                'expires_in_days' => 30,
                'source' => 'woocommerce_checkout'
            );
            
            $response = limina_api_create_buy_order($buy_order_data);
            
            if ($response && $response['success']) {
                $buy_orders[] = $response['buy_order'];
            }
        }
    }

    if (!empty($buy_orders)) {
        // Clear the cart since we've created buy orders
        WC()->cart->empty_cart();
        
        wp_send_json_success(array(
            'message' => sprintf('Created %d buy orders! You\'ll be notified when prices drop.', count($buy_orders)),
            'buy_orders' => $buy_orders,
            'redirect_url' => wc_get_page_permalink('myaccount')
        ));
    } else {
        wp_send_json_error('No valid buy orders could be created');
    }
}

function limina_api_create_buy_order($data) {
    $gateway = new WC_Limina_Payment_Gateway();
    $api_url = $gateway->get_option('api_url', 'http://localhost:3000');
    
    $response = wp_remote_post($api_url . '/api/woocommerce/buy-orders', array(
        'headers' => array(
            'Content-Type' => 'application/json',
        ),
        'body' => json_encode($data),
        'timeout' => 30
    ));
    
    if (is_wp_error($response)) {
        error_log('Limina API Error: ' . $response->get_error_message());
        return false;
    }
    
    $body = wp_remote_retrieve_body($response);
    return json_decode($body, true);
}

// Add Limina order status to WooCommerce
add_action('init', 'limina_register_order_status');

function limina_register_order_status() {
    register_post_status('wc-limina-monitoring', array(
        'label' => 'Limina Monitoring',
        'public' => true,
        'exclude_from_search' => false,
        'show_in_admin_all_list' => true,
        'show_in_admin_status_list' => true,
        'label_count' => _n_noop('Limina Monitoring <span class="count">(%s)</span>', 'Limina Monitoring <span class="count">(%s)</span>')
    ));
}

// Add to list of WC Order statuses
add_filter('wc_order_statuses', 'limina_add_order_statuses');

function limina_add_order_statuses($order_statuses) {
    $new_order_statuses = array();
    
    foreach ($order_statuses as $key => $status) {
        $new_order_statuses[$key] = $status;
        if ('wc-processing' === $key) {
            $new_order_statuses['wc-limina-monitoring'] = 'Limina Monitoring';
        }
    }
    
    return $new_order_statuses;
}