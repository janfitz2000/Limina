// Limina Payment Gateway - Checkout JavaScript

(function($) {
    'use strict';

    // Initialize when document is ready
    $(document).ready(function() {
        initializeLiminaCheckout();
    });

    function initializeLiminaCheckout() {
        // Update totals when target prices change
        $(document).on('input', '.limina-target-price', function() {
            updateLiminaTotals();
            updateSavingsDisplay($(this));
        });

        // Form validation
        $(document).on('submit', 'form.checkout', function(e) {
            if ($('#payment_method_limina_payment').is(':checked')) {
                if (!validateLiminaForm()) {
                    e.preventDefault();
                    return false;
                }
            }
        });

        // Auto-calculate suggested prices based on percentage
        $('.limina-target-price').each(function() {
            const currentPrice = parseFloat($(this).data('current-price'));
            const suggestedDiscount = 0.2; // 20% off by default
            const suggestedPrice = currentPrice * (1 - suggestedDiscount);
            
            if (!$(this).val() || $(this).val() == '0') {
                $(this).val(suggestedPrice.toFixed(2));
            }
        });

        // Initial totals calculation
        updateLiminaTotals();
    }

    function updateLiminaTotals() {
        let totalCurrent = 0;
        let totalTarget = 0;

        $('.limina-target-price').each(function() {
            const currentPrice = parseFloat($(this).data('current-price')) || 0;
            const quantity = parseInt($(this).data('quantity')) || 1;
            const targetPrice = parseFloat($(this).val()) || 0;

            totalCurrent += currentPrice * quantity;
            totalTarget += targetPrice * quantity;
        });

        const totalSavings = totalCurrent - totalTarget;
        const savingsPercent = totalCurrent > 0 ? (totalSavings / totalCurrent) * 100 : 0;

        // Update display elements
        $('.current-total').html(formatCurrency(totalCurrent));
        $('.target-total').html(formatCurrency(totalTarget));
        $('.total-savings').html(formatCurrency(totalSavings) + ' (' + savingsPercent.toFixed(1) + '% off)');

        // Update savings color based on percentage
        if (savingsPercent >= 20) {
            $('.total-savings').css('color', '#047857'); // Green
        } else if (savingsPercent >= 10) {
            $('.total-savings').css('color', '#f59e0b'); // Orange
        } else {
            $('.total-savings').css('color', '#dc2626'); // Red
        }
    }

    function updateSavingsDisplay(targetPriceInput) {
        const currentPrice = parseFloat(targetPriceInput.data('current-price')) || 0;
        const quantity = parseInt(targetPriceInput.data('quantity')) || 1;
        const targetPrice = parseFloat(targetPriceInput.val()) || 0;
        
        const itemSavings = (currentPrice - targetPrice) * quantity;
        const savingsPercent = currentPrice > 0 ? ((currentPrice - targetPrice) / currentPrice) * 100 : 0;
        
        const savingsDisplay = targetPriceInput.closest('.price-controls').find('.savings-amount strong');
        savingsDisplay.html(formatCurrency(itemSavings) + ' (' + savingsPercent.toFixed(1) + '% off)');
        
        // Visual feedback for savings percentage
        const savingsContainer = targetPriceInput.closest('.price-controls').find('.savings-display');
        if (savingsPercent >= 20) {
            savingsContainer.css('color', '#047857'); // Green
        } else if (savingsPercent >= 10) {
            savingsContainer.css('color', '#f59e0b'); // Orange
        } else {
            savingsContainer.css('color', '#dc2626'); // Red
        }
    }

    function validateLiminaForm() {
        let isValid = true;
        const errors = [];

        // Validate email
        const email = $('#limina_customer_email').val();
        if (!email || !isValidEmail(email)) {
            errors.push('Please provide a valid email address.');
            isValid = false;
        }

        // Validate terms acceptance
        if (!$('#limina_accept_terms').is(':checked')) {
            errors.push('Please accept the terms to continue.');
            isValid = false;
        }

        // Validate target prices
        $('.limina-target-price').each(function() {
            const currentPrice = parseFloat($(this).data('current-price')) || 0;
            const targetPrice = parseFloat($(this).val()) || 0;
            const productName = $(this).closest('.limina-product-row').find('.product-details h5').text();

            if (targetPrice <= 0) {
                errors.push('Please set a valid target price for ' + productName + '.');
                isValid = false;
            } else if (targetPrice >= currentPrice) {
                errors.push('Target price for ' + productName + ' must be lower than current price.');
                isValid = false;
            }
        });

        // Display errors
        if (!isValid) {
            displayErrors(errors);
        }

        return isValid;
    }

    function displayErrors(errors) {
        $('.woocommerce-error, .woocommerce-message').remove();
        
        let errorHtml = '<ul class="woocommerce-error" role="alert">';
        errors.forEach(function(error) {
            errorHtml += '<li>' + error + '</li>';
        });
        errorHtml += '</ul>';
        
        $('.woocommerce-notices-wrapper').html(errorHtml);
        
        // Scroll to top to show errors
        $('html, body').animate({
            scrollTop: $('.woocommerce-notices-wrapper').offset().top - 100
        }, 500);
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function formatCurrency(amount) {
        // Get currency symbol from WordPress localization or default to $
        const currencySymbol = window.limina_checkout_params?.currency_symbol || '$';
        return currencySymbol + amount.toFixed(2);
    }

    // Handle payment method selection
    $(document).on('change', 'input[name="payment_method"]', function() {
        if ($(this).val() === 'limina_payment') {
            // Show Limina-specific messaging
            showLiminaInstructions();
        }
    });

    function showLiminaInstructions() {
        // Add any additional instructions when Limina is selected
        if (!$('.limina-payment-instructions').length) {
            const instructions = $('<div class="limina-payment-instructions" style="background: #e0f2fe; padding: 10px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #0284c7;">' +
                '<strong>💡 Limina Pay Later:</strong> Set your target prices below. You\'ll only pay if items drop to your targets within 30 days.' +
                '</div>');
            $('#limina-payment-fields').prepend(instructions);
        }
    }

    // Auto-update email field for logged-in users
    if (window.limina_checkout_params?.user_email) {
        $('#limina_customer_email').val(window.limina_checkout_params.user_email);
    }

})(jQuery);