import { useEffect, useCallback, useState } from 'react';

// Tipos para recursos críticos
interface CriticalResource {
  href: string;
  as: 'script' | 'style' | 'font' | 'image' | 'fetch';
  type?: string;
  crossorigin?: 'anonymous' | 'use-credentials';
  media?: string;
  priority?: 'high' | 'low';
}

// Recursos críticos do UbaNews
const CRITICAL_RESOURCES: CriticalResource[] = [
  // Fontes críticas
  {
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    as: 'style',
    priority: 'high'
  },
  // Imagens críticas (hero, logos)
  {
    href: '/logo-ubatuba.webp',
    as: 'image',
    priority: 'high'
  },
  // Scripts críticos para Web Vitals
  {
    href: '/sw.js',
    as: 'script',
    priority: 'high'
  }
];

// Hook para preload de recursos críticos
export const useResourcePreload = () => {
  const [preloadedResources, setPreloadedResources] = useState<Set<string>>(new Set());
  const [loadingResources, setLoadingResources] = useState<Set<string>>(new Set());
  const [failedResources, setFailedResources] = useState<Set<string>>(new Set());

  // Função para criar link de preload
  const createPreloadLink = useCallback((resource: CriticalResource): HTMLLinkElement => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    
    if (resource.type) link.type = resource.type;
    if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
    if (resource.media) link.media = resource.media;
    
    // Adicionar fetchpriority se suportado
    if ('fetchPriority' in link && resource.priority) {
      (link as HTMLLinkElement & { fetchPriority?: string }).fetchPriority = resource.priority;
    }

    return link;
  }, []);

  // Função para preload de um recurso específico
  const preloadResource = useCallback(async (resource: CriticalResource): Promise<void> => {
    const resourceKey = `${resource.as}:${resource.href}`;
    
    // Evitar preload duplicado
    if (preloadedResources.has(resourceKey) || loadingResources.has(resourceKey)) {
      return;
    }

    setLoadingResources(prev => new Set(prev).add(resourceKey));

    try {
      // Verificar se já existe um link de preload
      const existingLink = document.querySelector(
        `link[rel="preload"][href="${resource.href}"][as="${resource.as}"]`
      );

      if (!existingLink) {
        const link = createPreloadLink(resource);
        
        // Promise para aguardar o carregamento
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout preloading ${resource.href}`));
          }, 10000); // 10s timeout

          link.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          
          link.onerror = () => {
            clearTimeout(timeout);
            reject(new Error(`Failed to preload ${resource.href}`));
          };

          document.head.appendChild(link);
        });
      }

      setPreloadedResources(prev => new Set(prev).add(resourceKey));
      console.log(`✅ Preloaded: ${resource.href}`);
      
    } catch (error) {
      setFailedResources(prev => new Set(prev).add(resourceKey));
      console.warn(`❌ Failed to preload: ${resource.href}`, error);
    } finally {
      setLoadingResources(prev => {
        const newSet = new Set(prev);
        newSet.delete(resourceKey);
        return newSet;
      });
    }
  }, [preloadedResources, loadingResources, createPreloadLink]);

  // Função para preload de múltiplos recursos
  const preloadResources = useCallback(async (resources: CriticalResource[]): Promise<void> => {
    // Separar por prioridade
    const highPriority = resources.filter(r => r.priority === 'high');
    const lowPriority = resources.filter(r => r.priority !== 'high');

    // Preload recursos de alta prioridade primeiro
    if (highPriority.length > 0) {
      await Promise.allSettled(highPriority.map(preloadResource));
    }

    // Preload recursos de baixa prioridade em seguida
    if (lowPriority.length > 0) {
      // Usar requestIdleCallback se disponível
      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback?: (callback: () => void) => void }).requestIdleCallback?.(() => {
          Promise.allSettled(lowPriority.map(preloadResource));
        });
      } else {
        // Fallback com setTimeout
        setTimeout(() => {
          Promise.allSettled(lowPriority.map(preloadResource));
        }, 100);
      }
    }
  }, [preloadResource]);

  // Função para preload de recursos críticos padrão
  const preloadCriticalResources = useCallback(() => {
    preloadResources(CRITICAL_RESOURCES);
  }, [preloadResources]);

  // Função para preload de imagem específica
  const preloadImage = useCallback((src: string, priority: 'high' | 'low' = 'low') => {
    preloadResource({
      href: src,
      as: 'image',
      priority
    });
  }, [preloadResource]);

  // Função para preload de rota/chunk
  const preloadRoute = useCallback((routePath: string) => {
    // Simular preload de chunk da rota
    // Em uma implementação real, isso seria baseado no manifest do Vite
    const chunkName = routePath.replace('/', '') || 'index';
    preloadResource({
      href: `/assets/js/${chunkName}-chunk.js`,
      as: 'script',
      priority: 'low'
    });
  }, [preloadResource]);

  // Efeito para preload automático de recursos críticos
  useEffect(() => {
    // Aguardar o carregamento inicial da página
    if (document.readyState === 'complete') {
      preloadCriticalResources();
    } else {
      window.addEventListener('load', preloadCriticalResources);
      return () => window.removeEventListener('load', preloadCriticalResources);
    }
  }, [preloadCriticalResources]);

  return {
    preloadedResources: Array.from(preloadedResources),
    loadingResources: Array.from(loadingResources),
    failedResources: Array.from(failedResources),
    preloadResource,
    preloadResources,
    preloadCriticalResources,
    preloadImage,
    preloadRoute,
    isLoading: loadingResources.size > 0,
    hasFailures: failedResources.size > 0
  };
};

// Hook para lazy loading de componentes com preload
export const useLazyComponent = <T extends React.ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  preloadCondition?: boolean
) => {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadComponent = useCallback(async () => {
    if (Component || loading) return;

    setLoading(true);
    setError(null);

    try {
      const module = await importFn();
      setComponent(() => module.default);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load component'));
    } finally {
      setLoading(false);
    }
  }, [Component, loading, importFn]);

  // Preload se a condição for verdadeira
  useEffect(() => {
    if (preloadCondition) {
      loadComponent();
    }
  }, [preloadCondition, loadComponent]);

  return {
    Component,
    loading,
    error,
    loadComponent
  };
};

// Hook para intersection observer com preload
export const useIntersectionPreload = (
  preloadFn: () => void,
  options: IntersectionObserverInit = { threshold: 0.1 }
) => {
  const [ref, setRef] = useState<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      
      if (entry.isIntersecting) {
        preloadFn();
        observer.unobserve(ref); // Preload apenas uma vez
      }
    }, options);

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, preloadFn, options]);

  return {
    ref: setRef,
    isIntersecting
  };
};

export default useResourcePreload;