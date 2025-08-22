import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MobileNewsList } from '../../components/MobileNewsList';
import { newsArticles } from '../../data/newsData';

describe('MobileNewsList', () => {
  it('renders news items', () => {
    render(
      <MobileNewsList
        news={newsArticles.slice(0, 2)}
        onLoadMore={() => {}}
        hasMore={false}
      />
    );
    expect(screen.getByText(newsArticles[0].title)).toBeInTheDocument();
    expect(screen.getByText(newsArticles[1].title)).toBeInTheDocument();
  });
});
