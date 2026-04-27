
-- 1. Tabela clinical_extractions
CREATE TABLE public.clinical_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid,
  cpf_raw text,
  cpf_normalized text,
  patient_name_source text NOT NULL,
  source_filename text,
  source_row_index integer,

  summary text,
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  extracted_params jsonb NOT NULL DEFAULT '[]'::jsonb,
  red_flags text[] NOT NULL DEFAULT '{}',
  suggested_next_steps text[] NOT NULL DEFAULT '{}',
  notes text[] NOT NULL DEFAULT '{}',

  model text,
  confidence_overall text,

  applied boolean NOT NULL DEFAULT false,
  applied_at timestamptz,
  applied_by uuid,

  replaces_id uuid REFERENCES public.clinical_extractions(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clinical_extractions_patient
  ON public.clinical_extractions(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_clinical_extractions_cpf
  ON public.clinical_extractions(cpf_normalized) WHERE cpf_normalized IS NOT NULL;
CREATE INDEX idx_clinical_extractions_created
  ON public.clinical_extractions(created_at DESC);
CREATE INDEX idx_clinical_extractions_created_by
  ON public.clinical_extractions(created_by);

ALTER TABLE public.clinical_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Extractions select" ON public.clinical_extractions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR created_by = auth.uid()
    OR (patient_id IS NOT NULL AND public.can_access_patient(auth.uid(), patient_id))
  );

CREATE POLICY "Extractions insert" ON public.clinical_extractions
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
      OR public.has_role(auth.uid(), 'professional'::app_role)
    )
  );

CREATE POLICY "Extractions update" ON public.clinical_extractions
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR created_by = auth.uid()
    OR (patient_id IS NOT NULL AND public.can_access_patient(auth.uid(), patient_id))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR created_by = auth.uid()
    OR (patient_id IS NOT NULL AND public.can_access_patient(auth.uid(), patient_id))
  );

CREATE POLICY "Extractions delete" ON public.clinical_extractions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Função find_patient_by_cpf
CREATE OR REPLACE FUNCTION public.find_patient_by_cpf(_cpf text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.patients
  WHERE _cpf IS NOT NULL
    AND length(regexp_replace(_cpf, '\D', '', 'g')) >= 8
    AND regexp_replace(cpf, '\D', '', 'g') = regexp_replace(_cpf, '\D', '', 'g')
  ORDER BY created_at DESC
  LIMIT 1
$$;

-- 3. Audit trigger
CREATE TRIGGER audit_clinical_extractions
AFTER INSERT OR UPDATE OR DELETE ON public.clinical_extractions
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
