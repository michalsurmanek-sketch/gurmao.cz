// Import Supabase client
import { supabase } from './supabase-client.js';

let allRestaurants = [];
let currentFilter = 'all';
let searchQuery = '';
let userLocation = null;
let sortByDistance = false;
// Desktop: 24 restaurací, Mobile: 12 restaurací (pak infinite scroll)
let perPage = window.innerWidth < 768 ? 12 : 24;
let currentlyDisplayed = 0;

// Pagination for server-side
let currentPage = 0;
const PAGE_SIZE = 30; // Načíst po 30 restauracích (sníženo z 50)
let totalCount = 0;
let isLoading = false;
let hasMoreData = true;

// Load and display restaurants with pagination
async function loadRestaurants(append = false) {
  if (isLoading || !hasMoreData) return;
  
  const container = document.getElementById('restaurantsList');
  isLoading = true;
  
  // Show loading indicator
  if (append) {
    showLoadingSpinner();
  }
  
  try {
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    
    const { data: restaurants, error, count } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    
    totalCount = count || 0;
    
    // Append or replace
    if (append) {
      allRestaurants = [...allRestaurants, ...(restaurants || [])];
    } else {
      allRestaurants = restaurants || [];
    }
    
    // Check if more data available
    hasMoreData = (from + (restaurants || []).length) < totalCount;
    currentPage++;
    
    displayRestaurants(allRestaurants);
    
    if (!append) {
      initializeFilters();
      initializeSearch();
      initializePerPageButtons();
      initializeInfiniteScroll();
    }
    
    hideLoadingSpinner();
  } catch (error) {
    console.error('Error loading restaurants:', error);
    showError();
    hideLoadingSpinner();
  } finally {
    isLoading = false;
  }
}

function showLoadingSpinner() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) spinner.classList.remove('hidden');
}

function hideLoadingSpinner() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) spinner.classList.add('hidden');
}

