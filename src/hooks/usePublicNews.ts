import { useState, useEffect, useCallback, useRef } from 'react';
import newsService from '@/services/newsService';
import { NewsArticle } from '@/types/news';
import { useNewsCache } from './useNewsCache';
import { useDynamicData } from './useFeatureFlags';

export interface UsePublicNewsOptions {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
  autoRefresh?: boolean;
  refreshInterval?: number;
  refetchOnWindowFocus?: boolean;
  enabled?: boolean;
}

export interface UsePublicNewsResult {
  data: NewsArticle[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_OPTIONS: Required<UsePublicNewsOptions> = {
  limit: 10,
  offset: 0,
  category: '',
  search: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
  autoRefresh: false,
  refreshInterval: 30000, // 30 seconds
  refetchOnWindowFocus: true,
  enabled: true,
};

export function usePublicNews(options: UsePublicNewsOptions = {}): UsePublicNewsResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { isEnabled: isDynamicEnabled } = useDynamicData();
  const cache = useNewsCache();
  
  const [data, setData] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  // Generate cache key based on options
  const getCacheKey = useCallback(() => {
    const params = new URLSearchParams();
    if (opts.limit) params.set('limit', opts.limit.toString());
    if (opts.offset) params.set('offset', opts.offset.toString());
    if (opts.category) params.set('category', opts.category);
    if (opts.search) params.set('search', opts.search);
    if (opts.sortBy) params.set('sortBy', opts.sortBy);
    if (opts.sortOrder) params.set('sortOrder', opts.sortOrder);
    
    return `news-public-${params.toString()}`;
  }, [opts]);
  
  // Fetch data function
  const fetchData = useCallback(async (isRefresh = false) => {
    if (!opts.enabled || (!isRefresh && loading)) return;
    
    const cacheKey = getCacheKey();
    
    // Check cache first (only for initial load, not refresh)
    if (!isRefresh && cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      if (cachedData && mountedRef.current) {
        setData(cachedData);
        setHasMore(cachedData.length >= opts.limit);
        setTotalCount(cachedData.length);
        return;
      }
    }
    
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const result = await NewsService.getPublicNews({
        limit: opts.limit,
        offset: opts.offset,
        category: opts.category || undefined,
        search: opts.search || undefined,
        sortBy: opts.sortBy,
        sortOrder: opts.sortOrder,
      });
      
      if (!mountedRef.current) return;
      
      if (result.success && result.data) {
        setData(result.data);
        setHasMore(result.data.length >= opts.limit);
        setTotalCount(result.totalCount || result.data.length);
        
        // Cache the result
        cache.set(cacheKey, result.data);
      } else {
        setError(result.error || 'Failed to fetch news');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [opts, loading, cache, getCacheKey]);
  
  // Load more data
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    const newOffset = opts.offset + data.length;
    const cacheKey = getCacheKey().replace(
      `offset=${opts.offset}`,
      `offset=${newOffset}`
    );
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await NewsService.getPublicNews({
        limit: opts.limit,
        offset: newOffset,
        category: opts.category || undefined,
        search: opts.search || undefined,
        sortBy: opts.sortBy,
        sortOrder: opts.sortOrder,
      });
      
      if (!mountedRef.current) return;
      
      if (result.success && result.data) {
        const newData = [...data, ...result.data];
        setData(newData);
        setHasMore(result.data.length >= opts.limit);
        setTotalCount(result.totalCount || newData.length);
        
        // Cache the combined result
        cache.set(cacheKey, newData);
      } else {
        setError(result.error || 'Failed to load more news');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [data, hasMore, loading, opts, cache, getCacheKey]);
  
  // Refetch data
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);
  
  // Refresh data (alias for refetch)
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);
  
  // Handle window focus refetch
  useEffect(() => {
    if (!opts.refetchOnWindowFocus) return;
    
    const handleFocus = () => {
      if (mountedRef.current && !loading) {
        refetch();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [opts.refetchOnWindowFocus, refetch, loading]);
  
  // Auto refresh interval
  useEffect(() => {
    if (!opts.autoRefresh || opts.refreshInterval <= 0) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }
    
    refreshIntervalRef.current = setInterval(() => {
      if (mountedRef.current && !loading) {
        refetch();
      }
    }, opts.refreshInterval);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [opts.autoRefresh, opts.refreshInterval, refetch, loading]);
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [
    opts.limit,
    opts.offset,
    opts.category,
    opts.search,
    opts.sortBy,
    opts.sortOrder,
    opts.enabled,
    isDynamicEnabled,
  ]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);
  
  return {
    data,
    loading,
    error,
    hasMore,
    totalCount,
    refetch,
    loadMore,
    refresh,
  };
}