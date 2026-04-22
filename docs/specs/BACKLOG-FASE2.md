# CareJourney One — Backlog Fase 2 (Execução 1–2 dias)

## Escopo da Fase 2
Consolidar automações, tarefas multiprofissionais, ciclo PROM/PREM e dashboard profissional orientado a risco.

## Convenções
- **Estimativa:** 1d ou 2d
- **Tipo:** BE (backend), FE (frontend), DB (migração), QA (homologação)
- **Dependências:** IDs de tarefas que devem ser concluídas antes

---

## Sprint F2.1 — Fundação operacional

### CJ2-001 — Criar tabela `automation_events`
- **Tipo:** DB
- **Estimativa:** 1d
- **Dependências:** nenhuma
- **Descrição:** Persistir histórico de disparos de automação por paciente/regra.
- **Aceite (G/W/T):**
  - **Given** migration aplicada,
  - **When** um evento de automação for registrado,
  - **Then** deve persistir `rule_id`, `patient_id`, `severity`, `triggered_at`, `cooldown_until`, `status`, `payload_json`.

### CJ2-002 — Índices de consulta para automações
- **Tipo:** DB
- **Estimativa:** 1d
- **Dependências:** CJ2-001
- **Descrição:** Criar índices por `patient_id` e `rule_id + patient_id` para leitura rápida.
- **Aceite (G/W/T):**
  - **Given** tabela com 100k eventos,
  - **When** consultar últimos eventos por paciente,
  - **Then** tempo médio de consulta deve ficar dentro do SLO definido.

### CJ2-003 — Endpoint batch de avaliação de regras
- **Tipo:** BE
- **Estimativa:** 2d
- **Dependências:** CJ2-001, CJ2-002
- **Status:** em andamento (runtime app implementado em `src/lib/automation-engine.ts`)
- **Descrição:** Implementar endpoint/job para avaliar regras de automação por coorte.
- **Aceite (G/W/T):**
  - **Given** regras e contexto do paciente,
  - **When** rodar avaliação,
  - **Then** retornar `shouldTrigger` + `reasons` conforme runtime de automação.

### CJ2-004 — Persistir decisão de automação (disparou/não disparou)
- **Tipo:** BE
- **Estimativa:** 1d
- **Dependências:** CJ2-003
- **Status:** em andamento (persistência em `automation_events` integrada no app)
- **Descrição:** Persistir auditoria de decisão mesmo quando regra não dispara.
- **Aceite (G/W/T):**
  - **Given** execução de avaliação,
  - **When** a regra for processada,
  - **Then** evento de decisão deve ser gravado com rationale.

---

## Sprint F2.2 — PROM/PREM e tarefas

### CJ2-005 — Job diário de janelas PROM/PREM
- **Tipo:** BE
- **Estimativa:** 2d
- **Dependências:** CJ2-003
- **Descrição:** Gerar pendências por timepoint (baseline, 30d, 90d...).
- **Aceite (G/W/T):**
  - **Given** paciente elegível para timepoint,
  - **When** job diário rodar,
  - **Then** pendência PROM/PREM deve ser criada automaticamente.

### CJ2-006 — Criar tarefas multiprofissionais por gatilho
- **Tipo:** BE
- **Estimativa:** 2d
- **Dependências:** CJ2-005
- **Descrição:** Converter alertas/pedências em tarefas atribuíveis por papel.
- **Aceite (G/W/T):**
  - **Given** gatilho válido,
  - **When** regra disparar,
  - **Then** tarefa com responsável e prioridade deve ser criada.

### CJ2-007 — Anti-duplicidade de tarefas
- **Tipo:** BE
- **Estimativa:** 1d
- **Dependências:** CJ2-006
- **Descrição:** Evitar múltiplas tarefas idênticas no mesmo ciclo clínico.
- **Aceite (G/W/T):**
  - **Given** duas execuções consecutivas da mesma regra,
  - **When** tentativa de criar tarefa duplicada,
  - **Then** sistema deve reusar/ignorar conforme política.

### CJ2-008 — Endpoint "fila de ação" do profissional
- **Tipo:** BE
- **Estimativa:** 1d
- **Dependências:** CJ2-006, CJ2-007
- **Descrição:** Entregar payload único para dashboard profissional.
- **Aceite (G/W/T):**
  - **Given** profissional autenticado,
  - **When** abrir dashboard,
  - **Then** endpoint retorna pacientes prioritários + tarefas + alertas + pendências de questionário.

