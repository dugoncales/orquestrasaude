

# Plano: BI Assistencial — 3 Camadas Completas

Reescrever `src/pages/BI.tsx` com dados derivados dos mocks existentes (patients, journeys, appointments, exams, tasks, questionnaires, parameter records) em vez de dados estáticos.

---

## Mudanças em `src/pages/BI.tsx`

### Operacional (7 KPIs + 2 gráficos)
- **KPIs**: Pacientes por etapa (distribuição), Consultas pendentes, Exames pendentes, Questionários pendentes, Faltosos (status "faltou"), SLA médio de retorno (dias sem retorno), Produtividade por profissional (consultas/profissional)
- **Gráfico 1**: BarChart — pacientes por etapa da jornada (10 etapas no eixo X, contagem no Y)
- **Gráfico 2**: BarChart horizontal — produtividade por profissional (nome no Y, consultas+tarefas no X)

### Clínico (8 KPIs + 3 gráficos)
- **KPIs**: % na meta HbA1c, % PA controlada, Perda ponderal média, % LDL na meta, PHQ-9 médio, ACT médio, PROMs respondidos, PREMs respondidos
- **Gráfico 1**: LineChart — evolução HbA1c ao longo do tempo (dados de parameterRecords)
- **Gráfico 2**: LineChart — evolução PHQ-9
- **Gráfico 3**: BarChart — % na meta por parâmetro (hba1c, pas, ldl, peso, phq9, act)

### Executivo (7 KPIs + 2 gráficos + 1 tabela)
- **KPIs**: Coortes ativas, Linhas mais ativas (por pacientes), Taxa de conclusão de jornada, Risco agregado (distribuição), Gargalos operacionais (etapa com mais atrasos), Desempenho por unidade, Prioridades de intervenção (pacientes críticos)
- **Gráfico 1**: AreaChart — conclusão de jornadas vs risco ao longo do tempo
- **Gráfico 2**: PieChart/BarChart — distribuição de risco (baixo/moderado/alto/crítico)
- **Tabela**: Top 5 prioridades de intervenção (paciente, risco, motivo)

### Computação de dados
- Importar todos os mocks e computar indicadores em tempo real com `useMemo`
- Derivar contagens, percentuais e médias dos dados existentes
- Usar `Legend` do Recharts para identificar séries

---

## Arquivo

| Arquivo | Ação |
|---|---|
| `src/pages/BI.tsx` | Reescrever — 3 tabs completas com dados derivados dos mocks |

