import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ProfessionalRow = Database['public']['Tables']['professionals']['Row'];

export function useProfessionals() {
  return useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      return (data || []) as ProfessionalRow[];
    },
  });
}

export function useUpdateProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ProfessionalRow> & { id: string }) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from('professionals')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ProfessionalRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['professionals'] }),
  });
}
