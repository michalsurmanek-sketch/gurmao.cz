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
  
  // Location toggle
  if (headerLocationToggle) {
    headerLocationToggle.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      if (!isLocationActive) {
        try {
          headerLocationToggle.innerHTML = '<div class="w-4 h-4 border-2 border-gurmaogold border-t-transparent rounded-full animate-spin"></div>';
          await locationSearch.getUserLocation();
          headerLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
          headerLocationToggle.classList.add('text-gurmaogold');
          isLocationActive = true;
          
          if (headerSearchInput.value.trim()) {
            headerSearchInput.dispatchEvent(new Event('input'));
          }
        } catch (error) {
          console.error('Chyba při získávání pozice:', error);
          headerLocationToggle.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
          alert('Nepodařilo se získat vaši pozici. Povolte prosím přístup k poloze.');
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
        let { data: restaurants, error } = await supabase
          .from('restaurants')
          .select('id, slug, name, city, vibe, tag, image_url, latitude, longitude')
          .or(`name.ilike.%${query}%,city.ilike.%${query}%,tag.ilike.%${query}%,vibe.ilike.%${query}%`)
          .limit(20);
        
        if (error) throw error;
        
        let results = restaurants || [];
        
        if (isLocationActive && locationSearch && locationSearch.userLocation) {
          results = locationSearch.filterByDistance(results);
        }
        
        if (results.length > 0) {
          headerSearchResults.classList.remove('hidden');
          headerSearchResults.innerHTML = results.map(r => {
            const identifier = r.slug || r.id;
            let distanceHTML = '';
            if (isLocationActive && r.distance !== undefined) {
              distanceHTML = `<span class="text-gurmaogold text-xs ml-2">${locationSearch.formatDistance(r.distance)}</span>`;
            }
            return `
            <a href="restaurace-detail.html?id=${identifier}" class="block p-3 hover:bg-white/10 transition border-b border-white/10 last:border-b-0">
              <div class="flex gap-3 items-center">
                <div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('${r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}')"></div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">${r.name}${distanceHTML}</div>
                  <div class="text-xs text-white/60 flex items-center gap-2">
                    <span class="flex-1 truncate">${r.city}</span>
                    <svg class="w-5 h-5 text-gurmaogold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                    </svg>
                  </div>
                  <div class="text-xs text-white/50 truncate">${r.vibe}</div>
                </div>
              </div>
            </a>
            `;
          }).join('');
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
