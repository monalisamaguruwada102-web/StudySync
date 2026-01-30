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
    const url = new URL(event.request.url);

    // 1. Bypass Service Worker for assets folder (Vite hashed files)
    // This prevents "Corrupted Content" and out-of-sync hash errors
    if (url.pathname.startsWith('/assets/')) {
        return;
    }

    // 2. Only handle safe GET requests
    if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached response if found
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise fetch from network
            return fetch(event.request).catch((err) => {
                console.error('Network fetch failed:', err);
                // Return a basic fallback for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('/');
                }
                return null;
            });
        })
    );
});

