import React, { memo, useCallback, useState } from 'react';
import { Clock, Eye, Heart, Share2, Bookmark, ChevronRight } from 'lucide-react';
import { RippleEffect, PulseOnClick } from './AnimatedTransitions';
import { useButtonInteractions, useCardInteractions } from '../hooks/useMicrointeractions';
import { cn } from '../lib/utils';
import type { NewsCardProps, NewsInteractionState } from '../types/news';
import type { InteractiveComponentProps } from '../types/components';

interface MobileNewsCardProps extends NewsCardProps, InteractiveComponentProps {
  variant?: 'default' | 'featured' | 'compact';
  showInteractions?: boolean;
  isKeyboardFocused?: boolean;
  tabIndex?: number;
}

// Category color mapping for better visual hierarchy
const categoryColors: Record<string, string> = {
  'Política': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  'Economia': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  'Esportes': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  'Cultura': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  'Turismo': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  'Saúde': 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300',
  'Educação': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
  'default': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
};

const MobileNewsCardComponent: React.FC<MobileNewsCardProps> = ({
  id,
  title,
  excerpt,
  image,
  category,
  date,
  readTime,
  featured = false,
  tags = [],
  variant = 'default',
  showInteractions = true,
  isKeyboardFocused = false,
  tabIndex = 0,
  onClick,
  onShare,
  onBookmark,
  onLike,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}) => {
  // Enhanced interaction state management
  const [interactionState, setInteractionState] = useState<NewsInteractionState>({
    isLiked: false,
    isBookmarked: false,
    isShared: false,
    likeCount: Math.floor(Math.random() * 50) + 10,
    viewCount: Math.floor(Math.random() * 500) + 100,
    shareCount: Math.floor(Math.random() * 20) + 5
  });
  
  // Enhanced microinteractions with proper typing
  const { createButtonProps } = useButtonInteractions();
  const { createCardProps } = useCardInteractions();
  
  // State for interactions
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePress = useCallback(() => setIsPressed(true), []);
  const handleRelease = useCallback(() => setIsPressed(false), []);
  const handleHover = useCallback(() => {}, []);
  const handleLeave = useCallback(() => {}, []);
  
  // Enhanced interaction handlers
  const handleLike = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      isLiked: !prev.isLiked,
      likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1
    }));
    onLike?.();
  }, [onLike]);
  
  const handleBookmarkClick = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      isBookmarked: !prev.isBookmarked
    }));
    onBookmark?.();
  }, [onBookmark]);
  
  const handleShare = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      isShared: true,
      shareCount: prev.shareCount + 1
    }));
    onShare?.();
  }, [onShare]);



  const handleCardClick = useCallback(() => {
    onClick?.();
  }, [onClick]);
  
  const handleShareClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleShare();
  }, [handleShare]);
  
  const handleBookmarkClickEvent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleBookmarkClick();
  }, [handleBookmarkClick]);
  
  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleLike();
  }, [handleLike]);

  const categoryColorClass = categoryColors[category] || categoryColors.default;

  // Enhanced card interaction props
  const cardInteractionProps = {
    interactive: true,
    hapticOnHover: true
  };

  return (
    <article
      className={cn(
        'group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ease-out cursor-pointer',
        'hover:shadow-lg hover:border-gray-200 hover:-translate-y-1',
        'active:scale-[0.98] active:shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isPressed && 'scale-[0.98] shadow-md',
        isKeyboardFocused && 'ring-2 ring-blue-500 ring-offset-2',
        featured && 'md:col-span-2 md:row-span-2 border-2 border-blue-200',
        variant === 'compact' && 'flex flex-row space-x-3 p-3',
        variant === 'featured' && 'relative overflow-hidden',
        className
      )}
      onClick={handleCardClick}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseEnter={handleHover}
      onMouseLeave={handleLeave}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      role="button"
      tabIndex={tabIndex}
      aria-label={ariaLabel || `Ler artigo: ${title}`}
      aria-describedby={ariaDescribedBy}
    >
      {/* Image */}
      {image && (
        <div className={cn(
          'relative overflow-hidden',
          variant === 'compact' ? 'w-20 h-20 flex-shrink-0 rounded-lg' : 'aspect-video'
        )}>
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Category Badge */}
          <span 
            className={cn(
              'absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full',
              categoryColorClass
            )}
          >
            {category}
          </span>
          
          {featured && (
            <div className="absolute top-2 right-2">
              <span className="bg-yellow-500 text-white px-2 py-1 text-xs font-bold rounded-full">
                Destaque
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        'p-4 flex-1',
        variant === 'compact' && 'p-0'
      )}>
        <h3 className={cn(
          'font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors',
          variant === 'compact' ? 'text-sm' : 'text-base mb-2'
        )}>
          {title}
        </h3>
        
        {variant !== 'compact' && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {excerpt}
          </p>
        )}
        
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Meta Information */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              <span>{readTime}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Eye className="w-3 h-3" aria-hidden="true" />
              <span>{interactionState.viewCount}</span>
            </span>
          </div>
          
          <time dateTime={date} className="text-gray-400">
            {new Date(date).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit'
            })}
          </time>
        </div>
        
        {/* Action Buttons */}
        {showInteractions && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <RippleEffect
                onClick={handleLikeClick}
                className="inline-block rounded-md"
              >
                <button
                  className={cn(
                    'flex items-center space-x-1 px-2 py-1 rounded-md text-xs transition-all',
                    'hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1',
                    interactionState.isLiked 
                      ? 'text-red-600 bg-red-50' 
                      : 'text-gray-500 hover:text-red-600'
                  )}
                  aria-label={interactionState.isLiked ? 'Remover curtida' : 'Curtir artigo'}
                >
                  <Heart className={cn(
                    'w-4 h-4 transition-all',
                    interactionState.isLiked && 'fill-current animate-pulse-soft'
                  )} />
                  <span>{interactionState.likeCount}</span>
                </button>
              </RippleEffect>
              
              <RippleEffect
                onClick={handleShareClick}
                className="inline-block rounded-md"
              >
                <button
                  className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  aria-label="Compartilhar artigo"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{interactionState.shareCount}</span>
                </button>
              </RippleEffect>
              
              <PulseOnClick
                onClick={handleBookmarkClickEvent}
                className="inline-block"
              >
                <button
                  className={cn(
                    'flex items-center space-x-1 px-2 py-1 rounded-md text-xs transition-all',
                    'hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1',
                    interactionState.isBookmarked 
                      ? 'text-yellow-600 bg-yellow-50' 
                      : 'text-gray-500 hover:text-yellow-600'
                  )}
                  aria-label={interactionState.isBookmarked ? 'Remover dos salvos' : 'Salvar artigo'}
                >
                  <Bookmark className={cn(
                    'w-4 h-4 transition-all',
                    interactionState.isBookmarked && 'fill-current animate-bounce-subtle'
                  )} />
                </button>
              </PulseOnClick>
            </div>
            
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" aria-hidden="true" />
          </div>
        )}
      </div>
    </article>
  );
};

// Custom comparison function for React.memo
const areEqual = (prevProps: MobileNewsCardProps, nextProps: MobileNewsCardProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.variant === nextProps.variant &&
    prevProps.className === nextProps.className
  );
};

export const MobileNewsCard = React.memo(MobileNewsCardComponent, areEqual);

MobileNewsCard.displayName = 'MobileNewsCard';
export type { MobileNewsCardProps };