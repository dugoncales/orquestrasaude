import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type AttachmentRow = Database['public']['Tables']['attachments']['Row'];

export function useAttachments(patientId?: string) {
  return useQuery({
    queryKey: ['attachments', patientId],
    queryFn: async () => {
      let q = supabase.from('attachments').select('*').order('created_at', { ascending: false });
      if (patientId) q = q.eq('patient_id', patientId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as AttachmentRow[];
    },
    enabled: !!patientId,
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      file: File;
      patientId: string;
      category?: string;
      relatedExamId?: string | null;
      relatedJourneyStepId?: string | null;
    }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `patients/${input.patientId}/${Date.now()}_${safeName}`;

      const { error: upErr } = await supabase.storage
        .from('attachments')
        .upload(path, input.file, { upsert: false, contentType: input.file.type });
      if (upErr) throw upErr;

      const { data, error } = await supabase
        .from('attachments')
        .insert({
          patient_id: input.patientId,
          storage_path: path,
          filename: input.file.name,
          mime_type: input.file.type,
          size_bytes: input.file.size,
          uploaded_by: userId,
          category: input.category ?? 'outro',
          related_exam_id: input.relatedExamId ?? null,
          related_journey_step_id: input.relatedJourneyStepId ?? null,
        })
        .select()
        .single();
      if (error) {
        await supabase.storage.from('attachments').remove([path]);
        throw error;
      }
      return data as AttachmentRow;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['attachments', vars.patientId] });
    },
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (att: AttachmentRow) => {
      await supabase.storage.from('attachments').remove([att.storage_path]);
      const { error } = await supabase.from('attachments').delete().eq('id', att.id);
      if (error) throw error;
      return att.id;
    },
    onSuccess: (_id, att) => {
      qc.invalidateQueries({ queryKey: ['attachments', att.patient_id] });
    },
  });
}

export async function getAttachmentSignedUrl(path: string, expiresIn = 60) {
  const { data, error } = await supabase.storage.from('attachments').createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
