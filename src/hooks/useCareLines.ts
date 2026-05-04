import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type CareLineRow = Database['public']['Tables']['care_lines']['Row'];
type CareLineInsert = Database['public']['Tables']['care_lines']['Insert'];
type CareLineUpdate = Database['public']['Tables']['care_lines']['Update'];

export function useCareLines() {
  return useQuery({
    queryKey: ['care_lines'],
    queryFn: async () => {
      const { data, error } = await supabase.from('care_lines').select('*').order('name');
      if (error) throw error;
      return data as CareLineRow[];
    },
  });
}

export function useCareLine(slug: string | undefined) {
  return useQuery({
    queryKey: ['care_lines', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase.from('care_lines').select('*').eq('slug', slug).single();
      if (error) throw error;
      return data as CareLineRow;
    },
    enabled: !!slug,
  });
}

export function useCreateCareLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CareLineInsert) => {
      const { data, error } = await supabase.from('care_lines').insert(payload).select('*').single();
      if (error) throw error;
      return data as CareLineRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['care_lines'] }),
  });
}

export function useUpdateCareLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CareLineUpdate }) => {
      const { data, error } = await supabase.from('care_lines').update(updates).eq('id', id).select('*').single();
      if (error) throw error;
      return data as CareLineRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['care_lines'] }),
  });
}

export function useDeleteCareLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('care_lines').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['care_lines'] }),
  });
}
