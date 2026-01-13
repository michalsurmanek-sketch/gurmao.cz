// Navigation Search Component
let supabase;
let LocationSearch;
let locationSearch;

// Load modules asynchronously
(async function() {
  try {
    const supabaseModule = await import('./supabase-client.js');
    supabase = supabaseModule.supabase;
    const locationModule = await import('./location-search.js');
    LocationSearch = locationModule.LocationSearch;
    locationSearch = new LocationSearch();
  } catch (error) {
    console.error('Failed to load modules:', error);
  }
})();

// Desktop search functionality
function initDesktopSearch() {
  const searchBox = document.getElementById('searchBox');
  const searchToggle = document.getElementById('searchToggle');
  const navSearchInput = document.getElementById('navSearchInput');
  const navSearchResults = document.getElementById('navSearchResults');
  
  if (!searchBox || !searchToggle || !navSearchInput || !navSearchResults) return;
  
  let isExpanded = false;
  let isLocationActive = false;
  
  // Použít existující lokační tlačítko z HTML
  const locationToggle = document.getElementById('locationToggle');
  if (!locationToggle) return;
  
  // Toggle location search
  locationToggle.addEventListener('click', async (e) => {
    e.stopPropagation();
    
    if (!isLocationActive) {
      try {
        locationToggle.innerHTML = '<div class="w-4 h-4 border-2 border-gurmaogold border-t-transparent rounded-full animate-spin"></div>';
        await locationSearch.getUserLocation();
        locationToggle.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
        locationToggle.classList.add('text-gurmaogold');
        isLocationActive = true;
        
        if (navSearchInput.value.trim()) {
          navSearchInput.dispatchEvent(new Event('input'));
        }
      } catch (error) {
        console.error('Chyba při získávání pozice:', error);
        locationToggle.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
        alert('Nepodařilo se získat vaši pozici. Povolte prosím přístup k poloze.');
      }
    } else {
      locationSearch.disable();
      locationToggle.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
      locationToggle.classList.remove('text-gurmaogold');
      isLocationActive = false;
      
      if (navSearchInput.value.trim()) {
        navSearchInput.dispatchEvent(new Event('input'));
      }
    }
  });
  
  searchToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isExpanded) {
      searchBox.classList.remove('w-9');
      searchBox.classList.add('w-80');
      navSearchInput.classList.remove('opacity-0', 'w-0');
      navSearchInput.classList.add('opacity-100', 'w-full', 'px-4');
      locationToggle.classList.remove('opacity-0', 'pointer-events-none');
      locationToggle.classList.add('opacity-100', 'pointer-events-auto');
      
      setTimeout(() => navSearchInput.focus(), 300);
      isExpanded = true;
    }
  });
  
  document.addEventListener('click', (e) => {
    if (isExpanded && !searchBox.contains(e.target) && !navSearchResults.contains(e.target)) {
      searchBox.classList.add('w-9');
      searchBox.classList.remove('w-80');
      navSearchInput.classList.add('opacity-0', 'w-0');
      navSearchInput.classList.remove('opacity-100', 'w-full', 'px-4');
      navSearchInput.value = '';
      navSearchResults.classList.add('hidden');
      navSearchResults.innerHTML = '';
      locationToggle.classList.add('opacity-0', 'pointer-events-none');
      locationToggle.classList.remove('opacity-100', 'pointer-events-auto');
      isExpanded = false;
    }
  });
  
  let searchTimeout;
  navSearchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim().toLowerCase();
    clearTimeout(searchTimeout);
    
    if (!query) {
      navSearchResults.classList.add('hidden');
      navSearchResults.innerHTML = '';
      return;
    }
    
    searchTimeout = setTimeout(async () => {
      try {
        const { data: restaurants, error } = await supabase
          .from('restaurants')
          .select('id, slug, name, city, vibe, tag, image_url, latitude, longitude')
          .or(\`name.ilike.%\${query}%,city.ilike.%\${query}%,tag.ilike.%\${query}%,vibe.ilike.%\${query}%\`)
          .limit(20);
        
        if (error) throw error;
        let results = restaurants || [];
        
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
        
        if (results.length > 0) {
          navSearchResults.classList.remove('hidden');
          navSearchResults.innerHTML = results.map(r => {
            const identifier = r.slug || r.id;
            const distanceHTML = (isLocationActive && r.distance !== undefined) 
              ? \`<span class="text-xs text-gurmaogold ml-auto">\${locationSearch.formatDistance(r.distance)}</span>\`
              : '';
            return \`
            <a href="restaurace-detail.html?id=\${identifier}" class="block p-3 hover:bg-white/10 transition border-b border-white/10 last:border-b-0">
              <div class="flex gap-3 items-center">
                <div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('\${r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}')"></div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">\${r.name}</div>
                  <div class="text-xs text-white/60 truncate">\${r.city}</div>
                  <div class="text-xs text-white/50 truncate">\${r.vibe}</div>
                </div>
                \${distanceHTML}
              </div>
            </a>
            \`;
          }).join('');
        } else {
          navSearchResults.classList.remove('hidden');
          navSearchResults.innerHTML = '<div class="p-4 text-sm text-white/60 text-center">Žádné výsledky</div>';
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300);
  });
}

function initMobileSearch() {
  const mobileSearchBox = document.getElementById('mobileSearchBox');
  const mobileSearchToggle = document.getElementById('mobileSearchToggle');
  const mobileNavSearchInput = document.getElementById('mobileNavSearchInput');
  const mobileNavSearchResults = document.getElementById('mobileNavSearchResults');
  const mobileLogo = document.querySelector('header a.modal-title');
  const menuBtn = document.getElementById('menuBtn');
  
  if (!mobileSearchBox || !mobileSearchToggle || !mobileNavSearchInput || !mobileNavSearchResults) return;
  
  let isMobileExpanded = false;
  let isMobileLocationActive = false;
  
  const mobileLocationToggle = document.createElement('button');
  mobileLocationToggle.id = 'mobileLocationToggle';
  mobileLocationToggle.className = 'flex-shrink-0 w-8 h-8 flex items-center justify-center text-white/60 hover:text-gurmaogold transition opacity-0 pointer-events-none';
  mobileLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
  mobileSearchBox.appendChild(mobileLocationToggle);
  
  mobileLocationToggle.addEventListener('click', async (e) => {
    e.stopPropagation();
    
    if (!isMobileLocationActive) {
      try {
        mobileLocationToggle.innerHTML = '<div class="w-4 h-4 border-2 border-gurmaogold border-t-transparent rounded-full animate-spin"></div>';
        await locationSearch.getUserLocation();
        mobileLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
        mobileLocationToggle.classList.add('text-gurmaogold');
        isMobileLocationActive = true;
        
        if (mobileNavSearchInput.value.trim()) {
          mobileNavSearchInput.dispatchEvent(new Event('input'));
        }
      } catch (error) {
        console.error('Chyba při získávání pozice:', error);
        mobileLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 6 0 0 3 3 0 016 0z"/></svg>';
        alert('Nepodařilo se získat vaši pozici. Povolte prosím přístup k poloze.');
      }
    } else {
      locationSearch.disable();
      mobileLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
      mobileLocationToggle.classList.remove('text-gurmaogold');
      isMobileLocationActive = false;
      
      if (mobileNavSearchInput.value.trim()) {
        mobileNavSearchInput.dispatchEvent(new Event('input'));
      }
    }
  });
  
  mobileSearchToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isMobileExpanded) {
      mobileSearchBox.classList.remove('w-11', 'rounded-full');
      mobileSearchBox.classList.add('w-full', 'rounded-2xl');
      mobileNavSearchInput.classList.remove('opacity-0', 'w-0');
      mobileNavSearchInput.classList.add('opacity-100', 'w-full', 'px-4');
      mobileLocationToggle.classList.remove('opacity-0', 'pointer-events-none');
      mobileLocationToggle.classList.add('opacity-100', 'pointer-events-auto');
      
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        if (mobileLogo) mobileLogo.classList.add('hidden');
        if (menuBtn) menuBtn.classList.add('hidden');
      }
      
      setTimeout(() => mobileNavSearchInput.focus(), 300);
      isMobileExpanded = true;
    }
  });
  
  document.addEventListener('click', (e) => {
    if (isMobileExpanded && !mobileSearchBox.contains(e.target) && !mobileNavSearchResults.contains(e.target)) {
      mobileSearchBox.classList.add('w-11', 'rounded-full');
      mobileSearchBox.classList.remove('w-full', 'rounded-2xl');
      mobileNavSearchInput.classList.add('opacity-0', 'w-0');
      mobileNavSearchInput.classList.remove('opacity-100', 'w-full', 'px-4');
      mobileNavSearchInput.value = '';
      mobileNavSearchResults.classList.add('hidden');
      mobileNavSearchResults.innerHTML = '';
      mobileLocationToggle.classList.add('opacity-0', 'pointer-events-none');
      mobileLocationToggle.classList.remove('opacity-100', 'pointer-events-auto');
      
      if (mobileLogo) mobileLogo.classList.remove('hidden');
      if (menuBtn) menuBtn.classList.remove('hidden');
      
      isMobileExpanded = false;
    }
  });
  
  let mobileSearchTimeout;
  mobileNavSearchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim().toLowerCase();
    clearTimeout(mobileSearchTimeout);
    
    if (!query) {
      mobileNavSearchResults.classList.add('hidden');
      mobileNavSearchResults.innerHTML = '';
      return;
    }
    
    mobileSearchTimeout = setTimeout(async () => {
      try {
        const { data: restaurants, error } = await supabase
          .from('restaurants')
          .select('id, slug, name, city, vibe, tag, image_url, latitude, longitude')
          .or(\`name.ilike.%\${query}%,city.ilike.%\${query}%,tag.ilike.%\${query}%,vibe.ilike.%\${query}%\`)
          .limit(20);
        
        if (error) throw error;
        let results = restaurants || [];
        
        if (isMobileLocationActive && locationSearch && locationSearch.isLocationEnabled && locationSearch.userLocation) {
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
        
        if (results.length > 0) {
          mobileNavSearchResults.classList.remove('hidden');
          mobileNavSearchResults.innerHTML = results.map(r => {
            const identifier = r.slug || r.id;
            const distanceHTML = (isMobileLocationActive && r.distance !== undefined) 
              ? \`<span class="text-xs text-gurmaogold ml-auto">\${locationSearch.formatDistance(r.distance)}</span>\`
              : '';
            return \`
            <a href="restaurace-detail.html?id=\${identifier}" class="block p-3 hover:bg-white/10 transition border-b border-white/10 last:border-b-0">
              <div class="flex gap-3 items-center">
                <div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('\${r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}')"></div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">\${r.name}</div>
                  <div class="text-xs text-white/60 truncate">\${r.city} • \${r.tag || r.vibe}</div>
                </div>
                \${distanceHTML}
              </div>
            </a>
            \`;
          }).join('');
        } else {
          mobileNavSearchResults.classList.remove('hidden');
          mobileNavSearchResults.innerHTML = '<div class="p-4 text-sm text-white/60 text-center">Žádné výsledky</div>';
        }
      } catch (error) {
        console.error('Mobile search error:', error);
      }
    }, 300);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDesktopSearch();
    initMobileSearch();
  });
} else {
  initDesktopSearch();
  initMobileSearch();
}
