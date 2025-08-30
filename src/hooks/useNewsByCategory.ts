import { useQuery } from '@tanstack/react-query';
import { fetchNewsByCategory } from '@/services/newsApi';
import { NewsArticle } from '@/shared/types/news';

/**
 * React Query hook for fetching news articles by category.
 * Caches results per-category for five minutes and keeps them
 * in memory for thirty minutes.
 */
export const useNewsByCategory = (category?: string) => {
  return useQuery<NewsArticle[]>({
    queryKey: ['news-by-category', category],
    queryFn: () => fetchNewsByCategory(category!),
    enabled: !!category,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};
