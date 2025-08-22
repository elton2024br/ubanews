import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient();

export const QUERY_KEYS = {
  news: {
    all: ['news'] as const,
    category: (category: string) => ['news', 'category', category] as const,
  },
  auth: {
    session: ['auth', 'session'] as const,
  },
};

export const invalidateNews = {
  category: (category: string) =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.news.category(category) }),
};
