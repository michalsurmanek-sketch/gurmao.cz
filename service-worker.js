// GURMAO.cz - Service Worker for PWA
// Poskytuje offline funkčnost a cache strategii

const CACHE_NAME = 'gurmao-v1.0.1';
const RUNTIME_CACHE = 'gurmao-runtime';

// Statické assety k okamžitému cachování
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/feed.html',
  '/restaurace.html',
  '/mapa.html',
  '/global.css',
  '/app.js',
  '/favicon.svg',
  '/offline.html' // Fallback stránka
];

// Assety pro runtime caching
const RUNTIME_CACHE_URLS = [
  '/api/',
  'https://txfuxrezyrgybjvjnhom.supabase.co/',
  'https://images.unsplash.com/'
];

// ==========================================
// INSTALL EVENT
// ==========================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ==========================================
// ACTIVATE EVENT
// ==========================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Smazat staré cache verze
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ==========================================
// FETCH EVENT - Cache Strategy
// ==========================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Strategie pro různé typy requestů
  if (url.origin === location.origin) {
    // Navigační requesty - Network First s fallback
    if (request.mode === 'navigate') {
      event.respondWith(networkFirstStrategy(request));
      return;
    }
    
    // Statické assety - Cache First
    if (isStaticAsset(url.pathname)) {
      event.respondWith(cacheFirstStrategy(request));
      return;
    }
  }

  // API requesty - Network First s cache fallback
  if (isApiRequest(url.href)) {
    event.respondWith(networkFirstWithTimeout(request, 3000));
    return;
  }

  // Obrázky - Cache First s network fallback
  if (isImageRequest(request)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Default - Network First
  event.respondWith(networkFirstStrategy(request));
});

// ==========================================
// CACHE STRATEGIES
// ==========================================

// Network First - Zkusit network, fallback na cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback pro HTML requesty
    if (request.headers.get('accept').includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache First - Zkusit cache, fallback na network
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Vrátit cache a aktualizovat na pozadí
    updateCache(request);
    return cachedResponse;
  }
  
  // Není v cache, stáhnout z networku
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch:', request.url);
    throw error;
  }
}

// Network First s timeoutem
async function networkFirstWithTimeout(request, timeout = 3000) {
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network timeout or failed, using cache');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Aktualizovat cache na pozadí
async function updateCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Tiše selhat - cache je již vrácena
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function isStaticAsset(pathname) {
  const staticExtensions = ['.css', '.js', '.svg', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

function isImageRequest(request) {
  return request.destination === 'image' || 
         request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
}

function isApiRequest(url) {
  return RUNTIME_CACHE_URLS.some(cacheUrl => url.includes(cacheUrl));
}

// ==========================================
// BACKGROUND SYNC (pro budoucí použití)
// ==========================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ratings') {
    event.waitUntil(syncRatings());
  }
});

async function syncRatings() {
  // TODO: Implementovat synchronizaci pending ratings
  console.log('[SW] Syncing ratings...');
}

// ==========================================
// PUSH NOTIFICATIONS (pro budoucí použití)
// ==========================================

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Nová restaurace byla přidána!',
    icon: '/favicon.svg',
    badge: '/badge-icon.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'GURMAO', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// ==========================================
// MESSAGES FROM CLIENT
// ==========================================

self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service Worker loaded');
