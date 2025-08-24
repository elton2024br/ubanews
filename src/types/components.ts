import { ReactNode, MouseEvent, KeyboardEvent, TouchEvent } from 'react';
import { NewsVariant, NewsCategory, NewsSortBy } from '@/shared/types/news';

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  tabIndex?: number;
}

// Touch and Gesture Types
export interface TouchGestureState {
  startY: number;
  currentY: number;
  deltaY: number;
  velocity: number;
  timestamp: number;
}

export interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
  threshold: number;
}

export interface SwipeGestureState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  velocity: number;
}

// Loading and Animation Types
export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface SkeletonLoaderProps extends BaseComponentProps {
  variant?: 'card' | 'list' | 'featured' | 'compact';
  count?: number;
  animated?: boolean;
  showShimmer?: boolean;
}

// Search and Filter Types
export interface SearchBarProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  debounceMs?: number;
}

export interface FilterBarProps extends BaseComponentProps {
  categories: Array<{ value: NewsCategory | 'all'; label: string; count?: number }>;
  selectedCategory: NewsCategory | 'all';
  onCategoryChange: (category: NewsCategory | 'all') => void;
  sortBy: NewsSortBy;
  onSortChange: (sort: NewsSortBy) => void;
  showCounts?: boolean;
}

// Feed and Layout Types
export interface NewsFeedProps extends BaseComponentProps {
  variant?: NewsVariant;
  itemsPerPage?: number;
  enableInfiniteScroll?: boolean;
  enablePullToRefresh?: boolean;
  enableSearch?: boolean;
  enableFilters?: boolean;
  onArticleClick?: (articleId: string) => void;
  onArticleShare?: (articleId: string) => void;
  onArticleLike?: (articleId: string) => void;
}

export interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  threshold?: number;
}

// Error and Feedback Types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

export interface FeedbackMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Optimization Types
export interface OptimizationConfig {
  enableMemoization: boolean;
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  debounceMs: number;
  throttleMs: number;
}

// Accessibility Types
export interface AccessibilityConfig {
  enableKeyboardNavigation: boolean;
  enableScreenReader: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  focusManagement: boolean;
}

export interface KeyboardNavigationState {
  currentIndex: number;
  maxIndex: number;
  isNavigating: boolean;
  lastKeyPressed?: string;
}