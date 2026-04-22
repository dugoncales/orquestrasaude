

# Plano: Sprints 2 a 5 — Auth real, fim dos mocks, hooks otimizados, RLS e expansão

Roadmap completo para sair de "demo polido" para "produto pronto pra uso real". Cada Sprint é entregável independente — você pode parar entre eles e usar o sistema.

---

## Sprint 2 — Autenticação real e proteção de rotas

**Objetivo:** Substituir o `AuthContext` mockado por Supabase Auth + tabela `profiles` + `user_roles`, e proteger as rotas privadas.

### Banco (migration única)

1. Enum `app_role`: `'patient' | 'professional' | 'manager' | 'admin'`.
2. Tabela `profiles`:
   - `id uuid PK references auth.users on delete cascade`
   - `full_name text`, `email text`, `avatar text`
   - `patient_id uuid` (FK lógica para `patients`, nullable)
   - `created_at`, `updated_at`
3. Tabela `user_roles` (separada — evita escalada de privilégio):
   - `id uuid PK`, `user_id uuid references auth.users on delete cascade`
   - `role app_role not null`
   - UNIQUE `(user_id, role)`
4. Função `SECURITY DEFINER` `has_role(_user_id uuid, _role app_role) returns boolean`.
5. Trigger `on_auth_user_created` que insere automaticamente em `profiles` (lê `raw_user_meta_data->>full_name`) e em `user_roles` com role default `professional` (admin promove depois).
6. RLS em `profiles` e `user_roles`:
   - usuário lê/atualiza o próprio `profile`
   - admin lê tudo via `has_role(auth.uid(),'admin')`
   - `user_roles`: usuário lê o próprio; só admin escreve

### Frontend

- `src/pages/Login.tsx` (novo): email/senha + signup com `emailRedirectTo: window.location.origin`.
- `src/pages/ResetPassword.tsx` (novo): página pública para `type=recovery`.
- `src/contexts/AuthContext.tsx` (refator total):
  - `useEffect` registra `supabase.auth.onAuthStateChange` **antes** de `getSession()`.
  - Carrega `profile` (do `profiles`) e `roles` (de `user_roles`).
  - Expõe: `user, session, profile, role, patientId, signIn, signUp, signOut, loading`.
  - Mantém `setRole` somente quando `ENABLE_ROLE_SWITCHER` está ligado (modo dev) — substitui a role ativa em memória, sem mexer no banco.
- `src/components/auth/RequireAuth.tsx` (novo): redireciona para `/login` se sem sessão; mostra `Skeleton` enquanto `loading`.
- `src/App.tsx`:
  - Rotas públicas (`/login`, `/reset-password`) **fora** de `<AppLayout>`.
  - Rotas privadas envolvidas por `<RequireAuth><AppLayout>...</AppLayout></RequireAuth>`.
- `DashboardRouter.tsx`: usa `role` real do contexto; sem role mostra fallback "Aguardando atribuição de perfil".

### Arquivos editados/criados
| Arquivo | Mudança |
|---|---|
| `supabase/migrations/...sql` | enum + profiles + user_roles + has_role + trigger + RLS |
| `src/contexts/AuthContext.tsx` | refator para Supabase Auth |
| `src/pages/Login.tsx` | **novo** |
| `src/pages/ResetPassword.tsx` | **novo** |
| `src/components/auth/RequireAuth.tsx` | **novo** |
| `src/App.tsx` | separar rotas públicas/privadas |
| `src/pages/DashboardRouter.tsx` | usar role real + loading |
| `src/components/layout/AppHeader.tsx` | "Sair" chama `signOut` real |

---

## Sprint 3 — Eliminar mocks restantes (DashboardPaciente + BI) e melhorar perfil

**Objetivo:** Zero importação de `mock-*` em telas de produção. Deletar arquivos mock e melhorar UX clínica.

### Hook novo
- `src/hooks/useOrientacoes.ts` (já existe? confirmar) → garantir `useOrientacoes(patientId?)`.

### `src/pages/DashboardPaciente.tsx` (refator total)
- `patientId` vem de `useAuth().patientId` (sem hardcode `'p1'`).
- Hooks: `usePatient`, `useJourneys(patientId)`, `useAllJourneySteps`, `useAppointments(patientId)`, `useExams(patientId)`, `useQuestionnaireResponses(patientId)`, `useOrientacoes(patientId)`, `useCareLines`.
- Steps de `journey_steps` filtrados por `journey_id`; `currentStepIndex` da journey.
- Goals via `parseGoals(patient.goals)`.
- Estado vazio acolhedor quando `!patientId` ("Seu acesso ainda não está vinculado a um prontuário").

### `src/pages/BI.tsx` (refator total)
- Substituir todos os imports mock pelos hooks já existentes.
- Cálculos com `snake_case`; `mapCareLine` para care lines.
- Manter `parameterDictionary` (config estática).

### Helpers de formatação
- `src/lib/format.ts` (novo): `formatSexo(s)` → `Feminino|Masculino|Outro|Não informado`; `formatDateBR(d)`.
- Aplicar em `PerfilPaciente.tsx` e `JornadaClinica.tsx`.

### Timeline melhorada (`PerfilPaciente.tsx`)
- Filtro por tipo (consulta/exame/tarefa/alerta) — tabs simples.
- Scroll vertical interno (`max-h-[480px] overflow-y-auto`).
- Agrupamento por mês.
- Ícones por tipo/status.

