function injectClearFiltersStyles() {
  if (document.getElementById('restaurants-clear-filters-styles')) return;
  const style = document.createElement('style');
  style.id = 'restaurants-clear-filters-styles';
  style.textContent = `
    body[data-page="restaurants-redesign"] .restaurants-location-actions{display:flex;flex-direction:column;gap:7px;min-width:0}
    body[data-page="restaurants-redesign"] .restaurants-location-actions #locationBtn{width:100%}
    body[data-page="restaurants-redesign"] .restaurants-clear-filters{min-height:34px;width:100%;padding:6px 10px;border:1px solid rgba(255,255,255,.14);border-radius:11px;background:transparent;color:rgba(255,255,255,.68);font-size:12px;line-height:1;cursor:pointer;transition:.2s}
    body[data-page="restaurants-redesign"] .restaurants-clear-filters:hover,body[data-page="restaurants-redesign"] .restaurants-clear-filters:focus-visible{border-color:#d4af37;color:#e8c43a;background:rgba(212,175,55,.08);outline:none}
    @media(max-width:1180px){body[data-page="restaurants-redesign"] .restaurants-location-actions{grid-column:1/-1;width:100%}}
  `;
  document.head.appendChild(style);
}

function waitForSearchApi(callback, attempts = 0) {
  if (window.GurmaoRestaurantSearch) { callback(window.GurmaoRestaurantSearch); return; }
  if (attempts > 40) return;
  setTimeout(() => waitForSearchApi(callback, attempts + 1), 50);
}

function applyRestaurantRedesign() {
  if (window.location.pathname !== '/restaurace.html' && !/\/restaurace\.html$/.test(window.location.pathname)) return;
  document.body.dataset.page = 'restaurants-redesign';
  injectClearFiltersStyles();

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

  if (!filtersSection) return;
  filtersSection.classList.add('restaurants-filters-section');
  const inner = filtersSection.firstElementChild;
  if (!inner || inner.dataset.redesignReady === '1') return;
  inner.dataset.redesignReady = '1';
  inner.classList.add('restaurants-filter-panel');

  const originalRow = inner.firstElementChild;
  if (!originalRow) return;
  originalRow.classList.add('restaurants-search-row');

  const searchInput = originalRow.querySelector('#searchInput');
  const locationBtn = originalRow.querySelector('#locationBtn');
  if (!searchInput) return;
  searchInput.placeholder = 'Název restaurace nebo jídlo...';

  if (!searchInput.closest('.restaurants-search-wrap')) {
    const searchWrap = document.createElement('div');
    searchWrap.className = 'restaurants-search-wrap';
    searchInput.parentNode.insertBefore(searchWrap, searchInput);
    searchWrap.appendChild(searchInput);
  }

  const cuisineSelect = document.createElement('select');
  cuisineSelect.id = 'cuisineFilter';
  cuisineSelect.className = 'restaurants-main-select';
  cuisineSelect.setAttribute('aria-label', 'Všechny kuchyně');
  cuisineSelect.innerHTML = `
    <option value="">Všechny kuchyně</option>
    <option value="česká">Česká</option><option value="italská">Italská</option>
    <option value="asijská">Asijská</option><option value="mexická">Mexická</option>
    <option value="indická">Indická</option><option value="americká">Americká</option>
    <option value="středomořská">Středomořská</option><option value="vegetariánská">Vegetariánská</option>
    <option value="vegan">Vegan</option>`;

  const localitySelect = document.createElement('select');
  localitySelect.id = 'localityFilter';
  localitySelect.className = 'restaurants-main-select';
  localitySelect.setAttribute('aria-label', 'Všechny lokality');
  localitySelect.innerHTML = `
    <option value="">Všechny lokality</option>
    <option value="Praha">Praha</option><option value="Brno">Brno</option><option value="Ostrava">Ostrava</option>
    <option value="Plzeň">Plzeň</option><option value="Olomouc">Olomouc</option><option value="Zlín">Zlín</option>
    <option value="Uherské Hradiště">Uherské Hradiště</option><option value="České Budějovice">České Budějovice</option>
    <option value="Hradec Králové">Hradec Králové</option><option value="Pardubice">Pardubice</option><option value="Liberec">Liberec</option>`;

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

  if (locationBtn) {
    const locationActions = document.createElement('div');
    locationActions.className = 'restaurants-location-actions';
    locationBtn.parentNode.insertBefore(locationActions, locationBtn);
    locationActions.appendChild(locationBtn);
    const clear = document.createElement('button');
    clear.type = 'button'; clear.id = 'clearRestaurantFilters'; clear.className = 'restaurants-clear-filters'; clear.textContent = 'Vymazat filtry';
    locationActions.appendChild(clear);
    clear.addEventListener('click', () => waitForSearchApi(api => api.clear()));
  }

  const vibeFilters = inner.querySelector('#filters');
  if (vibeFilters) { vibeFilters.classList.add('restaurants-extra-filters'); vibeFilters.hidden = true; }
  moreFiltersBtn.addEventListener('click', () => {
    if (!vibeFilters) return;
    vibeFilters.hidden = !vibeFilters.hidden;
    const open = !vibeFilters.hidden;
    moreFiltersBtn.classList.toggle('is-open', open);
    moreFiltersBtn.querySelector('span:last-child').textContent = open ? '−' : '＋';
  });

  const run = () => waitForSearchApi(api => api.setFilters({ search: searchInput.value, cuisine: cuisineSelect.value, city: localitySelect.value }));
  searchBtn.addEventListener('click', run);
  searchInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); run(); } });
  cuisineSelect.addEventListener('change', run);
  localitySelect.addEventListener('change', run);

  const resultCount = inner.querySelector('#resultCount');
  const perPageLabel = [...inner.querySelectorAll('span')].find(el => el.textContent.trim() === 'Zobrazit:');
  const perPageContainer = perPageLabel?.parentElement;
  if (resultCount && perPageContainer) {
    perPageContainer.classList.add('restaurants-per-page');
    resultCount.classList.add('restaurants-result-count-outside');
    const toolbar = document.createElement('div'); toolbar.className = 'restaurants-toolbar restaurants-toolbar-outside'; inner.insertAdjacentElement('afterend', toolbar);
    const left = document.createElement('div'); left.className = 'restaurants-toolbar-left'; left.appendChild(resultCount);
    const sortWrap = document.createElement('label'); sortWrap.className = 'restaurants-sort-wrap';
    sortWrap.innerHTML = `<span>Seřadit podle:</span><select id="restaurantSort" aria-label="Seřadit restaurace"><option value="recommended">Doporučené</option><option value="rating-desc">Nejlépe hodnocené</option><option value="name-asc">Název A–Z</option><option value="name-desc">Název Z–A</option></select>`;
    left.appendChild(sortWrap); toolbar.appendChild(left); toolbar.appendChild(perPageContainer);
    sortWrap.querySelector('select').addEventListener('change', e => waitForSearchApi(api => api.setFilters({ sort: e.target.value })));
  }

  waitForSearchApi(api => {
    const state = api.getState();
    searchInput.value = state.search || '';
    cuisineSelect.value = state.cuisine || '';
    localitySelect.value = state.city || '';
    const sort = document.getElementById('restaurantSort'); if (sort) sort.value = state.sort || 'recommended';
  });

  if (listSection) listSection.classList.add('restaurants-list-section');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyRestaurantRedesign, { once: true });
else applyRestaurantRedesign();
