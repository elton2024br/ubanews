import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { AuditLog } from '../types/admin';

const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100); // Limit to the latest 100 logs for performance

  if (error) {
    console.error('Error fetching audit logs:', error);
    throw new Error(error.message);
  }

  // The 'user_name' might not be on the audit_logs table directly.
  // This is a simplification. A real implementation might need a JOIN.
  // For now, we assume the table is denormalized or we have the data.
  // Also, the type in `admin.ts` might need to be adjusted to match the db.
  return (data as any[]) || [];
};

export const useAuditLogs = () => {
  return useQuery<AuditLog[], Error>({
    queryKey: ['audit_logs'],
    queryFn: fetchAuditLogs,
    // Refetch every 30 seconds to keep the log view fresh
    refetchInterval: 30000,
  });
};
