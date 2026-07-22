(function applyUnifiedFooterText() {
  const footerText = '© 2026 GURMAO.cz • Nejez. Prožij. • Objevujte nejlepší restaurace v celé České republice.';

  const updateFooter = () => {
    document.querySelectorAll('footer').forEach(footer => {
      const candidates = [...footer.querySelectorAll('span, p, small, div')]
        .filter(element => /©|GURMAO\.cz/i.test(element.textContent || ''))
        .sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);

      const copyright = candidates[0];
      if (copyright) {
        copyright.textContent = footerText;
        copyright.setAttribute('data-gurmao-footer-copy', 'true');
        return;
      }

      const copy = document.createElement('span');
      copy.textContent = footerText;
      copy.setAttribute('data-gurmao-footer-copy', 'true');
      footer.prepend(copy);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateFooter, { once: true });
  } else {
    updateFooter();
  }
})();

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

  // restaurace.html má nyní vlastní kompletní rozvržení a ovládání.
  // Starý restaurace-redesign.js vytvářel druhou sadu filtrů a duplicitní ID,
  // proto se na této stránce už nesmí dynamicky načítat.

  if (path.endsWith('/feed.html')) {
    loadEnhancement('feed-redesign.css', 'feed-redesign.js', '7');
  }

  if (path.endsWith('/ai.html')) {
    loadEnhancement('ai-redesign.css', 'ai-redesign.js', '4');
  }
})();