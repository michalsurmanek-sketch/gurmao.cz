(() => {
  if (!/\/kuchar\.html$/.test(window.location.pathname)) return;

  document.body.classList.add('chef-directory-redesign');

  const hero = document.getElementById('heroSection');
  if (hero) {
    hero.innerHTML = `
      <div class="max-w-6xl mx-auto px-6">
        <h1>Objevte ty nejlepší <span class="chef-gold">kuchaře</span></h1>
        <p>Najděte šéfkuchaře a talentované kuchaře, kteří tvoří nezapomenutelné kulinářské zážitky.</p>
        <div class="chef-benefits" aria-label="Výhody katalogu kuchařů">
          <div class="chef-benefit"><div class="chef-benefit-icon">☆</div><div><strong>Ověřené profily</strong><span>Kvalita a zkušenosti</span></div></div>
          <div class="chef-benefit"><div class="chef-benefit-icon">♡</div><div><strong>Skutečné osobnosti</strong><span>Poznejte jejich tvorbu</span></div></div>
          <div class="chef-benefit"><div class="chef-benefit-icon">♛</div><div><strong>To nejlepší z gastronomie</strong><span>Pečlivě vybraní kuchaři</span></div></div>
        </div>
      </div>`;
  }

  const listSection = document.getElementById('listSection');
  if (!listSection || document.querySelector('.chef-controls-shell')) return;

  const controls = document.createElement('div');
  controls.className = 'chef-controls-shell';
  controls.innerHTML = `
    <div class="chef-controls">
      <div class="chef-search-row">
        <label class="chef-search-wrap" for="chefDirectorySearch">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
          <input id="chefDirectorySearch" type="search" autocomplete="off" placeholder="Hledat kuchaře, specializaci, restauraci…">
        </label>
        <button id="chefClearFilters" type="button">Vymazat filtry</button>
      </div>
      <div class="chef-quick-filters" aria-label="Rychlé filtry">
        <button class="chef-filter-chip is-active" type="button" data-chef-filter="">Všichni kuchaři</button>
        <button class="chef-filter-chip" type="button" data-chef-filter="česk">Česká</button>
        <button class="chef-filter-chip" type="button" data-chef-filter="ital">Italská</button>
        <button class="chef-filter-chip" type="button" data-chef-filter="asij">Asijská</button>
        <button class="chef-filter-chip" type="button" data-chef-filter="franc">Francouzská</button>
        <button class="chef-filter-chip" type="button" data-chef-filter="fine dining">Fine Dining</button>
        <button class="chef-filter-chip" type="button" data-chef-filter="veget">Vegetariánská</button>
        <button class="chef-filter-chip" type="button" data-chef-filter="pečení">Pečení & dezerty</button>
        <button class="chef-filter-chip" type="button" data-chef-filter="gril">Gril & BBQ</button>
      </div>
    </div>`;
  listSection.parentNode.insertBefore(controls, listSection);

  const toolbar = document.createElement('div');
  toolbar.className = 'chef-directory-toolbar';
  toolbar.innerHTML = `<div id="chefDirectoryCount">Načítání kuchařů…</div><div class="chef-directory-note">Vyberte kuchaře podle stylu, specializace nebo restaurace</div>`;
  listSection.parentNode.insertBefore(toolbar, listSection);

  const input = document.getElementById('chefDirectorySearch');
  const clearButton = document.getElementById('chefClearFilters');
  const chips = [...document.querySelectorAll('[data-chef-filter]')];
  const grid = document.getElementById('chefsGrid');
  let activeFilter = '';

  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function cards() {
    return [...grid.querySelectorAll('.chef-card')];
  }

  function applyFilter() {
    const query = normalize(input.value);
    const filter = normalize(activeFilter);
    let visible = 0;

    cards().forEach(card => {
      const haystack = normalize(card.textContent);
      const show = (!query || haystack.includes(query)) && (!filter || haystack.includes(filter));
      card.hidden = !show;
      if (show) visible += 1;
    });

    const count = document.getElementById('chefDirectoryCount');
    if (count) count.textContent = `♙  ${visible.toLocaleString('cs-CZ')} ${visible === 1 ? 'kuchař' : visible >= 2 && visible <= 4 ? 'kuchaři' : 'kuchařů'}`;

    let empty = grid.querySelector('.chef-empty-state');
    if (!visible && cards().length) {
      if (!empty) {
        empty = document.createElement('div');
        empty.className = 'chef-empty-state';
        empty.textContent = 'Žádný kuchař neodpovídá zvolenému hledání.';
        grid.appendChild(empty);
      }
      empty.hidden = false;
    } else if (empty) {
      empty.hidden = true;
    }
  }

  input.addEventListener('input', applyFilter);
  clearButton.addEventListener('click', () => {
    input.value = '';
    activeFilter = '';
    chips.forEach((chip, index) => chip.classList.toggle('is-active', index === 0));
    applyFilter();
    input.focus();
  });

  chips.forEach(chip => chip.addEventListener('click', () => {
    activeFilter = chip.dataset.chefFilter || '';
    chips.forEach(item => item.classList.toggle('is-active', item === chip));
    applyFilter();
  }));

  const observer = new MutationObserver(() => {
    cards().forEach(card => {
      card.setAttribute('data-chef-search', normalize(card.textContent));
    });
    applyFilter();
  });
  observer.observe(grid, { childList:true });
  applyFilter();
})();
