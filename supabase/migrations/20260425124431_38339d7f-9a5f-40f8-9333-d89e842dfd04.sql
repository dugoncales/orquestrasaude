-- ============================================================
-- Sprint 5 — Migration 2 (Parte B): RLS por role
-- ============================================================

-- ====== PATIENTS ======
DROP POLICY IF EXISTS "Anon users can do everything on patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can do everything on patients" ON public.patients;

CREATE POLICY "Patients select" ON public.patients FOR SELECT TO authenticated
USING (public.can_access_patient(auth.uid(), id));

CREATE POLICY "Patients insert" ON public.patients FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'professional')
);

CREATE POLICY "Patients update" ON public.patients FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = patients.id
  )
);

CREATE POLICY "Patients delete" ON public.patients FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ====== JOURNEYS ======
DROP POLICY IF EXISTS "Anon users can do everything on journeys" ON public.journeys;
DROP POLICY IF EXISTS "Authenticated users can do everything on journeys" ON public.journeys;

CREATE POLICY "Journeys select" ON public.journeys FOR SELECT TO authenticated
USING (public.can_access_patient(auth.uid(), patient_id));

CREATE POLICY "Journeys write" ON public.journeys FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = journeys.patient_id
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = journeys.patient_id
  )
);

-- ====== JOURNEY_STEPS ======
DROP POLICY IF EXISTS "Anon users can do everything on journey_steps" ON public.journey_steps;
DROP POLICY IF EXISTS "Authenticated users can do everything on journey_steps" ON public.journey_steps;

CREATE POLICY "Journey steps select" ON public.journey_steps FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.journeys j
    WHERE j.id = journey_steps.journey_id
      AND public.can_access_patient(auth.uid(), j.patient_id)
  )
);

CREATE POLICY "Journey steps write" ON public.journey_steps FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.journeys j
    WHERE j.id = journey_steps.journey_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
        OR EXISTS (
          SELECT 1 FROM public.patient_assignments pa
          JOIN public.professionals p ON p.id = pa.professional_id
          WHERE p.user_id = auth.uid() AND pa.patient_id = j.patient_id
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.journeys j
    WHERE j.id = journey_steps.journey_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
        OR EXISTS (
          SELECT 1 FROM public.patient_assignments pa
          JOIN public.professionals p ON p.id = pa.professional_id
          WHERE p.user_id = auth.uid() AND pa.patient_id = j.patient_id
        )
      )
  )
);

-- ====== APPOINTMENTS ======
DROP POLICY IF EXISTS "Anon users can do everything on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can do everything on appointments" ON public.appointments;

CREATE POLICY "Appointments select" ON public.appointments FOR SELECT TO authenticated
USING (public.can_access_patient(auth.uid(), patient_id));

CREATE POLICY "Appointments write" ON public.appointments FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = appointments.patient_id
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = appointments.patient_id
  )
);

-- ====== EXAMS ======
DROP POLICY IF EXISTS "Anon users can do everything on exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can do everything on exams" ON public.exams;

CREATE POLICY "Exams select" ON public.exams FOR SELECT TO authenticated
USING (public.can_access_patient(auth.uid(), patient_id));

CREATE POLICY "Exams write" ON public.exams FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = exams.patient_id
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = exams.patient_id
  )
);

-- ====== TASKS ======
DROP POLICY IF EXISTS "Anon users can do everything on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can do everything on tasks" ON public.tasks;

CREATE POLICY "Tasks select" ON public.tasks FOR SELECT TO authenticated
USING (public.can_access_patient(auth.uid(), patient_id));

CREATE POLICY "Tasks write" ON public.tasks FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = tasks.patient_id
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = tasks.patient_id
  )
);

-- ====== PARAMETER_RECORDS ======
DROP POLICY IF EXISTS "Anon users can do everything on parameter_records" ON public.parameter_records;
DROP POLICY IF EXISTS "Authenticated users can do everything on parameter_records" ON public.parameter_records;

CREATE POLICY "Parameter records select" ON public.parameter_records FOR SELECT TO authenticated
USING (public.can_access_patient(auth.uid(), patient_id));

CREATE POLICY "Parameter records write" ON public.parameter_records FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = parameter_records.patient_id
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = parameter_records.patient_id
  )
);

-- ====== QUESTIONNAIRE_RESPONSES ======
DROP POLICY IF EXISTS "Anon users can do everything on questionnaire_responses" ON public.questionnaire_responses;
DROP POLICY IF EXISTS "Authenticated users can do everything on questionnaire_response" ON public.questionnaire_responses;

CREATE POLICY "QR select" ON public.questionnaire_responses FOR SELECT TO authenticated
USING (public.can_access_patient(auth.uid(), patient_id));

CREATE POLICY "QR write" ON public.questionnaire_responses FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = questionnaire_responses.patient_id
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = questionnaire_responses.patient_id
  )
);

-- ====== ALERTS ======
DROP POLICY IF EXISTS "Anon users can do everything on alerts" ON public.alerts;
DROP POLICY IF EXISTS "Authenticated users can do everything on alerts" ON public.alerts;

CREATE POLICY "Alerts select" ON public.alerts FOR SELECT TO authenticated
USING (
  patient_id IS NULL
  OR public.can_access_patient(auth.uid(), patient_id)
);

CREATE POLICY "Alerts write" ON public.alerts FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR (
    patient_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.patient_assignments pa
      JOIN public.professionals p ON p.id = pa.professional_id
      WHERE p.user_id = auth.uid() AND pa.patient_id = alerts.patient_id
    )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR (
    patient_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.patient_assignments pa
      JOIN public.professionals p ON p.id = pa.professional_id
      WHERE p.user_id = auth.uid() AND pa.patient_id = alerts.patient_id
    )
  )
);

-- ====== ORIENTACOES ======
DROP POLICY IF EXISTS "Anon users can do everything on orientacoes" ON public.orientacoes;
DROP POLICY IF EXISTS "Authenticated users can do everything on orientacoes" ON public.orientacoes;

CREATE POLICY "Orientacoes select" ON public.orientacoes FOR SELECT TO authenticated
USING (public.can_access_patient(auth.uid(), patient_id));

CREATE POLICY "Orientacoes write" ON public.orientacoes FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = orientacoes.patient_id
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    JOIN public.professionals p ON p.id = pa.professional_id
    WHERE p.user_id = auth.uid() AND pa.patient_id = orientacoes.patient_id
  )
);

-- ====== CONFIG TABLES: care_lines, questionnaires, automation_rules ======
DROP POLICY IF EXISTS "Anon users can modify care_lines" ON public.care_lines;
DROP POLICY IF EXISTS "Anon users can read care_lines" ON public.care_lines;
DROP POLICY IF EXISTS "Authenticated users can do everything on care_lines" ON public.care_lines;

CREATE POLICY "Care lines select" ON public.care_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Care lines write" ON public.care_lines FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Anon users can do everything on questionnaires" ON public.questionnaires;
DROP POLICY IF EXISTS "Authenticated users can do everything on questionnaires" ON public.questionnaires;

CREATE POLICY "Questionnaires select" ON public.questionnaires FOR SELECT TO authenticated USING (true);
CREATE POLICY "Questionnaires write" ON public.questionnaires FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Anon users can do everything on automation_rules" ON public.automation_rules;
DROP POLICY IF EXISTS "Authenticated users can do everything on automation_rules" ON public.automation_rules;

CREATE POLICY "Automation rules select" ON public.automation_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Automation rules write" ON public.automation_rules FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));