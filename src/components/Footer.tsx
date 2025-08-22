import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail, ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer 
      id="footer"
      className="bg-vote-section text-white"
      role="contentinfo"
      aria-label="Rodapé do site"
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <div className="text-xl font-bold mb-4">📰 Ubatuba Reage</div>
            <p className="text-white/80 text-sm mb-4">
              Seu portal de notícias local em Ubatuba.
            </p>
            <div className="flex space-x-3" role="list" aria-label="Redes sociais">
              <a href="#" aria-label="Facebook" className="hover:text-white transition-colors">
                <Facebook className="w-5 h-5 text-white/60 hover:text-white cursor-pointer transition-colors" />
              </a>
              <a href="#" aria-label="Instagram" className="hover:text-white transition-colors">
                <Instagram className="w-5 h-5 text-white/60 hover:text-white cursor-pointer transition-colors" />
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-white transition-colors">
                <Twitter className="w-5 h-5 text-white/60 hover:text-white cursor-pointer transition-colors" />
              </a>
              <a href="#" aria-label="YouTube" className="hover:text-white transition-colors">
                <Youtube className="w-5 h-5 text-white/60 hover:text-white cursor-pointer transition-colors" />
              </a>
            </div>
          </div>
          
          {/* Sections */}
          <nav aria-label="Navegação de seções">
            <h3 className="font-semibold mb-4">Seções</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="/" className="hover:text-white transition-colors">Início</a></li>
              <li><a href="/categories" className="hover:text-white transition-colors">Categorias</a></li>
              <li><a href="/search" className="hover:text-white transition-colors">Busca</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contato</a></li>
            </ul>
          </nav>
          
          {/* Categories */}
          <nav aria-label="Navegação de categorias">
            <h3 className="font-semibold mb-4">Categorias</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="/categories" className="hover:text-white transition-colors">Todas as Categorias</a></li>
              <li><a href="/categories/politica" className="hover:text-white transition-colors">Política</a></li>
              <li><a href="/categories/saude" className="hover:text-white transition-colors">Saúde</a></li>
              <li><a href="/categories/educacao" className="hover:text-white transition-colors">Educação</a></li>
              <li><a href="/categories/meio-ambiente" className="hover:text-white transition-colors">Meio Ambiente</a></li>
            </ul>
          </nav>
          
          {/* Contact */}
          <address>
            <h3 className="font-semibold mb-4">Contato</h3>
            <ul className="space-y-3 text-sm text-white/80 not-italic">
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>contato@ubatubareage.com.br</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>(12) 3832-1234</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>Av. Iperoig, 314 - Centro, Ubatuba/SP</span>
              </li>
            </ul>
          </address>
        </div>
        
        <div className="border-t border-white/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-white/60">
            <p>© 2024 Ubatuba Reage. Todos os direitos reservados.</p>
            <nav className="flex space-x-4 mt-4 md:mt-0">
              <a href="/privacy" className="hover:text-white transition-colors">Política de Privacidade</a>
              <a href="/terms" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="/about" className="hover:text-white transition-colors">Sobre Nós</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;