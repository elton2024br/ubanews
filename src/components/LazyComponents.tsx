import React, { Suspense, lazy } from 'react';
import { useIntersectionPreload } from '@/hooks/useResourcePreload';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

// Componentes lazy com preload estratégico
const LazySearchResults = lazy(() => 
  import('@/pages/SearchResults').then(module => ({
    default: module.default
  }))
);

const LazyNotFound = lazy(() => 
  import('@/pages/NotFound').then(module => ({
    default: module.default
  }))
);

const LazyAbout = lazy(() => 
  import('@/pages/About').then(module => ({
    default: module.default
  }))
);

const LazyContact = lazy(() => 
  import('@/pages/Contact').then(module => ({
    default: module.default
  }))
);

const LazyCategories = lazy(() => 
  import('@/pages/Categories').then(module => ({
    default: module.default
  }))
);

const LazyPrivacyPolicy = lazy(() => 
  import('@/pages/PrivacyPolicy').then(module => ({
    default: module.default
  }))
);

const LazyTermsOfUse = lazy(() => 
  import('@/pages/TermsOfUse').then(module => ({
    default: module.default
  }))
);

// Componentes de loading personalizados
const SearchResultsSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Header skeleton */}
    <div className="border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64" />
        </div>
      </div>
    </div>
    
    {/* Content skeleton */}
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Filtros skeleton */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 flex-shrink-0" />
          ))}
        </div>
        
        {/* Resultados skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const NotFoundSkeleton = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <Skeleton className="h-16 w-16 rounded-full mx-auto" />
      <Skeleton className="h-8 w-64 mx-auto" />
      <Skeleton className="h-4 w-48 mx-auto" />
      <Skeleton className="h-10 w-32 mx-auto" />
    </div>
  </div>
);

// Loading spinner genérico
const LoadingSpinner = ({ message = 'Carregando...' }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

// Wrapper para componentes lazy com preload inteligente
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  preloadDistance?: number;
  className?: string;
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback = <LoadingSpinner />, 
  preloadDistance = 200,
  className = '' 
}) => {
  return (
    <div className={className}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  );
};

// Componente para preload baseado em hover
interface PreloadOnHoverProps {
  onPreload: () => void;
  children: React.ReactNode;
  delay?: number;
}

const PreloadOnHover: React.FC<PreloadOnHoverProps> = ({ 
  onPreload, 
  children, 
  delay = 100 
}) => {
  const handleMouseEnter = () => {
    setTimeout(onPreload, delay);
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      {children}
    </div>
  );
};

// Componente para preload baseado em intersecção
interface PreloadOnViewProps {
  onPreload: () => void;
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

const PreloadOnView: React.FC<PreloadOnViewProps> = ({ 
  onPreload, 
  children, 
  threshold = 0.1,
  rootMargin = '100px' 
}) => {
  const { ref } = useIntersectionPreload(onPreload, {
    threshold,
    rootMargin
  });

  return (
    <div ref={ref}>
      {children}
    </div>
  );
};

// Componentes exportados com lazy loading otimizado
export const SearchResultsLazy: React.FC = () => (
  <LazyWrapper fallback={<SearchResultsSkeleton />}>
    <LazySearchResults />
  </LazyWrapper>
);

export const NotFoundLazy: React.FC = () => (
  <LazyWrapper fallback={<NotFoundSkeleton />}>
    <LazyNotFound />
  </LazyWrapper>
);

export const AboutLazy: React.FC = () => (
  <LazyWrapper fallback={<LoadingSpinner message="Carregando página..." />}>
    <LazyAbout />
  </LazyWrapper>
);

export const ContactLazy: React.FC = () => (
  <LazyWrapper fallback={<LoadingSpinner message="Carregando página..." />}>
    <LazyContact />
  </LazyWrapper>
);

export const CategoriesLazy: React.FC = () => (
  <LazyWrapper fallback={<LoadingSpinner message="Carregando categorias..." />}>
    <LazyCategories />
  </LazyWrapper>
);

export const PrivacyPolicyLazy: React.FC = () => (
  <LazyWrapper fallback={<LoadingSpinner message="Carregando política..." />}>
    <LazyPrivacyPolicy />
  </LazyWrapper>
);

export const TermsOfUseLazy: React.FC = () => (
  <LazyWrapper fallback={<LoadingSpinner message="Carregando termos..." />}>
    <LazyTermsOfUse />
  </LazyWrapper>
);

// Hook para preload de rotas
export const useRoutePreload = () => {
  const preloadSearchResults = () => {
    import('@/pages/SearchResults');
  };

  const preloadNotFound = () => {
    import('@/pages/NotFound');
  };

  const preloadAbout = () => {
    import('@/pages/About');
  };

  const preloadContact = () => {
    import('@/pages/Contact');
  };

  const preloadCategories = () => {
    import('@/pages/Categories');
  };

  const preloadPrivacyPolicy = () => {
    import('@/pages/PrivacyPolicy');
  };

  const preloadTermsOfUse = () => {
    import('@/pages/TermsOfUse');
  };

  return {
    preloadSearchResults,
    preloadNotFound,
    preloadAbout,
    preloadContact,
    preloadCategories,
    preloadPrivacyPolicy,
    preloadTermsOfUse
  };
};

// Componente de navegação com preload inteligente
interface SmartLinkProps {
  to: string;
  children: React.ReactNode;
  preloadOnHover?: boolean;
  preloadOnView?: boolean;
  className?: string;
  onClick?: () => void;
}

export const SmartLink: React.FC<SmartLinkProps> = ({ 
  to, 
  children, 
  preloadOnHover = true,
  preloadOnView = false,
  className = '',
  onClick 
}) => {
  const { preloadSearchResults, preloadNotFound } = useRoutePreload();

  const getPreloadFunction = () => {
    if (to.includes('/search')) return preloadSearchResults;
    if (to === '/404' || to === '*') return preloadNotFound;
    return () => {};
  };

  const preloadFn = getPreloadFunction();

  const LinkContent = (
    <a 
      href={to} 
      className={className}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        // Aqui você integraria com o React Router
        window.history.pushState({}, '', to);
      }}
    >
      {children}
    </a>
  );

  if (preloadOnView) {
    return (
      <PreloadOnView onPreload={preloadFn}>
        {LinkContent}
      </PreloadOnView>
    );
  }

  if (preloadOnHover) {
    return (
      <PreloadOnHover onPreload={preloadFn}>
        {LinkContent}
      </PreloadOnHover>
    );
  }

  return LinkContent;
};

// Componente de seção com lazy loading
interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export const LazySection: React.FC<LazySectionProps> = ({ 
  children, 
  fallback = <LoadingSpinner />,
  threshold = 0.1,
  rootMargin = '50px',
  className = '' 
}) => {
  const [shouldRender, setShouldRender] = React.useState(false);
  
  const { ref } = useIntersectionPreload(() => {
    setShouldRender(true);
  }, { threshold, rootMargin });

  return (
    <div ref={ref} className={className}>
      {shouldRender ? children : fallback}
    </div>
  );
};

export { 
  LazyWrapper, 
  PreloadOnHover, 
  PreloadOnView, 
  LoadingSpinner,
  SearchResultsSkeleton,
  NotFoundSkeleton
};

export default {
  SearchResultsLazy,
  NotFoundLazy,
  SmartLink,
  LazySection
};