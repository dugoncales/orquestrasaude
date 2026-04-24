

# Plano: Sprint 5 — RLS por role, audit, anexos, escala clínica

Último sprint do roadmap. Substitui as policies "anon = tudo" por controle real baseado em role + vínculo profissional↔paciente. Adiciona audit log, anexos, templates de questionário e índices.

⚠️ **Sprint mais arriscado do roadmap** — mexe em policies de produção. Vai por partes, cada uma testável.

---

## Parte A — Modelo de vínculo profissional ↔ paciente

Hoje não existe forma de saber quais pacientes um profissional pode acessar. Sem isso, RLS por role só funciona pra `admin` (vê tudo) e `patient` (vê o próprio).

### A.1 Tabela `professionals`

Espelha o que `profiles` é pra paciente, mas pra profissional:

```sql
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nome text not null,
  registro text,                    -- CRM, COREN, CRP, etc
  especialidade text,
  unidade text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### A.2 Tabela `patient_assignments`

Vínculo N:N entre profissional e paciente:

```sql
create table public.patient_assignments (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  papel text not null default 'responsavel',  -- 'responsavel' | 'apoio' | 'observador'
  created_at timestamptz not null default now(),
  unique (professional_id, patient_id)
);
```

### A.3 Security definer functions

Pra usar nas policies sem causar recursão:

```sql
-- Profissional consegue ver/editar este paciente?
create or replace function public.can_access_patient(_user_id uuid, _patient_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    -- admin/manager veem tudo
    public.has_role(_user_id, 'admin')
    or public.has_role(_user_id, 'manager')
    -- paciente vê o próprio
    or exists (select 1 from public.profiles where id = _user_id and patient_id = _patient_id)
    -- profissional vê os atribuídos
    or exists (
      select 1
      from public.patient_assignments pa
      join public.professionals p on p.id = pa.professional_id
      where p.user_id = _user_id and pa.patient_id = _patient_id
    );
$$;

-- patient_id do profile (helper p/ policies de paciente)
create or replace function public.current_patient_id()
returns uuid language sql stable security definer set search_path = public as $$
  select patient_id from public.profiles where id = auth.uid();
$$;
```

### A.4 Trigger pra criar `professionals` row quando user vira professional

Modificar `handle_new_user()` pra também criar entrada em `professionals` (com `nome = full_name`, `ativo = true`) quando o role default é professional. Idempotente.

---

## Parte B — RLS por role nas tabelas de domínio

Aplicar a todas: `patients`, `journeys`, `journey_steps`, `appointments`, `exams`, `tasks`, `parameter_records`, `questionnaire_responses`, `alerts`, `orientacoes`.

### Padrão de policies (exemplo `patients`)

```sql
-- DROP das policies "anon = tudo" e "authenticated = tudo"
drop policy if exists "Anon users can do everything on patients" on public.patients;
drop policy if exists "Authenticated users can do everything on patients" on public.patients;

-- SELECT
create policy "Patients access" on public.patients for select to authenticated
using (public.can_access_patient(auth.uid(), id));

-- INSERT (só professional/manager/admin)
create policy "Patients insert" on public.patients for insert to authenticated
with check (
  public.has_role(auth.uid(), 'professional')
  or public.has_role(auth.uid(), 'manager')
  or public.has_role(auth.uid(), 'admin')
);

-- UPDATE/DELETE: mesma regra de SELECT, mas paciente não pode editar próprios dados clínicos
create policy "Patients update" on public.patients for update to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'manager')
  or exists (
    select 1 from public.patient_assignments pa
    join public.professionals p on p.id = pa.professional_id
    where p.user_id = auth.uid() and pa.patient_id = patients.id
  )
);

