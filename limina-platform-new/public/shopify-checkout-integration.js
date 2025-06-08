// Limina Checkout Integration for Shopify
// Adds "Pay Later with Limina" option to checkout page

(function() {
  'use strict';

  const LIMINA_CHECKOUT_URL = 'http://localhost:3000/checkout-alternative';

  // Only run on checkout pages
  if (!window.location.pathname.includes('/checkout') && !window.location.pathname.includes('/cart')) {
    return;
  }

  // Wait for checkout to load
  function waitForCheckout() {
    const checkoutForm = document.querySelector('form[action*="/cart"]') ||
                        document.querySelector('.cart-form') ||
                        document.querySelector('#cart-form') ||
                        document.querySelector('[data-testid="cart-form"]');

    if (checkoutForm) {
      addLiminaOption();
    } else {
      setTimeout(waitForCheckout, 500);
    }
  }

  function addLiminaOption() {
    // Don't add if already exists
    if (document.getElementById('limina-checkout-option')) {
      return;
    }

    // Get cart data
    const cartData = getCartData();
    if (!cartData || cartData.length === 0) {
      return;
    }

    // Create Limina checkout option
    const liminaOption = document.createElement('div');
    liminaOption.id = 'limina-checkout-option';
    liminaOption.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          pointer-events: none;
        "></div>
        
        <div style="position: relative; z-index: 1;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="
              background: rgba(255,255,255,0.2);
              border-radius: 50%;
              padding: 8px;
              margin-right: 12px;
            ">
              <svg width="24" height="24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">
                💰 Can't afford it right now?
              </h3>
              <p style="margin: 2px 0 0; opacity: 0.9; font-size: 14px;">
                Pay Later with Limina
              </p>
            </div>
          </div>
          
          <p style="margin: 0 0 20px; opacity: 0.95; line-height: 1.5; font-size: 15px;">
            Set your target prices and only pay when items go on sale. 
            <strong>No upfront payment • No interest • No credit check</strong>
          </p>

          <div style="
            background: rgba(255,255,255,0.15);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 14px; opacity: 0.9;">Current Total:</span>
              <span style="font-size: 16px; font-weight: 600;">${getTotalPrice()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 14px; opacity: 0.9;">Potential Target (~20% off):</span>
              <span style="font-size: 18px; font-weight: 700; color: #fef08a;">
                $${(getTotalPrice() * 0.8).toFixed(2)}
              </span>
            </div>
          </div>

          <button 
            id="limina-checkout-btn"
            style="
              width: 100%;
              padding: 16px;
              background: #ffffff;
              color: #6366f1;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 700;
              font-size: 16px;
              transition: all 0.2s ease;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            "
            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'"
          >
            🎯 Set Target Prices & Pay Later
          </button>

          <div style="margin-top: 15px; text-align: center;">
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">
              ✓ Monitor prices for 30 days ✓ Get notified when prices drop ✓ Only pay when on sale
            </p>
          </div>
        </div>
      </div>
    `;

    // Find where to insert (usually near checkout buttons)
    const checkoutButton = document.querySelector('button[name="add"]') ||
                          document.querySelector('.btn--checkout') ||
                          document.querySelector('[data-testid="checkout-button"]') ||
                          document.querySelector('input[name="add"]') ||
                          document.querySelector('.cart__checkout');

    if (checkoutButton) {
      checkoutButton.parentNode.insertBefore(liminaOption, checkoutButton.nextSibling);
    } else {
      // Fallback: add to end of form
      const form = document.querySelector('form') || document.body;
      form.appendChild(liminaOption);
    }

    // Add click handler
    document.getElementById('limina-checkout-btn').addEventListener('click', function() {
      const cart = getCartData();
      const cartParam = encodeURIComponent(JSON.stringify(cart));
      window.open(`${LIMINA_CHECKOUT_URL}?cart=${cartParam}`, '_blank');
    });
  }

  function getCartData() {
    const cartItems = [];
    
    // Try to get cart data from various sources
    if (window.cart && window.cart.items) {
      // Shopify cart object
      cartItems.push(...window.cart.items.map(item => ({
        id: item.id,
        shopify_id: item.product_id,
        title: item.product_title,
        price: item.price / 100,
        quantity: item.quantity,
        variant: item.variant_title,
        image: item.image
      })));
    } else {
      // Try to scrape from DOM
      const itemElements = document.querySelectorAll('.cart-item, .cart__item, [data-testid="cart-item"]');
      
      itemElements.forEach((element, index) => {
        const titleEl = element.querySelector('.cart-item__title, .cart__item-title, h3, h4') ||
                       element.querySelector('[data-testid="product-title"]');
        const priceEl = element.querySelector('.cart-item__price, .cart__item-price, .price') ||
                       element.querySelector('[data-testid="product-price"]');
        const qtyEl = element.querySelector('.cart-item__qty, .cart__item-quantity, .quantity, input[type="number"]') ||
                     element.querySelector('[data-testid="quantity"]');

        if (titleEl && priceEl) {
          const title = titleEl.textContent.trim();
          const priceText = priceEl.textContent.replace(/[^\d.,]/g, '');
          const price = parseFloat(priceText) || 0;
          const quantity = qtyEl ? parseInt(qtyEl.value || qtyEl.textContent) || 1 : 1;

          cartItems.push({
            id: `item-${index}`,
            title: title,
            price: price,
            quantity: quantity,
            variant: 'Default'
          });
        }
      });
    }

    return cartItems;
  }

  function getTotalPrice() {
    // Try to get total from Shopify cart
    if (window.cart && window.cart.total_price) {
      return (window.cart.total_price / 100).toFixed(2);
    }

    // Try to scrape total from DOM
    const totalEl = document.querySelector('.cart-total, .cart__total, .total-price') ||
                   document.querySelector('[data-testid="cart-total"]') ||
                   document.querySelector('.subtotal__price');

    if (totalEl) {
      const totalText = totalEl.textContent.replace(/[^\d.,]/g, '');
      return parseFloat(totalText).toFixed(2) || '0.00';
    }

    // Calculate from cart items
    const cartData = getCartData();
    const total = cartData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return total.toFixed(2);
  }

  // Start the integration
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForCheckout);
  } else {
    waitForCheckout();
  }

  // Also watch for dynamic changes (SPAs)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        setTimeout(waitForCheckout, 100);
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();