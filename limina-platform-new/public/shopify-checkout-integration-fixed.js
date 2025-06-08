// Limina Checkout Integration - Fixed Version
(function() {
  'use strict';

  const LIMINA_CHECKOUT_URL = 'http://localhost:3000/checkout-alternative';

  document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.includes('/cart')) return;
    console.log('[Limina Fixed] Loading...');
    addLiminaOption();
  });

  function addLiminaOption() {
    if (document.getElementById('limina-checkout-option-fixed')) return;

    const checkoutButton = document.querySelector('#checkout');
    if (!checkoutButton) {
      console.warn('[Limina Fixed] #checkout button not found.');
      return;
    }

    // Fix: Only get cart items from the main cart page, not the drawer
    console.log('[Limina Fixed] Looking for cart items only on main cart page...');
    
    // Find the main cart form (not the drawer)
    const mainCartForm = document.querySelector('form[action="/cart"]') || 
                        document.querySelector('form.cart') ||
                        document.querySelector('#cart-form');
    
    if (!mainCartForm) {
      console.warn('[Limina Fixed] Main cart form not found');
      return;
    }
    
    console.log('[Limina Fixed] Found main cart form:', mainCartForm);
    
    // Debug: Check what's inside the cart form
    console.log('[Limina Fixed] Cart form HTML preview:', mainCartForm.innerHTML.substring(0, 1000) + '...');
    
    // Try different selectors to find cart items
    const possibleSelectors = [
      'tr.cart-item',
      '.cart-item',
      'tr[class*="cart"]',
      'tr[id*="cart"]',
      'tr[id*="Cart"]',
      '.line-item',
      '[data-line-item]'
    ];
    
    let cartItemElements = [];
    for (const selector of possibleSelectors) {
      const elements = mainCartForm.querySelectorAll(selector);
      console.log(`[Limina Fixed] Selector "${selector}" found ${elements.length} elements`);
      if (elements.length > 0) {
        cartItemElements = Array.from(elements);
        console.log(`[Limina Fixed] Using selector: ${selector}`);
        break;
      }
    }
    
    if (cartItemElements.length === 0) {
      console.warn('[Limina Fixed] No cart items found with any selector. Checking all children:');
      const allChildren = mainCartForm.children;
      console.log('[Limina Fixed] All direct children of cart form:', Array.from(allChildren).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id
      })));
      return;
    }
    
    // Only look for cart items within the main cart form
    const cartItems = cartItemElements
      .map((el, index) => {
        const title = el.querySelector('.cart-item__name')?.textContent.trim() || '';
        const priceText = el.querySelector('.cart-item__price-wrapper .price')?.textContent || '';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
        const qty = parseInt(el.querySelector('input[name="updates[]"]')?.value, 10) || 1;
        
        // Look deeper into the HTML structure to find product identifiers
        const productLink = el.querySelector('a[href*="/products/"]');
        const productHandle = productLink?.href?.match(/\/products\/([^\/\?]+)/)?.[1];
        
        // Look for any input fields that might contain IDs
        const allInputs = el.querySelectorAll('input');
        const inputData = Array.from(allInputs).map(input => ({
          name: input.name,
          value: input.value,
          id: input.id,
          attributes: Array.from(input.attributes).map(attr => ({ name: attr.name, value: attr.value }))
        }));

        // Look for any elements with data attributes inside the cart item
        const allElements = el.querySelectorAll('*');
        const dataElements = Array.from(allElements)
          .filter(elem => Object.keys(elem.dataset).length > 0)
          .map(elem => ({
            tagName: elem.tagName,
            dataset: elem.dataset,
            attributes: Array.from(elem.attributes).filter(attr => attr.name.startsWith('data-'))
          }));

        console.log(`[Limina Fixed] Deep debugging cart item ${index + 1}:`, {
          productLink: productLink?.href,
          productHandle,
          allInputs: inputData,
          elementsWithDataAttributes: dataElements,
          fullHTML: el.innerHTML.substring(0, 800) + (el.innerHTML.length > 800 ? '...' : '')
        });

        // Try to extract product ID from various sources
        let shopify_id = null;
        
        // Method 1: Check for product handle in URL
        if (productHandle && !shopify_id) {
          shopify_id = productHandle; // We might need to use handle instead of numeric ID
        }
        
        // Method 2: Look for any input with variant or product ID
        const variantInput = el.querySelector('input[name*="id"]') || 
                           el.querySelector('input[id*="Quantity"]') ||
                           el.querySelector('input[name*="updates"]');
        
        if (variantInput && !shopify_id) {
          // The updates[] input might have the variant ID in its position
          const updateMatch = variantInput.name?.match(/updates\[(\d+)\]/);
          if (updateMatch) {
            shopify_id = updateMatch[1]; // This might be variant ID
          }
        }
        
        // Method 3: Look for data attributes in child elements
        const dataElement = el.querySelector('[data-product-id], [data-variant-id], [data-key]');
        if (dataElement && !shopify_id) {
          shopify_id = dataElement.dataset.productId || 
                      dataElement.dataset.variantId || 
                      dataElement.dataset.key;
        }
        
        console.log(`[Limina Fixed] Cart item ${index + 1}:`, {
          title, 
          price, 
          quantity: qty,
          shopify_id,
          productHandle,
          productLink: productLink?.href,
          inMainCart: true
        });
        
        return { 
          id: shopify_id || `item-${index}`,
          shopify_id: shopify_id,
          title, 
          price, 
          quantity: qty 
        };
      })
      .filter(item => item.title && item.price > 0);

    console.log('[Limina Fixed] Final cart items:', cartItems);

    if (!cartItems.length) {
      console.warn('[Limina Fixed] No cart items found');
      return;
    }

    // Calculate totals
    const totalPrice = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const targetPrice = totalPrice * 0.8;
    const savings = totalPrice - targetPrice;
    const savingsPercent = ((savings / totalPrice) * 100).toFixed(0);

    // Create beautiful widget (same as your working ugly version but styled)
    const liminaOption = document.createElement('div');
    liminaOption.id = 'limina-checkout-option-fixed';
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
      ">
        <div style="position: relative; z-index: 2;">
          <h3 style="margin: 0 0 16px; font-size: 22px; font-weight: 800;">
            💰 Can't afford it right now?
          </h3>
          <p style="margin: 0 0 20px; line-height: 1.6; font-size: 16px; opacity: 0.95;">
            Set your target prices and only pay when items go on sale.<br>
            <strong style="color: #fef08a;">No upfront payment • No interest • No credit check</strong>
          </p>
          
          <div style="
            background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
          ">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span>Current Total:</span>
              <span style="font-weight: 700;">$${totalPrice.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
              <span>Your Target Total:</span>
              <span style="font-weight: 800; color: #fef08a;">$${targetPrice.toFixed(2)}</span>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 600; color: #fef08a;">Potential Savings:</span>
                <span style="font-weight: 800; color: #fef08a;">
                  $${savings.toFixed(2)} (${savingsPercent}% off)
                </span>
              </div>
            </div>
          </div>

          <button
            id="limina-fixed-btn"
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
            "
          >
            🎯 Set Target Prices & Pay Later
          </button>
          
          <div style="margin-top: 16px; text-align: center; font-size: 12px; opacity: 0.85;">
            ✓ 30-day monitoring ✓ Instant notifications ✓ Pay only on sale
          </div>
        </div>
      </div>
    `;

    checkoutButton.parentNode.insertBefore(liminaOption, checkoutButton.nextSibling);

    // Add click handler - simplified
    document.getElementById('limina-fixed-btn').addEventListener('click', function() {
      console.log('[Limina Fixed] Button clicked, cart items:', cartItems);
      try {
        const payload = encodeURIComponent(JSON.stringify(cartItems));
        const url = `${LIMINA_CHECKOUT_URL}?cart=${payload}`;
        console.log('[Limina Fixed] Opening URL:', url);
        window.open(url, '_blank');
      } catch (error) {
        console.error('[Limina Fixed] Error opening checkout:', error);
        alert('Error opening checkout: ' + error.message);
      }
    });

    console.log('[Limina Fixed] Widget loaded successfully!');
  }

})();