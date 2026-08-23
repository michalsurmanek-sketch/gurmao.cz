import { supabase, getCurrentUser, getSavedRestaurants } from './supabase-client.js';

if (!location.pathname.endsWith('/collections.html')) {
  throw new Error('collections-page loaded outside collections');
}

const $ = id => document.getElementById(id);
const grid = $('savedGrid');
const empty = $('emptyState');
const resultCount = $('resultCount');
const topVibe = $('topVibe');
const topCity = $('topCity');
const topCuisine = $('topCuisine');
const filters = $('collectionFilters');
const sortSelect = $('collectionSort');
const undoBar = $('undoBar');
const undoButton = $('undoBtn');
const collections = window.GurmaoCollections;

let rows = [];
let activeVibe = 'all';
let userLocation = null;
let lastRemoved = null;
let undoTimer = null;

function restaurantOf(item) {
  return item?.restaurants || item || {};
}

function slugOf(item) {
  const restaurant = restaurantOf(item);
  return String(restaurant.slug || item?.restaurant_id || '').trim();
}

function safeImage(value) {
  try {
    const url = new URL(String(value || ''), location.href);
    if (['http:', 'https:'].includes(url.protocol)) return url.href;
  } catch {}
  return 'images/gurmao-hero-restaurant.jpg';
}

function canonicalDetail(item) {
  const slug = slugOf(item);
  return slug ? `restaurant.html?slug=${encodeURIComponent(slug)}` : 'restaurace.html';
}

function ratingOf(restaurant) {
  const value = Number(restaurant.google_rating || 0);
  return Number.isFinite(value) && value > 0 && value <= 5 ? value : null;
}

