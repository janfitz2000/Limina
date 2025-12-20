(function() {
  'use strict';

  // Configuration
  var LIMINA_HOST = window.LIMINA_HOST || 'https://limina.vercel.app';

  function createWidget(container, options) {
    if (!options.productId || !options.merchantId) {
      console.error('Limina Widget: productId and merchantId are required');
      return;
    }

    var iframe = document.createElement('iframe');
    var params = new URLSearchParams({
      productId: options.productId,
      merchantId: options.merchantId
    });

    iframe.src = LIMINA_HOST + '/widget?' + params.toString();
    iframe.style.cssText = 'width:100%;border:none;min-height:400px;';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowtransparency', 'true');

    // Auto-resize iframe based on content
    window.addEventListener('message', function(event) {
      if (event.origin !== LIMINA_HOST) return;
      if (event.data.type === 'limina-resize') {
        iframe.style.height = event.data.height + 'px';
      }
    });

    container.appendChild(iframe);
    return iframe;
  }

  // Auto-initialize widgets with data attributes
  function autoInit() {
    var containers = document.querySelectorAll('[data-limina-widget]');
    containers.forEach(function(container) {
      createWidget(container, {
        productId: container.getAttribute('data-product-id'),
        merchantId: container.getAttribute('data-merchant-id')
      });
    });
  }

  // Expose API
  window.Limina = {
    createWidget: createWidget,
    init: autoInit
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();
