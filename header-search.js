// Header Search with Location Integration
import { supabase } from './supabase-client.js';

let LocationSearch;
let locationSearch;

// Load location-search module
async function loadLocationModule() {
  try {
    const module = await import('./location-search.js');
    LocationSearch = module.LocationSearch;
    locationSearch = new LocationSearch(supabase);
  } catch (error) {
    console.error('Failed to load location module:', error);
  }
}

loadLocationModule();

function initHeaderSearch() {
  console.log('🔍 Header search initializing...');
  const headerSearchBox = document.getElementById('headerSearchBox');
  const headerSearchToggle = document.getElementById('headerSearchToggle');
  const headerSearchInput = document.getElementById('headerSearchInput');
  const headerSearchResults = document.getElementById('headerSearchResults');
  const headerLocationToggle = document.getElementById('headerLocationToggle');
  
  console.log('Elements found:', {
    headerSearchBox: !!headerSearchBox,
    headerSearchToggle: !!headerSearchToggle,
    headerSearchInput: !!headerSearchInput,
    headerSearchResults: !!headerSearchResults,
    headerLocationToggle: !!headerLocationToggle
  });
  
  if (!headerSearchBox || !headerSearchToggle || !headerSearchInput || !headerSearchResults) {
    console.error('❌ Header search elements not found!');
    return;
  }
  
  console.log('✅ Header search initialized successfully');
  
  let isExpanded = false;
  let isLocationActive = false;
  
  // Načíst uložený stav polohy
  if (locationSearch && locationSearch.isLocationEnabled) {
    isLocationActive = true;
    headerLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
    headerLocationToggle.classList.add('text-gurmaogold');
  }
  
  // Location toggle
  if (headerLocationToggle) {
    headerLocationToggle.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      if (!isLocationActive) {
        try {
          headerLocationToggle.innerHTML = '<div class="w-4 h-4 border-2 border-gurmaogold border-t-transparent rounded-full animate-spin"></div>';
          // VŽDY získej novou pozici (forceRefresh = true)
          await locationSearch.getUserLocation(true);
          headerLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
          headerLocationToggle.classList.add('text-gurmaogold');
          isLocationActive = true;
          
          if (headerSearchInput.value.trim()) {
            headerSearchInput.dispatchEvent(new Event('input'));
          }
        } catch (error) {
          console.error('Chyba při získávání pozice:', error);
          headerLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
        }
      } else {
        locationSearch.disable();
        headerLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
        headerLocationToggle.classList.remove('text-gurmaogold');
        isLocationActive = false;
        
        if (headerSearchInput.value.trim()) {
          headerSearchInput.dispatchEvent(new Event('input'));
        }
      }
    });
  }
  
  headerSearchToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isExpanded) {
      headerSearchBox.classList.remove('w-9');
      headerSearchBox.classList.add('w-80');
      headerSearchInput.classList.remove('opacity-0', 'w-0');
      headerSearchInput.classList.add('opacity-100', 'w-full', 'pr-3');
      
      if (headerLocationToggle) {
        headerLocationToggle.classList.remove('opacity-0', 'pointer-events-none');
        headerLocationToggle.classList.add('opacity-100', 'pointer-events-auto');
      }
      
      setTimeout(() => headerSearchInput.focus(), 300);
      isExpanded = true;
    }
  });
  
  document.addEventListener('click', (e) => {
    // Handle phone icon clicks
    if (e.target.closest('.phone-icon-link')) {
      e.preventDefault();
      e.stopPropagation();
      const phoneIcon = e.target.closest('.phone-icon-link');
      const phone = phoneIcon.getAttribute('data-phone');
      if (phone && window.innerWidth < 768) {
        window.location.href = `tel:${phone}`;
      }
      return;
    }
    
    // Handle menu icon clicks
    if (e.target.closest('.menu-icon-link')) {
      e.preventDefault();
      e.stopPropagation();
      const menuIcon = e.target.closest('.menu-icon-link');
      const url = menuIcon.getAttribute('data-url');
      if (url && url !== '#') {
        window.open(url, '_blank');
      }
      return;
    }
    
    if (isExpanded && !headerSearchBox.contains(e.target) && !headerSearchResults.contains(e.target)) {
      headerSearchBox.classList.add('w-9');
      headerSearchBox.classList.remove('w-80');
      headerSearchInput.classList.add('opacity-0', 'w-0');
      headerSearchInput.classList.remove('opacity-100', 'w-full', 'pr-3');
      headerSearchInput.value = '';
      headerSearchResults.classList.add('hidden');
      headerSearchResults.innerHTML = '';
      
      if (headerLocationToggle) {
        headerLocationToggle.classList.add('opacity-0', 'pointer-events-none');
        headerLocationToggle.classList.remove('opacity-100', 'pointer-events-auto');
      }
      
      isExpanded = false;
    }
  });
  
  let searchTimeout;
  headerSearchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim().toLowerCase();
    clearTimeout(searchTimeout);
    
    if (!query) {
      headerSearchResults.classList.add('hidden');
      headerSearchResults.innerHTML = '';
      return;
    }
    
    searchTimeout = setTimeout(async () => {
      try {
        // Vyhledávání restaurací
        let { data: restaurants, error: restaurantsError } = await supabase
          .from('restaurants')
          .select('id, slug, name, city, vibe, tag, image_url, latitude, longitude')
          .or(`name.ilike.%${query}%,city.ilike.%${query}%,tag.ilike.%${query}%,vibe.ilike.%${query}%`)
          .limit(20);
        
        if (restaurantsError) throw restaurantsError;
        
        // Vyhledávání kuchařů
        let { data: chefs, error: chefsError } = await supabase
          .from('chefs')
          .select('id, slug, name, image_url')
          .ilike('name', `%${query}%`)
          .limit(10);
        
        console.log('👨‍🍳 Chefs dotaz:', { query, chefs, chefsError });
        
        if (chefsError) {
          console.error('Chyba při vyhledávání kuchařů:', chefsError);
          chefs = [];
        }
        
        let results = restaurants || [];
        let chefResults = chefs || [];
        
        console.log('🔍 Vyhledávání:', { 
          query, 
          restaurants: results.length, 
          chefs: chefResults.length 
        });
        
        if (isLocationActive && locationSearch && locationSearch.isLocationEnabled && locationSearch.userLocation) {
          results = results.map(restaurant => {
            if (restaurant.latitude && restaurant.longitude) {
              const distance = locationSearch.calculateDistance(
                locationSearch.userLocation.lat,
                locationSearch.userLocation.lng,
                restaurant.latitude,
                restaurant.longitude
              );
              return { ...restaurant, distance };
            }
            return restaurant;
          });
          results.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        }
        
        if (results.length > 0 || chefResults.length > 0) {
          headerSearchResults.classList.remove('hidden');
          
          let html = '';
          
          // Restaurace
          if (results.length > 0) {
            html += results.map(r => {
            const identifier = r.slug || r.id;
            let distanceHTML = '';
            if (isLocationActive && r.distance !== undefined) {
              distanceHTML = `<span class="text-gurmaogold text-xs ml-2">${locationSearch.formatDistance(r.distance)}</span>`;
            }
            // Extract website URL from image_url
            let websiteUrl = '#';
            if (r.image_url) {
              const match = r.image_url.match(/https?:\/\/([^/]+)/);
              if (match) {
                websiteUrl = 'https://' + match[1];
              }
            }
            return `
            <a href="restaurace-detail.html?id=${identifier}" class="block p-3 hover:bg-white/10 transition border-b border-white/10 last:border-b-0">
              <div class="flex gap-3 items-center">
                <div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('${r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}')"></div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">${r.name}${distanceHTML}</div>
                  <div class="text-xs text-white/60 flex items-center gap-2">
                    <span class="flex-1 truncate">${r.city}</span>
                    <span data-url="${websiteUrl}" class="menu-icon-link cursor-pointer">
                      <svg class="w-6 h-6 text-gurmaogold hover:text-yellow-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Menu restaurace">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                      </svg>
                    </span>
                  </div>
                  <div class="text-xs text-white/50 truncate">${r.vibe}</div>
                </div>
              </div>
            </a>
            `;
          }).join('');
          }
          
          // Kuchaři
          if (chefResults.length > 0) {
            html += chefResults.map(c => {
              const identifier = c.slug || c.id;
              return `
              <a href="kuchar-detail.html?id=${identifier}" class="block p-3 hover:bg-white/10 transition border-b border-white/10 last:border-b-0">
                <div class="flex gap-3 items-center">
                  <div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('${c.image_url || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c'}')"></div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">${c.name}</div>
                    <div class="text-xs text-gurmaogold truncate">👨‍🍳 Kuchař</div>
                  </div>
                </div>
              </a>
              `;
            }).join('');
          }
          
          headerSearchResults.innerHTML = html;
        } else {
          const noResultsMsg = isLocationActive && locationSearch && locationSearch.userLocation 
            ? 'Žádné restaurace v okruhu 20 km' 
            : 'Žádné výsledky';
          headerSearchResults.classList.remove('hidden');
          headerSearchResults.innerHTML = `<div class="p-4 text-sm text-white/60 text-center">${noResultsMsg}</div>`;
        }
      } catch (error) {
        console.error('Header search error:', error);
      }
    }, 300);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeaderSearch);
} else {
  initHeaderSearch();
}

