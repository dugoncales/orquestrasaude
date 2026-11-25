CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id) $$;

DROP POLICY IF EXISTS "Care lines select" ON public.care_lines;
CREATE POLICY "Care lines select" ON public.care_lines FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

DROP POLICY IF EXISTS "Questionnaires select" ON public.questionnaires;
CREATE POLICY "Questionnaires select" ON public.questionnaires FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

DROP POLICY IF EXISTS "Items select" ON public.questionnaire_items;
CREATE POLICY "Items select" ON public.questionnaire_items FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

DROP POLICY IF EXISTS "Automation rules select" ON public.automation_rules;
CREATE POLICY "Automation rules select" ON public.automation_rules FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'professional'));