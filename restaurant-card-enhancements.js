import { supabase } from './supabase-client.js';

if (!location.pathname.endsWith('/restaurace.html')) {
  throw new Error('restaurant-card-enhancements loaded outside restaurant directory');
}

const restaurantCache = new Map();
let enhancementTimer = null;

function addStyles() {
  if (document.getElementById('gurmao-card-enhancements-style')) return;
  const style = document.createElement('style');
  style.id = 'gurmao-card-enhancements-style';
  style.textContent = `
    .card-title-line{display:flex!important;align-items:center!important;gap:8px!important;min-width:0;flex-wrap:nowrap!important}
    .card-title-line .card-title{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .card-title-line .opening-status{flex:0 0 auto;display:inline-flex!important;align-items:center;min-height:22px;padding:3px 8px;border-radius:999px;font-size:10px!important;font-weight:700!important;line-height:1.1;white-space:nowrap}
    .card-title-line .opening-status.open{color:#77e58f!important;background:rgba(49,142,72,.16);border:1px solid rgba(83,207,113,.42)}
    .card-title-line .opening-status.closing{color:#ffc36b!important;background:rgba(191,117,21,.16);border:1px solid rgba(255,177,95,.42)}
    .card-title-line .opening-status.closed{color:#ff927d!important;background:rgba(153,49,32,.18);border:1px solid rgba(255,133,109,.42)}
    .card-title-line .opening-status.unknown{color:rgba(255,255,255,.58)!important;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14)}
    .restaurant-card .card-actions .menu-btn{display:none!important}
    .restaurant-card .card-content{padding-bottom:0!important}
    .gurmao-card-actionbar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin:15px -16px 0;border-top:1px solid rgba(255,255,255,.11)}
    .gurmao-card-action{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:0;min-height:48px;padding:10px 8px;border:0;border-right:1px solid rgba(255,255,255,.11);background:transparent;color:rgba(255,255,255,.86);font:700 12px/1.2 Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer;transition:background .18s ease,color .18s ease}
    .gurmao-card-action:last-child{border-right:0}
    .gurmao-card-action:hover,.gurmao-card-action:focus-visible{background:rgba(243,201,74,.09);color:#f3c94a;outline:none}
    .gurmao-card-action svg{width:17px;height:17px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .gurmao-card-action.is-disabled{opacity:.36;pointer-events:none}
    .card-menu-panel{justify-content:flex-start!important;align-items:stretch!important;text-align:left!important;overflow-y:auto!important;padding:22px!important}
    .gurmao-menu-head{padding:2px 40px 12px 0;border-bottom:1px solid rgba(255,255,255,.12)}
    .gurmao-menu-head small{color:#f3c94a;font-size:10px;font-weight:800;letter-spacing:.08em}
    .gurmao-menu-head h4{margin:5px 0 3px!important;font-size:20px!important}
    .gurmao-menu-head span{color:rgba(255,255,255,.48);font-size:11px}
    .gurmao-menu-food{padding:12px 0;display:grid;gap:8px}
    .gurmao-menu-row{display:flex;justify-content:space-between;gap:12px;color:#fff;font-size:12px;line-height:1.35}
    .gurmao-menu-row strong{flex:0 0 auto;color:#f3c94a;font-size:12px}
    .gurmao-menu-empty{margin:12px 0!important;color:rgba(255,255,255,.62)!important;font-size:13px!important}
    .gurmao-menu-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:8px}
    .gurmao-menu-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid rgba(243,201,74,.45);border-radius:10px;color:#fff;font-size:12px;font-weight:600}
    .gurmao-menu-loading{margin:auto;color:rgba(255,255,255,.7);font-size:14px;text-align:center}
    @media(max-width:520px){
      .card-title-line{gap:6px!important}
      .card-title-line .opening-status{padding:3px 7px!important;font-size:9px!important;max-width:46%;overflow:hidden;text-overflow:ellipsis}
      .gurmao-card-action{min-height:46px;font-size:11px;gap:5px}
    }
  `;
  document.head.appendChild(style);
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function cardSlug(card) {
  const saved = card.querySelector('[data-save]')?.getAttribute('data-save');
  if (saved) return saved;
  const href = card.querySelector('a[href*="restaurant.html"]')?.getAttribute('href') || '';
  try {
    const url = new URL(href, location.href);
    return url.searchParams.get('slug') || '';
  } catch {
    return '';
  }
}

function pragueNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Prague', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date());
  const get = type => parts.find(part => part.type === type)?.value || '';
  return { weekday: get('weekday').slice(0, 3).toLowerCase(), minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

function parseMinutes(value) {
  const match = String(value || '').match(/(\d{1,2})[:.]?(\d{2})?/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  return hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60 ? hours * 60 + minutes : null;
}

function parseHoursValue(raw) {
  if (typeof raw !== 'string') return raw;
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try { return JSON.parse(trimmed); } catch { return trimmed; }
  }
  return trimmed;
}

function todayHours(restaurant) {
  const raw = parseHoursValue(restaurant.opening_hours);
  if (!raw) return '';
  const { weekday } = pragueNow();
  const dayIndex = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }[weekday];
  const aliases = {
    sun: ['sun', 'sunday', 'ne', 'nedele', 'neděle'], mon: ['mon', 'monday', 'po', 'pondeli', 'pondělí'],
    tue: ['tue', 'tuesday', 'ut', 'úterý', 'utery'], wed: ['wed', 'wednesday', 'st', 'streda', 'středa'],
    thu: ['thu', 'thursday', 'ct', 'čt', 'ctvrtek', 'čtvrtek'], fri: ['fri', 'friday', 'pa', 'pá', 'patek', 'pátek'],
    sat: ['sat', 'saturday', 'so', 'sobota']
  }[weekday] || [];

  if (Array.isArray(raw)) return String(raw[dayIndex] ?? raw.find(item => aliases.some(alias => normalize(item).startsWith(normalize(alias)))) ?? '');
  if (typeof raw === 'object') {
    const entry = Object.entries(raw).find(([key]) => aliases.some(alias => normalize(key) === normalize(alias) || normalize(key).startsWith(normalize(alias))));
    return String(entry?.[1] ?? '');
  }
  const text = String(raw).trim();
  const parts = text.split(/\n|;|\s\|\s/).map(value => value.trim()).filter(Boolean);
  const entry = parts.find(value => aliases.some(alias => normalize(value).startsWith(normalize(alias))));
  return entry ? entry.replace(/^[^:–—-]+[:\s-]+/, '').trim() : text;
}

function openingStatus(restaurant) {
  const value = todayHours(restaurant);
  if (!value) return { className: 'unknown', text: 'Doba neuvedena' };
  if (/zavreno|closed|neotevira/.test(normalize(value))) return { className: 'closed', text: 'Zavřeno' };
  const matches = [...String(value).matchAll(/(\d{1,2}(?::|\.)\d{2})\s*[–—-]\s*(\d{1,2}(?::|\.)\d{2})/g)];
  if (!matches.length) return { className: 'unknown', text: String(value).slice(0, 24) };

  const current = pragueNow().minutes;
  let nextOpen = null;
  for (const match of matches) {
    const open = parseMinutes(match[1]);
    const close = parseMinutes(match[2]);
    if (open === null || close === null) continue;
    const adjustedClose = close <= open ? close + 1440 : close;
    const adjustedCurrent = current < open && adjustedClose > 1440 ? current + 1440 : current;
    if (adjustedCurrent >= open && adjustedCurrent < adjustedClose) {
      const remaining = adjustedClose - adjustedCurrent;
      const closeText = match[2].replace('.', ':');
      return remaining <= 30 ? { className: 'closing', text: `Zavírá za ${remaining} min` } : { className: 'open', text: `Otevřeno do ${closeText}` };
    }
    if (current < open && (nextOpen === null || open < nextOpen)) nextOpen = open;
  }
  if (nextOpen !== null) {
    const hours = String(Math.floor(nextOpen / 60)).padStart(2, '0');
    const minutes = String(nextOpen % 60).padStart(2, '0');
    return { className: 'closed', text: `Otevírá v ${hours}:${minutes}` };
  }
  return { className: 'closed', text: 'Zavřeno' };
}

function normalizePhone(value) {
  const cleaned = String(value || '').trim().replace(/[^+\d]/g, '');
  return cleaned.length >= 9 ? cleaned : '';
}

function routeUrl(restaurant) {
  const latitude = Number(restaurant.latitude);
  const longitude = Number(restaurant.longitude);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}`;
  }
  const address = [restaurant.address, restaurant.city].filter(Boolean).join(', ');
  return address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}` : '';
}

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const paths = {
    call: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.8a2 2 0 0 1-.45 2.11L8.07 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.84.55 2.8.68A2 2 0 0 1 22 16.92z'],
    route: ['M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z'],
    menu: ['M4 3h16v18H4z', 'M8 8h8M8 12h8M8 16h5']
  };
  for (const d of paths[name] || []) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  return svg;
}

function makeAction(label, iconName, href = '') {
  const element = href ? document.createElement('a') : document.createElement('button');
  element.className = 'gurmao-card-action';
  if (element instanceof HTMLButtonElement) element.type = 'button';
  if (href) element.href = href;
  element.append(icon(iconName), Object.assign(document.createElement('span'), { textContent: label }));
  return element;
}

function renderCard(card, restaurant) {
  const titleLine = card.querySelector('.card-title-line');
  if (titleLine && !titleLine.querySelector('.opening-status')) {
    const state = openingStatus(restaurant || {});
    const status = document.createElement('span');
    status.className = `opening-status ${state.className}`;
    status.textContent = state.text;
    titleLine.appendChild(status);
  }

  if (card.querySelector('.gurmao-card-actionbar')) return;
  const content = card.querySelector('.card-content');
  if (!content) return;

  const bar = document.createElement('div');
  bar.className = 'gurmao-card-actionbar';
  const phone = normalizePhone(restaurant?.phone);
  const call = makeAction('Zavolat', 'call', phone ? `tel:${phone}` : '');
  if (!phone) {
    call.classList.add('is-disabled');
    call.setAttribute('aria-disabled', 'true');
  }

  const route = routeUrl(restaurant || {});
  const navigate = makeAction('Trasa', 'route', route);
  if (!route) {
    navigate.classList.add('is-disabled');
    navigate.setAttribute('aria-disabled', 'true');
  } else {
    navigate.target = '_blank';
    navigate.rel = 'noopener noreferrer';
  }

  const menu = makeAction('Menu', 'menu');
  menu.classList.add('gurmao-menu-action');
  menu.addEventListener('click', () => loadMenu(card, restaurant));

  bar.append(call, navigate, menu);
  content.appendChild(bar);
  card.dataset.gurmaoEnhanced = 'true';
}

