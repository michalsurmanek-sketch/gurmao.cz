import { supabase } from './supabase-client.js';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [15.5, 49.8],
  zoom: 7.2,
  pitch: 0,
  bearing: 0,
  touchZoomRotate: true,
  touchPitch: false,
  dragPan: true,
  dragRotate: false,
  scrollZoom: true,
  doubleClickZoom: true,
  boxZoom: true
});

map.addControl(new mapboxgl.NavigationControl(), 'top-right');

const geolocate = new mapboxgl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
  showUserHeading: true,
  showAccuracyCircle: false
});

map.addControl(geolocate, 'top-right');
geolocate.on('geolocate', event => {
  map.flyTo({
    center: [event.coords.longitude, event.coords.latitude],
    zoom: 10,
    essential: true
  });
});

const allMarkers = [];
const activeFilters = new Set();

const vibeTooltips = {
  '🍷 LUXE': 'Elegantní zážitek, důraz na detail, klidná atmosféra',
  '🔥 DRAMA': 'Výrazné chutě, silná osobnost, nezapomenutelné kombinace',
  '🌮 CHAOS': 'Uvolněný styl, pestrost, radost z jídla bez pravidel',
  '🌿 PURE': 'Čisté suroviny, jednoduchost, chuť v hlavní roli',
  '🖤 DARK': 'Intimní atmosféra, večerní vibe, tlumené světlo',
  '🌊 CALM': 'Klidná atmosféra, harmonie, pohoda'
};

function markerPresentation(vibe = '') {
  if (vibe.includes('DRAMA')) return ['🔴', 'drop-shadow(0 2px 8px rgba(255, 0, 0, 0.6))'];
  if (vibe.includes('LUXE')) return ['🟡', 'drop-shadow(0 2px 8px rgba(255, 215, 0, 0.6))'];
  if (vibe.includes('PURE')) return ['🟢', 'drop-shadow(0 2px 8px rgba(0, 255, 0, 0.6))'];
  if (vibe.includes('DARK')) return ['⚫', 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.4))'];
  if (vibe.includes('CHAOS')) return ['🟠', 'drop-shadow(0 2px 8px rgba(255, 165, 0, 0.6))'];
  if (vibe.includes('CALM')) return ['🔵', 'drop-shadow(0 2px 8px rgba(0, 150, 255, 0.6))'];
  return ['📍', 'drop-shadow(0 2px 8px rgba(212, 175, 55, 0.5))'];
}

function validCoordinates(restaurant) {
  const latitude = Number(restaurant.latitude);
  const longitude = Number(restaurant.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < 48.4 || latitude > 51.2 || longitude < 11.8 || longitude > 19.2) return null;
  return { latitude, longitude };
}

