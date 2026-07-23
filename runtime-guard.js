// GURMAO.cz – globální ochrana běhu aplikace.
(() => {
  'use strict';

  const VERSION = '20260723-5';
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
        if (key === 'gurmao_saved' && !Array.isArray(parsed)) localStorage.setItem(key, JSON.stringify(fallback));
      } catch {
        if (fallback === null) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(fallback));
      }
    }
  }

  function installPresentationFixStyles() {
    if (document.getElementById('gurmao-runtime-presentation-fixes')) return;
    const style = document.createElement('style');
    style.id = 'gurmao-runtime-presentation-fixes';
    style.textContent = `
      .card-image.gurmao-fallback-photo{background:linear-gradient(145deg,#171811,#090a08)!important}
      .card-image.gurmao-fallback-photo img{filter:brightness(.32) saturate(.45)!important;transform:none!important}
      .card-image.gurmao-fallback-photo::after{content:'Fotografie se připravuje';position:absolute;left:50%;top:50%;z-index:3;transform:translate(-50%,-50%);padding:9px 13px;border:1px solid rgba(243,201,74,.48);border-radius:999px;background:rgba(8,9,7,.82);color:#f3c94a;font:700 11px/1 Inter,system-ui,sans-serif;white-space:nowrap;letter-spacing:.03em;pointer-events:none}
      .distance.gurmao-fake-distance{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function applyImageFallback(image) {
    if (!(image instanceof HTMLImageElement) || image.dataset.gurmaoFallbackApplied === 'true') return;
    image.dataset.gurmaoFallbackApplied = 'true';
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.src = FALLBACK_IMAGE;
    image.style.objectFit = 'cover';
    image.style.background = '#11120f';
    image.closest('.card-image')?.classList.add('gurmao-fallback-photo');
  }

  function installImageFallbacks() {
    document.addEventListener('error', event => {
      if (event.target instanceof HTMLImageElement) applyImageFallback(event.target);
    }, true);
    document.querySelectorAll('img').forEach(image => {
      if (image.complete && image.naturalWidth === 0) applyImageFallback(image);
    });
  }

  function hideInventedDistances(root = document) {
    root.querySelectorAll?.('.distance').forEach(element => {
      const text = (element.textContent || '').replace(',', '.').trim();
      if (/^(?:⌖|↕|✦)?\s*(?:0\.3|0\.6|0\.9|1\.2|1\.5)\s*km$/i.test(text)) {
        element.classList.add('gurmao-fake-distance');
        element.setAttribute('title', 'Vzdálenost se zobrazí po povolení polohy.');
      }
    });
  }

  function observeRestaurantCards() {
    if (!location.pathname.endsWith('/restaurace.html')) return;
    hideInventedDistances();
    const list = document.getElementById('restaurantsList');
    if (!list) return;
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          hideInventedDistances(node);
          node.querySelectorAll?.('img').forEach(image => {
            if (image.complete && image.naturalWidth === 0) applyImageFallback(image);
          });
        }
      }
    });
    observer.observe(list, {childList:true,subtree:true});
  }

  function createRecoveryBanner(message) {
    if (document.getElementById('gurmao-runtime-recovery')) return;
    const banner = document.createElement('div');
    banner.id = 'gurmao-runtime-recovery';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = ['position:fixed','left:16px','right:16px','bottom:16px','z-index:2147483647','display:flex','align-items:center','justify-content:space-between','gap:14px','padding:14px 16px','border:1px solid rgba(243,201,74,.55)','border-radius:14px','background:#14150f','color:#fff','box-shadow:0 18px 50px rgba(0,0,0,.55)','font:500 14px/1.4 Inter,system-ui,sans-serif'].join(';');
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

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[char]);
  }

  function todayInPrague() {
    return new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  }

  function extractSlug(card) {
    const href = card?.querySelector('a[href*="restaurace-"]')?.getAttribute('href') || '';
    const match = href.match(/restaurace-(.+?)\.html(?:$|[?#])/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function menuItems(value) {
    if (!value) return [];
    const rows = Array.isArray(value) ? value : (typeof value === 'object' ? Object.values(value) : [value]);
    return rows.map(item => {
      if (typeof item === 'string') return {name:item,price:''};
      if (!item || typeof item !== 'object') return null;
      return {name:item.name||item.title||item.dish||item.jidlo||item.text||'',price:item.price||item.cena||''};
    }).filter(item => item?.name);
  }

  function formatUpdatedAt(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('cs-CZ', {timeZone:'Europe/Prague',hour:'2-digit',minute:'2-digit'}).format(date);
  }

  function renderMenu(panel, restaurant, menu) {
    const mains = menuItems(menu?.mains).slice(0, 5);
    const soup = String(menu?.soup || '').trim();
    const updated = formatUpdatedAt(menu?.updated_at || menu?.created_at);
    const officialUrl = menu?.source_url || restaurant?.menu_url || restaurant?.website || '';
    const hasFood = Boolean(soup || mains.length);
    panel.style.justifyContent = 'flex-start';
    panel.style.alignItems = 'stretch';
    panel.style.overflowY = 'auto';
    panel.style.textAlign = 'left';
    const foodHtml = hasFood ? `${soup?`<div class="gurmao-menu-row"><span>🥣 ${escapeHtml(soup)}</span></div>`:''}${mains.map(item=>`<div class="gurmao-menu-row"><span>${escapeHtml(item.name)}</span>${item.price?`<strong>${escapeHtml(item.price)}</strong>`:''}</div>`).join('')}` : '<p class="gurmao-menu-empty">Tato restaurace dnes menu nezveřejnila.</p>';
    panel.innerHTML = `<button class="card-menu-close" type="button" aria-label="Zavřít menu">×</button><div class="gurmao-menu-head"><small>🍽️ DNEŠNÍ MENU</small><h4>${escapeHtml(restaurant?.name||'Restaurace')}</h4>${updated?`<span>Aktualizováno dnes v ${escapeHtml(updated)}</span>`:''}</div><div class="gurmao-menu-food">${foodHtml}</div><div class="gurmao-menu-actions"><a class="card-menu-link" href="restaurace-${encodeURIComponent(restaurant?.slug||'')}.html#menu">Celý profil</a>${officialUrl?`<a class="gurmao-menu-secondary" href="${escapeHtml(officialUrl)}" target="_blank" rel="noopener">Oficiální menu ↗</a>`:''}</div>`;
    panel.querySelector('.card-menu-close')?.addEventListener('click',()=>panel.closest('.restaurant-card')?.classList.remove('menu-open'));
  }

  async function loadCardMenu(button) {
    const card = button.closest('.restaurant-card');
    const panel = card?.querySelector('.card-menu-panel');
    const slug = extractSlug(card);
    if (!card || !panel || !slug || button.dataset.menuLoading === '1') return;
    card.classList.add('menu-open');
    button.dataset.menuLoading = '1';
    panel.innerHTML = '<button class="card-menu-close" type="button" aria-label="Zavřít menu">×</button><div class="gurmao-menu-loading">Načítám dnešní menu…</div>';
    panel.querySelector('.card-menu-close')?.addEventListener('click',()=>card.classList.remove('menu-open'));
    try {
      const { supabase } = await import('./supabase-client.js');
      const {data:restaurant,error:restaurantError} = await supabase.from('restaurants').select('id,name,slug,menu_url,website').eq('slug',slug).maybeSingle();
      if (restaurantError) throw restaurantError;
      if (!restaurant) throw new Error('Restaurace nebyla nalezena.');
      const {data:menu,error:menuError} = await supabase.from('daily_menus').select('*').eq('restaurant_id',restaurant.id).eq('menu_date',todayInPrague()).maybeSingle();
      if (menuError) throw menuError;
      renderMenu(panel, restaurant, menu);
    } catch (error) {
      console.error('Daily menu loading failed:', error);
      renderMenu(panel, {name:card.querySelector('.card-title')?.textContent||'Restaurace',slug}, null);
    } finally {
      delete button.dataset.menuLoading;
    }
  }

  function installDailyMenuCards() {
    if (!location.pathname.endsWith('/restaurace.html')) return;
    const style = document.createElement('style');
    style.textContent = `.gurmao-menu-loading{margin:auto;color:rgba(255,255,255,.7);font-size:14px;text-align:center}.gurmao-menu-head{padding:4px 42px 12px 0;border-bottom:1px solid rgba(255,255,255,.12)}.gurmao-menu-head small{color:#f3c94a;font-size:10px;font-weight:800;letter-spacing:.08em}.gurmao-menu-head h4{margin:5px 0 3px!important;font-size:20px!important}.gurmao-menu-head span{color:rgba(255,255,255,.48);font-size:11px}.gurmao-menu-food{padding:12px 0;display:grid;gap:8px}.gurmao-menu-row{display:flex;justify-content:space-between;gap:12px;color:#fff;font-size:12px;line-height:1.35}.gurmao-menu-row strong{flex:0 0 auto;color:#f3c94a;font-size:12px}.gurmao-menu-empty{margin:12px 0!important;color:rgba(255,255,255,.62)!important;font-size:13px!important}.gurmao-menu-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:8px}.gurmao-menu-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid rgba(243,201,74,.45);border-radius:10px;color:#fff;font-size:12px;font-weight:600}`;
    document.head.appendChild(style);
    document.addEventListener('click', event => {
      const button = event.target.closest('.menu-btn');
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      loadCardMenu(button);
    }, true);
  }

  repairLocalStorage();
  installPresentationFixStyles();
  installImageFallbacks();
  installDailyMenuCards();
  observeRestaurantCards();
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
    document.querySelectorAll('img').forEach(image => {if (image.complete && image.naturalWidth === 0) applyImageFallback(image);});
    hideInventedDistances();
    setTimeout(() => {
      const loadingNodes = [...document.querySelectorAll('body *')].filter(element => !element.children.length && /načítání restaurací|načítám restaurace|načítám detail/i.test(element.textContent||''));
      if (loadingNodes.length) createRecoveryBanner('Načítání trvá neobvykle dlouho. Může být uložená stará verze stránky.');
    }, 12000);
  }, {once:true});
})();