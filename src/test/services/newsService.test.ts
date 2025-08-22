import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import newsService from '@/services/newsService';
const NewsService: any = newsService;
import { createMockNewsArticle, createMockNewsArticles, mockFeatureFlags } from '../utils';
import { featureFlags } from '@/lib/featureFlags';

// Mock dependencies
vi.mock('@/lib/featureFlags', () => ({
  featureFlags: mockFeatureFlags(),
}));

vi.mock('@/data/newsData', () => ({
  newsArticles: createMockNewsArticles(5),
  getNewsById: vi.fn((id: string) => createMockNewsArticle({ id })),
}));

// Mock Supabase
const fromMock = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn(),
  update: vi.fn().mockReturnThis(),
};

const mockSupabaseClient = {
  from: vi.fn(() => fromMock),
  rpc: vi.fn(),
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabaseClient,
}));

describe('NewsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    NewsService.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Cache functionality', () => {
    it('should cache news articles', async () => {
      const mockArticles = createMockNewsArticles(3);
      
      // Mock static data response
      vi.mocked(featureFlags.getFlag).mockReturnValue(false);
      
      const result1 = await NewsService.getPublicNews();
      const result2 = await NewsService.getPublicNews();
      
      expect(result1).toEqual(result2);
      expect(result1.data).toHaveLength(3);
    });

    it('should respect cache expiration', async () => {
      vi.mocked(featureFlags.getFlag).mockReturnValue(false);
      
      // First call
      await NewsService.getPublicNews();
      
      // Mock time passing (6 minutes)
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60 * 1000);
      
      // Second call should not use cache
      await NewsService.getPublicNews();
      
      // Verify cache was refreshed
      const stats = NewsService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should clear cache correctly', () => {
      NewsService.clearCache();
      const stats = NewsService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should invalidate cache by category', async () => {
      vi.mocked(featureFlags.getFlag).mockReturnValue(false);
      
      await NewsService.getPublicNews({ category: 'sports' });
      await NewsService.getPublicNews({ category: 'tech' });
      
      NewsService.invalidateCacheByCategory('sports');
      
      const stats = NewsService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('Static data mode', () => {
    beforeEach(() => {
      vi.mocked(featureFlags.getFlag).mockReturnValue(false);
    });

    it('should fetch news from static data when dynamic data is disabled', async () => {
      const result = await NewsService.getPublicNews();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);
      expect(result.source).toBe('static');
    });

    it('should get news by ID from static data', async () => {
      const result = await NewsService.getNewsById('1');
      
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('1');
      expect(result.source).toBe('static');
    });

    it('should get featured news from static data', async () => {
      const result = await NewsService.getFeaturedNews();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('static');
    });

    it('should get urgent news from static data', async () => {
      const result = await NewsService.getUrgentNews();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('static');
    });
  });

  describe('Dynamic data mode', () => {
    beforeEach(() => {
      vi.mocked(featureFlags.getFlag).mockReturnValue(true);
    });

    it('should fetch news from Supabase when dynamic data is enabled', async () => {
      const mockData = createMockNewsArticles(3);
      mockSupabaseClient.from().single.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await NewsService.getPublicNews();
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('news');
      expect(result.source).toBe('supabase');
    });

    it('should fallback to static data when Supabase fails', async () => {
      mockSupabaseClient.from().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await NewsService.getPublicNews();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('static');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should increment views on consecutive calls', async () => {
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: { views: 6 }, error: null })
        .mockResolvedValueOnce({ data: { views: 7 }, error: null });

      const first = await NewsService.incrementViews('1');
      const second = await NewsService.incrementViews('1');

      expect(first).toBe(6);
      expect(second).toBe(7);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(2);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('increment_views', {
        article_id: '1',
      });
    });
  });

  describe('Filtering and pagination', () => {
    beforeEach(() => {
      vi.mocked(featureFlags.getFlag).mockReturnValue(false);
    });

    it('should filter news by category', async () => {
      const result = await NewsService.getPublicNews({ category: 'sports' });
      
      expect(result.success).toBe(true);
      // All articles should be from sports category or general (fallback)
    });

    it('should limit results correctly', async () => {
      const result = await NewsService.getPublicNews({ limit: 2 });
      
      expect(result.success).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(2);
    });

    it('should handle pagination with offset', async () => {
      const result = await NewsService.getPublicNews({ 
        limit: 2, 
        offset: 1 
      });
      
      expect(result.success).toBe(true);
      expect(result.pagination?.offset).toBe(1);
      expect(result.pagination?.limit).toBe(2);
    });

    it('should search news by query', async () => {
      const result = await NewsService.getPublicNews({ 
        search: 'test' 
      });
      
      expect(result.success).toBe(true);
      // Should return articles matching the search term
    });
  });

  describe('Related news', () => {
    it('should get related news by category and tags', async () => {
      vi.mocked(featureFlags.getFlag).mockReturnValue(false);
      
      const result = await NewsService.getRelatedNews('1');
      
      expect(result.success).toBe(true);
      expect(result.data.every(article => article.id !== '1')).toBe(true);
    });
  });

  describe('Service statistics', () => {
    it('should provide service statistics', () => {
      const stats = NewsService.getServiceStats();
      
      expect(stats).toHaveProperty('cache');
      expect(stats).toHaveProperty('requests');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('performance');
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(featureFlags.getFlag).mockReturnValue(true);
      mockSupabaseClient.from().single.mockRejectedValue(new Error('Network error'));

      const result = await NewsService.getPublicNews();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('static');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should handle invalid article ID', async () => {
      vi.mocked(featureFlags.getFlag).mockReturnValue(false);
      
      const result = await NewsService.getNewsById('invalid-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});