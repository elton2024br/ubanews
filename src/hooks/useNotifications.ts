// Hook para gerenciar notificações em tempo real com Supabase
// Implementa subscriptions, CRUD operations e cache local

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';
import type {
  Notification,
  NotificationPreferences,
  CreateNotificationParams,
  NotificationFilters,
  UseNotificationsOptions,
  UseNotificationsReturn,
  NotificationsState
} from '../types/notifications';

/**
 * Hook personalizado para gerenciar notificações em tempo real
 * Integra com Supabase Realtime para atualizações instantâneas
 */
export const useNotifications = (options: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const { user } = useAuth();
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 segundos
    enableRealtime = true,
    filters = {}
  } = options;

  // Estado principal das notificações
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,
    hasMore: true
  });

  // Estado das preferências do usuário
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Refs para controle de subscriptions e intervals
  const subscriptionRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const offsetRef = useRef(0);
  const loadingRef = useRef(false);

  /**
   * Carrega notificações do Supabase com filtros
   */
  const loadNotifications = useCallback(async (reset = false) => {
    if (!user || loadingRef.current) return;

    try {
      loadingRef.current = true;
      setState(prev => ({ ...prev, loading: reset, error: null }));

      const offset = reset ? 0 : offsetRef.current;
      const limit = filters.limit || 20;

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Aplicar filtros
      if (filters.type && filters.type.length > 0) {
        query = query.in('type', filters.type);
      }

      if (filters.status === 'read') {
        query = query.not('read_at', 'is', null);
      } else if (filters.status === 'unread') {
        query = query.is('read_at', null);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar notificações:', error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Erro ao carregar notificações' 
        }));
        return;
      }

      const notifications = data || [];
      const hasMore = notifications.length === limit;

      setState(prev => ({
        ...prev,
        notifications: reset ? notifications : [...prev.notifications, ...notifications],
        loading: false,
        hasMore,
        error: null
      }));

      if (reset) {
        offsetRef.current = notifications.length;
      } else {
        offsetRef.current += notifications.length;
      }

      // Carregar contagem de não lidas
      await loadUnreadCount();

    } catch (err) {
      console.error('Erro inesperado ao carregar notificações:', err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Erro inesperado ao carregar notificações' 
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [user, filters]);

  /**
   * Carrega contagem de notificações não lidas
   */
  const loadUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Erro ao carregar contagem de não lidas:', error);
        return;
      }

      setState(prev => ({ ...prev, unreadCount: count || 0 }));
    } catch (err) {
      console.error('Erro inesperado ao carregar contagem:', err);
    }
  }, [user]);

  /**
   * Carrega preferências de notificação do usuário
   */
  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao carregar preferências:', error);
        return;
      }

      setPreferences(data);
    } catch (err) {
      console.error('Erro inesperado ao carregar preferências:', err);
    }
  }, [user]);

  /**
   * Marca uma notificação como lida
   */
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao marcar como lida:', error);
        return false;
      }

      // Atualizar estado local
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));

      return true;
    } catch (err) {
      console.error('Erro inesperado ao marcar como lida:', err);
      return false;
    }
  }, [user]);

  /**
   * Marca todas as notificações como lidas
   */
  const markAllAsRead = useCallback(async (): Promise<number> => {
    if (!user) return 0;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null)
        .select('id');

      if (error) {
        console.error('Erro ao marcar todas como lidas:', error);
        return 0;
      }

      const updatedCount = data?.length || 0;

      // Atualizar estado local
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification => ({
          ...notification,
          read_at: notification.read_at || new Date().toISOString()
        })),
        unreadCount: 0
      }));

      return updatedCount;
    } catch (err) {
      console.error('Erro inesperado ao marcar todas como lidas:', err);
      return 0;
    }
  }, [user]);

  /**
   * Carrega mais notificações (paginação)
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!state.hasMore || state.loading) return;
    await loadNotifications(false);
  }, [loadNotifications, state.hasMore, state.loading]);

  /**
   * Recarrega todas as notificações
   */
  const refresh = useCallback(async (): Promise<void> => {
    offsetRef.current = 0;
    await loadNotifications(true);
  }, [loadNotifications]);

  /**
   * Cria uma nova notificação
   */
  const createNotification = useCallback(async (params: CreateNotificationParams): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.user_id,
          type: params.type,
          title: params.title,
          message: params.message,
          data: params.data || {}
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao criar notificação:', error);
        return null;
      }

      return data?.id || null;
    } catch (err) {
      console.error('Erro inesperado ao criar notificação:', err);
      return null;
    }
  }, []);

  /**
   * Atualiza preferências de notificação
   */
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...newPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao atualizar preferências:', error);
        return false;
      }

      // Recarregar preferências
      await loadPreferences();
      return true;
    } catch (err) {
      console.error('Erro inesperado ao atualizar preferências:', err);
      return false;
    }
  }, [user, loadPreferences]);

  /**
   * Configura subscription em tempo real
   */
  const setupRealtimeSubscription = useCallback(() => {
    if (!user || !enableRealtime) return;

    // Remover subscription anterior se existir
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Criar nova subscription
    subscriptionRef.current = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notificação em tempo real:', payload);

          if (payload.eventType === 'INSERT') {
            // Nova notificação
            const newNotification = payload.new as Notification;
            setState(prev => ({
              ...prev,
              notifications: [newNotification, ...prev.notifications],
              unreadCount: prev.unreadCount + 1
            }));
          } else if (payload.eventType === 'UPDATE') {
            // Notificação atualizada
            const updatedNotification = payload.new as Notification;
            setState(prev => ({
              ...prev,
              notifications: prev.notifications.map(notification =>
                notification.id === updatedNotification.id
                  ? updatedNotification
                  : notification
              )
            }));
          } else if (payload.eventType === 'DELETE') {
            // Notificação deletada
            const deletedId = payload.old.id;
            setState(prev => ({
              ...prev,
              notifications: prev.notifications.filter(notification => notification.id !== deletedId)
            }));
          }
        }
      )
      .subscribe();
  }, [user, enableRealtime]);

  /**
   * Configura auto-refresh
   */
  const setupAutoRefresh = useCallback(() => {
    if (!autoRefresh || !user) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      loadUnreadCount();
    }, refreshInterval);
  }, [autoRefresh, user, refreshInterval, loadUnreadCount]);

  // Efeito principal - inicialização
  useEffect(() => {
    if (!user) {
      setState({
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
        hasMore: false
      });
      setPreferences(null);
      return;
    }

    // Carregar dados iniciais
    loadNotifications(true);
    loadPreferences();

    // Configurar realtime e auto-refresh
    setupRealtimeSubscription();
    setupAutoRefresh();

    // Cleanup
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, loadNotifications, loadPreferences, setupRealtimeSubscription, setupAutoRefresh]);

  // Efeito para reconfigurar subscription quando filtros mudam
  useEffect(() => {
    if (user && enableRealtime) {
      setupRealtimeSubscription();
    }
  }, [filters, setupRealtimeSubscription]);

  return {
    // Estado
    ...state,
    preferences,
    
    // Ações
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh,
    createNotification,
    updatePreferences
  };
};

export default useNotifications;