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

  const updateCount = () => {
    if (!resultCount) return;
    const text = resultCount.textContent.trim();
    if (text && !text.startsWith('✦')) resultCount.textContent = `✦ ${text}`;
  };

  if (resultCount) {
    new MutationObserver(updateCount).observe(resultCount, { childList: true, characterData: true, subtree: true });
  }
  updateCount();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyFeedRedesign, { once: true });
} else {
  applyFeedRedesign();
}