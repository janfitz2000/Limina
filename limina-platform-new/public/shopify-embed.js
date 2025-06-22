// Limina Buy Orders Widget for Shopify
// This script can be embedded in any Shopify product page

(function() {
  'use strict';

  const LIMINA_API_BASE = 'https://your-domain.com'; // Replace with your domain

  // Only run on product pages
  if (!window.meta || !window.meta.product) {
    return;
  }

  const product = window.meta.product;

  // Create widget HTML
  const widgetHTML = `
    <div id="limina-buy-order-widget" style="
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border: 1px solid #ddd;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    ">
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <svg width="24" height="24" fill="currentColor" style="margin-right: 10px;">
          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L6 8H2m5 5v6a1 1 0 001 1h8a1 1 0 001-1v-6m-9 0V9a3 3 0 013-3h4a3 3 0 013 3v4.01M9 21h6"/>
        </svg>
        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">
          Can't afford it right now?
        </h3>
      </div>
      
      <p style="margin: 0 0 15px; opacity: 0.9; line-height: 1.4;">
        Make an offer and we'll notify you when <strong>${product.title}</strong> drops to your target price!
      </p>

      <div id="limina-offer-form" style="display: none;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-size: 14px; font-weight: 500;">
              📧 Email Address *
            </label>
            <input 
              id="limina-email" 
              type="email" 
              placeholder="your@email.com"
              style="
                width: 100%; 
                padding: 10px; 
                border: none; 
                border-radius: 6px; 
                font-size: 14px;
                box-sizing: border-box;
              "
              required
            />
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-size: 14px; font-weight: 500;">
              💰 Your Offer (£) *
            </label>
            <input 
              id="limina-price" 
              type="number" 
              step="0.01"
              placeholder="${(product.price / 100 * 0.9).toFixed(2)}"
              style="
                width: 100%; 
                padding: 10px; 
                border: none; 
                border-radius: 6px; 
                font-size: 14px;
                box-sizing: border-box;
              "
              required
            />
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0; font-size: 13px; line-height: 1.4;">
            <strong>💡 How it works:</strong> We'll monitor the price and notify you via email 
            if it drops to your offer amount. No payment until the price drops!
          </p>
        </div>

        <div style="display: flex; gap: 10px;">
          <button 
            id="limina-cancel"
            style="
              flex: 1;
              padding: 12px;
              background: rgba(255,255,255,0.2);
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
            "
          >
            Cancel
          </button>
          <button 
            id="limina-submit"
            style="
              flex: 1;
              padding: 12px;
              background: #ffffff;
              color: #1d4ed8;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
            "
          >
            Submit Offer
          </button>
        </div>
      </div>

      <div id="limina-show-form">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <span style="font-size: 14px;">Current Price:</span>
          <span style="font-size: 18px; font-weight: 600;">£${(product.price / 100).toFixed(2)}</span>
        </div>
        <button 
          id="limina-make-offer"
          style="
            width: 100%;
            padding: 12px;
            background: #ffffff;
            color: #1d4ed8;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 16px;
          "
        >
          🎯 Make an Offer
        </button>
      </div>

      <div id="limina-success" style="display: none;">
        <div style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
          <h3 style="margin: 0 0 10px; font-size: 18px;">Offer Submitted!</h3>
          <p style="margin: 0; opacity: 0.9;">
            We'll notify you if the price drops to your target amount.
          </p>
        </div>
      </div>
    </div>
  `;

  // Find where to insert the widget (after the product form)
  const productForm = document.querySelector('form[action*="/cart/add"]') || 
                      document.querySelector('.product-form') ||
                      document.querySelector('#product-form');

  if (productForm) {
    productForm.insertAdjacentHTML('afterend', widgetHTML);
  } else {
    // Fallback: insert at the end of the main content
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
  }

  // Add event listeners
  const makeOfferBtn = document.getElementById('limina-make-offer');
  const cancelBtn = document.getElementById('limina-cancel');
  const submitBtn = document.getElementById('limina-submit');
  const showForm = document.getElementById('limina-show-form');
  const offerForm = document.getElementById('limina-offer-form');
  const successDiv = document.getElementById('limina-success');

  makeOfferBtn.addEventListener('click', function() {
    showForm.style.display = 'none';
    offerForm.style.display = 'block';
  });

  cancelBtn.addEventListener('click', function() {
    offerForm.style.display = 'none';
    showForm.style.display = 'block';
  });

  submitBtn.addEventListener('click', async function() {
    const email = document.getElementById('limina-email').value;
    const price = document.getElementById('limina-price').value;

    if (!email || !price) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseFloat(price) >= product.price / 100) {
      alert('Your offer must be below the current price');
      return;
    }

    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(`${LIMINA_API_BASE}/api/shopify/buy-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopify_product_id: product.id.toString(),
          customer_email: email,
          target_price: parseFloat(price),
          current_price: product.price / 100,
          currency: product.currency || 'GBP',
          expires_in_days: 30
        }),
      });

      const data = await response.json();

      if (response.ok) {
        offerForm.style.display = 'none';
        successDiv.style.display = 'block';

        // Reset form
        document.getElementById('limina-email').value = '';
        document.getElementById('limina-price').value = '';

        // Hide success message after 5 seconds and reset
        setTimeout(() => {
          successDiv.style.display = 'none';
          showForm.style.display = 'block';
        }, 5000);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error submitting offer:', error);
      alert('Error submitting offer. Please try again.');
    } finally {
      submitBtn.textContent = 'Submit Offer';
      submitBtn.disabled = false;
    }
  });

})();