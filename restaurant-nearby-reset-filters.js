// Při použití „Blízko mě“ zruší ostatní filtry, aby hledání podle vzdálenosti nebylo omezené.
(function initNearbyFilterReset(){
  const clearFilters = () => {
    const searchInput = document.getElementById('searchInput');
    const cuisineFilter = document.getElementById('cuisineFilter');
    const localityFilter = document.getElementById('localityFilter');
    const allVibeButton = document.querySelector('#filters [data-vibe="all"]');
    const filters = document.getElementById('filters');

    if (searchInput) {
      searchInput.value = '';
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }
    if (cuisineFilter) {
      cuisineFilter.value = '';
      cuisineFilter.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (localityFilter) {
      localityFilter.value = '';
      localityFilter.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (allVibeButton && !allVibeButton.classList.contains('is-active')) allVibeButton.click();
    filters?.classList.remove('open');
  };

  document.addEventListener('click', event => {
    if (!event.target.closest('#locationBtn')) return;
    clearFilters();
  }, true);
})();
