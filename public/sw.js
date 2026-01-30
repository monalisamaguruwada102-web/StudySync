const CACHE_NAME = 'studysync-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo.svg',
    '/favicon.ico'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Only intercept http/https requests
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then((networkResponse) => {
                    // Check if we received a valid response
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // Optional: Cache new assets on the fly
                    return networkResponse;
                });
            })
            .catch((err) => {
                console.error('SW fetch failed:', err);
                // Return original fetch as last resort (without recursion)
                return fetch(event.request).catch(() => {
                    // If everything fails, return actual 404
                    return new Response('Network error occurred', {
                        status: 408,
                        statusText: 'Network error occurred'
                    });
                });
            })
    );
});
