import { supabase } from '../lib/supabase';
import type { NewsArticle } from '../types/news';

export interface NewsQueryOptions {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
  sortBy?: 'date' | 'views' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface NewsRepositoryResult {
  data: NewsArticle[];
  total: number;
  hasMore: boolean;
}

async function getPublicNews(options: NewsQueryOptions = {}): Promise<NewsRepositoryResult> {
  let query = supabase
    .from('news')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.search?.trim()) {
    const searchText = options.search.trim();
    query = query
      .textSearch('title', searchText, { type: 'websearch' })
      .textSearch('content', searchText, { type: 'websearch' });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: data || [],
    total: count || 0,
    hasMore: (options.offset || 0) + (data?.length || 0) < (count || 0),
  };
}

async function getNewsById(id: string): Promise<NewsArticle | null> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    await supabase
      .from('news')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', id);
    data.views = (data.views || 0) + 1;
  }

  return data as NewsArticle | null;
}

async function incrementViews(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('news')
    .update({ views: supabase.sql('views + 1') })
    .eq('id', id);
  return !error;
}

export default {
  getPublicNews,
  getNewsById,
  incrementViews,
};
