import { supabase } from './supabase-client.js';

const ROOT = document.documentElement;
const PANEL_ID = 'gurmaoGlobalHeaderSearch';
const STYLE_ID = 'gurmaoGlobalHeaderSearchStyles';
const MIN_QUERY = 2;
const LIMIT = 12;
let sequence = 0;
let userLocation = null;

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase('cs-CZ')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function terms(value) {
  return [...new Set(normalize(value).split(' ').filter(term => term.length >= MIN_QUERY))].slice(0, 4);
}

function detailUrl(item) {
  const identifier = String(item?.slug || item?.id || '');
  return identifier ? `restaurant.html?slug=${encodeURIComponent(identifier)}` : 'restaurace.html';
}

function imageUrl(value) {
  try {
    const url = new URL(String(value || ''), location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const values = [lat1, lon1, lat2, lon2].map(Number);
  if (!values.every(Number.isFinite)) return null;
  const [a, b, c, d] = values;
  const R = 6371;
  const dLat = (c - a) * Math.PI / 180;
  const dLon = (d - b) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function formatDistance(value) {
  return value < 1 ? `${Math.round(value * 1000)} m` : `${value.toFixed(1).replace('.', ',')} km`;
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .gurmao-header-search-panel{position:fixed;z-index:700;width:min(430px,calc(100vw - 24px));overflow:hidden;border:1px solid rgba(227,185,52,.3);border-radius:18px;background:rgba(5,6,5,.98);box-shadow:0 24px 70px rgba(0,0,0,.62);color:#fff}.gurmao-header-search-panel[hidden]{display:none!important}
    .gurmao-header-search-top{display:grid;grid-template-columns:minmax(0,1fr) 42px;align-items:center;border-bottom:1px solid rgba(255,255,255,.1)}.gurmao-header-search-input{width:100%;height:49px;padding:0 15px;border:0;background:transparent;color:#fff;outline:0;font:500 15px/1.2 Inter,system-ui,sans-serif}.gurmao-header-search-input::placeholder{color:rgba(255,255,255,.42)}
    .gurmao-header-search-close{width:42px;height:42px;border:0;background:transparent;color:rgba(255,255,255,.72);font-size:21px;cursor:pointer}.gurmao-header-search-tools{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.5);font-size:11px}.gurmao-header-location{min-height:32px;padding:0 10px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:transparent;color:rgba(255,255,255,.76);cursor:pointer}.gurmao-header-location[aria-pressed="true"]{border-color:rgba(227,185,52,.62);color:#f6d66a}
    .gurmao-header-search-results{max-height:min(58vh,520px);overflow:auto}.gurmao-header-search-status{padding:22px 16px;text-align:center;color:rgba(255,255,255,.58);font-size:13px}.gurmao-header-search-result{min-height:68px;display:grid;grid-template-columns:48px minmax(0,1fr) auto;align-items:center;gap:11px;padding:10px 13px;border-top:1px solid rgba(255,255,255,.07);color:#fff;text-decoration:none}.gurmao-header-search-result:hover,.gurmao-header-search-result:focus-visible{background:rgba(227,185,52,.08);outline:none}.gurmao-header-search-image{width:48px;height:48px;border-radius:11px;background:#151515 center/cover no-repeat}.gurmao-header-search-copy{min-width:0}.gurmao-header-search-name,.gurmao-header-search-meta{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gurmao-header-search-name{font-size:13px;font-weight:700}.gurmao-header-search-meta{margin-top:5px;color:rgba(255,255,255,.55);font-size:11px}.gurmao-header-search-distance{color:#f6d66a;font-size:11px;font-weight:700;white-space:nowrap}
    @media(max-width:767px){.gurmao-header-search-panel{left:10px!important;right:10px!important;top:calc(var(--gurmao-header-height,68px) + 7px)!important;width:auto}.gurmao-header-search-results{max-height:calc(100dvh - var(--gurmao-header-height,68px) - 120px)}}`;
  document.head.appendChild(style);
}

function setStatus(results, message) {
  results.replaceChildren();
  const node = document.createElement('div');
  node.className = 'gurmao-header-search-status';
  node.textContent = message;
  results.appendChild(node);
}

function position(panel, anchor) {
  if (matchMedia('(max-width:767px)').matches) return;
  const rect = anchor.getBoundingClientRect();
  panel.style.top = `${Math.round(rect.bottom + 9)}px`;
  panel.style.left = `${Math.max(12, Math.min(innerWidth - panel.offsetWidth - 12, rect.right - panel.offsetWidth))}px`;
}

function findTriggers() {
  return [...new Set([
    document.getElementById('headerSearchToggle'),
    document.getElementById('mobileSearchBtn'),
    document.getElementById('searchToggle'),
    document.querySelector('[data-header-search]')
  ].filter(Boolean))];
}

function buildPanel(triggers) {
  document.getElementById(PANEL_ID)?.remove();
  const panel = document.createElement('section');
  panel.id = PANEL_ID;
  panel.className = 'gurmao-header-search-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Vyhledávání restaurací');

  const top = document.createElement('div');
  top.className = 'gurmao-header-search-top';
  const input = document.createElement('input');
  input.className = 'gurmao-header-search-input';
  input.type = 'search';
  input.maxLength = 80;
  input.autocomplete = 'off';
  input.placeholder = 'Restaurace, kuchyně nebo město…';
  input.setAttribute('aria-label', 'Vyhledat restauraci');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'gurmao-header-search-close';
  close.setAttribute('aria-label', 'Zavřít vyhledávání');
  close.textContent = '×';
  top.append(input, close);

  const tools = document.createElement('div');
  tools.className = 'gurmao-header-search-tools';
  const hint = document.createElement('span');
  hint.textContent = `Alespoň ${MIN_QUERY} znaky`;
  const locationButton = document.createElement('button');
  locationButton.type = 'button';
  locationButton.className = 'gurmao-header-location';
  locationButton.setAttribute('aria-pressed', 'false');
  locationButton.textContent = '⌖ Blízko mě';
  tools.append(hint, locationButton);

  const results = document.createElement('div');
  results.className = 'gurmao-header-search-results';
  results.setAttribute('aria-live', 'polite');
  panel.append(top, tools, results);
  document.body.appendChild(panel);

  const setExpanded = value => triggers.forEach(trigger => trigger.setAttribute('aria-expanded', String(value)));
  const activeAnchor = () => matchMedia('(max-width:767px)').matches
    ? (document.getElementById('mobileSearchBtn') || triggers[0])
    : (document.getElementById('headerSearchToggle') || triggers[0]);

  const closePanel = () => {
    panel.hidden = true;
    setExpanded(false);
  };
  const openPanel = () => {
    document.getElementById('mobileSearchBox')?.classList.add('hidden');
    panel.hidden = false;
    setExpanded(true);
    position(panel, activeAnchor());
    setStatus(results, 'Začněte psát. Hledáme v názvu, městě, kuchyni a vibe.');
    setTimeout(() => input.focus(), 20);
  };

  close.addEventListener('click', closePanel);
  triggers.forEach(trigger => {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    const captureLegacyMobile = trigger.id === 'mobileSearchBtn';
    trigger.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      if (captureLegacyMobile) event.stopImmediatePropagation();
      panel.hidden ? openPanel() : closePanel();
    }, captureLegacyMobile ? { capture: true } : undefined);
  });

  document.addEventListener('click', event => {
    const clickedTrigger = triggers.some(trigger => trigger.contains(event.target));
    if (!panel.hidden && !panel.contains(event.target) && !clickedTrigger) closePanel();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) closePanel();
  });
  window.addEventListener('resize', () => {
    if (!panel.hidden) position(panel, activeAnchor());
  }, { passive: true });

  return { panel, input, results, locationButton };
}

async function queryRestaurants(rawQuery) {
  const queryTerms = terms(rawQuery);
  if (!queryTerms.length) return [];
  const clauses = queryTerms.flatMap(term => ['name','city','tag','vibe'].map(field => `${field}.ilike.%${term}%`));
  const { data, error } = await supabase
    .from('restaurants')
    .select('id,slug,name,city,tag,vibe,image_url,latitude,longitude,google_rating')
    .not('slug', 'is', null)
    .or(clauses.join(','))
    .order('google_rating', { ascending: false, nullsFirst: false })
    .limit(LIMIT);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

function renderResults(container, restaurants) {
  container.replaceChildren();
  if (!restaurants.length) {
    setStatus(container, 'Nic jsme nenašli. Zkuste jiný název, město nebo kuchyni.');
    return;
  }
  restaurants.forEach(item => {
    const link = document.createElement('a');
    link.className = 'gurmao-header-search-result';
    link.href = detailUrl(item);

    const image = document.createElement('span');
    image.className = 'gurmao-header-search-image';
    const src = imageUrl(item.image_url);
    if (src) image.style.backgroundImage = `url("${src.replace(/["\\]/g, '\\$&')}")`;

    const copy = document.createElement('span');
    copy.className = 'gurmao-header-search-copy';
    const name = document.createElement('span');
    name.className = 'gurmao-header-search-name';
    name.textContent = String(item.name || 'Restaurace');
    const meta = document.createElement('span');
    meta.className = 'gurmao-header-search-meta';
    meta.textContent = [item.city, item.tag].filter(Boolean).join(' · ') || 'Česká republika';
    copy.append(name, meta);

    const distance = document.createElement('span');
    distance.className = 'gurmao-header-search-distance';
    if (userLocation) {
      const km = distanceKm(userLocation.lat, userLocation.lng, item.latitude, item.longitude);
      if (km !== null) distance.textContent = formatDistance(km);
    }
    link.append(image, copy, distance);
    container.appendChild(link);
  });
}

function init() {
  if (ROOT.dataset.gurmaoHeaderSearchReady === 'true') return;
  const triggers = findTriggers();
  if (!triggers.length) return;
  ROOT.dataset.gurmaoHeaderSearchReady = 'true';
  injectStyles();
  const ui = buildPanel(triggers);
  let timer;

  ui.input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = normalize(ui.input.value);
    const current = ++sequence;
    if (q.length < MIN_QUERY) {
      setStatus(ui.results, `Zadejte alespoň ${MIN_QUERY} znaky.`);
      return;
    }
    setStatus(ui.results, 'Hledám…');
    timer = setTimeout(async () => {
      try {
        const rows = await queryRestaurants(q);
        if (current !== sequence) return;
        if (userLocation) {
          rows.sort((a, b) => (distanceKm(userLocation.lat,userLocation.lng,a.latitude,a.longitude) ?? Infinity) - (distanceKm(userLocation.lat,userLocation.lng,b.latitude,b.longitude) ?? Infinity));
        }
        renderResults(ui.results, rows);
      } catch (error) {
        if (current !== sequence) return;
        console.error('Header search failed:', error);
        setStatus(ui.results, 'Vyhledávání se nepodařilo. Zkuste to znovu.');
      }
    }, 250);
  });

  ui.locationButton.addEventListener('click', () => {
    if (userLocation) {
      userLocation = null;
      ui.locationButton.setAttribute('aria-pressed', 'false');
      ui.locationButton.textContent = '⌖ Blízko mě';
      ui.input.dispatchEvent(new Event('input'));
      return;
    }
    if (!navigator.geolocation) {
      setStatus(ui.results, 'Tento prohlížeč neumí zjistit polohu.');
      return;
    }
    ui.locationButton.disabled = true;
    ui.locationButton.textContent = 'Zjišťuji…';
    navigator.geolocation.getCurrentPosition(position => {
      userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
      ui.locationButton.disabled = false;
      ui.locationButton.setAttribute('aria-pressed', 'true');
      ui.locationButton.textContent = '⌖ Podle vzdálenosti';
      ui.input.dispatchEvent(new Event('input'));
    }, () => {
      ui.locationButton.disabled = false;
      ui.locationButton.textContent = '⌖ Blízko mě';
      setStatus(ui.results, 'Polohu se nepodařilo získat.');
    }, { enableHighAccuracy: false, timeout: 9000, maximumAge: 300000 });
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
