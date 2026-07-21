(async function initAuthUI() {
  const userMenuDesktop = document.getElementById('userMenuDesktop');
  const userMenuMobile = document.getElementById('userMenuMobile');
  const loginLinkDesktop = document.getElementById('loginLinkDesktop');
  const loginLinkMobile = document.getElementById('loginLinkMobile');

  const setLoggedOutUI = () => {
    loginLinkDesktop?.classList.remove('hidden');
    loginLinkMobile?.classList.remove('hidden');
    userMenuDesktop?.classList.add('hidden');
    userMenuMobile?.classList.add('hidden');
    document.querySelectorAll('[data-admin-only]').forEach(link => link.classList.add('hidden'));
  };

  try {
    const { supabase } = await import('./supabase-client.js');
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      localStorage.removeItem('gurmao_user');
      setLoggedOutUI();
      return;
    }

    userMenuDesktop?.classList.remove('hidden');
    userMenuMobile?.classList.remove('hidden');
    loginLinkDesktop?.classList.add('hidden');
    loginLinkMobile?.classList.add('hidden');

    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Uživatel';
    const userNameDesktop = document.getElementById('userNameDesktop');
    const userNameMobile = document.getElementById('userNameMobile');
    if (userNameDesktop) userNameDesktop.textContent = userName;
    if (userNameMobile) userNameMobile.textContent = `Přihlášen: ${userName}`;

    if (user.app_metadata?.role === 'admin') {
      document.querySelectorAll('[data-admin-only]').forEach(link => link.classList.remove('hidden'));
    }

    const userDropdownBtn = document.getElementById('userDropdownBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    if (userDropdownBtn && userDropdownMenu) {
      userDropdownBtn.addEventListener('click', event => {
        event.stopPropagation();
        userDropdownMenu.classList.toggle('hidden');
      });
      document.addEventListener('click', () => userDropdownMenu.classList.add('hidden'));
      userDropdownMenu.addEventListener('click', event => event.stopPropagation());
    }

    document.querySelectorAll('[data-logout-btn]').forEach(button => {
      button.addEventListener('click', async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('gurmao_user');
        window.location.href = 'index.html';
      });
    });
  } catch (error) {
    console.error('Authentication UI failed:', error);
    setLoggedOutUI();
  }
})();

(function loadPageSpecificEnhancements() {
  const path = window.location.pathname.replace(/\/+$/, '');

  const loadEnhancement = (css, js, version) => {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = `${css}?v=${version}`;
    document.head.appendChild(stylesheet);

    const script = document.createElement('script');
    script.src = `${js}?v=${version}`;
    document.body.appendChild(script);
  };

  if (path.endsWith('/kuchar.html')) {
    loadEnhancement('chef-redesign.css', 'chef-redesign.js', '4');
  }

  if (path.endsWith('/restaurace.html')) {
    loadEnhancement('restaurace-redesign.css', 'restaurace-redesign.js', '3');
  }

  if (!path.endsWith('/feed.html')) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'feed-redesign.css?v=2';
  document.head.appendChild(stylesheet);

  const applyFeedRedesign = () => {
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

    if (filterRow) {
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

    const observer = new MutationObserver(updateCount);
    if (resultCount) observer.observe(resultCount, { childList: true, characterData: true, subtree: true });
    updateCount();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFeedRedesign, { once: true });
  } else {
    applyFeedRedesign();
  }
})();