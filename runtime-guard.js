// GURMAO.cz – globální ochrana běhu aplikace.
(() => {
  'use strict';

  const VERSION = '20260723-2';
  const FALLBACK_IMAGE = '/images/gurmao-hero-restaurant.jpg';
  const STORAGE_KEYS = {
    gurmao_user: null,
    gurmao_saved: [],
    gurmaoRestaurantView: 'cards'
  };

  function repairLocalStorage() {
    for (const [key, fallback] of Object.entries(STORAGE_KEYS)) {
      const raw = localStorage.getItem(key);
      if (raw == null) continue;

      if (key === 'gurmaoRestaurantView') {
        if (!['cards', 'rows'].includes(raw)) localStorage.setItem(key, fallback);
        continue;
      }

      try {
        const parsed = JSON.parse(raw);
        if (key === 'gurmao_saved' && !Array.isArray(parsed)) {
          localStorage.setItem(key, JSON.stringify(fallback));
        }
      } catch {
        if (fallback === null) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(fallback));
      }
    }
  }

  function applyImageFallback(image) {
    if (!(image instanceof HTMLImageElement)) return;
    if (image.dataset.gurmaoFallbackApplied === 'true') return;

    image.dataset.gurmaoFallbackApplied = 'true';
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.src = FALLBACK_IMAGE;
    image.style.objectFit = 'cover';
    image.style.background = '#11120f';
  }

  function installImageFallbacks() {
    document.addEventListener('error', event => {
      if (event.target instanceof HTMLImageElement) {
        applyImageFallback(event.target);
      }
    }, true);

    document.querySelectorAll('img').forEach(image => {
      if (image.complete && image.naturalWidth === 0) applyImageFallback(image);
    });
  }

  function createRecoveryBanner(message) {
    if (document.getElementById('gurmao-runtime-recovery')) return;

    const banner = document.createElement('div');
    banner.id = 'gurmao-runtime-recovery';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = [
      'position:fixed', 'left:16px', 'right:16px', 'bottom:16px', 'z-index:2147483647',
      'display:flex', 'align-items:center', 'justify-content:space-between', 'gap:14px',
      'padding:14px 16px', 'border:1px solid rgba(243,201,74,.55)', 'border-radius:14px',
      'background:#14150f', 'color:#fff', 'box-shadow:0 18px 50px rgba(0,0,0,.55)',
      'font:500 14px/1.4 Inter,system-ui,sans-serif'
    ].join(';');

    const text = document.createElement('span');
    text.textContent = message;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Obnovit stránku';
    button.style.cssText = 'flex:0 0 auto;border:0;border-radius:10px;padding:10px 14px;background:#f3c94a;color:#111;font-weight:700;cursor:pointer';
    button.addEventListener('click', () => {
      const url = new URL(location.href);
      url.searchParams.set('_refresh', Date.now().toString());
      location.replace(url.href);
    });

    banner.append(text, button);
    document.body.appendChild(banner);
  }

  repairLocalStorage();
  installImageFallbacks();
  document.documentElement.dataset.gurmaoRuntime = VERSION;

  window.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) return;
    console.error('GURMAO runtime error:', event.error || event.message);
    createRecoveryBanner('Na stránce nastala chyba. Obsah může být neúplný.');
  });

  window.addEventListener('unhandledrejection', event => {
    console.error('GURMAO rejected promise:', event.reason);
    createRecoveryBanner('Některá data se nepodařilo načíst.');
  });

  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img').forEach(image => {
      if (image.complete && image.naturalWidth === 0) applyImageFallback(image);
    });

    setTimeout(() => {
      const loadingNodes = [...document.querySelectorAll('body *')].filter(element => {
        if (element.children.length) return false;
        return /načítání restaurací|načítám restaurace|načítám detail/i.test(element.textContent || '');
      });

      if (loadingNodes.length) {
        createRecoveryBanner('Načítání trvá neobvykle dlouho. Může být uložená stará verze stránky.');
      }
    }, 12000);
  }, { once: true });
})();