

# Plano: Migrar Páginas Restantes para Supabase e Remover Mocks

Migrar 7 páginas que ainda importam dados de `mock-data.ts`, `mock-patients.ts` e `care-lines.ts` para usar os hooks Supabase existentes. Depois deletar os 3 arquivos mock.

---

## Padrão de Migração

Cada página seguirá o mesmo padrão:
1. Remover imports de mock/care-lines
2. Adicionar hooks Supabase (`usePatients`, `useCareLines`, `useJourneys`, etc.)
3. Usar `mapCareLine`, `parseGoals`, `riskLevel` de `db-helpers.ts` para converter snake_case -> camelCase
4. Adicionar loading state (`if (isLoading) return <Skeleton />`)
5. Adaptar acesso a campos (ex: `patient.riskLevel` -> `riskLevel(patient)`, `j.careLineId` -> `j.care_line_id`)

---

## Mudanças por Arquivo

### 1. `PerfilPaciente.tsx`
- Hooks: `usePatient(id)`, `useJourneys(id)`, `useAllJourneySteps()`, `useAppointments()`, `useExams()`, `useTasks()`, `useAlerts()`, `useParameterRecords()`, `useCareLines()`
- Adaptar: `patient.nome` -> `patient.nome`, `patient.riskLevel` -> `riskLevel(patient)`, goals via `parseGoals(patient.goals)`, timeline com snake_case fields

### 2. `JornadaClinica.tsx` (mais complexa)
- Hooks: `usePatients`, `useJourneys`, `useAllJourneySteps`, `useAppointments`, `useExams`, `useTasks`, `useAlerts`, `useQuestionnaireResponses`, `useParameterRecords`, `useCareLines`
- Journey steps vêm de tabela separada -> filtrar por `journey_id`
- `journey.steps[i]` -> `steps.filter(s => s.journey_id === journey.id)`
- `currentStep` via `journey.current_step_index` + steps filtrados
- `getTrend()` usa `parameterRecords` do hook
- `MultiLineOverview` já foi atualizado — precisa passar `steps` prop
- `ActionPanel` recebe appointments/exams/tasks do hook (filtrados)

### 3. `DashboardProfissional.tsx`
- Hooks: `usePatients`, `useAppointments`, `useTasks`, `useAlerts`, `useJourneys`, `useAllJourneySteps`, `useCareLines`
- KPIs calculados com dados dos hooks
- `patientsNeedAction` usa `parseGoals` + `isOutOfTarget`
- Agenda/Tarefas usam dados filtrados dos hooks

### 4. `DashboardGestor.tsx`
- Hooks: `usePatients`, `useAppointments`, `useTasks`, `useJourneys`, `useAllJourneySteps`, `useAlerts`, `useCareLines`
- `mockAIInsights` mantido inline (não é entidade do banco)
- `produtividade` calculada com appointments/tasks dos hooks
- `mockPermissionsMatrix` referenciado no StudioAdmin mas não aqui

### 5. `DashboardPaciente.tsx`
- Hooks: `usePatients`, `useJourneys`, `useAllJourneySteps`, `useAppointments`, `useExams`, `useQuestionnaireResponses`, `useOrientacoes`, `useCareLines`
- Filtrar por `patientId` (primeiro paciente no banco, ou via AuthContext)
- `activeJourney.steps[i]` -> steps filtrados da tabela `journey_steps`

### 6. `BI.tsx`
- Hooks: `usePatients`, `useJourneys`, `useAppointments`, `useExams`, `useTasks`, `useQuestionnaireResponses`, `useParameterRecords`, `useCareLines`
- Todos os cálculos (operacional, clínico, executivo) adaptados para dados dos hooks com snake_case

### 7. `LinhasDeCuidado.tsx`
- Hooks: `useCareLines`, `usePatients`
- `careLines` -> `mapCareLine()` dos dados do hook
- `mockPatients` -> `usePatients()` com campos snake_case
- `CareLineDetail` e `IntegratedView` adaptados

### 8. `StudioAdmin.tsx`
- Hooks: `useAutomationRules`, `useCareLines`
- `careLines` -> hook + `mapCareLine()`
- `mockAutomationRules` -> `useAutomationRules()`
- `mockPermissionsMatrix` mantido inline (config, não dado do banco)
- `mockUsers` e `mockAudit` mantidos inline (não há tabela de users ainda)

### 9. `EditorNoCode.tsx`
- Hook: `useCareLines`
- `initialCareLines` -> dados do hook + `mapCareLine()`
- Mutations para salvar alterações nas care lines (update via Supabase)

---

## Arquivos a Deletar

- `src/data/mock-data.ts`
- `src/data/mock-patients.ts`
- `src/data/care-lines.ts`

## Arquivos Mantidos

- `src/data/types.ts` — tipos TypeScript usados na UI
- `src/data/parameters.ts` — dicionário de parâmetros clínicos (config estática)

---

## Nota sobre AuthContext

O `AuthContext` ainda usa IDs hardcoded. Para `DashboardPaciente`, buscaremos o primeiro paciente do banco como fallback até a autenticação real ser implementada.

## Ordem de Implementação

1. Páginas simples primeiro: `PerfilPaciente`, `LinhasDeCuidado`, `StudioAdmin`, `EditorNoCode`
2. Dashboards: `DashboardProfissional`, `DashboardGestor`, `DashboardPaciente`
3. Página complexa: `JornadaClinica`, `BI`
4. Deletar arquivos mock

