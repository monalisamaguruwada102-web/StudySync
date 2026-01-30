/**
 * StudySync EMERGENCY KILL SWITCH
 * This script is designed to immediately deactivate and remove any existing service workers
 * that are causing interception errors (NS_ERROR_CORRUPTED_CONTENT).
 */

self.addEventListener('install', (event) => {
    // Force the new service worker to become the active service worker immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Unregister all other service workers and clear all caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        }).then(() => {
            return self.registration.unregister();
        }).then(() => {
            return self.clients.matchAll();
        }).then((clients) => {
            // Force all clients to reload once to clear out the broken worker
            clients.forEach(client => client.navigate(client.url));
        })
    );
});

// DO NOT intercept any fetch events.
// This restores standard browser networking immediately.
// self.addEventListener('fetch', (event) => { });