// Display restaurants
function displayRestaurants(restaurants) {
  const container = document.getElementById('restaurantsList');
  if (!container) return;
  
  // Update result count (use server total if available)
  const resultCount = document.getElementById('resultCount');
  if (resultCount) {
    const total = totalCount > 0 ? totalCount : restaurants.length;
    resultCount.textContent = `Celkem: ${total} restaurací`;
  }
  
  if (restaurants.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-20">
        <p class="text-white/40 text-lg">Žádné restaurace neodpovídají vašim kritériím.</p>
      </div>
    `;
    return;
  }
  
  // Display only first perPage items, store filtered list for infinite scroll
  window.filteredRestaurants = restaurants;
  currentlyDisplayed = Math.min(perPage, restaurants.length);
  const toShow = restaurants.slice(0, currentlyDisplayed);
  
  container.innerHTML = toShow.map(restaurant => createRestaurantCard(restaurant)).join('');
  
  // Show "Load more" button if there are more items
  updateLoadMoreButton();
  
  // Initialize ratings after a short delay to ensure rating.js is loaded
  setTimeout(() => {
    initializeRatings(toShow);
  }, 100);
  
  // Update save buttons state
  if (typeof window.updateSaveButtons === 'function') {
    setTimeout(() => {
      window.updateSaveButtons();
    }, 100);
  }
  
  // Initialize flip card interactions
  initializeFlipCards();
}

// Update or create "Load more" button
function updateLoadMoreButton() {
  const container = document.getElementById('restaurantsList');
  if (!container) return;
  
  const existingBtn = document.getElementById('loadMoreBtn');
  if (existingBtn) existingBtn.remove();
  
  // Check if there are more items locally or on server
  const hasMoreLocal = currentlyDisplayed < window.filteredRestaurants.length;
  const hasMoreServer = hasMoreData;
  
  if (hasMoreLocal || hasMoreServer) {
    const remaining = hasMoreServer ? 
      (totalCount - allRestaurants.length) : 
      (window.filteredRestaurants.length - currentlyDisplayed);
    
    const btn = document.createElement('div');
    btn.id = 'loadMoreBtn';
    btn.className = 'col-span-full flex justify-center py-8';
    btn.innerHTML = `
      <button onclick="loadMoreData()" class="px-8 py-3 rounded-full bg-gurmaogold text-black font-semibold hover:bg-gurmaogold/80 transition">
        ${hasMoreServer ? 'Načíst další ze serveru' : `Načíst další (ještě ${remaining})`}
      </button>
    `;
    container.insertAdjacentElement('afterend', btn);
  }
}

// Load more items (either from local cache or server)
window.loadMoreData = async function() {
  // First try to show more from local filtered results
  if (currentlyDisplayed < window.filteredRestaurants.length) {
    loadMore(); // Use existing loadMore for local data
  } 
  // If all local shown, fetch more from server
  else if (hasMoreData) {
    await loadRestaurants(true); // append mode
  }
}

// Load more items from local cache
window.loadMore = function() {
  const nextBatch = Math.min(currentlyDisplayed + perPage, window.filteredRestaurants.length);
  const newItems = window.filteredRestaurants.slice(currentlyDisplayed, nextBatch);
  
  const container = document.getElementById('restaurantsList');
  container.innerHTML += newItems.map(restaurant => createRestaurantCard(restaurant)).join('');
  
  currentlyDisplayed = nextBatch;
  updateLoadMoreButton();
  
  // Initialize ratings for new items
  setTimeout(() => {
    initializeRatings(newItems);
  }, 100);
  
  // Update save buttons state for new items
  if (typeof window.updateSaveButtons === 'function') {
    setTimeout(() => {
      window.updateSaveButtons();
    }, 100);
  }
  
  // Initialize flip cards for new items
  initializeFlipCards();
}

// Initialize infinite scroll
function initializeInfiniteScroll() {
  // Desktop: use IntersectionObserver on trigger element
  const trigger = document.getElementById('scrollTrigger');
  if (trigger && window.innerWidth >= 768) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isLoading && (currentlyDisplayed < window.filteredRestaurants.length || hasMoreData)) {
          loadMoreData();
        }
      });
    }, {
      rootMargin: '200px' // Trigger 200px before reaching bottom
    });
    
    observer.observe(trigger);
  }
  
  // Mobile: use scroll event
  if (window.innerWidth < 768) {
    let scrollIsLoading = false;
    
    window.addEventListener('scroll', () => {
      if (scrollIsLoading) return;
      if (currentlyDisplayed >= window.filteredRestaurants.length && !hasMoreData) return;
      
      const scrollPosition = window.innerHeight + window.scrollY;
      const pageHeight = document.documentElement.scrollHeight;
      
      // Load more when user is 500px from bottom
      if (scrollPosition > pageHeight - 500) {
        scrollIsLoading = true;
        loadMoreData();
        setTimeout(() => { scrollIsLoading = false; }, 300);
      }
    });
  }
}

// Create restaurant card HTML
function createRestaurantCard(restaurant) {
  const vibeTooltips = {
    '🍷 LUXE': 'Elegantní zážitek, důraz na detail, klidná atmosféra',
    '🔥 DRAMA': 'Výrazné chutě, silná osobnost, nezapomenutelné kombinace',
    '🖤 DARK': 'Intimní atmosféra, večerní vibe, tlumené světlo',
    '🌊 CALM': 'Klidná atmosféra, harmonie, pohoda'
  };
  
  // Try multiple image sources
  const imageUrl = restaurant.image_url || 
                   restaurant.image || 
                   restaurant.photo_url ||
                   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
  
  
  // Mock menu data - replace with real data from restaurant object
  const menuItems = [
    { name: 'Hovězí tatarák', desc: 's trhaným žloutkem', price: '380 Kč' },
    { name: 'Grilovaný losos', desc: 's citrusovou salsou', price: '450 Kč' },
    { name: 'Pasta carbonara', desc: 'domácí těstoviny', price: '320 Kč' },
    { name: 'Degustační menu', desc: '5 chodů', price: '1250 Kč' }
  ];
  
  return `
    <div class="card-wrapper" style="perspective: 1200px;">
      <div class="card-inner" style="position: relative; width: 100%; transition: transform 0.4s ease-in-out; transform-style: preserve-3d;">
        
        <!-- FRONT SIDE -->
        <div class="card-front rounded-3xl bg-white/5 overflow-hidden" style="backface-visibility: hidden;">
          <div class="relative">
            <a href="restaurace-${restaurant.slug}.html" class="block">
              <img src="${imageUrl}" alt="${restaurant.name}" loading="lazy" decoding="async" class="aspect-[3/4] w-full h-full object-cover" />
            </a>
            <!-- Buttons on image -->
            <div class="absolute bottom-3 right-3 flex gap-2">
              <button data-save="${restaurant.slug}" class="save-btn w-11 h-11 rounded-full bg-black/30 backdrop-blur border border-white/20 hover:border-gurmaogold hover:text-gurmaogold transition flex items-center justify-center" aria-label="Uložit">🤍</button>
              <button class="share-btn w-11 h-11 rounded-full bg-black/30 backdrop-blur border border-white/20 hover:border-gurmaogold hover:text-gurmaogold transition flex items-center justify-center" 
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
          <div class="p-6">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex-1">
                <div class="vibe-tooltip text-sm text-gurmaogold mb-1" data-tooltip="${vibeTooltips[restaurant.vibe] || ''}">${restaurant.vibe}</div>
                <h3 class="text-xl font-semibold">${restaurant.name}</h3>
                <p class="text-white/60 text-sm mt-1">${restaurant.city} · ${restaurant.tag}</p>
              </div>
              <button class="flip-btn hidden md:flex w-11 h-11 rounded-full bg-gurmaogold text-black hover:bg-gurmaogold/80 transition items-center justify-center flex-shrink-0" title="Zobrazit menu" aria-label="Zobrazit menu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="9"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
              </button>
            </div>
            
            <!-- Rating Section -->
            <div data-restaurant-rating="${restaurant.slug}">
              <div class="border-t border-white/10 pt-3 mt-3">
                <!-- Average rating (populated later) -->
                <div class="flex items-center gap-2 mb-2">
                  <div class="inline-flex items-center gap-0.5 text-sm">
                    <span class="text-white/20">⭐</span>
                    <span class="text-white/20">⭐</span>
                    <span class="text-white/20">⭐</span>
                    <span class="text-white/20">⭐</span>
                    <span class="text-white/20">⭐</span>
                  </div>
                  <span class="text-xs text-white/40">—</span>
                </div>
                <!-- User rating (populated later) -->
                <div class="text-xs text-white/40 mb-1">Tvoje hodnocení:</div>
                <div class="inline-flex items-center gap-1 text-base">
                  <span class="text-white/20 cursor-pointer hover:scale-110 transition">⭐</span>
                  <span class="text-white/20 cursor-pointer hover:scale-110 transition">⭐</span>
                  <span class="text-white/20 cursor-pointer hover:scale-110 transition">⭐</span>
                  <span class="text-white/20 cursor-pointer hover:scale-110 transition">⭐</span>
                  <span class="text-white/20 cursor-pointer hover:scale-110 transition">⭐</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BACK SIDE -->
        <div class="card-back rounded-3xl bg-white/5 overflow-hidden" style="position: absolute; inset: 0; backface-visibility: hidden; transform: rotateY(180deg);">
          <div class="flex flex-col h-full p-6">
            <!-- Header -->
            <div class="mb-4">
              <h3 class="text-xl font-semibold mb-1">${restaurant.name}</h3>
              <p class="text-gurmaogold text-sm">Dnešní menu</p>
            </div>
            
            <!-- Menu Items -->
            <div class="flex-1 overflow-y-auto space-y-3">
              ${menuItems.map(item => `
                <div class="border-b border-white/10 pb-3">
                  <div class="flex justify-between items-start gap-3">
                    <div class="flex-1">
                      <div class="font-medium">${item.name}</div>
                      ${item.desc ? `<div class="text-sm text-white/60 mt-0.5">${item.desc}</div>` : ''}
                    </div>
                    <div class="text-gurmaogold font-semibold whitespace-nowrap">${item.price}</div>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <!-- Footer CTAs -->
            <div class="mt-4 flex gap-2">
              <a href="restaurace-${restaurant.slug}.html" class="flex-1 px-4 py-2 rounded-full bg-gurmaogold text-black text-center font-semibold hover:bg-gurmaogold/80 transition">
                Detail
              </a>
              <button class="flip-back-btn px-4 py-2 rounded-full border border-white/20 hover:border-gurmaogold hover:text-gurmaogold transition">
                Zpět
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  `;
}

// Initialize ratings for displayed restaurants
async function initializeRatings(restaurants) {
  // Wait for ratingManager to be available and ready
  if (typeof window.ratingManager === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (typeof window.ratingManager === 'undefined') {
    console.error('Rating manager still not available');
    return;
  }
  
  // Wait for rating manager to be ready
  try {
    await window.ratingManager.ensureReady();
  } catch (error) {
    console.error('Rating manager failed to initialize:', error);
    return;
  }
  
  // Load all ratings at once
  await window.ratingManager.loadAllRatings();
  
  // Now render all ratings (from cache, super fast)
  for (const restaurant of restaurants) {
    const container = document.querySelector(`[data-restaurant-rating="${restaurant.slug}"]`);
    if (!container) continue;
    
    try {
      const average = await window.ratingManager.getAverage(restaurant.slug);
      const count = await window.ratingManager.getCount(restaurant.slug);
      const userRating = await window.ratingManager.getUserRating(restaurant.slug);
      
      let html = '<div class="border-t border-white/10 pt-3 mt-3">';
      
      if (average > 0) {
        html += `
          <div class="flex items-center gap-2 mb-2">
            ${window.ratingManager.renderStars(average, 'sm')}
            <span class="text-xs text-white/60">${average.toFixed(1)} (${count})</span>
          </div>
        `;
      }
      
      if (userRating > 0) {
        html += '<div class="text-xs text-white/40 mb-1">Tvoje hodnocení:</div>';
        html += await window.ratingManager.renderInteractiveStars(restaurant.slug, userRating);
      } else if (average === 0) {
        html += '<div class="text-xs text-white/40 mb-2">Zatím nehodnoceno</div>';
        html += '<div class="text-xs text-white/40 mb-1">Ohodnoť jako první:</div>';
        html += await window.ratingManager.renderInteractiveStars(restaurant.slug, 0);
      } else {
        html += '<div class="text-xs text-white/40 mb-1">Tvoje hodnocení:</div>';
        html += await window.ratingManager.renderInteractiveStars(restaurant.slug, 0);
      }
      
      html += '</div>';
      
      container.innerHTML = html;
    } catch (error) {
      console.error(`Error initializing rating for ${restaurant.slug}:`, error);
      container.innerHTML = '<div class="border-t border-white/10 pt-3 mt-3"><div class="text-xs text-white/40">Hodnocení není dostupné</div></div>';
    }
  }
}

// Initialize filters
function initializeFilters() {
  const filterButtons = document.querySelectorAll('#filters button');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active state from all filter buttons (but keep locationBtn state)
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
      
      // Filter restaurants (keeps distance sorting if active)
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

// Initialize per-page buttons
function initializePerPageButtons() {
  const buttons = document.querySelectorAll('.per-page-btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active state from all buttons
      buttons.forEach(btn => {
        btn.classList.remove('bg-gurmaogold', 'text-black');
        btn.classList.add('bg-white/5');
      });
      
      // Add active state to clicked button
      button.classList.remove('bg-white/5');
      button.classList.add('bg-gurmaogold', 'text-black');
      
      // Update perPage value and reload
      perPage = parseInt(button.dataset.count);
      currentlyDisplayed = 0;
      applyFilters();
    });
  });
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
    btn.classList.add('bg-white/5', 'border-white/15');
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
        btn.classList.remove('bg-white/5', 'border-white/15');
        btn.classList.add('bg-gurmaogold', 'text-black', 'border-gurmaogold');
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Nepodařilo se získat vaši polohu. Zkontrolujte oprávnění prohlížeče.');
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span class="hidden md:inline">Blízko mě</span>';
        btn.classList.remove('bg-gurmaogold', 'text-black', 'border-gurmaogold');
        btn.classList.add('bg-white/5', 'border-white/15');
        btn.disabled = false;
      }
    );
  } else {
    alert('Váš prohlížeč nepodporuje geolokaci.');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span class="hidden md:inline">Blízko mě</span>';
    btn.classList.remove('bg-gurmaogold', 'text-black', 'border-gurmaogold');
    btn.classList.add('bg-white/5', 'border-white/15');
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
  }
}

