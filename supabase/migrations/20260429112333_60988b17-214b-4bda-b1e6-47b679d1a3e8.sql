
-- Função: recalcula risk_level e score_risco a partir das metas e dos parameter_records mais recentes
CREATE OR REPLACE FUNCTION public.recalc_patient_risk(_patient_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _goals jsonb;
  _goal jsonb;
  _field text;
  _target numeric;
  _operator text;
  _latest numeric;
  _out int := 0;
  _total int := 0;
  _new_level text;
  _score numeric;
BEGIN
  SELECT goals INTO _goals FROM public.patients WHERE id = _patient_id;
  IF _goals IS NULL OR jsonb_typeof(_goals) <> 'array' OR jsonb_array_length(_goals) = 0 THEN
    RETURN;
  END IF;

  FOR _goal IN SELECT * FROM jsonb_array_elements(_goals)
  LOOP
    _field := _goal->>'field';
    _target := NULLIF(_goal->>'target','')::numeric;
    _operator := COALESCE(_goal->>'operator','<');
    IF _field IS NULL OR _target IS NULL THEN CONTINUE; END IF;
    _total := _total + 1;

    SELECT value INTO _latest
    FROM public.parameter_records
    WHERE patient_id = _patient_id AND field = _field
    ORDER BY date DESC, created_at DESC
    LIMIT 1;
    IF _latest IS NULL THEN CONTINUE; END IF;

    IF (_operator = '<'  AND _latest >= _target) OR
       (_operator = '<=' AND _latest >  _target) OR
       (_operator = '>'  AND _latest <= _target) OR
       (_operator = '>=' AND _latest <  _target) OR
       (_operator = '='  AND _latest <> _target) THEN
      _out := _out + 1;
    END IF;
  END LOOP;

  IF _total = 0 THEN RETURN; END IF;
  _score := round((_out::numeric / _total::numeric) * 100, 1);

  IF _score >= 75 THEN _new_level := 'critico';
  ELSIF _score >= 50 THEN _new_level := 'alto';
  ELSIF _score >= 25 THEN _new_level := 'moderado';
  ELSE _new_level := 'baixo';
  END IF;

  UPDATE public.patients
  SET score_risco = _score, risk_level = _new_level, updated_at = now()
  WHERE id = _patient_id;
END;
$$;

-- Audit triggers que faltavam
DROP TRIGGER IF EXISTS audit_care_lines ON public.care_lines;
CREATE TRIGGER audit_care_lines
AFTER INSERT OR UPDATE OR DELETE ON public.care_lines
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_questionnaires ON public.questionnaires;
CREATE TRIGGER audit_questionnaires
AFTER INSERT OR UPDATE OR DELETE ON public.questionnaires
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_automation_rules ON public.automation_rules;
CREATE TRIGGER audit_automation_rules
AFTER INSERT OR UPDATE OR DELETE ON public.automation_rules
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_clinical_extractions ON public.clinical_extractions;
CREATE TRIGGER audit_clinical_extractions
AFTER INSERT OR UPDATE OR DELETE ON public.clinical_extractions
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
