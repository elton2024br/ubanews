import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

interface UseInfiniteScrollReturn {
  isFetching: boolean;
  setIsFetching: (fetching: boolean) => void;
  lastElementRef: (node: HTMLElement | null) => void;
}

export const useInfiniteScroll = (
  fetchMore: () => Promise<void> | void,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn => {
  const {
    threshold = 1.0,
    rootMargin = '100px',
    enabled = true
  } = options;

  const [isFetching, setIsFetching] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const fetchingRef = useRef(false);

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (!enabled || fetchingRef.current) return;
      
      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver(
        async (entries) => {
          if (entries[0].isIntersecting && !fetchingRef.current) {
            fetchingRef.current = true;
            setIsFetching(true);
            
            try {
              await fetchMore();
            } catch (error) {
              console.error('Error fetching more data:', error);
            } finally {
              fetchingRef.current = false;
              setIsFetching(false);
            }
          }
        },
        {
          threshold,
          rootMargin
        }
      );

      if (node) {
        observer.current.observe(node);
      }
    },
    [fetchMore, threshold, rootMargin, enabled]
  );

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  const setIsFetchingWrapper = useCallback((fetching: boolean) => {
    fetchingRef.current = fetching;
    setIsFetching(fetching);
  }, []);

  return {
    isFetching,
    setIsFetching: setIsFetchingWrapper,
    lastElementRef
  };
};

// Hook for managing paginated data with infinite scroll
interface UsePaginatedDataOptions<T> {
  initialData?: T[];
  pageSize?: number;
  fetchPage: (page: number, pageSize: number) => Promise<T[]>;
  enabled?: boolean;
}

interface UsePaginatedDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  fetchMore: () => Promise<void>;
  refresh: () => Promise<void>;
  lastElementRef: (node: HTMLElement | null) => void;
}

export const usePaginatedData = <T,>({
  initialData = [],
  pageSize = 10,
  fetchPage,
  enabled = true
}: UsePaginatedDataOptions<T>): UsePaginatedDataReturn<T> => {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(false);

  const fetchMore = useCallback(async () => {
    if (!enabled || loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await fetchPage(currentPage, pageSize);
      
      if (newData.length === 0) {
        setHasMore(false);
      } else {
        setData(prev => [...prev, ...newData]);
        setCurrentPage(prev => prev + 1);
        
        // If we got less than pageSize, we've reached the end
        if (newData.length < pageSize) {
          setHasMore(false);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('Error fetching page:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, fetchPage, enabled, loading, hasMore]);

  const refresh = useCallback(async () => {
    setData([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    
    if (enabled) {
      await fetchMore();
    }
  }, [fetchMore, enabled]);

  // Initial load
  useEffect(() => {
    if (enabled && !initialLoad && data.length === 0) {
      setInitialLoad(true);
      fetchMore();
    }
  }, [enabled, initialLoad, data.length, fetchMore]);

  const { lastElementRef } = useInfiniteScroll(fetchMore, {
    enabled: enabled && hasMore && !loading
  });

  return {
    data,
    loading,
    error,
    hasMore,
    fetchMore,
    refresh,
    lastElementRef
  };
};

export default useInfiniteScroll;