create policy "Patients delete" on public.patients for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));
```

### Para tabelas filhas (`journeys`, `appointments`, `exams`, `tasks`, etc.)

Mesmo padrão, mas usando `can_access_patient(auth.uid(), <tabela>.patient_id)`.

`journey_steps` não tem `patient_id` direto — usar subquery via `journey_id`:
```sql
using (exists (
  select 1 from public.journeys j
  where j.id = journey_steps.journey_id
    and public.can_access_patient(auth.uid(), j.patient_id)
))
```

### Casos especiais

- **`care_lines`, `questionnaires`, `automation_rules`**: dados de configuração. Authenticated SELECT pra todos; INSERT/UPDATE/DELETE só `admin`/`manager`.
- **`patients` UPDATE pelo paciente**: pode editar `telefone`, `email`, `endereco`, `cidade`, `estado`. Implementação simples nesta sprint: paciente NÃO edita patients (faz isso via `profiles`). Editar dados clínicos = só profissional/admin.

### Remoção do role `anon`

Todas as policies de `anon` são removidas. App passa a exigir login pra qualquer leitura. (Já é o comportamento real — só estavam lá por inércia do scaffold.)

---

## Parte C — Audit logs

### C.1 Tabela

```sql
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  table_name text not null,
  record_id uuid,
  action text not null,         -- 'INSERT' | 'UPDATE' | 'DELETE'
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- só admin/manager leem; ninguém escreve direto (só via trigger)
create policy "Audit read" on public.audit_logs for select to authenticated
using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'));
```

### C.2 Trigger genérica

```sql
create or replace function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  _email text;
begin
  select email into _email from public.profiles where id = auth.uid();
  insert into public.audit_logs(user_id, user_email, table_name, record_id, action, old_data, new_data)
  values (
    auth.uid(),
    _email,
    tg_table_name,
    coalesce(new.id, old.id),
    tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;
```

Ativar nas tabelas clínicas críticas: `patients`, `journeys`, `journey_steps`, `exams`, `tasks`, `appointments`, `parameter_records`, `user_roles`.

### C.3 UI

Nova página `src/pages/AuditLog.tsx` (admin/manager only). Lista paginada com filtros por: usuário, tabela, ação, data. Adicionar item no menu admin.

---

## Parte D — Anexos (storage + tabela)

### D.1 Bucket Storage

Bucket `attachments` privado. Path convention: `patients/<patient_id>/<filename>`.

Storage policies:
```sql
-- SELECT
create policy "Attachments read" on storage.objects for select to authenticated
using (
  bucket_id = 'attachments'
  and public.can_access_patient(
    auth.uid(),
    (string_to_array(name, '/'))[2]::uuid  -- patients/<uuid>/file
  )
);

-- INSERT/UPDATE/DELETE: profissional/admin/manager com vínculo
create policy "Attachments write" on storage.objects for insert to authenticated
with check (
  bucket_id = 'attachments'
  and public.can_access_patient(
    auth.uid(),
    (string_to_array(name, '/'))[2]::uuid
  )
);
-- (idem update, delete)
```

### D.2 Tabela `attachments`

Metadata sobre os arquivos:
```sql
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  category text,                -- 'exame' | 'receita' | 'atestado' | 'outro'
  related_exam_id uuid,
  related_journey_step_id uuid,
  created_at timestamptz not null default now()
);

alter table public.attachments enable row level security;

create policy "Attachments meta read" on public.attachments for select to authenticated
using (public.can_access_patient(auth.uid(), patient_id));

create policy "Attachments meta write" on public.attachments for all to authenticated
using (public.can_access_patient(auth.uid(), patient_id))
with check (public.can_access_patient(auth.uid(), patient_id));
```

### D.3 UI

- Hook `useAttachments(patientId)` em `src/hooks/useAttachments.ts`.
- Componente `<AttachmentList patientId>` em `src/components/shared/AttachmentList.tsx` — lista + upload (drag&drop) + download + delete.
- Integrar em `PerfilPaciente.tsx` (nova aba "Anexos") e em `JornadaClinica.tsx` (anexar ao step atual).

---

## Parte E — Templates de questionário

Hoje `questionnaires` só tem nome e contagem de perguntas. Pra responder um PROM/PREM de verdade, precisa das perguntas.

### E.1 Schema

```sql
create table public.questionnaire_items (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.questionnaires(id) on delete cascade,
  ordem int not null,
  pergunta text not null,
  tipo text not null,           -- 'likert_5' | 'sim_nao' | 'numero' | 'texto'
  opcoes jsonb,                 -- pra likert/multipla
  peso numeric default 1,
  created_at timestamptz not null default now()
);

create index on public.questionnaire_items(questionnaire_id, ordem);
```

Em `questionnaire_responses`, adicionar `respostas jsonb` (`{ item_id: valor }`).

### E.2 RLS

`questionnaire_items` segue policy de `questionnaires` (read = authenticated; write = admin/manager).

### E.3 UI

Nesta sprint **só schema + hook + ajustes mínimos**. UI completa de "responder questionário" é tela nova grande — fora do escopo. Apenas:
- Hook `useQuestionnaireItems(questionnaireId)`.
- Mostrar contagem real em `Questionarios.tsx` (count de items, não campo `perguntas`).

---

## Parte F — Índices de performance

Após policies pesadas (que fazem subquery em `patient_assignments`), índices viram crítico:

```sql
create index if not exists idx_patient_assignments_user
  on public.patient_assignments(professional_id, patient_id);
