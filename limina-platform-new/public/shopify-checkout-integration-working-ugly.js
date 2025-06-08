// Limina Checkout Integration for Shopify
(function() {
  'use strict';

  // Change this to your real Limina checkout endpoint:
  const LIMINA_CHECKOUT_URL = 'http://localhost:3000/checkout-alternative';

  document.addEventListener('DOMContentLoaded', function() {
    // Only run on the cart page
    if (!window.location.pathname.includes('/cart')) return;
    console.log('[Limina] script loaded on', window.location.pathname);
    addLiminaOption();
  });

  function addLiminaOption() {
    // Don’t double-inject
    if (document.getElementById('limina-checkout-option')) return;

    // Shopify’s native checkout button in your theme:
    const checkoutButton = document.querySelector('#checkout');
    if (!checkoutButton) {
      console.warn('[Limina] #checkout button not found.');
      return;
    }

    // Gather cart items from your theme’s <tr class="cart-item"> rows:
    const cartItems = Array.from(document.querySelectorAll('tr.cart-item'))
      .map(el => {
        const title = el.querySelector('.cart-item__name')?.textContent.trim() || '';
        const priceText = el.querySelector('.cart-item__price-wrapper .price')?.textContent || '';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
        const qty    = parseInt(el.querySelector('input[name="updates[]"]')?.value, 10) || 1;
        return { title, price, quantity: qty };
      })
      .filter(item => item.title);

    if (!cartItems.length) {
      console.warn('[Limina] no cart items found.');
      return;
    }

    // Calculate totals
    const totalPrice  = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);
    const targetPrice = (totalPrice * 0.8).toFixed(2);

    // Build the Limina widget
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
        box-shadow: 0 4px 12px rgba(99,102,241,0.15);
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
              <h3 style="margin: 0; font-size: 20px; font-weight: 700;">
                💰 Can’t afford it right now?
              </h3>
              <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">
                Pay Later with Limina
              </p>
            </div>
          </div>
          <p style="margin: 0 0 20px; line-height: 1.5; font-size: 15px; opacity: 0.95;">
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
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <span style="font-size:14px;opacity:0.9;">Current Total:</span>
              <span style="font-size:16px;font-weight:600;">$${totalPrice}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:14px;opacity:0.9;">Potential Target (~20% off):</span>
              <span style="font-size:18px;font-weight:700;color:#fef08a;">$${targetPrice}</span>
            </div>
          </div>
          <button
            id="limina-checkout-btn"
            style="
              width:100%;
              padding:16px;
              background:#fff;
              color:#6366f1;
              border:none;
              border-radius:8px;
              font-weight:700;
              font-size:16px;
              cursor:pointer;
              box-shadow:0 2px 4px rgba(0,0,0,0.1);
              transition:all 0.2s ease;
            "
            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'"
          >
            🎯 Set Target Prices & Pay Later
          </button>
          <p style="text-align:center; font-size:12px; opacity:0.8; margin-top:12px;">
            ✓ Monitor prices for 30 days ✓ Get notified when prices drop ✓ Only pay when on sale
          </p>
        </div>
      </div>
    `;

    // Insert it right after Shopify’s Checkout button
    checkoutButton.parentNode.insertBefore(liminaOption, checkoutButton.nextSibling);

    // Wire up the click action
    liminaOption
      .querySelector('#limina-checkout-btn')
      .addEventListener('click', function() {
        const payload = encodeURIComponent(JSON.stringify(cartItems));
        window.open(`${LIMINA_CHECKOUT_URL}?cart=${payload}`, '_blank');
      });
  }

})();