function createPopupContent(restaurant, latitude, longitude) {
  const root = document.createElement('div');
  root.className = 'min-w-[200px]';

  if (restaurant.vibe) {
    const vibe = document.createElement('div');
    vibe.className = 'vibe-tooltip text-xs text-gurmaogold mb-1';
    vibe.dataset.tooltip = vibeTooltips[restaurant.vibe] || '';
    vibe.textContent = String(restaurant.vibe);
    root.appendChild(vibe);
  }

  const title = document.createElement('h3');
  title.className = 'text-lg font-bold mb-1';
  title.textContent = String(restaurant.name || 'Restaurace');
  root.appendChild(title);

  const metaParts = [restaurant.city, restaurant.tag].filter(Boolean).map(String);
  if (metaParts.length) {
    const meta = document.createElement('div');
    meta.className = 'text-white/60 text-sm mb-2';
    meta.textContent = metaParts.join(' · ');
    root.appendChild(meta);
  }

  if (restaurant.description) {
    const description = document.createElement('p');
    description.className = 'text-white/80 text-sm mb-3';
    description.textContent = String(restaurant.description).slice(0, 320);
    root.appendChild(description);
  }

  const actions = document.createElement('div');
  actions.className = 'flex gap-2';

  const detail = document.createElement('a');
  detail.className = 'flex-1 px-4 py-2 rounded-full bg-gurmaogold text-black text-sm font-semibold hover:scale-105 transition text-center';
  detail.href = `restaurant.html?slug=${encodeURIComponent(String(restaurant.slug || restaurant.id || ''))}`;
  detail.textContent = 'Detail →';
  actions.appendChild(detail);

  const navigate = document.createElement('a');
  navigate.className = 'px-4 py-2 rounded-full border border-gurmaogold text-gurmaogold text-sm font-semibold hover:bg-gurmaogold hover:text-black transition';
  navigate.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}`;
  navigate.target = '_blank';
  navigate.rel = 'noopener noreferrer';
  navigate.textContent = '🧭 Navigovat';
  actions.appendChild(navigate);

  root.appendChild(actions);
  return root;
}

function collapseLegendOnMobile() {
  if (window.innerWidth >= 768) return;
  const legendContent = document.getElementById('legendContent');
  const legendToggle = document.getElementById('legendToggle');
  if (legendContent && legendToggle) {
    legendContent.hidden = true;
    legendToggle.textContent = '▶';
  }
}

async function loadRestaurants() {
  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('id,slug,name,city,tag,vibe,description,latitude,longitude');

    if (error) throw error;

    const restaurantsWithGPS = (restaurants || [])
      .map(restaurant => ({ restaurant, coordinates: validCoordinates(restaurant) }))
      .filter(item => item.coordinates);

    if (!restaurantsWithGPS.length) return;

    restaurantsWithGPS.forEach(({ restaurant, coordinates }) => {
      const [markerIcon, markerFilter] = markerPresentation(String(restaurant.vibe || ''));

      const markerElement = document.createElement('button');
      markerElement.type = 'button';
      markerElement.className = 'marker';
      markerElement.style.width = '40px';
      markerElement.style.height = '40px';
      markerElement.style.cursor = 'pointer';
      markerElement.style.fontSize = '32px';
      markerElement.style.filter = markerFilter;
      markerElement.style.background = 'transparent';
      markerElement.style.border = '0';
      markerElement.style.padding = '0';
      markerElement.textContent = markerIcon;
      markerElement.setAttribute('aria-label', `Otevřít ${String(restaurant.name || 'restauraci')} na mapě`);

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setDOMContent(createPopupContent(restaurant, coordinates.latitude, coordinates.longitude));

      popup.on('open', () => {
        if (window.initVibeTooltips) window.initVibeTooltips();
        collapseLegendOnMobile();
      });

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([coordinates.longitude, coordinates.latitude])
        .setPopup(popup)
        .addTo(map);

      allMarkers.push({ marker, vibe: String(restaurant.vibe || '') });
    });
  } catch (error) {
    console.error('Error loading restaurants:', error);
  }
}

function initFilters() {
  document.querySelectorAll('.vibe-filter').forEach(element => {
    element.addEventListener('click', () => {
      const vibe = element.getAttribute('data-vibe');
      if (vibe) toggleVibeFilter(vibe);
    });
  });
}

function toggleVibeFilter(vibe) {
  if (activeFilters.has(vibe)) activeFilters.delete(vibe);
  else activeFilters.add(vibe);

  document.querySelectorAll('.vibe-filter').forEach(element => {
    const elementVibe = element.getAttribute('data-vibe') || '';
    if (elementVibe !== vibe) return;
    const label = element.querySelector('.vibe-filter-label');
    const active = activeFilters.has(vibe);
    element.setAttribute('aria-pressed', String(active));
    element.style.opacity = active ? '1' : '0.5';
    if (label) {
      label.style.textDecoration = active ? 'underline' : 'none';
      label.style.color = active ? '#d4af37' : '';
    }
  });

  filterMarkers();
}

function filterMarkers() {
  allMarkers.forEach(({ marker, vibe }) => {
    const visible = activeFilters.size === 0 || [...activeFilters].some(filter => vibe.includes(filter));
    marker.getElement().style.display = visible ? '' : 'none';
  });
}

map.on('load', () => {
  fetch('czech-border.geojson')
    .then(response => {
      if (!response.ok) throw new Error(`Czech border ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (map.getSource('czech-border')) return;
      map.addSource('czech-border', { type: 'geojson', data });
      map.addLayer({
        id: 'czech-border-line',
        type: 'line',
        source: 'czech-border',
        paint: {
          'line-color': '#d4af37',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });
    })
    .catch(error => console.warn('Czech border failed to load:', error));

  loadRestaurants();
  initFilters();
});