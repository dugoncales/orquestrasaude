import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ExamRow = Database['public']['Tables']['exams']['Row'];
type ExamInsert = Database['public']['Tables']['exams']['Insert'];

export function useExams(patientId?: string) {
  return useQuery({
    queryKey: ['exams', patientId],
    queryFn: async () => {
      let q = supabase.from('exams').select('*, care_lines(slug, name)');
      if (patientId) q = q.eq('patient_id', patientId);
      const { data, error } = await q.order('data_solicitacao', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (exam: ExamInsert) => {
      const { data, error } = await supabase.from('exams').insert(exam).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  });
}

export function useUpdateExamStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, resultado, data_resultado }: { id: string; status: string; resultado?: string; data_resultado?: string }) => {
      const updates: Record<string, any> = { status };
      if (resultado !== undefined) updates.resultado = resultado;
      if (data_resultado !== undefined) updates.data_resultado = data_resultado;
      const { data, error } = await supabase.from('exams').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  });
}
