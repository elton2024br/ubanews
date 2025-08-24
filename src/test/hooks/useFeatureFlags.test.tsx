import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useFeatureFlag, 
  useIsFeatureEnabled, 
  useDynamicData, 
  useFeatureFlags,
  useProgressiveMigration,
  useMigrationMetrics
} from '@/hooks/useFeatureFlags';
import { featureFlags } from '@/lib/featureFlags';
import { mockLocalStorage } from '../utils';

// Mock featureFlags
vi.mock('@/lib/featureFlags', () => {
  const mockFlags = {
    USE_DYNAMIC_DATA: false,
    ENABLE_REAL_TIME_SYNC: false,
    ENABLE_ADVANCED_CACHE: true,
    ENABLE_PERFORMANCE_MONITORING: true,
  };

  const mockListeners = new Map();

  const mockFeatureFlags = {
    getFlag: vi.fn((key: string) => mockFlags[key as keyof typeof mockFlags]),
    setFlag: vi.fn((key: string, value: boolean) => {
      mockFlags[key as keyof typeof mockFlags] = value;
      const listeners = mockListeners.get(key) || new Set();
      listeners.forEach((listener: (value: boolean) => void) => listener(value));
    }),
    toggleFlag: vi.fn((key: string) => {
      const currentValue = mockFlags[key as keyof typeof mockFlags];
      const newValue = !currentValue;
      mockFlags[key as keyof typeof mockFlags] = newValue;
      const listeners = mockListeners.get(key) || new Set();
      listeners.forEach((listener: (value: boolean) => void) => listener(newValue));
      return newValue;
    }),
    getAllFlags: vi.fn(() => ({ ...mockFlags })),
    addListener: vi.fn((key: string, callback: (value: boolean) => void) => {
      if (!mockListeners.has(key)) {
        mockListeners.set(key, new Set());
      }
      const listeners = mockListeners.get(key);
      listeners.add(callback);
      return () => listeners.delete(callback);
    }),
    resetToDefaults: vi.fn(() => {
      Object.keys(mockFlags).forEach(key => {
        mockFlags[key as keyof typeof mockFlags] = false;
      });
    }),
    getEnvironmentConfig: vi.fn(() => ({
      isDev: true,
      isProduction: false,
      canUseDynamicData: mockFlags.USE_DYNAMIC_DATA,
    })),
  };

  return {
    featureFlags: mockFeatureFlags,
  };
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage(),
});

describe('useFeatureFlag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return current flag value', () => {
    vi.mocked(featureFlags.getFlag).mockReturnValue(true);
    
    const { result } = renderHook(() => useFeatureFlag('USE_DYNAMIC_DATA'));
    
    expect(result.current).toBe(true);
    expect(featureFlags.getFlag).toHaveBeenCalledWith('USE_DYNAMIC_DATA');
  });

  it('should update when flag changes', () => {
    let mockValue = false;
    vi.mocked(featureFlags.getFlag).mockImplementation(() => mockValue);
    
    const { result } = renderHook(() => useFeatureFlag('USE_DYNAMIC_DATA'));
    
    expect(result.current).toBe(false);
    
    // Simulate flag change
    act(() => {
      mockValue = true;
      // Trigger listener
      const addListenerCall = vi.mocked(featureFlags.addListener).mock.calls[0];
      if (addListenerCall) {
        addListenerCall[0]();
      }
    });
    
    expect(result.current).toBe(true);
  });
});

describe('useIsFeatureEnabled', () => {
  it('should return boolean for feature status', () => {
    vi.mocked(featureFlags.getFlag).mockReturnValue(true);
    
    const { result } = renderHook(() => useIsFeatureEnabled('ENABLE_ADVANCED_CACHE'));
    
    expect(result.current).toBe(true);
  });

  it('should return false for undefined flags', () => {
    vi.mocked(featureFlags.getFlag).mockReturnValue(undefined);
    
    const { result } = renderHook(() => useIsFeatureEnabled('NON_EXISTENT_FLAG' as keyof FeatureFlags));
    
    expect(result.current).toBe(false);
  });
});

