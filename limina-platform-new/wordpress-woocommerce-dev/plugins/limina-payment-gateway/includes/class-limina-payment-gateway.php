<?php

if (!defined('ABSPATH')) {
    exit;
}

class WC_Limina_Payment_Gateway extends WC_Payment_Gateway {

    public function __construct() {
        $this->id = 'limina_payment';
        $this->icon = '';
        $this->has_fields = true;
        $this->method_title = 'Limina Pay Later';
        $this->method_description = 'Allow customers to set target prices and pay only when items go on sale';
        $this->supports = array('products');

        // Load the form fields
        $this->init_form_fields();

        // Load the settings
        $this->init_settings();

        // Define user set variables
        $this->title = $this->get_option('title');
        $this->description = $this->get_option('description');
        $this->enabled = $this->get_option('enabled');
        $this->api_url = $this->get_option('api_url');
        $this->max_discount_percentage = $this->get_option('max_discount_percentage', 30);

        // Actions
        add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        add_action('wp_enqueue_scripts', array($this, 'payment_scripts'));
    }

    public function init_form_fields() {
        $this->form_fields = array(
            'enabled' => array(
                'title' => 'Enable/Disable',
                'type' => 'checkbox',
                'label' => 'Enable Limina Pay Later',
                'default' => 'yes'
            ),
            'title' => array(
                'title' => 'Title',
                'type' => 'text',
                'description' => 'This controls the title which the user sees during checkout.',
                'default' => 'Pay when price drops - Limina',
                'desc_tip' => true,
            ),
            'description' => array(
                'title' => 'Description',
                'type' => 'textarea',
                'description' => 'This controls the description which the user sees during checkout.',
                'default' => 'Set your target price and only pay if items go on sale. No upfront payment required.',
            ),
            'api_url' => array(
                'title' => 'Limina API URL',
                'type' => 'text',
                'description' => 'The base URL for your Limina API endpoint.',
                'default' => 'http://localhost:3000',
                'desc_tip' => true,
            ),
            'max_discount_percentage' => array(
                'title' => 'Max Discount Percentage',
                'type' => 'number',
                'description' => 'Maximum discount percentage customers can request.',
                'default' => 30,
                'custom_attributes' => array(
                    'min' => 5,
                    'max' => 70,
                    'step' => 5
                )
            )
        );
    }

    public function payment_scripts() {
        if (!is_admin() && !is_checkout()) {
            return;
        }

        if ('no' === $this->enabled) {
            return;
        }

        wp_enqueue_style('limina-payment-checkout', LIMINA_PAYMENT_PLUGIN_URL . 'assets/checkout.css', array(), LIMINA_PAYMENT_VERSION);
        wp_enqueue_script('limina-payment-checkout', LIMINA_PAYMENT_PLUGIN_URL . 'assets/checkout.js', array('jquery'), LIMINA_PAYMENT_VERSION, true);
    }

