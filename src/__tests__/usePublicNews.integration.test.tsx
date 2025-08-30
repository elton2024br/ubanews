import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { usePublicNews } from '@/hooks/usePublicNews';
import newsService from '@/services/newsService';

// Wrapper with React Query provider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePublicNews integration', () => {
  beforeEach(() => {
    newsService.clearCache();
    newsService.setDynamicMode(false); // use static data
  });

  it('fetches news via service and exposes data', async () => {
    const { result } = renderHook(() => usePublicNews(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data.length).toBeGreaterThan(0);
    });
    expect(result.current.error).toBeNull();
  });
});
