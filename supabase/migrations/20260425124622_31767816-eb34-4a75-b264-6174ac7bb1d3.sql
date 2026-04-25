-- ============================================================
-- Sprint 5 — Migration 6 (Parte F): índices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_patient_assignments_user
  ON public.patient_assignments(professional_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_assignments_patient
  ON public.patient_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_professionals_user_id
  ON public.professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_patient_id
  ON public.profiles(patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_data ON public.appointments(data);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_patient ON public.tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_patient ON public.exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_lido ON public.alerts(lido);
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON public.alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_journey_steps_journey ON public.journey_steps(journey_id);
CREATE INDEX IF NOT EXISTS idx_journeys_patient ON public.journeys(patient_id);
CREATE INDEX IF NOT EXISTS idx_parameter_records_patient_field
  ON public.parameter_records(patient_id, field, date);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table
  ON public.audit_logs(table_name, created_at DESC);