// GURMAO.cz – dočasný kill switch pro starý PWA service worker.
// Service worker způsoboval střídání starého a nového vzhledu při navigaci.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));

    const clientsList = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    await self.registration.unregister();

    for (const client of clientsList) {
      client.postMessage({ type: 'GURMAO_SW_REMOVED' });
    }
  })());
});

// Dokud se worker odregistruje, všechny požadavky pouští přímo na síť.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
