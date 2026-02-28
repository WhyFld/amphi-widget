// AMPHI Widget Embed Script
(function() {
  'use strict';

  // Configuration
  const WIDGET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/widget.html'
  : 'https://widget.getamphi.com/widget.html';

  // Get brand ID from window (set by brand's embed code)
  const BRAND_ID = window.AMPHI_BRAND_ID || '3c4b9a71-3aa4-4a9d-b17c-5bedf24b50c2';

  let isMinimized = true;
  let widgetContainer = null;
  let minimizedIcon = null;
  let shouldAutoOpen = false;

  // Check if current campaign is completed
  async function checkCampaignCompletion() {
    try {
      // Fetch active campaign for this brand
      const SUPABASE_URL = 'https://puhsbgrublugmqqgvmqd.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aHNiZ3J1Ymx1Z21xcWd2bXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMTE5MjQsImV4cCI6MjA3NTU4NzkyNH0.tFzNj4RMmgxa2hm_nf0IR1dvedy2u3GST2LmjLeV6WE';
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/tasks?brand_id=eq.${BRAND_ID}&is_active=eq.true&select=id`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );

      const campaigns = await response.json();
      
      // No active campaigns
      if (!campaigns || campaigns.length === 0) {
        return true; // Don't show icon
      }

      const campaignId = campaigns[0].id;
      
      // Check localStorage for completion
      const completionKey = `amphi_completed_${BRAND_ID}_${campaignId}`;
      const isCompleted = localStorage.getItem(completionKey) === 'true';
      
      return isCompleted;
      
    } catch (error) {
      console.error('AMPHI: Failed to check campaign completion', error);
      return false; // Show icon on error (safer)
    }
  }

  // Create minimized icon (bottom-right corner)
 // Create minimized icon (bottom-right corner)
  function createMinimizedIcon() {
    minimizedIcon = document.createElement('div');
    minimizedIcon.id = 'amphi-minimized-icon';
    minimizedIcon.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 80px;
      height: 80px;
      cursor: pointer;
      z-index: 999999;
    `;

    // Create canvas for Three.js
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 80;
    canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
    
    minimizedIcon.appendChild(canvas);
    minimizedIcon.title = 'Click to share & earn!';
    minimizedIcon.addEventListener('click', openWidget);
    document.body.appendChild(minimizedIcon);

    // Load Three.js and create 3D sphere
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
      camera.position.z = 2.5;

      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true,
        antialias: true 
      });
      renderer.setSize(80, 80);

      // Create sphere geometry
      const geometry = new THREE.SphereGeometry(1, 32, 32);
      
      // Create material with lime green color
      const material = new THREE.MeshPhongMaterial({
        color: 0xCCFF66,
        shininess: 100,
        specular: 0xffffff
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);

      // Add strong directional light (key light from top-left)
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
      keyLight.position.set(-2, 2, 3);
      scene.add(keyLight);

      // Add fill light (softer from opposite side)
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
      fillLight.position.set(2, 0, -1);
      scene.add(fillLight);

      // Add ambient light (overall illumination)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);

      // Animation loop
      function animate() {
        requestAnimationFrame(animate);
        sphere.rotation.y += 0.01; // Rotate around Y axis
        renderer.render(scene, camera);
      }
      animate();

      // Pause on hover
      minimizedIcon.addEventListener('mouseenter', () => {
        sphere.rotation.y = sphere.rotation.y; // Freeze rotation
      });
    };
    
    document.head.appendChild(script);
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
    `;
    
    const iframe = document.createElement('iframe');
    iframe.id = 'amphi-widget-iframe';
    // Pass brand ID to widget via URL parameter
    iframe.src = WIDGET_URL + '?brand=' + BRAND_ID;
    iframe.allow = 'camera *; microphone *; display-capture *';
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
    if (!event.data || !event.data.action) return;

    switch(event.data.action) {
      case 'minimize':
        minimizeWidget();
        break;
        
      case 'maximize':
        openWidget();
        break;
        
      case 'hide_icon_forever':
        hideIconPermanently(event.data.brandId, event.data.campaignId);
        break;
    }
  }

  // Open widget
  function openWidget() {
    if (widgetContainer) {
      widgetContainer.style.display = 'block';
      if (minimizedIcon) {
        minimizedIcon.style.display = 'none';
      }
      isMinimized = false;
    }
  }

  // Minimize widget
  function minimizeWidget() {
  if (widgetContainer) {
    widgetContainer.style.display = 'none';
    if (minimizedIcon) {
      minimizedIcon.style.display = 'flex';
    }
    isMinimized = true;
    
    // Remember that user dismissed it
    localStorage.setItem('amphi_user_dismissed', 'true');
  }
}

  // Hide icon permanently (campaign completed)
  function hideIconPermanently(brandId, campaignId) {
    // Store completion in localStorage
    const completionKey = `amphi_completed_${brandId}_${campaignId}`;
    localStorage.setItem(completionKey, 'true');
    
    // Remove icon from DOM
    if (minimizedIcon && minimizedIcon.parentNode) {
      minimizedIcon.parentNode.removeChild(minimizedIcon);
      minimizedIcon = null;
    }
    
    // Hide widget
    if (widgetContainer) {
      widgetContainer.style.display = 'none';
    }
    
    console.log('✅ AMPHI: Campaign completed, icon hidden permanently');
  }

  // Auto-open after delay
  function autoOpen() {
  // Check if user has dismissed widget before
  const userDismissed = localStorage.getItem('amphi_user_dismissed');
  
  if (shouldAutoOpen && !userDismissed) {
    setTimeout(() => {
      if (isMinimized) {
        openWidget();
      }
    }, 3000);
  }
}

  // Initialize
  async function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Check if campaign is completed
    const isCompleted = await checkCampaignCompletion();
    
    if (isCompleted) {
      console.log('ℹ️ AMPHI: Campaign already completed, not showing widget');
      return; // Don't create anything
    }

    // Campaign not completed - show widget
    shouldAutoOpen = true;
    createMinimizedIcon();
    createWidgetContainer();
    autoOpen();
  }

  init();
})();
