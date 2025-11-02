// AMPHI Widget Embed Script
(function() {
  'use strict';

  // Configuration
  const WIDGET_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/widget.html'
    : 'https://amphi-widget.vercel.app/widget.html';

  let isMinimized = true;
  let widgetContainer = null;
  let minimizedIcon = null;

  // Create minimized icon (bottom-right corner)
  function createMinimizedIcon() {
    minimizedIcon = document.createElement('div');
    minimizedIcon.id = 'amphi-minimized-icon';
    minimizedIcon.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #CCFF66 0%, #b8e659 100%);
      border-radius: 50%;
      box-shadow: 0 4px 20px rgba(204, 255, 102, 0.4);
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transition: all 0.3s ease;
      animation: amphi-pulse 2s infinite;
    `;
    minimizedIcon.innerHTML = '💬';
    minimizedIcon.title = 'Open AMPHI - Earn rewards!';

    // Pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes amphi-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); box-shadow: 0 6px 25px rgba(204, 255, 102, 0.6); }
      }
      #amphi-minimized-icon:hover {
        transform: scale(1.1) !important;
        box-shadow: 0 6px 30px rgba(204, 255, 102, 0.7) !important;
      }
    `;
    document.head.appendChild(style);

    minimizedIcon.addEventListener('click', openWidget);
    document.body.appendChild(minimizedIcon);
  }

  // Create widget container (iframe)
  function createWidgetContainer() {
    widgetContainer = document.createElement('div');
    widgetContainer.id = 'amphi-widget-container';
  widgetContainer.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999999;
  display: none;
  pointer-events: none;
`;
    const iframe = document.createElement('iframe');
    iframe.id = 'amphi-widget-iframe';
    iframe.src = WIDGET_URL;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
    `;

    widgetContainer.appendChild(iframe);
    document.body.appendChild(widgetContainer);

    // Listen for messages from iframe
    window.addEventListener('message', handleMessage);
  }

  // Handle messages from widget
  function handleMessage(event) {
    if (event.data && event.data.action === 'minimize') {
      minimizeWidget();
    }
  }

  // Open widget
  function openWidget() {
    if (widgetContainer) {
      widgetContainer.style.display = 'block';
      minimizedIcon.style.display = 'none';
      isMinimized = false;
    }
  }

  // Minimize widget
  function minimizeWidget() {
    if (widgetContainer) {
      widgetContainer.style.display = 'none';
      minimizedIcon.style.display = 'flex';
      isMinimized = true;
    }
  }

  // Auto-open after delay
  function autoOpen() {
    setTimeout(() => {
      if (isMinimized) {
        openWidget();
      }
    }, 3000); // Open after 3 seconds
  }

  // Initialize
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    createMinimizedIcon();
    createWidgetContainer();
    autoOpen();
  }

  init();
})();
