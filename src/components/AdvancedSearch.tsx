import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Filter, Mic, X, Calendar, Tag, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useButtonInteractions, useFormInteractions } from '@/hooks/useMicrointeractions';
import { announceToScreenReader, generateAriaLabel } from '@/utils/accessibility';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'query' | 'category' | 'tag' | 'trending';
  count?: number;
}

interface SearchFilter {
  id: string;
  label: string;
  value: string;
  type: 'category' | 'date' | 'author' | 'tag';
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: SearchFilter[]) => void;
  onClose?: () => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  className?: string;
}

// Mock data for suggestions
const mockSuggestions: SearchSuggestion[] = [
  { id: '1', text: 'praias ubatuba', type: 'trending', count: 245 },
  { id: '2', text: 'turismo', type: 'category', count: 189 },
  { id: '3', text: 'eventos culturais', type: 'query', count: 156 },
  { id: '4', text: 'política local', type: 'category', count: 134 },
  { id: '5', text: 'meio ambiente', type: 'tag', count: 98 }
];

const categories = [
  'Política', 'Economia', 'Esportes', 'Cultura', 'Turismo', 'Saúde', 'Educação', 'Meio Ambiente'
];

const dateFilters = [
  { label: 'Última hora', value: '1h' },
  { label: 'Hoje', value: '1d' },
  { label: 'Esta semana', value: '7d' },
  { label: 'Este mês', value: '30d' },
  { label: 'Este ano', value: '365d' }
];

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onClose,
  placeholder = 'Buscar notícias em Ubatuba...',
  suggestions = mockSuggestions,
  recentSearches = [],
  className
}) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestion[]>(suggestions);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  
  // Microinteractions hooks
  const { createButtonProps } = useButtonInteractions();
  const { createFieldProps } = useFormInteractions();

  // Voice search setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        announceToScreenReader(`Busca por voz capturada: ${transcript}`);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
        announceToScreenReader('Erro na busca por voz');
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Filter suggestions based on query
  useEffect(() => {
    if (query.trim()) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions(suggestions.slice(0, 5));
      setShowSuggestions(query.length === 0 && inputRef.current === document.activeElement);
    }
  }, [query, suggestions]);

  // Handle voice search
  const handleVoiceSearch = useCallback(() => {
    if (!recognitionRef.current) {
      announceToScreenReader('Busca por voz não disponível neste navegador');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      announceToScreenReader('Iniciando busca por voz. Fale agora.');
      recognitionRef.current.start();
    }
  }, [isListening]);

  // Handle search submission
  const handleSearch = useCallback((searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      onSearch(finalQuery.trim(), activeFilters);
      setShowSuggestions(false);
      announceToScreenReader(`Buscando por: ${finalQuery}`);
    }
  }, [query, activeFilters, onSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  }, [handleSearch]);

  // Handle filter toggle
  const toggleFilter = useCallback((filter: SearchFilter) => {
    setActiveFilters(prev => {
      const exists = prev.find(f => f.id === filter.id);
      if (exists) {
        return prev.filter(f => f.id !== filter.id);
      } else {
        return [...prev, filter];
      }
    });
  }, []);

  // Handle filter removal
  const removeFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  // Keyboard navigation for suggestions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowFilters(false);
      setSelectedSuggestionIndex(-1);
      onClose?.();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && filteredSuggestions[selectedSuggestionIndex]) {
        handleSuggestionSelect(filteredSuggestions[selectedSuggestionIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
      }
    }
  }, [handleSearch, onClose, selectedSuggestionIndex, filteredSuggestions, showSuggestions, handleSuggestionSelect]);

  // Get suggestion icon
  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'category':
        return <Tag className="w-4 h-4 text-blue-500" />;
      case 'tag':
        return <Tag className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={cn('relative w-full max-w-2xl mx-auto', className)} role="search">
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
          
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedSuggestionIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            {...createFieldProps()}
            className={cn(
              'pl-10 pr-20 h-12 text-base',
              'border-2 border-border rounded-full',
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              createFieldProps().className
            )}
            aria-label={generateAriaLabel('search-input', 'Campo de busca avançada')}
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            aria-owns={showSuggestions ? 'search-suggestions' : undefined}
            aria-activedescendant={selectedSuggestionIndex >= 0 ? `suggestion-${selectedSuggestionIndex}` : undefined}
            role="combobox"
            autoComplete="off"
          />
          
          {/* Voice Search Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            {...createButtonProps({
              onClick: handleVoiceSearch,
              hapticType: 'medium',
              animationPreset: 'pulse'
            })}
            className={cn(
              'absolute right-12 h-8 w-8 p-0',
              isListening && 'text-red-500 animate-pulse',
              createButtonProps({ onClick: handleVoiceSearch }).className
            )}
            aria-label={generateAriaLabel('voice-search', isListening ? 'Parar busca por voz' : 'Iniciar busca por voz')}
            aria-pressed={isListening}
            disabled={!recognitionRef.current}
            title={!recognitionRef.current ? 'Busca por voz não disponível neste navegador' : undefined}
          >
            <Mic className="w-4 h-4" aria-hidden="true" />
          </Button>
          
          {/* Filter Toggle Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            {...createButtonProps({
              onClick: () => {
                setShowFilters(!showFilters);
                announceToScreenReader(showFilters ? 'Filtros ocultados' : 'Filtros exibidos');
              },
              hapticType: 'light',
              animationPreset: 'scaleIn'
            })}
            className={cn(
              'absolute right-2 h-8 w-8 p-0',
              showFilters && 'text-primary',
              createButtonProps({ onClick: () => setShowFilters(!showFilters) }).className
            )}
            aria-label={generateAriaLabel('filter-toggle', 'Alternar filtros de busca')}
            aria-expanded={showFilters}
            aria-controls={showFilters ? 'search-filters' : undefined}
          >
            <Filter className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
        
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Filtros ativos">
            {activeFilters.map((filter) => (
              <Badge
                key={filter.id}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
                role="status"
                aria-label={`Filtro ativo: ${filter.label}`}
              >
                <span>{filter.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  {...createButtonProps({
                    onClick: () => {
                      removeFilter(filter.id);
                      announceToScreenReader(`Filtro ${filter.label} removido`);
                    },
                    hapticType: 'light'
                  })}
                  className="h-4 w-4 p-0 hover:bg-transparent focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  aria-label={generateAriaLabel('remove-filter', `Remover filtro ${filter.label}`)}
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          id="search-suggestions"
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          role="listbox"
          aria-label={generateAriaLabel('suggestions', 'Sugestões de busca')}
        >
          {filteredSuggestions.length > 0 ? (
            <div className="p-2">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  id={`suggestion-${index}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors",
                    "hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    selectedSuggestionIndex === index && "bg-accent"
                  )}
                  role="option"
                  aria-selected={selectedSuggestionIndex === index}
                  tabIndex={-1}
                >
                  <span aria-hidden="true">{getSuggestionIcon(suggestion.type)}</span>
                  <span className="flex-1 text-sm">{suggestion.text}</span>
                  {suggestion.count && (
                    <span className="text-xs text-muted-foreground" aria-label={`${suggestion.count} resultados`}>
                      {suggestion.count} resultados
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm" role="status">
              Nenhuma sugestão encontrada
            </div>
          )}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div
          ref={filtersRef}
          id="filters-panel"
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 p-4"
          role="dialog"
          aria-labelledby="filters-title"
          aria-modal="false"
        >
          <div className="space-y-4">
            <h2 id="filters-title" className="sr-only">Filtros de busca</h2>
            
            {/* Categories */}
            <fieldset>
              <legend className="text-sm font-medium mb-2">Categorias</legend>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="category-legend">
                <span id="category-legend" className="sr-only">Selecione uma ou mais categorias</span>
                {categories.map((category) => {
                  const filter: SearchFilter = {
                    id: `category-${category}`,
                    label: category,
                    value: category,
                    type: 'category'
                  };
                  const isActive = activeFilters.some(f => f.id === filter.id);
                  
                  return (
                    <Button
                      key={category}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      {...createButtonProps({
                        onClick: () => {
                          toggleFilter(filter);
                          const action = isActive ? 'removida' : 'adicionada';
                          announceToScreenReader(`Categoria ${category} ${action}`);
                        },
                        hapticType: 'light'
                      })}
                      className={cn(
                        'h-8 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2',
                        createButtonProps({ onClick: () => toggleFilter(filter) }).className
                      )}
                      aria-pressed={isActive}
                      aria-label={generateAriaLabel('category-filter', `Filtrar por categoria ${category}`)}
                    >
                      {category}
                    </Button>
                  );
                })}
              </div>
            </fieldset>
            
            {/* Date Filters */}
            <fieldset>
              <legend className="text-sm font-medium mb-2">Período</legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="date-legend">
                <span id="date-legend" className="sr-only">Selecione um período de tempo</span>
                {dateFilters.map((dateFilter) => {
                  const filter: SearchFilter = {
                    id: `date-${dateFilter.value}`,
                    label: dateFilter.label,
                    value: dateFilter.value,
                    type: 'date'
                  };
                  const isActive = activeFilters.some(f => f.id === filter.id);
                  
                  return (
                    <Button
                      key={dateFilter.value}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      {...createButtonProps({
                        onClick: () => {
                          toggleFilter(filter);
                          announceToScreenReader(`Período selecionado: ${dateFilter.label}`);
                        },
                        hapticType: 'light'
                      })}
                      className={cn(
                        'h-8 text-xs focus:ring-2 focus:ring-primary focus:ring-offset-2',
                        createButtonProps({ onClick: () => toggleFilter(filter) }).className
                      )}
                      role="radio"
                      aria-checked={isActive}
                      aria-label={generateAriaLabel('date-filter', `Filtrar por período ${dateFilter.label}`)}
                    >
                      <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
                      {dateFilter.label}
                    </Button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;