(() => {
  'use strict';

  if (!location.pathname.endsWith('/collections.html')) return;

  const applyHeader = () => {
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
          <a href="feed.html">Feed</a>
          <a href="restaurace.html">Restaurace</a>
          <a href="kuchar.html">Kuchaři</a>
          <a href="ai.html">AI</a>
          <a href="mapa.html">Mapa</a>
          <a class="active" href="collections.html">Můj výběr</a>
          <div id="userMenuDesktop" class="hidden relative">
            <button id="userDropdownBtn" class="account"><span id="userNameDesktop"></span> ▼</button>
            <div id="userDropdownMenu" class="hidden absolute right-0 top-full mt-2 w-48 rounded-2xl bg-black border border-white/20 p-2">
              <a href="collections.html" class="block p-3">Můj výběr</a>
              <a href="profile.html" class="block p-3">Můj účet</a>
              <a href="admin.html" data-admin-only class="hidden block p-3">Admin Panel</a>
              <button data-logout-btn class="block w-full text-left p-3">Odhlásit se</button>
            </div>
          </div>
          <a id="loginLinkDesktop" href="login.html" class="account">Přihlásit se</a>
        </nav>
        <button id="menuBtn" class="menu-button" aria-label="Otevřít menu">☰</button>
      </div>`;

    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
      mobileMenu.innerHTML = `
        <div class="m-4 rounded-3xl border border-white/10 bg-black p-4">
          <div class="flex justify-between pb-3"><span>Navigace</span><button id="menuClose">✕</button></div>
          <nav class="grid gap-2">
            <a href="index.html" class="p-3">Domů</a>
            <a href="feed.html" class="p-3">Feed</a>
            <a href="restaurace.html" class="p-3">Restaurace</a>
            <a href="kuchar.html" class="p-3">Kuchaři</a>
            <a href="ai.html" class="p-3">AI</a>
            <a href="mapa.html" class="p-3">Mapa</a>
            <a href="collections.html" class="p-3" data-gurmao-mobile-active>Můj výběr</a>
            <div id="userMenuMobile" class="hidden"><span id="userNameMobile"></span><a href="profile.html" class="block p-3">Můj účet</a><button data-logout-btn class="p-3">Odhlásit se</button></div>
            <a id="loginLinkMobile" href="login.html" class="p-3">Přihlásit se</a>
          </nav>
        </div>`;
    }

    window.dispatchEvent(new Event('gurmao:header-ready'));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyHeader, { once: true });
  else applyHeader();
})();
