// GURMAO.cz – síťový service worker bez offline cache.
// Vynucuje aktuální soubory a přidává globální ochranu běhu do HTML stránek.

const RUNTIME_VERSION = '20260723-2';

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

async function networkNoStore(request) {
  const freshRequest = new Request(request, { cache: 'no-store' });
  return fetch(freshRequest);
}

async function htmlWithRuntimeGuard(request) {
  const response = await networkNoStore(request);
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok || !contentType.includes('text/html')) return response;

  let html = await response.text();
  const guardTag = `<script src="/runtime-guard.js?v=${RUNTIME_VERSION}"></script>`;

  if (!html.includes('/runtime-guard.js')) {
    if (html.includes('</head>')) html = html.replace('</head>', `${guardTag}</head>`);
    else html = `${guardTag}${html}`;
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store, no-cache, must-revalidate');
  headers.set('pragma', 'no-cache');
  headers.set('expires', '0');

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
      htmlWithRuntimeGuard(request).catch(() => fetch(request))
    );
    return;
  }

  event.respondWith(
    networkNoStore(request).catch(() => fetch(request))
  );
});