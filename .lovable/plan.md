

# Plano: Sprint 4 — Hooks otimizados, `id` vs `slug`, jornada mais leve

Reduzir over-fetch movendo filtros para o servidor e corrigir a ambiguidade entre `id` (uuid) e `slug` em `care_lines`. Sem mudanças de schema neste sprint.

---

## 1. `mapCareLine` e tipo `CareLine` — expor `id` E `slug`

Hoje `mapCareLine` retorna `{ id: row.slug, ... }` — usa o slug como id. Isso causa bugs sutis: outras tabelas referenciam `care_line_id` por **uuid** (`row.id`), não por slug. Hoje as comparações funcionam por coincidência só onde dados de seed estão consistentes.

Mudanças:
- `src/data/types.ts`: `CareLine` ganha `slug: string` (já tem `id: string`).
- `src/lib/db-helpers.ts`: `mapCareLine` retorna `{ id: row.id, slug: row.slug, ... }`.
- Auditar todos os usos de `careLine.id` para decidir se deveriam ser `careLine.slug` (URLs/lookup) ou `careLine.id` (joins).
- Manter um helper `findCareLineByRef(careLines, ref)` que aceita id OU slug, para suavizar transição.

Páginas a auditar:
- `LinhasDeCuidado.tsx`, `JornadaClinica.tsx`, `BI.tsx`, `DashboardPaciente.tsx`, `DashboardGestor.tsx`, `DashboardProfissional.tsx`, `Pacientes.tsx`, `EditorNoCode.tsx`, `Questionarios.tsx`.

---

## 2. Hooks com filtros server-side opcionais

Adicionar parâmetro `patientId?` (e outros filtros relevantes) a hooks que hoje sempre buscam tudo:

| Hook | Assinatura nova |
|---|---|
| `useExams` | `useExams(patientId?: string)` |
| `useTasks` | `useTasks(patientId?: string, status?: TaskStatus[])` |
| `useParameterRecords` | `useParameterRecords(patientId?: string, field?: string)` |
| `useQuestionnaireResponses` | `useQuestionnaireResponses(patientId?: string)` |
| `useJourneys` | `useJourneys(patientId?: string)` |
| `useAppointments` | já aceita `patientId?` — manter |
| `useAlerts` | `useAlerts(patientId?: string, unreadOnly?: boolean)` |
| `useOrientacoes` | já aceita `patientId?` — manter |

Implementação: `query.eq('patient_id', patientId)` quando definido. `queryKey` inclui os filtros para invalidation correto.

---

## 3. Hooks especializados

Novos hooks puros (sem filtros no cliente) para cenários comuns:

- `useTodayAppointments()` em `src/hooks/useAppointments.ts`:
  - `WHERE data = today ORDER BY hora`.
- `usePendingTasks(patientId?)` em `useTasks.ts`:
  - `WHERE status IN ('pendente','em_andamento','atrasada')`.
- `useOverdueExams(patientId?)` em `useExams.ts`:
  - `WHERE status = 'atrasado' OR (status = 'solicitado' AND data_solicitacao < today - interval '30 days')`.
- `useUnreadAlerts(patientId?)` em `useAlerts.ts`:
  - `WHERE lido = false`.
- `useJourney(id)` em `useJourneys.ts`:
  - busca uma jornada com `journey_steps` via subquery (duas queries em paralelo, retornar combinado).

Mutations:
- `useUpdateJourney()` — atualiza `current_step_index`, `status`.
- `useAdvanceJourneyStep(journeyId)` — marca step atual como concluído e incrementa index.

---

## 4. Refator das páginas para usar hooks especializados

Substituir filtros `.filter(...)` no cliente por chamadas a hooks com filtros já aplicados. Ganho de performance + menos código.

Páginas:
- `JornadaClinica.tsx`: usar `useAppointments(effectivePatientId)`, `useExams(effectivePatientId)`, `useTasks(effectivePatientId)`, `useParameterRecords(effectivePatientId)` em vez de buscar tudo e filtrar.
- `DashboardProfissional.tsx`: `useTodayAppointments()`, `usePendingTasks()`, `useOverdueExams()`, `useUnreadAlerts()`.
- `DashboardGestor.tsx`: idem onde aplicável (manter `usePatients()` global, é o ponto da tela).
- `DashboardPaciente.tsx`: já passa `patientId` — só garantir que todos os hooks usem o filtro server-side.
- `PerfilPaciente.tsx`: usar todos os hooks com `patientId` server-side; remove `.filter(p => p.id === patientId)` no cliente.
- `BI.tsx`: mantém busca global (é o ponto da tela), sem mudança.

---

## 5. Sem mudanças de schema neste sprint

Confirmado:
- Sem migrations
- Sem novas tabelas
- Sem mudanças em RLS

Sprint 5 cuida disso (RLS por role, audit, anexos).

---

## Arquivos editados

| Arquivo | Mudança |
|---|---|
| `src/data/types.ts` | `CareLine` ganha `slug` |
| `src/lib/db-helpers.ts` | `mapCareLine` expõe `id` e `slug`; helper `findCareLineByRef` |
| `src/hooks/useExams.ts` | aceita `patientId?`; novo `useOverdueExams` |
| `src/hooks/useTasks.ts` | aceita `patientId?, status?`; novo `usePendingTasks` |
| `src/hooks/useParameterRecords.ts` | aceita `patientId?, field?` |
| `src/hooks/useQuestionnaireResponses.ts` | aceita `patientId?` |
| `src/hooks/useJourneys.ts` | aceita `patientId?`; novos `useJourney`, `useUpdateJourney`, `useAdvanceJourneyStep` |
| `src/hooks/useAppointments.ts` | novo `useTodayAppointments` |
| `src/hooks/useAlerts.ts` | aceita `patientId?, unreadOnly?`; novo `useUnreadAlerts` |
| `src/pages/JornadaClinica.tsx` | usar hooks filtrados |
| `src/pages/DashboardProfissional.tsx` | usar hooks especializados |
| `src/pages/DashboardPaciente.tsx` | confirmar uso server-side |
| `src/pages/PerfilPaciente.tsx` | usar hooks filtrados; remover filtros cliente |
| `src/pages/LinhasDeCuidado.tsx` + outras | auditar `careLine.id` vs `careLine.slug` |

## Fora de escopo (Sprint 5)

- RLS por role (substituir policies "anon = tudo")
- `professionals` + `patient_assignments`
- `audit_logs` + triggers
- `attachments` + bucket Storage
- `questionnaire_templates` + `questionnaire_items`
- Índices de performance

