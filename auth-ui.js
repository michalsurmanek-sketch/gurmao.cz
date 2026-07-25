// GURMAO browser recovery: remove legacy service workers/caches and repair malformed storage.
(function recoverBrowserState() {
  const safeJson = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      console.warn(`Poškozená lokální data ${key} byla odstraněna.`, error);
      localStorage.removeItem(key);
      return fallback;
    }
  };

  const user = safeJson('gurmao_user', null);
  const saved = safeJson('gurmao_saved', []);
  if (user !== null && (typeof user !== 'object' || Array.isArray(user))) localStorage.removeItem('gurmao_user');
  if (!Array.isArray(saved)) localStorage.setItem('gurmao_saved', '[]');

  const removeLegacyPwa = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }
    } catch (error) {
      console.warn('Vyčištění staré PWA cache se nezdařilo:', error);
    }
  };

  removeLegacyPwa();
  window.addEventListener('load', () => {
    setTimeout(removeLegacyPwa, 250);
    setTimeout(removeLegacyPwa, 1500);
  }, { once: true });
})();

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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateFooter, { once: true });
  else updateFooter();
})();

(function applyActiveNavigation() {
  const run = () => {
    const page = location.pathname.split('/').pop() || 'index.html';
    const style = document.createElement('style');
    style.id = 'gurmao-active-navigation-style';
    style.textContent = `
      header nav a[data-gurmao-active-nav="true"]{position:relative;color:#f3c94a!important}
      header nav a[data-gurmao-active-nav="true"]:after{content:"";position:absolute;left:0;right:0;bottom:-27px;height:2px;background:#f3c94a}
    `;
    if (!document.getElementById(style.id)) document.head.appendChild(style);
    document.querySelectorAll('header nav a[href]').forEach(link => {
      const href = (link.getAttribute('href') || '').split('?')[0].split('#')[0];
      if (href === page) link.setAttribute('data-gurmao-active-nav', 'true');
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
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
    const userNameMobile = document.getElementById('userNameMobile');
    if (userNameMobile) userNameMobile.textContent = `Přihlášen: ${userName}`;

    const userDropdownBtn = document.getElementById('userDropdownBtn');
    if (userDropdownBtn) {
      userDropdownBtn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7.5" r="4.25"></circle><path d="M4.25 21c.35-5.05 3.1-7.6 7.75-7.6s7.4 2.55 7.75 7.6H4.25z"></path></svg>';
      userDropdownBtn.setAttribute('aria-label', `Uživatelský účet: ${userName}`);
      userDropdownBtn.setAttribute('title', 'Můj účet');
      userDropdownBtn.style.cssText += ';width:44px!important;height:44px!important;min-width:44px!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:50%!important;line-height:0!important;overflow:hidden!important';
      const icon = userDropdownBtn.querySelector('svg');
      if (icon) icon.style.cssText = 'display:block;width:22px;height:22px;flex:0 0 22px;margin:0;transform:none;position:static';
    }

    if (user.app_metadata?.role === 'admin') document.querySelectorAll('[data-admin-only]').forEach(link => link.classList.remove('hidden'));

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
    if (css) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = `${css}?v=${version}`;
      document.head.appendChild(stylesheet);
    }
    if (js) {
      const script = document.createElement('script');
      script.src = `${js}?v=${version}`;
      document.body.appendChild(script);
    }
  };

  if (path.endsWith('/kuchar.html')) loadEnhancement('chef-redesign.css', 'chef-redesign.js', '4');
  if (path.endsWith('/restaurace.html')) {
    loadEnhancement('restaurant-gold-scrollbar.css', 'restaurant-card-status.js', '20260724-2');
    loadEnhancement(null, 'restaurant-locality-select-fix.js', '20260725-1');
    loadEnhancement(null, 'restaurant-nearby-reset-filters.js', '20260725-1');
  }
  if (path.endsWith('/feed.html')) loadEnhancement('feed-redesign.css', 'feed-redesign.js', '7');
  if (path.endsWith('/ai.html')) loadEnhancement('ai-redesign.css', 'ai-redesign.js', '4');
})();