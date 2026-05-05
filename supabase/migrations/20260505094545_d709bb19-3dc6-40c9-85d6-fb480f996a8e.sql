
CREATE OR REPLACE FUNCTION public.trg_param_alert()
RETURNS trigger
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
  _label text;
  _unit text;
  _out boolean := false;
  _patient_name text;
  _sev text;
  _msg text;
BEGIN
  SELECT goals, nome INTO _goals, _patient_name FROM public.patients WHERE id = NEW.patient_id;
  IF _goals IS NULL OR jsonb_typeof(_goals) <> 'array' THEN
    RETURN NEW;
  END IF;

  FOR _goal IN SELECT * FROM jsonb_array_elements(_goals)
  LOOP
    _field := _goal->>'field';
    IF _field <> NEW.field THEN CONTINUE; END IF;
    _target := NULLIF(_goal->>'target','')::numeric;
    _operator := COALESCE(_goal->>'operator','<');
    _label := COALESCE(_goal->>'label', NEW.field);
    _unit := COALESCE(_goal->>'unit', '');
    IF _target IS NULL THEN CONTINUE; END IF;

    IF (_operator = '<'  AND NEW.value >= _target) OR
       (_operator = '<=' AND NEW.value >  _target) OR
       (_operator = '>'  AND NEW.value <= _target) OR
       (_operator = '>=' AND NEW.value <  _target) OR
       (_operator = '='  AND NEW.value <> _target) THEN
      _out := true;
      EXIT;
    END IF;
  END LOOP;

  IF _out THEN
    -- severidade simples baseada no quão longe está da meta (>=20% = crítico)
    IF _target IS NOT NULL AND _target <> 0 AND abs(NEW.value - _target) / abs(_target) >= 0.2 THEN
      _sev := 'critical';
    ELSE
      _sev := 'warning';
    END IF;
    _msg := _label || ' fora da meta: ' || NEW.value::text || _unit ||
            ' (meta ' || _operator || ' ' || _target::text || _unit || ')';

    INSERT INTO public.alerts(patient_id, patient_name, tipo, mensagem, severidade, data, lido)
    VALUES (NEW.patient_id, _patient_name, 'parametro', _msg, _sev, NEW.date, false);
  END IF;

  -- recalcula risco do paciente após cada novo registro
  PERFORM public.recalc_patient_risk(NEW.patient_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_parameter_records_alert ON public.parameter_records;
CREATE TRIGGER trg_parameter_records_alert
AFTER INSERT ON public.parameter_records
FOR EACH ROW EXECUTE FUNCTION public.trg_param_alert();
