// Navigation Search Component
import { supabase } from './supabase-client.js';

// Desktop search functionality
function initDesktopSearch() {
  const searchBox = document.getElementById('searchBox');
  const searchToggle = document.getElementById('searchToggle');
  const navSearchInput = document.getElementById('navSearchInput');
  const navSearchResults = document.getElementById('navSearchResults');
  
  if (!searchBox || !searchToggle || !navSearchInput || !navSearchResults) return;
  
  let isExpanded = false;
  
  // Toggle search box
  searchToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isExpanded) {
      // Expand
      searchBox.classList.remove('w-9');
      searchBox.classList.add('w-80');
      navSearchInput.classList.remove('opacity-0', 'w-0');
      navSearchInput.classList.add('opacity-100', 'w-full', 'px-4');
      setTimeout(() => navSearchInput.focus(), 300);
      isExpanded = true;
    }
  });
  
  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (isExpanded && !searchBox.contains(e.target) && !navSearchResults.contains(e.target)) {
      // Collapse
      searchBox.classList.add('w-9');
      searchBox.classList.remove('w-80');
      navSearchInput.classList.add('opacity-0', 'w-0');
      navSearchInput.classList.remove('opacity-100', 'w-full', 'px-4');
      navSearchInput.value = '';
      navSearchResults.classList.add('hidden');
      navSearchResults.innerHTML = '';
      isExpanded = false;
    }
  });
  
  // Search functionality
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
          .select('id, slug, name, city, vibe, tag, image_url')
          .or(`name.ilike.%${query}%,city.ilike.%${query}%,tag.ilike.%${query}%,vibe.ilike.%${query}%`)
          .limit(6);
        
        if (error) throw error;
        
        if (restaurants && restaurants.length > 0) {
          navSearchResults.classList.remove('hidden');
          navSearchResults.innerHTML = restaurants.map(r => `
            <a href="restaurace-${r.slug}.html" class="block p-3 hover:bg-white/10 transition border-b border-white/10 last:border-b-0">
              <div class="flex gap-3">
                <div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('${r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}')"></div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-sm text-white hover:text-gurmaogold transition truncate">${r.name}</h3>
                  <p class="text-xs text-white/60">${r.city}</p>
                  ${r.vibe ? `<span class="text-xs text-gurmaogold">${r.vibe}</span>` : ''}
                </div>
              </div>
            </a>
          `).join('');
        } else {
          navSearchResults.classList.remove('hidden');
          navSearchResults.innerHTML = '<div class="p-4 text-center text-white/40 text-sm">Nic nenalezeno</div>';
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300);
  });
}

// Mobile search functionality
function initMobileSearch() {
  const mobileSearchBox = document.getElementById('mobileSearchBox');
  const mobileSearchToggle = document.getElementById('mobileSearchToggle');
  const mobileNavSearchInput = document.getElementById('mobileNavSearchInput');
  const mobileNavSearchResults = document.getElementById('mobileNavSearchResults');
  
  if (!mobileSearchBox || !mobileSearchToggle || !mobileNavSearchInput || !mobileNavSearchResults) return;
  
  let isMobileExpanded = false;
  
  // Toggle mobile search box
  mobileSearchToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isMobileExpanded) {
      // Expand
      mobileSearchBox.classList.remove('w-11');
      mobileSearchBox.classList.add('w-32');
      mobileNavSearchInput.classList.remove('opacity-0', 'w-0');
      mobileNavSearchInput.classList.add('opacity-100', 'w-full', 'px-4');
      setTimeout(() => mobileNavSearchInput.focus(), 300);
      isMobileExpanded = true;
    }
  });
  
  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (isMobileExpanded && !mobileSearchBox.contains(e.target) && !mobileNavSearchResults.contains(e.target)) {
      // Collapse
      mobileSearchBox.classList.add('w-11');
      mobileSearchBox.classList.remove('w-32');
      mobileNavSearchInput.classList.add('opacity-0', 'w-0');
      mobileNavSearchInput.classList.remove('opacity-100', 'w-full', 'px-4');
      mobileNavSearchInput.value = '';
      mobileNavSearchResults.classList.add('hidden');
      mobileNavSearchResults.innerHTML = '';
      isMobileExpanded = false;
    }
  });
  
  // Mobile search functionality
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
          .select('id, slug, name, city, vibe, tag, image_url')
          .or(`name.ilike.%${query}%,city.ilike.%${query}%,tag.ilike.%${query}%,vibe.ilike.%${query}%`)
          .limit(6);
        
        if (error) throw error;
        
        if (restaurants && restaurants.length > 0) {
          mobileNavSearchResults.classList.remove('hidden');
          mobileNavSearchResults.innerHTML = restaurants.map(r => `
            <a href="restaurace-${r.slug}.html" class="block p-3 hover:bg-white/10 transition border-b border-white/10 last:border-b-0">
              <div class="flex gap-3">
                <div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('${r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}')"></div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-sm text-white hover:text-gurmaogold transition truncate">${r.name}</h3>
                  <p class="text-xs text-white/60">${r.city}</p>
                  ${r.vibe ? `<span class="text-xs text-gurmaogold">${r.vibe}</span>` : ''}
                </div>
              </div>
            </a>
          `).join('');
        } else {
          mobileNavSearchResults.classList.remove('hidden');
          mobileNavSearchResults.innerHTML = '<div class="p-4 text-center text-white/40 text-sm">Nic nenalezeno</div>';
        }
      } catch (error) {
        console.error('Mobile search error:', error);
      }
    }, 300);
  });
}

// Initialize both
initDesktopSearch();
initMobileSearch();
