import React from 'react';
import { MobileNewsCard } from './MobileNewsCard';
import { Button } from '@/components/ui/button';
import type { NewsArticle } from '../shared/types/news';

interface MobileNewsListProps {
  news: NewsArticle[];
  onLoadMore: () => void;
  hasMore: boolean;
}

export const MobileNewsList: React.FC<MobileNewsListProps> = ({
  news,
  onLoadMore,
  hasMore,
}) => {
  return (
    <div className="space-y-4">
      {news.map((article) => (
        <MobileNewsCard
          key={article.id}
          id={article.id}
          title={article.title}
          excerpt={article.excerpt}
          image={article.image}
          category={article.category}
          date={article.date}
          readTime={article.readTime || 0}
          onClick={() => {}}
        />
      ))}
      {hasMore && (
        <div className="flex justify-center">
          <Button onClick={onLoadMore}>Carregar mais</Button>
        </div>
      )}
    </div>
  );
};

export default MobileNewsList;
