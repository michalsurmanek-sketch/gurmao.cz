// GURMAO.cz – sdílené přihlášení, navigace a bezpečné doplňky stránek.
(() => {
  'use strict';

  const onReady = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  };

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));

  // Opraví pouze poškozená lokální data. Service worker ani cache se zde nemažou.
  try {
    const userRaw = localStorage.getItem('gurmao_user');
    if (userRaw !== null) {
      const user = JSON.parse(userRaw);
      if (!user || typeof user !== 'object' || Array.isArray(user)) {
        localStorage.removeItem('gurmao_user');
      }
    }
  } catch {
    localStorage.removeItem('gurmao_user');
  }

  try {
    const savedRaw = localStorage.getItem('gurmao_saved');
    if (savedRaw !== null && !Array.isArray(JSON.parse(savedRaw))) {
      localStorage.setItem('gurmao_saved', '[]');
    }
  } catch {
    localStorage.setItem('gurmao_saved', '[]');
  }

  onReady(() => {
    const footerText = '© 2026 GURMAO.cz • Nejez. Prožij. • Objevujte nejlepší restaurace v celé České republice.';
    document.querySelectorAll('footer').forEach(footer => {
      const candidates = [...footer.querySelectorAll('span, p, small, div')]
        .filter(element => /©|GURMAO\.cz/i.test(element.textContent || ''))
        .sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
      const target = candidates[0];
      if (target) {
        target.textContent = footerText;
        target.dataset.gurmaoFooterCopy = 'true';
      }
    });

    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('header nav a[href]').forEach(link => {
      const href = (link.getAttribute('href') || '').split('?')[0].split('#')[0];
      link.toggleAttribute('data-gurmao-active-nav', href === page);
    });

    if (!document.getElementById('gurmao-active-navigation-style')) {
      const style = document.createElement('style');
      style.id = 'gurmao-active-navigation-style';
      style.textContent = 'header nav a[data-gurmao-active-nav="true"]{position:relative;color:#f3c94a!important}header nav a[data-gurmao-active-nav="true"]:after{content:"";position:absolute;left:0;right:0;bottom:-27px;height:2px;background:#f3c94a}';
      document.head.appendChild(style);
    }
  });

  async function initializeAuthentication() {
    const userMenuDesktop = document.getElementById('userMenuDesktop');
    const userMenuMobile = document.getElementById('userMenuMobile');
    const loginLinkDesktop = document.getElementById('loginLinkDesktop');
    const loginLinkMobile = document.getElementById('loginLinkMobile');

    const showLoggedOut = () => {
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
        showLoggedOut();
        return;
      }

      userMenuDesktop?.classList.remove('hidden');
      userMenuMobile?.classList.remove('hidden');
      loginLinkDesktop?.classList.add('hidden');
      loginLinkMobile?.classList.add('hidden');

      const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Uživatel';
      const safeName = escapeHtml(userName);
      const safeEmail = escapeHtml(user.email || '');
      const userNameMobile = document.getElementById('userNameMobile');
      if (userNameMobile) userNameMobile.textContent = `Přihlášen: ${userName}`;

      const userDropdownBtn = document.getElementById('userDropdownBtn');
      const userDropdownMenu = document.getElementById('userDropdownMenu');
      if (userDropdownBtn) {
        userDropdownBtn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7.5" r="4.25"></circle><path d="M4.25 21c.35-5.05 3.1-7.6 7.75-7.6s7.4 2.55 7.75 7.6H4.25z"></path></svg>';
        userDropdownBtn.setAttribute('aria-label', `Uživatelský účet: ${userName}`);
        userDropdownBtn.setAttribute('aria-expanded', 'false');
      }

      if (userDropdownMenu) {
        const adminItem = user.app_metadata?.role === 'admin'
          ? '<a href="admin.html" class="block px-5 py-3 hover:bg-white/10 transition"><div class="font-semibold text-sm">🛠 Admin panel</div></a>'
          : '';
        userDropdownMenu.innerHTML = `<div class="px-5 py-4 border-b border-white/10"><div class="font-semibold text-white">👤 ${safeName}</div><div class="mt-1 text-xs text-white/55 break-all">${safeEmail}</div></div><div class="py-1 border-b border-white/10"><a href="collections.html" class="block px-5 py-3 hover:bg-white/10 transition"><div class="font-semibold text-sm">⭐ Můj výběr</div></a><a href="profile.html" class="block px-5 py-3 hover:bg-white/10 transition"><div class="font-semibold text-sm">👤 Profil</div></a><a href="profile.html#settings" class="block px-5 py-3 hover:bg-white/10 transition"><div class="font-semibold text-sm">⚙️ Nastavení</div></a>${adminItem}</div><button data-logout-btn class="w-full text-left px-5 py-4 hover:bg-gurmaored/20 hover:text-gurmaored transition"><div class="font-semibold text-sm">🚪 Odhlásit se</div></button>`;
      }

      if (user.app_metadata?.role === 'admin') {
        document.querySelectorAll('[data-admin-only]').forEach(link => link.classList.remove('hidden'));
      }

      if (userDropdownBtn && userDropdownMenu) {
        userDropdownBtn.addEventListener('click', event => {
          event.stopPropagation();
          const isHidden = userDropdownMenu.classList.toggle('hidden');
          userDropdownBtn.setAttribute('aria-expanded', String(!isHidden));
        });
        userDropdownMenu.addEventListener('click', event => event.stopPropagation());
        document.addEventListener('click', () => {
          userDropdownMenu.classList.add('hidden');
          userDropdownBtn.setAttribute('aria-expanded', 'false');
        });
        document.addEventListener('keydown', event => {
          if (event.key === 'Escape') {
            userDropdownMenu.classList.add('hidden');
            userDropdownBtn.setAttribute('aria-expanded', 'false');
            userDropdownBtn.focus();
          }
        });
      }

      document.querySelectorAll('[data-logout-btn]').forEach(button => {
        button.addEventListener('click', async () => {
          button.disabled = true;
          try {
            await supabase.auth.signOut();
          } finally {
            localStorage.removeItem('gurmao_user');
            location.href = 'index.html';
          }
        });
      });
    } catch (error) {
      console.error('Authentication UI failed:', error);
      showLoggedOut();
    }
  }

  onReady(() => void initializeAuthentication());

  // Doplňky se načítají pouze tam, kde jsou stále potřeba.
  onReady(() => {
    const path = location.pathname.replace(/\/+$/, '');
    const loadEnhancement = (css, js, version) => {
      if (css && !document.querySelector(`link[href^="${css}"]`)) {
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = `${css}?v=${version}`;
        document.head.appendChild(stylesheet);
      }
      if (js && !document.querySelector(`script[src^="${js}"]`)) {
        const script = document.createElement('script');
        script.src = `${js}?v=${version}`;
        script.defer = true;
        document.body.appendChild(script);
      }
    };

    if (path.endsWith('/kuchar.html')) loadEnhancement('chef-redesign.css', 'chef-redesign.js', '4');
    if (path.endsWith('/restaurace.html')) {
      loadEnhancement('restaurant-gold-scrollbar.css', null, '20260725-2');
      loadEnhancement(null, 'restaurant-locality-select-fix.js', '20260725-2');
      loadEnhancement('restaurant-recommendation-card.css', 'restaurant-recommendation-card.js', '20260725-3');
    }
    if (path.endsWith('/ai.html')) loadEnhancement('ai-redesign.css', 'ai-redesign.js', '6');
  });
})();