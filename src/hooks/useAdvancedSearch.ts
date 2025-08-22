import { useState, useEffect, useCallback, useMemo } from 'react';
import { announceToScreenReader } from '@/utils/accessibility';
import { supabase } from '@/lib/supabaseClient';

interface SearchFilter {
  id: string;
  label: string;
  value: string;
  type: 'category' | 'date' | 'author' | 'tag';
}

interface SearchResult {
  id: string;
  title: string;
  summary: string;
  category: string;
  author: string;
  publishedAt: string;
  imageUrl?: string;
  tags: string[];
  readTime: number;
  views: number;
}

interface SearchState {
  query: string;
  filters: SearchFilter[];
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  currentPage: number;
  hasMore: boolean;
}

interface UseAdvancedSearchOptions {
  debounceMs?: number;
  pageSize?: number;
  enableAutoSearch?: boolean;
}

export const useAdvancedSearch = (options: UseAdvancedSearchOptions = {}) => {
  const {
    debounceMs = 300,
    pageSize = 10,
    enableAutoSearch = false
  } = options;

  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    filters: [],
    results: [],
    isLoading: false,
    error: null,
    totalResults: 0,
    currentPage: 1,
    hasMore: false
  });

  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Debounced search effect
  useEffect(() => {
    if (!enableAutoSearch || !searchState.query.trim()) return;

    const timeoutId = setTimeout(() => {
      performSearch(searchState.query, searchState.filters, 1);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchState.query, searchState.filters, enableAutoSearch, debounceMs, performSearch]);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('ubatuba-search-history');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
      
      const savedRecent = localStorage.getItem('ubatuba-recent-searches');
      if (savedRecent) {
        setRecentSearches(JSON.parse(savedRecent));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, []);

  // Save search to history
  const saveSearchToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    const updatedHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 50);
    const updatedRecent = [query, ...recentSearches.filter(r => r !== query)].slice(0, 10);

    setSearchHistory(updatedHistory);
    setRecentSearches(updatedRecent);

    try {
      localStorage.setItem('ubatuba-search-history', JSON.stringify(updatedHistory));
      localStorage.setItem('ubatuba-recent-searches', JSON.stringify(updatedRecent));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }, [searchHistory, recentSearches]);

  // Search function that queries Supabase
  const performSearch = useCallback(
    async (
      query: string,
      filters: SearchFilter[],
      page: number = 1
    ) => {
      setSearchState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        ...(page === 1 && { results: [] })
      }));

      try {
        const category = filters.find(f => f.type === 'category')?.value;
        const date_range = filters.find(f => f.type === 'date')?.value;
        const author = filters.find(f => f.type === 'author')?.value;
        const tags = filters.filter(f => f.type === 'tag').map(f => f.value);

        const { data, error } = await supabase.rpc('search_news', {
          term: query,
          category,
          date_range,
          author,
          tags
        });

        if (error) throw error;

        const results = (data ?? []) as SearchResult[];
        const hasMore = results.length === pageSize;

        setSearchState(prev => ({
          ...prev,
          results: page === 1 ? results : [...prev.results, ...results],
          isLoading: false,
          totalResults: results.length,
          currentPage: page,
          hasMore
        }));

        if (query.trim()) {
          saveSearchToHistory(query);
        }

        const resultCount = results.length;
        announceToScreenReader(
          resultCount === 0
            ? 'Nenhum resultado encontrado'
            : `${resultCount} resultado${resultCount !== 1 ? 's' : ''} encontrado${resultCount !== 1 ? 's' : ''}`
        );
      } catch (error) {
        setSearchState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Erro ao realizar busca. Tente novamente.'
        }));
        announceToScreenReader('Erro ao realizar busca');
      }
    },
    [pageSize, saveSearchToHistory]
  );

  // Search function
  const search = useCallback((query: string, filters: SearchFilter[] = []) => {
    setSearchState(prev => ({
      ...prev,
      query,
      filters,
      currentPage: 1
    }));
    
    if (!enableAutoSearch) {
      performSearch(query, filters, 1);
    }
  }, [performSearch, enableAutoSearch]);

  // Load more results
  const loadMore = useCallback(() => {
    if (searchState.isLoading || !searchState.hasMore) return;
    
    const nextPage = searchState.currentPage + 1;
    performSearch(searchState.query, searchState.filters, nextPage);
  }, [searchState, performSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchState({
      query: '',
      filters: [],
      results: [],
      isLoading: false,
      error: null,
      totalResults: 0,
      currentPage: 1,
      hasMore: false
    });
  }, []);

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    setRecentSearches([]);
    try {
      localStorage.removeItem('ubatuba-search-history');
      localStorage.removeItem('ubatuba-recent-searches');
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  }, []);

  // Get search suggestions based on query
  const suggestions = useMemo(() => {
    if (!searchState.query.trim()) {
      return recentSearches.slice(0, 5).map(search => ({
        id: `recent-${search}`,
        text: search,
        type: 'query' as const,
        count: undefined
      }));
    }

    const query = searchState.query.toLowerCase();
    return searchHistory
      .filter(search => search.toLowerCase().includes(query))
      .slice(0, 5)
      .map(search => ({
        id: `history-${search}`,
        text: search,
        type: 'query' as const,
        count: undefined
      }));
  }, [searchState.query, searchHistory, recentSearches]);

  return {
    // State
    query: searchState.query,
    filters: searchState.filters,
    results: searchState.results,
    isLoading: searchState.isLoading,
    error: searchState.error,
    totalResults: searchState.totalResults,
    hasMore: searchState.hasMore,
    suggestions,
    recentSearches,
    
    // Actions
    search,
    loadMore,
    clearSearch,
    clearHistory
  };
};