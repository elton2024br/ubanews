import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { NewsArticle } from '@/shared/types/news';

// Create a custom render function that includes providers
export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data generators
export const createMockNewsArticle = (overrides?: Partial<NewsArticle>): NewsArticle => ({
  id: '1',
  title: 'Test Article',
  date: new Date().toISOString(),
  category: 'Gastronomia',
  tags: ['test'],
  image: {
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
    caption: 'Test caption'
  },
  excerpt: 'Test excerpt',
  content: 'Test content',
  readTime: 5,
  featured: false,
  author: 'Test Author',
  ...overrides,
});

export const createMockNewsArticles = (count: number = 3): NewsArticle[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockNewsArticle({
      id: `${index + 1}`,
      title: `Test Article ${index + 1}`,
      content: `Test content ${index + 1}`,
    })
  );
};

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockRange = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();

  return {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      range: mockRange,
      single: mockSingle,
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  };
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock feature flags
export const mockFeatureFlags = () => {
  const flags = {
    USE_DYNAMIC_DATA: false,
    ENABLE_REAL_TIME_SYNC: false,
    ENABLE_ADVANCED_CACHE: true,
    ENABLE_PERFORMANCE_MONITORING: true,
  };

  const listeners = new Map();

  return {
    getFlag: vi.fn((key: string) => flags[key as keyof typeof flags]),
    setFlag: vi.fn((key: string, value: boolean) => {
      flags[key as keyof typeof flags] = value;
      const flagListeners = listeners.get(key) || new Set();
      flagListeners.forEach((callback: any) => callback(value));
    }),
    toggleFlag: vi.fn((key: string) => {
      const newValue = !flags[key as keyof typeof flags];
      flags[key as keyof typeof flags] = newValue;
      const flagListeners = listeners.get(key) || new Set();
      flagListeners.forEach((callback: any) => callback(newValue));
      return newValue;
    }),
    getAllFlags: vi.fn(() => ({ ...flags })),
    addListener: vi.fn((key: string, callback: any) => {
      if (!listeners.has(key)) {
        listeners.set(key, new Set());
      }
      const flagListeners = listeners.get(key);
      flagListeners.add(callback);
      return () => flagListeners.delete(callback);
    }),
    resetToDefaults: vi.fn(() => {
      Object.keys(flags).forEach(key => {
        flags[key as keyof typeof flags] = false;
      });
    }),
    getEnvironmentConfig: vi.fn(() => ({
      isDev: true,
      isProduction: false,
      canUseDynamicData: flags.USE_DYNAMIC_DATA,
    })),
  };
};

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };