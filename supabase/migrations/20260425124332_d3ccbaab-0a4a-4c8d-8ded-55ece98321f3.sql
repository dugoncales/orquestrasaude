-- ============================================================
-- Sprint 5 — Migration 1 (Parte A): vínculo profissional ↔ paciente
-- ============================================================

-- 1. Tabela professionals
CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  registro text,
  especialidade text,
  unidade text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_professionals_updated_at
BEFORE UPDATE ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tabela patient_assignments (N:N profissional ↔ paciente)
CREATE TABLE public.patient_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  papel text NOT NULL DEFAULT 'responsavel',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, patient_id)
);

ALTER TABLE public.patient_assignments ENABLE ROW LEVEL SECURITY;

-- 3. Security definer functions
CREATE OR REPLACE FUNCTION public.can_access_patient(_user_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR public.has_role(_user_id, 'manager')
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = _user_id AND patient_id = _patient_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.patient_assignments pa
      JOIN public.professionals p ON p.id = pa.professional_id
      WHERE p.user_id = _user_id AND pa.patient_id = _patient_id
    );
$$;

CREATE OR REPLACE FUNCTION public.current_patient_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT patient_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 4. Trigger: criar professional row quando user vira professional
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'professional')
  ON CONFLICT DO NOTHING;

  -- também cria entrada em professionals (idempotente)
  INSERT INTO public.professionals (user_id, nome, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- garante que o trigger esteja registrado em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RLS policies — professionals
CREATE POLICY "Professionals view own"
ON public.professionals FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Professionals update own"
ON public.professionals FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Professionals insert admin"
ON public.professionals FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Professionals delete admin"
ON public.professionals FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. RLS policies — patient_assignments
CREATE POLICY "Assignments view"
ON public.patient_assignments FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = patient_assignments.professional_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Assignments manage"
ON public.patient_assignments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));