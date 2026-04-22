-- Fase 2 (CJ2-001/CJ2-002): persistência de eventos de automação

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'automation_event_status'
  ) THEN
    CREATE TYPE public.automation_event_status AS ENUM ('triggered', 'suppressed', 'error');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.automation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id TEXT NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  care_line_id TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  status public.automation_event_status NOT NULL DEFAULT 'triggered',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cooldown_until TIMESTAMPTZ,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_events_patient_triggered_at
  ON public.automation_events (patient_id, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_events_rule_patient
  ON public.automation_events (rule_id, patient_id);

ALTER TABLE public.automation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Automation events read by care team" ON public.automation_events;
CREATE POLICY "Automation events read by care team"
  ON public.automation_events FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'professional')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Automation events insert by care team" ON public.automation_events;
CREATE POLICY "Automation events insert by care team"
  ON public.automation_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'professional')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Automation events update by admins" ON public.automation_events;
CREATE POLICY "Automation events update by admins"
  ON public.automation_events FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
