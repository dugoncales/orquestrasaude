

# Plano: Transformar Mockup em Sistema Funcional com Lovable Cloud

Migrar toda a aplicação de dados estáticos (mock) para um backend real com Supabase via Lovable Cloud, mantendo o layout atual.

---

## 1. Habilitar Lovable Cloud + Configurar Supabase

Ativar o Lovable Cloud para provisionar banco Supabase automaticamente.

## 2. Schema do Banco de Dados (Migrations)

Criar todas as tabelas com relações entre entidades:

```text
patients ──< journeys ──< journey_steps
    │              │
    ├──< appointments (→ journey_steps?)
    ├──< exams (→ journey_steps?)
    ├──< tasks (→ journey_steps?)
    ├──< alerts
    ├──< parameter_records
    ├──< questionnaire_responses ──> questionnaires
    └──< orientacoes

care_lines ──< journeys
           ──< questionnaires
           ──< automation_rules
```

**Tabelas**: `patients`, `care_lines`, `journeys`, `journey_steps`, `appointments`, `exams`, `tasks`, `alerts`, `parameter_records`, `questionnaires`, `questionnaire_responses`, `automation_rules`, `orientacoes`.

Todas com UUIDs, timestamps, e foreign keys com `ON DELETE CASCADE`.

## 3. RLS (Row Level Security)

- Habilitar RLS em todas as tabelas
- Políticas permissivas iniciais para `authenticated` (leitura/escrita)
- Preparar para refinamento futuro por role (patient vê só seus dados, etc.)

## 4. Seed Data

Migração SQL para inserir os dados que hoje estão nos mocks (`mock-patients.ts`, `mock-data.ts`, `care-lines.ts`) como registros reais no banco.

## 5. Integração Supabase no Frontend

### 5.1 Cliente Supabase
- Criar `src/integrations/supabase/client.ts` com o client configurado

### 5.2 Hooks de dados (`src/hooks/`)
Criar hooks com React Query para cada entidade:
- `usePatients()`, `usePatient(id)`
- `useJourneys(patientId?)`, `useJourneySteps(journeyId)`
- `useAppointments(filters)`, `useExams(filters)`, `useTasks(filters)`
- `useAlerts()`, `useParameterRecords(patientId, field)`
- `useQuestionnaireResponses(filters)`
- `useCareLines()`

Cada hook retorna `{ data, isLoading, error }` + mutations quando aplicável.

### 5.3 Mutations
- `useCreateAppointment()`, `useUpdateAppointmentStatus()`
- `useCreateExam()`, `useUpdateExamStatus()`
- `useCreateTask()`, `useUpdateTaskStatus()`
- `useMarkAlertRead()`
- `useCreateParameterRecord()`
- `useUpdateJourneyStep()`

## 6. Atualizar Todas as Páginas

Substituir imports de mock por hooks reais. Cada página passa a ler/gravar do Supabase:

| Página | Mudança |
|---|---|
| `Pacientes.tsx` | `usePatients()` + filtros reais |
| `PerfilPaciente.tsx` | `usePatient(id)` + dados relacionados |
| `JornadaClinica.tsx` | `useJourneys()` + `useJourneySteps()` |
| `Consultas.tsx` | `useAppointments()` + criar/atualizar status |
| `Exames.tsx` | `useExams()` + criar/atualizar status |
| `Questionarios.tsx` | `useQuestionnaireResponses()` |
| `DashboardProfissional.tsx` | Hooks combinados para KPIs |
| `DashboardGestor.tsx` | Hooks combinados para KPIs |
| `DashboardPaciente.tsx` | Hooks filtrados por patientId |
| `BI.tsx` | Queries agregadas |
| `LinhasDeCuidado.tsx` | `useCareLines()` |
| `StudioAdmin.tsx` | CRUD automation_rules |

## 7. Remover Mocks

Após validação, remover:
- `src/data/mock-data.ts`
- `src/data/mock-patients.ts`
- Referências diretas a dados estáticos

## 8. Ordem de Execução

Dado o volume, implementar em **3 lotes**:

**Lote 1**: Cloud + Schema + Seed + Client + Hooks base (patients, care_lines, journeys)
**Lote 2**: Hooks restantes (appointments, exams, tasks, alerts, questionnaires, parameters) + Mutations
**Lote 3**: Atualizar todas as páginas + remover mocks

---

## Arquivos Novos

| Arquivo | Descrição |
|---|---|
| `supabase/migrations/001_schema.sql` | Schema completo |
| `supabase/migrations/002_seed.sql` | Dados iniciais |
| `supabase/migrations/003_rls.sql` | Políticas RLS |
| `src/integrations/supabase/client.ts` | Cliente Supabase |
| `src/integrations/supabase/types.ts` | Types gerados |
| `src/hooks/usePatients.ts` | Hook pacientes |
| `src/hooks/useJourneys.ts` | Hook jornadas |
| `src/hooks/useAppointments.ts` | Hook consultas |
| `src/hooks/useExams.ts` | Hook exames |
| `src/hooks/useTasks.ts` | Hook tarefas |
| `src/hooks/useAlerts.ts` | Hook alertas |
| `src/hooks/useParameterRecords.ts` | Hook parâmetros clínicos |
| `src/hooks/useQuestionnaireResponses.ts` | Hook questionários |
| `src/hooks/useCareLines.ts` | Hook linhas de cuidado |

## Arquivos Editados

Todas as páginas listadas na seção 6 + `src/App.tsx` (provider Supabase).

