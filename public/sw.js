const CACHE_NAME = 'timeseal-v4';
const OFFLINE_CACHE = 'timeseal-offline-v1';

const OFFLINE_URLS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE)
      .then((cache) => {
        return Promise.allSettled(
          OFFLINE_URLS.map(url => cache.add(url).catch(err => console.warn('Failed to cache:', url)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Cache-first for dashboard (offline support)
  if (url.pathname === '/dashboard') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
