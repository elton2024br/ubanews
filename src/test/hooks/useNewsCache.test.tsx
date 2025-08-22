import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNewsCache } from '@/hooks/useNewsCache';
import { createMockNewsArticle } from '../utils';

// Mock localStorage
const mockLocalStorage = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage(),
});

// Mock Date.now for consistent testing
const mockNow = 1640995200000; // 2022-01-01 00:00:00
vi.spyOn(Date, 'now').mockReturnValue(mockNow);

describe('useNewsCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty cache', () => {
    const { result } = renderHook(() => useNewsCache());
    
    expect(result.current.cache).toEqual({});
    expect(result.current.stats.size).toBe(0);
    expect(result.current.stats.hitRate).toBe(0);
  });

  it('should set and get cache entries', () => {
    const { result } = renderHook(() => useNewsCache());
    const mockArticles = [createMockNewsArticle({ id: '1' })];
    
    act(() => {
      result.current.set('test-key', mockArticles);
    });
    
    expect(result.current.cache['test-key']).toBeDefined();
    expect(result.current.cache['test-key'].data).toEqual(mockArticles);
    expect(result.current.cache['test-key'].timestamp).toBe(mockNow);
    
    const cachedData = result.current.get('test-key');
    expect(cachedData).toEqual(mockArticles);
  });

  it('should return null for non-existent keys', () => {
    const { result } = renderHook(() => useNewsCache());
    
    const cachedData = result.current.get('non-existent');
    expect(cachedData).toBeNull();
  });

  it('should return null for expired entries', () => {
    const { result } = renderHook(() => useNewsCache());
    const mockArticles = [createMockNewsArticle({ id: '1' })];
    
    // Set cache entry
    act(() => {
      result.current.set('test-key', mockArticles);
    });
    
    // Mock time passing beyond TTL (default 5 minutes = 300000ms)
    vi.spyOn(Date, 'now').mockReturnValue(mockNow + 400000);
    
    const cachedData = result.current.get('test-key');
    expect(cachedData).toBeNull();
  });

  it('should respect custom TTL', () => {
    const { result } = renderHook(() => useNewsCache());
    const mockArticles = [createMockNewsArticle({ id: '1' })];
    const customTTL = 60000; // 1 minute
    
    act(() => {
      result.current.set('test-key', mockArticles, customTTL);
    });
    
    // Mock time passing within custom TTL
    vi.spyOn(Date, 'now').mockReturnValue(mockNow + 30000);
    let cachedData = result.current.get('test-key');
    expect(cachedData).toEqual(mockArticles);
    
    // Mock time passing beyond custom TTL
    vi.spyOn(Date, 'now').mockReturnValue(mockNow + 70000);
    cachedData = result.current.get('test-key');
    expect(cachedData).toBeNull();
  });

  it('should check if key exists and is valid', () => {
    const { result } = renderHook(() => useNewsCache());
    const mockArticles = [createMockNewsArticle({ id: '1' })];
    
    expect(result.current.has('test-key')).toBe(false);
    
    act(() => {
      result.current.set('test-key', mockArticles);
    });
    
    expect(result.current.has('test-key')).toBe(true);
    
    // Mock expiration
    vi.spyOn(Date, 'now').mockReturnValue(mockNow + 400000);
    expect(result.current.has('test-key')).toBe(false);
  });

  it('should remove cache entries', () => {
    const { result } = renderHook(() => useNewsCache());
    const mockArticles = [createMockNewsArticle({ id: '1' })];
    
    act(() => {
      result.current.set('test-key', mockArticles);
    });
    
    expect(result.current.has('test-key')).toBe(true);
    
    act(() => {
      result.current.remove('test-key');
    });
    
    expect(result.current.has('test-key')).toBe(false);
    expect(result.current.get('test-key')).toBeNull();
  });

  it('should clear all cache entries', () => {
    const { result } = renderHook(() => useNewsCache());
    const mockArticles1 = [createMockNewsArticle({ id: '1' })];
    const mockArticles2 = [createMockNewsArticle({ id: '2' })];
    
    act(() => {
      result.current.set('key1', mockArticles1);
      result.current.set('key2', mockArticles2);
    });
    
    expect(result.current.stats.size).toBe(2);
    
    act(() => {
      result.current.clear();
    });
    
    expect(result.current.stats.size).toBe(0);
    expect(result.current.has('key1')).toBe(false);
    expect(result.current.has('key2')).toBe(false);
  });

  it('should calculate cache statistics correctly', () => {
    const { result } = renderHook(() => useNewsCache());
    const mockArticles = [createMockNewsArticle({ id: '1' })];
    
    // Initial stats
    expect(result.current.stats.size).toBe(0);
    expect(result.current.stats.hits).toBe(0);
    expect(result.current.stats.misses).toBe(0);
    expect(result.current.stats.hitRate).toBe(0);
    
    // Add cache entry
    act(() => {
      result.current.set('test-key', mockArticles);
    });
    
    expect(result.current.stats.size).toBe(1);
    
    // Cache hit
    result.current.get('test-key');
    expect(result.current.stats.hits).toBe(1);
    expect(result.current.stats.hitRate).toBe(100);
    
    // Cache miss
    result.current.get('non-existent');
    expect(result.current.stats.misses).toBe(1);
    expect(result.current.stats.hitRate).toBe(50); // 1 hit, 1 miss = 50%
  });

  it('should persist cache to localStorage', () => {
    const { result } = renderHook(() => useNewsCache());
    const mockArticles = [createMockNewsArticle({ id: '1' })];
    
    act(() => {
      result.current.set('test-key', mockArticles);
    });
    
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'news-cache',
      expect.stringContaining('test-key')
    );
  });

  it('should load cache from localStorage on initialization', () => {
    const mockArticles = [createMockNewsArticle({ id: '1' })];
    const cacheData = {
      'test-key': {
        data: mockArticles,
        timestamp: mockNow,
        ttl: 300000,
      },
    };
    
    vi.mocked(window.localStorage.getItem).mockReturnValue(
      JSON.stringify(cacheData)
    );
    
    const { result } = renderHook(() => useNewsCache());
    
    expect(result.current.has('test-key')).toBe(true);
    expect(result.current.get('test-key')).toEqual(mockArticles);
  });

  it('should handle corrupted localStorage data gracefully', () => {
    vi.mocked(window.localStorage.getItem).mockReturnValue('invalid-json');
    
    const { result } = renderHook(() => useNewsCache());
    
    expect(result.current.cache).toEqual({});
    expect(result.current.stats.size).toBe(0);
  });

  it('should clean up expired entries automatically', () => {
    const { result } = renderHook(() => useNewsCache());
    const mockArticles1 = [createMockNewsArticle({ id: '1' })];
    const mockArticles2 = [createMockNewsArticle({ id: '2' })];
    
    // Set entries with different timestamps
    act(() => {
      result.current.set('fresh-key', mockArticles1);
    });
    
    // Mock older timestamp for second entry
    vi.spyOn(Date, 'now').mockReturnValue(mockNow - 400000);
    act(() => {
      result.current.set('expired-key', mockArticles2);
    });
    
    // Reset to current time
    vi.spyOn(Date, 'now').mockReturnValue(mockNow);
    
    // Trigger cleanup by accessing cache
    result.current.get('fresh-key');
    
    expect(result.current.has('fresh-key')).toBe(true);
    expect(result.current.has('expired-key')).toBe(false);
  });

  it('should handle cache size limits', () => {
    const { result } = renderHook(() => useNewsCache());
    
    // Add many entries to test size limits
    act(() => {
      for (let i = 0; i < 150; i++) {
        const mockArticles = [createMockNewsArticle({ id: i.toString() })];
        result.current.set(`key-${i}`, mockArticles);
      }
    });
    
    // Should not exceed reasonable cache size (implementation dependent)
    expect(result.current.stats.size).toBeLessThanOrEqual(100);
  });

  it('should provide cache keys', () => {
    const { result } = renderHook(() => useNewsCache());
    const mockArticles1 = [createMockNewsArticle({ id: '1' })];
    const mockArticles2 = [createMockNewsArticle({ id: '2' })];
    
    act(() => {
      result.current.set('key1', mockArticles1);
      result.current.set('key2', mockArticles2);
    });
    
    const keys = result.current.keys();
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
    expect(keys).toHaveLength(2);
  });

  it('should invalidate cache by pattern', () => {
    const { result } = renderHook(() => useNewsCache());
    const mockArticles = [createMockNewsArticle({ id: '1' })];
    
    act(() => {
      result.current.set('news-public-page-1', mockArticles);
      result.current.set('news-public-page-2', mockArticles);
      result.current.set('news-featured', mockArticles);
      result.current.set('other-data', mockArticles);
    });
    
    expect(result.current.stats.size).toBe(4);
    
    act(() => {
      result.current.invalidatePattern('news-public');
    });
    
    expect(result.current.has('news-public-page-1')).toBe(false);
    expect(result.current.has('news-public-page-2')).toBe(false);
    expect(result.current.has('news-featured')).toBe(true);
    expect(result.current.has('other-data')).toBe(true);
  });
});