create index if not exists idx_professionals_user_id
  on public.professionals(user_id);
create index if not exists idx_profiles_patient_id
  on public.profiles(patient_id);

-- queries comuns
create index if not exists idx_appointments_data on public.appointments(data);
create index if not exists idx_appointments_patient on public.appointments(patient_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_patient on public.tasks(patient_id);
create index if not exists idx_exams_status on public.exams(status);
create index if not exists idx_exams_patient on public.exams(patient_id);
create index if not exists idx_alerts_lido on public.alerts(lido);
create index if not exists idx_alerts_patient on public.alerts(patient_id);
create index if not exists idx_journey_steps_journey on public.journey_steps(journey_id);
create index if not exists idx_journeys_patient on public.journeys(patient_id);
create index if not exists idx_parameter_records_patient_field on public.parameter_records(patient_id, field, date);
create index if not exists idx_user_roles_user on public.user_roles(user_id);
create index if not exists idx_audit_logs_table on public.audit_logs(table_name, created_at desc);
```

---

## Parte G — Seed de teste pro `dugoncales@gmail.com`

Pra ele continuar testando a 4 visões:
- Criar entrada em `professionals` (já criada via trigger se necessário)
- Atribuir TODOS os pacientes existentes a esse professional via `patient_assignments` (admin acessa tudo direto, mas como ele tem role `professional`, precisa do vínculo pra view "professional" funcionar)
- `profile.patient_id` já está vinculado ao primeiro paciente (Sprint 3) ⇒ visão `patient` segue funcionando

---

## Ordem de execução (cuidado: cada bloco vai como migration separada pra rollback fácil)

1. **Migration 1** — Parte A (`professionals`, `patient_assignments`, security definers, trigger)
2. **Migration 2** — Parte B (RLS por role em todas as tabelas de domínio)
3. **Migration 3** — Parte C (audit logs + triggers)
4. **Migration 4** — Parte D (bucket + tabela `attachments` + policies)
5. **Migration 5** — Parte E (`questionnaire_items` + `respostas` em responses)
6. **Migration 6** — Parte F (índices)
7. **Migration 7** — Parte G (seed pro dugoncales)
8. Frontend: hooks, componentes, páginas

---

## Arquivos editados / criados

| Arquivo | Mudança |
|---|---|
| 7 migrations SQL | descritas acima |
| `src/hooks/useProfessionals.ts` | **novo** — list, create, assignments |
| `src/hooks/usePatientAssignments.ts` | **novo** — vínculos N:N |
| `src/hooks/useAttachments.ts` | **novo** — list/upload/delete via storage |
| `src/hooks/useQuestionnaireItems.ts` | **novo** |
| `src/hooks/useAuditLogs.ts` | **novo** — paginado com filtros |
| `src/components/shared/AttachmentList.tsx` | **novo** — drag&drop + lista + delete |
| `src/pages/AuditLog.tsx` | **nova página** — admin/manager only |
| `src/pages/StudioAdmin.tsx` | adicionar gestão de profissionais e atribuições |
| `src/pages/PerfilPaciente.tsx` | aba "Anexos" |
| `src/pages/JornadaClinica.tsx` | anexar ao step atual |
| `src/pages/Questionarios.tsx` | usar count real de items |
| `src/components/layout/AppSidebar.tsx` | item "Auditoria" pra admin/manager |
| `src/components/auth/RequireAuth.tsx` | já filtra por role — só checar |

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Quebrar acesso de quem só tem role professional sem assignments | Seed (Parte G) vincula `dugoncales` a todos os pacientes; documentar que novos professionals começam sem acesso até admin atribuir |
| Recursão em policy via subquery | Tudo via `security definer functions` (`can_access_patient`) |
| Performance ruim em telas com muitos joins | Parte F (índices) cobre os casos comuns |
| Trigger de audit deixar lenta operação batch | Aplicada só em tabelas críticas, não em `parameter_records` em massa (avaliar) |
| Storage bucket policy mal escrita = vazamento de dados | Usar `can_access_patient` (mesma função das tabelas) — uma fonte de verdade |

## Quando o usuário deve testar entre migrations

- Após Migration 2: confirmar que login como `dugoncales` ainda mostra pacientes nas 4 visões.
- Após Migration 4: testar upload de anexo.
- No fim: testar criar usuário novo (vai começar como professional sem assignments → não vê pacientes; admin atribui via Studio → passa a ver).

