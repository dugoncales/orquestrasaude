

# Plano: Sprint 3 — Eliminar mocks restantes + UX clínica

Zerar dependência de `mock-*` em telas de produção, criar helpers de formatação e melhorar timeline do paciente. Após este sprint, os arquivos mock são deletados.

---

## 1. Helpers de formatação (novo)

`src/lib/format.ts`:
- `formatSexo(s)` → `'Feminino' | 'Masculino' | 'Outro' | 'Não informado'`
- `formatDateBR(d)` → `dd/MM/yyyy`
- `formatDateTimeBR(d)` → `dd/MM/yyyy HH:mm`
- `getInitials(name)` → iniciais para avatar

Aplicar em `PerfilPaciente.tsx`, `JornadaClinica.tsx`, `DashboardPaciente.tsx`.

---

## 2. Hook `useOrientacoes` — adicionar filtro por paciente

`src/hooks/useOrientacoes.ts`: aceitar `useOrientacoes(patientId?)` com filtro server-side opcional.

---

## 3. `DashboardPaciente.tsx` — refator total

Hoje importa `mockAppointments`, `mockExams`, `mockQuestionnaireResponses`, `mockJourneys`, `mockOrientacoes`, `mockPatients` e `careLines` estático, com `patientId = 'p1'` hardcoded.

Mudanças:
- `patientId` vem de `useAuth().profile.patient_id`.
- Hooks reais: `usePatient(patientId)`, `useJourneys(patientId)`, `useAllJourneySteps`, `useAppointments(patientId)`, `useExams(patientId)`, `useQuestionnaireResponses(patientId)`, `useOrientacoes(patientId)`, `useCareLines`.
- Steps filtrados por `journey_id`; `currentStepIndex` vem da journey.
- Goals via `parseGoals(patient.goals)`.
- Estado vazio acolhedor quando `!patientId`: card centralizado "Seu acesso ainda não está vinculado a um prontuário. Procure sua equipe para vincular seu cadastro."
- Loading skeletons enquanto queries carregam.

---

## 4. `BI.tsx` — refator total

Hoje importa `mockPatients`, `mockJourneys`, `mockAppointments`, `mockTasks`, `mockExams`, `mockParameterRecords` e `careLines`.

Mudanças:
- Substituir todos os imports mock por hooks: `usePatients`, `useJourneys`, `useAppointments`, `useTasks`, `useExams`, `useParameterRecords`, `useCareLines`.
- Adaptar cálculos para `snake_case` (`risk_level`, `care_line_id`, `data_solicitacao` etc.).
- Usar `mapCareLine` para normalizar care lines.
- Manter `parameterDictionary` (configuração estática, não é mock).
- Loading state quando `isLoading` em qualquer hook chave.

---

## 5. Timeline melhorada (`PerfilPaciente.tsx`)

Hoje: lista plana de 8 eventos, sem filtro nem agrupamento.

Mudanças:
- Tabs de filtro por tipo: `Todos | Consultas | Exames | Tarefas | Alertas`.
- Container `max-h-[480px] overflow-y-auto` para scroll interno.
- Agrupamento visual por mês (label "Abril 2026", "Março 2026" etc.).
- Ícone por tipo (Calendar/FlaskConical/CheckSquare/AlertTriangle) com cor por status.
- Aplicar `formatDateBR` consistentemente.
- Aplicar `formatSexo` no header do paciente.

---

## 6. Cleanup final

Deletar:
- `src/data/mock-data.ts`
- `src/data/mock-patients.ts`
- `src/data/care-lines.ts`

Manter:
- `src/data/types.ts` (tipos de domínio)
- `src/data/parameters.ts` (dicionário clínico, configuração)

Verificar com busca global que nenhum import remanescente quebra o build antes de deletar.

---

## 7. Seed: profile demo vinculado a paciente real

Migration de seed: vincular o `profiles` do usuário `dugoncales@gmail.com` ao primeiro paciente do banco (`patient_id = (SELECT id FROM patients ORDER BY created_at LIMIT 1)`), só se ainda for `NULL`. Permite testar a visão `patient` imediatamente após o login.

---

## Arquivos editados

| Arquivo | Mudança |
|---|---|
| `src/lib/format.ts` | **novo** — helpers `formatSexo`, `formatDateBR`, etc. |
| `src/hooks/useOrientacoes.ts` | aceitar `patientId?` opcional |
| `src/pages/DashboardPaciente.tsx` | refator total, zero mocks |
| `src/pages/BI.tsx` | refator total, zero mocks |
| `src/pages/PerfilPaciente.tsx` | timeline com tabs/scroll/agrupamento + formatadores |
| `src/pages/JornadaClinica.tsx` | aplicar `formatSexo` / `formatDateBR` |
| `supabase/migrations/...sql` | seed: vincular profile demo ao primeiro paciente |
| **deletar** `src/data/mock-data.ts` | — |
| **deletar** `src/data/mock-patients.ts` | — |
| **deletar** `src/data/care-lines.ts` | — |

## Fora de escopo (próximos sprints)

- Sprint 4: hooks especializados (`useTodayAppointments`, etc.) e `id` vs `slug` em `mapCareLine`
- Sprint 5: RLS por role, audit logs, anexos, `professionals` + `patient_assignments`

