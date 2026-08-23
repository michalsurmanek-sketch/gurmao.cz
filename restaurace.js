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
    .directory-loading{grid-column:1/-1;text-align:center;padding:70px 0;color:rgba(255,255,255,.62)}
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

const CARD_FIELDS = [
  'id','slug','name','city','tag','vibe','description','image_url',
  'latitude','longitude','google_rating','google_review_count','price_level','created_at'
].join(',');

const params = new URLSearchParams(location.search);
const state = {
  search: params.get('q') || '',
  cuisine: params.get('cuisine') || '',
  city: params.get('city') || '',
  vibe: VIBE_MAP[params.get('vibe')] || 'all',
  sort: params.get('sort') || 'recommended',
  view: localStorage.getItem('gurmaoRestaurantView') === 'rows' ? 'rows' : 'cards',
  perPage: 12,
  rows: [],
  total: 0,
  userLocation: null,
  nearestRows: null,
  loading: false,
  requestSequence: 0
};

if (state.sort === 'distance') state.sort = 'recommended';

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
  if (state.sort !== 'recommended' && state.sort !== 'distance') query.set('sort', state.sort);
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
}

function scheduleNearbyResultsScroll() {
  const run = () => requestAnimationFrame(() => requestAnimationFrame(scrollToNearbyResults));
  if (document.fonts?.ready) document.fonts.ready.then(run).catch(run);
  else run();
}

function restaurantRating(restaurant) {
  const value = Number(restaurant.google_rating || 0);
  return Number.isFinite(value) && value >= 0 && value <= 5 ? value : 0;
}

