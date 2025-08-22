import { NewsArticle, NewsCategory, NewsImage } from '@/shared/types/news';

export interface SupabaseNewsRow {
  id: string;
  title: string;
  summary?: string;
  content: string;
  category: string;
  tags?: string[];
  featured_image?: string;
  publish_date?: string;
  created_at?: string;
  author?: string;
  views?: number;
}

/**
 * Transforms a Supabase row into a NewsArticle.
 */
export const toNewsArticle = (row: SupabaseNewsRow): NewsArticle => {
  const image: NewsImage = {
    src: row.featured_image || '',
    alt: row.title,
    caption: row.summary || '',
  };

  return {
    id: row.id,
    title: row.title,
    excerpt: row.summary || '',
    content: row.content,
    category: row.category as NewsCategory,
    date: row.publish_date || row.created_at || '',
    tags: row.tags || [],
    image,
    readTime: Math.ceil((row.content?.split(/\s+/).length || 0) / 200),
    featured: false,
    author: row.author,
    views: row.views,
  };
};

export const toNewsArticleArray = (rows: SupabaseNewsRow[] = []): NewsArticle[] =>
  rows.map(toNewsArticle);

export type { NewsArticle } from '@/shared/types/news';
