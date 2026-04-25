import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type PatientAssignmentRow = Database['public']['Tables']['patient_assignments']['Row'];

export function usePatientAssignments(professionalId?: string) {
  return useQuery({
    queryKey: ['patient_assignments', professionalId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('patient_assignments').select('*');
      if (professionalId) q = q.eq('professional_id', professionalId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PatientAssignmentRow[];
    },
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { professional_id: string; patient_id: string; papel?: string }) => {
      const { data, error } = await supabase
        .from('patient_assignments')
        .insert({ ...input, papel: input.papel ?? 'responsavel' })
        .select()
        .single();
      if (error) throw error;
      return data as PatientAssignmentRow;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['patient_assignments', v.professional_id] });
      qc.invalidateQueries({ queryKey: ['patient_assignments', 'all'] });
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('patient_assignments').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patient_assignments'] }),
  });
}
