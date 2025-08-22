import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePaginatedData } from '@/hooks/use-infinite-scroll';

describe('usePaginatedData', () => {
  it('loads and paginates data correctly', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([{ id: 3 }, { id: 4 }]);

    const { result } = renderHook(() =>
      usePaginatedData<{ id: number }>({ fetchPage, pageSize: 2 })
    );

    await waitFor(() => expect(result.current.data.length).toBe(2));
    expect(fetchPage).toHaveBeenCalledWith(1, 2);

    await act(async () => {
      await result.current.fetchMore();
    });

    expect(fetchPage).toHaveBeenCalledWith(2, 2);
    expect(result.current.data.length).toBe(4);
  });

  it('refresh resets state', async () => {
    const fetchPage = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const { result } = renderHook(() =>
      usePaginatedData<{ id: number }>({ fetchPage, pageSize: 2 })
    );

    await waitFor(() => expect(result.current.data.length).toBe(2));

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(result.current.data.length).toBe(2);
    expect(result.current.hasMore).toBe(true);
  });
});
