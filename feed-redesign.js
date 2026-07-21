function applyFeedRedesign() {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (!path.endsWith('/feed.html')) return;

  document.body.classList.add('feed-directory-redesign');

  const desktopMain = document.querySelector('main.hidden.md\\:block');
  const shell = desktopMain?.firstElementChild;
  if (!shell || shell.dataset.feedRedesignReady === 'true') return;
  shell.dataset.feedRedesignReady = 'true';

  const headingRow = shell.firstElementChild;
  const filterRow = shell.querySelector('#searchInput')?.closest('.mt-8');
  const resultCount = document.getElementById('resultsCount');
  const grid = document.getElementById('grid');
  let totalRestaurants = null;
  let countUpdatePending = false;

  if (headingRow) {
    headingRow.classList.add('feed-hero');
    const heading = headingRow.querySelector('h1');
    const subtitle = headingRow.querySelector('p');
    const actions = headingRow.children[1];
    if (heading) heading.innerHTML = 'Inspirace pro váš <span class="text-gurmaogold">další zážitek</span>';
    if (subtitle) subtitle.textContent = 'Objevujte restaurace podle nálady, města a kuchyně. Každý tip je začátkem nového gastronomického zážitku.';
    if (actions) actions.classList.add('feed-hero-actions');
  }

  if (filterRow && !filterRow.closest('.feed-filter-panel')) {
    const panel = document.createElement('section');
    panel.className = 'feed-filter-panel';
    filterRow.parentNode.insertBefore(panel, filterRow);
    panel.appendChild(filterRow);
    filterRow.classList.add('feed-filter-row');

    const toolbar = document.createElement('div');
    toolbar.className = 'feed-toolbar';
    toolbar.innerHTML = '<div class="feed-toolbar-note">Aktuální výběr restaurací z celé České republiky</div>';
    panel.appendChild(toolbar);
    if (resultCount) toolbar.insertBefore(resultCount, toolbar.firstChild);
  }

  const visibleCardCount = () => grid?.querySelectorAll('[data-restaurant-card]').length || 0;

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

  if (grid) {
    new MutationObserver(updateCount).observe(grid, { childList: true, subtree: false });
  }

  import('./supabase-client.js')
    .then(({ supabase }) => supabase.from('restaurants').select('*', { count: 'exact', head: true }))
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