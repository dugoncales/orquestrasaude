import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type QRRow = Database['public']['Tables']['questionnaire_responses']['Row'];

export function useQuestionnaireResponses(patientId?: string) {
  return useQuery({
    queryKey: ['questionnaire_responses', patientId],
    queryFn: async () => {
      let q = supabase.from('questionnaire_responses').select('*, questionnaires(name, tipo), care_lines(slug, name)');
      if (patientId) q = q.eq('patient_id', patientId);
      const { data, error } = await q.order('data', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
