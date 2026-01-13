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

  // Import supabase
  let supabase;
  try {
    const module = await import('./supabase-client.js');
    supabase = module.supabase;
  } catch (error) {
    console.error('Failed to load Supabase client:', error);
  }

  // Footer search functionality
  const footerSearchBox = document.getElementById('footerSearchBox');
  const footerSearchToggle = document.getElementById('footerSearchToggle');
  const footerSearchInput = document.getElementById('footerSearchInput');
  const footerSearchResults = document.getElementById('footerSearchResults');

  if (footerSearchToggle && footerSearchBox && footerSearchInput && footerSearchResults) {
    let isFooterExpanded = false;
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
            .select('id, slug, name, city, vibe, tag, image_url')
            .or(`name.ilike.%${query}%,city.ilike.%${query}%,tag.ilike.%${query}%,vibe.ilike.%${query}%`)
            .limit(6);
          
          if (error) throw error;
          
          if (restaurants && restaurants.length > 0) {
            footerSearchResults.classList.remove('hidden');
            footerSearchResults.innerHTML = restaurants.map(r => {
              const identifier = r.slug || r.id;
              return `
              <a href="restaurace-detail.html?id=${identifier}" class="block p-3 hover:bg-white/10 transition border-b border-white/10 last:border-b-0">
                <div class="flex gap-3">
                  <div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('${r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}')"></div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-sm text-white hover:text-gurmaogold transition truncate">${r.name}</h3>
                    <p class="text-xs text-white/60">${r.city}</p>
                    ${r.vibe ? `<span class="text-xs text-gurmaogold">${r.vibe}</span>` : ''}
                  </div>
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
