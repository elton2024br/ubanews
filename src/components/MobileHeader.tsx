import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MobileThemeToggle } from './ThemeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import SkipLinks from './SkipLinks';
import AdvancedSearch from './AdvancedSearch';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { useButtonInteractions } from '@/hooks/useMicrointeractions';

interface SearchFilter {
  id: string;
  label: string;
  value: string;
  type: 'category' | 'date' | 'author' | 'tag';
}

interface MobileHeaderProps {
  onMenuToggle?: (isOpen: boolean) => void;
}

const MobileHeader = ({ onMenuToggle }: MobileHeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { containerRef } = useFocusManagement({ trapFocus: isMenuOpen });
  const { createButtonProps } = useButtonInteractions();

  const handleLoginClick = () => {
    navigate('/admin/login');
    setIsMenuOpen(false); // Close mobile menu if open
  };

  const handleMenuToggle = (open: boolean) => {
    setIsMenuOpen(open);
    onMenuToggle?.(open);
  };

  const handleSearch = (query: string, filters: SearchFilter[]) => {
    const params = new URLSearchParams();
    
    if (query.trim()) {
      params.set('q', query.trim());
    }
    
    filters.forEach(filter => {
      if (filter.type === 'category') {
        params.set('category', filter.value);
      } else if (filter.type === 'date') {
        params.set('date', filter.value);
      }
    });
    
    navigate(`/search?${params.toString()}`);
    setIsSearchOpen(false);
  };

  const handleQuickSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      <SkipLinks />
      <header 
        id="navigation"
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
        aria-label="Cabeçalho principal"
      >
      {/* Top notification bar - hidden on very small screens */}
      <div 
        className="bg-primary/90 text-primary-foreground text-center py-2 text-xs sm:text-sm hidden xs:block"
        role="banner"
        aria-label="Barra de notificação"
      >
        📍 Você está em Ubatuba. Fique sempre informado
      </div>
      
      {/* Main header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={handleMenuToggle}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden p-2 h-auto"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-[280px] sm:w-[350px]"
              ref={containerRef}
            >
              <SheetHeader>
                <SheetTitle>Menu de Navegação</SheetTitle>
              </SheetHeader>
              <nav 
                className="flex flex-col space-y-4 mt-6"
                role="navigation"
                aria-label="Menu principal"
              >
                <a 
                  href="#" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border"
                >
                  Início
                </a>
                <a 
                  href="#" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border"
                >
                  Sugestões
                </a>
                <a 
                  href="#" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border"
                >
                  Arquivo Semanal
                </a>
                <a 
                  href="#" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border"
                >
                  Categorias
                </a>
                <a 
                  href="#" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border"
                >
                  Bairros
                </a>
                
                {/* Mobile-only options */}
                <div className="pt-4 border-t border-border">
                  <Button variant="outline" className="w-full mb-3" onClick={handleLoginClick}>
                    Entrar
                  </Button>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tema</span>
                    <MobileThemeToggle />
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          
          {/* Logo - responsive sizing */}
          <div className="flex items-center space-x-2 flex-1 md:flex-none justify-center md:justify-start">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
              📰 Ubatuba Reage
            </div>
          </div>
          
          {/* Desktop Navigation - hidden on mobile */}
          <nav 
            className="hidden md:flex items-center space-x-6 lg:space-x-8"
            role="navigation"
            aria-label="Navegação principal"
          >
            <a href="#" className="hover:text-primary transition-colors text-sm lg:text-base">Início</a>
            <a href="#" className="hover:text-primary transition-colors text-sm lg:text-base">Sugestões</a>
            <a href="#" className="hover:text-primary transition-colors text-sm lg:text-base">Arquivo Semanal</a>
            <a href="#" className="hover:text-primary transition-colors text-sm lg:text-base">Categorias</a>
            <a href="#" className="hover:text-primary transition-colors text-sm lg:text-base">Bairros</a>
          </nav>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Search - expandable on mobile */}
            {isMobile ? (
              <div className="flex items-center">
                {isSearchOpen ? (
                  <div className="flex items-center space-x-2 animate-in slide-in-from-right-2">
                    <Input
                      id="mobile-search"
                      type="text"
                      placeholder="Buscar..."
                      className="w-32 sm:w-40 h-8 text-sm"
                      autoFocus
                      aria-label="Campo de busca móvel"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleQuickSearch(e.currentTarget.value);
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      {...createButtonProps({
                        onClick: () => setIsSearchOpen(false),
                        hapticType: 'light'
                      })}
                      className="p-1 h-8 w-8"
                      aria-label="Fechar busca"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    {...createButtonProps({
                      onClick: () => setIsSearchOpen(true),
                      hapticType: 'light',
                      animationPreset: 'pulse'
                    })}
                    className="p-2 h-auto"
                    aria-label="Buscar"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              /* Desktop Advanced Search */
              <div className="relative hidden sm:block" role="search">
                <AdvancedSearch
                  onSearch={handleSearch}
                  placeholder="Buscar notícias em Ubatuba..."
                  className="w-48 lg:w-64"
                />
              </div>
            )}
            
            {/* Desktop Theme Toggle */}
            <div className="hidden md:block">
              <MobileThemeToggle />
            </div>
            
            {/* Desktop Login Button */}
            <Button variant="default" size="sm" className="hidden md:inline-flex" onClick={handleLoginClick}>
              Entrar
            </Button>
          </div>
        </div>
      </div>
    </header>
    </>
  );
};

export default MobileHeader;