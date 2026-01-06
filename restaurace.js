// Import Supabase client
import { supabase } from './supabase-client.js';

let allRestaurants = [];
let currentFilter = 'all';
let searchQuery = '';
let userLocation = null;
let sortByDistance = false;

// Load and display restaurants
async function loadRestaurants() {
  console.log('loadRestaurants called');
  const container = document.getElementById('restaurantsList');
  console.log('Container found:', container);
  
  try {
    console.log('Fetching from Supabase...');
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Supabase response:', { data: restaurants, error });
    
    if (error) throw error;
    
    allRestaurants = restaurants || [];
    console.log('Loaded restaurants:', allRestaurants);
    
    displayRestaurants(allRestaurants);
    initializeFilters();
    initializeSearch();
  } catch (error) {
    console.error('Error loading restaurants:', error);
    showError();
  }
}

// Display restaurants
function displayRestaurants(restaurants) {
  const container = document.getElementById('restaurantsList');
  if (!container) return;
  
  if (restaurants.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-20">
        <p class="text-white/40 text-lg">Zatím nejsou přidány žádné restaurace.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = restaurants.map(restaurant => createRestaurantCard(restaurant)).join('');
  
  // Initialize ratings after a short delay to ensure rating.js is loaded
  setTimeout(() => {
    initializeRatings(restaurants);
  }, 100);
}

// Create restaurant card HTML
function createRestaurantCard(restaurant) {
  const vibeTooltips = {
    '🍷 LUXE': 'Elegantní zážitek, důraz na detail, klidná atmosféra',
    '🔥 DRAMA': 'Výrazné chutě, silná osobnost, nezapomenutelné kombinace',
    '🌮 CHAOS': 'Uvolněný styl, pestrost, radost z jídla bez pravidel',
    '🌿 PURE': 'Čisté suroviny, jednoduchost, chuť v hlavní roli',
    '🖤 DARK': 'Intimní atmosféra, večerní vibe, tlumené světlo'
  };
  
  // Try multiple image sources
  const imageUrl = restaurant.image_url || 
                   restaurant.image || 
                   restaurant.photo_url ||
                   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
  
  console.log(`Restaurant ${restaurant.name}: image_url = ${restaurant.image_url}`);
  
  return `
    <div class="rounded-3xl bg-white/5 overflow-hidden">
      <a href="restaurace-${restaurant.slug}.html" class="block">
        <div class="aspect-[3/4] bg-cover bg-center" style="background-image: url('${imageUrl}')"></div>
      </a>
      <div class="p-6">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="flex-1">
            <div class="vibe-tooltip text-sm text-gurmaogold mb-1" data-tooltip="${vibeTooltips[restaurant.vibe] || ''}">${restaurant.vibe}</div>
            <h3 class="text-xl font-semibold">${restaurant.name}</h3>
            <p class="text-white/60 text-sm mt-1">${restaurant.city} · ${restaurant.tag}</p>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button class="share-btn w-11 h-11 rounded-full bg-white/5 border border-white/15 hover:border-gurmaogold hover:text-gurmaogold transition flex items-center justify-center" 
                    data-restaurant='${JSON.stringify({
                      id: restaurant.slug,
                      name: restaurant.name,
                      vibe: restaurant.vibe,
                      city: restaurant.city,
                      tag: restaurant.tag,
                      img: imageUrl,
                      href: `restaurace-${restaurant.slug}.html`
                    })}' 
                    title="Sdílet">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Rating Section -->
        <div data-restaurant-rating="${restaurant.slug}"></div>
      </div>
    </div>
  `;
}

// Initialize ratings for displayed restaurants
function initializeRatings(restaurants) {
  // Wait for ratingManager to be available
  if (typeof window.ratingManager === 'undefined') {
    console.log('Rating manager not yet loaded, skipping ratings initialization');
    return;
  }
  
  restaurants.forEach(restaurant => {
    const container = document.querySelector(`[data-restaurant-rating="${restaurant.slug}"]`);
    if (container) {
      const average = window.ratingManager.getAverage(restaurant.slug);
      const count = window.ratingManager.getCount(restaurant.slug);
      const userRating = window.ratingManager.getUserRating(restaurant.slug);
      
      let html = '<div class="border-t border-white/10 pt-3 mt-3">';
      
      if (average > 0) {
        html += `
          <div class="flex items-center gap-2 mb-2">
            ${window.ratingManager.renderStars(average, 'sm')}
            <span class="text-xs text-white/60">${average.toFixed(1)} (${count})</span>
          </div>
        `;
      } else {
        html += '<div class="text-xs text-white/40 mb-2">Zatím nehodnoceno</div>';
      }
      
      html += '<div class="text-xs text-white/40 mb-1">Tvoje hodnocení:</div>';
      html += window.ratingManager.renderInteractiveStars(restaurant.slug, userRating || 0);
      html += '</div>';
      
      container.innerHTML = html;
    }
  });
}

// Initialize filters
function initializeFilters() {
  const filterButtons = document.querySelectorAll('#filters button');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active state from all buttons
      filterButtons.forEach(btn => {
        btn.classList.remove('bg-gurmaogold', 'text-black');
        btn.classList.add('bg-white/5');
      });
      
      // Add active state to clicked button
      button.classList.remove('bg-white/5');
      button.classList.add('bg-gurmaogold', 'text-black');
      
      // Get filter value
      const filter = button.textContent.trim();
      currentFilter = filter === 'Vše' ? 'all' : filter;
      
      // Filter restaurants
      applyFilters();
    });
  });
}

