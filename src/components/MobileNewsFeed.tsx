import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { useNavigate } from 'react-router-dom';
import { MobileNewsCard } from './MobileNewsCard';
import { SkeletonCard, SkeletonGrid } from './SkeletonCard';
import SkeletonLoader from './SkeletonLoader';
import { FadeIn, StaggeredList, ScaleOnHover, PulseOnClick, RippleEffect } from './AnimatedTransitions';
import { useInfiniteScroll, usePaginatedData } from '@/hooks/use-infinite-scroll';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Filter, TrendingUp, Search, X, Grid, List, ChevronDown, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  NewsArticle,
  NewsCategory,
  NewsSortBy,
  NewsVariant,
  NewsFilters,
  NewsLoadingState,
  NewsCardProps
} from '@/shared/types/news';
import { newsArticles, getNewsByCategory, getFeaturedNews, searchNews } from '../data/newsData';
import { formatRelativeDate } from '../utils/dateUtils';
import { usePublicNews } from '../hooks/usePublicNews';
import { useDynamicData, useMigrationMetrics } from '../hooks/useFeatureFlags';
import { useButtonInteractions, useCardInteractions } from '../hooks/useMicrointeractions';
import { useVirtualization } from '../hooks/useVirtualization';
import type {
  NewsFeedProps,
  PullToRefreshState,
  TouchGestureState,
  KeyboardNavigationState
} from '../types/components';

interface MobileNewsFeedProps extends NewsFeedProps {
  title?: string;
  icon?: React.ReactNode;
  showFilters?: boolean;
  variant?: NewsVariant;
  initialData?: NewsArticle[];
  onLoadMore?: (page: number) => Promise<NewsArticle[]>;
  enableDynamicData?: boolean;
}

const sortOptions = ['Mais recentes', 'Mais lidas', 'Relevância'];

