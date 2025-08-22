# Guia de Otimização Mobile-First - Portal Ubatuba News

## 1. Visão Geral do Projeto

Transformação do portal de notícias Ubatuba em uma versão mobile-first otimizada, priorizando performance, usabilidade e acessibilidade em dispositivos móveis. O projeto foca em criar uma experiência superior através de carregamento rápido, navegação intuitiva e design responsivo escalável.

## 2. Análise da Estrutura Atual

### 2.1 Estado Atual
- **Framework**: React 18.3.1 com TypeScript
- **Build Tool**: Vite com SWC
- **Styling**: Tailwind CSS com sistema de design customizado
- **Componentes**: Radix UI + shadcn/ui
- **Estrutura**: Desktop-first com adaptações responsivas

### 2.2 Pontos de Melhoria Identificados
- Navegação não otimizada para mobile
- Ausência de lazy loading para imagens
- Falta de skeleton screens
- Sem implementação de tema escuro
- Performance não otimizada para Core Web Vitals
- Navegação off-canvas não implementada
- Feed infinito ausente

## 3. Especificações Mobile-First

### 3.1 Estrutura de Layout Responsivo

#### Cabeçalho Fixo (Mobile)
```typescript
// Header Mobile Component
interface MobileHeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const MobileHeader = ({ isMenuOpen, onMenuToggle, searchQuery, onSearchChange }: MobileHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-primary/20">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Menu Hambúrguer */}
        <button 
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Logo Responsivo */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-primary-foreground">📰 Ubatuba</h1>
        </div>
        
        {/* Busca Simplificada */}
        <button className="p-2 rounded-lg hover:bg-primary/10 transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
```

#### Navegação Off-Canvas
```typescript
const OffCanvasMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Menu Lateral */}
      <nav className={`
        fixed top-0 left-0 h-full w-80 bg-card z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Menu</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Itens de Navegação */}
          <ul className="space-y-4">
            <li><a href="#" className="block py-3 px-4 hover:bg-muted rounded-lg transition-colors">Início</a></li>
            <li><a href="#" className="block py-3 px-4 hover:bg-muted rounded-lg transition-colors">Categorias</a></li>
            <li><a href="#" className="block py-3 px-4 hover:bg-muted rounded-lg transition-colors">Bairros</a></li>
            <li><a href="#" className="block py-3 px-4 hover:bg-muted rounded-lg transition-colors">Arquivo</a></li>
          </ul>
        </div>
      </nav>
    </>
  );
};
```

### 3.2 Componentes Otimizados

#### Card de Notícia Mobile-First
```typescript
interface MobileNewsCardProps {
  title: string;
  summary: string;
  category: string;
  date: string;
  imageUrl?: string;
  readTime: string;
  views: string;
}

const MobileNewsCard = ({ title, summary, category, date, imageUrl, readTime, views }: MobileNewsCardProps) => {
  return (
    <article className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]">
      {/* Imagem Responsiva */}
      <div className="relative aspect-video bg-muted">
        {imageUrl ? (
          <picture>
            <source 
              media="(max-width: 640px)" 
              srcSet={`${imageUrl}?w=640&q=75 1x, ${imageUrl}?w=1280&q=75 2x`} 
            />
            <source 
              media="(min-width: 641px)" 
              srcSet={`${imageUrl}?w=800&q=80 1x, ${imageUrl}?w=1600&q=80 2x`} 
            />
            <img 
              src={`${imageUrl}?w=640&q=75`}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </picture>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}
        
        {/* Badge de Categoria */}
        <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs">
          {category}
        </Badge>
      </div>
      
      {/* Conteúdo */}
      <div className="p-4">
        <h3 className="font-semibold text-lg leading-tight mb-2 line-clamp-2 hover:text-accent transition-colors">
          {title}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {summary}
        </p>
        
        {/* Metadados */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{date}</span>
            </span>
            <span>{readTime}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>{views}</span>
          </div>
        </div>
      </div>
    </article>
  );
};
```

## 4. Otimizações de Performance

### 4.1 Core Web Vitals

#### Largest Contentful Paint (LCP)
```typescript
// Otimização de imagens para LCP
const OptimizedImage = ({ src, alt, priority = false }: ImageProps) => {
  return (
    <picture>
      <source 
        media="(max-width: 640px)" 
        srcSet={`${src}?w=640&q=75&format=webp 1x, ${src}?w=1280&q=75&format=webp 2x`}
        type="image/webp"
      />
      <source 
        media="(max-width: 640px)" 
        srcSet={`${src}?w=640&q=75 1x, ${src}?w=1280&q=75 2x`}
      />
      <img 
        src={`${src}?w=640&q=75`}
        alt={alt}
        className="w-full h-full object-cover"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    </picture>
  );
};
```

#### First Input Delay (FID)
```typescript
// Debounce para inputs de busca
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Implementação no componente de busca
const SearchInput = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      // Executar busca
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);
  
  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
      placeholder="Buscar notícias..."
    />
  );
};
```

#### Cumulative Layout Shift (CLS)
```css
/* Skeleton screens para prevenir CLS */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Reserva de espaço para imagens */
.aspect-video {
  aspect-ratio: 16 / 9;
}

