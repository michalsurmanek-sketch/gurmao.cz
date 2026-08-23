import { supabase } from './supabase-client.js';

const SOURCE_ID = 'gurmao-restaurants';
const CLUSTER_LAYER_ID = 'gurmao-restaurant-clusters';
const CLUSTER_COUNT_LAYER_ID = 'gurmao-restaurant-cluster-count';
const POINT_LAYER_ID = 'gurmao-restaurant-points';
const PAGE_SIZE = 1000;

const VIBE = {
  LUXE: { color: '#f3c94a', label: '🍷 LUXE' },
  DRAMA: { color: '#ff856d', label: '🔥 DRAMA' },
  CHAOS: { color: '#ffb15f', label: '🌮 CHAOS' },
  PURE: { color: '#69dc83', label: '🌿 PURE' },
  DARK: { color: '#c8aaff', label: '🖤 DARK' },
  CALM: { color: '#75c8ff', label: '🌊 CALM' },
  OTHER: { color: '#d8ad34', label: 'Restaurace' }
};

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
  map.flyTo({ center: [event.coords.longitude, event.coords.latitude], zoom: 11, essential: true });
});

let allFeatures = [];
const activeFilters = new Set();

function vibeKey(value) {
  const text = String(value || '').toUpperCase();
  return Object.keys(VIBE).find(key => key !== 'OTHER' && text.includes(key)) || 'OTHER';
}

function validCoordinates(restaurant) {
  const latitude = Number(restaurant.latitude);
  const longitude = Number(restaurant.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < 48.4 || latitude > 51.2 || longitude < 11.8 || longitude > 19.2) return null;
  return [longitude, latitude];
}

function featureFromRestaurant(restaurant) {
  const coordinates = validCoordinates(restaurant);
  if (!coordinates) return null;
  const key = vibeKey(restaurant.vibe);
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties: {
      id: String(restaurant.id || ''),
      slug: String(restaurant.slug || restaurant.id || ''),
      name: String(restaurant.name || 'Restaurace'),
      city: String(restaurant.city || ''),
      tag: String(restaurant.tag || ''),
      vibe: String(restaurant.vibe || ''),
      vibeKey: key,
      description: String(restaurant.description || '').slice(0, 320)
    }
  };
}

function collection(features) {
  return { type: 'FeatureCollection', features };
}

