-- ============================================================
-- Sprint 5 — Migration 5 (Parte E): questionnaire_items
-- ============================================================

CREATE TABLE public.questionnaire_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  ordem int NOT NULL,
  pergunta text NOT NULL,
  tipo text NOT NULL,
  opcoes jsonb,
  peso numeric DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.questionnaire_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_questionnaire_items_q_ordem
  ON public.questionnaire_items(questionnaire_id, ordem);

CREATE POLICY "Items select"
ON public.questionnaire_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Items write"
ON public.questionnaire_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Adiciona campo respostas em questionnaire_responses
ALTER TABLE public.questionnaire_responses
ADD COLUMN IF NOT EXISTS respostas jsonb DEFAULT '{}'::jsonb;