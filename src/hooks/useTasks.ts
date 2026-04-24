import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

export function useTasks(patientId?: string, status?: string[]) {
  return useQuery({
    queryKey: ['tasks', patientId, status?.join(',')],
    queryFn: async () => {
      let q = supabase.from('tasks').select('*, care_lines(slug, name)');
      if (patientId) q = q.eq('patient_id', patientId);
      if (status && status.length > 0) q = q.in('status', status);
      const { data, error } = await q.order('prazo');
      if (error) throw error;
      return data;
    },
  });
}

/** Tarefas pendentes (não concluídas/canceladas). Filtro server-side. */
export function usePendingTasks(patientId?: string) {
  return useTasks(patientId, ['pendente', 'em_andamento', 'atrasada']);
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: TaskInsert) => {
      const { data, error } = await supabase.from('tasks').insert(task).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase.from('tasks').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
