
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ PATIENTS ============
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_social TEXT,
  sexo TEXT NOT NULL CHECK (sexo IN ('M','F','O')),
  data_nascimento DATE NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  convenio TEXT,
  unidade TEXT,
  profissional_referencia TEXT,
  data_entrada DATE,
  status_cadastral TEXT NOT NULL DEFAULT 'ativo' CHECK (status_cadastral IN ('ativo','inativo','transferido')),
  diagnosticos_ativos TEXT[] DEFAULT '{}',
  condicoes_associadas TEXT[] DEFAULT '{}',
  alergias TEXT[] DEFAULT '{}',
  medicacoes TEXT[] DEFAULT '{}',
  fatores_risco TEXT[] DEFAULT '{}',
  historico_familiar TEXT[] DEFAULT '{}',
  tabagismo BOOLEAN DEFAULT false,
  etilismo BOOLEAN DEFAULT false,
  atividade_fisica TEXT DEFAULT 'sedentario' CHECK (atividade_fisica IN ('sedentario','leve','moderado','intenso')),
  linhas_ativas TEXT[] DEFAULT '{}',
  risk_level TEXT DEFAULT 'baixo' CHECK (risk_level IN ('baixo','moderado','alto','critico')),
  score_risco NUMERIC DEFAULT 0,
  avatar TEXT,
  goals JSONB DEFAULT '[]',
  dias_sem_retorno INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on patients" ON public.patients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CARE LINES ============
CREATE TABLE public.care_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  clinical_parameters TEXT[] DEFAULT '{}',
  proms TEXT[] DEFAULT '{}',
  prems TEXT[] DEFAULT '{}',
  patient_count INTEGER DEFAULT 0,
  avg_adherence NUMERIC DEFAULT 0,
  criterios_inclusao TEXT[] DEFAULT '{}',
  criterios_saida TEXT[] DEFAULT '{}',
  metas JSONB DEFAULT '[]',
  tarefas_padrao JSONB DEFAULT '[]',
  exames_padrao JSONB DEFAULT '[]',
  automacoes JSONB DEFAULT '[]',
  alertas JSONB DEFAULT '[]',
  indicadores_bi JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.care_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on care_lines" ON public.care_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_care_lines_updated_at BEFORE UPDATE ON public.care_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ JOURNEYS ============
CREATE TABLE public.journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  care_line_id UUID NOT NULL REFERENCES public.care_lines(id) ON DELETE CASCADE,
  current_step_index INTEGER DEFAULT 0,
  start_date DATE,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','concluida','pausada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on journeys" ON public.journeys FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_journeys_updated_at BEFORE UPDATE ON public.journeys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ JOURNEY STEPS ============
CREATE TABLE public.journey_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'nao_iniciado' CHECK (status IN ('nao_iniciado','em_andamento','concluido','atrasado','bloqueado')),
  responsavel TEXT,
  prazo DATE,
  pendencias TEXT[] DEFAULT '{}',
  data_conclusao DATE,
  consultas_vinculadas TEXT[] DEFAULT '{}',
  exames_vinculados TEXT[] DEFAULT '{}',
  tarefas_vinculadas TEXT[] DEFAULT '{}',
  questionarios_vinculados TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on journey_steps" ON public.journey_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_journey_steps_updated_at BEFORE UPDATE ON public.journey_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  profissional TEXT NOT NULL,
  tipo TEXT NOT NULL,
  data DATE NOT NULL,
  hora TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada','realizada','faltou','cancelada','reagendada')),
  care_line_id UUID REFERENCES public.care_lines(id),
  observacoes TEXT,
  journey_step_id UUID REFERENCES public.journey_steps(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on appointments" ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ EXAMS ============
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  tipo TEXT NOT NULL,
  data_solicitacao DATE NOT NULL,
  data_resultado DATE,
  status TEXT NOT NULL DEFAULT 'solicitado' CHECK (status IN ('solicitado','coletado','resultado_disponivel','atrasado')),
  resultado TEXT,
  care_line_id UUID REFERENCES public.care_lines(id),
  journey_step_id UUID REFERENCES public.journey_steps(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on exams" ON public.exams FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TASKS ============
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  prazo DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluida','cancelada','atrasada')),
  care_line_id UUID REFERENCES public.care_lines(id),
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta','urgente')),
  journey_step_id UUID REFERENCES public.journey_steps(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on tasks" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ALERTS ============
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('clinico','operacional','sistema')),
  mensagem TEXT NOT NULL,
  severidade TEXT NOT NULL CHECK (severidade IN ('info','warning','critical')),
  data DATE NOT NULL,
  lido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on alerts" ON public.alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PARAMETER RECORDS ============
CREATE TABLE public.parameter_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  value NUMERIC NOT NULL,
  date DATE NOT NULL,
  care_line_id UUID REFERENCES public.care_lines(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parameter_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on parameter_records" ON public.parameter_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ QUESTIONNAIRES ============
CREATE TABLE public.questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('prom','prem')),
  care_line_id UUID REFERENCES public.care_lines(id),
  perguntas INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on questionnaires" ON public.questionnaires FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_questionnaires_updated_at BEFORE UPDATE ON public.questionnaires FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ QUESTIONNAIRE RESPONSES ============
CREATE TABLE public.questionnaire_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  max_score NUMERIC DEFAULT 100,
  data DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','respondido','atrasado')),
  care_line_id UUID REFERENCES public.care_lines(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on questionnaire_responses" ON public.questionnaire_responses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_qr_updated_at BEFORE UPDATE ON public.questionnaire_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUTOMATION RULES ============
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  condition TEXT NOT NULL,
  actions TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  care_line_id UUID REFERENCES public.care_lines(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on automation_rules" ON public.automation_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ORIENTACOES ============
CREATE TABLE public.orientacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  profissional TEXT NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orientacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything on orientacoes" ON public.orientacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ INDEXES ============
CREATE INDEX idx_journeys_patient ON public.journeys(patient_id);
CREATE INDEX idx_journeys_care_line ON public.journeys(care_line_id);
CREATE INDEX idx_journey_steps_journey ON public.journey_steps(journey_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_data ON public.appointments(data);
CREATE INDEX idx_exams_patient ON public.exams(patient_id);
CREATE INDEX idx_tasks_patient ON public.tasks(patient_id);
CREATE INDEX idx_alerts_patient ON public.alerts(patient_id);
CREATE INDEX idx_parameter_records_patient ON public.parameter_records(patient_id);
CREATE INDEX idx_parameter_records_field ON public.parameter_records(field);
CREATE INDEX idx_qr_patient ON public.questionnaire_responses(patient_id);
CREATE INDEX idx_orientacoes_patient ON public.orientacoes(patient_id);

-- Also allow anon read for public care_lines
CREATE POLICY "Anon users can read care_lines" ON public.care_lines FOR SELECT TO anon USING (true);
