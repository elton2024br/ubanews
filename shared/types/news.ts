export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  category: NewsCategory;
  tags: string[];
  image: {
    src: string;
    alt: string;
    caption: string;
  };
  excerpt: string;
  content: string;
  author?: string;
  readTime?: number;
  featured?: boolean;
}

export type NewsCategory = 
  | 'Gastronomia'
  | 'Cultura'
  | 'Meio Ambiente'
  | 'Ecoturismo'
  | 'Turismo'
  | 'História'
  | 'Eventos';

export interface NewsFilter {
  category?: NewsCategory;
  searchTerm?: string;
  featured?: boolean;
}

export interface NewsPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}