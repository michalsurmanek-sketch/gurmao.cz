// Skutečný stav otevírací doby vedle názvu restaurace.
(() => {
  'use strict';

  if (!location.pathname.endsWith('/restaurace.html')) return;

  const style = document.createElement('style');
  style.id = 'gurmao-card-status-style';
  style.textContent = `
    .card-title-line{display:flex!important;align-items:center!important;gap:8px!important;min-width:0;flex-wrap:nowrap!important}
    .card-title-line .card-title{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .card-title-line .verified{display:none!important}
    .card-title-line .opening-status{flex:0 0 auto;display:inline-flex!important;align-items:center;min-height:22px;padding:3px 8px;border-radius:999px;font-size:10px!important;font-weight:700!important;line-height:1.1;white-space:nowrap}
    .card-title-line .opening-status.open{color:#77e58f!important;background:rgba(49,142,72,.16);border:1px solid rgba(83,207,113,.42)}
    .card-title-line .opening-status.closing{color:#ffc36b!important;background:rgba(191,117,21,.16);border:1px solid rgba(255,177,95,.42)}
    .card-title-line .opening-status.closed{color:#ff927d!important;background:rgba(153,49,32,.18);border:1px solid rgba(255,133,109,.42)}
    .card-title-line .opening-status.unknown{color:rgba(255,255,255,.58)!important;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14)}
    .card-bottom .opening-status{display:none!important}
    @media(max-width:520px){
      .card-title-line{align-items:center!important;flex-wrap:nowrap!important;gap:6px!important}
      .card-title-line .card-title{flex:1 1 auto!important;min-width:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .card-title-line .opening-status{flex:0 0 auto!important;padding:3px 7px!important;font-size:9px!important;max-width:46%;overflow:hidden;text-overflow:ellipsis}
    }
  `;
  document.head.appendChild(style);

  const normalize = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  function pragueNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Prague',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(new Date());
    const get = type => parts.find(part => part.type === type)?.value || '';
    const weekday = get('weekday').slice(0, 3).toLowerCase();
    return { weekday, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
  }

  function parseMinutes(value) {
    const match = String(value || '').match(/(\d{1,2})[:.]?(\d{2})?/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2] || 0);
    return hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60
      ? hours * 60 + minutes
      : null;
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
    const raw = parseHoursValue(
      restaurant.opening_hours ||
      restaurant.hours ||
      restaurant.openingHours ||
      restaurant.google_opening_hours
    );
    if (!raw) return '';

    const { weekday } = pragueNow();
    const dayIndex = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }[weekday];
    const aliases = {
      sun: ['sun', 'sunday', 'ne', 'nedele', 'neděle'],
      mon: ['mon', 'monday', 'po', 'pondeli', 'pondělí'],
      tue: ['tue', 'tuesday', 'ut', 'úterý', 'utery'],
      wed: ['wed', 'wednesday', 'st', 'streda', 'středa'],
      thu: ['thu', 'thursday', 'ct', 'čt', 'ctvrtek', 'čtvrtek'],
      fri: ['fri', 'friday', 'pa', 'pá', 'patek', 'pátek'],
      sat: ['sat', 'saturday', 'so', 'sobota']
    }[weekday] || [];

    if (Array.isArray(raw)) {
      return String(raw[dayIndex] ?? raw.find(item => aliases.some(alias => normalize(item).startsWith(normalize(alias)))) ?? '');
    }

    if (typeof raw === 'object') {
      const entry = Object.entries(raw).find(([key]) => aliases.some(alias => {
        const normalizedKey = normalize(key);
        const normalizedAlias = normalize(alias);
        return normalizedKey === normalizedAlias || normalizedKey.startsWith(normalizedAlias);
      }));
      return String(entry?.[1] ?? '');
    }

    const text = String(raw).trim();
    const parts = text.split(/\n|;|\s\|\s/).map(value => value.trim()).filter(Boolean);
    const entry = parts.find(value => aliases.some(alias => normalize(value).startsWith(normalize(alias))));
    return entry ? entry.replace(/^[^:–—-]+[:\s-]+/, '').trim() : text;
  }

  function statusFor(restaurant) {
    const value = todayHours(restaurant);
    if (!value) return { className: 'unknown', text: 'Doba neuvedena' };

    const normalized = normalize(value);
    if (/zavreno|closed|neotevira/.test(normalized)) {
      return { className: 'closed', text: 'Zavřeno' };
    }

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
        return remaining <= 30
          ? { className: 'closing', text: `Zavírá za ${remaining} min` }
          : { className: 'open', text: `Otevřeno do ${closeText}` };
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

  function slugFromCard(card) {
    const href = card.querySelector('a[href^="restaurace-"]')?.getAttribute('href') || '';
    const match = href.match(/^restaurace-(.+?)\.html/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function renderStatus(card, restaurant) {
    const titleLine = card.querySelector('.card-title-line');
    if (!titleLine) return;

    titleLine.querySelector('.verified')?.remove();
    titleLine.querySelector('.opening-status')?.remove();

    const status = statusFor(restaurant || {});
    const badge = document.createElement('span');
    badge.className = `opening-status ${status.className}`;
    badge.textContent = status.text;
    titleLine.appendChild(badge);
  }

  async function loadRestaurants() {
    const { supabase } = await import('./supabase-client.js');
    const restaurants = [];
    let from = 0;
    const batchSize = 500;

    while (true) {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .range(from, from + batchSize - 1);
      if (error) throw error;
      restaurants.push(...(data || []));
      if (!data || data.length < batchSize) break;
      from += batchSize;
    }

    return new Map(restaurants.map(restaurant => [String(restaurant.slug || ''), restaurant]));
  }

  async function start() {
    let restaurantsBySlug;
    try {
      restaurantsBySlug = await loadRestaurants();
    } catch (error) {
      console.error('Opening hours loading failed:', error);
      restaurantsBySlug = new Map();
    }

    const apply = root => {
      const cards = root.matches?.('.restaurant-card')
        ? [root]
        : [...(root.querySelectorAll?.('.restaurant-card') || [])];
      for (const card of cards) {
        const slug = slugFromCard(card);
        renderStatus(card, restaurantsBySlug.get(slug));
      }
    };

    apply(document);

    const list = document.getElementById('restaurantsList');
    if (!list) return;
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) apply(node);
        }
      }
    });
    observer.observe(list, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();