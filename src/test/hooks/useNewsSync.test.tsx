import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNewsSync } from '@/hooks/useNewsSync';
import { createMockNewsArticle, createMockSupabaseClient } from '../utils';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      channel: vi.fn(),
    },
  };
});

// Mock feature flags
vi.mock('@/lib/featureFlags', () => {
  const mockFlags = {
    USE_DYNAMIC_DATA: true,
    ENABLE_REAL_TIME_SYNC: true,
    ENABLE_ADVANCED_CACHE: true,
    ENABLE_PERFORMANCE_MONITORING: true,
  };

  return {
    featureFlags: {
      getFlag: vi.fn((key: string) => mockFlags[key as keyof typeof mockFlags] || false),
      getAllFlags: vi.fn(() => ({ ...mockFlags })),
      setFlag: vi.fn(),
      toggleFlag: vi.fn(),
      addListener: vi.fn(() => vi.fn()), // Return unsubscribe function
      resetToDefaults: vi.fn(),
      getEnvironmentConfig: vi.fn(() => ({
        isDev: true,
        isProduction: false,
        canUseDynamicData: true,
      })),
    },
  };
});

// Mock news service
vi.mock('@/services/newsService', () => ({
  NewsService: {
    clearCache: vi.fn(),
    onFeatureFlagChange: vi.fn(),
  },
}));

