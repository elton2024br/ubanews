import { useState } from 'react';
import { NewsArticle } from '@/shared/types/news';
import { fetchNewsByCategory } from '@/services/newsApi';

interface CategoryState {
  [key: string]: NewsArticle[];
}
interface LoadingState {
  [key: string]: boolean;
}
interface ErrorState {
  [key: string]: string | null;
}

export const useNewsByCategory = () => {
  const [newsByCategory, setNewsByCategory] = useState<CategoryState>({});
  const [loading, setLoading] = useState<LoadingState>({});
  const [error, setError] = useState<ErrorState>({});

  const loadCategory = async (category: string) => {
    setLoading(prev => ({ ...prev, [category]: true }));
    setError(prev => ({ ...prev, [category]: null }));
    try {
      const items = await fetchNewsByCategory(category);
      setNewsByCategory(prev => ({ ...prev, [category]: items }));
      return items;
    } catch (err) {
      setError(prev => ({ ...prev, [category]: (err as Error).message }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, [category]: false }));
    }
  };

  return { newsByCategory, loading, error, loadCategory };
};