async function loadAllRestaurants() {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id,slug,name,city,tag,vibe,description,latitude,longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const batch = data || [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return rows.map(featureFromRestaurant).filter(Boolean);
}

function currentFeatures() {
  if (!activeFilters.size) return allFeatures;
  return allFeatures.filter(feature => activeFilters.has(feature.properties.vibeKey));
}

function refreshSource() {
  const source = map.getSource(SOURCE_ID);
  if (source) source.setData(collection(currentFeatures()));
}

function createPopupContent(properties) {
  const root = document.createElement('div');
  root.className = 'min-w-[210px]';

  const key = VIBE[properties.vibeKey] ? properties.vibeKey : 'OTHER';
  const vibe = document.createElement('div');
  vibe.className = 'text-xs text-gurmaogold mb-1';
  vibe.textContent = properties.vibe || VIBE[key].label;
  root.appendChild(vibe);

  const title = document.createElement('h3');
  title.className = 'text-lg font-bold mb-1';
  title.textContent = properties.name || 'Restaurace';
  root.appendChild(title);

  const metaParts = [properties.city, properties.tag].filter(Boolean);
  if (metaParts.length) {
    const meta = document.createElement('div');
    meta.className = 'text-white/60 text-sm mb-2';
    meta.textContent = metaParts.join(' · ');
    root.appendChild(meta);
  }

  if (properties.description) {
    const description = document.createElement('p');
    description.className = 'text-white/80 text-sm mb-3';
    description.textContent = properties.description;
    root.appendChild(description);
  }

  const actions = document.createElement('div');
  actions.className = 'flex gap-2';

  const detail = document.createElement('a');
  detail.className = 'flex-1 px-4 py-2 rounded-full bg-gurmaogold text-black text-sm font-semibold text-center';
  detail.href = `restaurant.html?slug=${encodeURIComponent(properties.slug || properties.id || '')}`;
  detail.textContent = 'Detail →';
  actions.appendChild(detail);

  root.appendChild(actions);
  return root;
}

function collapseLegendOnMobile() {
  if (window.innerWidth >= 768) return;
  const content = document.getElementById('legendContent');
  const toggle = document.getElementById('legendToggle');
  if (content && toggle) {
    content.hidden = true;
    content.style.display = 'none';
    toggle.textContent = '▶';
  }
}

function addRestaurantLayers(features) {
  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data: collection(features),
    cluster: true,
    clusterMaxZoom: 13,
    clusterRadius: 48
  });

  map.addLayer({
    id: CLUSTER_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step', ['get', 'point_count'],
        '#8b711f', 25, '#aa8625', 75, '#d8ad34'
      ],
      'circle-radius': [
        'step', ['get', 'point_count'],
        17, 25, 21, 75, 26
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': 'rgba(255,255,255,.62)',
      'circle-opacity': 0.94
    }
  });

  map.addLayer({
    id: CLUSTER_COUNT_LAYER_ID,
    type: 'symbol',
    source: SOURCE_ID,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-size': 12
    },
    paint: { 'text-color': '#090a08' }
  });

  map.addLayer({
    id: POINT_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 5, 12, 7, 16, 9],
      'circle-color': [
        'match', ['get', 'vibeKey'],
        'LUXE', VIBE.LUXE.color,
        'DRAMA', VIBE.DRAMA.color,
        'CHAOS', VIBE.CHAOS.color,
        'PURE', VIBE.PURE.color,
        'DARK', VIBE.DARK.color,
        'CALM', VIBE.CALM.color,
        VIBE.OTHER.color
      ],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#10110e',
      'circle-opacity': 0.95
    }
  });

  map.on('click', CLUSTER_LAYER_ID, event => {
    const feature = event.features?.[0];
    if (!feature) return;
    const clusterId = feature.properties?.cluster_id;
    const source = map.getSource(SOURCE_ID);
    source.getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (error) {
        console.warn('Cluster zoom failed:', error);
        return;
      }
      map.easeTo({ center: feature.geometry.coordinates, zoom });
    });
  });

  map.on('click', POINT_LAYER_ID, event => {
    const feature = event.features?.[0];
    if (!feature) return;
    const coordinates = feature.geometry.coordinates.slice();
    while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    new mapboxgl.Popup({ offset: 14, closeButton: true })
      .setLngLat(coordinates)
      .setDOMContent(createPopupContent(feature.properties || {}))
      .addTo(map);
    collapseLegendOnMobile();
  });

  for (const layerId of [CLUSTER_LAYER_ID, POINT_LAYER_ID]) {
    map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
  }
}

function initFilters() {
  document.querySelectorAll('.vibe-filter').forEach(element => {
    const key = vibeKey(element.getAttribute('data-vibe'));
    element.setAttribute('role', element.tagName === 'BUTTON' ? 'button' : 'switch');
    element.setAttribute('aria-pressed', 'false');
    element.addEventListener('click', () => {
      if (key === 'OTHER') return;
      if (activeFilters.has(key)) activeFilters.delete(key);
      else activeFilters.add(key);
      const active = activeFilters.has(key);
      element.setAttribute('aria-pressed', String(active));
      element.style.opacity = active || !activeFilters.size ? '1' : '0.5';
      document.querySelectorAll('.vibe-filter').forEach(other => {
        const otherKey = vibeKey(other.getAttribute('data-vibe'));
        const otherActive = activeFilters.has(otherKey);
        other.setAttribute('aria-pressed', String(otherActive));
        other.style.opacity = !activeFilters.size || otherActive ? '1' : '0.48';
        const label = other.querySelector('.vibe-filter-label');
        if (label) {
          label.style.textDecoration = otherActive ? 'underline' : 'none';
          label.style.color = otherActive ? '#d4af37' : '';
        }
      });
      refreshSource();
    });
  });
}

function addCzechBorder() {
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
          'line-width': 1.5,
          'line-opacity': 0.72
        }
      });
    })
    .catch(error => console.warn('Czech border failed to load:', error));
}

map.on('load', async () => {
  addCzechBorder();
  initFilters();
  try {
    allFeatures = await loadAllRestaurants();
    addRestaurantLayers(allFeatures);
  } catch (error) {
    console.error('Restaurant map data failed to load:', error);
    const mapElement = document.getElementById('map');
    if (mapElement) mapElement.setAttribute('aria-label', 'Mapu restaurací se nepodařilo načíst.');
  }
});