    public function payment_fields() {
        if ($this->description) {
            echo wpautop(wp_kses_post($this->description));
        }

        $cart_items = WC()->cart->get_cart();
        $cart_total = WC()->cart->get_cart_contents_total();
        
        if (empty($cart_items)) {
            echo '<p>Your cart is empty.</p>';
            return;
        }

        ?>
        <div id="limina-payment-fields" class="limina-payment-container">
            <div class="limina-intro">
                <h4>💰 How it works:</h4>
                <ul>
                    <li>✓ Set your target prices for each item below</li>
                    <li>✓ We'll monitor prices for 30 days</li>
                    <li>✓ Pay only when prices drop to your targets</li>
                    <li>✓ No upfront payment or interest</li>
                </ul>
            </div>

            <div class="limina-price-settings">
                <h4>Set your target prices:</h4>
                
                <?php 
                $total_current = 0;
                $total_target = 0;
                
                foreach ($cart_items as $cart_item_key => $cart_item): 
                    $product = $cart_item['data'];
                    $product_id = $product->get_id();
                    $current_price = (float) $product->get_price();
                    $quantity = $cart_item['quantity'];
                    $item_total = $current_price * $quantity;
                    $suggested_target = $current_price * 0.8; // 20% off suggestion
                    
                    $total_current += $item_total;
                    $total_target += $suggested_target * $quantity;
                ?>
                
                <div class="limina-product-row" data-product-id="<?php echo esc_attr($product_id); ?>">
                    <div class="product-info">
                        <div class="product-image">
                            <?php echo $product->get_image('thumbnail'); ?>
                        </div>
                        <div class="product-details">
                            <h5><?php echo esc_html($product->get_name()); ?></h5>
                            <p class="product-meta">
                                Quantity: <?php echo $quantity; ?> | 
                                Current: <?php echo wc_price($current_price); ?> each
                            </p>
                        </div>
                    </div>
                    
                    <div class="price-controls">
                        <label for="target_price_<?php echo $product_id; ?>">Your target price:</label>
                        <div class="price-input-group">
                            <input 
                                type="number" 
                                id="target_price_<?php echo $product_id; ?>"
                                name="limina_target_prices[<?php echo $product_id; ?>]"
                                class="limina-target-price"
                                value="<?php echo number_format($suggested_target, 2, '.', ''); ?>"
                                step="0.01"
                                min="1"
                                max="<?php echo $current_price * 0.95; ?>"
                                data-current-price="<?php echo $current_price; ?>"
                                data-quantity="<?php echo $quantity; ?>"
                            />
                            <span class="currency"><?php echo get_woocommerce_currency_symbol(); ?></span>
                        </div>
                        <div class="savings-display">
                            <span class="savings-amount">Save: <strong><?php echo wc_price($current_price - $suggested_target); ?></strong></span>
                        </div>
                    </div>
                </div>
                
                <?php endforeach; ?>
            </div>

            <div class="limina-totals-summary">
                <div class="totals-row">
                    <span>Current cart total:</span>
                    <span class="current-total"><?php echo wc_price($total_current); ?></span>
                </div>
                <div class="totals-row target-row">
                    <span>Your target total:</span>
                    <span class="target-total"><?php echo wc_price($total_target); ?></span>
                </div>
                <div class="totals-row savings-row">
                    <span>Potential savings:</span>
                    <span class="total-savings">
                        <?php 
                        $savings = $total_current - $total_target;
                        $savings_percent = ($savings / $total_current) * 100;
                        echo wc_price($savings) . ' (' . number_format($savings_percent, 1) . '% off)';
                        ?>
                    </span>
                </div>
            </div>

            <div class="limina-email-field">
                <label for="limina_customer_email">Email for notifications:</label>
                <input 
                    type="email" 
                    id="limina_customer_email" 
                    name="limina_customer_email" 
                    value="<?php echo esc_attr(is_user_logged_in() ? wp_get_current_user()->user_email : ''); ?>"
                    required
                    placeholder="your@email.com"
                />
                <small>We'll notify you when any item drops to your target price</small>
            </div>

            <div class="limina-terms">
                <label>
                    <input type="checkbox" id="limina_accept_terms" name="limina_accept_terms" required />
                    I understand that buy orders expire in 30 days and payment is only required if prices drop to my targets
                </label>
            </div>
        </div>

        <script type="text/javascript">
        jQuery(document).ready(function($) {
            // Update totals when target prices change
            $('.limina-target-price').on('input', function() {
                updateLiminaTotals();
            });

            function updateLiminaTotals() {
                let totalCurrent = 0;
                let totalTarget = 0;

                $('.limina-target-price').each(function() {
                    const currentPrice = parseFloat($(this).data('current-price'));
                    const quantity = parseInt($(this).data('quantity'));
                    const targetPrice = parseFloat($(this).val()) || 0;

                    totalCurrent += currentPrice * quantity;
                    totalTarget += targetPrice * quantity;

                    // Update individual savings display
                    const savings = (currentPrice - targetPrice) * quantity;
                    $(this).closest('.price-controls').find('.savings-amount strong').html('<?php echo get_woocommerce_currency_symbol(); ?>' + savings.toFixed(2));
                });

                const totalSavings = totalCurrent - totalTarget;
                const savingsPercent = totalCurrent > 0 ? (totalSavings / totalCurrent) * 100 : 0;

                $('.target-total').html('<?php echo get_woocommerce_currency_symbol(); ?>' + totalTarget.toFixed(2));
                $('.total-savings').html('<?php echo get_woocommerce_currency_symbol(); ?>' + totalSavings.toFixed(2) + ' (' + savingsPercent.toFixed(1) + '% off)');
            }
        });
        </script>
        <?php
    }