// Initialize Mobile Search
async function initMobileSearch() {
  console.log('Mobile search initializing...');
  
  // Wait for LocationSearch to be loaded
  if (!LocationSearch) {
    await loadLocationModule();
  }
  
  const mobileSearchInput = document.getElementById('mobileSearchInput');
  const mobileSearchResults = document.getElementById('mobileSearchResults');
  const mobileLocationToggle = document.getElementById('mobileLocationToggle');
  
  if (!mobileSearchInput || !mobileSearchResults) {
    return;
  }
  
  let isMobileLocationActive = false;
  
  // Načíst uložený stav polohy
  if (locationSearch && locationSearch.isLocationEnabled && mobileLocationToggle) {
    isMobileLocationActive = true;
    mobileLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
    mobileLocationToggle.classList.add('text-gurmaogold');
  }
  
  // Mobile location toggle
  if (mobileLocationToggle) {
    mobileLocationToggle.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      if (!isMobileLocationActive) {
        try {
          if (!locationSearch) {
            locationSearch = new LocationSearch(supabase);
          }
          mobileLocationToggle.innerHTML = '<div class="w-4 h-4 border-2 border-gurmaogold border-t-transparent rounded-full animate-spin"></div>';
          await locationSearch.getUserLocation(true);
          mobileLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
          mobileLocationToggle.classList.add('text-gurmaogold');
          isMobileLocationActive = true;
          
          if (mobileSearchInput.value.trim()) {
            mobileSearchInput.dispatchEvent(new Event('input'));
          }
        } catch (error) {
          console.error('Chyba při získávání pozice:', error);
          mobileLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
        }
      } else {
        if (locationSearch) locationSearch.disable();
        mobileLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
        mobileLocationToggle.classList.remove('text-gurmaogold');
        isMobileLocationActive = false;
        
        if (mobileSearchInput.value.trim()) {
          mobileSearchInput.dispatchEvent(new Event('input'));
        }
      }
    });
  }
  
  // Mobile search input
  let searchTimeout;
  mobileSearchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.toLowerCase().trim();
    
    if (!query) {
      mobileSearchResults.classList.add('hidden');
      return;
    }
    
    searchTimeout = setTimeout(async () => {
      try {
        let restaurantQuery = supabase
          .from('restaurants')
          .select('id, name, slug, city, vibe, image_url, latitude, longitude')
          .or(`name.ilike.%${query}%,city.ilike.%${query}%,vibe.ilike.%${query}%`)
          .limit(20);
        
        let chefQuery = supabase
          .from('chefs')
          .select('id, name, slug, image_url')
          .ilike('name', `%${query}%`)
          .limit(10);
        
        const [restaurantData, chefData] = await Promise.all([
          restaurantQuery,
          chefQuery
        ]);
        
        let restaurantResults = restaurantData.data || [];
        let chefResults = chefData.data || [];
        
        // Apply location filtering if active (same as desktop - 20km limit)
        if (isMobileLocationActive && locationSearch && locationSearch.isLocationEnabled && locationSearch.userLocation) {
          restaurantResults = restaurantResults.map(restaurant => {
            if (restaurant.latitude && restaurant.longitude) {
              const distance = locationSearch.calculateDistance(
                locationSearch.userLocation.lat,
                locationSearch.userLocation.lng,
                restaurant.latitude,
                restaurant.longitude
              );
              return { ...restaurant, distance };
            }
            return restaurant;
          });
          restaurantResults.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        }
        
        if (restaurantResults.length > 0 || chefResults.length > 0) {
          mobileSearchResults.classList.remove('hidden');
          
          let html = '';
          
          // Restaurace
          if (restaurantResults.length > 0) {
            html += restaurantResults.map(r => {
              const identifier = r.slug || r.id;
              let distanceHTML = '';
              if (isMobileLocationActive && r.distance !== undefined) {
                distanceHTML = `<span class="text-gurmaogold text-xs ml-2">${locationSearch.formatDistance(r.distance)}</span>`;
              }
              let websiteUrl = '#';
              if (r.image_url) {
                const match = r.image_url.match(/https?:\/\/([^/]+)/);
                if (match) {
                  websiteUrl = 'https://' + match[1];
                }
              }
              return `
              <a href="restaurace-detail.html?id=${identifier}" class="block p-3 hover:bg-white/10 transition border-b border-white/10 last:border-b-0">
                <div class="flex gap-3 items-center">
                  <div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('${r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}')"></div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">${r.name}${distanceHTML}</div>
                    <div class="text-xs text-white/60 flex items-center gap-2">
                      <span class="flex-1 truncate">${r.city}</span>
                      <button type="button" class="opacity-50 hover:opacity-100 transition" disabled title="Telefon bude doplněn">
                        <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                      </button>
                      <button type="button" data-url="${websiteUrl}" class="menu-icon-link" onclick="event.preventDefault(); event.stopPropagation(); const url=this.getAttribute('data-url'); if(url && url!=='#') window.open(url,'_blank')">
                        <svg class="w-6 h-6 text-gurmaogold hover:text-yellow-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Menu restaurace">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                      </button>
                    </div>
                        <svg class="w-6 h-6 text-gurmaogold hover:text-yellow-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Menu restaurace">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                      </span>
                    </div>
                    <div class="text-xs text-white/50 truncate">${r.vibe}</div>
                  </div>
                </div>
              </a>
              `;
            }).join('');
          }
          
          // Kuchaři
          if (chefResults.length > 0) {
            html += chefResults.map(c => {
              const identifier = c.slug || c.id;
              return `
              <a href="kuchar-detail.html?id=${identifier}" class="block p-3 hover:bg-white/10 transition border-b border-white/10 last:border-b-0">
                <div class="flex gap-3 items-center">
                  <div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('${c.image_url || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c'}')"></div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">${c.name}</div>
                    <div class="text-xs text-gurmaogold truncate">👨‍🍳 Kuchař</div>
                  </div>
                </div>
              </a>
              `;
            }).join('');
          }
          
          mobileSearchResults.innerHTML = html;
        } else {
          const noResultsMsg = isMobileLocationActive && locationSearch && locationSearch.userLocation 
            ? 'Žádné restaurace v okruhu 20 km' 
            : 'Žádné výsledky';
          mobileSearchResults.classList.remove('hidden');
          mobileSearchResults.innerHTML = `<div class="p-4 text-sm text-white/60 text-center">${noResultsMsg}</div>`;
        }
      } catch (error) {
        console.error('Mobile search error:', error);
      }
    }, 300);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileSearch);
} else {
  initMobileSearch();
}