describe('useDynamicData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return dynamic data status and controls', () => {
    vi.mocked(featureFlags.getFlag)
      .mockReturnValueWhenCalledWith('USE_DYNAMIC_DATA', true)
      .mockReturnValueWhenCalledWith('ENABLE_REAL_TIME_SYNC', false);
    
    const { result } = renderHook(() => useDynamicData());
    
    expect(result.current.isEnabled).toBe(true);
    expect(result.current.isRealTimeEnabled).toBe(false);
    expect(typeof result.current.enable).toBe('function');
    expect(typeof result.current.disable).toBe('function');
    expect(typeof result.current.toggle).toBe('function');
    expect(typeof result.current.enableRealTime).toBe('function');
    expect(typeof result.current.disableRealTime).toBe('function');
  });

  it('should enable dynamic data', () => {
    const { result } = renderHook(() => useDynamicData());
    
    act(() => {
      result.current.enable();
    });
    
    expect(featureFlags.setFlag).toHaveBeenCalledWith('USE_DYNAMIC_DATA', true);
  });

  it('should disable dynamic data', () => {
    const { result } = renderHook(() => useDynamicData());
    
    act(() => {
      result.current.disable();
    });
    
    expect(featureFlags.setFlag).toHaveBeenCalledWith('USE_DYNAMIC_DATA', false);
  });

  it('should toggle dynamic data', () => {
    vi.mocked(featureFlags.toggleFlag).mockReturnValue(true);
    
    const { result } = renderHook(() => useDynamicData());
    
    act(() => {
      result.current.toggle();
    });
    
    expect(featureFlags.toggleFlag).toHaveBeenCalledWith('USE_DYNAMIC_DATA');
  });

  it('should enable real-time sync', () => {
    const { result } = renderHook(() => useDynamicData());
    
    act(() => {
      result.current.enableRealTime();
    });
    
    expect(featureFlags.setFlag).toHaveBeenCalledWith('ENABLE_REAL_TIME_SYNC', true);
  });

  it('should disable real-time sync', () => {
    const { result } = renderHook(() => useDynamicData());
    
    act(() => {
      result.current.disableRealTime();
    });
    
    expect(featureFlags.setFlag).toHaveBeenCalledWith('ENABLE_REAL_TIME_SYNC', false);
  });
});

describe('useFeatureFlags', () => {
  it('should return all flags and management functions', () => {
    const mockFlags = {
      USE_DYNAMIC_DATA: true,
      ENABLE_REAL_TIME_SYNC: false,
      ENABLE_ADVANCED_CACHE: true,
      ENABLE_PERFORMANCE_MONITORING: true,
    };
    
    vi.mocked(featureFlags.getAllFlags).mockReturnValue(mockFlags);
    
    const { result } = renderHook(() => useFeatureFlags());
    
    expect(result.current.flags).toEqual(mockFlags);
    expect(typeof result.current.getFlag).toBe('function');
    expect(typeof result.current.setFlag).toBe('function');
    expect(typeof result.current.toggleFlag).toBe('function');
    expect(typeof result.current.resetFlags).toBe('function');
  });

  it('should set individual flags', () => {
    const { result } = renderHook(() => useFeatureFlags());
    
    act(() => {
      result.current.setFlag('USE_DYNAMIC_DATA', true);
    });
    
    expect(featureFlags.setFlag).toHaveBeenCalledWith('USE_DYNAMIC_DATA', true);
  });

  it('should toggle individual flags', () => {
    const { result } = renderHook(() => useFeatureFlags());
    
    act(() => {
      result.current.toggleFlag('ENABLE_ADVANCED_CACHE');
    });
    
    expect(featureFlags.toggleFlag).toHaveBeenCalledWith('ENABLE_ADVANCED_CACHE');
  });
});