function todayInPrague() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function menuItems(value) {
  if (!value) return [];
  const rows = Array.isArray(value) ? value : (typeof value === 'object' ? Object.values(value) : [value]);
  return rows.map(item => {
    if (typeof item === 'string') return { name: item, price: '' };
    if (!item || typeof item !== 'object') return null;
    return { name: item.name || item.title || item.dish || item.jidlo || item.text || '', price: item.price || item.cena || '' };
  }).filter(item => item?.name);
}

function formatUpdatedAt(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', hour: '2-digit', minute: '2-digit' }).format(date);
}

function renderMenuPanel(panel, restaurant, menu) {
  panel.replaceChildren();
  const close = document.createElement('button');
  close.className = 'card-menu-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Zavřít menu');
  close.textContent = '×';
  close.addEventListener('click', () => panel.closest('.restaurant-card')?.classList.remove('menu-open'));
  panel.appendChild(close);

  const head = document.createElement('div');
  head.className = 'gurmao-menu-head';
  const kicker = document.createElement('small');
  kicker.textContent = '🍽️ DNEŠNÍ MENU';
  const heading = document.createElement('h4');
  heading.textContent = restaurant?.name || 'Restaurace';
  head.append(kicker, heading);
  const updated = formatUpdatedAt(menu?.updated_at || menu?.created_at);
  if (updated) {
    const timestamp = document.createElement('span');
    timestamp.textContent = `Aktualizováno dnes v ${updated}`;
    head.appendChild(timestamp);
  }
  panel.appendChild(head);

  const food = document.createElement('div');
  food.className = 'gurmao-menu-food';
  const soup = String(menu?.soup || '').trim();
  if (soup) {
    const row = document.createElement('div');
    row.className = 'gurmao-menu-row';
    const name = document.createElement('span');
    name.textContent = `🥣 ${soup}`;
    row.appendChild(name);
    food.appendChild(row);
  }
  const mains = menuItems(menu?.mains).slice(0, 6);
  for (const item of mains) {
    const row = document.createElement('div');
    row.className = 'gurmao-menu-row';
    const name = document.createElement('span');
    name.textContent = String(item.name);
    row.appendChild(name);
    if (item.price) {
      const price = document.createElement('strong');
      price.textContent = String(item.price);
      row.appendChild(price);
    }
    food.appendChild(row);
  }
  if (!soup && !mains.length) {
    const empty = document.createElement('p');
    empty.className = 'gurmao-menu-empty';
    empty.textContent = 'Tato restaurace dnes menu na GURMAO nezveřejnila.';
    food.appendChild(empty);
  }
  panel.appendChild(food);

  const actions = document.createElement('div');
  actions.className = 'gurmao-menu-actions';
  const detail = document.createElement('a');
  detail.className = 'card-menu-link';
  detail.href = `restaurant.html?slug=${encodeURIComponent(String(restaurant?.slug || restaurant?.id || ''))}#menu`;
  detail.textContent = 'Celý profil';
  actions.appendChild(detail);

  const officialUrl = menu?.source_url || restaurant?.menu_url || restaurant?.website;
  if (officialUrl) {
    try {
      const url = new URL(String(officialUrl));
      if (['http:', 'https:'].includes(url.protocol)) {
        const official = document.createElement('a');
        official.className = 'gurmao-menu-secondary';
        official.href = url.href;
        official.target = '_blank';
        official.rel = 'noopener noreferrer';
        official.textContent = 'Oficiální menu ↗';
        actions.appendChild(official);
      }
    } catch {}
  }
  panel.appendChild(actions);
}

