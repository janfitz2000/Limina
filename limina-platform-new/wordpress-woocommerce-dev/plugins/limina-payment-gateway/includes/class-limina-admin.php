<?php

if (!defined('ABSPATH')) {
    exit;
}

class WC_Limina_Admin {

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_ajax_limina_get_buy_orders', array($this, 'ajax_get_buy_orders'));
        add_action('wp_ajax_limina_update_buy_order', array($this, 'ajax_update_buy_order'));
        add_action('wp_ajax_limina_sync_products', array($this, 'ajax_sync_products'));
        
        // Add columns to orders list
        add_filter('manage_edit-shop_order_columns', array($this, 'add_order_columns'));
        add_action('manage_shop_order_posts_custom_column', array($this, 'render_order_columns'), 10, 2);
        
        // Add metabox to order edit page
        add_action('add_meta_boxes', array($this, 'add_order_metabox'));
    }

    public function add_admin_menu() {
        add_submenu_page(
            'woocommerce',
            'Limina Buy Orders',
            'Limina Buy Orders',
            'manage_woocommerce',
            'limina-buy-orders',
            array($this, 'admin_page')
        );
        
        add_submenu_page(
            'woocommerce',
            'Limina Analytics',
            'Limina Analytics',
            'manage_woocommerce',
            'limina-analytics',
            array($this, 'analytics_page')
        );
    }

    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'limina') !== false) {
            wp_enqueue_style('limina-admin-styles', LIMINA_PAYMENT_PLUGIN_URL . 'assets/admin.css', array(), LIMINA_PAYMENT_VERSION);
            wp_enqueue_script('limina-admin-scripts', LIMINA_PAYMENT_PLUGIN_URL . 'assets/admin.js', array('jquery'), LIMINA_PAYMENT_VERSION, true);
            
            wp_localize_script('limina-admin-scripts', 'limina_admin_ajax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('limina_admin_nonce')
            ));
        }
    }

    public function admin_page() {
        ?>
        <div class="wrap limina-admin-wrap">
            <h1>
                <span class="limina-logo">💰</span>
                Limina Buy Orders
                <button id="sync-products-btn" class="button button-secondary">
                    <span class="dashicons dashicons-update"></span>
                    Sync Products
                </button>
            </h1>
            
            <div class="limina-admin-content">
                <!-- Filters -->
                <div class="limina-filters">
                    <select id="status-filter">
                        <option value="">All Statuses</option>
                        <option value="monitoring">Monitoring</option>
                        <option value="fulfilled">Fulfilled</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <input type="date" id="date-from" placeholder="From Date">
                    <input type="date" id="date-to" placeholder="To Date">
                    
                    <button id="filter-btn" class="button button-primary">Filter</button>
                    <button id="clear-filters-btn" class="button">Clear</button>
                </div>

                <!-- Stats Cards -->
                <div class="limina-stats-grid">
                    <div class="limina-stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-content">
                            <div class="stat-number" id="total-orders">-</div>
                            <div class="stat-label">Total Buy Orders</div>
                        </div>
                    </div>
                    
                    <div class="limina-stat-card">
                        <div class="stat-icon">👁️</div>
                        <div class="stat-content">
                            <div class="stat-number" id="monitoring-orders">-</div>
                            <div class="stat-label">Currently Monitoring</div>
                        </div>
                    </div>
                    
                    <div class="limina-stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-content">
                            <div class="stat-number" id="fulfilled-orders">-</div>
                            <div class="stat-label">Fulfilled Orders</div>
                        </div>
                    </div>
                    
                    <div class="limina-stat-card">
                        <div class="stat-icon">💵</div>
                        <div class="stat-content">
                            <div class="stat-number" id="total-revenue">-</div>
                            <div class="stat-label">Total Revenue</div>
                        </div>
                    </div>
                </div>

                <!-- Buy Orders Table -->
                <div class="limina-table-container">
                    <table class="limina-orders-table wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Current Price</th>
                                <th>Target Price</th>
                                <th>Savings</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Expires</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="buy-orders-table-body">
                            <tr>
                                <td colspan="10" class="loading">Loading buy orders...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="limina-pagination">
                    <button id="prev-page" class="button" disabled>Previous</button>
                    <span id="page-info">Page 1 of 1</span>
                    <button id="next-page" class="button" disabled>Next</button>
                </div>
            </div>
        </div>

        <!-- Buy Order Details Modal -->
        <div id="buy-order-modal" class="limina-modal" style="display: none;">
            <div class="limina-modal-content">
                <div class="limina-modal-header">
                    <h2>Buy Order Details</h2>
                    <span class="limina-modal-close">&times;</span>
                </div>
                <div class="limina-modal-body">
                    <div id="buy-order-details"></div>
                </div>
                <div class="limina-modal-footer">
                    <button id="cancel-buy-order" class="button button-secondary">Cancel Order</button>
                    <button id="fulfill-buy-order" class="button button-primary">Fulfill Now</button>
                </div>
            </div>
        </div>
        <?php
    }

    public function analytics_page() {
        ?>
        <div class="wrap limina-admin-wrap">
            <h1>
                <span class="limina-logo">📈</span>
                Limina Analytics
            </h1>
            
            <div class="limina-admin-content">
                <!-- Date Range Selector -->
                <div class="limina-date-range">
                    <label>Date Range:</label>
                    <select id="date-range-select">
                        <option value="7">Last 7 days</option>
                        <option value="30" selected>Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="custom">Custom range</option>
                    </select>
                    
                    <div id="custom-date-range" style="display: none;">
                        <input type="date" id="analytics-date-from">
                        <input type="date" id="analytics-date-to">
                        <button id="apply-date-range" class="button button-primary">Apply</button>
                    </div>
                </div>

                <!-- Analytics Grid -->
                <div class="limina-analytics-grid">
                    <!-- Conversion Metrics -->
                    <div class="limina-analytics-card">
                        <h3>Conversion Metrics</h3>
                        <div class="metric-row">
                            <span>Conversion Rate:</span>
                            <span id="conversion-rate" class="metric-value">-</span>
                        </div>
                        <div class="metric-row">
                            <span>Avg. Discount Requested:</span>
                            <span id="avg-discount" class="metric-value">-</span>
                        </div>
                        <div class="metric-row">
                            <span>Avg. Time to Fulfill:</span>
                            <span id="avg-fulfill-time" class="metric-value">-</span>
                        </div>
                    </div>

                    <!-- Revenue Metrics -->
                    <div class="limina-analytics-card">
                        <h3>Revenue Impact</h3>
                        <div class="metric-row">
                            <span>Total Revenue:</span>
                            <span id="analytics-total-revenue" class="metric-value">-</span>
                        </div>
                        <div class="metric-row">
                            <span>Avg. Order Value:</span>
                            <span id="avg-order-value" class="metric-value">-</span>
                        </div>
                        <div class="metric-row">
                            <span>Revenue Growth:</span>
                            <span id="revenue-growth" class="metric-value">-</span>
                        </div>
                    </div>

                    <!-- Top Products -->
                    <div class="limina-analytics-card">
                        <h3>Top Products by Buy Orders</h3>
                        <div id="top-products-list" class="products-list">
                            Loading...
                        </div>
                    </div>

                    <!-- Customer Insights -->
                    <div class="limina-analytics-card">
                        <h3>Customer Insights</h3>
                        <div class="metric-row">
                            <span>Total Customers:</span>
                            <span id="total-customers" class="metric-value">-</span>
                        </div>
                        <div class="metric-row">
                            <span>Repeat Customers:</span>
                            <span id="repeat-customers" class="metric-value">-</span>
                        </div>
                        <div class="metric-row">
                            <span>Avg. Orders per Customer:</span>
                            <span id="avg-orders-per-customer" class="metric-value">-</span>
                        </div>
                    </div>
                </div>

                <!-- Charts -->
                <div class="limina-charts-grid">
                    <div class="limina-chart-card">
                        <h3>Buy Orders Over Time</h3>
                        <canvas id="orders-chart" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="limina-chart-card">
                        <h3>Fulfillment Status Distribution</h3>
                        <canvas id="status-chart" width="400" height="200"></canvas>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    public function ajax_get_buy_orders() {
        check_ajax_referer('limina_admin_nonce', 'nonce');

        $status = sanitize_text_field($_POST['status'] ?? '');
        $date_from = sanitize_text_field($_POST['date_from'] ?? '');
        $date_to = sanitize_text_field($_POST['date_to'] ?? '');
        $page = intval($_POST['page'] ?? 1);
        $per_page = 20;

        $gateway = new WC_Limina_Payment_Gateway();
        $api_url = $gateway->get_option('api_url', 'http://localhost:3000');

        $query_params = array(
            'source' => 'woocommerce',
            'page' => $page,
            'per_page' => $per_page
        );

        if ($status) $query_params['status'] = $status;
        if ($date_from) $query_params['date_from'] = $date_from;
        if ($date_to) $query_params['date_to'] = $date_to;

        $url = $api_url . '/api/woocommerce/buy-orders?' . http_build_query($query_params);
        
        $response = wp_remote_get($url, array('timeout' => 30));

        if (is_wp_error($response)) {
            wp_send_json_error('Failed to fetch buy orders: ' . $response->get_error_message());
            return;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($data && $data['success']) {
            wp_send_json_success($data);
        } else {
            wp_send_json_error('Invalid response from API');
        }
    }

    public function ajax_update_buy_order() {
        check_ajax_referer('limina_admin_nonce', 'nonce');

        $buy_order_id = sanitize_text_field($_POST['buy_order_id']);
        $action = sanitize_text_field($_POST['action_type']); // 'cancel' or 'fulfill'

        $gateway = new WC_Limina_Payment_Gateway();
        $api_url = $gateway->get_option('api_url', 'http://localhost:3000');

        $response = wp_remote_post($api_url . '/api/buy-orders/' . $buy_order_id . '/' . $action, array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode(array('source' => 'woocommerce_admin')),
            'timeout' => 30
        ));

        if (is_wp_error($response)) {
            wp_send_json_error('Failed to update buy order: ' . $response->get_error_message());
            return;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($data && $data['success']) {
            wp_send_json_success($data);
        } else {
            wp_send_json_error($data['error'] ?? 'Failed to update buy order');
        }
    }

    public function ajax_sync_products() {
        check_ajax_referer('limina_admin_nonce', 'nonce');

        $products = wc_get_products(array(
            'limit' => -1,
            'status' => 'publish'
        ));

        $synced_count = 0;
        $gateway = new WC_Limina_Payment_Gateway();
        $api_url = $gateway->get_option('api_url', 'http://localhost:3000');

        foreach ($products as $product) {
            $product_data = array(
                'woocommerce_product_id' => $product->get_id(),
                'name' => $product->get_name(),
                'price' => $product->get_price(),
                'regular_price' => $product->get_regular_price(),
                'description' => $product->get_description(),
                'short_description' => $product->get_short_description(),
                'images' => array_map(function($id) {
                    return array('src' => wp_get_attachment_url($id));
                }, $product->get_gallery_image_ids())
            );

            $response = wp_remote_post($api_url . '/api/webhooks/woocommerce', array(
                'headers' => array(
                    'Content-Type' => 'application/json',
                    'X-WC-Webhook-Topic' => 'product.updated',
                    'X-WC-Webhook-Source' => site_url()
                ),
                'body' => json_encode($product_data),
                'timeout' => 30
            ));

            if (!is_wp_error($response)) {
                $synced_count++;
            }
        }

        wp_send_json_success(array(
            'message' => sprintf('Successfully synced %d products', $synced_count),
            'synced_count' => $synced_count
        ));
    }

    public function add_order_columns($columns) {
        $new_columns = array();
        
        foreach ($columns as $key => $column) {
            $new_columns[$key] = $column;
            
            if ($key === 'order_status') {
                $new_columns['limina_buy_orders'] = 'Limina Buy Orders';
            }
        }
        
        return $new_columns;
    }

    public function render_order_columns($column, $post_id) {
        if ($column === 'limina_buy_orders') {
            $order = wc_get_order($post_id);
            
            if ($order && $order->get_status() === 'limina-monitoring') {
                echo '<span class="limina-badge limina-monitoring">🎯 Monitoring</span>';
                
                // Count buy orders for this WooCommerce order
                $gateway = new WC_Limina_Payment_Gateway();
                $api_url = $gateway->get_option('api_url', 'http://localhost:3000');
                
                $response = wp_remote_get($api_url . '/api/woocommerce/buy-orders?woocommerce_order_id=' . $post_id);
                
                if (!is_wp_error($response)) {
                    $body = wp_remote_retrieve_body($response);
                    $data = json_decode($body, true);
                    
                    if ($data && $data['success'] && !empty($data['buy_orders'])) {
                        echo '<br><small>' . count($data['buy_orders']) . ' buy orders</small>';
                    }
                }
            }
        }
    }

    public function add_order_metabox() {
        add_meta_box(
            'limina_buy_orders_metabox',
            'Limina Buy Orders',
            array($this, 'render_order_metabox'),
            'shop_order',
            'normal',
            'default'
        );
    }

    public function render_order_metabox($post) {
        $order = wc_get_order($post->ID);
        
        if (!$order || $order->get_status() !== 'limina-monitoring') {
            echo '<p>This order does not have any Limina buy orders.</p>';
            return;
        }

        echo '<div id="limina-order-buy-orders" data-order-id="' . $post->ID . '">';
        echo '<p>Loading buy orders...</p>';
        echo '</div>';

        ?>
        <script>
        jQuery(document).ready(function($) {
            // Load buy orders for this order
            $.post(ajaxurl, {
                action: 'limina_get_buy_orders',
                nonce: '<?php echo wp_create_nonce('limina_admin_nonce'); ?>',
                woocommerce_order_id: '<?php echo $post->ID; ?>'
            }, function(response) {
                if (response.success && response.data.buy_orders) {
                    var html = '<table class="widefat"><thead><tr><th>Product</th><th>Target Price</th><th>Current Price</th><th>Status</th></tr></thead><tbody>';
                    
                    response.data.buy_orders.forEach(function(order) {
                        html += '<tr>';
                        html += '<td>' + (order.products ? order.products.title : 'Unknown Product') + '</td>';
                        html += '<td>$' + parseFloat(order.target_price).toFixed(2) + '</td>';
                        html += '<td>$' + parseFloat(order.current_price).toFixed(2) + '</td>';
                        html += '<td><span class="limina-badge limina-' + order.status + '">' + order.status + '</span></td>';
                        html += '</tr>';
                    });
                    
                    html += '</tbody></table>';
                    $('#limina-order-buy-orders').html(html);
                } else {
                    $('#limina-order-buy-orders').html('<p>No buy orders found for this order.</p>');
                }
            });
        });
        </script>
        <?php
    }
}