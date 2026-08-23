import { supabase } from './supabase-client.js';

document.addEventListener('click', event => {
  const button = event.target.closest('.share-btn');
  if (!button) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  try {
    const restaurant = JSON.parse(button.dataset.restaurant || '{}');
    window.socialShare?.shareRestaurant(restaurant);
  } catch (error) {
    console.error('Share error:', error);
  }
}, true);

function applyRestaurantFilterStyles() {
  if (document.getElementById('restaurant-filter-style-fix')) return;
  const style = document.createElement('style');
  style.id = 'restaurant-filter-style-fix';
  style.textContent = `
    #filters.filters-drawer,#filters.filters-drawer.open{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;padding:12px 0 0!important}
    .recommend{top:28px!important}
    .restaurant-card{position:relative}
    .card-actions{display:flex!important;gap:7px!important}
    .card-badge{border-color:rgba(255,255,255,.22)!important;background:rgba(8,9,7,.78)!important;color:#fff!important}
    .card-badge.vibe-luxe{border-color:rgba(243,201,74,.55)!important;background:rgba(74,55,8,.82)!important;color:#f3c94a!important}
    .card-badge.vibe-drama{border-color:rgba(255,105,75,.55)!important;background:rgba(83,22,13,.82)!important;color:#ff856d!important}
    .card-badge.vibe-chaos{border-color:rgba(255,161,67,.55)!important;background:rgba(87,43,8,.82)!important;color:#ffb15f!important}
    .card-badge.vibe-pure{border-color:rgba(93,211,121,.55)!important;background:rgba(8,57,25,.82)!important;color:#69dc83!important}
    .card-badge.vibe-dark{border-color:rgba(183,151,255,.5)!important;background:rgba(35,24,58,.86)!important;color:#c8aaff!important}
    .card-badge.vibe-calm{border-color:rgba(82,183,255,.55)!important;background:rgba(8,42,67,.84)!important;color:#75c8ff!important}
    .rating-source{margin-left:5px;color:rgba(255,255,255,.46);font-size:10px;font-weight:600;letter-spacing:.02em}
    .opening-status{font-size:12px;font-weight:600;white-space:nowrap}
    .opening-status.open{color:#69dc83}
    .opening-status.closing{color:#ffb15f}
    .opening-status.closed{color:#ff856d}
    .opening-status.unknown{color:rgba(255,255,255,.55);font-weight:500}
    .card-menu-panel{position:absolute;inset:0;z-index:8;display:none;flex-direction:column;justify-content:center;align-items:center;padding:24px;text-align:center;background:rgba(8,9,7,.97);backdrop-filter:blur(12px)}
    .restaurant-card.menu-open .card-menu-panel{display:flex}
    .card-menu-panel h4{margin:0 0 7px;font:500 20px/1.2 "Playfair Display",serif;color:#fff}
    .card-menu-panel p{margin:0 0 18px;color:rgba(255,255,255,.6);font-size:13px}
    .card-menu-link{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 18px;border-radius:10px;background:#d8ad34;color:#111;font-size:13px;font-weight:600}
    .card-menu-close{position:absolute;right:12px;top:12px;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#fff;cursor:pointer}
    .round-action svg{width:17px;height:17px;pointer-events:none}
    .menu-btn{color:#f3c94a}
  `;
  document.head.appendChild(style);
}

const VIBE_MAP = {
  luxe: '🍷 LUXE',
  drama: '🔥 DRAMA',
  chaos: '🌮 CHAOS',
  pure: '🌿 PURE',
  dark: '🖤 DARK',
  calm: '🌊 CALM'
};

const params = new URLSearchParams(location.search);
const state = {
  search: params.get('q') || '',
  cuisine: params.get('cuisine') || '',
  city: params.get('city') || '',
  vibe: VIBE_MAP[params.get('vibe')] || 'all',
  sort: params.get('sort') || 'recommended',
  view: localStorage.getItem('gurmaoRestaurantView') === 'rows' ? 'rows' : 'cards',
  perPage: 12,
  shown: 12,
  userLocation: null,
  all: [],
  filtered: [],
  loading: false
};

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
})[char]);
const clean = value => String(value || '')
  .normalize('NFKC')
  .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 80);
