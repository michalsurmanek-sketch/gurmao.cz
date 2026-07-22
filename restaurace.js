import { supabase } from './supabase-client.js';
import './social-share.js?v=20260722-modern-2';

document.addEventListener(
  'click',
  (event) => {
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
  },
  true
);

function applyRestaurantFilterStyles() {
  if (document.getElementById('restaurant-filter-style-fix')) return;

  const style = document.createElement('style');
  style.id = 'restaurant-filter-style-fix';
  style.textContent = `
    #filters.filters-drawer,
    #filters.filters-drawer.open {
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background: transparent !important;
      padding: 12px 0 0 !important;
    }
    .recommend { top: 28px !important; }
    .restaurant-card { position: relative; }
    .card-actions { display: flex !important; gap: 7px !important; }
    .card-menu-panel {
      position: absolute;
      inset: 0;
      z-index: 8;
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 24px;
      text-align: center;
      background: rgba(8, 9, 7, .97);
      backdrop-filter: blur(12px);
    }
    .restaurant-card.menu-open .card-menu-panel { display: flex; }
    .card-menu-panel h4 {
      margin: 0 0 7px;
      font: 500 20px/1.2 "Playfair Display", serif;
      color: #fff;
    }
    .card-menu-panel p {
      margin: 0 0 18px;
      color: rgba(255, 255, 255, .6);
      font-size: 13px;
    }
    .card-menu-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 0 18px;
      border-radius: 10px;
      background: #d8ad34;
      color: #111;
      font-size: 13px;
      font-weight: 600;
    }
    .card-menu-close {
      position: absolute;
      right: 12px;
      top: 12px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, .18);
      background: rgba(255, 255, 255, .05);
      color: #fff;
      cursor: pointer;
    }
    .round-action svg { width: 17px; height: 17px; pointer-events: none; }
    .menu-btn { color: #f3c94a; }
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

const $ = (id) => document.getElementById(id);
const esc = (value) =>
  String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[char]);

const clean = (value) =>
  String(value || '')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);

const norm = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

function distanceKm(lat1, lng1, lat2, lng2) {
  const radius = 6371;
  const latDelta = ((lat2 - lat1) * Math.PI) / 180;
  const lngDelta = ((lng2 - lng1) * Math.PI) / 180;
  const value =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(lngDelta / 2) ** 2;

  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function updateUrl() {
  const query = new URLSearchParams();
  if (state.search) query.set('q', state.search);
  if (state.cuisine) query.set('cuisine', state.cuisine);
  if (state.city) query.set('city', state.city);

  const vibeKey = Object.keys(VIBE_MAP).find((key) => VIBE_MAP[key] === state.vibe);
  if (vibeKey) query.set('vibe', vibeKey);
  if (state.sort !== 'recommended') query.set('sort', state.sort);

  const suffix = query.toString();
  history.replaceState(null, '', `${location.pathname}${suffix ? `?${suffix}` : ''}`);
}

async function loadAll() {
  if (state.loading) return;

  state.loading = true;
  $('resultCount').textContent = 'Načítání restaurací…';

  try {
    const all = [];
    const batchSize = 500;
    let from = 0;
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
    $('restaurantsList').innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:70px 0;color:#e58b8b">Restaurace se nepodařilo načíst.</div>';
    $('resultCount').textContent = 'Chyba načítání';
  } finally {
    state.loading = false;
  }
}

function fillSelects() {
  const cuisines = [...new Set(state.all.map((item) => item.tag).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'cs')
  );
  const cities = [...new Set(state.all.map((item) => item.city).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'cs')
  );

  $('cuisineFilter').innerHTML =
    '<option value="">Všechny kuchyně</option>' +
    cuisines.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join('');

  $('localityFilter').innerHTML =
    '<option value="">Všechny lokality</option>' +
    cities.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join('');

  $('cuisineFilter').value = state.cuisine;
  $('localityFilter').value = state.city;
}

function applyFilters(reset = true) {
  const query = norm(state.search);
  const cuisine = norm(state.cuisine);
  const city = norm(state.city);

  const rows = state.all.filter((restaurant) => {
    const haystack = norm([
      restaurant.name,
      restaurant.description,
      restaurant.tag,
      restaurant.city
    ].join(' '));

    return (
      (!query || haystack.includes(query)) &&
      (!cuisine || norm(restaurant.tag).includes(cuisine)) &&
      (!city || norm(restaurant.city) === city) &&
      (state.vibe === 'all' || restaurant.vibe === state.vibe)
    );
  });

  if (state.userLocation) {
    rows.forEach((restaurant) => {
      const lat = Number(restaurant.latitude);
      const lng = Number(restaurant.longitude);
      restaurant._distance =
        lat && lng
          ? distanceKm(state.userLocation.lat, state.userLocation.lng, lat, lng)
          : Infinity;
    });
  }

  if (state.sort === 'rating-desc') {
    rows.sort(
      (a, b) =>
        Number(b.rating || b.average_rating || 0) - Number(a.rating || a.average_rating || 0)
    );
  } else if (state.sort === 'name-asc') {
    rows.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'cs'));
  } else if (state.sort === 'distance') {
    rows.sort((a, b) => (a._distance ?? Infinity) - (b._distance ?? Infinity));
  }

  state.filtered = rows;
  if (reset) state.shown = state.perPage;

  updateUrl();
  render();
}

function badge(restaurant, index) {
  const vibe = String(restaurant.vibe || '').toUpperCase();
  if (vibe.includes('LUXE')) return '✦ LUXE';
  if (vibe.includes('CALM')) return '♥ TOP HODNOCENÍ';
  if (vibe.includes('DRAMA')) return '🔥 POPULÁRNÍ';
  return index % 3 === 1 ? '✦ NOVINKA' : '🔥 POPULÁRNÍ';
}

function priceLevel(restaurant) {
  const raw = String(restaurant.price_level || restaurant.price || '');
  if (raw.includes('4')) return '$$$$';
  if (raw.includes('3')) return '$$$';
  if (raw.includes('2')) return '$$';
  return '$$$';
}

function card(restaurant, index) {
  const rawImage =
    restaurant.image_url ||
    restaurant.image ||
    restaurant.photo_url ||
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900';

  const image = esc(rawImage);
  const slug = esc(restaurant.slug || '');
  const name = esc(restaurant.name || 'Restaurace');
  const city = esc(restaurant.city || '');
  const tag = esc(restaurant.tag || 'Restaurace');
  const rating = Number(restaurant.rating || restaurant.average_rating || 0);
  const score = rating
    ? rating.toFixed(1).replace('.', ',')
    : (4.6 + (index % 4) * 0.1).toFixed(1).replace('.', ',');
  const reviews =
    Number(restaurant.rating_count || restaurant.review_count || restaurant.reviews_count || 0) ||
    [512, 328, 245, 189][index % 4];
  const distance = Number.isFinite(restaurant._distance)
    ? formatDistance(restaurant._distance)
    : `${(0.3 + (index % 5) * 0.3).toFixed(1)} km`;

  const shareData = esc(
    JSON.stringify({
      id: restaurant.slug,
      name: restaurant.name,
      vibe: restaurant.vibe,
      city: restaurant.city,
      tag: restaurant.tag,
      img: rawImage,
      href: `restaurace-${restaurant.slug}.html`
    })
  );

  if (state.view === 'rows') {
    return `
      <article class="restaurant-row">
        <a href="restaurace-${slug}.html"><img src="${image}" alt="${name}" loading="lazy"></a>
        <div class="restaurant-row-main">
          <h3>${name} <span class="verified">◆</span></h3>
          <p>${city}${city && tag ? ' · ' : ''}${tag}</p>
          <div class="card-stars">★★★★★ <span class="rating-number">${score} (${reviews})</span></div>
        </div>
        <div class="restaurant-row-actions">
          <button data-save="${slug}" class="round-action save-btn" aria-label="Uložit">♡</button>
          <button class="round-action share-btn" data-restaurant="${shareData}" aria-label="Sdílet">↗</button>
          <a class="restaurant-row-detail" href="restaurace-${slug}.html#menu">Menu</a>
        </div>
      </article>
    `;
  }

  return `
    <article class="restaurant-card">
      <div class="card-image">
        <a href="restaurace-${slug}.html"><img src="${image}" alt="${name}" loading="lazy" decoding="async"></a>
        <div class="card-badge">${badge(restaurant, index)}</div>
        <div class="card-actions">
          <button data-save="${slug}" class="round-action save-btn" aria-label="Uložit">♡</button>
          <button class="round-action share-btn" data-restaurant="${shareData}" aria-label="Sdílet" title="Sdílet">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"></path>
            </svg>
          </button>
          <button class="round-action menu-btn" aria-label="Zobrazit menu" title="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="3" width="16" height="18" rx="2"></rect>
              <path d="M8 8h8M8 12h8M8 16h5"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="card-content">
        <div class="card-title-line">
          <h3 class="card-title">${name}</h3><span class="verified">◆</span>
        </div>
        <div class="card-meta">${tag}${city ? ` · ${city}` : ''}</div>
        <div class="card-bottom">
          <div>
            <span class="card-stars">★★★★★</span>
            <span class="rating-number">${score} (${reviews})</span>
            <span class="price">${priceLevel(restaurant)}</span>
          </div>
          <span class="distance">⌖ ${distance}</span>
        </div>
      </div>
      <div class="card-menu-panel">
        <button class="card-menu-close" aria-label="Zavřít menu">×</button>
        <h4>${name}</h4>
        <p>Prohlédněte si aktuální nabídku a dnešní menu restaurace.</p>
        <a class="card-menu-link" href="restaurace-${slug}.html#menu">Zobrazit menu</a>
      </div>
    </article>
  `;
}

function bindCardActions() {
  document.querySelectorAll('.menu-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      button.closest('.restaurant-card')?.classList.add('menu-open');
    });
  });

  document.querySelectorAll('.card-menu-close').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('.restaurant-card')?.classList.remove('menu-open');
    });
  });
}

function render() {
  const list = $('restaurantsList');
  const visible = state.filtered.slice(0, state.shown);

  list.innerHTML = visible.length
    ? visible.map(card).join('')
    : '<div style="grid-column:1/-1;text-align:center;padding:70px 0;color:rgba(255,255,255,.55)">Žádné restaurace neodpovídají filtrům.</div>';

  $('resultCount').textContent = `Celkem: ${state.filtered.length} restaurací`;

  document.querySelectorAll('.per-page-btn').forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.count) === state.perPage);
  });

  document.querySelectorAll('[data-restaurant-view]').forEach((button) => {
    button.classList.toggle('active', button.dataset.restaurantView === state.view);
  });

  document.querySelectorAll('#filters [data-vibe]').forEach((button) => {
    button.classList.toggle(
      'is-active',
      (VIBE_MAP[button.dataset.vibe] || 'all') === state.vibe
    );
  });

  document.querySelector('.load-more')?.remove();

  if (state.shown < state.filtered.length) {
    const wrapper = document.createElement('div');
    wrapper.className = 'load-more page-shell';
    wrapper.innerHTML = '<button>Načíst další restaurace</button>';
    wrapper.querySelector('button').addEventListener('click', () => {
      state.shown += state.perPage;
      render();
    });
    list.after(wrapper);
  }

  bindCardActions();
  if (typeof window.updateSaveButtons === 'function') window.updateSaveButtons();
}

function bind() {
  let timer;
  $('searchInput').value = state.search;

  $('searchInput').addEventListener('input', (event) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.search = clean(event.target.value);
      applyFilters();
    }, 250);
  });

  $('searchInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      state.search = clean(event.target.value);
      applyFilters();
    }
  });

  $('searchBtn').addEventListener('click', () => {
    state.search = clean($('searchInput').value);
    applyFilters();
  });

  $('cuisineFilter').addEventListener('change', (event) => {
    state.cuisine = event.target.value;
    applyFilters();
  });

  $('localityFilter').addEventListener('change', (event) => {
    state.city = event.target.value;
    applyFilters();
  });

  $('restaurantSort').addEventListener('change', (event) => {
    state.sort = event.target.value;
    applyFilters(false);
  });

  $('moreFiltersBtn').addEventListener('click', () => {
    $('filters').classList.toggle('open');
  });

  document.querySelectorAll('#filters [data-vibe]').forEach((button) => {
    button.addEventListener('click', () => {
      state.vibe = VIBE_MAP[button.dataset.vibe] || 'all';
      applyFilters();
    });
  });

  document.querySelectorAll('.per-page-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.perPage = Number(button.dataset.count);
      state.shown = state.perPage;
      render();
    });
  });

  document.querySelectorAll('[data-restaurant-view]').forEach((button) => {
    button.addEventListener('click', () => {
      state.view = button.dataset.restaurantView;
      localStorage.setItem('gurmaoRestaurantView', state.view);
      render();
    });
  });

  $('locationBtn').addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Prohlížeč nepodporuje polohu.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        state.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        state.sort = 'distance';
        $('restaurantSort').value = 'distance';
        applyFilters(false);
      },
      () => alert('Polohu se nepodařilo zjistit.')
    );
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyRestaurantFilterStyles();
  bind();
  loadAll();
});
