import { supabase } from './supabase-client.js';
import { LocationSearch } from './location-search.js';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';
const MAX_DISTANCE_KM = 20;

function addStyles() {
  if (document.getElementById('gurmao-footer-search-styles')) return;
  const style = document.createElement('style');
  style.id = 'gurmao-footer-search-styles';
  style.textContent = `
    #footerSearchResults {
      background: #080808;
      border-color: rgba(229, 184, 47, .38);
      scrollbar-color: #e5b82f #080808;
    }
    .gurmao-footer-result {
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      padding: 12px;
      color: #fff;
      border-bottom: 1px solid rgba(255, 255, 255, .1);
      transition: background-color .2s ease;
    }
    .gurmao-footer-result:last-child { border-bottom: 0; }
    .gurmao-footer-result:hover,
    .gurmao-footer-result:focus-visible {
      background: rgba(229, 184, 47, .12);
      outline: none;
    }
    .gurmao-footer-result__photo {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      object-fit: cover;
      background: #171717;
    }
    .gurmao-footer-result__copy { min-width: 0; }
    .gurmao-footer-result__name,
    .gurmao-footer-result__city {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .gurmao-footer-result__name {
      color: #fff;
      font-size: 14px;
      font-weight: 650;
    }
    .gurmao-footer-result__city {
      margin-top: 6px;
      color: rgba(255, 255, 255, .58);
      font-size: 12px;
    }
    .gurmao-footer-result__distance {
      color: #e5b82f;
      font-size: 12px;
      white-space: nowrap;
    }
    .gurmao-footer-result-message {
      padding: 16px;
      color: rgba(255, 255, 255, .6);
      font-size: 14px;
      text-align: center;
    }
    @media (max-width: 767px) {
      #footerSearchBox.w-80 { width: min(20rem, calc(100vw - 32px)); }
      #footerSearchResults { width: min(20rem, calc(100vw - 32px)); }
    }
  `;
  document.head.appendChild(style);
}

function setLocationIcon(button, active, loading = false) {
  if (!button) return;
  button.replaceChildren();
  if (loading) {
    const spinner = document.createElement('span');
    spinner.className = 'w-4 h-4 border-2 border-gurmaogold border-t-transparent rounded-full animate-spin';
    button.appendChild(spinner);
    return;
  }
  button.innerHTML = active
    ? '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>'
    : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
  button.classList.toggle('text-gurmaogold', active);
  button.setAttribute('aria-pressed', String(active));
}

