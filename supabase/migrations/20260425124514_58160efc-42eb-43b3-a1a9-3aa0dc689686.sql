-- ============================================================
-- Sprint 5 — Migration 3 (Parte C): audit logs
-- ============================================================

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit read"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Trigger function genérica
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _record_id uuid;
BEGIN
  SELECT email INTO _email FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'DELETE' THEN
    BEGIN _record_id := (OLD.id)::uuid; EXCEPTION WHEN OTHERS THEN _record_id := NULL; END;
  ELSE
    BEGIN _record_id := (NEW.id)::uuid; EXCEPTION WHEN OTHERS THEN _record_id := NULL; END;
  END IF;

  INSERT INTO public.audit_logs(user_id, user_email, table_name, record_id, action, old_data, new_data)
  VALUES (
    auth.uid(),
    _email,
    TG_TABLE_NAME,
    _record_id,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Ativar nas tabelas críticas
CREATE TRIGGER audit_patients
AFTER INSERT OR UPDATE OR DELETE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_journeys
AFTER INSERT OR UPDATE OR DELETE ON public.journeys
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_journey_steps
AFTER INSERT OR UPDATE OR DELETE ON public.journey_steps
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_exams
AFTER INSERT OR UPDATE OR DELETE ON public.exams
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_tasks
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_appointments
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_parameter_records
AFTER INSERT OR UPDATE OR DELETE ON public.parameter_records
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();