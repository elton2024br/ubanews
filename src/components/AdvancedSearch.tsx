import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Filter, Mic, X, Calendar, Tag, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useButtonInteractions, useFormInteractions } from '@/hooks/useMicrointeractions';
import { announceToScreenReader } from '@/utils/accessibility';

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
  
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
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
      onClose?.();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch, onClose]);

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
    <div className={cn('relative w-full max-w-2xl mx-auto', className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-5 h-5 text-muted-foreground pointer-events-none" />
          
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
            aria-label="Campo de busca"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            role="combobox"
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
            aria-label={isListening ? 'Parar busca por voz' : 'Iniciar busca por voz'}
            disabled={!recognitionRef.current}
          >
            <Mic className="w-4 h-4" />
          </Button>
          
          {/* Filter Toggle Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            {...createButtonProps({
              onClick: () => setShowFilters(!showFilters),
              hapticType: 'light',
              animationPreset: 'scaleIn'
            })}
            className={cn(
              'absolute right-2 h-8 w-8 p-0',
              showFilters && 'text-primary',
              createButtonProps({ onClick: () => setShowFilters(!showFilters) }).className
            )}
            aria-label="Filtros de busca"
            aria-expanded={showFilters}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {activeFilters.map((filter) => (
              <Badge
                key={filter.id}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                {filter.label}
                <Button
                  variant="ghost"
                  size="sm"
                  {...createButtonProps({
                    onClick: () => removeFilter(filter.id),
                    hapticType: 'light'
                  })}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  aria-label={`Remover filtro ${filter.label}`}
                >
                  <X className="w-3 h-3" />
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
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Sugestões de busca"
        >
          {filteredSuggestions.length > 0 ? (
            <div className="p-2">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent rounded-lg transition-colors"
                  role="option"
                  aria-selected={false}
                >
                  {getSuggestionIcon(suggestion.type)}
                  <span className="flex-1 text-sm">{suggestion.text}</span>
                  {suggestion.count && (
                    <span className="text-xs text-muted-foreground">
                      {suggestion.count} resultados
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nenhuma sugestão encontrada
            </div>
          )}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-4">
            {/* Categories */}
            <div>
              <h4 className="text-sm font-medium mb-2">Categorias</h4>
              <div className="flex flex-wrap gap-2">
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
                        onClick: () => toggleFilter(filter),
                        hapticType: 'light'
                      })}
                      className={cn(
                        'h-8 text-xs',
                        createButtonProps({ onClick: () => toggleFilter(filter) }).className
                      )}
                    >
                      {category}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {/* Date Filters */}
            <div>
              <h4 className="text-sm font-medium mb-2">Período</h4>
              <div className="flex flex-wrap gap-2">
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
                        onClick: () => toggleFilter(filter),
                        hapticType: 'light'
                      })}
                      className={cn(
                        'h-8 text-xs',
                        createButtonProps({ onClick: () => toggleFilter(filter) }).className
                      )}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      {dateFilter.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;