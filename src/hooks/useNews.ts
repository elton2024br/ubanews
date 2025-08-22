import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { QUERY_KEYS } from '@/lib/react-query';
import { NewsArticle } from '@/shared/types/news';

export function useNews(category: string | null) {
  return useQuery<NewsArticle[], Error>({
    queryKey: QUERY_KEYS.news.category(category || 'all'),
    enabled: !!category,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_news')
        .select('*')
        .eq('category', category);
      if (error) throw new Error(error.message);
      return data as NewsArticle[];
    },
  });
}
