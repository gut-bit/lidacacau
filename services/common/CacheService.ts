/**
 * LidaCacau - Cache Service
 * 
 * Utility for caching API responses using AsyncStorage.
 * Helps with offline support and performance.
 */

import { storageAdapter } from './AsyncStorageAdapter';

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class CacheService {
    private readonly DEFAULT_EXPIRY = 60 * 60 * 1000; // 1 hour

    /**
     * Save data to cache
     */
    async set<T>(key: string, data: T, ttlMs: number = this.DEFAULT_EXPIRY): Promise<void> {
        try {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                expiresAt: Date.now() + ttlMs,
            };
            await storageAdapter.set(`cache_${key}`, entry);
        } catch (error) {
            console.warn(`[CacheService] Failed to set cache for ${key}:`, error);
        }
    }

    /**
     * Get data from cache
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const entry = await storageAdapter.get<CacheEntry<T>>(`cache_${key}`);

            if (!entry) return null;

            // Check if expired
            if (Date.now() > entry.expiresAt) {
                console.log(`[CacheService] Cache expired for ${key}`);
                return null;
            }

            return entry.data;
        } catch (error) {
            console.warn(`[CacheService] Failed to get cache for ${key}:`, error);
            return null;
        }
    }

    /**
     * Get even if expired (for offline mode)
     */
    async getStale<T>(key: string): Promise<T | null> {
        try {
            const entry = await storageAdapter.get<CacheEntry<T>>(`cache_${key}`);
            return entry ? entry.data : null;
        } catch {
            return null;
        }
    }

    /**
     * Clear specific cache
     */
    async remove(key: string): Promise<void> {
        await storageAdapter.remove(`cache_${key}`);
    }

    /**
     * Clear all cache entries
     */
    async clearAll(): Promise<void> {
        // This is simplified, should ideally list all keys and remove cache_*
        // For now, it's safer to clear manually or during significant updates
    }
}

export const cacheService = new CacheService();
export default cacheService;
