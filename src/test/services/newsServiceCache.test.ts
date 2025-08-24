import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockSupabaseClient } from '../utils';
import { NewsArticle } from '@/shared/types/news';

vi.mock('@/lib/supabaseClient');
import newsService from '@/services/newsService';

interface CacheEntry {
  data: NewsArticle[];
  timestamp: number;
  ttl: number;
}

interface NewsServiceWithCache {
  MAX_CACHE_SIZE: number;
  cache: Map<string, CacheEntry>;
}

describe('NewsService LRU cache', () => {
  const service = newsService as unknown as NewsServiceWithCache;
  const originalMax = service.MAX_CACHE_SIZE;

  beforeEach(() => {
    newsService.clearCache();
    service.MAX_CACHE_SIZE = 2;
  });

  afterEach(() => {
    service.MAX_CACHE_SIZE = originalMax;
    newsService.clearCache();
  });

  it('evicts least recently used item when limit is exceeded', async () => {
    await newsService.getPublicNews({ search: 'a' });
    await newsService.getPublicNews({ search: 'b' });

    // Access "a" again to mark it as recently used
    await newsService.getPublicNews({ search: 'a' });

    // Add another entry to trigger eviction of "b"
    await newsService.getPublicNews({ search: 'c' });

    const keys = Array.from(service.cache.keys());
    expect(keys).toContain(JSON.stringify({ search: 'a' }));
    expect(keys).toContain(JSON.stringify({ search: 'c' }));
    expect(keys).not.toContain(JSON.stringify({ search: 'b' }));
  });
});