---

## Sprint F2.3 — Frontend operacional

### CJ2-009 — Card "Pacientes prioritários"
- **Tipo:** FE
- **Estimativa:** 1d
- **Dependências:** CJ2-008
- **Descrição:** Renderizar lista por score de risco com motivo da priorização.
- **Aceite (G/W/T):**
  - **Given** payload do endpoint,
  - **When** renderizar tela,
  - **Then** pacientes devem aparecer ordenados por prioridade.

### CJ2-010 — Card "Tarefas do dia"
- **Tipo:** FE
- **Estimativa:** 1d
- **Dependências:** CJ2-008
- **Descrição:** Exibir tarefas agrupadas por tipo/status.
- **Aceite (G/W/T):**
  - **Given** tarefas pendentes,
  - **When** abrir dashboard,
  - **Then** tarefas atrasadas devem estar destacadas.

### CJ2-011 — Centro de alertas explicável
- **Tipo:** FE
- **Estimativa:** 2d
- **Dependências:** CJ2-004, CJ2-008
- **Descrição:** Exibir severidade, origem da regra e rationale do disparo.
- **Aceite (G/W/T):**
  - **Given** alerta ativo,
  - **When** usuário abrir detalhe,
  - **Then** deve ver regra, condição e razão de disparo/bloqueio.

### CJ2-012 — Fechamento de ciclo (resolver alerta → tarefa)
- **Tipo:** FE
- **Estimativa:** 1d
- **Dependências:** CJ2-011
- **Descrição:** Fluxo assistencial com atualização de estado em tempo real.
- **Aceite (G/W/T):**
  - **Given** alerta aberto,
  - **When** profissional resolver,
  - **Then** tarefa e estado do alerta devem atualizar sem inconsistência.

---

## Sprint F2.4 — IA explicável e segurança

### CJ2-013 — Validar payload de insight no backend
- **Tipo:** BE
- **Estimativa:** 1d
- **Dependências:** nenhuma
- **Descrição:** Aplicar validação de governança de IA no pipeline de insights.
- **Aceite (G/W/T):**
  - **Given** insight sem campos obrigatórios,
  - **When** tentar persistir,
  - **Then** retornar erro estruturado.

### CJ2-014 — Exigir aprovação humana para high/critical
- **Tipo:** BE
- **Estimativa:** 1d
- **Dependências:** CJ2-013
- **Descrição:** Bloquear publicação assistencial de insight de alto risco sem aprovação.
- **Aceite (G/W/T):**
  - **Given** severidade `high` ou `critical`,
  - **When** `approvedBy`/`approvedAt` ausentes,
  - **Then** insight não pode ser publicado.

### CJ2-015 — Tela de revisão clínica de insights
- **Tipo:** FE
- **Estimativa:** 2d
- **Dependências:** CJ2-013, CJ2-014
- **Descrição:** Aprovação manual com exibição de evidências.
- **Aceite (G/W/T):**
  - **Given** insight pendente,
  - **When** revisor aprovar,
  - **Then** registrar aprovador/timestamp e liberar consumo assistencial.

---

## QA e Go-live

### CJ2-016 — Plano de homologação Fase 2
- **Tipo:** QA
- **Estimativa:** 1d
- **Dependências:** CJ2-009..CJ2-015
- **Descrição:** Executar suíte de validação por perfil (professional/manager/admin).
- **Aceite (G/W/T):**
  - **Given** ambiente de homologação,
  - **When** rodar casos críticos,
  - **Then** 0 bloqueio crítico aberto para go-live.

### CJ2-017 — Checklist de produção + rollback
- **Tipo:** QA/OPS
- **Estimativa:** 1d
- **Dependências:** CJ2-016
- **Descrição:** Script de rollout/rollback, monitoramento e critérios de parada.
- **Aceite (G/W/T):**
  - **Given** janela de deploy,
  - **When** publicar,
  - **Then** monitoramento e rollback devem estar prontos e validados.

---

## Priorização sugerida
- **Must-have para liberar Fase 2:** CJ2-001 → CJ2-008, CJ2-011, CJ2-013, CJ2-014, CJ2-016
- **Should-have:** CJ2-009, CJ2-010, CJ2-012, CJ2-015
- **Ops final:** CJ2-017
