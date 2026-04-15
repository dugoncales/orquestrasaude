

# Plano: Filtrar dados por paciente quando role = patient

## Problema

Quando o usuario esta logado como **paciente** (role `patient`), as paginas Consultas, Exames e Questionarios mostram dados de **todos** os pacientes. O DashboardPaciente ja filtra corretamente para `p1`. As demais paginas precisam do mesmo tratamento.

## Solucao

Usar `useAuth()` em cada pagina para verificar o role. Quando `currentRole === 'patient'`, filtrar os dados mock pelo `patientId` do paciente logado (`p1`, correspondente ao user `u1` no AuthContext).

### Mapeamento user -> patient

Adicionar ao AuthContext um campo `patientId` para o role patient (valor `'p1'`).

### Paginas afetadas

| Pagina | Mudanca |
|---|---|
| `src/pages/Consultas.tsx` | Filtrar `mockAppointments` por `patientId` quando role = patient |
| `src/pages/Exames.tsx` | Filtrar `mockExams` por `patientId` quando role = patient |
| `src/pages/Questionarios.tsx` | Filtrar `mockQuestionnaireResponses` por `patientId` quando role = patient |
| `src/contexts/AuthContext.tsx` | Adicionar `patientId?: string` ao User type e popular com `'p1'` para o patient |

### Detalhes

Em cada pagina, no topo do componente:
```
const { currentRole, currentUser } = useAuth();
const patientId = currentRole === 'patient' ? 'p1' : null;
const baseData = patientId ? mockData.filter(d => d.patientId === patientId) : mockData;
```

Usar `baseData` em vez do mock direto para todos os calculos (KPIs, filtros, tabelas).

Tambem ocultar colunas "Paciente" nas tabelas quando role = patient (ja que so ha um paciente).

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/contexts/AuthContext.tsx` | Adicionar `patientId` ao user patient |
| `src/pages/Consultas.tsx` | Filtrar por paciente quando role = patient |
| `src/pages/Exames.tsx` | Filtrar por paciente quando role = patient |
| `src/pages/Questionarios.tsx` | Filtrar por paciente quando role = patient |

