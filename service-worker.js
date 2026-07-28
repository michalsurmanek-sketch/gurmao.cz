// GURMAO.cz – síťový service worker bez přepisování collections.html.
// Důležité: collections.html se nikdy neupravuje ani nedoplňuje starými skripty.

const RUNTIME_VERSION = '20260728-collections-hard-reset-2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    await self.clients.claim();

    // Starší service worker mohl do collections.html vložit legacy skripty ještě
    // během aktuální navigace. Po převzetí řízení proto stránku jednou načteme
    // znovu přímo ze sítě s unikátním parametrem.
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      const url = new URL(client.url);
      if (/\/collections\.html$/i.test(url.pathname) && url.searchParams.get('_swfix') !== RUNTIME_VERSION) {
        url.searchParams.set('_swfix', RUNTIME_VERSION);
        await client.navigate(url.href);
      }
    }
  })());
});

async function networkHtml(request, injectRuntime) {
  const response = await fetch(request, { cache: 'no-store' });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('text/html') || !injectRuntime) {
    return response;
  }

  let html = await response.text();
  const scripts = [
    { marker: '/runtime-guard.js', tag: `<script src="/runtime-guard.js?v=${RUNTIME_VERSION}"></script>` },
    { marker: '/hide-price-level.js', tag: `<script src="/hide-price-level.js?v=${RUNTIME_VERSION}"></script>` },
    { marker: '/restaurant-card-status.js', tag: `<script src="/restaurant-card-status.js?v=${RUNTIME_VERSION}"></script>` },
    { marker: '/restaurant-card-actions.js', tag: `<script src="/restaurant-card-actions.js?v=${RUNTIME_VERSION}"></script>` },
    { marker: '/mobile-bottom-nav.js', tag: `<script src="/mobile-bottom-nav.js?v=${RUNTIME_VERSION}"></script>` }
  ];

  const missingTags = scripts
    .filter(script => !html.includes(script.marker))
    .map(script => script.tag)
    .join('');

  if (missingTags) {
    html = html.includes('</head>')
      ? html.replace('</head>', `${missingTags}</head>`)
      : `${missingTags}${html}`;
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    const isCollections = /\/collections\.html$/i.test(url.pathname);
    event.respondWith(
      networkHtml(request, !isCollections).catch(() => fetch(request, { cache: 'no-store' }))
    );
  }
});
