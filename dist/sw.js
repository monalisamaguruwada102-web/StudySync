const CACHE_NAME = 'studysync-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico'
];

// Install Event: Cache Static Assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// Activate Event: Clean Old Caches
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
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Cache First for Assets, Network First for API
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. API Calls: Network Only (handled by app logic/caching)
    if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
        return;
    }

    // 2. Static Assets (JS, CSS, Images): Cache First
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2)$/)) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                // Return cached response if found
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Otherwise fetch from network and cache it
                return fetch(event.request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // 3. Navigation/HTML: Stale-While-Revalidate
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match('/index.html').then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        cache.put('/index.html', networkResponse.clone());
                        return networkResponse;
                    });
                    // Return cached index.html immediately if available, otherwise wait for network
                    return cachedResponse || fetchPromise;
                });
            })
        );
    }
});
