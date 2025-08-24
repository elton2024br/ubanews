import { describe, it, expect, beforeEach, vi } from 'vitest';
import newsService from '@/services/newsService';

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
}

// Create a reusable mock query builder with chainable methods
const mockQueryBuilder: MockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  then: vi.fn(),
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => mockQueryBuilder),
  },
}));

describe('NewsService pagination and search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    newsService.clearCache();
    newsService.setDynamicMode(true);
  });

  it('applies limit and offset for pagination', async () => {
    const resultData = Array.from({ length: 5 }, (_, i) => ({ id: String(i) }));
    mockQueryBuilder.then.mockImplementation((resolve: (value: { data: unknown[]; error: null; count: number }) => void) =>
      resolve({ data: resultData, error: null, count: 12 })
    );

    const result = await newsService.getPublicNews({ limit: 5, offset: 5 });

    expect(mockQueryBuilder.select).toHaveBeenCalledWith('*', { count: 'exact' });
    expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
    expect(mockQueryBuilder.range).toHaveBeenCalledWith(5, 9);
    expect(result.total).toBe(12);
    expect(result.hasMore).toBe(true);
  });

  it('filters news by search term', async () => {
    mockQueryBuilder.then.mockImplementation((resolve: (value: { data: unknown[]; error: null; count: number }) => void) =>
      resolve({ data: [], error: null, count: 0 })
    );

    await newsService.getPublicNews({ search: 'economy' });

    expect(mockQueryBuilder.or).toHaveBeenCalledWith(
      'title.ilike.%economy%,content.ilike.%economy%'
    );
  });
});
