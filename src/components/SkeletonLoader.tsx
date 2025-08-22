import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'featured';
  count?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  variant = 'card', 
  count = 1, 
  className = '' 
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'featured':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg animate-pulse">
            <div className="h-48 bg-gray-200 dark:bg-gray-700" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'list':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm animate-pulse">
            <div className="flex gap-4">
              <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="space-y-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          </div>
        );
      
      default: // card
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
            <div className="h-48 bg-gray-200 dark:bg-gray-700" />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="space-y-2 mb-3">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
              </div>
              <div className="space-y-1 mb-4">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="flex gap-1">
                  <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={index > 0 ? 'mt-6' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
export type { SkeletonLoaderProps };