// Initialize search
function initializeSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }
}

// Apply all filters (vibe + search)
function applyFilters() {
  let filtered = allRestaurants;
  
  // Apply vibe filter
  if (currentFilter !== 'all') {
    filtered = filtered.filter(r => r.vibe === currentFilter);
  }
  
  // Apply search filter
  if (searchQuery) {
    filtered = filtered.filter(r => {
      const cityMatch = r.city && r.city.toLowerCase().includes(searchQuery);
      const nameMatch = r.name && r.name.toLowerCase().includes(searchQuery);
      const tagMatch = r.tag && r.tag.toLowerCase().includes(searchQuery);
      return cityMatch || nameMatch || tagMatch;
    });
  }
  
  displayRestaurants(filtered);
  
  // Sort by distance if location is enabled
  if (sortByDistance && userLocation) {
    filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    displayRestaurants(filtered);
  }
}

// Filter restaurants by vibe (kept for backwards compatibility)
function filterRestaurants() {
  applyFilters();
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get user location and sort by distance
function findNearestRestaurants() {
  const btn = document.getElementById('locationBtn');
  if (!btn) return;
  
  // If already active, deactivate
  if (sortByDistance) {
    sortByDistance = false;
    userLocation = null;
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span class="hidden md:inline">Blízko mě</span>';
    btn.classList.remove('bg-gurmaogold', 'text-black', 'border-gurmaogold');
    applyFilters();
    return;
  }
  
  btn.disabled = true;
  btn.innerHTML = '<svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg> <span class="hidden md:inline">Hledám...</span>';
  
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        sortByDistance = true;
        
        // Add distance to each restaurant
        allRestaurants.forEach(r => {
          if (r.latitude && r.longitude) {
            r.distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              r.latitude,
              r.longitude
            );
          } else {
            r.distance = 999; // Unknown distance
          }
        });
        
        applyFilters();
        
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span class="hidden md:inline">📍 Podle vzdálenosti</span>';
        btn.disabled = false;
        btn.classList.add('bg-gurmaogold', 'text-black', 'border-gurmaogold');
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Nepodařilo se získat vaši polohu. Zkontrolujte oprávnění prohlížeče.');
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span class="hidden md:inline">Blízko mě</span>';
        btn.disabled = false;
      }
    );
  } else {
    alert('Váš prohlížeč nepodporuje geolokaci.');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span class="hidden md:inline">Blízko mě</span>';
    btn.disabled = false;
  }
}

// Show error message
function showError() {
  const container = document.getElementById('restaurantsList');
  if (container) {
    container.innerHTML = `
      <div class="col-span-full text-center py-20">
        <p class="text-gurmaored text-lg mb-4">Chyba při načítání restaurací</p>
        <button onclick="location.reload()" class="px-6 py-3 rounded-full bg-gurmaogold text-black hover:scale-105 transition">
          Zkusit znovu
        </button>
      </div>
    `;
  
  // Location button handler
  const locationBtn = document.getElementById('locationBtn');
  if (locationBtn) {
    locationBtn.addEventListener('click', findNearestRestaurants);
  }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadRestaurants();
});