// Initialize flip card interactions
function initializeFlipCards() {
  // Event delegation for flip buttons
  document.addEventListener('click', (e) => {
    // Flip to back
    if (e.target.closest('.flip-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const cardInner = e.target.closest('.card-wrapper').querySelector('.card-inner');
      if (cardInner) {
        cardInner.style.transform = 'rotateY(180deg)';
        cardInner.style.willChange = 'transform';
      }
    }
    
    // Flip to front
    if (e.target.closest('.flip-back-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const cardInner = e.target.closest('.card-wrapper').querySelector('.card-inner');
      if (cardInner) {
        cardInner.style.transform = 'rotateY(0deg)';
        setTimeout(() => {
          cardInner.style.willChange = 'auto';
        }, 400);
      }
    }
  });
  
  // Keyboard accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const focused = document.activeElement;
      if (focused.classList.contains('flip-btn') || focused.classList.contains('flip-back-btn')) {
        e.preventDefault();
        focused.click();
      }
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadRestaurants();
  
  // Location button handler
  const locationBtn = document.getElementById('locationBtn');
  if (locationBtn) {
    locationBtn.addEventListener('click', findNearestRestaurants);
  }
  
  // Listen for rating updates and refresh that specific restaurant's rating display
  window.addEventListener('ratingUpdated', async (event) => {
    const { restaurantId } = event.detail;
    const container = document.querySelector(`[data-restaurant-rating="${restaurantId}"]`);
    if (!container || !window.ratingManager) return;
    
    try {
      // Reload stats for this restaurant
      const avgRating = await window.ratingManager.getAverage(restaurantId);
      const count = await window.ratingManager.getCount(restaurantId);
      const userRating = await window.ratingManager.getUserRating(restaurantId);
      
      let html = '<div class="border-t border-white/10 pt-3 mt-3">';
      
      if (avgRating > 0) {
        html += `
          <div class="flex items-center gap-2 mb-2">
            ${window.ratingManager.renderStars(avgRating, 'sm')}
            <span class="text-xs text-white/60">${avgRating.toFixed(1)} (${count})</span>
          </div>
        `;
      }
      
      if (userRating > 0) {
        html += '<div class="text-xs text-white/40 mb-1">Tvoje hodnocení:</div>';
        html += await window.ratingManager.renderInteractiveStars(restaurantId, userRating);
      } else if (avgRating === 0) {
        html += '<div class="text-xs text-white/40 mb-2">Zatím nehodnoceno</div>';
        html += '<div class="text-xs text-white/40 mb-1">Ohodnoť jako první:</div>';
        html += await window.ratingManager.renderInteractiveStars(restaurantId, 0);
      } else {
        html += '<div class="text-xs text-white/40 mb-1">Tvoje hodnocení:</div>';
        html += await window.ratingManager.renderInteractiveStars(restaurantId, 0);
      }
      
      html += '</div>';
      
      container.innerHTML = html;
    } catch (error) {
      console.error('Error updating rating display:', error);
    }
  });
});
