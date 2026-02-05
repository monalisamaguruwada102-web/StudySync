/**
 * Client-side data caching utility
 * Stores fetched data in localStorage for offline access and faster loading
 */

const CACHE_PREFIX = 'studysync_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class DataCache {
    constructor() {
        this.isOnline = navigator.onLine;

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('✅ Connection restored');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('⚠️ Connection lost - using cached data');
        });
    }

    /**
     * Generate cache key for a collection
     */
    getCacheKey(collection) {
        return `${CACHE_PREFIX}${collection}`;
    }

    /**
     * Get cached data for a collection
     */
    get(collection) {
        try {
            const key = this.getCacheKey(collection);
            const cached = localStorage.getItem(key);

            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);

            // Check if cache is expired
            if (Date.now() - timestamp > CACHE_EXPIRY) {
                this.remove(collection);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    }

    /**
     * Set cached data for a collection
     */
    set(collection, data) {
        const key = this.getCacheKey(collection);
        const cacheData = {
            data,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(key, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error writing cache:', error);
            // If localStorage is full, clear old caches
            if (error.name === 'QuotaExceededError') {
                this.clearExpired();
                // Try again
                try {
                    localStorage.setItem(key, JSON.stringify(cacheData));
                } catch (e) {
                    console.error('Still failed after clearing cache:', e);
                }
            }
        }
    }

    /**
     * Remove cached data for a collection
     */
    remove(collection) {
        const key = this.getCacheKey(collection);
        localStorage.removeItem(key);
    }

    /**
     * Clear all expired caches
     */
    clearExpired() {
        const keys = Object.keys(localStorage);
        const now = Date.now();

        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                try {
                    const cached = JSON.parse(localStorage.getItem(key));
                    if (now - cached.timestamp > CACHE_EXPIRY) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    // Invalid cache entry, remove it
                    localStorage.removeItem(key);
                }
            }
        });
    }

    /**
     * Clear all caches
     */
    clearAll() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Check if we're online
     */
    isNetworkOnline() {
        return this.isOnline;
    }
}

// Export singleton instance
export const dataCache = new DataCache();
