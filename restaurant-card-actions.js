// GURMAO.cz – spodní akční lišta na kartách restaurací.
(() => {
  'use strict';

  if (!location.pathname.endsWith('/restaurace.html')) return;

  const style = document.createElement('style');
  style.id = 'gurmao-card-actions-bar-style';
  style.textContent = `
    .restaurant-card .card-actions .menu-btn{display:none!important}
    .restaurant-card .card-content{padding-bottom:0!important}
    .gurmao-card-actionbar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin:15px -20px 0;border-top:1px solid rgba(255,255,255,.11)}
    .gurmao-card-action{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:0;min-height:48px;padding:10px 8px;border:0;border-right:1px solid rgba(255,255,255,.11);background:transparent;color:rgba(255,255,255,.86);font:700 12px/1.2 Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer;transition:background .18s ease,color .18s ease}
    .gurmao-card-action:last-child{border-right:0}
    .gurmao-card-action:hover,.gurmao-card-action:focus-visible{background:rgba(243,201,74,.09);color:#f3c94a;outline:none}
    .gurmao-card-action svg{width:17px;height:17px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .gurmao-card-action.is-disabled{opacity:.36;pointer-events:none}
    @media(max-width:520px){
      .gurmao-card-actionbar{margin-left:-16px;margin-right:-16px}
      .gurmao-card-action{min-height:46px;font-size:11px;gap:5px}
    }
  `;
  document.head.appendChild(style);

  const icons = {
    call: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.8a2 2 0 0 1-.45 2.11L8.07 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.84.55 2.8.68A2 2 0 0 1 22 16.92z"></path></svg>',
    route: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M8 8h8M8 12h8M8 16h5"></path></svg>'
  };

  function slugFromCard(card) {
    const href = card.querySelector('a[href*="restaurace-"]')?.getAttribute('href') || '';
    const match = href.match(/restaurace-(.+?)\.html(?:$|[?#])/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function normalizePhone(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const cleaned = raw.replace(/[^+\d]/g, '');
    return cleaned.length >= 9 ? cleaned : '';
  }

  function routeUrl(restaurant) {
    const lat = Number(restaurant?.latitude ?? restaurant?.lat);
    const lng = Number(restaurant?.longitude ?? restaurant?.lng ?? restaurant?.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat && lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
    }
    const address = [restaurant?.address, restaurant?.street, restaurant?.city].filter(Boolean).join(', ');
    return address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}` : '';
  }

  function renderBar(card, restaurant = {}) {
    if (card.querySelector('.gurmao-card-actionbar')) return;
    const slug = slugFromCard(card);
    if (!slug) return;

    const phone = normalizePhone(restaurant.phone || restaurant.telephone || restaurant.phone_number || restaurant.contact_phone || restaurant.tel);
    const route = routeUrl(restaurant);
    const content = card.querySelector('.card-content');
    if (!content) return;

    const bar = document.createElement('div');
    bar.className = 'gurmao-card-actionbar';
    bar.innerHTML = `
      <a class="gurmao-card-action${phone ? '' : ' is-disabled'}" ${phone ? `href="tel:${phone}"` : 'aria-disabled="true"'} aria-label="Zavolat do restaurace">${icons.call}<span>Zavolat</span></a>
      <a class="gurmao-card-action${route ? '' : ' is-disabled'}" ${route ? `href="${route}" target="_blank" rel="noopener"` : 'aria-disabled="true"'} aria-label="Spustit navigaci do restaurace">${icons.route}<span>Trasa</span></a>
      <button class="gurmao-card-action gurmao-bottom-menu-btn" type="button" aria-label="Zobrazit menu restaurace">${icons.menu}<span>Menu</span></button>
    `;

    bar.querySelector('.gurmao-bottom-menu-btn')?.addEventListener('click', event => {
      event.preventDefault();
      const originalMenuButton = card.querySelector('.menu-btn');
      if (originalMenuButton) originalMenuButton.click();
      else location.href = `restaurace-${encodeURIComponent(slug)}.html#menu`;
    });

    content.appendChild(bar);
  }

  async function enhanceCards(root = document) {
    const cards = root.matches?.('.restaurant-card') ? [root] : [...(root.querySelectorAll?.('.restaurant-card') || [])];
    const pending = cards.filter(card => !card.querySelector('.gurmao-card-actionbar'));
    if (!pending.length) return;

    const slugs = [...new Set(pending.map(slugFromCard).filter(Boolean))];
    let restaurants = [];
    try {
      const { supabase } = await import('./supabase-client.js');
      const { data, error } = await supabase.from('restaurants').select('*').in('slug', slugs);
      if (error) throw error;
      restaurants = data || [];
    } catch (error) {
      console.error('Card actions loading failed:', error);
    }

    const bySlug = new Map(restaurants.map(item => [String(item.slug), item]));
    pending.forEach(card => renderBar(card, bySlug.get(slugFromCard(card)) || {}));
  }

  function start() {
    enhanceCards();
    const list = document.getElementById('restaurantsList');
    if (!list) return;
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) enhanceCards(node);
        }
      }
    });
    observer.observe(list, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