const norm = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

function detailUrl(restaurant, hash = '') {
  const identifier = String(restaurant.slug || restaurant.id || '');
  return `restaurant.html?slug=${encodeURIComponent(identifier)}${hash}`;
}

function distanceKm(a, b, c, d) {
  const R = 6371;
  const x = (c - a) * Math.PI / 180;
  const y = (d - b) * Math.PI / 180;
  const q = Math.sin(x / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(y / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
}

function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function updateUrl() {
  const query = new URLSearchParams();
  if (state.search) query.set('q', state.search);
  if (state.cuisine) query.set('cuisine', state.cuisine);
  if (state.city) query.set('city', state.city);
  const vibeKey = Object.keys(VIBE_MAP).find(key => VIBE_MAP[key] === state.vibe);
  if (vibeKey) query.set('vibe', vibeKey);
  if (state.sort !== 'recommended') query.set('sort', state.sort);
  history.replaceState(null, '', `${location.pathname}${query.toString() ? `?${query}` : ''}`);
}

function scrollToNearbyResults() {
  if (!window.matchMedia('(max-width: 768px)').matches) return;
  const header = document.querySelector('.site-header');
  const toolbar = document.querySelector('.toolbar');
  const firstCard = $('restaurantsList')?.firstElementChild;
  if (!header || !toolbar || !firstCard) return;
  const headerHeight = Math.ceil(header.getBoundingClientRect().height);
  const toolbarTop = toolbar.getBoundingClientRect().top + window.scrollY;
  const targetTop = Math.max(0, Math.round(toolbarTop - headerHeight));
  window.scrollTo({ top: targetTop, left: 0, behavior: 'smooth' });
  window.setTimeout(() => {
    const correctedToolbarTop = toolbar.getBoundingClientRect().top + window.scrollY;
    const correctedTarget = Math.max(0, Math.round(correctedToolbarTop - headerHeight));
    if (Math.abs(window.scrollY - correctedTarget) > 3) {
      window.scrollTo({ top: correctedTarget, left: 0, behavior: 'smooth' });
    }
  }, 420);
}

function scheduleNearbyResultsScroll() {
  const run = () => requestAnimationFrame(() => requestAnimationFrame(scrollToNearbyResults));
  if (document.fonts?.ready) document.fonts.ready.then(run).catch(run);
  else run();
}

async function loadAll() {
  if (state.loading) return;
  state.loading = true;
  $('resultCount').textContent = 'Načítání restaurací…';
  try {
    const all = [];
    let from = 0;
    const batchSize = 500;
    let total = Infinity;
    while (from < total) {
      const { data, error, count } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1);
      if (error) throw error;
      all.push(...(data || []));
      total = count ?? all.length;
      if (!data?.length || all.length >= total) break;
      from += batchSize;
    }
    state.all = all;
    fillSelects();
    applyFilters();
  } catch (error) {
    console.error(error);
    $('restaurantsList').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:70px 0;color:#e58b8b">Restaurace se nepodařilo načíst.</div>';
    $('resultCount').textContent = 'Chyba načítání';
  } finally {
    state.loading = false;
  }
}

function fillSelects() {
  const cuisines = [...new Set(state.all.map(row => row.tag).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'cs'));
  const cities = [...new Set(state.all.map(row => row.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'cs'));
  $('cuisineFilter').innerHTML = '<option value="">Všechny kuchyně</option>' + cuisines.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
  $('localityFilter').innerHTML = '<option value="">Všechny lokality</option>' + cities.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
  $('cuisineFilter').value = state.cuisine;
  $('localityFilter').value = state.city;
}

function restaurantRating(restaurant) {
  const value = Number(restaurant.google_rating || restaurant.rating || restaurant.average_rating || 0);
  return Number.isFinite(value) && value >= 0 && value <= 5 ? value : 0;
}

function restaurantReviewCount(restaurant) {
  const value = Number(
    restaurant.google_review_count ||
    restaurant.google_reviews_count ||
    restaurant.user_ratings_total ||
    restaurant.rating_count ||
    restaurant.review_count ||
    restaurant.reviews_count || 0
  );
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function hasGoogleRating(restaurant) {
  return Boolean(restaurant.google_place_id || restaurant.place_id || restaurant.google_rating);
}

function parseMinutes(value) {
  const match = String(value || '').match(/(\d{1,2})[:.]?(\d{2})?/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  return hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60 ? hours * 60 + minutes : null;
}

function todayHours(restaurant) {
  const raw = restaurant.opening_hours || restaurant.hours || restaurant.openingHours || restaurant.google_opening_hours;
  if (!raw) return '';
  const day = new Date().getDay();
  const keys = [
    ['sun', 'sunday', 'ne', 'nedele', 'neděle'],
    ['mon', 'monday', 'po', 'pondeli', 'pondělí'],
    ['tue', 'tuesday', 'ut', 'úterý', 'utery'],
    ['wed', 'wednesday', 'st', 'streda', 'středa'],
    ['thu', 'thursday', 'ct', 'čt', 'ctvrtek', 'čtvrtek'],
    ['fri', 'friday', 'pa', 'pá', 'patek', 'pátek'],
    ['sat', 'saturday', 'so', 'sobota']
  ][day];
  if (Array.isArray(raw)) return String(raw[day] ?? raw.find(value => keys.some(key => norm(value).startsWith(norm(key)))) ?? '');
  if (typeof raw === 'object') {
    const entry = Object.entries(raw).find(([key]) => keys.some(candidate => norm(key) === norm(candidate) || norm(key).startsWith(norm(candidate))));
    return String(entry?.[1] ?? '');
  }
  const text = String(raw).trim();
  if (!text) return '';
  const parts = text.split(/\n|;|\s\|\s/).map(value => value.trim()).filter(Boolean);
  const entry = parts.find(value => keys.some(key => norm(value).startsWith(norm(key))));
  return entry ? entry.replace(/^[^:–—-]+[:\s-]+/, '').trim() : text;
}

function openingStatusHtml(restaurant) {
  const value = todayHours(restaurant);
  if (!value) return '<span class="opening-status unknown">🕐 Otevírací doba neuvedena</span>';
  const normalized = norm(value);
  if (/zavreno|closed|neotevira/.test(normalized)) return '<span class="opening-status closed">● Dnes zavřeno</span>';
  const matches = [...value.matchAll(/(\d{1,2}(?::|\.)\d{2})\s*[–—-]\s*(\d{1,2}(?::|\.)\d{2})/g)];
  if (!matches.length) return `<span class="opening-status unknown">🕐 ${esc(value.slice(0, 38))}</span>`;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  let nextOpen = null;
  for (const match of matches) {
    const open = parseMinutes(match[1]);
    const close = parseMinutes(match[2]);
    if (open === null || close === null) continue;
    const adjustedClose = close <= open ? close + 1440 : close;
    const adjustedNow = current < open && adjustedClose > 1440 ? current + 1440 : current;
    if (adjustedNow >= open && adjustedNow < adjustedClose) {
      const remaining = adjustedClose - adjustedNow;
      const closeText = match[2].replace('.', ':');
      return remaining <= 30
        ? `<span class="opening-status closing">● Zavírá za ${remaining} min</span>`
        : `<span class="opening-status open">● Otevřeno do ${closeText}</span>`;
    }
    if (current < open && (nextOpen === null || open < nextOpen)) nextOpen = open;
  }
  if (nextOpen !== null) {
    const hours = String(Math.floor(nextOpen / 60)).padStart(2, '0');
    const minutes = String(nextOpen % 60).padStart(2, '0');
    return `<span class="opening-status closed">● Zavřeno · otevírá v ${hours}:${minutes}</span>`;
  }
  return '<span class="opening-status closed">● Zavřeno</span>';
}

function ratingHtml(restaurant) {
  const rating = restaurantRating(restaurant);
  if (!rating) return openingStatusHtml(restaurant);
  const reviews = restaurantReviewCount(restaurant);
  const source = hasGoogleRating(restaurant) ? '<span class="rating-source">Google</span>' : '';
  return `<span class="card-stars" aria-hidden="true">★</span><span class="rating-number">${rating.toFixed(1).replace('.', ',')}${reviews ? ` (${reviews.toLocaleString('cs-CZ')})` : ''}</span>${source}`;
}

function applyFilters(reset = true) {
  const query = norm(state.search);
  const cuisine = norm(state.cuisine);
  const city = norm(state.city);
  const rows = state.all.filter(restaurant => {
    const haystack = norm([restaurant.name, restaurant.description, restaurant.tag, restaurant.city].join(' '));
    return (!query || haystack.includes(query)) &&
      (!cuisine || norm(restaurant.tag).includes(cuisine)) &&
      (!city || norm(restaurant.city) === city) &&
      (state.vibe === 'all' || restaurant.vibe === state.vibe);
  });

  if (state.userLocation) {
    rows.forEach(restaurant => {
      const latitude = Number(restaurant.latitude);
      const longitude = Number(restaurant.longitude);
      restaurant._distance = Number.isFinite(latitude) && Number.isFinite(longitude)
        ? distanceKm(state.userLocation.lat, state.userLocation.lng, latitude, longitude)
        : Infinity;
    });
  } else {
    rows.forEach(restaurant => { delete restaurant._distance; });
  }

  if (state.sort === 'rating-desc') rows.sort((a, b) => restaurantRating(b) - restaurantRating(a));
  else if (state.sort === 'name-asc') rows.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'cs'));
  else if (state.sort === 'distance') rows.sort((a, b) => (a._distance ?? Infinity) - (b._distance ?? Infinity));

  state.filtered = rows;
  if (reset) state.shown = state.perPage;
  updateUrl();
  render();
}

function vibeKey(restaurant) {
  const value = norm(restaurant.vibe);
  if (value.includes('luxe')) return 'luxe';
  if (value.includes('drama')) return 'drama';
  if (value.includes('chaos')) return 'chaos';
  if (value.includes('pure')) return 'pure';
  if (value.includes('dark')) return 'dark';
  if (value.includes('calm')) return 'calm';
  return '';
}

function badgeHtml(restaurant) {
  const key = vibeKey(restaurant);
  if (!key) return '';
  return `<div class="card-badge vibe-${key}">${esc(VIBE_MAP[key])}</div>`;
}

function priceLevel(restaurant) {
  const raw = String(restaurant.price_level || restaurant.price || '').toUpperCase();
  if (!raw) return '';
  if (raw.includes('VERY_EXPENSIVE') || raw === '4' || raw.includes('$$$$')) return '$$$$';
  if (raw.includes('EXPENSIVE') || raw === '3' || raw.includes('$$$')) return '$$$';
  if (raw.includes('MODERATE') || raw === '2' || raw.includes('$$')) return '$$';
  if (raw.includes('INEXPENSIVE') || raw === '1' || raw === '$') return '$';
  return '';
}

function economicalRestaurantImage(restaurant) {
  const imageUrl = String(restaurant.image_url || restaurant.image || restaurant.photo_url || '').trim();
  const usesPaidGoogleProxy = imageUrl.includes('/functions/v1/google-place-photo');
  return imageUrl && !usesPaidGoogleProxy ? imageUrl : 'images/gurmao-hero-restaurant.jpg';
}

function card(restaurant) {
  const image = esc(economicalRestaurantImage(restaurant));
  const slug = String(restaurant.slug || restaurant.id || '');
  const name = esc(restaurant.name || 'Restaurace');
  const city = esc(restaurant.city || '');
  const tag = esc(restaurant.tag || 'Restaurace');
  const href = esc(detailUrl(restaurant));
  const menuHref = esc(detailUrl(restaurant, '#menu'));
  const ratingBlock = ratingHtml(restaurant);
  const price = priceLevel(restaurant);
  const priceHtml = price ? `<span class="price">${esc(price)}</span>` : '';
  const distanceHtml = Number.isFinite(restaurant._distance)
    ? `<span class="distance">⌖ ${esc(formatDistance(restaurant._distance))}</span>`
    : '';
  const shareData = esc(JSON.stringify({
    id: slug,
    name: restaurant.name,
    vibe: restaurant.vibe,
    city: restaurant.city,
    tag: restaurant.tag,
    img: image,
    href: detailUrl(restaurant)
  }));

  if (state.view === 'rows') {
    return `<article class="restaurant-row" data-restaurant-card>
      <a href="${href}"><img src="${image}" alt="${name}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='images/gurmao-hero-restaurant.jpg'"></a>
      <div class="restaurant-row-main"><h3>${name}</h3><p>${city}${city && tag ? ' · ' : ''}${tag}</p><div>${ratingBlock}${priceHtml}</div></div>
      <div class="restaurant-row-actions"><button data-save="${esc(slug)}" class="round-action save-btn" aria-label="Uložit">♡</button><button class="round-action share-btn" data-restaurant="${shareData}" aria-label="Sdílet">↗</button><a class="restaurant-row-detail" href="${menuHref}">Menu</a></div>
    </article>`;
  }

  return `<article class="restaurant-card" data-restaurant-card>
    <div class="card-image">
      <a href="${href}"><img src="${image}" alt="${name}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='images/gurmao-hero-restaurant.jpg'"></a>
      ${badgeHtml(restaurant)}
      <div class="card-actions">
        <button data-save="${esc(slug)}" class="round-action save-btn" aria-label="Uložit">♡</button>
        <button class="round-action share-btn" data-restaurant="${shareData}" aria-label="Sdílet" title="Sdílet"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"></path></svg></button>
        <button class="round-action menu-btn" aria-label="Zobrazit menu" title="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M8 8h8M8 12h8M8 16h5"></path></svg></button>
      </div>
    </div>
    <div class="card-content">
      <div class="card-title-line"><h3 class="card-title">${name}</h3></div>
      <div class="card-meta">${tag}${city ? ` · ${city}` : ''}</div>
      <div class="card-bottom"><div>${ratingBlock}${priceHtml}</div>${distanceHtml}</div>
    </div>
    <div class="card-menu-panel"><button class="card-menu-close" aria-label="Zavřít menu">×</button><h4>${name}</h4><p>Prohlédněte si aktuální nabídku a dnešní menu restaurace.</p><a class="card-menu-link" href="${menuHref}">Zobrazit menu</a></div>
  </article>`;
}

function bindCardActions() {
  document.querySelectorAll('.menu-btn').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    button.closest('.restaurant-card')?.classList.add('menu-open');
  }));
  document.querySelectorAll('.card-menu-close').forEach(button => button.addEventListener('click', () => {
    button.closest('.restaurant-card')?.classList.remove('menu-open');
  }));
}

