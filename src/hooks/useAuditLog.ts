import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAdmin } from '../contexts/AdminProvider';

export interface AuditLogEntry {
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  metadata?: Record<string, unknown>;
  status?: 'success' | 'failure' | 'pending' | 'error';
  error_message?: string;
  duration_ms?: number;
}

export interface AuditLogFilter {
  user_id?: string;
  action?: string;
  resource_type?: string;
  severity?: string;
  category?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export const useAuditLog = () => {
  const { user } = useAdmin();

  const logAction = useCallback(async (entry: AuditLogEntry): Promise<string | null> => {
    try {
      const startTime = Date.now();
      
      // Get client IP and user agent from browser
      const userAgent = navigator.userAgent;
      
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id || null,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id || null,
          old_values: entry.old_values || null,
          new_values: entry.new_values || null,
          severity: entry.severity || 'info',
          category: entry.category || 'admin',
          metadata: {
            ...entry.metadata,
            user_email: user?.email,
            user_role: user?.role,
            timestamp: new Date().toISOString(),
            client_info: {
              user_agent: userAgent,
              url: window.location.href,
              referrer: document.referrer
            }
          },
          status: entry.status || 'success',
          error_message: entry.error_message || null,
          duration_ms: entry.duration_ms || (Date.now() - startTime),
          user_agent: userAgent
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to log audit entry:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error logging audit entry:', error);
      return null;
    }
  }, [user]);

  const logSuccess = useCallback(async (
    action: string,
    resource_type: string,
    resource_id?: string,
    metadata?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource_type,
      resource_id,
      severity: 'low',
      status: 'success',
      metadata
    });
  }, [logAction]);

  const logError = useCallback(async (
    action: string,
    resource_type: string,
    error_message: string,
    resource_id?: string,
    metadata?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource_type,
      resource_id,
      severity: 'high',
      status: 'error',
      error_message,
      metadata
    });
  }, [logAction]);

  const logSecurityEvent = useCallback(async (
    action: string,
    metadata?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource_type: 'security',
      severity: 'critical',
      category: 'security',
      status: 'success',
      metadata
    });
  }, [logAction]);

  const logUserAction = useCallback(async (
    action: string,
    resource_type: string,
    old_values?: Record<string, unknown>,
    new_values?: Record<string, unknown>,
    resource_id?: string
  ) => {
    return logAction({
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      severity: 'medium',
      category: 'user_management',
      status: 'success'
    });
  }, [logAction]);

  const logNewsAction = useCallback(async (
    action: string,
    news_id: string,
    old_values?: Record<string, unknown>,
    new_values?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource_type: 'news',
      resource_id: news_id,
      old_values,
      new_values,
      severity: 'medium',
      category: 'content_management',
      status: 'success'
    });
  }, [logAction]);

  const getAuditLogs = useCallback(async (filter: AuditLogFilter = {}) => {
    try {
      let query = supabase
        .from('audit_logs_with_user')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      if (filter.action) {
        query = query.eq('action', filter.action);
      }
      if (filter.resource_type) {
        query = query.eq('resource_type', filter.resource_type);
      }
      if (filter.severity) {
        query = query.eq('severity', filter.severity);
      }
      if (filter.category) {
        query = query.eq('category', filter.category);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.date_from) {
        query = query.gte('created_at', filter.date_from);
      }
      if (filter.date_to) {
        query = query.lte('created_at', filter.date_to);
      }

      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      if (filter.offset) {
        query = query.range(filter.offset, (filter.offset + (filter.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch audit logs:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { data: [], error };
    }
  }, []);

  const getAuditStats = useCallback(async (days: number = 30) => {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, severity, status, created_at')
        .gte('created_at', dateFrom.toISOString());

      if (error) {
        console.error('Failed to fetch audit stats:', error);
        return null;
      }

      // Process stats
      const stats = {
        total: data.length,
        by_severity: data.reduce((acc, log) => {
          acc[log.severity] = (acc[log.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_status: data.reduce((acc, log) => {
          acc[log.status] = (acc[log.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_action: data.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recent_errors: data.filter(log => log.status === 'error').slice(0, 10)
      };

      return stats;
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      return null;
    }
  }, []);

  return {
    logAction,
    logSuccess,
    logError,
    logSecurityEvent,
    logUserAction,
    logNewsAction,
    getAuditLogs,
    getAuditStats
  };
};

// Helper function to create audit log entries with timing
export const withAuditLog = async <T>(
  auditLog: ReturnType<typeof useAuditLog>,
  action: string,
  resource_type: string,
  operation: () => Promise<T>,
  resource_id?: string,
  metadata?: Record<string, unknown>
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    await auditLog.logAction({
      action,
      resource_type,
      resource_id,
      severity: 'low',
      status: 'success',
      duration_ms: duration,
      metadata
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    await auditLog.logAction({
      action,
      resource_type,
      resource_id,
      severity: 'high',
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: duration,
      metadata
    });
    
    throw error;
  }
};

export default useAuditLog;