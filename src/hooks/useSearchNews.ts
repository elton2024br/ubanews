import { useQuery } from '@tanstack/react-query';
import { searchNews, SearchResult } from '@/services/newsApi';

export interface UseSearchNewsParams {
  term: string;
  category?: string;
  date_range?: string;
  author?: string;
  tags?: string[];
}

/**
 * React Query hook for searching news articles.
 * Results are considered fresh for one minute and garbage collected
 * after ten minutes of inactivity.
 */
export const useSearchNews = (
  params: UseSearchNewsParams,
  enabled: boolean = true
) => {
  return useQuery<SearchResult[]>({
    queryKey: ['search-news', params],
    queryFn: () => searchNews(params),
    enabled: enabled && !!params.term,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