function render() {
  const list = $('restaurantsList');
  const visible = state.filtered.slice(0, state.shown);
  list.innerHTML = visible.length
    ? visible.map(card).join('')
    : '<div style="grid-column:1/-1;text-align:center;padding:70px 0;color:rgba(255,255,255,.55)">Žádné restaurace neodpovídají filtrům.</div>';
  $('resultCount').textContent = `Celkem: ${state.filtered.length} restaurací`;
  document.querySelectorAll('.per-page-btn').forEach(button => button.classList.toggle('active', Number(button.dataset.count) === state.perPage));
  document.querySelectorAll('[data-restaurant-view]').forEach(button => button.classList.toggle('active', button.dataset.restaurantView === state.view));
  document.querySelectorAll('#filters [data-vibe]').forEach(button => button.classList.toggle('is-active', (VIBE_MAP[button.dataset.vibe] || 'all') === state.vibe));
  document.querySelector('.load-more')?.remove();
  if (state.shown < state.filtered.length) {
    const wrapper = document.createElement('div');
    wrapper.className = 'load-more page-shell';
    wrapper.innerHTML = '<button type="button">Načíst další restaurace</button>';
    wrapper.querySelector('button').onclick = () => {
      state.shown += state.perPage;
      render();
    };
    list.after(wrapper);
  }
  bindCardActions();
  if (typeof window.updateSaveButtons === 'function') window.updateSaveButtons();
}

