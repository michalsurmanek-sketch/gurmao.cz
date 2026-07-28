(() => {
  'use strict';
  // Stránka collections.html má odteď finální hlavičku i obsah přímo v HTML.
  // Soubor zůstává pouze jako bezpečný kompatibilní stub pro starší načítání z auth-ui.js.
  if (!location.pathname.endsWith('/collections.html')) return;
  document.documentElement.dataset.collectionsStable = 'true';
})();