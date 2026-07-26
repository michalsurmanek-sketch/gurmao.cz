import { supabase } from './supabase-client.js';
import { LocationSearch } from './location-search.js';

const SEARCH_PANEL_ID = 'gurmaoGlobalHeaderSearch';
const SEARCH_STYLE_ID = 'gurmaoGlobalHeaderSearchStyles';
const MAX_DISTANCE_KM = 20;
const MIN_QUERY_LENGTH = 2;

let locationSearch;
let requestSequence = 0;

function escapeSelectorValue(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normalizeQuery(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase('cs-CZ')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function queryTerms(value) {
  return [...new Set(normalizeQuery(value).split(' ').filter(term => term.length >= 2))].slice(0, 4);
}

function validImageUrl(value) {
  try {
    const url = new URL(String(value || ''), location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function resultIdentifier(item) {
  return String(item?.slug || item?.id || '');
}

function detailUrl(type, item) {
  const page = type === 'chef' ? 'kuchar-detail.html' : 'restaurace-detail.html';
  return `${page}?id=${encodeURIComponent(resultIdentifier(item))}`;
}

function injectStyles() {
  if (document.getElementById(SEARCH_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = SEARCH_STYLE_ID;
  style.textContent = `
    .gurmao-header-search-panel{position:fixed;z-index:650;width:min(420px,calc(100vw - 24px));border:1px solid rgba(216,173,52,.3);border-radius:20px;background:rgba(5,5,5,.98);box-shadow:0 24px 70px rgba(0,0,0,.62);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);overflow:hidden;color:#fff}
    .gurmao-header-search-panel[hidden]{display:none!important}
    .gurmao-header-search-form{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;min-height:48px;border-bottom:1px solid rgba(255,255,255,.1)}
    .gurmao-header-search-icon,.gurmao-header-search-close{width:44px;height:44px;display:grid;place-items:center;border:0;background:transparent;color:rgba(255,255,255,.72)}
    .gurmao-header-search-close{cursor:pointer;font-size:21px}
    .gurmao-header-search-close:hover,.gurmao-header-search-close:focus-visible{color:#f3c94a;outline:none}
    .gurmao-header-search-input{min-width:0;width:100%;height:46px;border:0;background:transparent;color:#fff;outline:none;font:500 16px/1.2 Inter,system-ui,sans-serif}
    .gurmao-header-search-input::placeholder{color:rgba(255,255,255,.42)}
    .gurmao-header-search-tools{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.56);font:500 11px/1.3 Inter,system-ui,sans-serif}
    .gurmao-header-location{min-height:34px;display:inline-flex;align-items:center;gap:7px;padding:0 11px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:#050505;color:rgba(255,255,255,.78);cursor:pointer;font:600 11px/1 Inter,system-ui,sans-serif}
    .gurmao-header-location:hover,.gurmao-header-location:focus-visible,.gurmao-header-location[aria-pressed="true"]{border-color:rgba(216,173,52,.65);color:#f3c94a;outline:none}
    .gurmao-header-search-results{max-height:min(58vh,520px);overflow:auto;overscroll-behavior:contain}
    .gurmao-header-search-status{padding:22px 16px;color:rgba(255,255,255,.58);text-align:center;font:500 13px/1.45 Inter,system-ui,sans-serif}
    .gurmao-header-search-section{padding:9px 13px 7px;color:#d8ad34;font:700 10px/1.2 Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}
    .gurmao-header-search-result{min-height:68px;display:grid;grid-template-columns:48px minmax(0,1fr) auto;align-items:center;gap:11px;padding:10px 13px;border-top:1px solid rgba(255,255,255,.075);color:#fff;text-decoration:none}
    .gurmao-header-search-result:hover,.gurmao-header-search-result:focus-visible{background:rgba(216,173,52,.09);outline:none}
    .gurmao-header-search-image{width:48px;height:48px;border-radius:12px;background:#151515 center/cover no-repeat}
    .gurmao-header-search-copy{min-width:0}
    .gurmao-header-search-name{overflow:hidden;color:#fff;font:650 13px/1.3 Inter,system-ui,sans-serif;text-overflow:ellipsis;white-space:nowrap}
    .gurmao-header-search-meta{margin-top:4px;overflow:hidden;color:rgba(255,255,255,.55);font:500 11px/1.3 Inter,system-ui,sans-serif;text-overflow:ellipsis;white-space:nowrap}
    .gurmao-header-search-distance{color:#f3c94a;font:650 11px/1 Inter,system-ui,sans-serif;white-space:nowrap}
    .gurmao-header-search-spinner{width:15px;height:15px;border:2px solid rgba(216,173,52,.3);border-top-color:#f3c94a;border-radius:50%;animation:gurmao-search-spin .7s linear infinite}
    @keyframes gurmao-search-spin{to{transform:rotate(360deg)}}
    @media(max-width:767px){
      .gurmao-header-search-panel{left:10px!important;right:10px!important;top:calc(var(--gurmao-header-height,68px) + 7px)!important;width:auto;max-height:calc(100dvh - var(--gurmao-header-height,68px) - 20px)}
      .gurmao-header-search-results{max-height:calc(100dvh - var(--gurmao-header-height,68px) - 125px)}
    }
  `;
  document.head.appendChild(style);
}

function createIcon(path) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '17');
  svg.setAttribute('height', '17');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  path.forEach(data => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', data.tag || 'path');
    Object.entries(data.attrs).forEach(([name, value]) => node.setAttribute(name, value));
    svg.appendChild(node);
  });
  return svg;
}

function createPanel() {
  const panel = document.createElement('section');
  panel.id = SEARCH_PANEL_ID;
  panel.className = 'gurmao-header-search-panel';
  panel.setAttribute('aria-label', 'Vyhledávání restaurací a kuchařů');
  panel.hidden = true;

  const form = document.createElement('div');
  form.className = 'gurmao-header-search-form';

  const icon = document.createElement('span');
  icon.className = 'gurmao-header-search-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.appendChild(createIcon([
    { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
    { attrs: { d: 'm20 20-3.5-3.5' } }
  ]));

  const input = document.createElement('input');
  input.className = 'gurmao-header-search-input';
  input.type = 'search';
  input.maxLength = 80;
  input.autocomplete = 'off';
  input.placeholder = 'Restaurace, kuchyně, město nebo vibe…';
  input.setAttribute('aria-label', 'Vyhledat restauraci nebo kuchaře');
  input.setAttribute('aria-controls', 'gurmaoGlobalHeaderSearchResults');

  const close = document.createElement('button');
  close.className = 'gurmao-header-search-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Zavřít vyhledávání');
  close.textContent = '×';

  form.append(icon, input, close);

  const tools = document.createElement('div');
  tools.className = 'gurmao-header-search-tools';
  const hint = document.createElement('span');
  hint.textContent = `Zadejte alespoň ${MIN_QUERY_LENGTH} znaky`;
  const locationButton = document.createElement('button');
  locationButton.className = 'gurmao-header-location';
  locationButton.type = 'button';
  locationButton.setAttribute('aria-pressed', 'false');
  locationButton.textContent = `⌖ Do ${MAX_DISTANCE_KM} km`;
  tools.append(hint, locationButton);

  const results = document.createElement('div');
  results.id = 'gurmaoGlobalHeaderSearchResults';
  results.className = 'gurmao-header-search-results';
  results.setAttribute('aria-live', 'polite');

  panel.append(form, tools, results);
  document.body.appendChild(panel);
  return { panel, input, close, results, locationButton };
}

function setStatus(results, message, loading = false) {
  results.replaceChildren();
  const status = document.createElement('div');
  status.className = 'gurmao-header-search-status';
  if (loading) {
    const spinner = document.createElement('span');
    spinner.className = 'gurmao-header-search-spinner';
    spinner.style.display = 'inline-block';
    spinner.style.marginRight = '8px';
    spinner.style.verticalAlign = '-3px';
    status.append(spinner);
  }
  status.append(document.createTextNode(message));
  results.appendChild(status);
}

function addSection(results, title) {
  const heading = document.createElement('div');
  heading.className = 'gurmao-header-search-section';
  heading.textContent = title;
  results.appendChild(heading);
}

function addResult(results, type, item) {
  const link = document.createElement('a');
  link.className = 'gurmao-header-search-result';
  link.href = detailUrl(type, item);

  const image = document.createElement('span');
  image.className = 'gurmao-header-search-image';
  const imageUrl = validImageUrl(item.image_url);
  if (imageUrl) image.style.backgroundImage = `url("${escapeSelectorValue(imageUrl)}")`;

  const copy = document.createElement('span');
  copy.className = 'gurmao-header-search-copy';
  const name = document.createElement('span');
  name.className = 'gurmao-header-search-name';
  name.textContent = String(item.name || (type === 'chef' ? 'Kuchař' : 'Restaurace'));
  const meta = document.createElement('span');
  meta.className = 'gurmao-header-search-meta';
  meta.textContent = type === 'chef'
    ? 'Kuchař'
    : [item.city, item.tag || item.vibe].filter(Boolean).join(' · ');
  copy.append(name, meta);

  const distance = document.createElement('span');
  distance.className = 'gurmao-header-search-distance';
  if (Number.isFinite(item.distance)) distance.textContent = locationSearch.formatDistance(item.distance);

  link.append(image, copy, distance);
  results.appendChild(link);
}

async function searchDatabase(rawQuery, useLocation) {
  const terms = queryTerms(rawQuery);
  if (!terms.length) return { restaurants: [], chefs: [] };

  const fields = ['name', 'city', 'tag', 'vibe'];
  const restaurantFilter = terms.flatMap(term =>
    fields.map(field => `${field}.ilike.%${term}%`)
  ).join(',');
  const chefFilter = terms.map(term => `name.ilike.%${term}%`).join(',');

  const [restaurantResponse, chefResponse] = await Promise.all([
    supabase
      .from('restaurants')
      .select('id, slug, name, city, vibe, tag, image_url, latitude, longitude')
      .or(restaurantFilter)
      .limit(20),
    supabase
      .from('chefs')
      .select('id, slug, name, image_url')
      .or(chefFilter)
      .limit(8)
  ]);

  if (restaurantResponse.error) throw restaurantResponse.error;
  const chefs = chefResponse.error ? [] : (chefResponse.data || []);
  let restaurants = restaurantResponse.data || [];

  if (useLocation && locationSearch?.isLocationEnabled && locationSearch.userLocation) {
    restaurants = restaurants
      .map(restaurant => {
        const latitude = Number(restaurant.latitude);
        const longitude = Number(restaurant.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
        const distance = locationSearch.calculateDistance(
          locationSearch.userLocation.lat,
          locationSearch.userLocation.lng,
          latitude,
          longitude
        );
        return { ...restaurant, distance };
      })
      .filter(restaurant => restaurant && restaurant.distance <= MAX_DISTANCE_KM)
      .sort((a, b) => a.distance - b.distance);
  }

  return { restaurants: restaurants.slice(0, 12), chefs: chefs.slice(0, 5) };
}

function renderResults(results, payload, useLocation) {
  results.replaceChildren();
  if (!payload.restaurants.length && !payload.chefs.length) {
    setStatus(results, useLocation ? `V okruhu ${MAX_DISTANCE_KM} km nebyly nalezeny žádné výsledky.` : 'Nebyly nalezeny žádné výsledky.');
    return;
  }
  if (payload.restaurants.length) {
    addSection(results, 'Restaurace');
    payload.restaurants.forEach(item => addResult(results, 'restaurant', item));
  }
  if (payload.chefs.length) {
    addSection(results, 'Kuchaři');
    payload.chefs.forEach(item => addResult(results, 'chef', item));
  }
}

function positionPanel(panel, anchor) {
  if (window.matchMedia('(max-width:767px)').matches) {
    panel.style.removeProperty('left');
    panel.style.removeProperty('right');
    panel.style.removeProperty('top');
    return;
  }
  const rect = anchor.getBoundingClientRect();
  panel.style.top = `${Math.ceil(rect.bottom + 10)}px`;
  panel.style.right = `${Math.max(12, Math.ceil(innerWidth - rect.right))}px`;
  panel.style.removeProperty('left');
}

function setupPanelSearch(anchor, ui) {
  let expanded = false;
  let locationActive = Boolean(locationSearch?.isLocationEnabled && locationSearch.userLocation);
  let debounceTimer;

  const syncLocationButton = () => {
    ui.locationButton.setAttribute('aria-pressed', String(locationActive));
    ui.locationButton.textContent = locationActive ? `⌖ Zapnuto · ${MAX_DISTANCE_KM} km` : `⌖ Do ${MAX_DISTANCE_KM} km`;
  };

  const closePanel = () => {
    if (!expanded) return;
    expanded = false;
    ui.panel.hidden = true;
    ui.input.value = '';
    ui.results.replaceChildren();
    anchor.setAttribute('aria-expanded', 'false');
  };

  const openPanel = () => {
    positionPanel(ui.panel, anchor);
    ui.panel.hidden = false;
    expanded = true;
    anchor.setAttribute('aria-expanded', 'true');
    setStatus(ui.results, `Začněte psát. Hledáme v názvu, městě, kuchyni i vibe.`);
    window.setTimeout(() => ui.input.focus(), 30);
  };

  const runSearch = () => {
    const query = normalizeQuery(ui.input.value);
    window.clearTimeout(debounceTimer);
    if (query.length < MIN_QUERY_LENGTH) {
      requestSequence += 1;
      setStatus(ui.results, `Zadejte alespoň ${MIN_QUERY_LENGTH} znaky.`);
      return;
    }
    const currentRequest = ++requestSequence;
    setStatus(ui.results, 'Hledám…', true);
    debounceTimer = window.setTimeout(async () => {
      try {
        const payload = await searchDatabase(query, locationActive);
        if (currentRequest !== requestSequence) return;
        renderResults(ui.results, payload, locationActive);
      } catch (error) {
        if (currentRequest !== requestSequence) return;
        console.error('GURMAO header search failed:', error);
        setStatus(ui.results, 'Vyhledávání se nepodařilo. Zkuste dotaz upravit nebo opakovat.');
      }
    }, 280);
  };

  anchor.type = 'button';
  anchor.setAttribute('aria-haspopup', 'dialog');
  anchor.setAttribute('aria-controls', SEARCH_PANEL_ID);
  anchor.setAttribute('aria-expanded', 'false');
  anchor.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    expanded ? closePanel() : openPanel();
  });

  ui.close.addEventListener('click', closePanel);
  ui.input.addEventListener('input', runSearch);
  ui.input.addEventListener('keydown', event => {
    if (event.key === 'Escape') closePanel();
    if (event.key === 'Enter') {
      const firstResult = ui.results.querySelector('a[href]');
      if (firstResult) location.href = firstResult.href;
    }
  });
  ui.locationButton.addEventListener('click', async () => {
    if (locationActive) {
      locationSearch.disable();
      locationActive = false;
      syncLocationButton();
      runSearch();
      return;
    }
    ui.locationButton.disabled = true;
    ui.locationButton.textContent = 'Zjišťuji polohu…';
    try {
      await locationSearch.getUserLocation(true);
      locationActive = true;
      syncLocationButton();
      runSearch();
    } catch (error) {
      console.error('GURMAO location search failed:', error);
      locationActive = false;
      syncLocationButton();
      setStatus(ui.results, 'Polohu se nepodařilo získat. Povolte přístup k poloze nebo hledejte bez ní.');
    } finally {
      ui.locationButton.disabled = false;
    }
  });

  document.addEventListener('click', event => {
    if (expanded && !ui.panel.contains(event.target) && !anchor.contains(event.target)) closePanel();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closePanel();
  });
  window.addEventListener('resize', () => {
    if (expanded) positionPanel(ui.panel, anchor);
  });
  syncLocationButton();
}

