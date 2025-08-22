import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateAriaLabel } from "@/utils/accessibility";

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground">
      {/* Top notification bar */}
      <div className="bg-primary/90 text-center py-2 text-sm">
        📍 Você está em Ubatuba. Fique sempre informado
      </div>
      
      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">📰 Ubatuba Reage</div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="hover:text-primary-foreground/80 transition-colors">Início</a>
            <a href="#" className="hover:text-primary-foreground/80 transition-colors">Sugestões</a>
            <a href="#" className="hover:text-primary-foreground/80 transition-colors">Arquivo Semanal</a>
            <a href="#" className="hover:text-primary-foreground/80 transition-colors">Categorias</a>
            <a href="#" className="hover:text-primary-foreground/80 transition-colors">Bairros</a>
          </nav>
          
          {/* Search and Menu */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <Input
                type="text"
                placeholder="Buscar notícias..."
                className="w-64 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-foreground/60" />
            </div>
            <Button variant="secondary" size="sm">
              Entrar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              aria-label={generateAriaLabel('menu', 'open')}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;