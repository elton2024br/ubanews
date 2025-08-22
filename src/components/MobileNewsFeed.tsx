import React from 'react';
import { MobileNewsFilters } from './MobileNewsFilters';
import { MobileNewsList } from './MobileNewsList';
import { useMobileNewsFeed } from '../hooks/useMobileNewsFeed';
import { newsArticles } from '../data/newsData';
import type { NewsArticle } from '../shared/types/news';

interface MobileNewsFeedProps {
  title?: string;
  initialData?: NewsArticle[];
}

export const MobileNewsFeed: React.FC<MobileNewsFeedProps> = ({
  title = '📰 Notícias de Ubatuba',
  initialData = newsArticles,
}) => {
  const {
    filters,
    setFilters,
    categories,
    displayedNews,
    loadMore,
    hasMore,
  } = useMobileNewsFeed(initialData);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <MobileNewsFilters
        filters={filters}
        categories={categories}
        onChange={setFilters}
      />
      <MobileNewsList
        news={displayedNews}
        onLoadMore={loadMore}
        hasMore={hasMore}
      />
    </section>
  );
};

export default MobileNewsFeed;
