import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type OrientacaoRow = Database['public']['Tables']['orientacoes']['Row'];

export function useOrientacoes(patientId?: string) {
  return useQuery({
    queryKey: ['orientacoes', patientId],
    queryFn: async () => {
      let q = supabase.from('orientacoes').select('*');
      if (patientId) q = q.eq('patient_id', patientId);
      const { data, error } = await q.order('data', { ascending: false });
      if (error) throw error;
      return data as OrientacaoRow[];
    },
    enabled: !!patientId,
  });
}
