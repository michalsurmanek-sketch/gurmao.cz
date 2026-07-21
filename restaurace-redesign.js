// Vizuální a ovládací vrstva katalogu restaurací.
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

      const originalRow = inner.firstElementChild;
      if (originalRow) {
        originalRow.classList.add('restaurants-search-row');
        const searchInput = originalRow.querySelector('#searchInput');
        const locationBtn = originalRow.querySelector('#locationBtn');

        if (searchInput) {
          searchInput.placeholder = 'Název restaurace nebo jídlo...';
          const searchWrap = document.createElement('div');
          searchWrap.className = 'restaurants-search-wrap';
          searchInput.parentNode.insertBefore(searchWrap, searchInput);
          searchWrap.appendChild(searchInput);

          const cuisineSelect = document.createElement('select');
          cuisineSelect.id = 'cuisineFilter';
          cuisineSelect.className = 'restaurants-main-select';
          cuisineSelect.setAttribute('aria-label', 'Všechny kuchyně');
          cuisineSelect.innerHTML = `
            <option value="">Všechny kuchyně</option>
            <option value="česká">Česká</option>
            <option value="italská">Italská</option>
            <option value="asijská">Asijská</option>
            <option value="mexická">Mexická</option>
            <option value="indická">Indická</option>
            <option value="americká">Americká</option>
            <option value="středomořská">Středomořská</option>
            <option value="vegetariánská">Vegetariánská</option>
            <option value="vegan">Vegan</option>
          `;

          const localitySelect = document.createElement('select');
          localitySelect.id = 'localityFilter';
          localitySelect.className = 'restaurants-main-select';
          localitySelect.setAttribute('aria-label', 'Všechny lokality');
          localitySelect.innerHTML = `
            <option value="">Všechny lokality</option>
            <option value="Praha">Praha</option>
            <option value="Brno">Brno</option>
            <option value="Ostrava">Ostrava</option>
            <option value="Plzeň">Plzeň</option>
            <option value="Olomouc">Olomouc</option>
            <option value="Zlín">Zlín</option>
            <option value="Uherské Hradiště">Uherské Hradiště</option>
            <option value="České Budějovice">České Budějovice</option>
            <option value="Hradec Králové">Hradec Králové</option>
            <option value="Pardubice">Pardubice</option>
            <option value="Liberec">Liberec</option>
          `;

          const moreFiltersBtn = document.createElement('button');
          moreFiltersBtn.type = 'button';
          moreFiltersBtn.id = 'moreFiltersBtn';
          moreFiltersBtn.className = 'restaurants-more-filters';
          moreFiltersBtn.innerHTML = '<span>Další filtry</span><span aria-hidden="true">＋</span>';

          const searchBtn = document.createElement('button');
          searchBtn.type = 'button';
          searchBtn.id = 'restaurantsSearchBtn';
          searchBtn.className = 'restaurants-search-btn';
          searchBtn.textContent = 'Hledat';

          originalRow.insertBefore(cuisineSelect, locationBtn || null);
          originalRow.insertBefore(localitySelect, locationBtn || null);
          originalRow.insertBefore(moreFiltersBtn, locationBtn || null);
          originalRow.insertBefore(searchBtn, locationBtn || null);

          const vibeFilters = inner.querySelector('#filters');
          if (vibeFilters) {
            vibeFilters.classList.add('restaurants-extra-filters');
            vibeFilters.hidden = true;
          }

          const runSearch = () => {
            const terms = [searchInput.value.trim(), cuisineSelect.value, localitySelect.value].filter(Boolean);
            searchInput.value = terms.join(' ');
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          };

          searchBtn.addEventListener('click', runSearch);
          searchInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              runSearch();
            }
          });
          cuisineSelect.addEventListener('change', runSearch);
          localitySelect.addEventListener('change', runSearch);

          moreFiltersBtn.addEventListener('click', () => {
            if (!vibeFilters) return;
            const isHidden = vibeFilters.hidden;
            vibeFilters.hidden = !isHidden;
            moreFiltersBtn.classList.toggle('is-open', isHidden);
            moreFiltersBtn.querySelector('span:last-child').textContent = isHidden ? '−' : '＋';
          });
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
