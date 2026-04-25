import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type AuditLogRow = Database['public']['Tables']['audit_logs']['Row'];

export interface AuditLogFilters {
  tableName?: string;
  action?: string;
  userEmail?: string;
  limit?: number;
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const { tableName, action, userEmail, limit = 100 } = filters;
  return useQuery({
    queryKey: ['audit_logs', tableName ?? null, action ?? null, userEmail ?? null, limit],
    queryFn: async () => {
      let q = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (tableName) q = q.eq('table_name', tableName);
      if (action) q = q.eq('action', action);
      if (userEmail) q = q.ilike('user_email', `%${userEmail}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as AuditLogRow[];
    },
  });
}