function bind() {
  let timer;
  const searchInput = $('searchInput');
  const searchBtn = $('searchBtn');
  const cuisineFilter = $('cuisineFilter');
  const localityFilter = $('localityFilter');
  const restaurantSort = $('restaurantSort');
  const moreFiltersBtn = $('moreFiltersBtn');
  const filters = $('filters');
  const locationBtn = $('locationBtn');

  searchInput.value = state.search;
  searchInput.addEventListener('input', event => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.search = clean(event.target.value);
      applyFilters();
    }, 250);
  });
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      state.search = clean(event.target.value);
      applyFilters();
    }
  });
  searchBtn.addEventListener('click', () => {
    state.search = clean(searchInput.value);
    applyFilters();
    scheduleNearbyResultsScroll();
  });
  cuisineFilter.addEventListener('change', event => {
    state.cuisine = event.target.value;
    applyFilters();
  });
  localityFilter.addEventListener('change', event => {
    state.city = event.target.value;
    state.userLocation = null;
    if (state.sort === 'distance') {
      state.sort = 'recommended';
      restaurantSort.value = 'recommended';
    }
    applyFilters();
  });
  restaurantSort.addEventListener('change', event => {
    state.sort = event.target.value;
    applyFilters(false);
  });
  moreFiltersBtn.addEventListener('click', () => filters.classList.toggle('open'));
  document.querySelectorAll('#filters [data-vibe]').forEach(button => {
    button.addEventListener('click', () => {
      state.vibe = VIBE_MAP[button.dataset.vibe] || 'all';
      applyFilters();
    });
  });
  document.querySelectorAll('.per-page-btn').forEach(button => {
    button.addEventListener('click', () => {
      state.perPage = Number(button.dataset.count);
      state.shown = state.perPage;
      render();
    });
  });
  document.querySelectorAll('[data-restaurant-view]').forEach(button => {
    button.addEventListener('click', () => {
      state.view = button.dataset.restaurantView;
      localStorage.setItem('gurmaoRestaurantView', state.view);
      render();
    });
  });

  locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Prohlížeč nepodporuje polohu.');
      return;
    }

    clearTimeout(timer);
    state.search = '';
    state.cuisine = '';
    state.city = '';
    state.vibe = 'all';
    state.sort = 'distance';
    state.userLocation = null;
    state.shown = state.perPage;

    searchInput.value = '';
    cuisineFilter.value = '';
    localityFilter.value = '';
    restaurantSort.value = 'distance';
    filters.classList.remove('open');
    document.querySelectorAll('#filters [data-vibe]').forEach(button => button.classList.toggle('is-active', button.dataset.vibe === 'all'));
    updateUrl();

    const originalLabel = locationBtn.textContent;
    locationBtn.disabled = true;
    locationBtn.setAttribute('aria-busy', 'true');
    locationBtn.textContent = '⌖ Zjišťuji polohu…';
    const finish = () => {
      locationBtn.disabled = false;
      locationBtn.removeAttribute('aria-busy');
      locationBtn.textContent = originalLabel;
    };

    navigator.geolocation.getCurrentPosition(position => {
      state.userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
      applyFilters();
      finish();
      scheduleNearbyResultsScroll();
    }, () => {
      state.sort = 'recommended';
      restaurantSort.value = 'recommended';
      updateUrl();
      applyFilters();
      finish();
      alert('Polohu se nepodařilo zjistit.');
    }, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000
    });
  });
}

function initRestaurantsPage() {
  applyRestaurantFilterStyles();
  bind();
  loadAll();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initRestaurantsPage, { once: true });
else initRestaurantsPage();