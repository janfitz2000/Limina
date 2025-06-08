// Limina Debug - Exact copy of working logic with debug output
(function() {
  'use strict';

  const LIMINA_CHECKOUT_URL = 'http://localhost:3001/checkout-alternative';

  document.addEventListener('DOMContentLoaded', function() {
    // Only run on the cart page
    if (!window.location.pathname.includes('/cart')) return;
    console.log('[Limina Simple] script loaded on', window.location.pathname);
    addLiminaOption();
  });

  function addLiminaOption() {
    // Don't double-inject
    if (document.getElementById('limina-checkout-option-simple')) return;

    // Shopify's native checkout button in your theme:
    const checkoutButton = document.querySelector('#checkout');
    if (!checkoutButton) {
      console.warn('[Limina Simple] #checkout button not found.');
      return;
    }

    console.log('[Limina Simple] Found checkout button:', checkoutButton);

    // Gather cart items EXACTLY like the working version
    console.log('[Limina Simple] Looking for tr.cart-item elements...');
    const cartItemElements = document.querySelectorAll('tr.cart-item');
    console.log('[Limina Simple] Found cart item elements:', cartItemElements.length, cartItemElements);

    const cartItems = Array.from(cartItemElements)
      .map((el, index) => {
        console.log(`[Limina Simple] Processing element ${index + 1}:`, el);
        console.log(`[Limina Simple] Element HTML:`, el.outerHTML.substring(0, 200) + '...');
        
        const nameEl = el.querySelector('.cart-item__name');
        const title = nameEl?.textContent.trim() || '';
        console.log(`[Limina Simple] Title element:`, nameEl, 'Text:', title);
        
        const priceEl = el.querySelector('.cart-item__price-wrapper .price');
        const priceText = priceEl?.textContent || '';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
        console.log(`[Limina Simple] Price element:`, priceEl, 'Text:', priceText, 'Parsed:', price);
        
        const qtyEl = el.querySelector('input[name="updates[]"]');
        const qty = parseInt(qtyEl?.value, 10) || 1;
        console.log(`[Limina Simple] Qty element:`, qtyEl, 'Value:', qtyEl?.value, 'Parsed:', qty);
        
        // Try to get a unique identifier for deduplication
        const productId = el.getAttribute('data-variant-id') || 
                         el.getAttribute('data-product-id') ||
                         el.querySelector('[data-variant-id]')?.getAttribute('data-variant-id') ||
                         el.querySelector('input[name="updates[]"]')?.getAttribute('data-quantity-variant-id') ||
                         title.replace(/\s+/g, '-').toLowerCase();
        
        const result = { 
          id: productId,
          title, 
          price, 
          quantity: qty 
        };
        console.log(`[Limina Simple] Final item ${index + 1}:`, result);
        
        return result;
      })
      .filter(item => {
        const keep = item.title && item.price > 0;
        console.log('[Limina Simple] Keeping item?', keep, item);
        return keep;
      })
      // Deduplicate items by combining quantities for the same product
      .reduce((acc, item) => {
        const existingItem = acc.find(existing => existing.id === item.id && existing.title === item.title);
        if (existingItem) {
          console.log('[Limina Simple] Found duplicate, combining quantities:', existingItem, item);
          existingItem.quantity += item.quantity;
          return acc;
        } else {
          return [...acc, item];
        }
      }, []);

    console.log('[Limina Simple] Final cart items array:', cartItems);

    if (!cartItems.length) {
      console.warn('[Limina Simple] no cart items found.');
      return;
    }

    // Calculate totals exactly like working version
    const totalPrice = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);
    const targetPrice = (totalPrice * 0.8).toFixed(2);
    
    console.log('[Limina Simple] Totals - Current:', totalPrice, 'Target:', targetPrice);

    // Create simple test widget
    const liminaOption = document.createElement('div');
    liminaOption.id = 'limina-checkout-option-simple';
    liminaOption.innerHTML = `
      <div style="background: red; color: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3>🔧 LIMINA DEBUG - SIMPLE VERSION</h3>
        <p>Found ${cartItems.length} items</p>
        <p>Total: $${totalPrice}</p>
        <p>Target: $${targetPrice}</p>
        <button id="limina-simple-btn" style="background: white; color: red; padding: 10px; border: none; border-radius: 4px; cursor: pointer; margin: 10px 0;">
          🚀 Test Cart Data
        </button>
        <pre id="cart-debug" style="background: rgba(0,0,0,0.3); padding: 10px; margin-top: 10px; font-size: 12px; overflow: auto; max-height: 200px;">${JSON.stringify(cartItems, null, 2)}</pre>
      </div>
    `;

    // Insert it exactly like working version
    checkoutButton.parentNode.insertBefore(liminaOption, checkoutButton.nextSibling);

    // Wire up the click action
    liminaOption
      .querySelector('#limina-simple-btn')
      .addEventListener('click', function() {
        console.log('[Limina Simple] Button clicked, cart items:', cartItems);
        const payload = encodeURIComponent(JSON.stringify(cartItems));
        console.log('[Limina Simple] Opening URL:', `${LIMINA_CHECKOUT_URL}?cart=${payload}`);
        window.open(`${LIMINA_CHECKOUT_URL}?cart=${payload}`, '_blank');
      });
      
    console.log('[Limina Simple] Widget added successfully');
  }

})();