import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
}

const SkeletonCard = ({ className, variant = 'default' }: SkeletonCardProps) => {
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden',
        'animate-pulse',
        className
      )}
      role="status"
      aria-label="Carregando notícia..."
    >
      {/* Image Skeleton */}
      <div className={cn(
        'w-full bg-muted',
        isFeatured ? 'aspect-[16/9]' : 'aspect-[16/9] sm:aspect-[2/1]'
      )}>
        <Skeleton className="w-full h-full" />
      </div>

      {/* Content Skeleton */}
      <div className={cn(
        'p-4',
        isFeatured ? 'sm:p-6' : 'sm:p-5'
      )}>
        {/* Category Badge Skeleton */}
        <div className="mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Title Skeleton */}
        <div className="mb-2 space-y-2">
          <Skeleton className={cn(
            'h-4 w-full',
            isFeatured ? 'sm:h-6' : 'sm:h-5'
          )} />
          {!isCompact && (
            <Skeleton className={cn(
              'h-4 w-4/5',
              isFeatured ? 'sm:h-6' : 'sm:h-5'
            )} />
          )}
        </div>

        {/* Summary Skeleton */}
        {!isCompact && (
          <div className="mb-4 space-y-2">
            <Skeleton className="h-3 w-full sm:h-4" />
            <Skeleton className="h-3 w-3/4 sm:h-4" />
            <Skeleton className="h-3 w-1/2 sm:h-4" />
          </div>
        )}

        {/* Metadata Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-3 w-12 sm:h-4 sm:w-16" />
            <Skeleton className="h-3 w-8 sm:h-4 sm:w-12" />
            <Skeleton className="h-3 w-10 sm:h-4 sm:w-14" />
          </div>
          <div className="flex items-center space-x-1">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Grid of skeleton cards for loading states
interface SkeletonGridProps {
  count?: number;
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
}

export const SkeletonGrid = ({ 
  count = 6, 
  className,
  variant = 'default' 
}: SkeletonGridProps) => {
  return (
    <div className={cn(
      'grid gap-4',
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      variant === 'featured' && 'lg:grid-cols-2 xl:grid-cols-3',
      className
    )}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} variant={variant} />
      ))}
    </div>
  );
};

// Skeleton for news feed/list layout
export const SkeletonFeed = ({ 
  count = 5, 
  className 
}: { 
  count?: number; 
  className?: string; 
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex gap-4 p-4 bg-card border border-border rounded-xl">
          {/* Image skeleton */}
          <div className="flex-shrink-0">
            <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg" />
          </div>
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-16 rounded-full" /> {/* Category */}
            <Skeleton className="h-4 w-full" /> {/* Title line 1 */}
            <Skeleton className="h-4 w-3/4" /> {/* Title line 2 */}
            <div className="flex items-center space-x-3 pt-2">
              <Skeleton className="h-3 w-12" /> {/* Date */}
              <Skeleton className="h-3 w-8" /> {/* Read time */}
              <Skeleton className="h-3 w-10" /> {/* Views */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonCard;