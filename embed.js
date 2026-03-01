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
  
function createMinimizedIcon() {
    minimizedIcon = document.createElement('div');
    minimizedIcon.id = 'amphi-minimized-icon';
    minimizedIcon.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 90px;
      height: 90px;
      cursor: pointer;
      z-index: 999999;
    `;

    const canvas = document.createElement('canvas');
    minimizedIcon.appendChild(canvas);
    minimizedIcon.title = 'Share & Earn!';
    minimizedIcon.addEventListener('click', openWidget);
    document.body.appendChild(minimizedIcon);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const SIZE = 90;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
      camera.position.z = 3;

      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true,
        antialias: true
      });
      renderer.setSize(SIZE, SIZE);
      renderer.setPixelRatio(dpr);

      const coin = new THREE.Group();

      const bodyGeometry = new THREE.CylinderGeometry(1, 1, 0.3, 64);
      const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xCCFF66 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.rotation.x = Math.PI / 2;
      coin.add(body);

      const ridgeCount = 40;
      for (let i = 0; i < ridgeCount; i++) {
        const angle = (i / ridgeCount) * Math.PI * 2;
        const ridgeGeometry = new THREE.BoxGeometry(0.01, 0.08, 0.32);
        const ridgeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const ridge = new THREE.Mesh(ridgeGeometry, ridgeMaterial);
        ridge.position.x = Math.cos(angle) * 1.04;
        ridge.position.y = Math.sin(angle) * 1.04;
        ridge.position.z = 0;
        ridge.rotation.z = angle;
        coin.add(ridge);
      }

      const createTextTexture = (text) => {
        const texCanvas = document.createElement('canvas');
        const texSize = 512 * dpr;
        texCanvas.width = texSize;
        texCanvas.height = texSize;
        const ctx = texCanvas.getContext('2d');
        ctx.fillStyle = '#CCFF66';
        ctx.fillRect(0, 0, texSize, texSize);
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${100 * dpr}px Arial Black, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, texSize / 2, texSize / 2);
        const texture = new THREE.CanvasTexture(texCanvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return texture;
      };

      const frontGeometry = new THREE.CircleGeometry(1.05, 64);
      const frontMaterial = new THREE.MeshBasicMaterial({ map: createTextTexture('SHARE') });
      const front = new THREE.Mesh(frontGeometry, frontMaterial);
      front.position.z = 0.151;
      coin.add(front);

      const backGeometry = new THREE.CircleGeometry(1.05, 64);
      const backMaterial = new THREE.MeshBasicMaterial({ map: createTextTexture('EARN') });
      const back = new THREE.Mesh(backGeometry, backMaterial);
      back.position.z = -0.151;
      back.rotation.y = Math.PI;
      coin.add(back);

      const edgeRingGeometry = new THREE.RingGeometry(1.0, 1.05, 64);
      const frontEdge = new THREE.Mesh(edgeRingGeometry, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }));
      frontEdge.position.z = 0.16;
      coin.add(frontEdge);

      const backEdge = new THREE.Mesh(edgeRingGeometry, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }));
      backEdge.position.z = -0.16;
      coin.add(backEdge);



      scene.add(coin);

      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(0, 0, 1);
      scene.add(light);

      let t = 0;
      function animate() {
        requestAnimationFrame(animate);
        t += 0.022;
        // Faster base rotation with a sine wobble on Y and a gentle tilt on X
        coin.rotation.y += 0.028;
        coin.rotation.x = Math.sin(t * 0.7) * 0.18;
        coin.rotation.z = Math.sin(t * 0.4) * 0.08;
        renderer.render(scene, camera);
      }
      animate();
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
