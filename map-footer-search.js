// Map footer search - opens restaurant in map instead of navigating
import { supabase } from './supabase-client.js';

// Function to find and open marker by restaurant ID
function openRestaurantInMap(restaurantId) {
  // Get the marker from allMarkers array (defined in mapa.js)
  if (typeof allMarkers === 'undefined') {
    console.error('Map markers not loaded yet');
    return;
  }

  // Find restaurant data
  fetch(`https://txfuxrezyrgybjvjnhom.supabase.co/rest/v1/restaurants?id=eq.${restaurantId}`, {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZnV4cmV6eXJneWJqdmpuaG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzNTYyMzksImV4cCI6MjA0OTkzMjIzOX0.R3bGGbIDtW6lBt8yTwTuNc2wTgQ6F2NWBJ1ovE5HxlY'
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data && data.length > 0) {
      const restaurant = data[0];
      
      // Fly to restaurant location
      if (typeof map !== 'undefined') {
        map.flyTo({
          center: [restaurant.longitude, restaurant.latitude],
          zoom: 14,
          duration: 2000
        });
        
        // Find and click the marker to open popup
        setTimeout(() => {
          const marker = allMarkers.find(m => 
            m.marker.getLngLat().lng === restaurant.longitude &&
            m.marker.getLngLat().lat === restaurant.latitude
          );
          
          if (marker) {
            marker.marker.togglePopup();
          }
        }, 2000);
      }
    }
  })
  .catch(error => {
    console.error('Error finding restaurant:', error);
  });
}

// Initialize map footer search
document.addEventListener('DOMContentLoaded', () => {
  const mapFooterSearchBox = document.getElementById('mapFooterSearchBox');
  const mapFooterSearchToggle = document.getElementById('mapFooterSearchToggle');
  const mapFooterSearchInput = document.getElementById('mapFooterSearchInput');
  const mapFooterSearchResults = document.getElementById('mapFooterSearchResults');

  if (!mapFooterSearchToggle || !mapFooterSearchBox || !mapFooterSearchInput || !mapFooterSearchResults) {
    return;
  }

  let isMapFooterExpanded = false;

  mapFooterSearchToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isMapFooterExpanded) {
      // Expand
      mapFooterSearchBox.classList.remove('w-8');
      mapFooterSearchBox.classList.add('w-64');
      mapFooterSearchInput.classList.remove('opacity-0', 'w-0');
      mapFooterSearchInput.classList.add('opacity-100', 'w-full', 'px-3');
      setTimeout(() => mapFooterSearchInput.focus(), 300);
      isMapFooterExpanded = true;
    }
  });

  // Close search when clicking outside
  document.addEventListener('click', (e) => {
    if (isMapFooterExpanded && !mapFooterSearchBox.contains(e.target) && !mapFooterSearchResults.contains(e.target)) {
      mapFooterSearchBox.classList.add('w-8');
      mapFooterSearchBox.classList.remove('w-64');
      mapFooterSearchInput.classList.add('opacity-0', 'w-0');
      mapFooterSearchInput.classList.remove('opacity-100', 'w-full', 'px-3');
      mapFooterSearchInput.value = '';
      mapFooterSearchResults.classList.add('hidden');
      mapFooterSearchResults.innerHTML = '';
      isMapFooterExpanded = false;
    }
  });

  // Search functionality
  let mapFooterSearchTimeout;
  mapFooterSearchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    clearTimeout(mapFooterSearchTimeout);
    
    if (!query) {
      mapFooterSearchResults.classList.add('hidden');
      mapFooterSearchResults.innerHTML = '';
      return;
    }
    
    mapFooterSearchTimeout = setTimeout(async () => {
      try {
        const { data: restaurants, error } = await supabase
          .from('restaurants')
          .select('id, slug, name, city, vibe, tag, image_url, latitude, longitude')
          .or(`name.ilike.%${query}%,city.ilike.%${query}%,tag.ilike.%${query}%,vibe.ilike.%${query}%`)
          .limit(6);
        
        if (error) throw error;
        
        if (restaurants && restaurants.length > 0) {
          mapFooterSearchResults.classList.remove('hidden');
          mapFooterSearchResults.innerHTML = restaurants.map(r => {
            return `
            <button onclick="window.openRestaurantInMap('${r.id}')" class="block w-full p-3 hover:bg-white/10 transition border-b border-white/10 last:border-b-0 text-left">
              <div class="flex gap-3">
                <div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('${r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}')"></div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-sm text-white hover:text-gurmaogold transition truncate">${r.name}</h3>
                  <p class="text-xs text-white/60">${r.city}</p>
                  ${r.vibe ? `<span class="text-xs text-gurmaogold">${r.vibe}</span>` : ''}
                </div>
              </div>
            </button>
          `;
          }).join('');
          
          // Close search after clicking a result
          mapFooterSearchResults.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
              mapFooterSearchBox.classList.add('w-8');
              mapFooterSearchBox.classList.remove('w-64');
              mapFooterSearchInput.classList.add('opacity-0', 'w-0');
              mapFooterSearchInput.classList.remove('opacity-100', 'w-full', 'px-3');
              mapFooterSearchInput.value = '';
              mapFooterSearchResults.classList.add('hidden');
              mapFooterSearchResults.innerHTML = '';
              isMapFooterExpanded = false;
            });
          });
        } else {
          mapFooterSearchResults.classList.remove('hidden');
          mapFooterSearchResults.innerHTML = '<div class="p-4 text-center text-white/40 text-sm">Nic nenalezeno</div>';
        }
      } catch (error) {
        console.error('Map footer search error:', error);
      }
    }, 300);
  });
});

// Export function to global scope
window.openRestaurantInMap = openRestaurantInMap;
