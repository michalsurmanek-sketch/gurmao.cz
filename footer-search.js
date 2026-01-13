// Footer Search Component
let supabase;

// Load Supabase asynchronously
(async function() {
  try {
    const supabaseModule = await import('./supabase-client.js');
    supabase = supabaseModule.supabase;
  } catch (error) {
    console.error('Failed to load Supabase:', error);
  }
})();

function initFooterSearch() {
  const footerSearchBox = document.getElementById('footerSearchBox');
  const footerSearchToggle = document.getElementById('footerSearchToggle');
  const footerSearchInput = document.getElementById('footerSearchInput');
  const footerSearchResults = document.getElementById('footerSearchResults');
  
  if (!footerSearchBox || !footerSearchToggle || !footerSearchInput || !footerSearchResults) return;
  
  let isExpanded = false;
  
  footerSearchToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isExpanded) {
      footerSearchBox.classList.remove('w-9');
      footerSearchBox.classList.add('w-80');
      footerSearchInput.classList.remove('opacity-0', 'w-0');
      footerSearchInput.classList.add('opacity-100', 'w-full', 'pr-3');
      
      setTimeout(() => footerSearchInput.focus(), 300);
      isExpanded = true;
    }
  });
  
  document.addEventListener('click', (e) => {
    if (isExpanded && !footerSearchBox.contains(e.target) && !footerSearchResults.contains(e.target)) {
      footerSearchBox.classList.add('w-9');
      footerSearchBox.classList.remove('w-80');
      footerSearchInput.classList.add('opacity-0', 'w-0');
      footerSearchInput.classList.remove('opacity-100', 'w-full', 'pr-3');
      footerSearchInput.value = '';
      footerSearchResults.classList.add('hidden');
      footerSearchResults.innerHTML = '';
      isExpanded = false;
    }
  });
  
  let searchTimeout;
  footerSearchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim().toLowerCase();
    clearTimeout(searchTimeout);
    
    if (!query) {
      footerSearchResults.classList.add('hidden');
      footerSearchResults.innerHTML = '';
      return;
    }
    
    searchTimeout = setTimeout(async () => {
      try {
        const { data: restaurants, error } = await supabase
          .from('restaurants')
          .select('id, slug, name, city, vibe, tag, image_url')
          .or(`name.ilike.%${query}%,city.ilike.%${query}%,tag.ilike.%${query}%,vibe.ilike.%${query}%`)
          .limit(20);
        
        if (error) throw error;
        const results = restaurants || [];
        
        if (results.length > 0) {
          footerSearchResults.classList.remove('hidden');
          footerSearchResults.innerHTML = results.map(r => {
            const identifier = r.slug || r.id;
            return `
            <a href="restaurace-detail.html?id=${identifier}" class="block p-3 hover:bg-white/10 transition border-b border-white/10 last:border-b-0">
              <div class="flex gap-3 items-center">
                <div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('${r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}')"></div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">${r.name}</div>
                  <div class="text-xs text-white/60 truncate">${r.city} • ${r.tag || r.vibe}</div>
                </div>
              </div>
            </a>
            `;
          }).join('');
        } else {
          footerSearchResults.classList.remove('hidden');
          footerSearchResults.innerHTML = '<div class="p-4 text-sm text-white/60 text-center">Žádné výsledky</div>';
        }
      } catch (error) {
        console.error('Footer search error:', error);
      }
    }, 300);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFooterSearch);
} else {
  initFooterSearch();
}
