-- ============================================================
-- Sprint 5 — Migration 4 (Parte D): attachments
-- ============================================================

-- 1. Bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela attachments
CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  filename text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text,
  related_exam_id uuid,
  related_journey_step_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attachments meta select"
ON public.attachments FOR SELECT TO authenticated
USING (public.can_access_patient(auth.uid(), patient_id));

CREATE POLICY "Attachments meta write"
ON public.attachments FOR ALL TO authenticated
USING (public.can_access_patient(auth.uid(), patient_id))
WITH CHECK (public.can_access_patient(auth.uid(), patient_id));

CREATE INDEX idx_attachments_patient ON public.attachments(patient_id);

-- 3. Storage policies — path: patients/<patient_id>/<filename>
CREATE POLICY "Attachments storage select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'attachments'
  AND public.can_access_patient(
    auth.uid(),
    NULLIF((string_to_array(name, '/'))[2], '')::uuid
  )
);

CREATE POLICY "Attachments storage insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'attachments'
  AND public.can_access_patient(
    auth.uid(),
    NULLIF((string_to_array(name, '/'))[2], '')::uuid
  )
);

CREATE POLICY "Attachments storage update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'attachments'
  AND public.can_access_patient(
    auth.uid(),
    NULLIF((string_to_array(name, '/'))[2], '')::uuid
  )
);

CREATE POLICY "Attachments storage delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'attachments'
  AND public.can_access_patient(
    auth.uid(),
    NULLIF((string_to_array(name, '/'))[2], '')::uuid
  )
);