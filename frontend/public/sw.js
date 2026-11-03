// MPLADS Performance Service Worker: Stale-While-Revalidate & Immutable Asset Caching
const CACHE_NAME = 'mplads-shell-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/emblem_favicon.webp',
  '/fonts/plus-jakarta-sans.woff2',
  '/fonts/inter.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && !k.startsWith('mplads_geo_cache')).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // 1. Immutable hashed Vite assets & fonts: Cache-First
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkRes) => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // 2. Navigation / HTML pages: Network-First with Cache Fallback for offline resilience
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // 3. Static images and icons: Stale-While-Revalidate
  if (url.pathname.startsWith('/images/') || url.pathname.endsWith('.avif') || url.pathname.endsWith('.webp') || url.pathname.endsWith('.png')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkRes) => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkRes;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