function setupLegacyMobileSearch() {
  const button = document.getElementById('mobileSearchBtn');
  const box = document.getElementById('mobileSearchBox');
  const input = document.getElementById('mobileSearchInput');
  const results = document.getElementById('mobileSearchResults');
  const close = document.getElementById('mobileSearchClose');
  const locationButton = document.getElementById('mobileLocationToggle');
  if (!button || !box || !input || !results) return;

  let debounceTimer;
  let sequence = 0;
  let locationActive = Boolean(locationSearch?.isLocationEnabled && locationSearch.userLocation);

  const runSearch = () => {
    const query = normalizeQuery(input.value);
    window.clearTimeout(debounceTimer);
    if (query.length < MIN_QUERY_LENGTH) {
      sequence += 1;
      results.classList.remove('hidden');
      setStatus(results, `Zadejte alespoň ${MIN_QUERY_LENGTH} znaky.`);
      return;
    }
    const current = ++sequence;
    results.classList.remove('hidden');
    setStatus(results, 'Hledám…', true);
    debounceTimer = window.setTimeout(async () => {
      try {
        const payload = await searchDatabase(query, locationActive);
        if (current !== sequence) return;
        renderResults(results, payload, locationActive);
      } catch (error) {
        if (current !== sequence) return;
        console.error('GURMAO mobile header search failed:', error);
        setStatus(results, 'Vyhledávání se nepodařilo. Zkuste to znovu.');
      }
    }, 280);
  };

  input.addEventListener('input', runSearch);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      const firstResult = results.querySelector('a[href]');
      if (firstResult) location.href = firstResult.href;
    }
  });
  close?.addEventListener('click', () => {
    sequence += 1;
    results.replaceChildren();
    results.classList.add('hidden');
  });
  locationButton?.addEventListener('click', async event => {
    event.stopPropagation();
    if (locationActive) {
      locationSearch.disable();
      locationActive = false;
      locationButton.setAttribute('aria-pressed', 'false');
      runSearch();
      return;
    }
    try {
      await locationSearch.getUserLocation(true);
      locationActive = true;
      locationButton.setAttribute('aria-pressed', 'true');
      runSearch();
    } catch (error) {
      console.error('GURMAO mobile location search failed:', error);
      setStatus(results, 'Polohu se nepodařilo získat. Hledejte bez ní nebo povolte přístup k poloze.');
      results.classList.remove('hidden');
    }
  }, { capture: true });
}

function init() {
  if (document.documentElement.dataset.gurmaoHeaderSearchReady === 'true') return;
  const anchor = document.getElementById('headerSearchToggle') || document.getElementById('searchToggle');
  const mobileButton = document.getElementById('mobileSearchBtn');
  if (!anchor && !mobileButton) return;

  document.documentElement.dataset.gurmaoHeaderSearchReady = 'true';
  locationSearch = new LocationSearch();
  injectStyles();

  if (anchor) {
    const legacyPanel = document.getElementById('headerSearchPanel');
    if (legacyPanel) {
      legacyPanel.hidden = true;
      legacyPanel.setAttribute('aria-hidden', 'true');
    }
    ['navSearchInput', 'navSearchResults'].forEach(id => {
      const legacyElement = document.getElementById(id);
      if (legacyElement) legacyElement.hidden = true;
    });
    const ui = createPanel();
    setupPanelSearch(anchor, ui);
  }
  setupLegacyMobileSearch();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
