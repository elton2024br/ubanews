import { useState, useMemo } from 'react';
import type { NewsArticle } from '../shared/types/news';
import { getNewsByCategory } from '../data/newsData';

export interface MobileNewsFiltersState {
  category: string;
  searchTerm: string;
  sortBy: 'Mais recentes' | 'Mais lidas' | 'Relevância';
}

export const useMobileNewsFeed = (initialNews: NewsArticle[]) => {
  const [filters, setFilters] = useState<MobileNewsFiltersState>({
    category: 'Todas',
    searchTerm: '',
    sortBy: 'Mais recentes',
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const filteredNews = useMemo(() => {
    let news =
      filters.category === 'Todas'
        ? initialNews
        : getNewsByCategory(initialNews, filters.category);

    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      news = news.filter((n) =>
        `${n.title} ${n.excerpt}`.toLowerCase().includes(term)
      );
    }

    news = [...news];
    switch (filters.sortBy) {
      case 'Mais recentes':
        news.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case 'Mais lidas':
        news.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'Relevância':
        news.sort((a, b) => (a.readTime || 0) - (b.readTime || 0));
        break;
    }
    return news;
  }, [initialNews, filters]);

  const displayedNews = useMemo(
    () => filteredNews.slice(0, page * itemsPerPage),
    [filteredNews, page]
  );

  const hasMore = displayedNews.length < filteredNews.length;
  const loadMore = () => {
    if (hasMore) setPage((p) => p + 1);
  };

  const categories = useMemo(() => {
    const set = new Set<string>(initialNews.map((n) => n.category));
    return ['Todas', ...Array.from(set)];
  }, [initialNews]);

  return {
    filters,
    setFilters,
    categories,
    displayedNews,
    loadMore,
    hasMore,
  };
};
