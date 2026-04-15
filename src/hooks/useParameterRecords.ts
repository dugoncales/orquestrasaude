import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ParameterRecordRow = Database['public']['Tables']['parameter_records']['Row'];
type ParameterRecordInsert = Database['public']['Tables']['parameter_records']['Insert'];

export function useParameterRecords(patientId?: string, field?: string) {
  return useQuery({
    queryKey: ['parameter_records', patientId, field],
    queryFn: async () => {
      let q = supabase.from('parameter_records').select('*');
      if (patientId) q = q.eq('patient_id', patientId);
      if (field) q = q.eq('field', field);
      const { data, error } = await q.order('date');
      if (error) throw error;
      return data as ParameterRecordRow[];
    },
  });
}

export function useCreateParameterRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: ParameterRecordInsert) => {
      const { data, error } = await supabase.from('parameter_records').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parameter_records'] }),
  });
}
