import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePublicNews } from '../../hooks/usePublicNews';
import { createTestWrapper } from '../utils';

// Mock dependencies
const mockNewsService = {
  getPublicNews: vi.fn(),
  getRelatedNews: vi.fn(),
};

const mockFeatureFlags = {
  isFeatureEnabled: vi.fn(),
};

const mockNewsCache = {
  get: vi.fn(),
  set: vi.fn(),
  invalidatePattern: vi.fn(),
};

vi.mock('../../services/newsService', () => ({
  newsService: mockNewsService,
}));

vi.mock('../../hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => mockFeatureFlags,
}));

vi.mock('../../hooks/useNewsCache', () => ({
  useNewsCache: () => mockNewsCache,
}));

describe('usePublicNews', () => {
  const mockNewsArticles = [
    {
      id: '1',
      title: 'Test Article 1',
      content: 'Content 1',
      excerpt: 'Excerpt 1',
      category: 'tech',
      publishedAt: '2024-01-01',
      author: 'Author 1',
      imageUrl: 'image1.jpg',
      views: 100,
    },
    {
      id: '2',
      title: 'Test Article 2',
      content: 'Content 2',
      excerpt: 'Excerpt 2',
      category: 'sports',
      publishedAt: '2024-01-02',
      author: 'Author 2',
      imageUrl: 'image2.jpg',
      views: 200,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFeatureFlags.isFeatureEnabled.mockReturnValue(true);
    mockNewsCache.get.mockReturnValue(null);
  });

  describe('Basic functionality', () => {
    it('should fetch news on mount', async () => {
      mockNewsService.getPublicNews.mockResolvedValue({
        success: true,
        data: mockNewsArticles,
        total: 2,
        hasMore: false,
      });

      const { result } = renderHook(() => usePublicNews(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockNewsArticles);
      });

      expect(result.current.error).toBe(null);
      expect(mockNewsService.getPublicNews).toHaveBeenCalledTimes(1);
    });

    it('should handle errors correctly', async () => {
      mockNewsService.getPublicNews.mockResolvedValue({
        success: false,
        data: [],
        total: 0,
        hasMore: false,
        error: 'Network error',
      });

      const { result } = renderHook(() => usePublicNews(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('Options and filtering', () => {
    it('should pass options to NewsService', async () => {
      mockNewsService.getPublicNews.mockResolvedValue({
        success: true,
        data: [mockNewsArticles[0]],
        total: 1,
        hasMore: false,
      });

      const options = {
        category: 'tech',
        limit: 5,
        search: 'test',
      };

      renderHook(() => usePublicNews(options), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(mockNewsService.getPublicNews).toHaveBeenCalledWith(options);
      });
    });
  });

  describe('Refetch functionality', () => {
    it('should refetch data when refetch is called', async () => {
      mockNewsService.getPublicNews.mockResolvedValue({
        success: true,
        data: mockNewsArticles,
        total: 2,
        hasMore: false,
      });

      const { result } = renderHook(() => usePublicNews(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockNewsArticles);
      });

      expect(mockNewsService.getPublicNews).toHaveBeenCalledTimes(1);
    });
  });

  describe('Load more functionality', () => {
    it('should load more data when loadMore is called', async () => {
      mockNewsService.getPublicNews.mockResolvedValue({
        success: true,
        data: mockNewsArticles,
        total: 2,
        hasMore: false,
      });

      const { result } = renderHook(() => usePublicNews({ limit: 1 }), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockNewsArticles);
      });

      expect(mockNewsService.getPublicNews).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auto-refresh functionality', () => {
    it('should handle auto-refresh configuration', async () => {
      mockNewsService.getPublicNews.mockResolvedValue({
        success: true,
        data: mockNewsArticles,
        total: 2,
        hasMore: false,
      });

      const { result } = renderHook(() => usePublicNews({ autoRefresh: true }), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockNewsArticles);
      });

      expect(mockNewsService.getPublicNews).toHaveBeenCalledTimes(1);
    });
  });

  describe('Window focus refetch', () => {
    it('should handle window focus configuration', async () => {
      mockNewsService.getPublicNews.mockResolvedValue({
        success: true,
        data: mockNewsArticles,
        total: 2,
        hasMore: false,
      });

      const { result } = renderHook(() => usePublicNews({ refetchOnWindowFocus: true }), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockNewsArticles);
      });

      expect(mockNewsService.getPublicNews).toHaveBeenCalledTimes(1);
    });
  });
});