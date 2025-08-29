import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateAriaLabel } from "@/utils/accessibility";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";

const Header = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLoginClick = () => {
    navigate('/admin/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implementar busca
      console.log('Buscar:', searchQuery);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e as any);
    }
  };

  const handleMenuClick = () => {
    // Implementar abertura do menu mobile
    console.log('Menu mobile clicado');
  };

  return (
    <header className="bg-primary text-primary-foreground" role="banner">
      {/* Top notification bar */}
      <div 
        className="bg-primary/90 text-center py-2 text-sm"
        role="region"
        aria-label="Informações de localização"
      >
        <span aria-label="Localização: Ubatuba">
          📍 Você está em Ubatuba. Fique sempre informado
        </span>
      </div>
      
      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">
              <a 
                href="/" 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                aria-label="Ubatuba Reage - Página inicial"
              >
                <span role="img" aria-label="Ícone de jornal">📰</span>
                <span>Ubatuba Reage</span>
              </a>
            </h1>
          </div>
          
          {/* Navigation */}
          <nav 
            className="hidden md:flex items-center space-x-8"
            role="navigation"
            aria-label="Menu principal"
          >
            <a 
              href="/" 
              className="hover:text-primary-foreground/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 rounded px-2 py-1"
              aria-current="page"
            >
              Início
            </a>
            <a 
              href="/sugestoes" 
              className="hover:text-primary-foreground/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 rounded px-2 py-1"
            >
              Sugestões
            </a>
            <a 
              href="/arquivo" 
              className="hover:text-primary-foreground/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 rounded px-2 py-1"
            >
              Arquivo Semanal
            </a>
            <a 
              href="/categorias" 
              className="hover:text-primary-foreground/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 rounded px-2 py-1"
            >
              Categorias
            </a>
            <a 
              href="/bairros" 
              className="hover:text-primary-foreground/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 rounded px-2 py-1"
            >
              Bairros
            </a>
          </nav>
          
          {/* Search and Menu */}
          <div className="flex items-center space-x-4">
            <form 
              className="relative hidden sm:block"
              onSubmit={handleSearchSubmit}
              role="search"
              aria-label="Buscar notícias"
            >
              <label htmlFor="search-input" className="sr-only">
                Buscar notícias no site
              </label>
              <Input
                id="search-input"
                ref={searchInputRef}
                type="search"
                placeholder="Buscar notícias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-64 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus:ring-2 focus:ring-primary-foreground/50"
                aria-describedby="search-help"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-primary-foreground/10 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
                aria-label="Executar busca"
              >
                <Search className="w-4 h-4 text-primary-foreground/60" />
              </button>
              <div id="search-help" className="sr-only">
                Digite sua busca e pressione Enter ou clique no ícone de busca
              </div>
            </form>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleLoginClick}
              className="focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label="Acessar área administrativa"
            >
              Entrar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden focus:ring-2 focus:ring-primary-foreground/50"
              onClick={handleMenuClick}
              aria-label={generateAriaLabel('menu', 'open')}
              aria-expanded="false"
              aria-controls="mobile-menu"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;