async function loadMenu(card, restaurant) {
  const panel = card.querySelector('.card-menu-panel');
  if (!panel || card.dataset.menuLoading === '1') return;
  card.classList.add('menu-open');
  card.dataset.menuLoading = '1';
  panel.replaceChildren();
  const loading = document.createElement('div');
  loading.className = 'gurmao-menu-loading';
  loading.textContent = 'Načítám dnešní menu…';
  panel.appendChild(loading);

  try {
    const { data: menu, error } = await supabase
      .from('daily_menus')
      .select('soup,mains,source_url,updated_at,created_at')
      .eq('restaurant_id', restaurant.id)
      .eq('menu_date', todayInPrague())
      .maybeSingle();
    if (error) throw error;
    renderMenuPanel(panel, restaurant, menu);
  } catch (error) {
    console.error('Daily menu loading failed:', error);
    renderMenuPanel(panel, restaurant, null);
  } finally {
    delete card.dataset.menuLoading;
  }
}

async function enhanceCards() {
  const cards = [...document.querySelectorAll('.restaurant-card')].filter(card => card.dataset.gurmaoEnhanced !== 'true');
  if (!cards.length) return;
  const slugs = [...new Set(cards.map(cardSlug).filter(Boolean))];
  const missing = slugs.filter(slug => !restaurantCache.has(slug));
  if (missing.length) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id,slug,name,phone,address,city,latitude,longitude,opening_hours,menu_url,website')
        .in('slug', missing);
      if (error) throw error;
      for (const restaurant of data || []) restaurantCache.set(String(restaurant.slug), restaurant);
    } catch (error) {
      console.error('Restaurant card enhancement failed:', error);
    }
  }
  for (const card of cards) {
    const slug = cardSlug(card);
    const restaurant = restaurantCache.get(slug) || { slug, name: card.querySelector('.card-title')?.textContent || 'Restaurace' };
    renderCard(card, restaurant);
  }
}

function scheduleEnhancement() {
  clearTimeout(enhancementTimer);
  enhancementTimer = setTimeout(enhanceCards, 20);
}

addStyles();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhanceCards, { once: true });
else enhanceCards();

const list = document.getElementById('restaurantsList');
if (list) new MutationObserver(scheduleEnhancement).observe(list, { childList: true });