import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ClinicalExtractionRow = Database['public']['Tables']['clinical_extractions']['Row'];
export type ClinicalExtractionInsert = Database['public']['Tables']['clinical_extractions']['Insert'];
export type ClinicalExtractionUpdate = Database['public']['Tables']['clinical_extractions']['Update'];

interface ListFilter {
  patientId?: string;
  applied?: boolean;
  limit?: number;
}

export function useClinicalExtractions(filter: ListFilter = {}) {
  return useQuery({
    queryKey: ['clinical_extractions', filter],
    queryFn: async () => {
      let q = supabase
        .from('clinical_extractions')
        .select('*')
        .order('created_at', { ascending: false });
      if (filter.patientId) q = q.eq('patient_id', filter.patientId);
      if (typeof filter.applied === 'boolean') q = q.eq('applied', filter.applied);
      if (filter.limit) q = q.limit(filter.limit);
      const { data, error } = await q;
      if (error) throw error;
      return data as ClinicalExtractionRow[];
    },
  });
}

export function normalizeCpf(cpf: string | null | undefined): string | null {
  if (!cpf) return null;
  const digits = String(cpf).replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}

export function useFindPatientByCpf() {
  return useMutation({
    mutationFn: async (cpf: string) => {
      const { data, error } = await supabase.rpc('find_patient_by_cpf', { _cpf: cpf });
      if (error) throw error;
      return data as string | null;
    },
  });
}

interface CreateExtractionInput {
  patient_id: string | null;
  cpf_raw: string | null;
  patient_name_source: string;
  source_filename: string | null;
  source_row_index: number | null;
  summary: string | null;
  highlights: unknown;
  extracted_params: unknown;
  red_flags: string[];
  suggested_next_steps: string[];
  notes: string[];
  model: string | null;
  confidence_overall: string | null;
}

export function useCreateExtractions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: CreateExtractionInput[]) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Não autenticado');
      const payload = items.map((it) => ({
        ...it,
        cpf_normalized: normalizeCpf(it.cpf_raw),
        created_by: userId,
      }));
      const { data, error } = await supabase
        .from('clinical_extractions')
        .insert(payload as never)
        .select();
      if (error) throw error;
      return data as ClinicalExtractionRow[];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinical_extractions'] });
    },
  });
}

export function useLinkExtractionToPatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patientId }: { id: string; patientId: string | null }) => {
      const { data, error } = await supabase
        .from('clinical_extractions')
        .update({ patient_id: patientId })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ClinicalExtractionRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinical_extractions'] });
    },
  });
}

export interface ApplyResult {
  ok: boolean;
  results: { alerts: number; orientacoes: number; parameter_records: number };
  errors?: string[];
}

export function useApplyExtraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (extractionId: string): Promise<ApplyResult> => {
      const { data, error } = await supabase.functions.invoke('apply-extraction', {
        body: { extraction_id: extractionId },
      });
      if (error) throw new Error(error.message ?? 'Falha ao aplicar');
      if (data?.error) throw new Error(data.error);
      return data as ApplyResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinical_extractions'] });
      qc.invalidateQueries({ queryKey: ['alerts'] });
      qc.invalidateQueries({ queryKey: ['orientacoes'] });
      qc.invalidateQueries({ queryKey: ['parameter_records'] });
    },
  });
}
