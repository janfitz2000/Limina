// Limina Debug Script - Use this to diagnose cart extraction issues
(function() {
  'use strict';

  console.log('[Limina Debug] Starting cart analysis...');
  
  // Check if we're on cart page
  if (!window.location.pathname.includes('/cart')) {
    console.log('[Limina Debug] Not on cart page, skipping');
    return;
  }

  document.addEventListener('DOMContentLoaded', function() {
    debugCartStructure();
  });

  function debugCartStructure() {
    console.log('[Limina Debug] === CART STRUCTURE ANALYSIS ===');
    
    // 1. Check for different cart item selectors
    const selectors = [
      'tr.cart-item',
      '.cart-item',
      '.cart__item',
      '[data-testid="cart-item"]',
      '.line-item',
      '.cart-line-item'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`[Limina Debug] Found ${elements.length} elements with selector: ${selector}`);
      
      if (elements.length > 0) {
        elements.forEach((el, index) => {
          console.log(`[Limina Debug] ${selector}[${index}]:`, el);
          
          // Try to find title
          const titleSelectors = [
            '.cart-item__name',
            '.cart-item__title',
            '.cart__item-name',
            '.cart__item-title',
            '.product-title',
            'h3', 'h4', 'a'
          ];
          
          titleSelectors.forEach(titleSel => {
            const titleEl = el.querySelector(titleSel);
            if (titleEl) {
              console.log(`[Limina Debug]   Title (${titleSel}):`, titleEl.textContent.trim());
            }
          });
          
          // Try to find price
          const priceSelectors = [
            '.cart-item__price-wrapper .price',
            '.cart-item__price',
            '.cart__item-price',
            '.price',
            '.money',
            '[data-testid="price"]'
          ];
          
          priceSelectors.forEach(priceSel => {
            const priceEl = el.querySelector(priceSel);
            if (priceEl) {
              console.log(`[Limina Debug]   Price (${priceSel}):`, priceEl.textContent.trim());
            }
          });
          
          // Try to find quantity
          const qtySelectors = [
            'input[name="updates[]"]',
            '.cart-item__qty',
            '.cart__item-quantity',
            '.quantity',
            'input[type="number"]',
            '[data-testid="quantity"]'
          ];
          
          qtySelectors.forEach(qtySel => {
            const qtyEl = el.querySelector(qtySel);
            if (qtyEl) {
              console.log(`[Limina Debug]   Quantity (${qtySel}):`, qtyEl.value || qtyEl.textContent);
            }
          });
          
          console.log('[Limina Debug]   ---');
        });
      }
    });

    // 2. Check for Shopify cart object
    if (window.cart) {
      console.log('[Limina Debug] Found window.cart object:', window.cart);
      if (window.cart.items) {
        console.log('[Limina Debug] Cart items from window.cart:');
        window.cart.items.forEach((item, index) => {
          console.log(`[Limina Debug] Item ${index + 1}:`, {
            id: item.id,
            product_id: item.product_id,
            title: item.product_title,
            variant_title: item.variant_title,
            price: item.price,
            finalPrice: item.final_price,
            quantity: item.quantity,
            priceInDollars: item.price / 100,
            finalPriceInDollars: item.final_price / 100
          });
        });
      }
    } else {
      console.log('[Limina Debug] No window.cart object found');
    }

    // 3. Check for checkout button
    const checkoutSelectors = [
      '#checkout',
      '.btn--checkout',
      '[data-testid="checkout-button"]',
      'input[name="add"]',
      '.cart__checkout',
      'button[type="submit"]'
    ];

    checkoutSelectors.forEach(selector => {
      const btn = document.querySelector(selector);
      if (btn) {
        console.log(`[Limina Debug] Found checkout button with selector: ${selector}`, btn);
      }
    });

    console.log('[Limina Debug] === END ANALYSIS ===');
  }

})();