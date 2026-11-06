// Optical Store ERP & POS Service Worker
const CACHE_NAME = 'optical-pos-v1.2.0';

const STATIC_PRECACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('Pre-caching assets warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Support Skip Waiting message for in-app updates
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data === 'skipWaiting')) {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass API endpoints, auth, and Next.js dev server hot updates
  // Strict live guarantee: All database and API calls always hit the network
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  // Network-first with cache fallback for page navigation and assets
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful basic responses
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If HTML page request and network fails, return cached root page
        if (event.request.headers.get('accept')?.includes('text/html')) {
          const fallbackPage = await caches.match('/');
          if (fallbackPage) return fallbackPage;
        }

        return new Response('Network offline. Optical POS offline shell unavailable.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});
