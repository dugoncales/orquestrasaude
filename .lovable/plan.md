

# Jornada Clínica — Redesign Premium

A tela atual já tem a estrutura de 3 zonas mas é visualmente plana, com timeline apertada, cards pequenos e pouca hierarquia visual. O redesign transforma isso num painel de comando clínico premium com leitura instantânea.

---

## Mudanças

### 1. `JornadaClinica.tsx` — Reescrever completamente

**Zona A — Contexto do paciente** (topo)
- Header premium com avatar/iniciais do paciente, nome grande, idade calculada, diagnósticos como badges
- Risk semaphore mais proeminente com score numérico
- Linha de care lines ativas como tabs coloridas (já navega entre jornadas)
- Parâmetros fora da meta em cards individuais com ícone de alerta, valor atual vs meta, tendência (seta up/down)
- Alertas clínicos E operacionais separados visualmente (ícones diferentes, cores diferentes)
- Dias sem retorno como badge de urgência

**Zona B — Timeline interativa** (centro)
- Timeline horizontal com connector line contínua entre steps (não apenas chevrons)
- Steps como circles/nodes sobre a linha com cards expandidos abaixo
- Step atual com glow effect, animação pulse, e "ETAPA ATUAL" badge
- Steps concluídos com check verde, atrasados com borda vermelha pulsante
- Cada step card mostra: nome, responsável, prazo, contagem de itens vinculados (consultas/exames/tarefas)
- Click em qualquer step abre detalhes na Zona C (não apenas o atual)
- Progress bar geral da jornada no topo da timeline (ex: "6 de 10 etapas")

**Zona C — Painel de comando** (inferior, grid 2 colunas em desktop)
- **Coluna esquerda (2/3)**: Detalhes da etapa selecionada
  - Responsável + prazo em cards destacados
  - Pendências como lista com ícones tipados (exame, consulta, questionário, tarefa)
  - Consultas vinculadas com status chip e data
  - Exames vinculados com resultado quando disponível
  - Tarefas vinculadas com prioridade visual
  - Questionários pendentes da etapa
  - Botão "Avançar Etapa" grande e primário (com confirmação)
  - Botões secundários: Solicitar Exame, Agendar Retorno, Aplicar PROM
- **Coluna direita (1/3)**: 
  - Metas da linha ativa com GoalProgress
  - Próximo passo com preview do que vem a seguir
  - Mini-resumo: total pendências, dias na etapa atual

**Multi-linha integrada**
- Tabs coloridas por linha de cuidado no topo (já existe, melhorar visual)
- Badge de pendências em cada tab (ex: "Diabetes (3 pendências)")
- Visão consolidada: card "Resumo Geral" mostrando todas as linhas do paciente com etapa atual de cada uma

### 2. `ActionPanel.tsx` — Expandir

- Adicionar seção de questionários vinculados (filtrar `mockQuestionnaireResponses` pelo `careLineId`)
- Botão "Avançar Etapa" com ícone ChevronRight, estilo primário, tamanho grande
- Adicionar contagem de dias na etapa (calcular a partir do prazo)
- Separar alertas clínicos e operacionais do paciente filtrados para a etapa

### 3. `GoalProgress.tsx` — Enriquecer

- Adicionar prop `showTrend` com seta indicando tendência (usar `mockParameterRecords` para calcular)
- Visual mais premium: gradiente na barra de progresso

### 4. Novo componente: `JourneyProgressBar.tsx`
- Barra horizontal mostrando progresso geral da jornada (X de Y etapas concluídas)
- Segmentada por status (verde = concluído, azul = em andamento, cinza = não iniciado, vermelho = atrasado)

### 5. Novo componente: `MultiLineOverview.tsx`
- Card compacto mostrando todas as jornadas ativas do paciente
- Para cada linha: nome, etapa atual, principal pendência, principal parâmetro fora da meta
- Útil para pacientes multipatológicos como Maria (diabetes + HAS + obesidade)

### 6. Mock data — Adicionar questionários vinculados às etapas
- Enriquecer `mockQuestionnaireResponses` com `journeyStepId`
- Adicionar campo `questionariosVinculados` ao tipo `JourneyStep`

---

## Resultado esperado

Uma tela que em 3 segundos responde:
- Onde está o paciente? (timeline com "ETAPA ATUAL")
- O que está pendente? (pendências tipadas com contagem)
- Quem precisa agir? (responsável destacado)
- Qual o próximo passo? (card de próximo passo)
- O que está fora da meta? (parâmetros em vermelho com tendência)

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/JornadaClinica.tsx` | Reescrever — premium command center |
| `src/components/shared/ActionPanel.tsx` | Expandir — questionários, avançar etapa |
| `src/components/shared/GoalProgress.tsx` | Adicionar tendência |
| `src/components/shared/JourneyProgressBar.tsx` | Novo — barra de progresso segmentada |
| `src/components/shared/MultiLineOverview.tsx` | Novo — resumo multi-linha |
| `src/data/types.ts` | Adicionar `questionariosVinculados` em JourneyStep |
| `src/data/mock-data.ts` | Vincular questionários às etapas |

