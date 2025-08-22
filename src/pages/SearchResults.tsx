import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Filter, SortAsc, SortDesc, Grid, List, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MobileNewsCard } from '@/components/MobileNewsCard';
import AdvancedSearch from '@/components/AdvancedSearch';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { useButtonInteractions } from '@/hooks/useMicrointeractions';
import { cn } from '@/lib/utils';
import { announceToScreenReader } from '@/utils/accessibility';

interface SearchFilter {
  id: string;
  label: string;
  value: string;
  type: 'category' | 'date' | 'author' | 'tag';
}

type SortOption = 'relevance' | 'date' | 'views' | 'title';
type ViewMode = 'grid' | 'list';

const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const { createButtonProps } = useButtonInteractions();
  
  const {
    query,
    filters,
    results,
    isLoading,
    error,
    totalResults,
    hasMore,
    suggestions,
    search,
    loadMore,
    clearSearch
  } = useAdvancedSearch({ enableAutoSearch: false });

  // Initialize search from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlFilters: SearchFilter[] = [];
    
    // Parse category filter
    const category = searchParams.get('category');
    if (category) {
      urlFilters.push({
        id: `category-${category}`,
        label: category,
        value: category,
        type: 'category'
      });
    }
    
    // Parse date filter
    const date = searchParams.get('date');
    if (date) {
      const dateLabels: Record<string, string> = {
        '1h': 'Última hora',
        '1d': 'Hoje',
        '7d': 'Esta semana',
        '30d': 'Este mês',
        '365d': 'Este ano'
      };
      
      urlFilters.push({
        id: `date-${date}`,
        label: dateLabels[date] || date,
        value: date,
        type: 'date'
      });
    }
    
    if (urlQuery || urlFilters.length > 0) {
      search(urlQuery, urlFilters);
    }
  }, [searchParams, search]);

  // Update URL when search changes
  const handleSearch = (newQuery: string, newFilters: SearchFilter[]) => {
    const params = new URLSearchParams();
    
    if (newQuery.trim()) {
      params.set('q', newQuery.trim());
    }
    
    newFilters.forEach(filter => {
      if (filter.type === 'category') {
        params.set('category', filter.value);
      } else if (filter.type === 'date') {
        params.set('date', filter.value);
      }
    });
    
    setSearchParams(params);
    search(newQuery, newFilters);
  };

  // Sort results
  const sortedResults = React.useMemo(() => {
    if (!results.length) return [];
    
    const sorted = [...results].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date': {
          comparison = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
          break;
        }
        case 'views': {
          comparison = a.views - b.views;
          break;
        }
        case 'title': {
          comparison = a.title.localeCompare(b.title, 'pt-BR');
          break;
        }
        case 'relevance':
        default: {
          // Mock relevance score based on query match
          const aScore = query ? (
            (a.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 0) +
            (a.summary.toLowerCase().includes(query.toLowerCase()) ? 1 : 0)
          ) : 0;
          const bScore = query ? (
            (b.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 0) +
            (b.summary.toLowerCase().includes(query.toLowerCase()) ? 1 : 0)
          ) : 0;
          comparison = aScore - bScore;
          break;
        }
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [results, sortBy, sortOrder, query]);

  // Handle sort change
  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    
    announceToScreenReader(`Ordenando por ${newSortBy} em ordem ${sortOrder === 'asc' ? 'crescente' : 'decrescente'}`);
  };

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    announceToScreenReader(`Modo de visualização alterado para ${mode === 'grid' ? 'grade' : 'lista'}`);
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="border border-border rounded-lg p-4">
          <div className="flex gap-4">
            <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex gap-2 mt-3">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              {...createButtonProps({
                onClick: () => window.history.back(),
                hapticType: 'light'
              })}
              className={cn(
                'flex items-center gap-2',
                createButtonProps({ onClick: () => window.history.back() }).className
              )}
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            
            <h1 className="text-xl font-bold flex-1">
              Resultados da Busca
            </h1>
          </div>
          
          {/* Search Bar */}
          <AdvancedSearch
            onSearch={handleSearch}
            suggestions={suggestions}
            className="mb-4"
          />
          
          {/* Search Info */}
          {(query || filters.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {query && (
                <span>
                  Buscando por: <strong className="text-foreground">"{query}"</strong>
                </span>
              )}
              {filters.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.map(filter => (
                    <Badge key={filter.id} variant="secondary" className="text-xs">
                      {filter.label}
                    </Badge>
                  ))}
                </div>
              )}
              {totalResults > 0 && (
                <span className="ml-auto">
                  {totalResults} resultado{totalResults !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Controls */}
        {results.length > 0 && (
          <div className="flex items-center justify-between mb-6 gap-4">
            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Ordenar por:
              </span>
              <div className="flex gap-1">
                {(['relevance', 'date', 'views', 'title'] as SortOption[]).map((option) => {
                  const labels = {
                    relevance: 'Relevância',
                    date: 'Data',
                    views: 'Visualizações',
                    title: 'Título'
                  };
                  
                  return (
                    <Button
                      key={option}
                      variant={sortBy === option ? 'default' : 'outline'}
                      size="sm"
                      {...createButtonProps({
                        onClick: () => handleSortChange(option),
                        hapticType: 'light'
                      })}
                      className={cn(
                        'flex items-center gap-1 text-xs',
                        createButtonProps({ onClick: () => handleSortChange(option) }).className
                      )}
                    >
                      {labels[option]}
                      {sortBy === option && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-3 h-3" /> : 
                          <SortDesc className="w-3 h-3" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {/* View Mode Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                {...createButtonProps({
                  onClick: () => handleViewModeChange('grid'),
                  hapticType: 'light'
                })}
                className={cn(
                  'p-2',
                  createButtonProps({ onClick: () => handleViewModeChange('grid') }).className
                )}
                aria-label="Visualização em grade"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                {...createButtonProps({
                  onClick: () => handleViewModeChange('list'),
                  hapticType: 'light'
                })}
                className={cn(
                  'p-2',
                  createButtonProps({ onClick: () => handleViewModeChange('list') }).className
                )}
                aria-label="Visualização em lista"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading && results.length === 0 ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-destructive mb-4">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium">Erro na busca</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              {...createButtonProps({
                onClick: () => search(query, filters),
                hapticType: 'medium'
              })}
              className={createButtonProps({ onClick: () => search(query, filters) }).className}
            >
              Tentar novamente
            </Button>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Nenhum resultado encontrado</h2>
            <p className="text-muted-foreground mb-4">
              {query ? `Não encontramos resultados para "${query}"` : 'Faça uma busca para ver os resultados'}
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Dicas para melhorar sua busca:</p>
              <ul className="list-disc list-inside space-y-1 max-w-md mx-auto">
                <li>Verifique a ortografia das palavras</li>
                <li>Use termos mais gerais</li>
                <li>Remova alguns filtros</li>
                <li>Tente sinônimos ou palavras relacionadas</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {/* Results Grid/List */}
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            )}>
              {sortedResults.map((result) => (
                <MobileNewsCard
                  key={result.id}
                  title={result.title}
                  summary={result.summary}
                  category={result.category}
                  author={result.author}
                  publishedAt={result.publishedAt}
                  imageUrl={result.imageUrl}
                  readTime={result.readTime}
                  views={result.views}
                  className={cn(
                    viewMode === 'list' && 'flex gap-4 p-4 border border-border rounded-lg'
                  )}
                />
              ))}
            </div>
            
            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  {...createButtonProps({
                    onClick: loadMore,
                    hapticType: 'medium',
                    animationPreset: 'scaleIn'
                  })}
                  disabled={isLoading}
                  className={cn(
                    'min-w-32',
                    createButtonProps({ onClick: loadMore }).className
                  )}
                >
                  {isLoading ? 'Carregando...' : 'Carregar mais'}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SearchResults;