export const MobileNewsFeed: React.FC<MobileNewsFeedProps> = ({
  title = '📰 Notícias de Ubatuba',
  icon,
  showFilters = true,
  variant = 'grid',
  initialData = newsArticles,
  onLoadMore,
  enableDynamicData = true
}) => {
  // State management with proper typing (moved to top)
  const [filters, setFilters] = useState<NewsFilters>({
    category: 'Todas',
    searchTerm: '',
    sortBy: 'Mais recentes'
  });
  
  // Feature flags e migração progressiva
  const { useDynamic } = useDynamicData();
  const { recordLoadTime, recordError } = useMigrationMetrics();
  
  // Hook para dados dinâmicos (quando habilitado)
  const {
    data: dynamicNews,
    loading: dynamicLoading,
    error: dynamicError,
    refetch: refetchDynamic,
    loadMore: loadMoreDynamic,
    hasMore: hasMoreDynamic
  } = usePublicNews({
    enabled: enableDynamicData && useDynamic,
    limit: 12,
    category: filters.category !== 'Todas' ? filters.category : undefined,
    search: filters.searchTerm || undefined
  });
  
  // Determina qual fonte de dados usar
  const shouldUseDynamic = enableDynamicData && useDynamic;
  const newsSource = shouldUseDynamic ? dynamicNews : initialData;
  const isLoadingNews = shouldUseDynamic ? dynamicLoading : false;
  const newsError = shouldUseDynamic ? dynamicError : null;
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  // Loading states
  const [loadingState, setLoadingState] = useState<NewsLoadingState>({
    loading: false,
    initialLoading: true,
    loadingMore: false,
    refreshing: false,
    error: null
  });
  
  // Pull-to-refresh state
  const [pullToRefreshState, setPullToRefreshState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    threshold: 80
  });
  
  // Touch gesture state
  const [touchState, setTouchState] = useState<TouchGestureState>({
    startY: 0,
    currentY: 0,
    deltaY: 0,
    velocity: 0,
    timestamp: 0
  });
  
  // Keyboard navigation state
  const [keyboardNav, setKeyboardNav] = useState<KeyboardNavigationState>({
    currentIndex: -1,
    maxIndex: 0,
    isNavigating: false
  });
  // Refs with proper typing
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastTouchRef = useRef<TouchGestureState>(touchState);
  const navigate = useNavigate();

  // Memoized categories with proper typing (usa fonte de dados apropriada)
  const categories = useMemo(() => {
    const sourceData = newsSource || newsArticles;
    const categoryCount = sourceData.reduce((acc, news) => {
      const category = news.category as NewsCategory;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<NewsCategory, number>);

    const categoryLabels: Record<NewsCategory | 'Todas', string> = {
      'Todas': 'Todas',
      'Gastronomia': 'Gastronomia',
      'Cultura': 'Cultura', 
      'Meio Ambiente': 'Meio Ambiente',
      'Ecoturismo': 'Ecoturismo',
      'Turismo': 'Turismo'
    };

    return [
      { value: 'Todas' as const, label: categoryLabels.Todas, count: sourceData.length },
      ...Object.entries(categoryCount).map(([category, count]) => ({
        value: category as NewsCategory,
        label: categoryLabels[category as NewsCategory],
        count
      }))
    ].map(cat => cat.value);
  }, [newsSource]);

  // Mock load more function for pagination
  const mockLoadMore = async (page: number): Promise<NewsArticle[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return shuffled news data for pagination simulation
    const shuffled = [...newsArticles].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Initial loading effect with staggered animation
  useEffect(() => {
    const startTime = Date.now();
    const timer = setTimeout(() => {
      const loadTime = Date.now() - startTime;
      recordLoadTime(loadTime);
      setLoadingState(prev => ({ ...prev, initialLoading: false }));
    }, shouldUseDynamic ? 800 : 1200); // Faster loading for dynamic data
    return () => clearTimeout(timer);
  }, [shouldUseDynamic, recordLoadTime]);
  
  // Effect para monitorar erros de dados dinâmicos
  useEffect(() => {
    if (dynamicError) {
      recordError();
      console.warn('Erro nos dados dinâmicos, usando fallback estático:', dynamicError);
    }
  }, [dynamicError, recordError]);

  const {
    data: newsItems,
    loading,
    error,
    hasMore,
    refresh,
    fetchMore
  } = usePaginatedData({
    initialData: newsSource,
    fetchPage: shouldUseDynamic ? loadMoreDynamic : (onLoadMore || mockLoadMore),
    pageSize: 6
  });

  const loadMore = fetchMore;
  
  // Combina estados de loading
  const combinedLoading = loading || isLoadingNews;
  const combinedError = error || newsError;
  const combinedHasMore = shouldUseDynamic ? hasMoreDynamic : hasMore;

  const { targetRef } = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore: loadMore
  });

  // Memoized filtered and sorted news with improved performance
  const filteredNews = useMemo(() => {
    let filtered = filters.category === 'Todas' 
      ? newsItems 
      : getNewsByCategory(newsItems, filters.category);
    
    // Apply search filter with better performance
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      const searchTerms = searchLower.split(' ').filter(term => term.length > 0);
      
      filtered = filtered.filter(news => {
        const searchableText = `${news.title} ${news.excerpt} ${news.tags?.join(' ') || ''}`.toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      });
    }
    
    // Apply sorting with type safety
    return filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'Mais recentes':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'Mais lidas':
          return (b.views || 0) - (a.views || 0);
        case 'Relevância':
          return a.readTime - b.readTime;
        default:
          return 0;
      }
    });
  }, [newsItems, filters]);

  // Memoized pagination
  const { totalPages, displayedNews } = useMemo(() => {
    const total = Math.ceil(filteredNews.length / itemsPerPage);
    const displayed = filteredNews.slice(0, currentPage * itemsPerPage);
    return { totalPages: total, displayedNews: displayed };
  }, [filteredNews, currentPage, itemsPerPage]);

  // Memoized featured and regular news split
  const { featuredNews, regularNews } = useMemo(() => {
    const featured = displayedNews.slice(0, 3);
    const regular = displayedNews.slice(3);
    return { featuredNews: featured, regularNews: regular };
  }, [displayedNews]);

  // Handle article click to navigate to detail page
  const handleArticleClick = useCallback((article: NewsArticle) => {
    navigate(`/news/${article.id}`);
  }, [navigate]);

  // Enhanced load more handler with proper state management
  const handleLoadMore = useCallback(async () => {
    if (loadingState.loadingMore || currentPage >= totalPages) return;
    
    setLoadingState(prev => ({ ...prev, loadingMore: true, error: null }));
    
    try {
      const startTime = Date.now();
      // Simulate API call with smooth transition
      await new Promise(resolve => setTimeout(resolve, 600));
      setCurrentPage(prev => prev + 1);
      const loadTime = Date.now() - startTime;
      recordLoadTime(loadTime);
    } catch (err) {
      recordError();
      setLoadingState(prev => ({ 
        ...prev, 
        error: 'Erro ao carregar mais notícias. Tente novamente.' 
      }));
      console.error('Erro ao carregar mais notícias:', err);
    } finally {
      setLoadingState(prev => ({ ...prev, loadingMore: false }));
    }
  }, [loadingState.loadingMore, currentPage, totalPages, recordLoadTime, recordError]);

  const handleSearchToggle = useCallback(() => {
    setShowSearch(prev => {
      if (prev) {
        setFilters(f => ({ ...f, searchTerm: '' }));
      }
      return !prev;
    });
  }, []);

  const handleSearchClear = useCallback(() => {
    setFilters(prev => ({ ...prev, searchTerm: '' }));
  }, []);

  // Enhanced keyboard navigation with proper state management
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const { currentIndex, maxIndex } = keyboardNav;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < maxIndex - 1) {
          setKeyboardNav(prev => ({ ...prev, currentIndex: prev.currentIndex + 1, isNavigating: true }));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          setKeyboardNav(prev => ({ ...prev, currentIndex: prev.currentIndex - 1, isNavigating: true }));
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex >= 0 && currentIndex < filteredNews.length) {
          handleArticleClick(filteredNews[currentIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (filters.searchTerm) {
          setFilters(prev => ({ ...prev, searchTerm: '' }));
        }
        setKeyboardNav({ currentIndex: -1, maxIndex: 0, isNavigating: false });
        break;
      case 'Tab':
        setKeyboardNav(prev => ({ ...prev, isNavigating: true }));
        break;
    }
  }, [keyboardNav, filteredNews, filters.searchTerm, handleArticleClick]);

  // Convert NewsArticle to MobileNewsCard props
  const convertToCardProps = useCallback((article: NewsArticle) => ({
    title: article.title,
    summary: article.excerpt,
    date: formatRelativeDate(new Date(article.date)),
    category: article.category,
    readTime: `${article.readTime} min`,
    views: `${article.views} visualizações`,
    image: article.image.src,
    onClick: () => handleArticleClick(article),
    onShare: () => {
      if (navigator.share) {
        navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href
        });
      }
    },
    onBookmark: () => {
      // Implementar funcionalidade de bookmark
      console.log('Bookmark:', article.title);
    }
  }), [handleArticleClick]);

  // Enhanced refresh handler with proper state management
  const handleRefresh = useCallback(async () => {
    if (pullToRefreshState.isRefreshing) return;
    
    setPullToRefreshState(prev => ({
      ...prev,
      isRefreshing: true,
      pullDistance: 0,
      isPulling: false
    }));
    
    setLoadingState(prev => ({ ...prev, refreshing: true, error: null }));
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    try {
      const startTime = Date.now();
      
      if (shouldUseDynamic && refetchDynamic) {
        // Refresh dados dinâmicos
        await refetchDynamic();
      } else {
        // Simulate API call with smooth transition para dados estáticos
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      const refreshTime = Date.now() - startTime;
      recordLoadTime(refreshTime);
      
      // Reset to first page on refresh
      setCurrentPage(1);
    } catch (err) {
      recordError();
      setLoadingState(prev => ({ 
        ...prev, 
        error: 'Erro ao atualizar as notícias. Tente novamente.' 
      }));
      console.error('Erro ao atualizar as notícias:', err);
    } finally {
      setPullToRefreshState(prev => ({ ...prev, isRefreshing: false }));
      setLoadingState(prev => ({ ...prev, refreshing: false }));
    }
  }, [pullToRefreshState.isRefreshing, shouldUseDynamic, refetchDynamic, recordLoadTime, recordError]);

  // Pull-to-refresh handlers
  // Enhanced pull-to-refresh handlers with proper typing
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      const touch = e.touches[0];
      const timestamp = Date.now();
      
      setTouchState({
        startY: touch.clientY,
        currentY: touch.clientY,
        deltaY: 0,
        velocity: 0,
        timestamp
      });
      
      lastTouchRef.current = {
        startY: touch.clientY,
        currentY: touch.clientY,
        deltaY: 0,
        velocity: 0,
        timestamp
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0 && touchState.startY > 0) {
      const touch = e.touches[0];
      const currentY = touch.clientY;
      const deltaY = currentY - touchState.startY;
      const timestamp = Date.now();
      const timeDelta = timestamp - touchState.timestamp;
      const velocity = timeDelta > 0 ? deltaY / timeDelta : 0;
      
      if (deltaY > 0) {
        e.preventDefault();
        const distance = Math.min(deltaY * 0.5, 120);
        
        setTouchState(prev => ({
          ...prev,
          currentY,
          deltaY,
          velocity,
          timestamp
        }));
        
        setPullToRefreshState(prev => ({
          ...prev,
          pullDistance: distance,
          isPulling: distance > 50
        }));
      }
    }
  }, [touchState.startY, touchState.timestamp]);

  // Destructure pull-to-refresh state for easier access
  const { isPulling, pullDistance, threshold, isRefreshing } = pullToRefreshState;

  const handleTouchEnd = useCallback(() => {
    if (isPulling && pullDistance > threshold) {
      handleRefresh();
    } else {
      setPullToRefreshState(prev => ({
        ...prev,
        pullDistance: 0,
        isPulling: false
      }));
    }

    setTouchState({
      startY: 0,
      currentY: 0,
      deltaY: 0,
      velocity: 0,
      timestamp: 0
    });
  }, [isPulling, pullDistance, threshold, handleRefresh]);

  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => (
      <div style={style}>
        <MobileNewsCard
          {...convertToCardProps(filteredNews[index])}
          variant="compact"
          className="w-full"
        />
      </div>
    ),
    [filteredNews, convertToCardProps]
  );

  const renderNewsGrid = useMemo(() => {
    if (variant === 'list') {
      return (
        <List
          height={600}
          itemCount={filteredNews.length}
          itemSize={150}
          width="100%"
        >
          {Row}
        </List>
      );
    }

    if (variant === 'featured') {
      const featuredArticles = getFeaturedNews(displayedNews);
      const regularArticles = displayedNews.filter(news => !news.featured);
      
      return (
        <div className="space-y-6">
          {featuredNews.length > 0 && (
            <MobileNewsCard
              {...convertToCardProps(featuredNews[0])}
              variant="featured"
              className="w-full"
            />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {regularNews.map((news) => (
              <MobileNewsCard
                key={news.id}
                {...convertToCardProps(news)}
                variant="default"
              />
            ))}
          </div>
        </div>
      );
    }

    // Default grid layout
    return (
      <div className={`
        grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6
        transition-all duration-500 ease-in-out
        ${loadingState.initialLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
      `}>
        {!loadingState.initialLoading && filteredNews.map((news, index) => (
          <MobileNewsCard
            key={news.id}
            {...convertToCardProps(news)}
            variant="default"
          />
        ))}
      </div>
    );
  }, [variant, filteredNews, displayedNews, featuredNews, regularNews, loadingState.initialLoading, convertToCardProps, Row]);



  return (
    <section 
      className="py-6 md:py-12 bg-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      ref={scrollContainerRef}
    >
      {/* Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm transition-all duration-300"
          style={{
            height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
            transform: `translateY(${isPulling && !isRefreshing ? pullDistance - 60 : 0}px)`
          }}
        >
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <RefreshCw 
              className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''} ${pullDistance > 60 ? 'rotate-180' : ''} transition-transform duration-200`} 
            />
            <span className="text-sm font-medium">
              {isRefreshing ? 'Atualizando...' : pullDistance > 60 ? 'Solte para atualizar' : 'Puxe para atualizar'}
            </span>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            {icon || <TrendingUp className="w-5 h-5 text-accent" />}
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSearchToggle}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchToggle()}
              aria-label={showSearch ? 'Fechar busca' : 'Abrir busca'}
              aria-expanded={showSearch}
              className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Search className="h-4 w-4" />
              Buscar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleRefresh()}
              disabled={loading || isRefreshing}
              aria-label={loading || isRefreshing ? 'Atualizando notícias...' : 'Atualizar notícias'}
              className="text-accent hover:text-accent/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <FadeIn delay={100} className="mb-6" role="search">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Buscar notícias..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                aria-label="Campo de busca de notícias"
                aria-describedby="search-help"
                className="pl-10 pr-10 transition-all duration-200 hover:border-gray-300"
                autoFocus
              />
              <div id="search-help" className="sr-only">
                Digite para buscar notícias por título, conteúdo ou tags
              </div>
              {filters.searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSearchClear}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchClear()}
                  aria-label="Limpar busca"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
            {filters.searchTerm && (
              <p className="text-sm text-muted-foreground mt-2">
                {filteredNews.length} resultado{filteredNews.length !== 1 ? 's' : ''} encontrado{filteredNews.length !== 1 ? 's' : ''} para "{filters.searchTerm}"
              </p>
            )}
          </FadeIn>
        )}

        {/* Filter Bar */}
        {showFilters && (
          <div className="mb-6">
            {/* Mobile Filter Toggle */}
            <div className="md:hidden mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </span>
                <Badge variant="secondary">
                  {filters.category} • {filters.sortBy}
                </Badge>
              </Button>
            </div>

            {/* Filter Options */}
            <FadeIn delay={200} className={`space-y-4 ${showFilterMenu ? 'block' : 'hidden md:block'}`}>
              {/* Categories */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Categoria:</p>
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtros de categoria">
                  {categories.map((category, index) => (
                    <FadeIn key={category} delay={250 + index * 50}>
                      <RippleEffect
                        onClick={() => setFilters(prev => ({ ...prev, category }))}
                        className="inline-block"
                      >
                        <Button
                          variant={filters.category === category ? 'default' : 'outline'}
                          size="sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setFilters(prev => ({ ...prev, category }));
                            }
                          }}
                          role="tab"
                          aria-selected={filters.category === category}
                          aria-controls={`news-panel-${category}`}
                          tabIndex={filters.category === category ? 0 : -1}
                          className="text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
                        >
                          {category}
                        </Button>
                      </RippleEffect>
                    </FadeIn>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Ordenar por:</p>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option, index) => (
                    <FadeIn key={option} delay={350 + index * 50}>
                      <RippleEffect
                        onClick={() => setFilters(prev => ({ ...prev, sortBy: option }))}
                        className="inline-block"
                      >
                        <Button
                          variant={filters.sortBy === option ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs transform hover:scale-105 active:scale-95"
                        >
                          {option}
                        </Button>
                      </RippleEffect>
                    </FadeIn>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        )}

        {/* Error State */}
        {combinedError && (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">Erro ao carregar notícias</p>
            {shouldUseDynamic && (
              <p className="text-sm text-amber-600 mb-4">
                💡 Tentando usar dados estáticos como fallback...
              </p>
            )}
            <Button onClick={handleRefresh} variant="outline">
              Tentar novamente
            </Button>
          </div>
        )}

        {/* News Content */}
        {!error && (
          <>
            <div 
              role="tabpanel"
              id={`news-panel-${filters.category}`}
              aria-labelledby={`tab-${filters.category}`}
            >
              {loadingState.initialLoading ? (
                <FadeIn delay={200}>
                  <SkeletonLoader 
                    variant={variant === 'list' ? 'list' : variant === 'featured' ? 'featured' : 'card'} 
                    count={variant === 'featured' ? 4 : 6}
                    className={variant === 'list' ? 'space-y-4' : 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'}
                  />
                </FadeIn>
              ) : (
                <FadeIn delay={300}>
                  <StaggeredList staggerDelay={100}>
                    {renderNewsGrid}
                  </StaggeredList>
                </FadeIn>
              )}
            </div>

            {/* Loading More State */}
            {loadingState.loadingMore && !loadingState.initialLoading && (
              <div className="mt-8 animate-in fade-in-0 duration-300">
                <SkeletonLoader 
                  variant={variant === 'list' ? 'list' : 'card'} 
                  count={3}
                  className={variant === 'list' ? 'space-y-4' : 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'}
                />
              </div>
            )}
            
            {/* Infinite Scroll Trigger */}
            <div ref={targetRef} className="h-4 mt-8" />
            
            {/* Load More Button (fallback) */}
            {combinedHasMore && !combinedLoading && !loadingState.loadingMore && (
              <FadeIn delay={400} className="text-center mt-8">
                <PulseOnClick
                  onClick={async () => {
                    setLoadingState(prev => ({ ...prev, loadingMore: true }));
                    await new Promise(resolve => setTimeout(resolve, 400));
                    loadMore();
                    setLoadingState(prev => ({ ...prev, loadingMore: false }));
                  }}
                  className="inline-block"
                >
                  <Button 
                    onKeyDown={(e) => e.key === 'Enter' && !combinedLoading && !loadingState.loadingMore && loadMore()}
                    variant="outline" 
                    size="lg"
                    aria-label={loadingState.loadingMore ? 'Carregando mais notícias...' : 'Carregar mais notícias'}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:shadow-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <span>Carregar mais notícias</span>
                      {shouldUseDynamic && <span className="text-xs opacity-75">(Dinâmico)</span>}
                    </div>
                  </Button>
                </PulseOnClick>
              </FadeIn>
            )}
            
            {/* End of Content */}
            {!combinedHasMore && filteredNews.length > 0 && (
              <div className="text-center mt-8 py-4">
                <p className="text-muted-foreground text-sm">
                  Você chegou ao fim das notícias{shouldUseDynamic ? ' (dinâmicas)' : ''}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default MobileNewsFeed;