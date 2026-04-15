
-- Add anon policies to all tables that don't have them yet
CREATE POLICY "Anon users can do everything on patients" ON public.patients FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can do everything on appointments" ON public.appointments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can do everything on exams" ON public.exams FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can do everything on tasks" ON public.tasks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can do everything on alerts" ON public.alerts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can do everything on journeys" ON public.journeys FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can do everything on journey_steps" ON public.journey_steps FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can do everything on parameter_records" ON public.parameter_records FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can do everything on questionnaires" ON public.questionnaires FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can do everything on questionnaire_responses" ON public.questionnaire_responses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can do everything on automation_rules" ON public.automation_rules FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can do everything on orientacoes" ON public.orientacoes FOR ALL TO anon USING (true) WITH CHECK (true);
-- care_lines already has anon SELECT, add full anon access
CREATE POLICY "Anon users can modify care_lines" ON public.care_lines FOR ALL TO anon USING (true) WITH CHECK (true);