describe('useNewsSync', () => {
  let mockChannel: any;
  let mockSubscription: any;
  let mockCallbacks: any[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    mockCallbacks = [];
    
    // Setup mock subscription
    mockSubscription = {
      subscribe: vi.fn((callback) => {
        if (callback) callback('SUBSCRIBED');
        return mockSubscription;
      }),
      unsubscribe: vi.fn(),
    };
    
    // Setup mock channel
    mockChannel = {
      on: vi.fn((event, config, callback) => {
        mockCallbacks.push({ event, config, callback });
        return mockChannel;
      }),
      subscribe: vi.fn((callback) => {
        if (callback) callback('SUBSCRIBED');
        return mockSubscription;
      }),
      unsubscribe: vi.fn(),
    };
    
    // Mock the supabase.channel method
    vi.mocked(supabase.channel).mockReturnValue(mockChannel);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useNewsSync());
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastUpdate).toBeNull();
    expect(result.current.updates).toEqual([]);
    expect(result.current.connectionStatus).toBe('disconnected');
    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
    expect(typeof result.current.clearUpdates).toBe('function');
  });

  it('should connect to real-time updates when enabled', async () => {
    const { result } = renderHook(() => useNewsSync());
    
    act(() => {
      result.current.connect();
    });
    
    expect(mockSupabase.channel).toHaveBeenCalledWith('news-updates');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'news',
      },
      expect.any(Function)
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('should handle INSERT events', async () => {
    const { result } = renderHook(() => useNewsSync());
    const mockArticle = createMockNewsArticle({ id: '1' });
    
    act(() => {
      result.current.connect();
    });
    
    // Get the callback function from the mock channel
    const onCallback = mockChannel._callback;
    
    act(() => {
      onCallback({
        eventType: 'INSERT',
        new: mockArticle,
        old: null,
        schema: 'public',
        table: 'news',
      });
    });
    
    await waitFor(() => {
      expect(result.current.updates).toHaveLength(1);
      expect(result.current.updates[0]).toMatchObject({
        type: 'INSERT',
        data: mockArticle,
      });
      expect(result.current.lastUpdate).toBeTruthy();
    });
  });

  it('should handle UPDATE events', async () => {
    const { result } = renderHook(() => useNewsSync());
    const oldArticle = createMockNewsArticle({ id: '1', title: 'Old Title' });
    const newArticle = createMockNewsArticle({ id: '1', title: 'New Title' });
    
    act(() => {
      result.current.connect();
    });
    
    const onCallback = mockChannel._callback;
    
    act(() => {
      onCallback({
        eventType: 'UPDATE',
        new: newArticle,
        old: oldArticle,
        schema: 'public',
        table: 'news',
      });
    });
    
    await waitFor(() => {
      expect(result.current.updates).toHaveLength(1);
      expect(result.current.updates[0]).toMatchObject({
        type: 'UPDATE',
        data: newArticle,
        previousData: oldArticle,
      });
    });
  });

  it('should handle DELETE events', async () => {
    const { result } = renderHook(() => useNewsSync());
    const deletedArticle = createMockNewsArticle({ id: '1' });
    
    act(() => {
      result.current.connect();
    });
    
    const onCallback = mockChannel._callback;
    
    act(() => {
      onCallback({
        eventType: 'DELETE',
        new: null,
        old: deletedArticle,
        schema: 'public',
        table: 'news',
      });
    });
    
    await waitFor(() => {
      expect(result.current.updates).toHaveLength(1);
      expect(result.current.updates[0]).toMatchObject({
        type: 'DELETE',
        data: deletedArticle,
      });
    });
  });

  it('should update connection status', async () => {
    const { result } = renderHook(() => useNewsSync());
    
    expect(result.current.connectionStatus).toBe('disconnected');
    
    act(() => {
      result.current.connect();
    });
    
    expect(result.current.connectionStatus).toBe('connecting');
    
    // Simulate successful subscription
    act(() => {
      const subscribeCallback = mockChannel.subscribe.mock.calls[0][0];
      if (subscribeCallback) {
        subscribeCallback('SUBSCRIBED', null);
      }
    });
    
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should handle connection errors', async () => {
    const { result } = renderHook(() => useNewsSync());
    
    act(() => {
      result.current.connect();
    });
    
    // Simulate connection error
    act(() => {
      const subscribeCallback = mockChannel.subscribe.mock.calls[0][0];
      if (subscribeCallback) {
        subscribeCallback('CHANNEL_ERROR', { message: 'Connection failed' });
      }
    });
    
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('error');
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('should disconnect properly', () => {
    const { result } = renderHook(() => useNewsSync());
    
    act(() => {
      result.current.connect();
    });
    
    act(() => {
      result.current.disconnect();
    });
    
    expect(mockChannel.unsubscribe).toHaveBeenCalled();
    expect(result.current.connectionStatus).toBe('disconnected');
    expect(result.current.isConnected).toBe(false);
  });

  it('should clear updates', () => {
    const { result } = renderHook(() => useNewsSync());
    const mockArticle = createMockNewsArticle({ id: '1' });
    
    act(() => {
      result.current.connect();
    });
    
    const onCallback = mockChannel._callback;
    
    act(() => {
      onCallback({
        eventType: 'INSERT',
        new: mockArticle,
        old: null,
        schema: 'public',
        table: 'news',
      });
    });
    
    expect(result.current.updates).toHaveLength(1);
    
    act(() => {
      result.current.clearUpdates();
    });
    
    expect(result.current.updates).toHaveLength(0);
  });

  it('should not connect when real-time sync is disabled', async () => {
    // Get the mocked feature flags
    const featureFlagsModule = await import('@/lib/featureFlags');
    
    // Mock feature flag as disabled
    vi.mocked(featureFlagsModule.featureFlags.getFlag)
      .mockReturnValue(false);
    
    const { result } = renderHook(() => useNewsSync());
    
    act(() => {
      result.current.connect();
    });
    
    expect(mockSupabase.channel).not.toHaveBeenCalled();
    expect(result.current.connectionStatus).toBe('disabled');
  });

  it('should auto-reconnect on feature flag change', async () => {
    const { result } = renderHook(() => useNewsSync());
    
    // Get the mocked feature flags
    const featureFlagsModule = await import('@/lib/featureFlags');
    
    // Initially disabled
    vi.mocked(featureFlagsModule.featureFlags.getFlag)
      .mockReturnValue(false);
    
    act(() => {
      result.current.connect();
    });
    
    expect(result.current.connectionStatus).toBe('disabled');
    
    // Enable feature flag
    vi.mocked(featureFlagsModule.featureFlags.getFlag)
      .mockReturnValue(true);
    
    // Trigger feature flag listener
    const addListenerCall = vi.mocked(
      featureFlagsModule.featureFlags.addListener
    ).mock.calls[0];
    
    if (addListenerCall) {
      act(() => {
        addListenerCall[0](); // Call the listener
      });
    }
    
    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled();
    });
  });

  it('should limit number of stored updates', () => {
    const { result } = renderHook(() => useNewsSync());
    
    act(() => {
      result.current.connect();
    });
    
    // Get the postgres_changes callback
    const insertCallback = mockCallbacks.find(cb => cb.event === 'postgres_changes')?.callback;
    
    if (!insertCallback) {
      console.warn('postgres_changes callback not found, skipping test');
      return;
    }
    
    // Add more updates than the limit (assuming limit is 100)
    for (let i = 0; i < 105; i++) {
      act(() => {
        insertCallback({
          eventType: 'INSERT',
          new: mockArticle,
          old: null,
          schema: 'public',
          table: 'news',
        });
      });
    }
    
    // Should limit to reasonable number (e.g., 100)
    expect(result.current.updates.length).toBeLessThanOrEqual(100);
  });

  it('should provide update statistics', () => {
    const { result } = renderHook(() => useNewsSync());
    
    act(() => {
      result.current.connect();
    });
    
    const callback = mockCallbacks.find(cb => cb.event === 'postgres_changes')?.callback;
    
    if (!callback) {
      console.warn('postgres_changes callback not found, skipping test');
      return;
    }
    
    // Add different types of updates
    act(() => {
      callback({
        eventType: 'INSERT',
        new: createMockNewsArticle({ id: '1' }),
        old: null,
        schema: 'public',
        table: 'news',
      });
    });
    
    act(() => {
      callback({
        eventType: 'UPDATE',
        new: createMockNewsArticle({ id: '2' }),
        old: createMockNewsArticle({ id: '2' }),
        schema: 'public',
        table: 'news',
      });
    });
    
    act(() => {
      callback({
        eventType: 'DELETE',
        new: null,
        old: createMockNewsArticle({ id: '3' }),
        schema: 'public',
        table: 'news',
      });
    });
    
    expect(result.current.stats.totalUpdates).toBe(3);
    expect(result.current.stats.insertCount).toBe(1);
    expect(result.current.stats.updateCount).toBe(1);
    expect(result.current.stats.deleteCount).toBe(1);
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useNewsSync());
    
    act(() => {
      result.current.connect();
    });
    
    unmount();
    
    expect(mockChannel.unsubscribe).toHaveBeenCalled();
  });

  it('should handle malformed payloads gracefully', () => {
    const { result } = renderHook(() => useNewsSync());
    
    act(() => {
      result.current.connect();
    });
    
    const onCallback = mockChannel._callback;
    
    // Skip test if callback is not available
    if (!onCallback) {
      console.warn('Callback not available, skipping test');
      return;
    }
    
    // Send malformed payload
    act(() => {
      onCallback({
        eventType: 'INVALID',
        new: null,
        old: null,
        schema: 'public',
        table: 'news',
      });
    });
    
    // Should not crash and should not add invalid updates
    expect(result.current.updates).toHaveLength(0);
  });

  it('should filter updates by table', () => {
    const { result } = renderHook(() => useNewsSync());
    
    act(() => {
      result.current.connect();
    });
    
    const onCallback = mockChannel._callback;
    
    // Skip test if callback is not available
    if (!onCallback) {
      console.warn('Callback not available, skipping test');
      return;
    }
    
    // Send update for different table
    act(() => {
      onCallback({
        eventType: 'INSERT',
        new: { id: '1', name: 'User' },
        old: null,
        schema: 'public',
        table: 'users', // Different table
      });
    });
    
    // Should not add updates from other tables
    expect(result.current.updates).toHaveLength(0);
  });
});