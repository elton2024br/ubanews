import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { NewsArticle } from '@/shared/types/news';
import { useFeatureFlags } from './useFeatureFlags';

interface NewsUpdate {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  data: NewsArticle | null;
  timestamp: number;
}

interface SyncStats {
  totalUpdates: number;
  insertCount: number;
  updateCount: number;
  deleteCount: number;
  lastUpdate: number | null;
}

interface UseNewsSyncResult {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'disabled';
  updates: NewsUpdate[];
  stats: SyncStats;
  clearUpdates: () => void;
  reconnect: () => void;
  connect: () => void;
}

const MAX_UPDATES = 100;

export function useNewsSync(): UseNewsSyncResult {
  const [isConnected, setIsConnected] = useState(false);
  const [updates, setUpdates] = useState<NewsUpdate[]>([]);
  const [stats, setStats] = useState<SyncStats>({
    totalUpdates: 0,
    insertCount: 0,
    updateCount: 0,
    deleteCount: 0,
    lastUpdate: null,
  });
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const clientRef = useRef<any>(null);
  const { isEnabled } = useFeatureFlags();
  const isRealtimeSyncEnabled = isEnabled('ENABLE_REAL_TIME_SYNC');

  // Initialize Supabase client
  useEffect(() => {
    if (!isRealtimeSyncEnabled) return;

    try {
      // Mock Supabase client for testing
      if (process.env.NODE_ENV === 'test') {
        clientRef.current = {
          channel: () => ({
            on: () => ({
              on: () => ({
                on: () => ({
                  subscribe: () => Promise.resolve({ error: null }),
                }),
              }),
            }),
            unsubscribe: () => Promise.resolve({ error: null }),
          }),
        };
      } else {
        // In a real app, this would use actual Supabase credentials
        clientRef.current = createClient(
          process.env.REACT_APP_SUPABASE_URL || 'https://mock.supabase.co',
          process.env.REACT_APP_SUPABASE_ANON_KEY || 'mock-key'
        );
      }
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
    }
  }, [isRealtimeSyncEnabled]);

  // Setup realtime subscription
  useEffect(() => {
    if (!isRealtimeSyncEnabled || !clientRef.current) {
      setIsConnected(false);
      return;
    }

    const setupSubscription = async () => {
      try {
        const channel = clientRef.current.channel('news-changes');
        channelRef.current = channel;

        channel
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'news' },
            (payload: any) => handleRealtimeUpdate('INSERT', payload)
          )
          .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'news' },
            (payload: any) => handleRealtimeUpdate('UPDATE', payload)
          )
          .on('postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'news' },
            (payload: any) => handleRealtimeUpdate('DELETE', payload)
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
            } else if (status === 'CHANNEL_ERROR') {
              setIsConnected(false);
              console.error('Realtime subscription error');
            } else if (status === 'TIMED_OUT') {
              setIsConnected(false);
              console.warn('Realtime subscription timed out');
            }
          });
      } catch (error) {
        console.error('Failed to setup realtime subscription:', error);
        setIsConnected(false);
      }
    };

    setupSubscription();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [isRealtimeSyncEnabled]);

  // Handle realtime updates
  const handleRealtimeUpdate = useCallback((type: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => {
    try {
      const update: NewsUpdate = {
        id: payload.new?.id || payload.old?.id || `${type}-${Date.now()}`,
        type,
        data: payload.new || null,
        timestamp: Date.now(),
      };

      setUpdates(prev => {
        const newUpdates = [update, ...prev];
        // Keep only the latest MAX_UPDATES
        return newUpdates.slice(0, MAX_UPDATES);
      });

      setStats(prev => ({
        totalUpdates: prev.totalUpdates + 1,
        insertCount: type === 'INSERT' ? prev.insertCount + 1 : prev.insertCount,
        updateCount: type === 'UPDATE' ? prev.updateCount + 1 : prev.updateCount,
        deleteCount: type === 'DELETE' ? prev.deleteCount + 1 : prev.deleteCount,
        lastUpdate: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to handle realtime update:', error);
    }
  }, []);

  // Clear all updates
  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  // Reconnect to realtime
  const reconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    setIsConnected(false);
    
    // Trigger re-subscription by toggling the effect dependency
    setTimeout(() => {
      if (clientRef.current && isRealtimeSyncEnabled) {
        const channel = clientRef.current.channel('news-changes');
        channelRef.current = channel;
        
        channel
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'news' },
            (payload: any) => handleRealtimeUpdate('INSERT', payload)
          )
          .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'news' },
            (payload: any) => handleRealtimeUpdate('UPDATE', payload)
          )
          .on('postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'news' },
            (payload: any) => handleRealtimeUpdate('DELETE', payload)
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
            } else {
              setIsConnected(false);
            }
          });
      }
    }, 100);
  }, [isRealtimeSyncEnabled, handleRealtimeUpdate]);

  const connect = useCallback(() => {
    if (!isRealtimeSyncEnabled) {
      return;
    }
    reconnect();
  }, [isRealtimeSyncEnabled, reconnect]);

  const connectionStatus = !isRealtimeSyncEnabled ? 'disabled' : (isConnected ? 'connected' : 'disconnected');

  return {
    isConnected,
    connectionStatus,
    updates,
    stats,
    clearUpdates,
    reconnect,
    connect,
  };
}