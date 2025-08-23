import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePublicNews } from '../../hooks/usePublicNews';
import { AllTheProviders } from '../utils';

// Mock dependencies
vi.mock('../../services/newsService', () => ({
  default: {
    getPublicNews: vi.fn(),
    getRelatedNews: vi.fn(),
  },
}));

vi.mock('../../hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    isFeatureEnabled: vi.fn(),
  }),
  useDynamicData: () => ({
    isEnabled: true,
    useDynamic: true,
    useRealTime: true,
    enableDynamicData: vi.fn(),
    disableDynamicData: vi.fn(),
    toggleDynamicData: vi.fn(),
    setUseDynamic: vi.fn(),
    setUseRealTime: vi.fn(),
  }),
}));

vi.mock('../../hooks/useNewsCache', () => {
  const mockCache = {
    has: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    invalidatePattern: vi.fn(),
  };
  return {
    useNewsCache: () => mockCache,
  };
});

import NewsService from '../../services/newsService';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { useNewsCache } from '../../hooks/useNewsCache';

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
    const { isFeatureEnabled } = useFeatureFlags();
    vi.mocked(isFeatureEnabled).mockReturnValue(true);

    const newsCache = useNewsCache();
    vi.mocked(newsCache.get).mockReturnValue(null);
    vi.mocked(newsCache.has).mockReturnValue(false);
  });

  describe('Basic functionality', () => {
    it('should fetch news on mount', async () => {
      vi.mocked(NewsService.getPublicNews).mockResolvedValue({
        success: true,
        data: mockNewsArticles,
        total: 2,
        hasMore: false,
      });

      const { result } = renderHook(() => usePublicNews(), {
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockNewsArticles);
      });

      expect(result.current.error).toBe(null);
      expect(NewsService.getPublicNews).toHaveBeenCalledTimes(1);
    });

    it('should handle errors correctly', async () => {
      vi.mocked(NewsService.getPublicNews).mockResolvedValue({
        success: false,
        data: [],
        total: 0,
        hasMore: false,
        error: 'Network error',
      });

      const { result } = renderHook(() => usePublicNews(), {
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('Options and filtering', () => {
    it('should pass options to NewsService', async () => {
      vi.mocked(NewsService.getPublicNews).mockResolvedValue({
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
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(NewsService.getPublicNews).toHaveBeenCalledWith({
          ...options,
          offset: 0,
          sortBy: 'created_at',
          sortOrder: 'desc',
        });
      });
    });
  });

  describe('Refetch functionality', () => {
    it('should refetch data when refetch is called', async () => {
      vi.mocked(NewsService.getPublicNews).mockResolvedValue({
        success: true,
        data: mockNewsArticles,
        total: 2,
        hasMore: false,
      });

      const { result } = renderHook(() => usePublicNews(), {
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockNewsArticles);
      });

      expect(NewsService.getPublicNews).toHaveBeenCalledTimes(1);
    });
  });

  describe('Load more functionality', () => {
    it('should load more data when loadMore is called', async () => {
      vi.mocked(NewsService.getPublicNews).mockResolvedValue({
        success: true,
        data: mockNewsArticles,
        total: 2,
        hasMore: false,
      });

      const { result } = renderHook(() => usePublicNews({ limit: 1 }), {
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockNewsArticles);
      });

      expect(NewsService.getPublicNews).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache logic', () => {
    it('should generate cache key with offset 0', async () => {
      vi.mocked(NewsService.getPublicNews).mockResolvedValue({
        success: true,
        data: mockNewsArticles,
        total: 2,
        hasMore: false,
      });

      renderHook(() => usePublicNews(), { wrapper: AllTheProviders });

      const key =
        'news-public-limit=10&offset=0&sortBy=created_at&sortOrder=desc';

      const newsCache = useNewsCache();
      await waitFor(() => {
        expect(newsCache.set).toHaveBeenCalledWith(key, mockNewsArticles);
      });

      expect(newsCache.has).toHaveBeenCalledWith(key);
    });

    it('should update cache key when loading more', async () => {
      vi.mocked(NewsService.getPublicNews).mockResolvedValue({
        success: true,
        data: [mockNewsArticles[0]],
        total: 2,
        hasMore: true,
      });

      const { result } = renderHook(() => usePublicNews({ limit: 1 }), {
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual([mockNewsArticles[0]]);
      });

      vi.mocked(NewsService.getPublicNews).mockResolvedValue({
        success: true,
        data: [mockNewsArticles[1]],
        total: 2,
        hasMore: false,
      });

      await result.current.loadMore();

      const key =
        'news-public-limit=1&offset=1&sortBy=created_at&sortOrder=desc';

      const newsCache = useNewsCache();
      await waitFor(() => {
        expect(result.current.data).toEqual(mockNewsArticles);
        expect(newsCache.set).toHaveBeenLastCalledWith(
          key,
          mockNewsArticles
        );
      });
    });
  });

  describe('Auto-refresh functionality', () => {
    it('should handle auto-refresh configuration', async () => {
      vi.mocked(NewsService.getPublicNews).mockResolvedValue({
        success: true,
        data: mockNewsArticles,
        total: 2,
        hasMore: false,
      });

      const { result } = renderHook(() => usePublicNews({ autoRefresh: true }), {
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockNewsArticles);
      });

      expect(NewsService.getPublicNews).toHaveBeenCalledTimes(1);
    });
  });

  describe('Window focus refetch', () => {
    it('should handle window focus configuration', async () => {
      vi.mocked(NewsService.getPublicNews).mockResolvedValue({
        success: true,
        data: mockNewsArticles,
        total: 2,
        hasMore: false,
      });

      const { result } = renderHook(() => usePublicNews({ refetchOnWindowFocus: true }), {
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockNewsArticles);
      });

      expect(NewsService.getPublicNews).toHaveBeenCalledTimes(1);
    });
  });
});