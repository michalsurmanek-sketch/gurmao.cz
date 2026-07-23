// Přesun stavu otevřeno/zavřeno vedle názvu restaurace.
(() => {
  'use strict';

  if (!location.pathname.endsWith('/restaurace.html')) return;

  const style = document.createElement('style');
  style.id = 'gurmao-card-status-style';
  style.textContent = `
    .card-title-line{display:flex!important;align-items:center!important;gap:8px!important;min-width:0}
    .card-title-line .card-title{flex:1 1 auto;min-width:0}
    .card-title-line .opening-status{flex:0 0 auto;display:inline-flex!important;align-items:center;min-height:22px;padding:3px 8px;border-radius:999px;font-size:10px!important;font-weight:700!important;line-height:1.1;white-space:nowrap}
    .card-title-line .opening-status.open{color:#77e58f!important;background:rgba(49,142,72,.16);border:1px solid rgba(83,207,113,.35)}
    .card-title-line .opening-status.closing{color:#ffc36b!important;background:rgba(191,117,21,.16);border:1px solid rgba(255,177,95,.35)}
    .card-title-line .opening-status.closed{color:#ff927d!important;background:rgba(153,49,32,.18);border:1px solid rgba(255,133,109,.35)}
    .card-title-line .opening-status.unknown{display:none!important}
    .card-bottom .opening-status{display:none!important}
    @media(max-width:520px){
      .card-title-line{flex-wrap:wrap}
      .card-title-line .card-title{flex-basis:calc(100% - 92px)}
    }
  `;
  document.head.appendChild(style);

  function moveStatus(root = document) {
    const cards = root.matches?.('.restaurant-card') ? [root] : [...(root.querySelectorAll?.('.restaurant-card') || [])];
    for (const card of cards) {
      const titleLine = card.querySelector('.card-title-line');
      const status = card.querySelector('.opening-status');
      if (!titleLine || !status || status.parentElement === titleLine) continue;
      titleLine.appendChild(status);
    }
  }

  function start() {
    moveStatus();
    const list = document.getElementById('restaurantsList');
    if (!list) return;
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) moveStatus(node);
        }
      }
    });
    observer.observe(list, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
