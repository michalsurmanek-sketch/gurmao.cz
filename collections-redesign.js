(() => {
  'use strict';

  if (!location.pathname.endsWith('/collections.html')) return;

  async function syncAuthentication() {
    const userMenuDesktop = document.getElementById('userMenuDesktop');
    const userMenuMobile = document.getElementById('userMenuMobile');
    const loginLinkDesktop = document.getElementById('loginLinkDesktop');
    const loginLinkMobile = document.getElementById('loginLinkMobile');

    const showLoggedOut = () => {
      userMenuDesktop?.classList.add('hidden');
      userMenuMobile?.classList.add('hidden');
      loginLinkDesktop?.classList.remove('hidden');
      loginLinkMobile?.classList.remove('hidden');
    };

    try {
      const { supabase } = await import('./supabase-client.js');
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        showLoggedOut();
        return;
      }

      const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Uživatel';
      userMenuDesktop?.classList.remove('hidden');
      userMenuMobile?.classList.remove('hidden');
      loginLinkDesktop?.classList.add('hidden');
      loginLinkMobile?.classList.add('hidden');

      const userNameMobile = document.getElementById('userNameMobile');
      if (userNameMobile) userNameMobile.textContent = `Přihlášen: ${userName}`;

      const userDropdownBtn = document.getElementById('userDropdownBtn');
      if (userDropdownBtn) {
        userDropdownBtn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7.5" r="4.25"></circle><path d="M4.25 21c.35-5.05 3.1-7.6 7.75-7.6s7.4 2.55 7.75 7.6H4.25z"></path></svg>';
        userDropdownBtn.setAttribute('aria-label', `Uživatelský účet: ${userName}`);
        userDropdownBtn.setAttribute('title', 'Můj účet');
      }

      if (user.app_metadata?.role === 'admin') {
        document.querySelectorAll('[data-admin-only]').forEach(link => link.classList.remove('hidden'));
      }

      const dropdown = document.getElementById('userDropdownMenu');
      userDropdownBtn?.addEventListener('click', event => {
        event.stopPropagation();
        dropdown?.classList.toggle('hidden');
      });
      dropdown?.addEventListener('click', event => event.stopPropagation());
      document.addEventListener('click', () => dropdown?.classList.add('hidden'));

      document.querySelectorAll('[data-logout-btn]').forEach(button => {
        button.addEventListener('click', async () => {
          await supabase.auth.signOut();
          localStorage.removeItem('gurmao_user');
          location.href = 'index.html';
        });
      });
    } catch (error) {
      console.error('Authentication UI failed on collections:', error);
      showLoggedOut();
    }
  }

  const applyHeader = async () => {
    const header = document.querySelector('.site-header');
    if (!header) return;

    header.innerHTML = `
      <div class="page-shell header-inner">
        <a href="index.html" class="brand" aria-label="GURMAO – domů">
          <span class="gurmao-wordmark">GUR<span class="gurmao-medallion">M</span>AO</span>
          <small>Najdi restauraci podle chuti</small>
        </a>
        <nav class="desktop-nav">
          <button id="headerSearchToggle" class="nav-search" aria-label="Vyhledat">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
          </button>
          <a href="feed.html">Feed</a><a href="restaurace.html">Restaurace</a><a href="kuchar.html">Kuchaři</a><a href="ai.html">AI</a><a href="mapa.html">Mapa</a><a class="active" href="collections.html">Můj výběr</a>
          <div id="userMenuDesktop" class="hidden relative">
            <button id="userDropdownBtn" class="account" aria-label="Můj účet"></button>
            <div id="userDropdownMenu" class="hidden absolute right-0 top-full mt-2 w-48 rounded-2xl bg-black border border-white/20 p-2">
              <a href="collections.html" class="block p-3">Můj výběr</a><a href="profile.html" class="block p-3">Můj účet</a><a href="admin.html" data-admin-only class="hidden block p-3">Admin Panel</a><button data-logout-btn class="block w-full text-left p-3">Odhlásit se</button>
            </div>
          </div>
          <a id="loginLinkDesktop" href="login.html" class="account">Přihlásit se</a>
        </nav>
        <button id="menuBtn" class="menu-button" aria-label="Otevřít menu">☰</button>
      </div>`;

    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
      mobileMenu.innerHTML = `<div class="m-4 rounded-3xl border border-white/10 bg-black p-4"><div class="flex justify-between pb-3"><span>Navigace</span><button id="menuClose">✕</button></div><nav class="grid gap-2"><a href="index.html" class="p-3">Domů</a><a href="feed.html" class="p-3">Feed</a><a href="restaurace.html" class="p-3">Restaurace</a><a href="kuchar.html" class="p-3">Kuchaři</a><a href="ai.html" class="p-3">AI</a><a href="mapa.html" class="p-3">Mapa</a><a href="collections.html" class="p-3" data-gurmao-mobile-active>Můj výběr</a><div id="userMenuMobile" class="hidden"><span id="userNameMobile"></span><a href="profile.html" class="block p-3">Můj účet</a><button data-logout-btn class="p-3">Odhlásit se</button></div><a id="loginLinkMobile" href="login.html" class="p-3">Přihlásit se</a></nav></div>`;
    }

    await syncAuthentication();
    window.dispatchEvent(new Event('gurmao:header-ready'));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyHeader, { once: true });
  else void applyHeader();
})();