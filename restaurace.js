// Import Supabase client
import { supabase } from './supabase-client.js';

let allRestaurants = [];
let currentFilter = 'all';

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
  
  const imageUrl = restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';
  
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
      filterRestaurants();
    });
  });
}

// Filter restaurants by vibe
function filterRestaurants() {
  if (currentFilter === 'all') {
    displayRestaurants(allRestaurants);
  } else {
    const filtered = allRestaurants.filter(r => r.vibe === currentFilter);
    displayRestaurants(filtered);
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
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadRestaurants();
});
