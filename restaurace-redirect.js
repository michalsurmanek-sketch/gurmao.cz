// Redirect legacy restaurant pages to the canonical dynamic detail page.
// Handles: restaurace-[slug].html -> restaurant.html?slug=[slug]

(function () {
  const fileName = window.location.pathname.split('/').pop() || '';
  if (!fileName.startsWith('restaurace-') || !fileName.endsWith('.html')) return;
  if (fileName === 'restaurace-detail.html' || fileName === 'restaurace.html') return;

  const slug = fileName.slice('restaurace-'.length, -'.html'.length);
  if (!slug) return;

  const target = new URL('restaurant.html', window.location.href);
  target.searchParams.set('slug', decodeURIComponent(slug));
  target.hash = window.location.hash;
  window.location.replace(target.href);
})();