### Cleanup final
Deletar:
- `src/data/mock-data.ts`
- `src/data/mock-patients.ts`
- `src/data/care-lines.ts`

Manter: `src/data/types.ts`, `src/data/parameters.ts`.

### Seed do banco
Migration de seed que insere uma `profile` de demo vinculada ao primeiro patient do banco, para o login `patient` ter dados ao logar pela primeira vez.

---

## Sprint 4 — Hooks otimizados, `id` vs `slug`, jornada mais leve

**Objetivo:** Reduzir over-fetch e bugs sutis de associação `id`/`slug`.

### `src/lib/db-helpers.ts`
- `mapCareLine` passa a expor **ambos**: `{ id: row.id, slug: row.slug, ... }`.
- Tipo `CareLine` em `data/types.ts` ganha `slug: string` opcional.
- Auditoria: trocar comparações `careLine.id === something.care_line_id` para usar `row.id` consistentemente; `slug` só para URLs/lookup amigável.

### Hooks com filtros server-side
- `useExams(patientId?)`, `useTasks(patientId?, status?)`, `useParameterRecords(patientId?, field?)`, `useQuestionnaireResponses(patientId?)`, `useJourneys(patientId?)` — todos aceitam filtros opcionais.
- Especializados:
  - `useTodayAppointments()` — `data = today`, ordenado por `hora`.
  - `usePendingTasks(patientId?)` — `status in ('pendente','em_andamento','atrasada')`.
  - `useOverdueExams(patientId?)` — `status = 'atrasado' OR (status='solicitado' AND data_solicitacao < today - 30d)`.
  - `useUnreadAlerts(patientId?)` — `lido = false`.
- `useJourney(id)` — uma jornada específica com steps via join.
- `useUpdateJourney()` e `useAdvanceJourneyStep(journeyId)` — mutations.

### `JornadaClinica.tsx`
- Trocar hooks globais por filtrados (`useAppointments(effectivePatientId)`, etc.) — remove `.filter(...)` do cliente.
- `MultiLineOverview` continua recebendo steps via prop (já feito).

### Páginas atualizadas
`PerfilPaciente`, `DashboardProfissional`, `DashboardGestor`, `DashboardPaciente`, `BI` — usar hooks especializados onde fizer sentido.

---

## Sprint 5 — RLS por role, audit log, anexos, escala

**Objetivo:** Controle de acesso real e infraestrutura de produção.

### RLS por role (substitui as policies "anon = tudo" temporárias)

Para cada tabela clínica (`patients`, `journeys`, `journey_steps`, `appointments`, `exams`, `tasks`, `alerts`, `parameter_records`, `questionnaire_responses`, `orientacoes`):

- **patient**: `SELECT/UPDATE` só onde `patient_id = (select patient_id from profiles where id = auth.uid())`.
- **professional**: `SELECT` em todos; `INSERT/UPDATE` em todos (refinar depois com `patient_assignments`).
- **manager**: `SELECT` em todos; `UPDATE` restrito.
- **admin**: tudo.

Tabelas de configuração (`care_lines`, `questionnaires`, `automation_rules`):
- `SELECT` para `authenticated`.
- `INSERT/UPDATE/DELETE` só admin via `has_role(auth.uid(),'admin')`.

Remover policies `anon` em todas as tabelas (ou manter só em `care_lines` para landing pública, se necessário).

### Novas tabelas

1. **`professionals`**: `id, profile_id, especialidade, conselho, unidade, ativo`.
2. **`patient_assignments`** (N:N): `patient_id, professional_id, role ('responsavel'|'apoio'), criado_em`. Permite RLS de profissional ver só sua carteira.
3. **`audit_logs`**: `id, user_id, action, table_name, record_id, old_values jsonb, new_values jsonb, created_at`. Triggers `AFTER INSERT/UPDATE/DELETE` em tabelas clínicas registram automaticamente.
4. **`attachments`**: `id, owner_user_id, patient_id, journey_step_id?, exam_id?, file_path, file_name, mime_type, size_bytes, created_at`. Bucket `patient-attachments` privado no Supabase Storage; RLS no bucket espelha RLS da tabela.
5. **`questionnaire_templates`** + **`questionnaire_items`**: estrutura real (pergunta, tipo, opções, peso) — substitui o `perguntas: integer` atual.

### Frontend — superficial
- `src/pages/Anexos.tsx` (opcional): upload/listagem na tela do paciente.
- `useAuditLogs(filters)` para tela admin.
- Hooks de `professionals` e `patient_assignments` para dropdowns de "responsável".

### Performance
- Índices: `patients(risk_level)`, `appointments(data, patient_id)`, `journey_steps(journey_id, step_order)`, `parameter_records(patient_id, field, date)`, `alerts(patient_id, lido)`.

---

## Resumo da fila

```text
Sprint 2 → Auth real + rotas protegidas         (~1 dia)
Sprint 3 → Mocks zerados + UX paciente/perfil   (~1 dia)
Sprint 4 → Hooks otimizados + id/slug fix       (~0.5 dia)
Sprint 5 → RLS real + audit + anexos + escala   (~1.5 dia)
```

## Recomendação de execução

Começar pelo **Sprint 2** (auth) — destrava tudo o que vem depois (RLS faz sentido só com auth real, e o `DashboardPaciente` precisa do `patientId` do profile pra ser refatorado direito).

Quer que eu siga direto com o Sprint 2?

