jQuery(document).ready(function($) {
    'use strict';

    let currentPage = 1;
    let currentFilters = {};

    // Initialize admin functionality
    initAdminDashboard();
    initAnalytics();

    function initAdminDashboard() {
        if ($('.limina-orders-table').length === 0) return;

        // Load initial data
        loadBuyOrders();
        loadStats();

        // Filter functionality
        $('#filter-btn').on('click', function() {
            currentFilters = {
                status: $('#status-filter').val(),
                date_from: $('#date-from').val(),
                date_to: $('#date-to').val()
            };
            currentPage = 1;
            loadBuyOrders();
        });

        $('#clear-filters-btn').on('click', function() {
            $('#status-filter').val('');
            $('#date-from').val('');
            $('#date-to').val('');
            currentFilters = {};
            currentPage = 1;
            loadBuyOrders();
        });

        // Pagination
        $('#prev-page').on('click', function() {
            if (currentPage > 1) {
                currentPage--;
                loadBuyOrders();
            }
        });

        $('#next-page').on('click', function() {
            currentPage++;
            loadBuyOrders();
        });

        // Sync products
        $('#sync-products-btn').on('click', function() {
            const $btn = $(this);
            const originalText = $btn.html();
            
            $btn.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> Syncing...');
            
            $.post(limina_admin_ajax.ajax_url, {
                action: 'limina_sync_products',
                nonce: limina_admin_ajax.nonce
            }, function(response) {
                if (response.success) {
                    showNotice('success', response.data.message);
                    loadBuyOrders(); // Refresh the table
                } else {
                    showNotice('error', 'Failed to sync products: ' + (response.data || 'Unknown error'));
                }
            }).always(function() {
                $btn.prop('disabled', false).html(originalText);
            });
        });

        // Modal functionality
        $('.limina-modal-close').on('click', function() {
            $('.limina-modal').hide();
        });

        $(window).on('click', function(e) {
            if ($(e.target).hasClass('limina-modal')) {
                $('.limina-modal').hide();
            }
        });

        // Buy order actions
        $(document).on('click', '.view-buy-order', function(e) {
            e.preventDefault();
            const orderId = $(this).data('order-id');
            showBuyOrderDetails(orderId);
        });

        $(document).on('click', '.cancel-buy-order', function(e) {
            e.preventDefault();
            const orderId = $(this).data('order-id');
            updateBuyOrder(orderId, 'cancel');
        });

        $(document).on('click', '.fulfill-buy-order', function(e) {
            e.preventDefault();
            const orderId = $(this).data('order-id');
            updateBuyOrder(orderId, 'fulfill');
        });
    }

    function loadBuyOrders() {
        const $tableBody = $('#buy-orders-table-body');
        $tableBody.html('<tr><td colspan="10" class="loading">Loading buy orders...</td></tr>');

        const requestData = {
            action: 'limina_get_buy_orders',
            nonce: limina_admin_ajax.nonce,
            page: currentPage,
            ...currentFilters
        };

        $.post(limina_admin_ajax.ajax_url, requestData, function(response) {
            if (response.success && response.data.buy_orders) {
                renderBuyOrdersTable(response.data.buy_orders);
                updatePagination(response.data.pagination || {});
            } else {
                $tableBody.html('<tr><td colspan="10" class="loading">No buy orders found</td></tr>');
            }
        }).fail(function() {
            $tableBody.html('<tr><td colspan="10" class="loading">Failed to load buy orders</td></tr>');
        });
    }

    function renderBuyOrdersTable(buyOrders) {
        const $tableBody = $('#buy-orders-table-body');
        let html = '';

        if (buyOrders.length === 0) {
            html = '<tr><td colspan="10" class="loading">No buy orders found</td></tr>';
        } else {
            buyOrders.forEach(function(order) {
                const product = order.products || {};
                const currentPrice = parseFloat(order.current_price || 0);
                const targetPrice = parseFloat(order.target_price || 0);
                const savings = currentPrice - targetPrice;
                const savingsPercent = currentPrice > 0 ? ((savings / currentPrice) * 100).toFixed(1) : 0;

                html += '<tr>';
                html += '<td><strong>#' + order.id.substring(0, 8) + '</strong></td>';
                html += '<td>';
                html += '<div><strong>' + (order.customer_name || 'Unknown') + '</strong></div>';
                html += '<div><small>' + order.customer_email + '</small></div>';
                html += '</td>';
                html += '<td>';
                html += '<div><strong>' + (product.title || 'Unknown Product') + '</strong></div>';
                if (product.image_url) {
                    html += '<div><img src="' + product.image_url + '" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"></div>';
                }
                html += '</td>';
                html += '<td><strong>$' + currentPrice.toFixed(2) + '</strong></td>';
                html += '<td><strong>$' + targetPrice.toFixed(2) + '</strong></td>';
                html += '<td>';
                html += '<div><strong>$' + savings.toFixed(2) + '</strong></div>';
                html += '<div><small>' + savingsPercent + '% off</small></div>';
                html += '</td>';
                html += '<td><span class="limina-badge limina-' + order.status + '">' + order.status + '</span></td>';
                html += '<td>' + formatDate(order.created_at) + '</td>';
                html += '<td>' + formatDate(order.expires_at) + '</td>';
                html += '<td>';
                html += '<a href="#" class="limina-action-btn view view-buy-order" data-order-id="' + order.id + '">View</a>';
                
                if (order.status === 'monitoring') {
                    html += '<a href="#" class="limina-action-btn cancel cancel-buy-order" data-order-id="' + order.id + '">Cancel</a>';
                    html += '<a href="#" class="limina-action-btn fulfill fulfill-buy-order" data-order-id="' + order.id + '">Fulfill</a>';
                }
                
                html += '</td>';
                html += '</tr>';
            });
        }

        $tableBody.html(html);
    }

    function updatePagination(pagination) {
        const currentPageNum = pagination.current_page || currentPage;
        const totalPages = pagination.total_pages || 1;

        $('#page-info').text('Page ' + currentPageNum + ' of ' + totalPages);
        $('#prev-page').prop('disabled', currentPageNum <= 1);
        $('#next-page').prop('disabled', currentPageNum >= totalPages);
    }

    function loadStats() {
        // This would make an API call to get aggregate statistics
        // For now, we'll use placeholder values
        $('#total-orders').text('--');
        $('#monitoring-orders').text('--');
        $('#fulfilled-orders').text('--');
        $('#total-revenue').text('--');
    }

    function showBuyOrderDetails(orderId) {
        // Load detailed information about the buy order
        const modalHtml = `
            <div><strong>Order ID:</strong> ${orderId}</div>
            <div><strong>Status:</strong> <span class="limina-badge">Loading...</span></div>
            <div><strong>Customer:</strong> Loading...</div>
            <div><strong>Product:</strong> Loading...</div>
            <div><strong>Price Details:</strong></div>
            <ul>
                <li>Current Price: Loading...</li>
                <li>Target Price: Loading...</li>
                <li>Potential Savings: Loading...</li>
            </ul>
            <div><strong>Timeline:</strong></div>
            <ul>
                <li>Created: Loading...</li>
                <li>Expires: Loading...</li>
            </ul>
        `;
        
        $('#buy-order-details').html(modalHtml);
        $('#buy-order-modal').show();
    }

    function updateBuyOrder(orderId, actionType) {
        if (!confirm('Are you sure you want to ' + actionType + ' this buy order?')) {
            return;
        }

        $.post(limina_admin_ajax.ajax_url, {
            action: 'limina_update_buy_order',
            nonce: limina_admin_ajax.nonce,
            buy_order_id: orderId,
            action_type: actionType
        }, function(response) {
            if (response.success) {
                showNotice('success', 'Buy order ' + actionType + 'ed successfully');
                loadBuyOrders(); // Refresh the table
                $('.limina-modal').hide();
            } else {
                showNotice('error', 'Failed to ' + actionType + ' buy order: ' + (response.data || 'Unknown error'));
            }
        });
    }

    function initAnalytics() {
        if ($('.limina-analytics-grid').length === 0) return;

        // Date range functionality
        $('#date-range-select').on('change', function() {
            const value = $(this).val();
            if (value === 'custom') {
                $('#custom-date-range').show();
            } else {
                $('#custom-date-range').hide();
                loadAnalyticsData(value);
            }
        });

        $('#apply-date-range').on('click', function() {
            const dateFrom = $('#analytics-date-from').val();
            const dateTo = $('#analytics-date-to').val();
            
            if (dateFrom && dateTo) {
                loadAnalyticsData('custom', dateFrom, dateTo);
            }
        });

        // Load initial analytics
        loadAnalyticsData(30); // Last 30 days
    }

    function loadAnalyticsData(days, dateFrom = null, dateTo = null) {
        // Placeholder for analytics data loading
        // In a real implementation, this would make API calls to get analytics

        // Conversion Metrics
        $('#conversion-rate').text('--');
        $('#avg-discount').text('--');
        $('#avg-fulfill-time').text('--');

        // Revenue Metrics
        $('#analytics-total-revenue').text('--');
        $('#avg-order-value').text('--');
        $('#revenue-growth').text('--');

        // Customer Insights
        $('#total-customers').text('--');
        $('#repeat-customers').text('--');
        $('#avg-orders-per-customer').text('--');

        // Top Products
        $('#top-products-list').html('Loading analytics data...');
    }

    function showNotice(type, message) {
        const noticeClass = type === 'success' ? 'notice-success' : 'notice-error';
        const notice = $('<div class="notice ' + noticeClass + ' is-dismissible"><p>' + message + '</p></div>');
        
        $('.limina-admin-wrap h1').after(notice);
        
        setTimeout(function() {
            notice.fadeOut(function() {
                notice.remove();
            });
        }, 5000);
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString() + '<br><small>' + date.toLocaleTimeString() + '</small>';
    }

    // Add spinning animation for sync button
    $('<style>')
        .prop('type', 'text/css')
        .html(`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .spin {
                animation: spin 1s linear infinite;
            }
        `)
        .appendTo('head');
});