# Shopify Integration Guide: Buy Orders Widget

This guide shows you how to add the Limina buy orders widget to your Shopify store, allowing customers to make offers directly on product pages.

## 🚀 Quick Implementation (5 minutes)

### Option 1: Script Tag Integration (Easiest)

1. **Upload the script to your Shopify assets:**
   - In your Shopify admin, go to `Online Store > Themes > Actions > Edit Code`
   - In the Assets folder, upload `shopify-embed.js`

2. **Add the script to your product template:**
   - Open `templates/product.liquid` or `sections/product-template.liquid`
   - Add this code before the closing `</body>` tag or at the end of the product section:

```liquid
{% comment %} Limina Buy Orders Widget {% endcomment %}
<script>
  window.meta = window.meta || {};
  window.meta.product = {
    id: {{ product.id }},
    title: "{{ product.title | escape }}",
    price: {{ product.price }},
    currency: "{{ shop.currency }}",
    featured_image: "{{ product.featured_image | img_url: 'medium' }}"
  };
</script>
<script src="{{ 'shopify-embed.js' | asset_url }}" defer></script>
```

3. **Update the API endpoint:**
   - Edit `shopify-embed.js` and replace `https://your-domain.com` with your actual Limina domain
   - For local testing, use `http://localhost:3000`

### Option 2: Inline Widget (More Control)

Add this HTML directly to your product template where you want the widget to appear:

```liquid
<div id="limina-buy-order-widget" style="
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
">
  <h3>💰 Can't afford it right now?</h3>
  <p>Make an offer and we'll notify you when the price drops!</p>
  
  <form id="limina-offer-form" style="display: none;">
    <input id="customer-email" type="email" placeholder="your@email.com" required>
    <input id="offer-price" type="number" step="0.01" placeholder="Your offer (£)" required>
    <button type="submit">Submit Offer</button>
  </form>
  
  <button id="show-offer-form" onclick="document.getElementById('limina-offer-form').style.display='block'; this.style.display='none';">
    Make an Offer
  </button>
</div>

<script>
document.getElementById('limina-offer-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const email = document.getElementById('customer-email').value;
  const price = document.getElementById('offer-price').value;
  
  const response = await fetch('http://localhost:3000/api/shopify/buy-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopify_product_id: "{{ product.id }}",
      customer_email: email,
      target_price: parseFloat(price),
      current_price: {{ product.price | divided_by: 100.0 }},
      currency: "{{ shop.currency }}"
    })
  });
  
  if (response.ok) {
    alert('Offer submitted successfully!');
  }
});
</script>
```

## 🎯 Testing the Integration

1. **Test on your Shopify store:**
   - Visit any product page on `https://limina-test.myshopify.com`
   - You should see the blue "Can't afford it right now?" widget
   - Click "Make an Offer" and submit a test offer

2. **Verify in your Limina dashboard:**
   - Go to `http://localhost:3000/dashboard/orders`
   - You should see the new buy order appear

3. **Test the fulfillment:**
   - Go to `http://localhost:3000/dashboard/products`
   - Update the product price to below the offer amount
   - The order should automatically fulfill!

## 📱 Customer Experience Flow

```
Customer visits product page
    ↓
Sees current price: £50
    ↓
Clicks "Make an Offer"
    ↓
Enters email: customer@example.com
Enters offer: £40
    ↓
Submits offer
    ↓
Gets confirmation: "We'll notify you if price drops to £40"
    ↓
[Merchant updates price to £39]
    ↓
Customer gets email: "Your offer has been accepted!"
```

## ⚙️ Customization Options

### Styling
You can customize the widget appearance by modifying the CSS in `shopify-embed.js`:

```javascript
// Change colors
background: linear-gradient(135deg, #your-color 0%, #your-color2 100%);

// Change position
// Insert after different elements by changing the selector
const productForm = document.querySelector('.your-custom-selector');
```

### Behavior
```javascript
// Change default offer percentage
placeholder="${(product.price / 100 * 0.8).toFixed(2)}" // 20% off instead of 10%

// Change default expiry
expires_in_days: 60 // 60 days instead of 30
```

## 🔧 Advanced Integration

### Webhook Setup (Optional)
To get real-time notifications when offers are submitted:

1. **Create webhook endpoint in Shopify:**
   - Go to Settings > Notifications
   - Add webhook URL: `https://your-domain.com/api/webhooks/shopify`

2. **Handle product updates:**
   - When you update prices in Shopify, it will automatically trigger fulfillment
   - No additional setup needed!

### Multi-variant Support
For products with variants, you can enhance the widget to handle different variants:

```liquid
{% for variant in product.variants %}
  <button onclick="setVariant({{ variant.id }}, {{ variant.price }})">
    {{ variant.title }} - {{ variant.price | money }}
  </button>
{% endfor %}
```

## 🐛 Troubleshooting

**Widget not appearing?**
- Check browser console for JavaScript errors
- Verify the script is loading correctly
- Ensure `window.meta.product` is set

**Offers not submitting?**
- Check Network tab in browser dev tools
- Verify API endpoint URL is correct
- Check CORS settings if using external domain

**Orders not fulfilling?**
- Verify the product has `shopify_product_id` set
- Check that price updates are syncing properly
- Review logs in `http://localhost:3000/dashboard`

## 📊 Analytics

Track widget performance:
- Offer submission rate
- Fulfillment rate
- Revenue from fulfilled offers

These metrics are available in your Limina dashboard at `/dashboard/analytics`.

---

🎉 **You're all set!** Customers can now make offers directly on your Shopify product pages, and you can manage them through your Limina dashboard.