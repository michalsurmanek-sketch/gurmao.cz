// GURMAO.cz – minimal network service worker.
// It never rewrites HTML or injects application scripts.

const CACHE_NAME = 'gurmao-offline-20260823-1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
    } catch (error) {
      console.warn('Offline fallback could not be cached:', error);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith((async () => {
      try {
        return await fetch(request, { cache: 'no-cache' });
      } catch (error) {
        const fallback = await caches.match(OFFLINE_URL);
        if (fallback) return fallback;
        throw error;
      }
    })());
  }
});