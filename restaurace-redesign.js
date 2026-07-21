// Vizuální vrstva katalogu restaurací – bez zásahu do datové logiky.
function applyRestaurantRedesign() {
  if (!/\/restaurace\.html$/.test(window.location.pathname) && window.location.pathname !== '/restaurace.html') return;

  document.body.dataset.page = 'restaurants-redesign';

  const sections = [...document.querySelectorAll('body > section')];
  const hero = sections[0];
  const filtersSection = sections[1];
  const listSection = sections[2];

  if (hero) {
    hero.classList.add('restaurants-hero');
    const title = hero.querySelector('h1');
    const subtitle = hero.querySelector('p');
    if (title) title.textContent = 'Všechny restaurace';
    if (subtitle) subtitle.textContent = 'Objevte restaurace, které odpovídají tomu, co právě hledáte.';
  }

  if (filtersSection) {
    filtersSection.classList.add('restaurants-filters-section');
    const inner = filtersSection.firstElementChild;
    if (inner && !inner.classList.contains('restaurants-filter-panel')) {
      inner.classList.add('restaurants-filter-panel');

      const searchRow = inner.firstElementChild;
      if (searchRow) {
        searchRow.classList.add('restaurants-search-row');
        const searchInput = searchRow.querySelector('#searchInput');
        if (searchInput && !searchInput.parentElement.classList.contains('restaurants-search-wrap')) {
          const wrap = document.createElement('div');
          wrap.className = 'restaurants-search-wrap';
          searchInput.parentNode.insertBefore(wrap, searchInput);
          wrap.appendChild(searchInput);
        }
      }

      const resultCount = inner.querySelector('#resultCount');
      const perPageLabel = [...inner.querySelectorAll('span')].find(el => el.textContent.trim() === 'Zobrazit:');
      const perPageContainer = perPageLabel?.parentElement;
      if (resultCount && perPageContainer) {
        perPageContainer.classList.add('restaurants-per-page');
        const toolbar = document.createElement('div');
        toolbar.className = 'restaurants-toolbar';
        perPageContainer.parentNode.insertBefore(toolbar, perPageContainer);
        toolbar.appendChild(resultCount);
        toolbar.appendChild(perPageContainer);
      }
    }
  }

  if (listSection) listSection.classList.add('restaurants-list-section');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyRestaurantRedesign, { once: true });
} else {
  applyRestaurantRedesign();
}
