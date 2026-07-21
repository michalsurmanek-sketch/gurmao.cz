function injectClearFiltersStyles() {
  if (document.getElementById('restaurants-clear-filters-styles')) return;
  const style = document.createElement('style');
  style.id = 'restaurants-clear-filters-styles';
  style.textContent = `
    body[data-page="restaurants-redesign"] .restaurants-location-actions{display:flex;flex-direction:column;gap:7px;min-width:0}
    body[data-page="restaurants-redesign"] .restaurants-location-actions #locationBtn{width:100%}
    body[data-page="restaurants-redesign"] .restaurants-clear-filters{min-height:34px;width:100%;padding:6px 10px;border:1px solid rgba(255,255,255,.14);border-radius:11px;background:transparent;color:rgba(255,255,255,.68);font-size:12px;line-height:1;cursor:pointer;transition:.2s}
    body[data-page="restaurants-redesign"] .restaurants-clear-filters:hover,body[data-page="restaurants-redesign"] .restaurants-clear-filters:focus-visible{border-color:#d4af37;color:#e8c43a;background:rgba(212,175,55,.08);outline:none}
    body[data-page="restaurants-redesign"] .restaurants-per-page{display:flex;align-items:center;gap:6px;flex-wrap:nowrap}
    body[data-page="restaurants-redesign"] .restaurants-view-switch{display:inline-flex;align-items:center;gap:3px;margin-left:7px;padding-left:8px;border-left:1px solid rgba(255,255,255,.15)}
    body[data-page="restaurants-redesign"] .restaurants-view-btn{width:32px;height:32px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.13);border-radius:9px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.55);cursor:pointer;transition:.2s}
    body[data-page="restaurants-redesign"] .restaurants-view-btn:hover,body[data-page="restaurants-redesign"] .restaurants-view-btn:focus-visible{border-color:#d4af37;color:#d4af37;outline:none}
    body[data-page="restaurants-redesign"] .restaurants-view-btn.is-active{border-color:#d4af37;background:rgba(212,175,55,.15);color:#e8c43a;box-shadow:0 0 18px rgba(212,175,55,.12)}
    body[data-page="restaurants-redesign"] #restaurantsList.restaurants-row-view{display:flex!important;flex-direction:column;gap:12px}
    body[data-page="restaurants-redesign"] .restaurant-row{display:grid;grid-template-columns:92px minmax(0,1fr) auto;align-items:center;gap:18px;padding:12px 14px;border:1px solid rgba(255,255,255,.11);border-radius:18px;background:rgba(255,255,255,.045);transition:border-color .2s,background .2s,transform .2s}
    body[data-page="restaurants-redesign"] .restaurant-row:hover{border-color:rgba(212,175,55,.42);background:rgba(212,175,55,.055);transform:translateY(-1px)}
    body[data-page="restaurants-redesign"] .restaurant-row-image{width:92px;height:72px;border-radius:13px;overflow:hidden;display:block}
    body[data-page="restaurants-redesign"] .restaurant-row-image img{width:100%;height:100%;object-fit:cover}
    body[data-page="restaurants-redesign"] .restaurant-row-main{min-width:0}
    body[data-page="restaurants-redesign"] .restaurant-row-vibe{font-size:11px;color:#d4af37;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    body[data-page="restaurants-redesign"] .restaurant-row h3{font-size:20px;line-height:1.15;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    body[data-page="restaurants-redesign"] .restaurant-row p{margin:5px 0 0;color:rgba(255,255,255,.58);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    body[data-page="restaurants-redesign"] .restaurant-row-actions{display:flex;align-items:center;gap:8px}
    body[data-page="restaurants-redesign"] .restaurant-row-actions .save-btn{width:40px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.04)}
    body[data-page="restaurants-redesign"] .restaurant-row-detail{padding:10px 18px;border-radius:999px;background:#d4af37;color:#080808;font-weight:700;font-size:13px;white-space:nowrap}
    @media(max-width:1180px){body[data-page="restaurants-redesign"] .restaurants-location-actions{grid-column:1/-1;width:100%}}
    @media(max-width:680px){
      body[data-page="restaurants-redesign"] .restaurants-view-switch{margin-left:4px;padding-left:5px}
      body[data-page="restaurants-redesign"] .restaurants-view-btn{width:30px;height:30px}
      body[data-page="restaurants-redesign"] .restaurant-row{grid-template-columns:68px minmax(0,1fr) auto;gap:11px;padding:9px}
      body[data-page="restaurants-redesign"] .restaurant-row-image{width:68px;height:60px}
      body[data-page="restaurants-redesign"] .restaurant-row h3{font-size:16px}
      body[data-page="restaurants-redesign"] .restaurant-row p{font-size:11px}
      body[data-page="restaurants-redesign"] .restaurant-row-vibe{font-size:9px}
      body[data-page="restaurants-redesign"] .restaurant-row-actions .save-btn{display:none}
      body[data-page="restaurants-redesign"] .restaurant-row-detail{padding:8px 11px;font-size:11px}
    }
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
    if (title) title.innerHTML = 'Všechny <span style="color:#D4AF37">restaurace</span>';
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
    const viewSwitch = document.createElement('div');
    viewSwitch.className = 'restaurants-view-switch';
    viewSwitch.setAttribute('role', 'group');
    viewSwitch.setAttribute('aria-label', 'Způsob zobrazení restaurací');
    viewSwitch.innerHTML = `
      <button type="button" class="restaurants-view-btn" data-restaurant-view="cards" aria-label="Zobrazit jako karty" title="Karty" aria-pressed="false">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
      </button>
      <button type="button" class="restaurants-view-btn" data-restaurant-view="rows" aria-label="Zobrazit jako řádky" title="Řádky" aria-pressed="false">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="14" height="2" rx="1"/><rect x="1" y="12" width="14" height="2" rx="1"/></svg>
      </button>`;
    perPageContainer.appendChild(viewSwitch);
    viewSwitch.querySelectorAll('[data-restaurant-view]').forEach(button => button.addEventListener('click', () => waitForSearchApi(api => api.setView(button.dataset.restaurantView))));

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
    document.querySelectorAll('[data-restaurant-view]').forEach(button => {
      const active = button.dataset.restaurantView === state.view;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  });

  if (listSection) listSection.classList.add('restaurants-list-section');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyRestaurantRedesign, { once: true });
else applyRestaurantRedesign();