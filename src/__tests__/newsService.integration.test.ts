import { describe, it, expect, beforeEach } from 'vitest';
import newsService from '@/services/newsService';

// Integration tests for NewsService without external dependencies

describe('NewsService integration', () => {
  beforeEach(() => {
    newsService.clearCache();
    newsService.setDynamicMode(false); // use static data
  });

  it('returns static articles when dynamic mode disabled', async () => {
    const result = await newsService.getPublicNews({ limit: 2 });
    expect(result.success).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('caches repeated calls', async () => {
    await newsService.getPublicNews({ limit: 1 });
    const statsBefore = newsService.getStats();
    await newsService.getPublicNews({ limit: 1 });
    const statsAfter = newsService.getStats();
    expect(statsAfter.cacheHits).toBeGreaterThan(statsBefore.cacheHits);
  });
});
