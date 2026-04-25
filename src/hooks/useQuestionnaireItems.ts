import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type QuestionnaireItemRow = Database['public']['Tables']['questionnaire_items']['Row'];

export function useQuestionnaireItems(questionnaireId?: string) {
  return useQuery({
    queryKey: ['questionnaire_items', questionnaireId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questionnaire_items')
        .select('*')
        .eq('questionnaire_id', questionnaireId!)
        .order('ordem', { ascending: true });
      if (error) throw error;
      return (data || []) as QuestionnaireItemRow[];
    },
    enabled: !!questionnaireId,
  });
}

/**
 * Conta quantos items existem para cada questionnaire em batch.
 * Retorna `{ [questionnaireId]: count }`.
 */
export function useQuestionnaireItemCounts() {
  return useQuery({
    queryKey: ['questionnaire_item_counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questionnaire_items')
        .select('questionnaire_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((row: { questionnaire_id: string }) => {
        counts[row.questionnaire_id] = (counts[row.questionnaire_id] || 0) + 1;
      });
      return counts;
    },
  });
}
