import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AlertRow = Database['public']['Tables']['alerts']['Row'];

export function useAlerts(patientId?: string, unreadOnly?: boolean) {
  return useQuery({
    queryKey: ['alerts', patientId, unreadOnly],
    queryFn: async () => {
      let q = supabase.from('alerts').select('*');
      if (patientId) q = q.eq('patient_id', patientId);
      if (unreadOnly) q = q.eq('lido', false);
      const { data, error } = await q.order('data', { ascending: false });
      if (error) throw error;
      return data as AlertRow[];
    },
  });
}

/** Alertas não lidos. Filtro server-side. */
export function useUnreadAlerts(patientId?: string) {
  return useAlerts(patientId, true);
}

export function useMarkAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from('alerts').update({ lido: true }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}
