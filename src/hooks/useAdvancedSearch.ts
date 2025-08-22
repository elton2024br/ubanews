import { useState, useEffect, useCallback, useMemo } from 'react';
import { announceToScreenReader } from '@/utils/accessibility';

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

// Mock search results for demonstration
const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'Nova trilha ecológica inaugurada na Praia do Félix',
    summary: 'Trilha de 2km oferece vista panorâmica da costa e promove turismo sustentável em Ubatuba.',
    category: 'Turismo',
    author: 'Maria Silva',
    publishedAt: '2024-01-15T10:30:00Z',
    imageUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=ecological%20trail%20beach%20ubatuba%20brazil%20nature&image_size=landscape_4_3',
    tags: ['ecoturismo', 'trilha', 'sustentabilidade'],
    readTime: 3,
    views: 1250
  },
  {
    id: '2',
    title: 'Festival de Inverno movimenta centro histórico',
    summary: 'Evento cultural reúne artistas locais e atrai milhares de visitantes para Ubatuba.',
    category: 'Cultura',
    author: 'João Santos',
    publishedAt: '2024-01-14T15:45:00Z',
    imageUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=winter%20festival%20historic%20center%20ubatuba%20cultural%20event&image_size=landscape_4_3',
    tags: ['festival', 'cultura', 'música'],
    readTime: 4,
    views: 2100
  },
  {
    id: '3',
    title: 'Projeto de preservação marinha ganha reconhecimento',
    summary: 'Iniciativa local para proteção dos corais recebe prêmio nacional de sustentabilidade.',
    category: 'Meio Ambiente',
    author: 'Ana Costa',
    publishedAt: '2024-01-13T09:15:00Z',
    imageUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=marine%20conservation%20coral%20reef%20ubatuba%20ocean%20protection&image_size=landscape_4_3',
    tags: ['meio ambiente', 'conservação', 'oceano'],
    readTime: 5,
    views: 890
  }
];

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

  // Mock search function - in real app, this would call an API
  const performSearch = useCallback(async (
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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Filter mock results based on query and filters
      let filteredResults = mockResults;

      if (query.trim()) {
        const searchTerm = query.toLowerCase();
        filteredResults = mockResults.filter(result =>
          result.title.toLowerCase().includes(searchTerm) ||
          result.summary.toLowerCase().includes(searchTerm) ||
          result.category.toLowerCase().includes(searchTerm) ||
          result.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Apply filters
      filters.forEach(filter => {
        switch (filter.type) {
          case 'category': {
            filteredResults = filteredResults.filter(result =>
              result.category.toLowerCase() === filter.value.toLowerCase()
            );
            break;
          }
          case 'date': {
            // Mock date filtering - in real app, would parse filter.value
            const now = new Date();
            const filterDate = new Date(now.getTime() - (parseInt(filter.value.replace(/\D/g, '')) * 24 * 60 * 60 * 1000));
            filteredResults = filteredResults.filter(result =>
              new Date(result.publishedAt) >= filterDate
            );
            break;
          }
          case 'tag': {
            filteredResults = filteredResults.filter(result =>
              result.tags.includes(filter.value)
            );
            break;
          }
        }
      });

      // Pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedResults = filteredResults.slice(startIndex, endIndex);
      const hasMore = endIndex < filteredResults.length;

      setSearchState(prev => ({
        ...prev,
        results: page === 1 ? paginatedResults : [...prev.results, ...paginatedResults],
        isLoading: false,
        totalResults: filteredResults.length,
        currentPage: page,
        hasMore
      }));

      // Save successful search to history
      if (query.trim()) {
        saveSearchToHistory(query);
      }

      // Announce results to screen readers
      const resultCount = filteredResults.length;
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
  }, [pageSize, saveSearchToHistory]);

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