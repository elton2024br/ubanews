import { useState, useEffect, useCallback } from 'react';
import { NewsArticle } from '@/shared/types/news';

interface CacheEntry {
  data: NewsArticle[];
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

interface UseNewsCacheResult {
  cache: Record<string, CacheEntry>;
  stats: CacheStats;
  get: (key: string) => NewsArticle[] | null;
  set: (key: string, data: NewsArticle[], ttl?: number) => void;
  has: (key: string) => boolean;
  remove: (key: string) => void;
  clear: () => void;
  keys: () => string[];
  invalidatePattern: (pattern: string) => void;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;
const STORAGE_KEY = 'news-cache';

export function useNewsCache(): UseNewsCacheResult {
  const [cache, setCache] = useState<Record<string, CacheEntry>>({});
  const [stats, setStats] = useState<CacheStats>({
    size: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
  });

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedCache = JSON.parse(stored);
        // Clean expired entries on load
        const now = Date.now();
        const cleanCache: Record<string, CacheEntry> = {};
        
        Object.entries(parsedCache).forEach(([key, entry]) => {
          const cacheEntry = entry as CacheEntry;
          if (now - cacheEntry.timestamp < cacheEntry.ttl) {
            cleanCache[key] = cacheEntry;
          }
        });
        
        setCache(cleanCache);
        setStats(prev => ({ ...prev, size: Object.keys(cleanCache).length }));
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }, []);

  // Save cache to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }, [cache]);

  // Update stats when cache changes
  useEffect(() => {
    setStats(prev => ({ ...prev, size: Object.keys(cache).length }));
  }, [cache]);

  // Get data from cache
  const get = useCallback((key: string): NewsArticle[] | null => {
    const entry = cache[key];
    const now = Date.now();

    if (!entry) {
      setStats(prev => ({
        ...prev,
        misses: prev.misses + 1,
        hitRate: prev.hits + prev.misses + 1 > 0 
          ? Math.round((prev.hits / (prev.hits + prev.misses + 1)) * 100)
          : 0,
      }));
      return null;
    }

    // Check if entry is expired
    if (now - entry.timestamp > entry.ttl) {
      // Remove expired entry
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
      
      setStats(prev => ({
        ...prev,
        misses: prev.misses + 1,
        hitRate: prev.hits + prev.misses + 1 > 0 
          ? Math.round((prev.hits / (prev.hits + prev.misses + 1)) * 100)
          : 0,
      }));
      return null;
    }

    setStats(prev => ({
      ...prev,
      hits: prev.hits + 1,
      hitRate: prev.hits + 1 + prev.misses > 0 
        ? Math.round(((prev.hits + 1) / (prev.hits + 1 + prev.misses)) * 100)
        : 0,
    }));
    
    return entry.data;
  }, [cache]);

  // Set data in cache
  const set = useCallback((key: string, data: NewsArticle[], ttl: number = DEFAULT_TTL) => {
    setCache(prev => {
      const newCache = { ...prev };
      const now = Date.now();
      
      // Add new entry
      newCache[key] = {
        data,
        timestamp: now,
        ttl,
      };
      
      // Clean expired entries
      Object.keys(newCache).forEach(cacheKey => {
        const entry = newCache[cacheKey];
        if (now - entry.timestamp > entry.ttl) {
          delete newCache[cacheKey];
        }
      });
      
      // Enforce cache size limit (LRU-like behavior)
      const keys = Object.keys(newCache);
      if (keys.length > MAX_CACHE_SIZE) {
        // Remove oldest entries
        const sortedKeys = keys.sort((a, b) => 
          newCache[a].timestamp - newCache[b].timestamp
        );
        
        const keysToRemove = sortedKeys.slice(0, keys.length - MAX_CACHE_SIZE);
        keysToRemove.forEach(keyToRemove => {
          delete newCache[keyToRemove];
        });
      }
      
      return newCache;
    });
  }, []);

  // Check if key exists and is valid
  const has = useCallback((key: string): boolean => {
    const entry = cache[key];
    if (!entry) return false;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Remove expired entry
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
      return false;
    }
    
    return true;
  }, [cache]);

  // Remove specific key
  const remove = useCallback((key: string) => {
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[key];
      return newCache;
    });
  }, []);

  // Clear all cache
  const clear = useCallback(() => {
    setCache({});
    setStats({
      size: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
    });
  }, []);

  // Get all cache keys
  const keys = useCallback((): string[] => {
    return Object.keys(cache);
  }, [cache]);

  // Invalidate cache entries by pattern
  const invalidatePattern = useCallback((pattern: string) => {
    setCache(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (key.includes(pattern)) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  }, []);

  return {
    cache,
    stats,
    get,
    set,
    has,
    remove,
    clear,
    keys,
    invalidatePattern,
  };
}