import { describe, it, vi, expect } from 'vitest';
vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));
import NewsService from '@/services/newsService';

describe('NewsService feature flag updates', () => {
  it('updates dynamic mode and clears cache', () => {
    const setDynamicModeSpy = vi.spyOn(NewsService, 'setDynamicMode');
    const clearCacheSpy = vi.spyOn(NewsService, 'clearCache');

    NewsService.onFeatureFlagChange(true);

    expect(setDynamicModeSpy).toHaveBeenCalledWith(true);
    expect(clearCacheSpy).toHaveBeenCalled();
  });
});
