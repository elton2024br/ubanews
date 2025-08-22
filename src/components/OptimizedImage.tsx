import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate optimized image URLs
  const generateOptimizedUrls = (originalSrc: string) => {
    // For external URLs, we'll use the original source
    // In a real app, you might use a service like Cloudinary or similar
    const baseUrl = originalSrc;
    
    return {
      webp: baseUrl,
      avif: baseUrl,
      jpeg: baseUrl,
    };
  };

  const { webp, avif, jpeg } = generateOptimizedUrls(src);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Placeholder while loading
  const renderPlaceholder = () => (
    <div
      className={cn(
        'bg-muted animate-pulse flex items-center justify-center',
        className
      )}
      style={{ width, height }}
    >
      <div className="text-muted-foreground text-sm">Carregando...</div>
    </div>
  );

  // Error state
  const renderError = () => (
    <div
      className={cn(
        'bg-muted flex items-center justify-center border border-border',
        className
      )}
      style={{ width, height }}
    >
      <div className="text-muted-foreground text-sm text-center p-4">
        <div className="mb-2">⚠️</div>
        <div>Erro ao carregar imagem</div>
      </div>
    </div>
  );

  if (hasError) {
    return renderError();
  }

  if (!isInView) {
    return (
      <div ref={imgRef} className={className} style={{ width, height }}>
        {renderPlaceholder()}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && renderPlaceholder()}
      <picture>
        <source srcSet={avif} type="image/avif" sizes={sizes} />
        <source srcSet={webp} type="image/webp" sizes={sizes} />
        <img
          ref={imgRef}
          src={jpeg}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
        />
      </picture>
    </div>
  );
};

export { OptimizedImage };