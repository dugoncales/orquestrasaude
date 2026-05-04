import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar: string | null;
  patient_id: string | null;
  created_at: string;
  roles: AppRole[];
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team_members'],
    queryFn: async (): Promise<TeamMember[]> => {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, avatar, patient_id, created_at').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const rolesByUser = new Map<string, AppRole[]>();
      (roles || []).forEach(r => {
        const arr = rolesByUser.get(r.user_id) || [];
        arr.push(r.role as AppRole);
        rolesByUser.set(r.user_id, arr);
      });
      return (profiles || []).map(p => ({
        ...p,
        roles: rolesByUser.get(p.id) || [],
      }));
    },
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role, enabled }: { userId: string; role: AppRole; enabled: boolean }) => {
      if (enabled) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role })
          .select();
        // ignore unique violation (already has role)
        if (error && !String(error.message).toLowerCase().includes('duplicate')) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        if (error) throw error;
      }
      return { userId, role, enabled };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team_members'] }),
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; full_name: string; role: AppRole; password?: string }) => {
      const { data, error } = await supabase.functions.invoke('invite-user', { body: input });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team_members'] }),
  });
}
