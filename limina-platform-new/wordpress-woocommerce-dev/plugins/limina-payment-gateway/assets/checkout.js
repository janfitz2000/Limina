jQuery(document).ready(function($) {
    'use strict';

    // Initialize Limina payment fields behavior
    function initLiminaPaymentFields() {
        const $liminaFields = $('#limina-payment-fields');
        
        if ($liminaFields.length === 0) {
            return;
        }

        // Update totals when target prices change
        $('.limina-target-price').on('input change', function() {
            updateLiminaTotals();
            validateTargetPrice($(this));
        });

        // Initialize totals
        updateLiminaTotals();

        // Validate email format
        $('#limina_customer_email').on('blur', function() {
            validateEmail($(this));
        });

        // Handle form submission
        $('form.checkout').on('submit', function() {
            if ($('input[name="payment_method"]:checked').val() === 'limina_payment') {
                return validateLiminaForm();
            }
        });
    }

    function updateLiminaTotals() {
        let totalCurrent = 0;
        let totalTarget = 0;

        $('.limina-target-price').each(function() {
            const $input = $(this);
            const currentPrice = parseFloat($input.data('current-price')) || 0;
            const quantity = parseInt($input.data('quantity')) || 1;
            const targetPrice = parseFloat($input.val()) || 0;

            totalCurrent += currentPrice * quantity;
            totalTarget += targetPrice * quantity;

            // Update individual savings display
            const savings = (currentPrice - targetPrice) * quantity;
            const savingsText = savings > 0 ? 
                getCurrencySymbol() + savings.toFixed(2) : 
                getCurrencySymbol() + '0.00';
            
            $input.closest('.price-controls').find('.savings-amount strong').text(savingsText);
            
            // Add visual feedback for savings
            const $savingsDisplay = $input.closest('.price-controls').find('.savings-display');
            if (savings > 0) {
                $savingsDisplay.addClass('positive-savings');
            } else {
                $savingsDisplay.removeClass('positive-savings');
            }
        });

        const totalSavings = totalCurrent - totalTarget;
        const savingsPercent = totalCurrent > 0 ? (totalSavings / totalCurrent) * 100 : 0;

        // Update totals display
        $('.target-total').text(getCurrencySymbol() + totalTarget.toFixed(2));
        $('.total-savings').html(
            getCurrencySymbol() + totalSavings.toFixed(2) + 
            ' (' + savingsPercent.toFixed(1) + '% off)'
        );

        // Visual feedback for total savings
        const $savingsRow = $('.savings-row');
        if (totalSavings > 0) {
            $savingsRow.addClass('positive-savings');
        } else {
            $savingsRow.removeClass('positive-savings');
        }
    }

    function validateTargetPrice($input) {
        const currentPrice = parseFloat($input.data('current-price')) || 0;
        const targetPrice = parseFloat($input.val()) || 0;
        const minPrice = 1;
        const maxPrice = currentPrice * 0.95; // Max 95% of current price

        $input.removeClass('error success');

        if (targetPrice <= 0) {
            $input.addClass('error');
            showFieldError($input, 'Please enter a valid target price');
            return false;
        }

        if (targetPrice < minPrice) {
            $input.addClass('error');
            showFieldError($input, 'Target price must be at least ' + getCurrencySymbol() + minPrice.toFixed(2));
            return false;
        }

        if (targetPrice >= currentPrice) {
            $input.addClass('error');
            showFieldError($input, 'Target price must be lower than current price');
            return false;
        }

        if (targetPrice > maxPrice) {
            $input.addClass('error');
            showFieldError($input, 'Target price too high. Maximum: ' + getCurrencySymbol() + maxPrice.toFixed(2));
            return false;
        }

        $input.addClass('success');
        hideFieldError($input);
        return true;
    }

    function validateEmail($input) {
        const email = $input.val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        $input.removeClass('error success');

        if (!email) {
            $input.addClass('error');
            showFieldError($input, 'Email address is required');
            return false;
        }

        if (!emailRegex.test(email)) {
            $input.addClass('error');
            showFieldError($input, 'Please enter a valid email address');
            return false;
        }

        $input.addClass('success');
        hideFieldError($input);
        return true;
    }

    function validateLiminaForm() {
        let isValid = true;

        // Validate email
        const $emailInput = $('#limina_customer_email');
        if (!validateEmail($emailInput)) {
            isValid = false;
        }

        // Validate target prices
        $('.limina-target-price').each(function() {
            if (!validateTargetPrice($(this))) {
                isValid = false;
            }
        });

        // Check terms acceptance
        const $termsCheckbox = $('#limina_accept_terms');
        if (!$termsCheckbox.is(':checked')) {
            showFieldError($termsCheckbox.parent(), 'Please accept the terms to continue');
            isValid = false;
        } else {
            hideFieldError($termsCheckbox.parent());
        }

        if (!isValid) {
            // Scroll to first error
            const $firstError = $('.error').first();
            if ($firstError.length) {
                $('html, body').animate({
                    scrollTop: $firstError.offset().top - 100
                }, 300);
            }
        }

        return isValid;
    }

    function showFieldError($field, message) {
        const $errorDiv = $field.siblings('.limina-field-error');
        if ($errorDiv.length) {
            $errorDiv.text(message).show();
        } else {
            $field.after('<div class="limina-field-error" style="color: #ff6b6b; font-size: 12px; margin-top: 4px;">' + message + '</div>');
        }
    }

    function hideFieldError($field) {
        $field.siblings('.limina-field-error').hide();
    }

    function getCurrencySymbol() {
        // Try to get currency symbol from WooCommerce
        if (typeof wc_checkout_params !== 'undefined' && wc_checkout_params.currency_symbol) {
            return wc_checkout_params.currency_symbol;
        }
        
        // Fallback to detecting from page content
        const $priceElement = $('.woocommerce-Price-amount').first();
        if ($priceElement.length) {
            const priceText = $priceElement.text();
            const match = priceText.match(/^([^\d\s]+)/);
            if (match) {
                return match[1];
            }
        }
        
        // Default fallback
        return '$';
    }

    // Add some CSS classes for visual feedback
    $('<style>')
        .prop('type', 'text/css')
        .html(`
            .limina-target-price.error {
                border: 2px solid #ff6b6b !important;
                background-color: #ffe6e6 !important;
            }
            .limina-target-price.success {
                border: 2px solid #51cf66 !important;
                background-color: #e6ffe6 !important;
            }
            #limina_customer_email.error {
                border: 2px solid #ff6b6b !important;
                background-color: #ffe6e6 !important;
            }
            #limina_customer_email.success {
                border: 2px solid #51cf66 !important;
                background-color: #e6ffe6 !important;
            }
            .positive-savings {
                animation: pulse-green 1s ease-in-out;
            }
            @keyframes pulse-green {
                0% { background-color: rgba(34, 197, 94, 0.2); }
                50% { background-color: rgba(34, 197, 94, 0.4); }
                100% { background-color: transparent; }
            }
        `)
        .appendTo('head');

    // Initialize when payment method changes
    $(document.body).on('payment_method_selected', function() {
        setTimeout(initLiminaPaymentFields, 100);
    });

    // Initialize immediately if Limina is pre-selected
    initLiminaPaymentFields();

    // Handle checkout updates (when cart changes)
    $(document.body).on('updated_checkout', function() {
        setTimeout(initLiminaPaymentFields, 100);
    });
});