import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type CareLineRow = Database['public']['Tables']['care_lines']['Row'];

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
