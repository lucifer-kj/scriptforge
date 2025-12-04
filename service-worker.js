const STATIC_CACHE_NAME = 'scriptforge-static-v1';
const DYNAMIC_CACHE_NAME = 'scriptforge-dynamic-v1';
const API_BASE_URL = self.location.origin; // Assuming API is on the same origin, will be replaced by env var logic if needed.

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  // The main JS/CSS bundles are usually hashed and added by a build tool.
  // We will cache them dynamically as they are requested.
  // Icons are also cached dynamically.
];

// INSTALL: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching App Shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// ACTIVATE: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// FETCH: Serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always go to network for non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API calls: Stale-while-revalidate
  if (url.origin === API_BASE_URL && url.pathname.startsWith('/webhook/script-forge/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => {
            // If network fails and there's no cache, it will fail, which is acceptable for dynamic data.
          });
        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // Other requests: Cache-first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(request)
          .then((networkResponse) => {
            // Cache the new resource dynamically
            return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          })
          .catch(() => {
            // For navigation requests, fall back to the offline page
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          })
      );
    })
  );
});
