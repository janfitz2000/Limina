// Limina Smart Widget for Shopify
// Trigger-based widget that shows price alerts only when certain conditions are met

(function() {
  'use strict';

  var LIMINA_HOST = 'https://limina-platform-new.vercel.app';
  var STORAGE_KEY = 'limina_cart_state';
  var TRIGGERED_KEY = 'limina_triggered_shopify';

  // Default trigger configuration
  var DEFAULT_CONFIG = {
    triggers: {
      exit_intent: { enabled: true, threshold: 50 },
      time_on_page: { enabled: true, delay_seconds: 30 },
      cart_abandonment: { enabled: true },
      scroll_depth: { enabled: false, threshold: 70 }
    },
    display: {
      style: 'inline',
      collapsed_text: 'Want a better price? Set your target',
      expanded_text: 'Get notified when this drops to your price',
      theme: 'subtle'
    }
  };

  // CSS styles
  var STYLES = '\
    .limina-shopify-teaser {\
      margin: 16px 0;\
      padding: 16px;\
      border: 1px solid #e5e7eb;\
      border-radius: 8px;\
      background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);\
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\
      animation: limina-shopify-fade-in 0.3s ease-out;\
    }\
    @keyframes limina-shopify-fade-in {\
      from { opacity: 0; transform: translateY(-10px); }\
      to { opacity: 1; transform: translateY(0); }\
    }\
    .limina-shopify-header {\
      display: flex;\
      align-items: center;\
      gap: 12px;\
      cursor: pointer;\
    }\
    .limina-shopify-checkbox {\
      width: 20px;\
      height: 20px;\
      accent-color: #ca8a04;\
      cursor: pointer;\
    }\
    .limina-shopify-content {\
      flex: 1;\
    }\
    .limina-shopify-title {\
      font-size: 14px;\
      font-weight: 600;\
      color: #1f2937;\
      margin: 0 0 2px 0;\
    }\
    .limina-shopify-subtitle {\
      font-size: 12px;\
      color: #6b7280;\
      margin: 0;\
    }\
    .limina-shopify-badge {\
      background: #ca8a04;\
      color: white;\
      font-size: 10px;\
      font-weight: 600;\
      padding: 4px 8px;\
      border-radius: 4px;\
      text-transform: uppercase;\
    }\
    .limina-shopify-expanded {\
      margin-top: 16px;\
      padding-top: 16px;\
      border-top: 1px solid #e5e7eb;\
      display: none;\
    }\
    .limina-shopify-expanded.active {\
      display: block;\
      animation: limina-shopify-expand 0.2s ease-out;\
    }\
    @keyframes limina-shopify-expand {\
      from { opacity: 0; }\
      to { opacity: 1; }\
    }\
    .limina-shopify-form {\
      display: flex;\
      flex-direction: column;\
      gap: 12px;\
    }\
    .limina-shopify-input-group {\
      display: flex;\
      flex-direction: column;\
      gap: 4px;\
    }\
    .limina-shopify-label {\
      font-size: 12px;\
      font-weight: 500;\
      color: #374151;\
    }\
    .limina-shopify-input {\
      padding: 10px 12px;\
      border: 1px solid #d1d5db;\
      border-radius: 6px;\
      font-size: 14px;\
      transition: border-color 0.2s;\
    }\
    .limina-shopify-input:focus {\
      outline: none;\
      border-color: #ca8a04;\
      box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.1);\
    }\
    .limina-shopify-price-row {\
      display: flex;\
      align-items: center;\
      gap: 8px;\
    }\
    .limina-shopify-currency {\
      font-size: 16px;\
      font-weight: 600;\
      color: #374151;\
    }\
    .limina-shopify-current-price {\
      font-size: 12px;\
      color: #6b7280;\
      margin-top: 4px;\
    }\
    .limina-shopify-btn {\
      background: #ca8a04;\
      color: white;\
      border: none;\
      padding: 12px 20px;\
      border-radius: 6px;\
      font-size: 14px;\
      font-weight: 600;\
      cursor: pointer;\
      transition: background 0.2s;\
    }\
    .limina-shopify-btn:hover {\
      background: #a16207;\
    }\
    .limina-shopify-btn:disabled {\
      background: #d1d5db;\
      cursor: not-allowed;\
    }\
    .limina-shopify-disclaimer {\
      font-size: 11px;\
      color: #9ca3af;\
      text-align: center;\
      margin-top: 8px;\
    }\
    .limina-shopify-success {\
      text-align: center;\
      padding: 20px;\
    }\
    .limina-shopify-success-icon {\
      font-size: 40px;\
      margin-bottom: 8px;\
    }\
    .limina-shopify-success-title {\
      font-size: 16px;\
      font-weight: 600;\
      color: #1f2937;\
      margin: 0 0 4px 0;\
    }\
    .limina-shopify-success-text {\
      font-size: 13px;\
      color: #6b7280;\
      margin: 0;\
    }\
    .limina-shopify-error {\
      background: #fef2f2;\
      border: 1px solid #fecaca;\
      color: #dc2626;\
      padding: 8px 12px;\
      border-radius: 4px;\
      font-size: 12px;\
      margin-bottom: 8px;\
    }\
  ';

  // Shopify Widget Class
  function ShopifyWidget(options) {
    this.merchantId = options.merchantId;
    this.config = this.mergeConfig(options.config || {});
    this.triggered = false;
    this.expanded = false;
    this.teaserElement = null;
    this.productData = null;

    // Get Shopify product data
    if (window.meta && window.meta.product) {
      this.productData = window.meta.product;
    } else if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
      this.productData = window.ShopifyAnalytics.meta.product;
    }

    if (!this.productData) {
      console.warn('Limina: No product data found on this page');
      return;
    }

    // Check if already triggered this session
    var sessionKey = TRIGGERED_KEY + '_' + this.productData.id;
    if (sessionStorage.getItem(sessionKey) && !options.forceShow) {
      return;
    }

    this.init();
  }

  ShopifyWidget.prototype.mergeConfig = function(userConfig) {
    var config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    if (userConfig.triggers) {
      Object.keys(userConfig.triggers).forEach(function(key) {
        if (config.triggers[key]) {
          Object.assign(config.triggers[key], userConfig.triggers[key]);
        }
      });
    }
    if (userConfig.display) {
      Object.assign(config.display, userConfig.display);
    }
    return config;
  };

  ShopifyWidget.prototype.init = function() {
    var self = this;

    // Inject styles
    if (!document.getElementById('limina-shopify-styles')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'limina-shopify-styles';
      styleEl.textContent = STYLES;
      document.head.appendChild(styleEl);
    }

    // Find insertion point
    this.findInsertionPoint();

    // Initialize triggers
    this.initTriggers();
  };

  ShopifyWidget.prototype.findInsertionPoint = function() {
    // Shopify theme selectors in order of preference
    var selectors = [
      'form[action*="/cart/add"] .product-form__buttons',
      'form[action*="/cart/add"]',
      '.product-form__buttons',
      '.product-form',
      '#product-form',
      '.product__info-wrapper',
      '.product-single__meta',
      '[data-product-form]'
    ];

    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) {
        this.insertionPoint = el;
        this.insertionMethod = 'after';
        return;
      }
    }

    // Fallback to main content
    this.insertionPoint = document.querySelector('main') || document.body;
    this.insertionMethod = 'append';
  };

  ShopifyWidget.prototype.initTriggers = function() {
    var triggers = this.config.triggers;

    // Check cart abandonment first
    if (triggers.cart_abandonment && triggers.cart_abandonment.enabled) {
      if (this.checkCartAbandonment()) {
        return;
      }
    }

    // Exit intent
    if (triggers.exit_intent && triggers.exit_intent.enabled) {
      this.watchExitIntent();
    }

    // Time on page
    if (triggers.time_on_page && triggers.time_on_page.enabled) {
      this.watchTimeOnPage();
    }

    // Scroll depth
    if (triggers.scroll_depth && triggers.scroll_depth.enabled) {
      this.watchScrollDepth();
    }

    // Track cart state for abandonment
    this.trackCartState();
  };

  ShopifyWidget.prototype.watchExitIntent = function() {
    var self = this;
    var threshold = this.config.triggers.exit_intent.threshold || 50;

    document.addEventListener('mouseout', function(e) {
      if (e.clientY < threshold && e.relatedTarget === null) {
        self.trigger('exit_intent');
      }
    });
  };

  ShopifyWidget.prototype.watchTimeOnPage = function() {
    var self = this;
    var delay = (this.config.triggers.time_on_page.delay_seconds || 30) * 1000;

    setTimeout(function() {
      self.trigger('time_on_page');
    }, delay);
  };

  ShopifyWidget.prototype.watchScrollDepth = function() {
    var self = this;
    var threshold = this.config.triggers.scroll_depth.threshold || 70;
    var maxScrollReached = 0;
    var hasScrolledBack = false;

    window.addEventListener('scroll', function() {
      var scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;

      if (scrollPercent > maxScrollReached) {
        maxScrollReached = scrollPercent;
      }

      if (maxScrollReached >= threshold && scrollPercent < maxScrollReached - 20 && !hasScrolledBack) {
        hasScrolledBack = true;
        self.trigger('scroll_depth');
      }
    });
  };

  ShopifyWidget.prototype.checkCartAbandonment = function() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    try {
      var cartState = JSON.parse(stored);
      var now = Date.now();
      var fiveMinutes = 5 * 60 * 1000;

      if (cartState.hasItems && cartState.leftAt && (now - cartState.leftAt) > fiveMinutes) {
        localStorage.removeItem(STORAGE_KEY);
        this.trigger('cart_abandonment');
        return true;
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
    }
    return false;
  };

  ShopifyWidget.prototype.trackCartState = function() {
    var self = this;

    window.addEventListener('beforeunload', function() {
      // Use Shopify cart API to check cart state
      self.checkShopifyCart().then(function(hasItems) {
        if (hasItems) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            hasItems: true,
            leftAt: Date.now(),
            productId: self.productData.id
          }));
        }
      });
    });
  };

  ShopifyWidget.prototype.checkShopifyCart = function() {
    return new Promise(function(resolve) {
      fetch('/cart.js')
        .then(function(res) { return res.json(); })
        .then(function(cart) {
          resolve(cart.item_count > 0);
        })
        .catch(function() {
          resolve(false);
        });
    });
  };

  ShopifyWidget.prototype.trigger = function(reason) {
    if (this.triggered) return;
    this.triggered = true;

    // Mark as triggered for this session
    sessionStorage.setItem(TRIGGERED_KEY + '_' + this.productData.id, 'true');

    // Track event
    this.trackEvent('widget_triggered', { reason: reason });

    // Show teaser
    this.showTeaser();
  };

  ShopifyWidget.prototype.showTeaser = function() {
    var self = this;
    var display = this.config.display;
    var product = this.productData;

    var currentPrice = product.price / 100; // Shopify prices are in cents
    var suggestedPrice = Math.floor(currentPrice * 0.85);
    var currency = window.Shopify && window.Shopify.currency && window.Shopify.currency.active || 'USD';
    var currencySymbol = currency === 'GBP' ? '\u00A3' : '$';

    var uniqueId = 'limina-' + product.id;

    var teaserHtml = '\
      <div class="limina-shopify-teaser" data-limina-teaser>\
        <div class="limina-shopify-header">\
          <input type="checkbox" class="limina-shopify-checkbox" id="' + uniqueId + '-checkbox">\
          <div class="limina-shopify-content">\
            <p class="limina-shopify-title">' + display.collapsed_text + '</p>\
            <p class="limina-shopify-subtitle">' + display.expanded_text + '</p>\
          </div>\
          <span class="limina-shopify-badge">Save</span>\
        </div>\
        <div class="limina-shopify-expanded" id="' + uniqueId + '-expanded">\
          <div class="limina-shopify-form">\
            <div class="limina-shopify-input-group">\
              <label class="limina-shopify-label">Your target price</label>\
              <div class="limina-shopify-price-row">\
                <span class="limina-shopify-currency">' + currencySymbol + '</span>\
                <input type="number" class="limina-shopify-input" id="' + uniqueId + '-price"\
                       value="' + suggestedPrice + '" min="1" max="' + currentPrice + '" step="1">\
              </div>\
              <p class="limina-shopify-current-price">Current price: ' + currencySymbol + currentPrice.toFixed(2) + '</p>\
            </div>\
            <div class="limina-shopify-input-group">\
              <label class="limina-shopify-label">Email for notification</label>\
              <input type="email" class="limina-shopify-input" id="' + uniqueId + '-email"\
                     placeholder="your@email.com">\
            </div>\
            <button class="limina-shopify-btn" id="' + uniqueId + '-submit">\
              Create Price Alert\
            </button>\
            <p class="limina-shopify-disclaimer">\
              We\'ll notify you when the price drops to your target. No payment required now.\
            </p>\
          </div>\
        </div>\
      </div>\
    ';

    // Create and insert element
    var wrapper = document.createElement('div');
    wrapper.innerHTML = teaserHtml;
    this.teaserElement = wrapper.firstElementChild;

    if (this.insertionMethod === 'after') {
      this.insertionPoint.parentNode.insertBefore(this.teaserElement, this.insertionPoint.nextSibling);
    } else {
      this.insertionPoint.appendChild(this.teaserElement);
    }

    // Event listeners
    var checkbox = document.getElementById(uniqueId + '-checkbox');
    var header = this.teaserElement.querySelector('.limina-shopify-header');
    var expandedSection = document.getElementById(uniqueId + '-expanded');
    var submitBtn = document.getElementById(uniqueId + '-submit');

    header.addEventListener('click', function(e) {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      expandedSection.classList.toggle('active', checkbox.checked);
      if (checkbox.checked) {
        self.trackEvent('widget_expanded', {});
      }
    });

    submitBtn.addEventListener('click', function() {
      self.submitOrder(uniqueId);
    });
  };

  ShopifyWidget.prototype.submitOrder = function(uniqueId) {
    var self = this;
    var priceInput = document.getElementById(uniqueId + '-price');
    var emailInput = document.getElementById(uniqueId + '-email');
    var submitBtn = document.getElementById(uniqueId + '-submit');
    var expandedSection = document.getElementById(uniqueId + '-expanded');

    var targetPrice = parseFloat(priceInput.value);
    var email = emailInput.value.trim();

    // Validation
    if (!email || !email.includes('@')) {
      this.showError('Please enter a valid email address');
      return;
    }

    if (!targetPrice || targetPrice <= 0) {
      this.showError('Please enter a valid target price');
      return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    // Submit order
    var payload = {
      merchantId: this.merchantId,
      shopifyProductId: this.productData.id.toString(),
      targetPrice: targetPrice,
      customerEmail: email,
      currency: window.Shopify && window.Shopify.currency && window.Shopify.currency.active || 'USD'
    };

    fetch(LIMINA_HOST + '/api/buy-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.error) {
        throw new Error(data.error);
      }
      self.showSuccess();
      self.trackEvent('order_created', { targetPrice: targetPrice });
    })
    .catch(function(err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Price Alert';
      self.showError(err.message || 'Something went wrong. Please try again.');
    });
  };

  ShopifyWidget.prototype.showError = function(message) {
    var existing = this.teaserElement.querySelector('.limina-shopify-error');
    if (existing) existing.remove();

    var errorEl = document.createElement('div');
    errorEl.className = 'limina-shopify-error';
    errorEl.textContent = message;

    var form = this.teaserElement.querySelector('.limina-shopify-form');
    form.insertBefore(errorEl, form.firstChild);

    setTimeout(function() { errorEl.remove(); }, 5000);
  };

  ShopifyWidget.prototype.showSuccess = function() {
    var expandedSection = this.teaserElement.querySelector('.limina-shopify-expanded');
    expandedSection.innerHTML = '\
      <div class="limina-shopify-success">\
        <div class="limina-shopify-success-icon">&#10003;</div>\
        <p class="limina-shopify-success-title">Price alert created!</p>\
        <p class="limina-shopify-success-text">We\'ll email you when the price drops to your target.</p>\
      </div>\
    ';
  };

  ShopifyWidget.prototype.trackEvent = function(event, data) {
    try {
      fetch(LIMINA_HOST + '/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: event,
          merchantId: this.merchantId,
          productId: this.productData.id.toString(),
          data: data,
          timestamp: new Date().toISOString()
        })
      }).catch(function() {});
    } catch (e) {}
  };

  // Auto-initialize from data attributes
  function autoInit() {
    var containers = document.querySelectorAll('[data-limina-widget]');
    containers.forEach(function(container) {
      var merchantId = container.getAttribute('data-merchant-id');
      var config = {};

      if (container.getAttribute('data-triggers')) {
        try {
          config.triggers = JSON.parse(container.getAttribute('data-triggers'));
        } catch (e) {}
      }

      new ShopifyWidget({
        merchantId: merchantId,
        config: config
      });
    });
  }

  // Also check for script tag attributes
  function initFromScript() {
    var scripts = document.querySelectorAll('script[src*="shopify-embed.js"]');
    scripts.forEach(function(script) {
      var merchantId = script.getAttribute('data-merchant-id');
      if (merchantId) {
        var config = {};
        if (script.getAttribute('data-triggers')) {
          try {
            config.triggers = JSON.parse(script.getAttribute('data-triggers'));
          } catch (e) {}
        }
        new ShopifyWidget({
          merchantId: merchantId,
          config: config
        });
      }
    });
  }

  // Expose API
  window.LiminaShopify = {
    Widget: ShopifyWidget,
    init: function(options) {
      return new ShopifyWidget(options);
    },
    forceShow: function(options) {
      options.forceShow = true;
      var widget = new ShopifyWidget(options);
      widget.trigger('manual');
      return widget;
    }
  };

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      autoInit();
      initFromScript();
    });
  } else {
    autoInit();
    initFromScript();
  }
})();
