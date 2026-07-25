function applyFeedRedesign() {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (!path.endsWith('/feed.html')) return;

  document.body.classList.add('feed-directory-redesign');

  const desktopMain = document.querySelector('main.hidden.md\\:block');
  const shell = desktopMain?.firstElementChild;
  if (!shell || shell.dataset.feedRedesignReady === 'true') return;
  shell.dataset.feedRedesignReady = 'true';
  shell.classList.add('feed-shell');

  const headingRow = shell.firstElementChild;
  const filterRow = shell.querySelector('#searchInput')?.closest('.mt-8');
  const resultCount = document.getElementById('resultsCount');
  const grid = document.getElementById('grid');
  const searchInput = document.getElementById('searchInput');
  let totalRestaurants = null;
  let countUpdatePending = false;

  if (headingRow) {
    headingRow.classList.add('feed-hero');
    const heading = headingRow.querySelector('h1');
    const subtitle = headingRow.querySelector('p');
    const actions = headingRow.children[1];

    if (!headingRow.querySelector('.feed-kicker')) {
      headingRow.firstElementChild?.insertAdjacentHTML('afterbegin', '<div class="feed-kicker">✦ GURMAO FEED</div>');
    }
    if (heading) heading.innerHTML = 'Restaurace pro<br><span class="text-gurmaogold">dnešní náladu</span>';
    if (subtitle) subtitle.textContent = 'Procházejte aktuální podniky z celé ČR a filtrujte je podle města nebo atmosféry, kterou chcete zažít.';
    if (actions) actions.classList.add('feed-hero-actions');
  }

  let categoryStrip = shell.querySelector('.feed-category-strip');
  if (!categoryStrip && headingRow) {
    categoryStrip = document.createElement('div');
    categoryStrip.className = 'feed-category-strip';
    categoryStrip.setAttribute('aria-label', 'Kategorie feedu');
    categoryStrip.innerHTML = `
      <button type="button" class="feed-category-chip is-active" data-feed-vibe="">✨ Vše</button>
      <button type="button" class="feed-category-chip" data-feed-vibe="LUXE">🍷 LUXE</button>
      <button type="button" class="feed-category-chip" data-feed-vibe="DRAMA">🔥 DRAMA</button>
      <button type="button" class="feed-category-chip" data-feed-vibe="CHAOS">🌮 CHAOS</button>
      <button type="button" class="feed-category-chip" data-feed-vibe="PURE">🌿 PURE</button>
      <button type="button" class="feed-category-chip" data-feed-vibe="DARK">🌙 DARK</button>
      <button type="button" class="feed-category-chip" data-feed-vibe="CALM">🌊 CALM</button>`;
    headingRow.insertAdjacentElement('afterend', categoryStrip);
  }

  if (filterRow && !filterRow.closest('.feed-filter-panel')) {
    const panel = document.createElement('section');
    panel.className = 'feed-filter-panel';
    filterRow.parentNode.insertBefore(panel, filterRow);
    panel.appendChild(filterRow);
    filterRow.classList.add('feed-filter-row');

    const toolbar = document.createElement('div');
    toolbar.className = 'feed-toolbar';
    toolbar.innerHTML = '<div class="feed-toolbar-note">Aktuální gastronomický výběr z celé České republiky</div>';
    panel.appendChild(toolbar);
    if (resultCount) toolbar.insertBefore(resultCount, toolbar.firstChild);
  }

  categoryStrip?.querySelectorAll('[data-feed-vibe]').forEach(chip => {
    chip.addEventListener('click', () => {
      const vibe = chip.dataset.feedVibe || '';
      const option = document.querySelector(`#vibeOptions .custom-option[data-value="${vibe}"]`);
      if (option) option.click();
      categoryStrip.querySelectorAll('.feed-category-chip').forEach(item => item.classList.remove('is-active'));
      chip.classList.add('is-active');
      document.querySelector('.feed-filter-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  const visibleCardCount = () => grid?.querySelectorAll('[data-restaurant-card]').length || grid?.children.length || 0;

  const updateCount = () => {
    if (!resultCount || countUpdatePending) return;
    countUpdatePending = true;
    requestAnimationFrame(() => {
      const visible = visibleCardCount();
      if (totalRestaurants !== null) {
        resultCount.textContent = `✦ Zobrazeno ${visible.toLocaleString('cs-CZ')} z ${totalRestaurants.toLocaleString('cs-CZ')} restaurací`;
      } else {
        resultCount.textContent = `✦ Zobrazeno ${visible.toLocaleString('cs-CZ')} restaurací`;
      }
      countUpdatePending = false;
    });
  };

  if (grid) new MutationObserver(updateCount).observe(grid, { childList: true, subtree: false });

  import('./supabase-client.js')
    .then(({ supabase }) => supabase.from('restaurants').select('id', { count: 'exact', head: true }))
    .then(({ count, error }) => {
      if (error) throw error;
      totalRestaurants = Number.isFinite(count) ? count : null;
      updateCount();
    })
    .catch(error => {
      console.warn('Feed total count failed:', error);
      updateCount();
    });

  setTimeout(updateCount, 0);
  setTimeout(updateCount, 600);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyFeedRedesign, { once: true });
} else {
  applyFeedRedesign();
}
