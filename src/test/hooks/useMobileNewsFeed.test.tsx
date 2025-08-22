import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMobileNewsFeed } from '../../hooks/useMobileNewsFeed';
import { newsArticles } from '../../data/newsData';

describe('useMobileNewsFeed', () => {
  it('filters by category', () => {
    const { result } = renderHook(() => useMobileNewsFeed(newsArticles));
    act(() =>
      result.current.setFilters({
        ...result.current.filters,
        category: newsArticles[0].category,
      })
    );
    expect(
      result.current.displayedNews.every(
        (n) => n.category === newsArticles[0].category
      )
    ).toBe(true);
  });

  it('loads more items', () => {
    const { result } = renderHook(() => useMobileNewsFeed(newsArticles));
    const initialLength = result.current.displayedNews.length;
    act(() => result.current.loadMore());
    expect(result.current.displayedNews.length).toBeGreaterThan(initialLength);
  });
});
