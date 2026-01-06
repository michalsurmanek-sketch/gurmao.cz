// Import Supabase client
import { supabase } from './supabase-client.js';

// Mapbox access token (public token for testing - get your own at mapbox.com)
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

// Initialize map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [15.5, 49.8], // Center of Czech Republic
  zoom: 7.2,
  pitch: 0,
  bearing: 0
});

// Add navigation controls
map.addControl(new mapboxgl.NavigationControl(), 'top-right');

// Add geolocate control
const geolocate = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true
  },
  trackUserLocation: true,
  showUserHeading: true
});

map.addControl(geolocate, 'top-right');

// Custom zoom level when geolocate is triggered
geolocate.on('geolocate', (e) => {
  map.flyTo({
    center: [e.coords.longitude, e.coords.latitude],
    zoom: 10, // Much wider zoom to see restaurants in larger area (approx 10-15 km radius)
    essential: true
  });
});

// Load restaurants from Supabase
async function loadRestaurants() {
  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*');
    
    if (error) throw error;
    
    console.log('Loaded restaurants:', restaurants);
    
    // Filter only restaurants with GPS coordinates
    const restaurantsWithGPS = restaurants.filter(r => r.latitude && r.longitude);
    
    console.log('Restaurants with GPS:', restaurantsWithGPS);
    
    if (!restaurantsWithGPS || restaurantsWithGPS.length === 0) {
      console.log('No restaurants with coordinates found');
      return;
    }
    
    // Add markers
    restaurants.forEach(restaurant => {
      // Determine marker color based on vibe
      let markerIcon = '📍'; // Default
      let markerFilter = 'drop-shadow(0 2px 8px rgba(212, 175, 55, 0.5))';
      
      if (restaurant.vibe) {
        if (restaurant.vibe.includes('DRAMA')) {
          markerIcon = '🔴';
          markerFilter = 'drop-shadow(0 2px 8px rgba(255, 0, 0, 0.6))';
        } else if (restaurant.vibe.includes('LUXE')) {
          markerIcon = '🟡';
          markerFilter = 'drop-shadow(0 2px 8px rgba(255, 215, 0, 0.6))';
        } else if (restaurant.vibe.includes('PURE')) {
          markerIcon = '🟢';
          markerFilter = 'drop-shadow(0 2px 8px rgba(0, 255, 0, 0.6))';
        } else if (restaurant.vibe.includes('DARK')) {
          markerIcon = '⚫';
          markerFilter = 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.4))';
        } else if (restaurant.vibe.includes('CHAOS')) {
          markerIcon = '🟠';
          markerFilter = 'drop-shadow(0 2px 8px rgba(255, 165, 0, 0.6))';
        }
      }
      
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.cursor = 'pointer';
      el.style.fontSize = '32px';
      el.style.filter = markerFilter;
      el.textContent = markerIcon;

      // Create popup content
      const vibeTooltips = {
        '🍷 LUXE': 'Elegantní zážitek, důraz na detail, klidná atmosféra',
        '🔥 DRAMA': 'Výrazné chutě, silná osobnost, nezapomenutelné kombinace',
        '🌮 CHAOS': 'Uvolněný styl, pestrost, radost z jídla bez pravidel',
        '🌿 PURE': 'Čisté suroviny, jednoduchost, chuť v hlavní roli',
        '🖤 DARK': 'Intimní atmosféra, večerní vibe, tlumené světlo'
      };
      
      const popupContent = `
        <div class="min-w-[200px]">
          <div class="vibe-tooltip text-xs text-gurmaogold mb-1" data-tooltip="${vibeTooltips[restaurant.vibe] || ''}">${restaurant.vibe}</div>
          <h3 class="text-lg font-bold mb-1">${restaurant.name}</h3>
          <div class="text-white/60 text-sm mb-2">${restaurant.city} · ${restaurant.tag}</div>
          <p class="text-white/80 text-sm mb-3">${restaurant.description || ''}</p>
          <div class="flex gap-2">
            <a href="restaurace-${restaurant.slug}.html" class="flex-1 px-4 py-2 rounded-full bg-gurmaogold text-black text-sm font-semibold hover:scale-105 transition text-center">
              Detail →
            </a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}" 
               target="_blank"
               class="px-4 py-2 rounded-full border border-gurmaogold text-gurmaogold text-sm font-semibold hover:bg-gurmaogold hover:text-black transition">
              🧭 Navigovat
            </a>
          </div>
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(popupContent);
      
      // Reinitialize tooltips when popup opens
      popup.on('open', () => {
        if (window.initVibeTooltips) window.initVibeTooltips();
      });

      // Create marker
      new mapboxgl.Marker(el)
        .setLngLat([restaurant.longitude, restaurant.latitude])
        .setPopup(popup)
        .addTo(map);
    });

    // Fit bounds to show all markers
    if (restaurantsWithGPS.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      restaurantsWithGPS.forEach(r => bounds.extend([r.longitude, r.latitude]));
      map.fitBounds(bounds, { padding: 80 });
    }
    
  } catch (error) {
    console.error('Error loading restaurants:', error);
  }
}

// Load restaurants when map is ready
map.on('load', () => {
  // Add Czech Republic border outline
  map.addSource('czech-border', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [12.09, 51.06], [12.24, 50.86], [12.52, 50.39], [12.96, 50.34], 
          [13.34, 50.73], [14.07, 50.93], [14.42, 51.11], [14.76, 50.92],
          [15.02, 51.11], [15.24, 50.78], [16.18, 50.42], [16.57, 50.21],
          [17.00, 50.36], [17.75, 50.36], [18.85, 49.50], [18.85, 49.02],
          [18.55, 49.05], [18.39, 49.31], [18.20, 49.27], [18.10, 49.04],
          [17.91, 48.99], [17.88, 48.90], [17.55, 48.89], [17.10, 48.81],
          [16.95, 48.60], [16.50, 48.79], [16.03, 48.76], [15.25, 49.03],
          [14.97, 48.94], [14.63, 48.59], [13.82, 48.77], [13.60, 48.88],
          [13.03, 49.01], [12.52, 49.45], [12.41, 49.97], [12.24, 50.26],
          [12.09, 50.32], [12.09, 51.06]
        ]]
      }
    }
  });

  map.addLayer({
    id: 'czech-border-line',
    type: 'line',
    source: 'czech-border',
    paint: {
      'line-color': '#d4af37',
      'line-width': 3,
      'line-opacity': 0.8
    }
  });

  // Load restaurants
  loadRestaurants();
});
