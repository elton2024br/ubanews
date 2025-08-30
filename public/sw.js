/* global self, workbox */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (self.workbox) {
  const { precaching, routing, strategies, expiration } = self.workbox;

  // Precache assets injected by the build
  precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  const PUBLIC_CACHE = 'public-get';

  // Cache all same-origin GET requests using a stale-while-revalidate strategy
  routing.registerRoute(
    ({ request, url }) => request.method === 'GET' && url.origin === self.location.origin,
    new strategies.StaleWhileRevalidate({
      cacheName: PUBLIC_CACHE,
      plugins: [
        new expiration.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    })
  );
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.open('public-get').then(cache =>
        cache.keys().then(keys => {
          event.ports[0]?.postMessage({ type: 'CACHE_SIZE', payload: keys.length });
        })
      )
    );
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete('public-get').then(() => {
        event.ports[0]?.postMessage({ type: 'CACHE_CLEARED' });
      })
    );
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