function restaurantReviewCount(restaurant) {
  const value = Number(restaurant.google_review_count || 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function ratingHtml(restaurant) {
  const rating = restaurantRating(restaurant);
  if (!rating) return '<span class="opening-status unknown">Bez hodnocení</span>';
  const reviews = restaurantReviewCount(restaurant);
  return `<span class="card-stars" aria-hidden="true">★</span><span class="rating-number">${rating.toFixed(1).replace('.', ',')}${reviews ? ` (${reviews.toLocaleString('cs-CZ')})` : ''}</span><span class="rating-source">Google</span>`;
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
  const raw = String(restaurant.price_level || '').toUpperCase();
  if (!raw) return '';
  if (raw.includes('VERY_EXPENSIVE') || raw === '4') return '$$$$';
  if (raw.includes('EXPENSIVE') || raw === '3') return '$$$';
  if (raw.includes('MODERATE') || raw === '2') return '$$';
  if (raw.includes('INEXPENSIVE') || raw === '1') return '$';
  return '';
}

function economicalRestaurantImage(restaurant) {
  const imageUrl = String(restaurant.image_url || '').trim();
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

function updateToolbar() {
  $('resultCount').textContent = `Celkem: ${state.total.toLocaleString('cs-CZ')} restaurací`;
  document.querySelectorAll('.per-page-btn').forEach(button => button.classList.toggle('active', Number(button.dataset.count) === state.perPage));
  document.querySelectorAll('[data-restaurant-view]').forEach(button => button.classList.toggle('active', button.dataset.restaurantView === state.view));
  document.querySelectorAll('#filters [data-vibe]').forEach(button => button.classList.toggle('is-active', (VIBE_MAP[button.dataset.vibe] || 'all') === state.vibe));
}

function render() {
  const list = $('restaurantsList');
  list.innerHTML = state.rows.length
    ? state.rows.map(card).join('')
    : '<div style="grid-column:1/-1;text-align:center;padding:70px 0;color:rgba(255,255,255,.55)">Žádné restaurace neodpovídají filtrům.</div>';

  updateToolbar();
  document.querySelector('.load-more')?.remove();
  if (state.rows.length < state.total) {
    const wrapper = document.createElement('div');
    wrapper.className = 'load-more page-shell';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = state.loading ? 'Načítám…' : 'Načíst další restaurace';
    button.disabled = state.loading;
    button.addEventListener('click', () => loadResults(false));
    wrapper.appendChild(button);
    list.after(wrapper);
  }

  if (typeof window.updateSaveButtons === 'function') window.updateSaveButtons();
}

function applyCommonFilters(query) {
  query = query.not('slug', 'is', null);
  if (state.search) {
    const value = clean(state.search).replace(/[,%()]/g, ' ').replace(/\s+/g, ' ').trim();
    if (value) query = query.or(`name.ilike.%${value}%,description.ilike.%${value}%,tag.ilike.%${value}%,city.ilike.%${value}%`);
  }
  if (state.cuisine) query = query.ilike('tag', `%${state.cuisine}%`);
  if (state.city) query = query.eq('city', state.city);
  if (state.vibe !== 'all') query = query.eq('vibe', state.vibe);
  return query;
}

function applyServerSort(query) {
  if (state.sort === 'rating-desc') {
    return query.order('google_rating', { ascending: false, nullsFirst: false }).order('google_review_count', { ascending: false, nullsFirst: false });
  }
  if (state.sort === 'name-asc') return query.order('name', { ascending: true });
  return query.order('google_rating', { ascending: false, nullsFirst: false }).order('google_review_count', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
}

async function fetchServerPage(offset) {
  let query = supabase.from('restaurants').select(CARD_FIELDS, { count: 'exact' });
  query = applyCommonFilters(query);
  query = applyServerSort(query);
  const { data, error, count } = await query.range(offset, offset + state.perPage - 1);
  if (error) throw error;
  return { rows: data || [], total: count || 0 };
}

async function fetchNearestRows() {
  const rows = [];
  const batchSize = 500;
  let offset = 0;
  while (true) {
    let query = supabase.from('restaurants').select(CARD_FIELDS);
    query = applyCommonFilters(query).not('latitude', 'is', null).not('longitude', 'is', null);
    const { data, error } = await query.range(offset, offset + batchSize - 1);
    if (error) throw error;
    const batch = data || [];
    rows.push(...batch);
    if (batch.length < batchSize) break;
    offset += batchSize;
  }

  return rows
    .map(restaurant => {
      const latitude = Number(restaurant.latitude);
      const longitude = Number(restaurant.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return {
        ...restaurant,
        _distance: distanceKm(state.userLocation.lat, state.userLocation.lng, latitude, longitude)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a._distance - b._distance);
}

async function loadResults(reset = true) {
  const sequence = ++state.requestSequence;
  if (reset) {
    state.rows = [];
    state.nearestRows = null;
    $('restaurantsList').innerHTML = '<div class="directory-loading">Načítám restaurace…</div>';
  }
  state.loading = true;
  updateUrl();

  try {
    if (state.sort === 'distance' && state.userLocation) {
      if (!state.nearestRows) state.nearestRows = await fetchNearestRows();
      if (sequence !== state.requestSequence) return;
      state.total = state.nearestRows.length;
      const targetLength = reset ? state.perPage : state.rows.length + state.perPage;
      state.rows = state.nearestRows.slice(0, targetLength);
    } else {
      const offset = reset ? 0 : state.rows.length;
      const payload = await fetchServerPage(offset);
      if (sequence !== state.requestSequence) return;
      state.total = payload.total;
      state.rows = reset ? payload.rows : [...state.rows, ...payload.rows];
    }
  } catch (error) {
    if (sequence !== state.requestSequence) return;
    console.error('Restaurant directory loading failed:', error);
    $('restaurantsList').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:70px 0;color:#e58b8b">Restaurace se nepodařilo načíst.</div>';
    $('resultCount').textContent = 'Chyba načítání';
    state.total = state.rows.length;
    return;
  } finally {
    if (sequence === state.requestSequence) state.loading = false;
  }

  if (sequence === state.requestSequence) render();
}

async function loadFacets() {
  const values = [];
  const batchSize = 1000;
  let offset = 0;
  try {
    while (true) {
      const { data, error } = await supabase.from('restaurants').select('city,tag').range(offset, offset + batchSize - 1);
      if (error) throw error;
      const batch = data || [];
      values.push(...batch);
      if (batch.length < batchSize) break;
      offset += batchSize;
    }

    const cuisines = [...new Set(values.map(row => textValue(row.tag)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'cs'));
    const cities = [...new Set(values.map(row => textValue(row.city)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'cs'));
    $('cuisineFilter').innerHTML = '<option value="">Všechny kuchyně</option>' + cuisines.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
    $('localityFilter').innerHTML = '<option value="">Všechny lokality</option>' + cities.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
    $('cuisineFilter').value = state.cuisine;
    $('localityFilter').value = state.city;
  } catch (error) {
    console.warn('Restaurant filter options failed to load:', error);
  }
}

function textValue(value) {
  return String(value ?? '').trim();
}

function clearLocationMode() {
  state.userLocation = null;
  state.nearestRows = null;
  if (state.sort === 'distance') state.sort = 'recommended';
  if ($('restaurantSort')) $('restaurantSort').value = state.sort;
}

function requestLocation() {
  const locationBtn = $('locationBtn');
  if (!navigator.geolocation) {
    alert('Prohlížeč nepodporuje polohu.');
    return;
  }

  const originalLabel = locationBtn.textContent;
  locationBtn.disabled = true;
  locationBtn.setAttribute('aria-busy', 'true');
  locationBtn.textContent = '⌖ Zjišťuji polohu…';

  navigator.geolocation.getCurrentPosition(position => {
    state.search = '';
    state.cuisine = '';
    state.city = '';
    state.vibe = 'all';
    state.sort = 'distance';
    state.userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
    state.nearestRows = null;

    $('searchInput').value = '';
    $('cuisineFilter').value = '';
    $('localityFilter').value = '';
    $('restaurantSort').value = 'distance';
    $('filters').classList.remove('open');

    loadResults(true).then(scheduleNearbyResultsScroll);
    locationBtn.disabled = false;
    locationBtn.removeAttribute('aria-busy');
    locationBtn.textContent = originalLabel;
  }, () => {
    state.sort = 'recommended';
    state.userLocation = null;
    $('restaurantSort').value = 'recommended';
    locationBtn.disabled = false;
    locationBtn.removeAttribute('aria-busy');
    locationBtn.textContent = originalLabel;
    alert('Polohu se nepodařilo zjistit.');
  }, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 30000
  });
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
  restaurantSort.value = state.sort;

  searchInput.addEventListener('input', event => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      clearLocationMode();
      state.search = clean(event.target.value);
      loadResults(true);
    }, 300);
  });
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      clearTimeout(timer);
      clearLocationMode();
      state.search = clean(event.target.value);
      loadResults(true);
    }
  });
  searchBtn.addEventListener('click', () => {
    clearLocationMode();
    state.search = clean(searchInput.value);
    loadResults(true);
    scheduleNearbyResultsScroll();
  });
  cuisineFilter.addEventListener('change', event => {
    clearLocationMode();
    state.cuisine = event.target.value;
    loadResults(true);
  });
  localityFilter.addEventListener('change', event => {
    clearLocationMode();
    state.city = event.target.value;
    loadResults(true);
  });
  restaurantSort.addEventListener('change', event => {
    if (event.target.value === 'distance') {
      requestLocation();
      return;
    }
    state.sort = event.target.value;
    state.userLocation = null;
    state.nearestRows = null;
    loadResults(true);
  });
  moreFiltersBtn.addEventListener('click', () => filters.classList.toggle('open'));
  document.querySelectorAll('#filters [data-vibe]').forEach(button => {
    button.addEventListener('click', () => {
      clearLocationMode();
      state.vibe = VIBE_MAP[button.dataset.vibe] || 'all';
      loadResults(true);
    });
  });
  document.querySelectorAll('.per-page-btn').forEach(button => {
    button.addEventListener('click', () => {
      state.perPage = Number(button.dataset.count) || 12;
      loadResults(true);
    });
  });
  document.querySelectorAll('[data-restaurant-view]').forEach(button => {
    button.addEventListener('click', () => {
      state.view = button.dataset.restaurantView;
      localStorage.setItem('gurmaoRestaurantView', state.view);
      render();
    });
  });
  locationBtn.addEventListener('click', requestLocation);
}

function initRestaurantsPage() {
  applyRestaurantFilterStyles();
  bind();
  loadFacets();
  loadResults(true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initRestaurantsPage, { once: true });
else initRestaurantsPage();