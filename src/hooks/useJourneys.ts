import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type JourneyRow = Database['public']['Tables']['journeys']['Row'];
type JourneyStepRow = Database['public']['Tables']['journey_steps']['Row'];

export function useJourneys(patientId?: string) {
  return useQuery({
    queryKey: ['journeys', patientId],
    queryFn: async () => {
      let q = supabase.from('journeys').select('*, care_lines(slug, name, icon, color), patients(nome)');
      if (patientId) q = q.eq('patient_id', patientId);
      const { data, error } = await q.order('start_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Busca uma única jornada com seus steps em paralelo. */
export function useJourney(id: string | undefined) {
  return useQuery({
    queryKey: ['journey', id],
    queryFn: async () => {
      if (!id) return null;
      const [journeyRes, stepsRes] = await Promise.all([
        supabase
          .from('journeys')
          .select('*, care_lines(slug, name, icon, color), patients(nome)')
          .eq('id', id)
          .single(),
        supabase
          .from('journey_steps')
          .select('*')
          .eq('journey_id', id)
          .order('step_order'),
      ]);
      if (journeyRes.error) throw journeyRes.error;
      if (stepsRes.error) throw stepsRes.error;
      return { journey: journeyRes.data, steps: stepsRes.data as JourneyStepRow[] };
    },
    enabled: !!id,
  });
}

export function useJourneySteps(journeyId: string | undefined) {
  return useQuery({
    queryKey: ['journey_steps', journeyId],
    queryFn: async () => {
      if (!journeyId) return [];
      const { data, error } = await supabase
        .from('journey_steps')
        .select('*')
        .eq('journey_id', journeyId)
        .order('step_order');
      if (error) throw error;
      return data as JourneyStepRow[];
    },
    enabled: !!journeyId,
  });
}

export function useAllJourneySteps() {
  return useQuery({
    queryKey: ['journey_steps', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('journey_steps').select('*').order('step_order');
      if (error) throw error;
      return data as JourneyStepRow[];
    },
  });
}

export function useUpdateJourneyStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JourneyStepRow> & { id: string }) => {
      const { data, error } = await supabase.from('journey_steps').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journey_steps'] }),
  });
}

/** Atualiza campos de uma jornada (current_step_index, status). */
export function useUpdateJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JourneyRow> & { id: string }) => {
      const { data, error } = await supabase.from('journeys').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journeys'] });
      qc.invalidateQueries({ queryKey: ['journey'] });
    },
  });
}

/**
 * Marca o step atual como concluído e incrementa current_step_index.
 * Espera o id da jornada e o step atual completo (para saber qual marcar).
 */
export function useAdvanceJourneyStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ journeyId, currentStepId, currentIndex }: { journeyId: string; currentStepId: string; currentIndex: number }) => {
      const today = new Date().toISOString().slice(0, 10);
      const [stepRes, jRes] = await Promise.all([
        supabase
          .from('journey_steps')
          .update({ status: 'concluido', data_conclusao: today })
          .eq('id', currentStepId)
          .select()
          .single(),
        supabase
          .from('journeys')
          .update({ current_step_index: currentIndex + 1 })
          .eq('id', journeyId)
          .select()
          .single(),
      ]);
      if (stepRes.error) throw stepRes.error;
      if (jRes.error) throw jRes.error;
      return { step: stepRes.data, journey: jRes.data };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journeys'] });
      qc.invalidateQueries({ queryKey: ['journey'] });
      qc.invalidateQueries({ queryKey: ['journey_steps'] });
    },
  });
}