function reviewCountOf(restaurant) {
  const value = Number(restaurant.google_review_count || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceOf(restaurant) {
  if (!userLocation) return null;
  const latitude = Number(restaurant.latitude);
  const longitude = Number(restaurant.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return distanceKm(userLocation.lat, userLocation.lng, latitude, longitude);
}

function topValue(getter) {
  const counts = new Map();
  for (const item of rows) {
    const value = String(getter(restaurantOf(item)) || '').trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
}

function updateSummary() {
  resultCount.textContent = `${rows.length.toLocaleString('cs-CZ')} uložených`;
  topVibe.textContent = topValue(restaurant => restaurant.vibe);
  topCity.textContent = topValue(restaurant => restaurant.city);
  topCuisine.textContent = topValue(restaurant => restaurant.tag || restaurant.cuisine_type);
}

function recentOrder(item) {
  const time = Date.parse(item?.created_at || '');
  if (Number.isFinite(time)) return time;
  return Number(item?._savedOrder || 0);
}

function visibleRows() {
  let list = [...rows];
  if (activeVibe !== 'all') {
    list = list.filter(item => String(restaurantOf(item).vibe || '').toUpperCase().includes(activeVibe));
  }

  const sort = sortSelect.value;
  if (sort === 'rating') {
    list.sort((a, b) => (ratingOf(restaurantOf(b)) || 0) - (ratingOf(restaurantOf(a)) || 0));
  } else if (sort === 'name') {
    list.sort((a, b) => String(restaurantOf(a).name || '').localeCompare(String(restaurantOf(b).name || ''), 'cs'));
  } else if (sort === 'distance') {
    list.sort((a, b) => (distanceOf(restaurantOf(a)) ?? Infinity) - (distanceOf(restaurantOf(b)) ?? Infinity));
  } else {
    list.sort((a, b) => recentOrder(b) - recentOrder(a));
  }
  return list;
}

function textElement(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = String(value || '');
  return element;
}

function makeCard(item) {
  const restaurant = restaurantOf(item);
  const slug = slugOf(item);
  const article = document.createElement('article');
  article.className = 'saved-card';
  article.dataset.slug = slug;

  const media = document.createElement('div');
  media.className = 'saved-image-wrap';
  const imageLink = document.createElement('a');
  imageLink.href = canonicalDetail(item);
  imageLink.style.display = 'block';
  imageLink.style.width = '100%';
  imageLink.style.height = '100%';

  const image = document.createElement('img');
  image.src = safeImage(restaurant.image_url);
  image.alt = String(restaurant.name || 'Restaurace');
  image.loading = 'lazy';
  image.decoding = 'async';
  image.referrerPolicy = 'no-referrer';
  image.addEventListener('error', () => {
    image.src = 'images/gurmao-hero-restaurant.jpg';
  }, { once: true });
  imageLink.appendChild(image);
  media.appendChild(imageLink);

  if (restaurant.vibe) media.appendChild(textElement('span', 'vibe-badge', restaurant.vibe));

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'remove-saved';
  remove.dataset.remove = slug;
  remove.setAttribute('aria-label', `Odebrat ${restaurant.name || 'restauraci'} z výběru`);
  remove.textContent = '♥';
  media.appendChild(remove);

  const body = document.createElement('div');
  body.className = 'saved-card-body';
  const name = document.createElement('a');
  name.className = 'saved-card-name';
  name.href = canonicalDetail(item);
  name.textContent = String(restaurant.name || 'Restaurace');
  body.appendChild(name);

  const meta = document.createElement('div');
  meta.className = 'saved-card-meta';
  if (restaurant.city) meta.appendChild(textElement('span', '', restaurant.city));
  if (restaurant.tag) meta.appendChild(textElement('span', '', restaurant.tag));
  const rating = ratingOf(restaurant);
  if (rating) {
    const reviews = reviewCountOf(restaurant);
    meta.appendChild(textElement('span', 'saved-rating', `★ ${rating.toFixed(1).replace('.', ',')}${reviews ? ` · ${reviews.toLocaleString('cs-CZ')}` : ''}`));
  }
  const distance = distanceOf(restaurant);
  if (distance != null) meta.appendChild(textElement('span', '', `⌖ ${distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}`));
  body.appendChild(meta);

  article.append(media, body);
  return article;
}

function render() {
  updateSummary();
  grid.replaceChildren();
  const list = visibleRows();
  empty.hidden = rows.length > 0;

  if (!rows.length) return;
  if (!list.length) {
    grid.appendChild(textElement('div', 'collection-state', 'V tomto filtru není žádná uložená restaurace.'));
    return;
  }

  const fragment = document.createDocumentFragment();
  list.forEach(item => fragment.appendChild(makeCard(item)));
  grid.appendChild(fragment);
}

async function removeSaved(button) {
  if (button.disabled || !collections) return;
  const slug = String(button.dataset.remove || '');
  const index = rows.findIndex(item => slugOf(item) === slug);
  if (!slug || index < 0) return;
  button.disabled = true;
  const item = rows[index];

  try {
    await collections.remove(slug);
    rows.splice(index, 1);
    lastRemoved = { item, index, slug };
    render();
    showUndo();
  } catch (error) {
    console.error('Saved restaurant removal failed:', error);
    button.disabled = false;
    window.toastError?.('Restauraci se nepodařilo odebrat.');
  }
}

function showUndo() {
  clearTimeout(undoTimer);
  undoBar.hidden = false;
  undoBar.classList.add('show');
  undoTimer = setTimeout(() => {
    undoBar.classList.remove('show');
    undoBar.hidden = true;
    lastRemoved = null;
  }, 6000);
}

async function undoRemove() {
  if (!lastRemoved || undoButton.disabled || !collections) return;
  undoButton.disabled = true;
  try {
    await collections.save(lastRemoved.slug);
    rows.splice(Math.min(lastRemoved.index, rows.length), 0, lastRemoved.item);
    lastRemoved = null;
    undoBar.classList.remove('show');
    undoBar.hidden = true;
    render();
    window.toastInfo?.('Restaurace byla vrácena do výběru.');
  } catch (error) {
    console.error('Saved restaurant restore failed:', error);
    window.toastError?.('Restauraci se nepodařilo vrátit.');
  } finally {
    undoButton.disabled = false;
  }
}

async function requestLocation() {
  if (!navigator.geolocation) {
    window.toastInfo?.('Tento prohlížeč neumí zjistit polohu.');
    return false;
  }
  return new Promise(resolve => navigator.geolocation.getCurrentPosition(position => {
    userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
    resolve(true);
  }, error => {
    console.warn('Collections location failed:', error);
    window.toastInfo?.('Polohu se nepodařilo získat.');
    resolve(false);
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }));
}

async function fetchRestaurantsBySlugs(slugs) {
  const bySlug = new Map();
  const fields = 'id,slug,name,city,tag,cuisine_type,vibe,image_url,google_rating,google_review_count,latitude,longitude';
  for (let index = 0; index < slugs.length; index += 100) {
    const chunk = slugs.slice(index, index + 100);
    const { data, error } = await supabase.from('restaurants').select(fields).in('slug', chunk);
    if (error) throw error;
    for (const restaurant of data || []) bySlug.set(String(restaurant.slug), restaurant);
  }
  return bySlug;
}

async function loadRows() {
  if (!collections) throw new Error('Saved collections runtime is unavailable');

  const savedSlugs = [...await collections.getSaved()].map(String).filter(Boolean);
  if (!savedSlugs.length) return [];

  const [restaurantMap, user] = await Promise.all([
    fetchRestaurantsBySlugs(savedSlugs),
    getCurrentUser().catch(() => null)
  ]);

  let cloudMeta = new Map();
  if (user) {
    try {
      const cloudRows = await getSavedRestaurants();
      cloudMeta = new Map(cloudRows.map(item => [slugOf(item), item]));
    } catch (error) {
      console.warn('Cloud collection metadata unavailable:', error);
    }
  }

  return savedSlugs.map((slug, index) => {
    const restaurant = restaurantMap.get(slug);
    if (!restaurant) return null;
    const cloud = cloudMeta.get(slug);
    return {
      ...(cloud || {}),
      restaurant_id: slug,
      restaurants: restaurant,
      _savedOrder: index + 1
    };
  }).filter(Boolean);
}

filters.addEventListener('click', event => {
  const button = event.target.closest('[data-vibe]');
  if (!button) return;
  activeVibe = String(button.dataset.vibe || 'all').toUpperCase();
  filters.querySelectorAll('[data-vibe]').forEach(item => item.classList.toggle('active', item === button));
  render();
});

sortSelect.addEventListener('change', async () => {
  if (sortSelect.value === 'distance' && !userLocation) {
    const ok = await requestLocation();
    if (!ok) {
      sortSelect.value = 'recent';
      return;
    }
  }
  render();
});

grid.addEventListener('click', event => {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  void removeSaved(button);
});

undoButton.addEventListener('click', () => void undoRemove());
$('undoClose').addEventListener('click', () => {
  undoBar.classList.remove('show');
  undoBar.hidden = true;
  lastRemoved = null;
  clearTimeout(undoTimer);
});

async function load() {
  grid.replaceChildren(textElement('div', 'collection-state', 'Načítám uložené restaurace…'));
  try {
    rows = await loadRows();
    render();
  } catch (error) {
    console.error('Saved restaurants failed to load:', error);
    grid.replaceChildren(textElement('div', 'collection-state', 'Výběr se nepodařilo načíst. Zkuste stránku obnovit.'));
    resultCount.textContent = '—';
  }
}

void load();
