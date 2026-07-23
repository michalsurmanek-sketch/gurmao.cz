// Skryje orientační cenovou hladinu ($ až $$$$) na kartách restaurací.
(() => {
  if (!location.pathname.endsWith('/restaurace.html')) return;
  if (document.getElementById('gurmao-hide-price-level')) return;

  const style = document.createElement('style');
  style.id = 'gurmao-hide-price-level';
  style.textContent = '.restaurant-card .price,.restaurant-row .price{display:none!important}';
  document.head.appendChild(style);
})();
