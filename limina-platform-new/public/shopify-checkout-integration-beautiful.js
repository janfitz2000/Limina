// Limina Checkout Integration for Shopify - Beautiful Version
(function() {
  'use strict';

  const LIMINA_CHECKOUT_URL = 'http://localhost:3000/checkout-alternative';

  document.addEventListener('DOMContentLoaded', function() {
    // Only run on the cart page
    if (!window.location.pathname.includes('/cart')) return;
    console.log('[Limina] Beautiful checkout widget loading...');
    addLiminaOption();
  });

  function addLiminaOption() {
    // Don't double-inject
    if (document.getElementById('limina-checkout-option')) return;

    // Find Shopify's checkout button (use your working selector)
    const checkoutButton = document.querySelector('#checkout');
    if (!checkoutButton) {
      console.warn('[Limina] #checkout button not found.');
      return;
    }

    // Extract cart items with debugging to understand the double quantity issue
    const cartItems = Array.from(document.querySelectorAll('tr.cart-item'))
      .map((el, index) => {
        const title = el.querySelector('.cart-item__name')?.textContent.trim() || '';
        const priceText = el.querySelector('.cart-item__price-wrapper .price')?.textContent || '';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
        const qtyInput = el.querySelector('input[name="updates[]"]');
        const qty = parseInt(qtyInput?.value, 10) || 1;
        
        // Debug logging to understand the issue
        console.log(`[Limina Debug] Cart item ${index + 1}:`, {
          element: el,
          title,
          priceText,
          price,
          qtyInputValue: qtyInput?.value,
          quantity: qty,
          actualElementsFound: {
            nameElement: !!el.querySelector('.cart-item__name'),
            priceElement: !!el.querySelector('.cart-item__price-wrapper .price'),
            qtyElement: !!qtyInput
          }
        });
        
        // Try to extract Shopify product ID from data attributes or links
        let shopify_id = el.getAttribute('data-product-id') || 
                        el.getAttribute('data-variant-id') ||
                        el.querySelector('[data-product-id]')?.getAttribute('data-product-id') ||
                        el.querySelector('a[href*="/products/"]')?.href?.match(/\/products\/([^\/\?]+)/)?.[1];
        
        return { 
          id: shopify_id || `item-${index}-${title.replace(/\s+/g, '-').toLowerCase()}`,
          shopify_id: shopify_id,
          title, 
          price, 
          quantity: qty 
        };
      })
      .filter(item => item.title && item.price > 0);

    console.log('[Limina Debug] Final cart items:', cartItems);

    if (!cartItems.length) {
      console.warn('[Limina] no cart items found.');
      return;
    }

    // Calculate totals
    const totalPrice = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const targetPrice = totalPrice * 0.8;
    const savings = totalPrice - targetPrice;
    const savingsPercent = ((savings / totalPrice) * 100).toFixed(0);

    // Create beautiful widget
    const liminaOption = document.createElement('div');
    liminaOption.id = 'limina-checkout-option';
    liminaOption.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        padding: 24px;
        margin: 24px 0;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        position: relative;
        overflow: hidden;
        transition: transform 0.3s ease;
      " 
      onmouseover="this.style.transform='translateY(-2px)'"
      onmouseout="this.style.transform='translateY(0)'">
        
        <!-- Animated background elements -->
        <div style="
          position: absolute;
          top: -100px;
          right: -100px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        "></div>
        
        <div style="
          position: absolute;
          bottom: -50px;
          left: -50px;
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
          border-radius: 50%;
          animation: float 4s ease-in-out infinite reverse;
        "></div>

        <div style="position: relative; z-index: 2;">
          <!-- Header -->
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div style="
              background: rgba(255,255,255,0.15);
              border-radius: 12px;
              padding: 12px;
              margin-right: 16px;
              backdrop-filter: blur(10px);
            ">
              <svg width="28" height="28" fill="currentColor" style="display: block;">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2.5" fill="none"/>
              </svg>
            </div>
            <div>
              <h3 style="
                margin: 0; 
                font-size: 22px; 
                font-weight: 800; 
                letter-spacing: -0.5px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
              ">
                💰 Can't afford it right now?
              </h3>
              <p style="
                margin: 4px 0 0; 
                opacity: 0.9; 
                font-size: 15px; 
                font-weight: 500;
              ">
                Pay Later with Limina
              </p>
            </div>
          </div>
          
          <!-- Description -->
          <p style="
            margin: 0 0 24px; 
            line-height: 1.6; 
            font-size: 16px; 
            opacity: 0.95;
          ">
            Set your target prices and only pay when items go on sale.<br>
            <strong style="color: #fef08a;">No upfront payment • No interest • No credit check</strong>
          </p>

          <!-- Pricing Card -->
          <div style="
            background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            backdrop-filter: blur(15px);
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 15px; opacity: 0.9; font-weight: 500;">Current Total:</span>
              <span style="font-size: 18px; font-weight: 700;">$${totalPrice.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <span style="font-size: 15px; opacity: 0.9; font-weight: 500;">Your Target Total:</span>
              <span style="
                font-size: 20px; 
                font-weight: 800; 
                color: #fef08a;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
              ">
                $${targetPrice.toFixed(2)}
              </span>
            </div>
            <div style="
              border-top: 1px solid rgba(255,255,255,0.2);
              padding-top: 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
              <span style="font-weight: 600; color: #fef08a;">Potential Savings:</span>
              <span style="
                font-size: 18px;
                font-weight: 800;
                color: #fef08a;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
              ">
                $${savings.toFixed(2)} (${savingsPercent}% off)
              </span>
            </div>
          </div>

          <!-- CTA Button -->
          <button
            id="limina-checkout-btn"
            style="
              width: 100%;
              padding: 18px 24px;
              background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
              color: #4c1d95;
              border: none;
              border-radius: 12px;
              font-weight: 800;
              font-size: 17px;
              cursor: pointer;
              box-shadow: 0 4px 14px rgba(0,0,0,0.15);
              transition: all 0.3s ease;
              letter-spacing: -0.25px;
              position: relative;
              overflow: hidden;
            "
            onmouseover="
              this.style.transform='translateY(-2px)'; 
              this.style.boxShadow='0 8px 25px rgba(0,0,0,0.2)';
              this.style.background='linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)';
            "
            onmouseout="
              this.style.transform='translateY(0)'; 
              this.style.boxShadow='0 4px 14px rgba(0,0,0,0.15)';
              this.style.background='linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
            "
          >
            <span style="position: relative; z-index: 2;">
              🎯 Set Target Prices & Pay Later
            </span>
          </button>

          <!-- Trust indicators -->
          <div style="
            margin-top: 16px; 
            text-align: center; 
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
          ">
            <span style="
              font-size: 12px; 
              opacity: 0.85; 
              background: rgba(255,255,255,0.1);
              padding: 4px 8px;
              border-radius: 6px;
              font-weight: 500;
            ">✓ 30-day monitoring</span>
            <span style="
              font-size: 12px; 
              opacity: 0.85; 
              background: rgba(255,255,255,0.1);
              padding: 4px 8px;
              border-radius: 6px;
              font-weight: 500;
            ">✓ Instant notifications</span>
            <span style="
              font-size: 12px; 
              opacity: 0.85; 
              background: rgba(255,255,255,0.1);
              padding: 4px 8px;
              border-radius: 6px;
              font-weight: 500;
            ">✓ Pay only on sale</span>
          </div>
        </div>
      </div>

      <style>
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
      </style>
    `;

    // Insert using your working method
    checkoutButton.parentNode.insertBefore(liminaOption, checkoutButton.nextSibling);

    // Add click handler
    liminaOption
      .querySelector('#limina-checkout-btn')
      .addEventListener('click', function() {
        // Add loading state
        this.innerHTML = '<span style="opacity: 0.7;">🚀 Opening Limina...</span>';
        this.style.cursor = 'wait';
        
        const payload = encodeURIComponent(JSON.stringify(cartItems));
        setTimeout(() => {
          window.open(`${LIMINA_CHECKOUT_URL}?cart=${payload}`, '_blank');
          
          // Reset button after a moment
          setTimeout(() => {
            this.innerHTML = '<span style="position: relative; z-index: 2;">🎯 Set Target Prices & Pay Later</span>';
            this.style.cursor = 'pointer';
          }, 1000);
        }, 200);
      });

    console.log('[Limina] Beautiful checkout widget loaded successfully!');
  }

})();