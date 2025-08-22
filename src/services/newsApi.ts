import { supabase } from '@/lib/supabaseClient';
import { NewsArticle } from '@/shared/types/news';
import { toNewsArticleArray } from '@/adapters/newsAdapter';

export const fetchNewsByCategory = async (category: string): Promise<NewsArticle[]> => {
  const { data, error } = await supabase
    .from('admin_news')
    .select('*')
    .eq('category', category)
    .eq('status', 'published');

  if (error) {
    throw new Error(error.message);
  }

  return toNewsArticleArray(data as any);
};

interface SearchParams {
  term: string;
  category?: string;
  date_range?: string;
  author?: string;
  tags?: string[];
}

export interface SearchResult {
  id: string;
  title: string;
  summary: string;
  category: string;
  author: string;
  publishedAt: string;
  imageUrl?: string;
  tags: string[];
  readTime: number;
  views: number;
}

export const searchNews = async (params: SearchParams): Promise<SearchResult[]> => {
  const { data, error } = await supabase.rpc('search_news', params);
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as SearchResult[];
};
