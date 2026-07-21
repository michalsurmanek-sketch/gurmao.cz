// GURMAO Vibe Tooltips

const vibeDescriptions = {
  '🍷 LUXE': 'Elegantní zážitek, důraz na detail, klidná atmosféra',
  '🔥 DRAMA': 'Výrazné chutě, silná osobnost, nezapomenutelné kombinace',
  '🌮 CHAOS': 'Uvolněný styl, pestrost, radost z jídla bez pravidel',
  '🌿 PURE': 'Čisté suroviny, jednoduchost, chuť v hlavní roli',
  '🖤 DARK': 'Intimní atmosféra, večerní vibe, tlumené světlo',
  '🌊 CALM': 'Klidná atmosféra, harmonie, pohoda',
  'LUXE': 'Elegantní zážitek, důraz na detail, klidná atmosféra',
  'DRAMA': 'Výrazné chutě, silná osobnost, nezapomenutelné kombinace',
  'CHAOS': 'Uvolněný styl, pestrost, radost z jídla bez pravidel',
  'PURE': 'Čisté suroviny, jednoduchost, chuť v hlavní roli',
  'DARK': 'Intimní atmosféra, večerní vibe, tlumené světlo',
  'CALM': 'Klidná atmosféra, harmonie, pohoda',
  'Luxe': 'Elegantní zážitek, důraz na detail, klidná atmosféra',
  'Drama': 'Výrazné chutě, silná osobnost, nezapomenutelné kombinace',
  'Chaos': 'Uvolněný styl, pestrost, radost z jídla bez pravidel',
  'Pure': 'Čisté suroviny, jednoduchost, chuť v hlavní roli',
  'Dark': 'Intimní atmosféra, večerní vibe, tlumené světlo',
  'Calm': 'Klidná atmosféra, harmonie, pohoda'
};

function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function ensureRestaurantCardOverlays() {
  if (!/\/restaurace\.html$/.test(location.pathname)) return;

  const cards = [...document.querySelectorAll('#restaurantsList .card-wrapper')];
  const rows = Array.isArray(window.filteredRestaurants) ? window.filteredRestaurants : [];

  cards.forEach((card, index) => {
    const media = card.querySelector('.card-front > .relative');
    if (!media) return;

    media.style.position = 'relative';
    media.style.isolation = 'isolate';

    media.querySelectorAll('.gurmao-card-overlay').forEach(el => el.remove());

    const row = rows[index] || {};
    const slug = row.slug || card.querySelector('[data-save]')?.getAttribute('data-save') || '';
    const name = row.name || card.querySelector('h3')?.textContent?.trim() || 'Restaurace';
    const city = row.city || '';
    const tag = row.tag || '';
    const image = row.image_url || row.image || row.photo_url || card.querySelector('img')?.src || '';
    const href = `restaurace-${slug}.html`;

    let vibe = String(row.vibe || row.atmosphere || row.mood || '').trim();
    if (!vibe) {
      const existingVibe = card.querySelector('.card-front .p-6 .vibe-tooltip');
      vibe = existingVibe?.textContent?.trim() || '';
    }

    card.querySelectorAll('.card-front .p-6 .vibe-tooltip').forEach(element => element.remove());

    const overlay = document.createElement('div');
    overlay.className = 'gurmao-card-overlay';
    overlay.style.cssText = 'position:absolute;inset:0;z-index:30;pointer-events:none;';

    if (vibe) {
      const badge = document.createElement('div');
      badge.className = 'vibe-tooltip';
      badge.textContent = vibe;
      badge.setAttribute('data-tooltip', vibeDescriptions[vibe] || 'Atmosféra restaurace');
      badge.style.cssText = 'position:absolute;top:14px;left:14px;z-index:31;display:inline-flex;align-items:center;min-height:32px;padding:6px 12px;border:1px solid rgba(212,175,55,.52);border-radius:999px;background:rgba(8,8,8,.82);color:#e8c43a;font-size:12px;font-weight:800;letter-spacing:.08em;line-height:1;box-shadow:0 8px 24px rgba(0,0,0,.35);backdrop-filter:blur(10px);pointer-events:auto;';
      overlay.appendChild(badge);
    }

    const actions = document.createElement('div');
    actions.style.cssText = 'position:absolute;top:12px;right:12px;z-index:32;display:flex;gap:8px;pointer-events:auto;';

    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'save-btn';
    save.setAttribute('data-save', slug);
    save.setAttribute('aria-label', 'Uložit restauraci');
    save.innerHTML = '🤍';
    save.style.cssText = 'width:44px;height:44px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(8,8,8,.78);color:white;font-size:21px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);backdrop-filter:blur(10px);';

    const share = document.createElement('button');
    share.type = 'button';
    share.className = 'share-btn';
    share.setAttribute('aria-label', 'Sdílet restauraci');
    share.setAttribute('title', 'Sdílet');
    share.setAttribute('data-restaurant', escapeAttribute(JSON.stringify({ id: slug, name, vibe, city, tag, img: image, href })));
    share.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>';
    share.style.cssText = 'width:44px;height:44px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(8,8,8,.78);color:white;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);backdrop-filter:blur(10px);';

    actions.append(save, share);
    overlay.appendChild(actions);
    media.appendChild(overlay);
  });

  if (typeof window.updateSaveButtons === 'function') window.updateSaveButtons();
}

function initVibeTooltips() {
  document.querySelectorAll('*').forEach(element => {
    const text = element.textContent?.trim();
    if (!text || element.classList.contains('vibe-tooltip')) return;

    for (const [key, description] of Object.entries(vibeDescriptions)) {
      if (!text.includes(key)) continue;
      const children = element.children;
      const hasChildrenWithText = Array.from(children).some(child => child.textContent?.trim().includes(key));
      if (!hasChildrenWithText || children.length === 0) {
        element.classList.add('vibe-tooltip');
        element.setAttribute('data-tooltip', description);
        break;
      }
    }
  });

  ensureRestaurantCardOverlays();
}

function addVibeTooltip(element, vibeKey) {
  const description = vibeDescriptions[vibeKey];
  if (description && element) {
    element.classList.add('vibe-tooltip');
    element.setAttribute('data-tooltip', description);
  }
}

function wrapVibeWithTooltip(vibeText) {
  const description = vibeDescriptions[vibeText];
  if (!description) return vibeText;
  return `<span class="vibe-tooltip" data-tooltip="${description}">${vibeText}</span>`;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVibeTooltips);
} else {
  initVibeTooltips();
}

const observer = new MutationObserver((mutations) => {
  if (!mutations.some(mutation => mutation.addedNodes.length > 0)) return;
  clearTimeout(observer.debounceTimer);
  observer.debounceTimer = setTimeout(initVibeTooltips, 80);
});

observer.observe(document.body, { childList: true, subtree: true });

window.initVibeTooltips = initVibeTooltips;
window.addVibeTooltip = addVibeTooltip;
window.wrapVibeWithTooltip = wrapVibeWithTooltip;
window.ensureRestaurantCardOverlays = ensureRestaurantCardOverlays;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initVibeTooltips, addVibeTooltip, wrapVibeWithTooltip, vibeDescriptions };
}