.aspect-square {
  aspect-ratio: 1 / 1;
}
```

### 4.2 Skeleton Screens
```typescript
const NewsCardSkeleton = () => {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="aspect-video bg-muted skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted skeleton rounded w-3/4" />
        <div className="h-4 bg-muted skeleton rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-3 bg-muted skeleton rounded" />
          <div className="h-3 bg-muted skeleton rounded w-5/6" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-muted skeleton rounded w-1/4" />
          <div className="h-3 bg-muted skeleton rounded w-1/6" />
        </div>
      </div>
    </div>
  );
};

const NewsGrid = () => {
  const { data: news, isLoading } = useQuery(['news'], fetchNews);
  
  if (isLoading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid gap-4">
      {news?.map((item) => (
        <MobileNewsCard key={item.id} {...item} />
      ))}
    </div>
  );
};
```

## 5. Feed Infinito e Lazy Loading

### 5.1 Implementação do Feed Infinito
```typescript
const useInfiniteNews = () => {
  return useInfiniteQuery({
    queryKey: ['news'],
    queryFn: ({ pageParam = 1 }) => fetchNews({ page: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
  });
};

const InfiniteNewsFeed = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteNews();
  
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });
  
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  const allNews = data?.pages.flatMap(page => page.data) ?? [];
  
  return (
    <div className="space-y-4">
      {allNews.map((news) => (
        <MobileNewsCard key={news.id} {...news} />
      ))}
      
      {/* Trigger para próxima página */}
      <div ref={ref} className="py-4">
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        )}
      </div>
    </div>
  );
};
```

### 5.2 Lazy Loading de Imagens
```typescript
const LazyImage = ({ src, alt, className }: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted skeleton" />
      )}
      
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      )}
    </div>
  );
};
```

## 6. Sistema de Temas (Claro/Escuro)

### 6.1 Implementação do Theme Provider
```typescript
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    return stored || 'system';
  });
  
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    const root = window.document.documentElement;
    
    const updateTheme = () => {
      let resolved: 'light' | 'dark';
      
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }
      
      setResolvedTheme(resolved);
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
    };
    
    updateTheme();
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);
    
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);
  
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### 6.2 Toggle de Tema
```typescript
const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-muted transition-colors"
      aria-label="Alternar tema"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
};
```

## 7. Acessibilidade e UX

### 7.1 Padrões de Acessibilidade
```typescript
// Componente de botão acessível
const AccessibleButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  ariaLabel, 
  className = '' 
}: AccessibleButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        min-h-[48px] min-w-[48px] 
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// Skip link para navegação por teclado
const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-accent text-accent-foreground px-4 py-2 rounded-lg z-50"
    >
      Pular para o conteúdo principal
    </a>
  );
};
```

### 7.2 Feedback Visual e Tátil
```css
/* Feedback visual para interações */
.interactive-element {
  @apply transition-all duration-200 ease-out;
}

.interactive-element:hover {
  @apply scale-[1.02] shadow-md;
}

.interactive-element:active {
  @apply scale-[0.98] shadow-sm;
}

/* Feedback para elementos focáveis */
.focusable {
  @apply focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2;
}

/* Estados de loading */
.loading-state {
  @apply opacity-70 pointer-events-none;
}

.loading-state::after {
  content: '';
  @apply absolute inset-0 bg-muted/20 animate-pulse;
}
```

