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
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
  }),
  'top-right'
);

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
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.cursor = 'pointer';
      el.style.fontSize = '32px';
      el.style.filter = 'drop-shadow(0 2px 8px rgba(212, 175, 55, 0.5))';
      el.textContent = '📍';

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
  loadRestaurants();
});