function normalizedTerms(query) {
  return query
    .normalize('NFKC')
    .split(/\s+/)
    .map(term => term.replace(/[%_,().:*'"\\]/g, '').trim())
    .filter(Boolean)
    .slice(0, 4);
}

function createResult(restaurant, locationSearch, showDistance) {
  const identifier = restaurant.slug || restaurant.id;
  const link = document.createElement('a');
  link.className = 'gurmao-footer-result';
  link.href = `restaurace-detail.html?id=${encodeURIComponent(identifier)}`;

  const image = document.createElement('img');
  image.className = 'gurmao-footer-result__photo';
  image.src = restaurant.image_url || FALLBACK_IMAGE;
  image.alt = '';
  image.loading = 'lazy';
  image.addEventListener('error', () => {
    if (image.src !== FALLBACK_IMAGE) image.src = FALLBACK_IMAGE;
  }, { once: true });

  const copy = document.createElement('span');
  copy.className = 'gurmao-footer-result__copy';
  const name = document.createElement('span');
  name.className = 'gurmao-footer-result__name';
  name.textContent = restaurant.name || 'Restaurace';
  const city = document.createElement('span');
  city.className = 'gurmao-footer-result__city';
  city.textContent = restaurant.city || '';
  copy.append(name, city);

  link.append(image, copy);
  if (showDistance && Number.isFinite(restaurant.distance)) {
    const distance = document.createElement('span');
    distance.className = 'gurmao-footer-result__distance';
    distance.textContent = locationSearch.formatDistance(restaurant.distance);
    link.appendChild(distance);
  }
  return link;
}

function initFooterSearch() {
  const box = document.getElementById('footerSearchBox');
  const toggle = document.getElementById('footerSearchToggle');
  const input = document.getElementById('footerSearchInput');
  const results = document.getElementById('footerSearchResults');
  const locationToggle = document.getElementById('footerLocationToggle');
  if (!box || !toggle || !input || !results) return;

  addStyles();
  const locationSearch = new LocationSearch();
  let expanded = false;
  let locationActive = Boolean(locationSearch.isLocationEnabled && locationSearch.userLocation);
  let timeout;
  let requestId = 0;

  const socials = () => document.querySelectorAll('.footer-social');
  const hideResults = () => {
    results.classList.add('hidden');
    results.replaceChildren();
  };
  const showMessage = message => {
    const item = document.createElement('div');
    item.className = 'gurmao-footer-result-message';
    item.textContent = message;
    results.replaceChildren(item);
    results.classList.remove('hidden');
  };
  const collapse = () => {
    box.classList.add('w-9');
    box.classList.remove('w-80');
    input.classList.add('opacity-0', 'w-0');
    input.classList.remove('opacity-100', 'w-full', 'pr-3');
    input.value = '';
    hideResults();
    locationToggle?.classList.add('opacity-0', 'pointer-events-none');
    locationToggle?.classList.remove('opacity-100', 'pointer-events-auto');
    socials().forEach(icon => {
      icon.style.opacity = '1';
      icon.style.visibility = 'visible';
    });
    expanded = false;
  };
  const expand = () => {
    if (expanded) return;
    box.classList.remove('w-9');
    box.classList.add('w-80');
    input.classList.remove('opacity-0', 'w-0');
    input.classList.add('opacity-100', 'w-full', 'pr-3');
    locationToggle?.classList.remove('opacity-0', 'pointer-events-none');
    locationToggle?.classList.add('opacity-100', 'pointer-events-auto');
    socials().forEach(icon => {
      icon.style.transition = 'opacity .3s ease, visibility .3s ease';
      icon.style.opacity = '0';
      icon.style.visibility = 'hidden';
    });
    expanded = true;
    window.setTimeout(() => input.focus(), 250);
  };

  setLocationIcon(locationToggle, locationActive);
  toggle.addEventListener('click', event => {
    event.stopPropagation();
    expand();
  });

  locationToggle?.addEventListener('click', async event => {
    event.stopPropagation();
    if (locationActive) {
      locationSearch.disable();
      locationActive = false;
      setLocationIcon(locationToggle, false);
    } else {
      try {
        setLocationIcon(locationToggle, false, true);
        await locationSearch.getUserLocation(true);
        locationActive = true;
        setLocationIcon(locationToggle, true);
      } catch (error) {
        console.error('Footer location error:', error);
        locationActive = false;
        setLocationIcon(locationToggle, false);
      }
    }
    if (input.value.trim()) input.dispatchEvent(new Event('input'));
  });

  input.addEventListener('input', () => {
    clearTimeout(timeout);
    const terms = normalizedTerms(input.value);
    const ownRequest = ++requestId;
    if (terms.join('').length < 2) {
      hideResults();
      return;
    }

    timeout = window.setTimeout(async () => {
      try {
        const filters = terms.flatMap(term => [
          `name.ilike.%${term}%`,
          `city.ilike.%${term}%`,
          `tag.ilike.%${term}%`
        ]);
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, slug, name, city, image_url, latitude, longitude')
          .or(filters.join(','))
          .limit(20);
        if (error) throw error;
        if (ownRequest !== requestId) return;

        let matches = data || [];
        if (locationActive && locationSearch.userLocation) {
          matches = matches
            .map(restaurant => {
              const lat = Number(restaurant.latitude);
              const lng = Number(restaurant.longitude);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { ...restaurant, distance: Infinity };
              return {
                ...restaurant,
                distance: locationSearch.calculateDistance(
                  locationSearch.userLocation.lat,
                  locationSearch.userLocation.lng,
                  lat,
                  lng
                )
              };
            })
            .filter(restaurant => restaurant.distance <= MAX_DISTANCE_KM)
            .sort((a, b) => a.distance - b.distance);
        }

        if (!matches.length) {
          showMessage(locationActive ? 'Žádné restaurace v okruhu 20 km' : 'Žádné výsledky');
          return;
        }
        const fragment = document.createDocumentFragment();
        matches.forEach(restaurant => fragment.appendChild(
          createResult(restaurant, locationSearch, locationActive)
        ));
        results.replaceChildren(fragment);
        results.classList.remove('hidden');
      } catch (error) {
        console.error('Footer search error:', error);
        if (ownRequest === requestId) showMessage('Vyhledávání se nepodařilo načíst');
      }
    }, 250);
  });

  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') collapse();
    if (event.key === 'Enter') results.querySelector('a')?.click();
  });
  document.addEventListener('click', event => {
    if (expanded && !box.contains(event.target) && !results.contains(event.target)) collapse();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFooterSearch, { once: true });
} else {
  initFooterSearch();
}
