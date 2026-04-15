

# Plano: Lote 2+3 — Migrar Todas as Páginas para Dados Reais

Substituir todas as referências a `mockData`, `mockPatients` e `careLines` estáticos por hooks Supabase já criados no Lote 1. Depois, remover os arquivos mock.

O banco já tem dados seed (8 pacientes, 6 care lines, 8 jornadas, 80 steps, 8 consultas, 6 exames, 6 tarefas, 6 alertas).

---

## Desafio Principal: Mapeamento de Campos

Os mocks usam `camelCase` (ex: `patientId`, `careLineId`, `dataSolicitacao`), mas o banco usa `snake_case` (ex: `patient_id`, `care_line_id`, `data_solicitacao`). Além disso, os mocks de `journeys` incluem `steps` inline, mas no banco `journey_steps` é uma tabela separada.

Cada página precisa adaptar o acesso aos campos e lidar com estados de loading.

---

## Mudanças por Arquivo

### 1. Páginas — substituir imports mock por hooks

| Página | Hooks usados | Mudanças principais |
|---|---|---|
| `Pacientes.tsx` | `usePatients`, `useCareLines` | Trocar `mockPatients`/`careLines` por dados do hook. Campos: `risk_level`, `linhas_ativas`, `score_risco`, `dias_sem_retorno`, `diagnosticos_ativos`. Loading state. |
| `PerfilPaciente.tsx` | `usePatient(id)`, `useJourneys`, `useAppointments`, `useExams`, `useTasks`, `useAlerts`, `useParameterRecords`, `useCareLines` | Montar timeline de eventos com dados reais. Campos snake_case. |
| `JornadaClinica.tsx` | `usePatients`, `useJourneys`, `useJourneySteps`, `useAppointments`, `useExams`, `useTasks`, `useAlerts`, `useQuestionnaireResponses`, `useParameterRecords`, `useCareLines` | Mais complexa. Steps vêm de `useJourneySteps(journeyId)` (tabela separada). Montar vinculações step→entidades via `journey_step_id`. |
| `Consultas.tsx` | `useAppointments`, `useCareLines` | Filtros por status/profissional. Campos: `patient_name`, `patient_id`. |
| `Exames.tsx` | `useExams` | Filtro por status. Campos: `data_solicitacao`, `patient_name`. |
| `Questionarios.tsx` | `useQuestionnaireResponses`, `useCareLines` | Filtro por care_line. Join `questionnaires` para tipo. Campos: `patient_name`, `care_line_id`, `max_score`. |
| `DashboardProfissional.tsx` | `usePatients`, `useAppointments`, `useTasks`, `useAlerts`, `useJourneys`, `useCareLines`, `useExams` | KPIs calculados com dados reais. |
| `DashboardGestor.tsx` | `usePatients`, `useAppointments`, `useTasks`, `useJourneys`, `useAlerts`, `useCareLines` | KPIs executivos. `mockAIInsights` mantido inline (não é entidade do banco). |
| `DashboardPaciente.tsx` | `usePatient`, `useJourneys`, `useJourneySteps`, `useAppointments`, `useExams`, `useQuestionnaireResponses`, `useOrientacoes`, `useCareLines` | Filtrar por patientId do auth context. |
| `BI.tsx` | `usePatients`, `useJourneys`, `useAppointments`, `useExams`, `useTasks`, `useQuestionnaireResponses`, `useParameterRecords`, `useCareLines` | Cálculos agregados com dados reais. |
| `LinhasDeCuidado.tsx` | `useCareLines`, `usePatients` | Cards de linhas + pacientes prioritários. Manter `parameterDictionary` (config estática, não mock). |
| `StudioAdmin.tsx` | `useAutomationRules`, `useCareLines` | `mockAutomationRules`, `mockPermissionsMatrix` → hooks reais para rules. Permissions matrix mantida inline (config). |

### 2. Componentes compartilhados

| Componente | Mudança |
|---|---|
| `JourneyFunnel.tsx` | Receber `journeys` como prop em vez de importar `mockJourneys` |
| `AppHeader.tsx` | Usar `useAlerts` em vez de `mockAlerts` |

### 3. Hooks — pequenos ajustes

- `useAlerts`: adicionar filtro `lido = false` opcional
- `useAppointments`: adicionar filtro por `patient_id` opcional

### 4. Padrão para loading/error em cada página

Cada página terá:
```tsx
const { data: patients, isLoading } = usePatients();
if (isLoading) return <Skeleton />;
const safePatients = patients || [];
```

### 5. Remover arquivos mock

Após a migração:
- `src/data/mock-data.ts` — deletar
- `src/data/mock-patients.ts` — deletar
- `src/data/care-lines.ts` — deletar (dados agora no banco)

Manter:
- `src/data/types.ts` — tipos usados na UI
- `src/data/parameters.ts` — dicionário de parâmetros (config, não mock)

### 6. AuthContext

O `AuthContext` ainda usa IDs hardcoded (`p1`, `u1`, etc.). Os patient IDs no banco agora são UUIDs. Precisamos mapear o `patientId` do contexto para o UUID real do banco. Solução: buscar o paciente por nome ou criar um mapeamento fixo no seed. Como a autenticação real virá depois, manter o role switcher funcional com um lookup por nome.

---

## Ordem de implementação

1. Ajustar hooks existentes (filtros adicionais)
2. Atualizar `JourneyFunnel` e `AppHeader` (componentes shared)
3. Atualizar páginas simples: `Consultas`, `Exames`, `Questionarios`
4. Atualizar páginas médias: `Pacientes`, `PerfilPaciente`, `LinhasDeCuidado`
5. Atualizar páginas complexas: `JornadaClinica`, `DashboardProfissional`, `DashboardGestor`, `DashboardPaciente`, `BI`, `StudioAdmin`
6. Ajustar `AuthContext` para UUIDs do banco
7. Deletar arquivos mock