## 8. Otimizações Técnicas

### 8.1 Carregamento de Fontes
```css
/* Otimização de fontes */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/inter-regular.woff2') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/inter-semibold.woff2') format('woff2');
}

/* Preload de fontes críticas */
/* No HTML head: */
/* <link rel="preload" href="/fonts/inter-regular.woff2" as="font" type="font/woff2" crossorigin> */
```

### 8.2 Service Worker para Cache
```typescript
// sw.ts
const CACHE_NAME = 'ubatuba-news-v1';
const STATIC_ASSETS = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/fonts/inter-regular.woff2',
  '/fonts/inter-semibold.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.match(event.request)
            .then((response) => {
              if (response) {
                return response;
              }
              return fetch(event.request)
                .then((fetchResponse) => {
                  cache.put(event.request, fetchResponse.clone());
                  return fetchResponse;
                });
            });
        })
    );
  }
});
```

## 9. Métricas e Monitoramento

### 9.1 Web Vitals Monitoring
```typescript
// utils/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

const sendToAnalytics = (metric: WebVitalMetric) => {
  // Enviar para serviço de analytics
  console.log('Web Vital:', metric);
  
  // Exemplo com Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.rating,
      value: Math.round(metric.value),
      non_interaction: true,
    });
  }
};

export const initWebVitals = () => {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
};
```

### 9.2 Performance Observer
```typescript
// utils/performanceMonitor.ts
class PerformanceMonitor {
  private observer: PerformanceObserver | null = null;
  
  init() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });
      
      this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    }
  }
  
  private handlePerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        console.log('Navigation timing:', {
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
        });
        break;
        
      case 'paint':
        console.log(`${entry.name}: ${entry.startTime}ms`);
        break;
        
      case 'largest-contentful-paint':
        console.log(`LCP: ${entry.startTime}ms`);
        break;
    }
  }
  
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

## 10. Configurações de Build e Deploy

### 10.1 Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas
              },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  server: {
    host: '::',
    port: 8080,
  },
});
```

### 10.2 Tailwind Configuration
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        // Cores otimizadas para contraste
        primary: {
          DEFAULT: 'hsl(210 100% 50%)', // Azul acessível
          foreground: 'hsl(0 0% 100%)',
        },
        accent: {
          DEFAULT: 'hsl(210 100% 60%)',
          foreground: 'hsl(0 0% 100%)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        skeleton: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

## 11. Checklist de Implementação

### 11.1 Fase 1: Estrutura Base
- [ ] Implementar navegação off-canvas
- [ ] Criar componentes mobile-first
- [ ] Configurar sistema de temas
- [ ] Implementar skeleton screens

### 11.2 Fase 2: Performance
- [ ] Configurar lazy loading de imagens
- [ ] Implementar feed infinito
- [ ] Otimizar carregamento de fontes
- [ ] Configurar service worker

### 11.3 Fase 3: Monitoramento
- [ ] Implementar Web Vitals tracking
- [ ] Configurar performance monitoring
- [ ] Estabelecer métricas de baseline
- [ ] Configurar alertas de performance

### 11.4 Fase 4: Acessibilidade
- [ ] Implementar navegação por teclado
- [ ] Adicionar labels ARIA
- [ ] Testar com leitores de tela
- [ ] Validar contraste de cores

## 12. Métricas de Sucesso

### 12.1 Performance Targets
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **TTI**: < 3.5s
- **Speed Index**: < 3.0s

### 12.2 UX Metrics
- **Bounce Rate**: < 40%
- **Session Duration**: > 2 minutos
- **Pages per Session**: > 2.5
- **Mobile Conversion**: > 85% da desktop

### 12.3 Technical Metrics
- **Bundle Size**: < 200KB (gzipped)
- **Image Optimization**: > 80% WebP adoption
- **Cache Hit Rate**: > 90%
- **Accessibility Score**: > 95 (Lighthouse)

Esta documentação fornece um roadmap completo para transformar o portal Ubatuba News em uma experiência mobile-first otimizada, priorizando performance, usabilidade e acessibilidade.