// GURMAO.cz – service worker
// Síť má přednost pro HTML, CSS a JavaScript, aby se změny webu projevily ihned.

const CACHE_NAME = 'gurmao-v1.1.0';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/favicon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Supabase data se nikdy necachují.
  if (url.hostname.endsWith('.supabase.co') && request.destination !== 'image') {
    event.respondWith(fetch(request));
    return;
  }

  // HTML, CSS a JS vždy nejprve ze sítě. Tím se ihned projeví nové commity.
  if (
    url.origin === self.location.origin &&
    (request.mode === 'navigate' || ['style', 'script', 'worker'].includes(request.destination))
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Obrázky mohou být cachované kvůli rychlosti.
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match(OFFLINE_URL);
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('message', event => {
  if (event.data?.action === 'skipWaiting') self.skipWaiting();
  if (event.data?.action === 'clearCache') {
    event.waitUntil(caches.keys().then(names => Promise.all(names.map(name => caches.delete(name)))));
  }
});
