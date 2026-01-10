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

// Global state for filtering
let allMarkers = [];
let activeFilters = new Set();

// Load restaurants from Supabase
async function loadRestaurants() {
  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*');
    
    if (error) throw error;
    
    
    // Filter only restaurants with GPS coordinates
    const restaurantsWithGPS = restaurants.filter(r => r.latitude && r.longitude);
    
    
    if (!restaurantsWithGPS || restaurantsWithGPS.length === 0) {
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
        } else if (restaurant.vibe.includes('CALM')) {
          markerIcon = '🔵';
          markerFilter = 'drop-shadow(0 2px 8px rgba(0, 150, 255, 0.6))';
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
        '🖤 DARK': 'Intimní atmosféra, večerní vibe, tlumené světlo',
        '🌊 CALM': 'Klidná atmosféra, harmonie, pohoda'
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
        
        // Auto-collapse legend on mobile when popup opens
        if (window.innerWidth < 768) {
          const legendContent = document.getElementById('legendContent');
          const legendToggle = document.getElementById('legendToggle');
          if (legendContent && legendToggle) {
            legendContent.style.display = 'none';
            legendToggle.textContent = '▶';
          }
        }
      });

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([restaurant.longitude, restaurant.latitude])
        .setPopup(popup)
        .addTo(map);
      
      // Store marker with its vibe for filtering
      allMarkers.push({ marker, vibe: restaurant.vibe });
    });

    // Keep map centered on Czech Republic instead of fitting to markers
    // Users can explore the map freely or use geolocate to find nearby restaurants
    
  } catch (error) {
    console.error('Error loading restaurants:', error);
  }
}

// Initialize filter event listeners
function initFilters() {
  document.querySelectorAll('.vibe-filter').forEach(el => {
    el.addEventListener('click', () => {
      const vibe = el.getAttribute('data-vibe');
      toggleVibeFilter(vibe);
    });
  });
}

// Toggle vibe filter
function toggleVibeFilter(vibe) {
  if (activeFilters.has(vibe)) {
    activeFilters.delete(vibe);
  } else {
    activeFilters.add(vibe);
  }
  
  // Update UI
  document.querySelectorAll(`[data-vibe="${vibe}"]`).forEach(el => {
    const label = el.querySelector('.vibe-filter-label');
    if (activeFilters.has(vibe)) {
      el.style.opacity = '1';
      if (label) {
        label.style.textDecoration = 'underline';
        label.style.color = '#d4af37';
      }
    } else {
      el.style.opacity = '0.5';
      if (label) {
        label.style.textDecoration = 'none';
        label.style.color = '';
      }
    }
  });
  
  // Filter markers
  filterMarkers();
}

// Filter markers based on active filters
function filterMarkers() {
  let visibleCount = 0;
  allMarkers.forEach(({ marker, vibe }) => {
    if (activeFilters.size === 0) {
      // No filters active, show all
      marker.getElement().style.display = '';
      visibleCount++;
    } else {
      // Check if marker's vibe matches any active filter
      const shouldShow = Array.from(activeFilters).some(filter => 
        vibe && vibe.includes(filter)
      );
      marker.getElement().style.display = shouldShow ? '' : 'none';
      if (shouldShow) visibleCount++;
    }
  });
  console.log(`Filtered: ${visibleCount}/${allMarkers.length} markers visible`, 
              `Active filters: [${Array.from(activeFilters).join(', ')}]`);
}

// Load restaurants when map is ready
map.on('load', () => {
  // Add Czech Republic border outline with precise data
  fetch('czech-border.geojson')
    .then(response => response.json())
    .then(data => {
      map.addSource('czech-border', {
        type: 'geojson',
        data: data
      });

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
    });

  // Load restaurants
  loadRestaurants();
  
  // Initialize filters
  initFilters();
});
