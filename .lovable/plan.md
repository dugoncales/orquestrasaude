

# Plano: Refinar a Plataforma para Foco Assistencial

O problema atual: as telas existem mas funcionam como módulos desconectados, sem contexto assistencial integrado. A Jornada Clínica mostra etapas genéricas sem vincular pendências reais, parâmetros fora da meta ou ações necessárias. Os dashboards são listas estáticas. Falta a "cola" que transforma dados em decisão clínica.

---

## 1. Jornada Clínica como Tela Central (reescrever `JornadaClinica.tsx`)

A tela atual é um timeline horizontal genérico. Será transformada em um **painel de comando da jornada** com 3 zonas:

**Zona A — Contexto do paciente** (topo)
- Nome, risco, diagnósticos ativos, linhas ativas (tabs para alternar entre jornadas do mesmo paciente)
- Parâmetros fora da meta destacados em vermelho (ex: "HbA1c 7.9% — meta < 7%")
- Alertas clínicos ativos inline

**Zona B — Timeline interativa** (centro)
- Timeline horizontal mantida, mas cada card de etapa agora mostra: consultas vinculadas, exames pendentes, tarefas abertas daquela etapa
- Etapa atual expandida automaticamente com painel lateral detalhado
- Indicação visual clara: "Você está aqui" com seta/destaque forte
- Próximo passo com botão de ação ("Agendar retorno", "Solicitar exame")

**Zona C — Painel de ação da etapa atual** (inferior ou lateral)
- Quem precisa agir (responsável + prazo)
- O que está pendente (lista de pendências com tipo: exame, consulta, questionário, tarefa)
- Parâmetros relevantes da etapa com último valor e tendência
- Ações rápidas: marcar como concluído, registrar pendência, solicitar exame

## 2. Mock Data Enriquecido (`mock-data.ts`)

- Adicionar pendências variadas por etapa (não apenas "Aguardando resultado de exame" genérico)
- Vincular consultas, exames e tarefas a etapas específicas da jornada (campo `journeyStepId`)
- Adicionar metas por paciente/linha (ex: `{ field: 'hba1c', target: 7, operator: '<' }`)
- Parâmetros com valores recentes para comparação com metas

## 3. Dashboard Profissional — Cockpit Orientado à Ação (reescrever `DashboardProfissional.tsx`)

Substituir as listas estáticas por painéis de decisão:

- **"Quem precisa de mim agora"**: pacientes com parâmetros fora da meta + próxima etapa pendente, ordenados por urgência
- **"Pendências que travam jornadas"**: exames atrasados, consultas sem retorno, questionários vencidos — com link direto à jornada
- **Mini-funil visual**: quantos pacientes em cada etapa, com destaque nos gargalos (etapas com muitos pacientes parados)
- Cada item clicável leva direto à jornada do paciente

## 4. Dashboard Paciente — Orientado ao Próximo Passo (refinar `DashboardPaciente.tsx`)

- Destaque principal: "Seu próximo passo é X" com explicação simples
- Metas com barra de progresso visual (não apenas texto)
- Timeline vertical simplificada mostrando apenas 3 etapas: anterior, atual, próxima
- Alertas em linguagem acessível ("Seu exame HbA1c está acima da meta — converse com sua médica")

## 5. Dashboard Gestor — Gargalos e Coortes (refinar `DashboardGestor.tsx`)

- **Funil de jornadas**: gráfico de funil mostrando quantos pacientes em cada etapa (todas as linhas agregadas)
- **Gargalos**: etapas com tempo médio acima do SLA, destacadas em vermelho
- **Coortes prioritárias**: tabela com pacientes de maior risco agrupados por linha, com score e dias sem retorno
- KPIs: % em meta por parâmetro principal (HbA1c < 7%, PA < 130/80)

## 6. Perfil do Paciente — Visão Longitudinal Integrada (refinar `PerfilPaciente.tsx`)

- Seção "Situação Atual": cards por linha ativa mostrando etapa atual + principal parâmetro fora da meta + pendência mais urgente
- Gráficos de evolução por parâmetro com linha de meta horizontal (reference line)
- Timeline unificada de eventos (consultas + exames + mudanças de etapa) em ordem cronológica

## 7. Tipos Atualizados (`types.ts`)

- Adicionar `PatientGoal` (field, target, operator, careLineId)
- Adicionar `journeyStepId` opcional em Appointment, Exam, Task
- Adicionar `consultasVinculadas`, `examesVinculados`, `tarefasVinculadas` em JourneyStep

---

## Arquivos modificados

| Arquivo | Ação |
|---|---|
| `src/data/types.ts` | Adicionar PatientGoal, enrichir JourneyStep |
| `src/data/mock-data.ts` | Pendências variadas, metas, vínculos etapa-tarefa |
| `src/data/mock-patients.ts` | Adicionar metas por paciente |
| `src/pages/JornadaClinica.tsx` | Reescrever completamente — 3 zonas |
| `src/pages/DashboardProfissional.tsx` | Reescrever — cockpit de decisão |
| `src/pages/DashboardPaciente.tsx` | Refinar — foco no próximo passo |
| `src/pages/DashboardGestor.tsx` | Refinar — funil + gargalos |
| `src/pages/PerfilPaciente.tsx` | Refinar — situação atual por linha |
| `src/components/shared/GoalProgress.tsx` | Novo — barra de progresso de meta |
| `src/components/shared/ActionPanel.tsx` | Novo — painel de ações da etapa |
| `src/components/shared/JourneyFunnel.tsx` | Novo — funil visual de etapas |

