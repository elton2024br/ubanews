export interface NewsImage {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
  placeholder?: string;
}

export type NewsCategory =
  | 'Gastronomia'
  | 'Cultura'
  | 'Meio Ambiente'
  | 'Ecoturismo'
  | 'Turismo'
  | 'História'
  | 'Eventos'
  | 'Natureza'
  | 'Esportes'
  | 'Economia'
  | 'Educação';

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  category: NewsCategory;
  tags: string[];
  image: NewsImage;
  excerpt: string;
  content: string;
  readTime: number;
  featured: boolean;
  author?: string;
  views?: number;
  likes?: number;
  shares?: number;
}

export type NewsSortBy =
  | 'date'
  | 'popularity'
  | 'readTime'
  | 'title'
  | 'Mais recentes'
  | 'Mais lidas'
  | 'Relevância';

export type NewsVariant = 'grid' | 'list' | 'featured';

export interface NewsFilters {
  category: NewsCategory | 'all' | 'Todas';
  searchTerm: string;
  sortBy: NewsSortBy;
  tags?: string[];
}

export interface NewsPagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface NewsCardProps {
  id: string;
  title: string;
  excerpt: string;
  image: NewsImage;
  category: NewsCategory;
  date: string;
  readTime: number;
  featured?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  onClick?: (id: string) => void;
  onShare?: (id: string) => void;
  onLike?: (id: string) => void;
  className?: string;
}

export interface NewsLoadingState {
  loading: boolean;
  initialLoading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
}

export interface NewsInteractionState {
  liked: boolean;
  shared: boolean;
  bookmarked: boolean;
  viewed: boolean;
}

// API Response types
export interface NewsApiResponse {
  data: NewsArticle[];
  pagination: NewsPagination;
  filters: NewsFilters;
  success: boolean;
  message?: string;
}

export interface NewsApiError {
  success: false;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
