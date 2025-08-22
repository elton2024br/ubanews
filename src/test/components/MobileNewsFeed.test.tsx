import { fireEvent, render, screen, waitFor } from '../utils';
import { vi, describe, it, expect } from 'vitest';
import { MobileNewsFeed } from '@/components/MobileNewsFeed';
import type { NewsArticle } from '@/types/news';

const baseArticle: Omit<NewsArticle, 'id' | 'title' | 'category'> = {
  date: '2024-01-01',
  tags: [],
  image: { src: 'img', alt: 'img', caption: 'img' },
  excerpt: 'excerpt',
  content: 'content',
  readTime: 5
};

const initialData: NewsArticle[] = [
  { ...baseArticle, id: '1', title: 'Artigo A', category: 'Gastronomia' },
  { ...baseArticle, id: '2', title: 'Artigo B', category: 'Cultura' },
  { ...baseArticle, id: '3', title: 'Artigo C', category: 'Turismo' }
];

const moreData: NewsArticle[] = [
  { ...baseArticle, id: '4', title: 'Artigo D', category: 'Gastronomia' },
  { ...baseArticle, id: '5', title: 'Artigo E', category: 'Cultura' },
  { ...baseArticle, id: '6', title: 'Artigo F', category: 'Turismo' }
];

describe('MobileNewsFeed', () => {
  it('filtra notícias por categoria', async () => {
    render(<MobileNewsFeed initialData={initialData} enableDynamicData={false} />);

    await waitFor(() => {
      expect(screen.getByText('Artigo A')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Ensure all articles are rendered
    expect(screen.getByText('Artigo B')).toBeInTheDocument();
    expect(screen.getByText('Artigo C')).toBeInTheDocument();

    const gastronomyButton = screen.getByRole('tab', { name: 'Gastronomia' });
    fireEvent.click(gastronomyButton);

    await waitFor(() => {
      expect(screen.getByText('Artigo A')).toBeInTheDocument();
      expect(screen.queryByText('Artigo B')).not.toBeInTheDocument();
      expect(screen.queryByText('Artigo C')).not.toBeInTheDocument();
    });
  });

  it('carrega mais notícias na paginação', async () => {
    const onLoadMore = vi.fn().mockResolvedValue(moreData);
    render(
      <MobileNewsFeed
        initialData={initialData}
        onLoadMore={onLoadMore}
        enableDynamicData={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Artigo A')).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(screen.getAllByRole('button', { name: /Ler artigo/i })).toHaveLength(3);

    const loadMoreButton = screen.getByRole('button', { name: /Carregar mais notícias/i });
    fireEvent.keyDown(loadMoreButton, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Ler artigo/i })).toHaveLength(6);
    }, { timeout: 2000 });
    expect(onLoadMore).toHaveBeenCalled();
  });
});

