import { supabase } from './supabase-client.js';

const fallbackImage = `${location.origin}/images/gurmao-hero-restaurant.jpg`;
const params = new URLSearchParams(location.search);
const identifier = params.get('slug') || params.get('id') || '';
const $ = id => document.getElementById(id);

const DAYS = [
  ['mon', 'Pondělí'], ['tue', 'Úterý'], ['wed', 'Středa'], ['thu', 'Čtvrtek'],
  ['fri', 'Pátek'], ['sat', 'Sobota'], ['sun', 'Neděle']
];

function text(value) {
  return String(value ?? '').trim();
}

function safeUrl(value, fallback = '') {
  try {
    const url = new URL(text(value), location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
}

function safePhone(value) {
  const number = text(value).replace(/[^+\d]/g, '');
  return number.length >= 9 ? `tel:${number}` : '';
}

function firstValue(object, ...keys) {
  for (const key of keys) {
    if (object?.[key] != null && text(object[key])) return object[key];
  }
  return '';
}

function parseHours(raw) {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function pragueClock() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Prague',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(new Date());
  const value = type => parts.find(part => part.type === type)?.value || '';
  return {
    day: value('weekday').slice(0, 3).toLowerCase(),
    minutes: Number(value('hour')) * 60 + Number(value('minute'))
  };
}

function parseMinutes(value) {
  const match = String(value || '').match(/(\d{1,2})[:.]?(\d{2})?/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  return hour >= 0 && hour <= 24 && minute >= 0 && minute < 60 ? hour * 60 + minute : null;
}

function openingState(hours) {
  const { day, minutes: current } = pragueClock();
  const raw = String(hours?.[day] || '');
  if (!raw) return { label: 'Otevírací doba neuvedena', className: 'unknown' };
  if (/closed|zavřeno|zavreno/i.test(raw)) return { label: 'Dnes zavřeno', className: 'closed' };

  const periods = [...raw.matchAll(/(\d{1,2}(?::|\.)\d{2})\s*[–—-]\s*(\d{1,2}(?::|\.)\d{2})/g)];
  if (!periods.length) return { label: raw.slice(0, 36), className: 'unknown' };

  let nextOpen = null;
  for (const period of periods) {
    const open = parseMinutes(period[1]);
    const close = parseMinutes(period[2]);
    if (open == null || close == null) continue;
    const adjustedClose = close <= open ? close + 1440 : close;
    const adjustedCurrent = current < open && adjustedClose > 1440 ? current + 1440 : current;
    if (adjustedCurrent >= open && adjustedCurrent < adjustedClose) {
      const remaining = adjustedClose - adjustedCurrent;
      const closeText = period[2].replace('.', ':');
      return remaining <= 30
        ? { label: `Zavírá za ${remaining} min`, className: 'closing' }
        : { label: `Otevřeno do ${closeText}`, className: 'open' };
    }
    if (current < open && (nextOpen == null || open < nextOpen)) nextOpen = open;
  }

  if (nextOpen != null) {
    const hour = String(Math.floor(nextOpen / 60)).padStart(2, '0');
    const minute = String(nextOpen % 60).padStart(2, '0');
    return { label: `Zavřeno · otevírá v ${hour}:${minute}`, className: 'closed' };
  }
  return { label: 'Nyní zavřeno', className: 'closed' };
}

function priceLabel(value) {
  const raw = text(value).toUpperCase();
  if (!raw) return 'Neuvedeno';
  if (raw.includes('VERY_EXPENSIVE') || raw === '4') return '$$$$';
  if (raw.includes('EXPENSIVE') || raw === '3') return '$$$';
  if (raw.includes('MODERATE') || raw === '2') return '$$';
  if (raw.includes('INEXPENSIVE') || raw === '1') return '$';
  return raw.length <= 8 ? raw : 'Neuvedeno';
}

function relative(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `před ${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `před ${hours} h`;
  return new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', dateStyle: 'medium' }).format(date);
}

function setLink(element, href) {
  if (!element) return;
  if (!href) {
    element.classList.add('is-disabled');
    element.removeAttribute('href');
    element.setAttribute('aria-disabled', 'true');
    return;
  }
  element.href = href;
  element.classList.remove('is-disabled');
  element.removeAttribute('aria-disabled');
}

function updateMetadata(restaurant, name, description, image) {
  const canonical = new URL('restaurant.html', location.origin);
  canonical.searchParams.set('slug', restaurant.slug || restaurant.id);
  document.title = `${name} – ${restaurant.city ? `${restaurant.city} | ` : ''}GURMAO`;
  $('metaDescription').content = description.slice(0, 155);
  $('canonicalUrl').href = canonical.href;
  $('ogTitle').content = document.title;
  $('ogDescription').content = description.slice(0, 200);
  $('ogUrl').content = canonical.href;
  $('ogImage').content = image;
  $('twitterTitle').content = document.title;
  $('twitterDescription').content = description.slice(0, 200);
  $('twitterImage').content = image;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name,
    description,
    url: canonical.href,
    image,
    telephone: text(restaurant.phone) || undefined,
    servesCuisine: text(firstValue(restaurant, 'cuisine_type', 'tag', 'category_label')) || undefined,
    priceRange: priceLabel(firstValue(restaurant, 'price_level', 'price')) !== 'Neuvedeno' ? priceLabel(firstValue(restaurant, 'price_level', 'price')) : undefined,
    address: (restaurant.address || restaurant.city) ? {
      '@type': 'PostalAddress',
      streetAddress: text(restaurant.address) || undefined,
      addressLocality: text(restaurant.city) || undefined,
      addressCountry: 'CZ'
    } : undefined,
    geo: Number.isFinite(Number(restaurant.latitude)) && Number.isFinite(Number(restaurant.longitude)) ? {
      '@type': 'GeoCoordinates',
      latitude: Number(restaurant.latitude),
      longitude: Number(restaurant.longitude)
    } : undefined,
    aggregateRating: Number(restaurant.google_rating) > 0 && Number(restaurant.google_review_count) > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: Number(restaurant.google_rating),
      reviewCount: Number(restaurant.google_review_count),
      bestRating: 5,
      worstRating: 1
    } : undefined
  };

  Object.keys(structuredData).forEach(key => structuredData[key] === undefined && delete structuredData[key]);
  $('restaurantStructuredData').textContent = JSON.stringify(structuredData);
}

function renderHours(hours) {
  const container = $('hoursGrid');
  container.replaceChildren();
  const today = pragueClock().day;
  for (const [key, label] of DAYS) {
    const row = document.createElement('div');
    row.className = `hours-row${key === today ? ' today' : ''}`;
    const day = document.createElement('span');
    day.textContent = label;
    const value = document.createElement('span');
    value.textContent = text(hours?.[key]) || 'Neuvedeno';
    row.append(day, value);
    container.appendChild(row);
  }
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

function todayInPrague() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

async function renderMenu(restaurant) {
  const container = $('menuContent');
  container.replaceChildren();
  const loading = document.createElement('p');
  loading.textContent = 'Načítám dnešní menu…';
  container.appendChild(loading);

  try {
    const { data: menu, error } = await supabase
      .from('daily_menus')
      .select('soup,mains,source_url,updated_at,created_at')
      .eq('restaurant_id', restaurant.id)
      .eq('menu_date', todayInPrague())
      .maybeSingle();
    if (error) throw error;

    container.replaceChildren();
    const soup = text(menu?.soup);
    const mains = menuItems(menu?.mains).slice(0, 10);
    if (!soup && !mains.length) {
      const strong = document.createElement('strong');
      strong.textContent = 'Dnešní menu zatím není dostupné';
      const note = document.createElement('p');
      note.textContent = 'Ověř nabídku přímo na webu restaurace nebo telefonicky.';
      container.append(strong, note);
    } else {
      if (soup) {
        const row = document.createElement('div');
        row.className = 'menu-row';
        row.textContent = `🥣 ${soup}`;
        container.appendChild(row);
      }
      for (const item of mains) {
        const row = document.createElement('div');
        row.className = 'menu-row';
        const dish = document.createElement('span');
        dish.textContent = text(item.name);
        row.appendChild(dish);
        if (item.price) {
          const price = document.createElement('strong');
          price.textContent = text(item.price);
          row.appendChild(price);
        }
        container.appendChild(row);
      }
    }

    const official = safeUrl(menu?.source_url || restaurant.menu_url || restaurant.website);
    if (official) {
      const link = document.createElement('a');
      link.className = 'menu-source';
      link.href = official;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Ověřit oficiální menu ↗';
      container.appendChild(link);
    }
  } catch (error) {
    console.error('Restaurant menu failed:', error);
    container.replaceChildren();
    const note = document.createElement('p');
    note.textContent = 'Menu se teď nepodařilo načíst. Ověř nabídku na webu restaurace.';
    container.appendChild(note);
  }
}

function renderRestaurant(restaurant) {
  const name = text(restaurant.name) || 'Restaurace';
  const city = text(restaurant.city) || 'Česká republika';
  const description = text(firstValue(restaurant, 'long_description', 'description', 'short_description', 'tag')) || `${name} v ${city}.`;
  const image = safeUrl(firstValue(restaurant, 'image_url', 'image', 'photo_url'), fallbackImage);
  const cuisine = text(firstValue(restaurant, 'cuisine_type', 'tag', 'category_label', 'category')) || 'Restaurace';
  const vibe = text(restaurant.vibe) || 'GURMAO VÝBĚR';
  const hours = parseHours(firstValue(restaurant, 'opening_hours', 'hours'));
  const status = openingState(hours);
  const rating = Number(firstValue(restaurant, 'google_rating', 'rating', 'average_rating'));
  const reviewCount = Number(firstValue(restaurant, 'google_review_count', 'user_ratings_total', 'review_count'));
  const phone = text(restaurant.phone);
  const website = safeUrl(restaurant.website);
  const latitude = Number(restaurant.latitude);
  const longitude = Number(restaurant.longitude);
  const address = text(restaurant.address) || city;
  const mapUrl = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const routeUrl = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  updateMetadata(restaurant, name, description, image);

  $('heroBg').style.backgroundImage = `url("${image.replace(/["\\]/g, '\\$&')}")`;
  $('vibe').textContent = vibe;
  $('name').textContent = name;
  $('description').textContent = description;
  $('category').textContent = cuisine;
  $('city').textContent = city;
  $('openStatus').textContent = status.label;
  $('openStatus').className = `chip ${status.className}`;
  $('about').textContent = description;
  $('factCuisine').textContent = cuisine;
  $('factPrice').textContent = priceLabel(firstValue(restaurant, 'price_level', 'price'));
  $('factCity').textContent = city;
  $('factVibe').textContent = vibe;

  $('rating').textContent = Number.isFinite(rating) && rating > 0 ? rating.toFixed(1).replace('.', ',') : '—';
  $('ratingMeta').textContent = Number.isFinite(reviewCount) && reviewCount > 0
    ? `${reviewCount.toLocaleString('cs-CZ')} hodnocení · Google`
    : 'Hodnocení není dostupné';

  $('address').textContent = address;
  $('phone').textContent = phone || 'Neuveden';
  setLink($('phone'), safePhone(phone));
  setLink($('routeAction'), routeUrl);
  setLink($('mapAction'), mapUrl);
  setLink($('webAction'), website);

  renderHours(hours);
  const verified = firstValue(restaurant, 'opening_hours_verified_at', 'updated_at');
  if (verified) {
    $('freshness').textContent = `Data naposledy ověřena ${relative(verified)}.`;
    $('freshness').classList.remove('hidden');
  }

  const save = $('saveAction');
  save.dataset.save = restaurant.slug || restaurant.id;
  save.setAttribute('aria-label', `Uložit ${name}`);

  $('shareAction').addEventListener('click', async () => {
    const payload = { title: name, text: `${name}${restaurant.city ? ` · ${restaurant.city}` : ''} na GURMAO`, url: $('canonicalUrl').href };
    try {
      if (navigator.share) await navigator.share(payload);
      else {
        await navigator.clipboard.writeText(payload.url);
        $('shareAction').textContent = '✓ Odkaz zkopírován';
        setTimeout(() => { $('shareAction').textContent = '↗ Sdílet'; }, 1800);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') console.warn('Share failed:', error);
    }
  });

  $('loading').classList.add('hidden');
  $('detail').classList.remove('hidden');
  window.updateSaveButtons?.();
  renderMenu(restaurant);
}

function showError(message = 'Restaurace nebyla nalezena') {
  $('loading').classList.add('hidden');
  $('detail').classList.add('hidden');
  $('errorMessage').textContent = message;
  $('error').classList.remove('hidden');
}

async function init() {
  if (!identifier) return showError('Chybí identifikátor restaurace.');
  try {
    let response = await supabase.from('restaurants').select('*').eq('slug', identifier).maybeSingle();
    if (response.error) throw response.error;
    let restaurant = response.data;
    if (!restaurant && /^[0-9a-f-]{36}$/i.test(identifier)) {
      response = await supabase.from('restaurants').select('*').eq('id', identifier).maybeSingle();
      if (response.error) throw response.error;
      restaurant = response.data;
    }
    if (!restaurant) return showError();
    renderRestaurant(restaurant);
  } catch (error) {
    console.error('Restaurant detail failed:', error);
    showError('Detail restaurace se teď nepodařilo načíst.');
  }
}

init();