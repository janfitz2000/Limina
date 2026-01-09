(function() {
  'use strict';

  var LIMINA_HOST = window.LIMINA_HOST || 'https://limina-platform-new.vercel.app';
  var STORAGE_KEY = 'limina_cart_state';
  var TRIGGERED_KEY = 'limina_triggered';

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
      position: 'after_element',
      collapsed_text: 'Want a better price? Set your target',
      expanded_text: 'Get notified when this drops to your price',
      theme: 'subtle'
    },
    colors: {
      primary: '#C9A227',
      background: '#1a1a1a',
      text: '#ffffff',
      border: '#333333'
    }
  };

  // CSS styles injected into the page
  var TEASER_STYLES = `
    .limina-teaser {
      margin: 16px 0;
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: limina-fade-in 0.3s ease-out;
    }
    @keyframes limina-fade-in {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .limina-teaser-header {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }
    .limina-teaser-checkbox {
      width: 20px;
      height: 20px;
      accent-color: #ca8a04;
      cursor: pointer;
    }
    .limina-teaser-content {
      flex: 1;
    }
    .limina-teaser-title {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 2px 0;
    }
    .limina-teaser-subtitle {
      font-size: 12px;
      color: #6b7280;
      margin: 0;
    }
    .limina-teaser-badge {
      background: #ca8a04;
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .limina-teaser-expanded {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      display: none;
    }
    .limina-teaser-expanded.active {
      display: block;
      animation: limina-expand 0.2s ease-out;
    }
    @keyframes limina-expand {
      from { opacity: 0; max-height: 0; }
      to { opacity: 1; max-height: 500px; }
    }
    .limina-teaser-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .limina-teaser-input-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .limina-teaser-label {
      font-size: 12px;
      font-weight: 500;
      color: #374151;
    }
    .limina-teaser-input {
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    .limina-teaser-input:focus {
      outline: none;
      border-color: #ca8a04;
      box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.1);
    }
    .limina-teaser-price-input {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .limina-teaser-currency {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
    .limina-teaser-current-price {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    .limina-teaser-btn {
      background: #ca8a04;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .limina-teaser-btn:hover {
      background: #a16207;
    }
    .limina-teaser-btn:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }
    .limina-teaser-disclaimer {
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
      margin-top: 8px;
    }
    .limina-teaser-success {
      text-align: center;
      padding: 20px;
    }
    .limina-teaser-success-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    .limina-teaser-success-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 4px 0;
    }
    .limina-teaser-success-text {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    .limina-teaser-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      margin-bottom: 8px;
    }
  `;

  // LiminaWidget Class
  function LiminaWidget(container, options) {
    this.container = container;
    this.options = options;
    this.config = this.mergeConfig(options.config || {});
    this.triggered = false;
    this.expanded = false;
    this.productData = null;
    this.teaserElement = null;

    // Check if already triggered this session
    var sessionTriggered = sessionStorage.getItem(TRIGGERED_KEY + '_' + options.productId);
    if (sessionTriggered && !options.forceShow) {
      return;
    }

    this.init();
  }

  LiminaWidget.prototype.mergeConfig = function(userConfig) {
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
    if (userConfig.colors) {
      Object.assign(config.colors, userConfig.colors);
    }
    return config;
  };

  LiminaWidget.prototype.init = function() {
    var self = this;

    // Inject styles if not already done
    if (!document.getElementById('limina-teaser-styles')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'limina-teaser-styles';
      styleEl.textContent = TEASER_STYLES;
      document.head.appendChild(styleEl);
    }

    // Fetch product data
    this.fetchProductData().then(function() {
      self.initTriggers();
    });
  };

  LiminaWidget.prototype.fetchProductData = function() {
    var self = this;
    var params = new URLSearchParams({
      merchantId: this.options.merchantId
    });

    if (this.options.productId) {
      params.set('productId', this.options.productId);
    }
    if (this.options.shopifyProductId) {
      params.set('shopifyProductId', this.options.shopifyProductId);
    }

    return fetch(LIMINA_HOST + '/api/products?' + params.toString())
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && data.length > 0) {
          self.productData = data[0];
        }
      })
      .catch(function(err) {
        console.error('Limina: Failed to fetch product data', err);
      });
  };

  LiminaWidget.prototype.initTriggers = function() {
    var triggers = this.config.triggers;

    // Check cart abandonment first (immediate if returning)
    if (triggers.cart_abandonment && triggers.cart_abandonment.enabled) {
      if (this.checkCartAbandonment()) {
        return; // Already triggered
      }
    }

    // Set up exit intent
    if (triggers.exit_intent && triggers.exit_intent.enabled) {
      this.watchExitIntent();
    }

    // Set up time on page
    if (triggers.time_on_page && triggers.time_on_page.enabled) {
      this.watchTimeOnPage();
    }

    // Set up scroll depth
    if (triggers.scroll_depth && triggers.scroll_depth.enabled) {
      this.watchScrollDepth();
    }

    // Set up cart abandonment tracking
    this.trackCartState();
  };

  LiminaWidget.prototype.watchExitIntent = function() {
    var self = this;
    var threshold = this.config.triggers.exit_intent.threshold || 50;

    document.addEventListener('mouseout', function(e) {
      if (e.clientY < threshold && e.relatedTarget === null) {
        self.trigger('exit_intent');
      }
    });
  };

  LiminaWidget.prototype.watchTimeOnPage = function() {
    var self = this;
    var delay = (this.config.triggers.time_on_page.delay_seconds || 30) * 1000;

    setTimeout(function() {
      self.trigger('time_on_page');
    }, delay);
  };

  LiminaWidget.prototype.watchScrollDepth = function() {
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

  LiminaWidget.prototype.checkCartAbandonment = function() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    try {
      var cartState = JSON.parse(stored);
      var now = Date.now();
      var fiveMinutes = 5 * 60 * 1000;

      // If they left with items in cart and returned within reasonable time
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

  LiminaWidget.prototype.trackCartState = function() {
    var self = this;

    window.addEventListener('beforeunload', function() {
      var hasItems = self.detectCartItems();
      if (hasItems) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          hasItems: true,
          leftAt: Date.now(),
          productId: self.options.productId
        }));
      }
    });
  };

  LiminaWidget.prototype.detectCartItems = function() {
    // Try to detect cart items from common e-commerce patterns
    // Shopify
    if (window.Shopify && window.Shopify.checkout) {
      return window.Shopify.checkout.line_items && window.Shopify.checkout.line_items.length > 0;
    }

    // Generic detection - look for cart indicators
    var cartIndicators = document.querySelectorAll(
      '[class*="cart-count"], [class*="cart-quantity"], [data-cart-count], .cart-item'
    );

    for (var i = 0; i < cartIndicators.length; i++) {
      var text = cartIndicators[i].textContent.trim();
      if (text && parseInt(text) > 0) {
        return true;
      }
    }

    return false;
  };

  LiminaWidget.prototype.trigger = function(reason) {
    if (this.triggered) return;
    this.triggered = true;

    // Mark as triggered for this session
    sessionStorage.setItem(TRIGGERED_KEY + '_' + this.options.productId, 'true');

    // Track the trigger event
    this.trackEvent('widget_triggered', { reason: reason });

    // Show the teaser
    this.showTeaser();
  };

  LiminaWidget.prototype.showTeaser = function() {
    var self = this;
    var display = this.config.display;
    var colors = this.config.colors;
    var product = this.productData || {};

    var currentPrice = product.current_price || this.options.currentPrice || 0;
    var suggestedPrice = Math.floor(currentPrice * 0.85); // 15% off suggestion
    var currency = product.currency || this.options.currency || 'USD';
    var currencySymbol = currency === 'GBP' ? '\u00A3' : '$';

    // Generate inline styles based on custom colors
    var teaserStyle = 'margin: 16px 0; padding: 16px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; animation: limina-fade-in 0.3s ease-out;' +
      'background: ' + colors.background + ';' +
      'border: 1px solid ' + colors.border + ';';

    var titleStyle = 'font-size: 14px; font-weight: 600; margin: 0 0 2px 0; color: ' + colors.text + ';';
    var subtitleStyle = 'font-size: 12px; margin: 0; color: ' + colors.text + '99;';
    var badgeStyle = 'font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;' +
      'background: ' + colors.primary + '; color: ' + colors.background + ';';
    var labelStyle = 'font-size: 12px; font-weight: 500; color: ' + colors.text + '99;';
    var inputStyle = 'padding: 10px 12px; border-radius: 6px; font-size: 14px; transition: border-color 0.2s; width: 100%; box-sizing: border-box;' +
      'background: ' + colors.text + '0D; border: 1px solid ' + colors.border + '; color: ' + colors.text + ';';
    var btnStyle = 'border: none; padding: 12px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; width: 100%;' +
      'background: ' + colors.primary + '; color: ' + colors.background + ';';
    var checkboxStyle = 'width: 20px; height: 20px; accent-color: ' + colors.primary + '; cursor: pointer;';

    var teaserHtml = `
      <div class="limina-teaser" data-limina-teaser style="${teaserStyle}">
        <div class="limina-teaser-header" style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
          <input type="checkbox" class="limina-teaser-checkbox" id="limina-checkbox-${this.options.productId}" style="${checkboxStyle}">
          <div class="limina-teaser-content" style="flex: 1;">
            <p class="limina-teaser-title" style="${titleStyle}">${display.collapsed_text}</p>
            <p class="limina-teaser-subtitle" style="${subtitleStyle}">${display.expanded_text}</p>
          </div>
          <span class="limina-teaser-badge" style="${badgeStyle}">Save</span>
        </div>
        <div class="limina-teaser-expanded" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid ${colors.border}; display: none;">
          <div class="limina-teaser-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div class="limina-teaser-input-group" style="display: flex; flex-direction: column; gap: 4px;">
              <label class="limina-teaser-label" style="${labelStyle}">Your target price</label>
              <div class="limina-teaser-price-input" style="display: flex; align-items: center; gap: 8px;">
                <span class="limina-teaser-currency" style="font-size: 16px; font-weight: 600; color: ${colors.text};">${currencySymbol}</span>
                <input type="number" class="limina-teaser-input" id="limina-price-${this.options.productId}"
                       value="${suggestedPrice}" min="1" max="${currentPrice}" step="1" style="${inputStyle}">
              </div>
              <p class="limina-teaser-current-price" style="font-size: 12px; margin-top: 4px; color: ${colors.text}66;">Current price: ${currencySymbol}${currentPrice.toFixed(2)}</p>
            </div>
            <div class="limina-teaser-input-group" style="display: flex; flex-direction: column; gap: 4px;">
              <label class="limina-teaser-label" style="${labelStyle}">Email for notification</label>
              <input type="email" class="limina-teaser-input" id="limina-email-${this.options.productId}"
                     placeholder="your@email.com" style="${inputStyle}">
            </div>
            <button class="limina-teaser-btn" id="limina-submit-${this.options.productId}" style="${btnStyle}">
              Create Price Alert
            </button>
            <p class="limina-teaser-disclaimer" style="font-size: 11px; text-align: center; margin-top: 8px; color: ${colors.text}66;">
              We'll notify you when the price drops to your target. No payment required now.
            </p>
          </div>
        </div>
      </div>
    `;

    // Create element
    var wrapper = document.createElement('div');
    wrapper.innerHTML = teaserHtml;
    this.teaserElement = wrapper.firstElementChild;

    // Insert into container
    this.container.appendChild(this.teaserElement);

    // Set up event listeners
    var checkbox = this.teaserElement.querySelector('.limina-teaser-checkbox');
    var header = this.teaserElement.querySelector('.limina-teaser-header');
    var expandedSection = this.teaserElement.querySelector('.limina-teaser-expanded');
    var submitBtn = this.teaserElement.querySelector('.limina-teaser-btn');

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
      self.submitOrder();
    });
  };

  LiminaWidget.prototype.submitOrder = function() {
    var self = this;
    var priceInput = document.getElementById('limina-price-' + this.options.productId);
    var emailInput = document.getElementById('limina-email-' + this.options.productId);
    var submitBtn = document.getElementById('limina-submit-' + this.options.productId);
    var expandedSection = this.teaserElement.querySelector('.limina-teaser-expanded');

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
      merchantId: this.options.merchantId,
      productId: this.options.productId,
      shopifyProductId: this.options.shopifyProductId,
      targetPrice: targetPrice,
      customerEmail: email,
      currency: this.productData?.currency || this.options.currency || 'USD'
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

  LiminaWidget.prototype.showError = function(message) {
    var existing = this.teaserElement.querySelector('.limina-teaser-error');
    if (existing) existing.remove();

    var errorEl = document.createElement('div');
    errorEl.className = 'limina-teaser-error';
    errorEl.textContent = message;

    var form = this.teaserElement.querySelector('.limina-teaser-form');
    form.insertBefore(errorEl, form.firstChild);

    setTimeout(function() { errorEl.remove(); }, 5000);
  };

  LiminaWidget.prototype.showSuccess = function() {
    var expandedSection = this.teaserElement.querySelector('.limina-teaser-expanded');
    expandedSection.innerHTML = `
      <div class="limina-teaser-success">
        <div class="limina-teaser-success-icon">&#10003;</div>
        <p class="limina-teaser-success-title">Price alert created!</p>
        <p class="limina-teaser-success-text">We'll email you when the price drops to your target.</p>
      </div>
    `;
  };

  LiminaWidget.prototype.trackEvent = function(event, data) {
    // Send analytics event
    try {
      fetch(LIMINA_HOST + '/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: event,
          merchantId: this.options.merchantId,
          productId: this.options.productId,
          data: data,
          timestamp: new Date().toISOString()
        })
      }).catch(function() {}); // Silently fail
    } catch (e) {}
  };

  // Legacy createWidget function for backwards compatibility
  function createWidget(container, options) {
    if (!options.productId && !options.shopifyProductId) {
      console.error('Limina Widget: productId or shopifyProductId is required');
      return null;
    }
    if (!options.merchantId) {
      console.error('Limina Widget: merchantId is required');
      return null;
    }

    return new LiminaWidget(container, options);
  }

  // Force show widget immediately (for testing or merchant preview)
  function showWidgetNow(container, options) {
    options.forceShow = true;
    var widget = new LiminaWidget(container, options);
    widget.trigger('manual');
    return widget;
  }

  // Auto-initialize widgets with data attributes
  function autoInit() {
    var containers = document.querySelectorAll('[data-limina-widget]');
    containers.forEach(function(container) {
      var config = {};

      // Parse full config from data attribute (includes triggers, display, and colors)
      if (container.getAttribute('data-config')) {
        try {
          config = JSON.parse(container.getAttribute('data-config'));
        } catch (e) {}
      }
      // Legacy support: parse trigger config from data-triggers
      else if (container.getAttribute('data-triggers')) {
        try {
          config.triggers = JSON.parse(container.getAttribute('data-triggers'));
        } catch (e) {}
      }

      createWidget(container, {
        productId: container.getAttribute('data-product-id'),
        shopifyProductId: container.getAttribute('data-shopify-product-id'),
        merchantId: container.getAttribute('data-merchant-id'),
        currentPrice: parseFloat(container.getAttribute('data-current-price')) || 0,
        currency: container.getAttribute('data-currency') || 'USD',
        config: config
      });
    });
  }

  // Expose API
  window.Limina = {
    createWidget: createWidget,
    showWidgetNow: showWidgetNow,
    init: autoInit,
    Widget: LiminaWidget
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();