describe('useProgressiveMigration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide migration status and controls', () => {
    vi.mocked(featureFlags.getFlag).mockReturnValue(false);
    
    const { result } = renderHook(() => useProgressiveMigration());
    
    expect(result.current.isUsingDynamic).toBe(false);
    expect(result.current.migrationPhase).toBe('static');
    expect(typeof result.current.startMigration).toBe('function');
    expect(typeof result.current.rollback).toBe('function');
    expect(typeof result.current.completeMigration).toBe('function');
  });

  it('should determine migration phase correctly', () => {
    // Test static phase
    vi.mocked(featureFlags.getFlag)
      .mockReturnValueWhenCalledWith('USE_DYNAMIC_DATA', false)
      .mockReturnValueWhenCalledWith('ENABLE_REAL_TIME_SYNC', false);
    
    const { result: staticResult } = renderHook(() => useProgressiveMigration());
    expect(staticResult.current.migrationPhase).toBe('static');
    
    // Test hybrid phase
    vi.mocked(featureFlags.getFlag)
      .mockReturnValueWhenCalledWith('USE_DYNAMIC_DATA', true)
      .mockReturnValueWhenCalledWith('ENABLE_REAL_TIME_SYNC', false);
    
    const { result: hybridResult } = renderHook(() => useProgressiveMigration());
    expect(hybridResult.current.migrationPhase).toBe('hybrid');
    
    // Test dynamic phase
    vi.mocked(featureFlags.getFlag)
      .mockReturnValueWhenCalledWith('USE_DYNAMIC_DATA', true)
      .mockReturnValueWhenCalledWith('ENABLE_REAL_TIME_SYNC', true);
    
    const { result: dynamicResult } = renderHook(() => useProgressiveMigration());
    expect(dynamicResult.current.migrationPhase).toBe('dynamic');
  });

  it('should start migration', () => {
    const { result } = renderHook(() => useProgressiveMigration());
    
    act(() => {
      result.current.startMigration();
    });
    
    expect(featureFlags.setFlag).toHaveBeenCalledWith('USE_DYNAMIC_DATA', true);
  });

  it('should rollback migration', () => {
    const { result } = renderHook(() => useProgressiveMigration());
    
    act(() => {
      result.current.rollback();
    });
    
    expect(featureFlags.setFlag).toHaveBeenCalledWith('USE_DYNAMIC_DATA', false);
    expect(featureFlags.setFlag).toHaveBeenCalledWith('ENABLE_REAL_TIME_SYNC', false);
  });

  it('should complete migration', () => {
    const { result } = renderHook(() => useProgressiveMigration());
    
    act(() => {
      result.current.completeMigration();
    });
    
    expect(featureFlags.setFlag).toHaveBeenCalledWith('USE_DYNAMIC_DATA', true);
    expect(featureFlags.setFlag).toHaveBeenCalledWith('ENABLE_REAL_TIME_SYNC', true);
  });
});

describe('useMigrationMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should provide metrics and recording functions', () => {
    const { result } = renderHook(() => useMigrationMetrics());
    
    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics.loadTimes).toEqual([]);
    expect(result.current.metrics.errors).toEqual([]);
    expect(result.current.metrics.successRate).toBe(0);
    expect(typeof result.current.recordLoadTime).toBe('function');
    expect(typeof result.current.recordError).toBe('function');
    expect(typeof result.current.clearMetrics).toBe('function');
  });

  it('should record load times', () => {
    const { result } = renderHook(() => useMigrationMetrics());
    
    act(() => {
      result.current.recordLoadTime('static', 100);
      result.current.recordLoadTime('supabase', 200);
    });
    
    expect(result.current.metrics.loadTimes).toHaveLength(2);
    expect(result.current.metrics.loadTimes[0]).toMatchObject({
      source: 'static',
      duration: 100,
    });
    expect(result.current.metrics.loadTimes[1]).toMatchObject({
      source: 'supabase',
      duration: 200,
    });
  });

  it('should record errors', () => {
    const { result } = renderHook(() => useMigrationMetrics());
    
    act(() => {
      result.current.recordError('supabase', 'Connection failed');
    });
    
    expect(result.current.metrics.errors).toHaveLength(1);
    expect(result.current.metrics.errors[0]).toMatchObject({
      source: 'supabase',
      message: 'Connection failed',
    });
  });

  it('should calculate success rate correctly', () => {
    const { result } = renderHook(() => useMigrationMetrics());
    
    act(() => {
      // Record 3 successful loads and 1 error
      result.current.recordLoadTime('static', 100);
      result.current.recordLoadTime('supabase', 150);
      result.current.recordLoadTime('supabase', 200);
      result.current.recordError('supabase', 'Failed');
    });
    
    expect(result.current.metrics.successRate).toBe(75); // 3/4 = 75%
  });

  it('should clear metrics', () => {
    const { result } = renderHook(() => useMigrationMetrics());
    
    act(() => {
      result.current.recordLoadTime('static', 100);
      result.current.recordError('supabase', 'Error');
    });
    
    expect(result.current.metrics.loadTimes).toHaveLength(1);
    expect(result.current.metrics.errors).toHaveLength(1);
    
    act(() => {
      result.current.clearMetrics();
    });
    
    expect(result.current.metrics.loadTimes).toHaveLength(0);
    expect(result.current.metrics.errors).toHaveLength(0);
    expect(result.current.metrics.successRate).toBe(0);
  });

  it('should calculate average load times by source', () => {
    const { result } = renderHook(() => useMigrationMetrics());
    
    act(() => {
      result.current.recordLoadTime('static', 100);
      result.current.recordLoadTime('static', 200);
      result.current.recordLoadTime('supabase', 300);
      result.current.recordLoadTime('supabase', 400);
    });
    
    expect(result.current.metrics.averageLoadTime.static).toBe(150);
    expect(result.current.metrics.averageLoadTime.supabase).toBe(350);
  });
});