    public function validate_fields() {
        $customer_email = sanitize_email($_POST['limina_customer_email'] ?? '');
        $accept_terms = isset($_POST['limina_accept_terms']);
        $target_prices = $_POST['limina_target_prices'] ?? array();

        if (empty($customer_email) || !is_email($customer_email)) {
            wc_add_notice('Please provide a valid email address for Limina notifications.', 'error');
            return false;
        }

        if (!$accept_terms) {
            wc_add_notice('Please accept the Limina terms to continue.', 'error');
            return false;
        }

        if (empty($target_prices)) {
            wc_add_notice('Please set target prices for your items.', 'error');
            return false;
        }

        // Validate target prices
        $cart_items = WC()->cart->get_cart();
        foreach ($cart_items as $cart_item_key => $cart_item) {
            $product = $cart_item['data'];
            $product_id = $product->get_id();
            $current_price = (float) $product->get_price();
            $target_price = (float) ($target_prices[$product_id] ?? 0);

            if ($target_price <= 0) {
                wc_add_notice(sprintf('Please set a valid target price for %s.', $product->get_name()), 'error');
                return false;
            }

            if ($target_price >= $current_price) {
                wc_add_notice(sprintf('Target price for %s must be lower than current price.', $product->get_name()), 'error');
                return false;
            }
        }

        return true;
    }

    public function process_payment($order_id) {
        $order = wc_get_order($order_id);
        $customer_email = sanitize_email($_POST['limina_customer_email']);
        $target_prices = $_POST['limina_target_prices'] ?? array();

        // Create buy orders for each item
        $buy_orders_created = 0;
        $cart_items = WC()->cart->get_cart();

        foreach ($cart_items as $cart_item_key => $cart_item) {
            $product = $cart_item['data'];
            $product_id = $product->get_id();
            $target_price = (float) ($target_prices[$product_id] ?? 0);
            $current_price = (float) $product->get_price();

            if ($target_price > 0 && $target_price < $current_price) {
                $buy_order_data = array(
                    'woocommerce_product_id' => $product_id,
                    'woocommerce_order_id' => $order_id,
                    'customer_email' => $customer_email,
                    'customer_name' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
                    'target_price' => $target_price,
                    'current_price' => $current_price,
                    'currency' => $order->get_currency(),
                    'quantity' => $cart_item['quantity'],
                    'expires_in_days' => 30,
                    'source' => 'woocommerce_checkout'
                );

                $response = limina_api_create_buy_order($buy_order_data);

                if ($response && $response['success']) {
                    $buy_orders_created++;
                    
                    // Add order note
                    $order->add_order_note(sprintf(
                        'Limina buy order created for %s (target: %s, current: %s)',
                        $product->get_name(),
                        wc_price($target_price),
                        wc_price($current_price)
                    ));
                }
            }
        }

        if ($buy_orders_created > 0) {
            // Set order status to custom Limina monitoring status
            $order->update_status('limina-monitoring', sprintf(
                '%d buy orders created and being monitored by Limina.',
                $buy_orders_created
            ));

            // Empty cart
            WC()->cart->empty_cart();

            // Return success
            return array(
                'result' => 'success',
                'redirect' => $this->get_return_url($order)
            );
        } else {
            wc_add_notice('Unable to create buy orders. Please try again.', 'error');
            return array(
                'result' => 'fail',
                'redirect' => ''
            );
        }
    }

    public function thankyou_page($order_id) {
        $order = wc_get_order($order_id);
        
        if ($order && $order->get_status() === 'limina-monitoring') {
            echo '<div class="limina-thankyou">';
            echo '<h3>🎯 Your buy orders are now being monitored!</h3>';
            echo '<p>We\'ll track prices for the next 30 days and notify you when any item drops to your target price.</p>';
            echo '<div class="limina-next-steps">';
            echo '<h4>What happens next:</h4>';
            echo '<ul>';
            echo '<li>✓ Price monitoring starts immediately</li>';
            echo '<li>✓ You\'ll receive email notifications for price drops</li>';
            echo '<li>✓ Pay only when items reach your target prices</li>';
            echo '<li>✓ Orders expire automatically after 30 days</li>';
            echo '</ul>';
            echo '</div>';
            echo '</div>';
        }
    }
}