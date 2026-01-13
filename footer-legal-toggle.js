// Footer legal links toggle
document.addEventListener('DOMContentLoaded', async () => {
  const legalToggle = document.getElementById('legalToggle');
  const legalLinks = document.getElementById('legalLinks');
  const legalToggleMobile = document.getElementById('legalToggleMobile');
  const legalLinksMobile = document.getElementById('legalLinksMobile');

  // Desktop toggle
  if (legalToggle && legalLinks) {
    legalToggle.addEventListener('click', () => {
      legalLinks.classList.toggle('hidden');
      legalLinks.classList.toggle('flex');
      
      // Update arrow
      if (legalLinks.classList.contains('hidden')) {
        legalToggle.innerHTML = 'Právní informace ▼';
      } else {
        legalToggle.innerHTML = 'Právní informace ▲';
      }
    });
  }

  // Mobile toggle (pro mapu)
  if (legalToggleMobile && legalLinksMobile) {
    legalToggleMobile.addEventListener('click', () => {
      legalLinksMobile.classList.toggle('hidden');
      legalLinksMobile.classList.toggle('flex');
      
      // Update arrow
      if (legalLinksMobile.classList.contains('hidden')) {
        legalToggleMobile.innerHTML = 'Právní informace ▼';
      } else {
        legalToggleMobile.innerHTML = 'Právní informace ▲';
      }
    });
  }

  // Import supabase and LocationSearch
  let supabase;
  let LocationSearch;
  let locationSearch;
  try {
    const supabaseModule = await import('./supabase-client.js');
    supabase = supabaseModule.supabase;
    const locationModule = await import('./location-search.js');
    LocationSearch = locationModule.LocationSearch;
    locationSearch = new LocationSearch();
  } catch (error) {
    console.error('Failed to load modules:', error);
  }

  // Footer search functionality
  const footerSearchBox = document.getElementById('footerSearchBox');
  const footerSearchToggle = document.getElementById('footerSearchToggle');
  const footerSearchInput = document.getElementById('footerSearchInput');
  const footerSearchResults = document.getElementById('footerSearchResults');

  if (footerSearchToggle && footerSearchBox && footerSearchInput && footerSearchResults) {
    let isFooterExpanded = false;
    let isFooterLocationActive = false;
    
    // Přidat lokační tlačítko dynamicky
    const locationBtn = document.createElement('button');
    locationBtn.id = 'footerLocationToggle';
    locationBtn.className = 'flex-shrink-0 w-9 h-9 flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300';
    locationBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
    footerSearchBox.insertBefore(locationBtn, footerSearchInput);
    
    // Toggle location search
    locationBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      if (!isFooterLocationActive) {
        try {
          locationBtn.innerHTML = '<div class="w-4 h-4 border-2 border-gurmaogold border-t-transparent rounded-full animate-spin"></div>';
          await locationSearch.getUserLocation();
          locationBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
          locationBtn.classList.add('text-gurmaogold');
          isFooterLocationActive = true;
          
          // Trigger search with location
          if (footerSearchInput.value.trim()) {
            footerSearchInput.dispatchEvent(new Event('input'));
          }
        } catch (error) {
          console.error('Chyba při získávání pozice:', error);
          locationBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
          alert('Nepodařilo se získat vaši pozici. Povolte prosím přístup k poloze.');
        }
      } else {
        locationSearch.disable();
        locationBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
        locationBtn.classList.remove('text-gurmaogold');
        isFooterLocationActive = false;
        
        // Trigger search without location
        if (footerSearchInput.value.trim()) {
          footerSearchInput.dispatchEvent(new Event('input'));
        }
      }
    });
    const socialIcons = document.querySelectorAll('.footer-social');
    const socialLabel = footerSearchBox.parentElement.parentElement.querySelector('span.text-gurmaogold');
    const searchWrapper = footerSearchBox.parentElement;
    const footerRightSection = searchWrapper.parentElement; // div s flex items-center gap-3

    footerSearchToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isFooterExpanded) {
        const isMobile = window.innerWidth < 768;
        console.log('Footer search clicked, isMobile:', isMobile, 'socialIcons count:', socialIcons.length);
        
        // Na mobilu prostě skrýt sociální ikony
        if (isMobile) {
          socialIcons.forEach(icon => {
            icon.style.display = 'none';
          });
          if (socialLabel) socialLabel.style.display = 'none';
        }
        
        // Expand - rozbalení zleva doprava
        footerSearchBox.classList.remove('w-9');
        footerSearchBox.classList.add('w-72', 'md:w-80');
        footerSearchInput.classList.remove('opacity-0', 'w-0');
        footerSearchInput.classList.add('opacity-100', 'flex-1', 'pr-2');
        
        // Zobrazit lokační tlačítko
        if (locationBtn) {
          locationBtn.classList.remove('opacity-0', 'pointer-events-none');
          locationBtn.classList.add('opacity-100', 'pointer-events-auto');
        }
        
        setTimeout(() => footerSearchInput.focus(), 300);
        isFooterExpanded = true;
      }
    });

    // Close search when clicking outside
    document.addEventListener('click', (e) => {
      if (isFooterExpanded && !footerSearchBox.contains(e.target) && !footerSearchResults.contains(e.target)) {
        footerSearchBox.classList.add('w-9');
        footerSearchBox.classList.remove('w-72', 'md:w-80');
        footerSearchInput.classList.add('opacity-0', 'w-0');
        footerSearchInput.classList.remove('opacity-100', 'flex-1', 'pr-2');
        footerSearchInput.value = '';
        footerSearchResults.classList.add('hidden');
        footerSearchResults.innerHTML = '';
        
        // Skrýt lokační tlačítko
        if (locationBtn) {
          locationBtn.classList.add('opacity-0', 'pointer-events-none');
          locationBtn.classList.remove('opacity-100', 'pointer-events-auto');
        }
        
        // Zobrazit sociální ikony zpět
        socialIcons.forEach(icon => {
          icon.style.display = '';
        });
        if (socialLabel) socialLabel.style.display = '';
        
        isFooterExpanded = false;
      }
    });

    // Search functionality
    let footerSearchTimeout;
    footerSearchInput.addEventListener('input', async (e) => {
      const query = e.target.value.trim().toLowerCase();
      
      clearTimeout(footerSearchTimeout);
      
      if (!query) {
        footerSearchResults.classList.add('hidden');
        footerSearchResults.innerHTML = '';
        return;
      }
      
      footerSearchTimeout = setTimeout(async () => {
        try {
          const { data: restaurants, error } = await supabase
            .from('restaurants')
            .select('id, slug, name, city, vibe, tag, image_url, latitude, longitude')
            .or(`name.ilike.%${query}%,city.ilike.%${query}%,tag.ilike.%${query}%,vibe.ilike.%${query}%`)
            .limit(20);
          
          if (error) throw error;
          
          let results = restaurants || [];
          
          // Přidej vzdálenost pokud je lokace aktivní (bez filtrování)
          if (isFooterLocationActive && locationSearch && locationSearch.isLocationEnabled && locationSearch.userLocation) {
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
            // Seřaď podle vzdálenosti
            results.sort((a, b) => (a.distance || 999) - (b.distance || 999));
          }
          
          if (results.length > 0) {
            footerSearchResults.classList.remove('hidden');
            footerSearchResults.innerHTML = results.map(r => {
              const identifier = r.slug || r.id;
              const distanceHTML = (isFooterLocationActive && r.distance !== undefined) 
                ? `<span class="text-xs text-gurmaogold ml-auto">${locationSearch.formatDistance(r.distance)}</span>`
                : '';
              return `
              <a href="restaurace-detail.html?id=${identifier}" class="block p-3 hover:bg-white/10 transition border-b border-white/10 last:border-b-0">
                <div class="flex gap-3 items-center">
                  <div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('${r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}')"></div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-sm text-white hover:text-gurmaogold transition truncate">${r.name}</h3>
                    <p class="text-xs text-white/60">${r.city}</p>
                    ${r.vibe ? `<span class="text-xs text-gurmaogold">${r.vibe}</span>` : ''}
                  </div>
                  ${distanceHTML}
                </div>
              </a>
            `;
            }).join('');
          } else {
            footerSearchResults.classList.remove('hidden');
            footerSearchResults.innerHTML = '<div class="p-4 text-center text-white/40 text-sm">Nic nenalezeno</div>';
          }
        } catch (error) {
          console.error('Footer search error:', error);
        }
      }, 300);
    });
  }
});
