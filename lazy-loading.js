// GURMAO.cz - Image Lazy Loading Implementation
// Přidává lazy loading pro všechny obrázky a background images

(function initLazyLoading() {
  'use strict';

  // ==========================================
  // 1. NATIVE LAZY LOADING PRO <img> TAGY
  // ==========================================
  
  function addLazyLoadingToImages() {
    const images = document.querySelectorAll('img:not([loading])');
    
    images.forEach(img => {
      // Přidat native lazy loading
      img.loading = 'lazy';
      
      // Přidat dekoding async pro lepší výkon
      img.decoding = 'async';
    });
    
    console.log(`✅ Lazy loading přidán na ${images.length} obrázků`);
  }

  // ==========================================
  // 2. INTERSECTION OBSERVER PRO BG IMAGES
  // ==========================================
  
  function initBackgroundLazyLoading() {
    // Najít všechny elementy s background image
    const bgElements = document.querySelectorAll('[class*="bg-[url"]');
    
    if (bgElements.length === 0) {
      console.log('ℹ️  Žádné background images k lazy loadingu');
      return;
    }
    
    // Vytvořit Intersection Observer
    const bgObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            
            // Získat URL z class atributu
            const classes = element.className;
            const urlMatch = classes.match(/bg-\[url\(['"]?(.*?)['"]?\)\]/);
            
            if (urlMatch && urlMatch[1]) {
              const imageUrl = urlMatch[1];
              
              // Předčíst obrázek
              const img = new Image();
              img.onload = () => {
                // Aplikovat background image
                element.style.backgroundImage = `url('${imageUrl}')`;
                element.classList.add('bg-loaded');
                
                // Přidat fade-in animaci
                element.style.animation = 'fadeIn 0.3s ease-in';
              };
              img.src = imageUrl;
              
              // Přestat observovat tento element
              observer.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '50px', // Začít načítat 50px před tím, než se objeví ve viewportu
        threshold: 0.01
      }
    );
    
    // Observovat všechny BG elementy
    bgElements.forEach(el => bgObserver.observe(el));
    
    console.log(`✅ Intersection Observer aktivován pro ${bgElements.length} background images`);
  }

  // ==========================================
  // 3. RESPONSIVE IMAGES HELPER
  // ==========================================
  
  function generateResponsiveSrcset(baseUrl, sizes = [400, 800, 1200]) {
    // Pro Unsplash obrázky
    if (baseUrl.includes('unsplash.com')) {
      return sizes.map(size => 
        `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}w=${size} ${size}w`
      ).join(', ');
    }
    
    // Pro Supabase Storage
    if (baseUrl.includes('supabase')) {
      return sizes.map(size => 
        `${baseUrl}?width=${size}&quality=80 ${size}w`
      ).join(', ');
    }
    
    return '';
  }

  // ==========================================
  // 4. PRELOAD KRITICKÝCH OBRÁZKŮ
  // ==========================================
  
  function preloadCriticalImages() {
    // Hero image a další above-the-fold obrázky
    const criticalImages = [
      // Přidat URL kritických obrázků
    ];
    
    criticalImages.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // ==========================================
  // 5. BLUR PLACEHOLDER EFFECT
  // ==========================================
  
  function addBlurPlaceholder() {
    const style = document.createElement('style');
    style.textContent = `
      .lazy-loading {
        filter: blur(10px);
        transition: filter 0.3s ease-out;
      }
      
      .bg-loaded {
        filter: blur(0);
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      /* Skeleton loader pro obrázky */
      .img-skeleton {
        background: linear-gradient(
          90deg,
          rgba(255,255,255,0.05) 25%,
          rgba(255,255,255,0.1) 50%,
          rgba(255,255,255,0.05) 75%
        );
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================================
  // 6. PERFORMANCE MONITORING
  // ==========================================
  
  function monitorImagePerformance() {
    if (!window.PerformanceObserver) return;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'img') {
          console.log(`📊 Image loaded: ${entry.name} (${Math.round(entry.duration)}ms)`);
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }

  // ==========================================
  // 7. ADAPTIVE LOADING PODLE NETWORK
  // ==========================================
  
  function adaptToNetworkSpeed() {
    if (!navigator.connection) return;
    
    const connection = navigator.connection;
    const effectiveType = connection.effectiveType;
    
    // Nízká kvalita pro pomalé připojení
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      document.documentElement.classList.add('low-bandwidth');
      console.log('⚠️  Pomalé připojení detekováno - snížení kvality obrázků');
    }
    
    // Event listener pro změny připojení
    connection.addEventListener('change', () => {
      console.log(`📶 Připojení změněno na: ${connection.effectiveType}`);
    });
  }

  // ==========================================
  // 8. INICIALIZATION
  // ==========================================
  
  function init() {
    // Počkat na DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    console.log('🖼️  Inicializace lazy loading...');
    
    // Spustit všechny funkce
    addBlurPlaceholder();
    addLazyLoadingToImages();
    initBackgroundLazyLoading();
    preloadCriticalImages();
    adaptToNetworkSpeed();
    
    // Monitor performance only in development
    // if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    //   monitorImagePerformance();
    // }
    
    console.log('✅ Lazy loading inicializován');
  }

  // Spustit
  init();
  
  // Export pro použití v jiných modulech
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      addLazyLoadingToImages,
      initBackgroundLazyLoading,
      generateResponsiveSrcset
    };
  }
})();
