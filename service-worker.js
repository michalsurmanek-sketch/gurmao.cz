// GURMAO.cz – lehký service worker pro společné runtime skripty.
// HTML se vždy načítá ze sítě. Stránka collections.html je zcela vynechána
// z legacy runtime injekcí, aby ji starší globální skripty nemohly přepisovat.

const RUNTIME_VERSION = '20260728-collections-fix-1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function htmlWithRuntimeGuard(request) {
  const url = new URL(request.url);
  const isCollections = /\/collections\.html$/i.test(url.pathname);

  // U collections vždy vynutit čerstvý soubor přímo ze sítě a nic do něj nevkládat.
  if (isCollections) {
    const response = await fetch(request, { cache: 'reload' });
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  const response = await fetch(request, { cache: 'no-cache' });
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok || !contentType.includes('text/html')) return response;

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
    if (html.includes('</head>')) html = html.replace('</head>', `${missingTags}</head>`);
    else html = `${missingTags}${html}`;
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');

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
    event.respondWith(
      htmlWithRuntimeGuard(request).catch(() => fetch(request, { cache: 'reload' }))
    );
  }
});
