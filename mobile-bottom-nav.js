(() => {
  'use strict';

  const currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const excludedPages = /^(admin(?:-|\.)|login\.|register\.|forgot-|reset-|404\.)/;
  if (excludedPages.test(currentFile) || document.getElementById('gurmaoBottomNav')) return;

  const items = [
    {
      label: 'Domů',
      href: '/index.html',
      matches: file => file === '' || file === 'index.html',
      icon: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/>'
    },
    {
      label: 'Feed',
      href: '/feed.html',
      matches: file => file === 'feed.html',
      icon: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z"/>'
    },
    {
      label: 'Restaurace',
      href: '/restaurace.html',
      primary: true,
      matches: file => /^(restaurace|restaurant)/.test(file),
      icon: '<path d="M7 3v7a3 3 0 0 0 3 3V3"/><path d="M8.5 13v8"/><path d="M16 3v18"/><path d="M16 3c3 2 3 7 0 9"/>'
    },
    {
      label: 'Mapa',
      href: '/mapa.html',
      matches: file => file === 'mapa.html',
      icon: '<path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/>'
    },
    {
      label: 'Výběr',
      href: '/collections.html',
      matches: file => file === 'collections.html',
      icon: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>'
    }
  ];

  const style = document.createElement('style');
  style.id = 'gurmaoBottomNavStyles';
  style.textContent = `
    .gurmao-bottom-nav{display:none}
    @media (max-width:767px){
      body.has-gurmao-bottom-nav{padding-bottom:calc(96px + env(safe-area-inset-bottom,0px))!important}
      .gurmao-bottom-nav{
        position:fixed;
        left:50%;
        bottom:calc(10px + env(safe-area-inset-bottom,0px));
        z-index:90;
        width:min(calc(100% - 20px),480px);
        min-height:68px;
        padding:7px 8px;
        display:grid;
        grid-template-columns:repeat(5,minmax(0,1fr));
        align-items:end;
        border:1px solid rgba(212,175,55,.26);
        border-radius:22px;
        background:linear-gradient(180deg,rgba(24,24,22,.96),rgba(8,9,8,.97));
        box-shadow:0 16px 46px rgba(0,0,0,.52),0 0 24px rgba(212,175,55,.07);
        -webkit-backdrop-filter:blur(18px);
        backdrop-filter:blur(18px);
        transform:translateX(-50%);
        transition:transform .22s ease,opacity .22s ease;
      }
      .gurmao-bottom-nav__item{
        position:relative;
        min-width:0;
        min-height:54px;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:flex-end;
        gap:4px;
        padding:5px 2px 4px;
        border-radius:15px;
        color:rgba(255,255,255,.56);
        text-decoration:none;
        -webkit-tap-highlight-color:transparent;
        transition:color .18s ease,background .18s ease,transform .18s ease;
      }
      .gurmao-bottom-nav__item:active{transform:scale(.94)}
      .gurmao-bottom-nav__icon{
        width:23px;
        height:23px;
        display:grid;
        place-items:center;
      }
      .gurmao-bottom-nav__icon svg{
        width:22px;
        height:22px;
        fill:none;
        stroke:currentColor;
        stroke-width:1.8;
        stroke-linecap:round;
        stroke-linejoin:round;
      }
      .gurmao-bottom-nav__label{
        max-width:100%;
        overflow:hidden;
        text-overflow:ellipsis;
        font:600 9px/1.1 Inter,system-ui,sans-serif;
        letter-spacing:.015em;
        white-space:nowrap;
      }
      .gurmao-bottom-nav__item.is-active{
        color:#f1c94a;
        background:rgba(212,175,55,.08);
      }
      .gurmao-bottom-nav__item.is-active:not(.is-primary)::after{
        content:"";
        position:absolute;
        top:1px;
        width:16px;
        height:2px;
        border-radius:999px;
        background:#e2b936;
        box-shadow:0 0 9px rgba(226,185,54,.7);
      }
      .gurmao-bottom-nav__item.is-primary{justify-content:flex-end}
      .gurmao-bottom-nav__item.is-primary .gurmao-bottom-nav__icon{
        width:43px;
        height:43px;
        margin-top:-16px;
        border:1px solid rgba(255,232,145,.72);
        border-radius:50%;
        color:#0b0b0d;
        background:linear-gradient(145deg,#f4d566 0%,#d4af37 58%,#a87913 100%);
        box-shadow:0 7px 20px rgba(212,175,55,.28),inset 0 1px 0 rgba(255,255,255,.38);
      }
      .gurmao-bottom-nav__item.is-primary .gurmao-bottom-nav__icon svg{width:22px;height:22px;stroke-width:2}
      .gurmao-bottom-nav__item.is-primary.is-active .gurmao-bottom-nav__icon{box-shadow:0 7px 25px rgba(226,185,54,.48),0 0 0 4px rgba(212,175,55,.1)}
      body.gurmao-mobile-keyboard .gurmao-bottom-nav{opacity:0;pointer-events:none;transform:translate(-50%,calc(100% + 30px))}
    }
    @media (max-width:350px){
      .gurmao-bottom-nav{width:calc(100% - 12px);padding-inline:4px}
      .gurmao-bottom-nav__label{font-size:8px}
    }
  `;

  const nav = document.createElement('nav');
  nav.id = 'gurmaoBottomNav';
  nav.className = 'gurmao-bottom-nav';
  nav.setAttribute('aria-label', 'Hlavní mobilní navigace');
  nav.innerHTML = items.map(item => {
    const active = item.matches(currentFile);
    return `<a class="gurmao-bottom-nav__item${item.primary ? ' is-primary' : ''}${active ? ' is-active' : ''}" href="${item.href}"${active ? ' aria-current="page"' : ''}>
      <span class="gurmao-bottom-nav__icon" aria-hidden="true"><svg viewBox="0 0 24 24">${item.icon}</svg></span>
      <span class="gurmao-bottom-nav__label">${item.label}</span>
    </a>`;
  }).join('');

  const mount = () => {
    if (document.getElementById('gurmaoBottomNav')) return;
    document.head.appendChild(style);
    document.body.appendChild(nav);
    document.body.classList.add('has-gurmao-bottom-nav');
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();

  document.addEventListener('focusin', event => {
    if (event.target.matches('input, textarea, select, [contenteditable="true"]')) {
      document.body.classList.add('gurmao-mobile-keyboard');
    }
  });
  document.addEventListener('focusout', () => {
    window.setTimeout(() => document.body.classList.remove('gurmao-mobile-keyboard'), 120);
  });
})();
