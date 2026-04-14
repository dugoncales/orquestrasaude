

# Plano: Dashboard Gestor — Centro de Comando Executivo-Operacional

O dashboard atual tem 4 KPIs, funil, gráfico de metas, pacientes por linha e coortes prioritárias. Falta: produtividade por profissional, tempo médio entre etapas, gargalos operacionais detalhados, faltosos/adesão por linha, e insights de IA. Reescrever completamente.

---

## Mudanças

### 1. `DashboardGestor.tsx` — Reescrever completamente

**Header executivo**
- Título "Centro de Comando" com data
- Resumo: "X pacientes · Y fora da meta · Z alertas críticos · W faltosos"

**KPIs executivos** (grid 2x2 mobile, 5 colunas desktop)
- Total Pacientes (com trend)
- Fora da Meta (com % do total)
- Taxa Adesão Média (com trend)
- Faltosos (30 dias)
- Tempo Médio na Etapa Atual (dias)

**Grid principal 2 colunas desktop**

**Coluna esquerda:**

1. **Produtividade por Profissional** (novo)
   - Tabela: profissional, pacientes ativos, consultas realizadas (mês), tarefas concluídas, tarefas pendentes
   - Barra visual de carga de trabalho
   - Dados calculados a partir de `mockAppointments`, `mockTasks`, `mockJourneys`

2. **Gargalos Operacionais** (novo, expandido)
   - Funil de jornadas (já existe via `JourneyFunnel`)
   - Abaixo: lista dos 3 maiores gargalos com etapa, tempo médio vs SLA, contagem de pacientes retidos
   - Visual: badges vermelhos para etapas acima do SLA

3. **Tempo Médio entre Etapas** (novo)
   - BarChart horizontal: cada etapa com tempo médio (mock) vs SLA (referência)
   - Barras vermelhas quando acima do SLA, verdes quando dentro

**Coluna direita:**

4. **Pacientes por Linha + Adesão** (refinar)
   - BarChart agrupado: pacientes (azul) + adesão % (verde) por linha
   - Ou tabela compacta com mini spark bars

5. **% em Meta** (manter, refinar visual)
   - Barras horizontais com referência de 70%

6. **Coortes Prioritárias** (manter, refinar)
   - Top 5 pacientes por risco, com parâmetros fora da meta e dias sem retorno
   - Click → navega à jornada

7. **Insights Agregados da IA** (novo)
   - Card com 3-4 insights mock gerados como se viessem de IA
   - Exemplos: "38% dos pacientes de Diabetes estão com HbA1c acima da meta — considerar intensificação terapêutica em grupo", "Etapa 'Seguimento' concentra 45% dos atrasos — revisar SLA", "3 pacientes críticos sem retorno há mais de 20 dias"
   - Ícone de sparkles/brain, visual diferenciado (borda gradient ou background sutil)
   - Label "Insights CareJourney AI" com badge "beta"

---

## Dados mock adicionais

Adicionar ao `mock-data.ts`:
- `mockAIInsights`: array com 4 insights textuais mock (tipo, mensagem, severidade)
- Produtividade será calculada in-component a partir dos mocks existentes

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/DashboardGestor.tsx` | Reescrever — centro de comando completo |
| `src/data/mock-data.ts` | Adicionar `mockAIInsights` |

