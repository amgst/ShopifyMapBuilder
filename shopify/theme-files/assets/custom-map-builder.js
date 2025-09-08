/* 
Custom Map Builder Script Integration
File: assets/custom-map-builder.js

Add this to your theme's assets folder and include in theme.liquid
*/

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    appUrl: 'https://shopify-map-builder.vercel.app',
    storeName: Shopify.shop,
    defaultVariantId: 'gid://shopify/ProductVariant/41068385009711'
  };

  // Map Builder Widget Class
  class MapBuilderWidget {
    constructor(container, options = {}) {
      this.container = container;
      this.options = {
        width: '100%',
        height: '800px',
        variant: CONFIG.defaultVariantId,
        redirectToCart: false,
        ...options
      };
      this.init();
    }

    init() {
      this.createIframe();
      this.setupMessageListener();
    }

    createIframe() {
      const iframe = document.createElement('iframe');
      const params = new URLSearchParams({
        embedded: 'true',
        store: CONFIG.storeName,
        variant: this.options.variant
      });

      iframe.src = `${CONFIG.appUrl}?${params.toString()}`;
      iframe.style.width = this.options.width;
      iframe.style.height = this.options.height;
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.allow = 'geolocation';
      iframe.setAttribute('data-map-builder', 'true');

      // Add loading state
      this.container.innerHTML = `
        <div class="map-builder-loading">
          <div class="loading-spinner"></div>
          <p>Loading Map Builder...</p>
        </div>
      `;

      iframe.onload = () => {
        this.container.innerHTML = '';
        this.container.appendChild(iframe);
      };

      this.iframe = iframe;
    }

    setupMessageListener() {
      window.addEventListener('message', (event) => {
        if (event.origin !== CONFIG.appUrl) return;

        switch(event.data.type) {
          case 'MAP_ADDED_TO_CART':
            this.handleCartSuccess(event.data);
            break;
          case 'PRICE_UPDATED':
            this.handlePriceUpdate(event.data);
            break;
          case 'READY':
            this.handleReady();
            break;
        }
      });
    }

    handleCartSuccess(data) {
      // Trigger Shopify theme cart update
      if (window.theme && window.theme.cart) {
        window.theme.cart.updateCart();
      }

      // Show success notification
      this.showNotification('✅ Custom map added to cart!', 'success');

      // Redirect to cart if configured
      if (this.options.redirectToCart) {
        setTimeout(() => {
          window.location.href = data.cartUrl || '/cart';
        }, 1500);
      }

      // Fire custom event for theme integration
      document.dispatchEvent(new CustomEvent('mapBuilder:cartSuccess', {
        detail: data
      }));
    }

    handlePriceUpdate(data) {
      document.dispatchEvent(new CustomEvent('mapBuilder:priceUpdate', {
        detail: data
      }));
    }

    handleReady() {
      document.dispatchEvent(new CustomEvent('mapBuilder:ready'));
    }

    showNotification(message, type = 'info') {
      // Use Shopify theme notification if available
      if (window.theme && window.theme.showNotification) {
        window.theme.showNotification(message, type);
        return;
      }

      // Fallback notification
      const notification = document.createElement('div');
      notification.className = `map-builder-notification ${type}`;
      notification.innerHTML = `
        <div class="notification-content">
          ${message}
          <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 5000);
    }

    destroy() {
      if (this.iframe && this.iframe.parentElement) {
        this.iframe.remove();
      }
    }
  }

  // Auto-initialize widgets
  function initMapBuilders() {
    const containers = document.querySelectorAll('[data-map-builder-widget]');
    
    containers.forEach(container => {
      if (container.dataset.initialized) return;
      
      const options = {
        variant: container.dataset.variant || CONFIG.defaultVariantId,
        height: container.dataset.height || '800px',
        redirectToCart: container.dataset.redirectToCart === 'true'
      };

      new MapBuilderWidget(container, options);
      container.dataset.initialized = 'true';
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapBuilders);
  } else {
    initMapBuilders();
  }

  // Re-initialize on Shopify section updates
  document.addEventListener('shopify:section:load', initMapBuilders);

  // Global access
  window.MapBuilder = {
    Widget: MapBuilderWidget,
    init: initMapBuilders,
    config: CONFIG
  };

})();