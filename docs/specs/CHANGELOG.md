# CareJourney One — Changelog de Versões

## v3.1.5 (2026-04-22)
- **schema_version:** `3.1.5`
- **status:** `draft`
- **updated_at:** `2026-04-22`
- **owner_team:** `Produto + Clinical Ops + Engenharia`
- **mudanças principais:**
  - Hook `useProfessionalActionQueue` criado para consolidar fila de ação do profissional.
  - Dashboard profissional refatorado para usar fonte única de agenda/tarefas/alertas/faltosos.
  - Base preparada para evolução de CJ2-008 (payload único para cockpit assistencial).

## v3.1.4 (2026-04-22)
- **schema_version:** `3.1.4`
- **status:** `draft`
- **updated_at:** `2026-04-22`
- **owner_team:** `Produto + Clinical Ops + Engenharia`
- **mudanças principais:**
  - Serviço `automation-engine` criado para avaliar e persistir decisões em `automation_events`.
  - Fluxo cobre cenário de disparo e supressão com rationale em `payload_json`.
  - Backlog Fase 2 atualizado marcando CJ2-003/CJ2-004 em andamento.

## v3.1.3 (2026-04-22)
- **schema_version:** `3.1.3`
- **status:** `draft`
- **updated_at:** `2026-04-22`
- **owner_team:** `Produto + Clinical Ops + Engenharia`
- **mudanças principais:**
  - Migration Fase 2 criada para `automation_events`.
  - Índices adicionados para leitura por paciente e por regra/paciente.
  - Políticas RLS definidas para leitura/inserção do time assistencial e update por admin.

## v3.1.2 (2026-04-22)
- **schema_version:** `3.1.2`
- **status:** `draft`
- **updated_at:** `2026-04-22`
- **owner_team:** `Produto + Clinical Ops + Engenharia`
- **mudanças principais:**
  - Backlog técnico da Fase 2 formalizado com tarefas CJ2-001..CJ2-017.
  - Critérios de aceite em formato Given/When/Then por item.
  - Dependências, estimativas e priorização Must-have/Should-have.

## v3.1.1 (2026-04-22)
- **schema_version:** `3.1.1`
- **status:** `draft`
- **updated_at:** `2026-04-22`
- **owner_team:** `Produto + Clinical Ops + Engenharia`
- **mudanças principais:**
  - Runtime de automações adicionado em `src/domain/carejourney/automation.ts`.
  - Validação de governança de IA adicionada em `src/domain/carejourney/ai-governance.ts`.
  - Testes de automação/IA em `src/test/carejourney-automation.test.ts`.

## v3.1.0 (2026-04-22)
- **schema_version:** `3.1.0`
- **status:** `draft`
- **updated_at:** `2026-04-22`
- **owner_team:** `Produto + Clinical Ops + Engenharia`
- **mudanças principais:**
  - Padronização de RBAC por recurso/ação.
  - Definição de state machines de jornada, tarefa e alerta.
  - Contrato de automações com severidade, cooldown e qualidade mínima de dado.
  - Governança de IA com campos de auditoria (`model_version`, `input_snapshot_id`, `confidence_score`, `evidence_fields`).
  - Dicionário de métricas BI com fórmula, granularidade, frequência e dono.

## Política de versionamento
- **MAJOR:** mudanças incompatíveis de contrato.
- **MINOR:** novos blocos/recursos compatíveis.
- **PATCH:** ajustes semânticos/documentais e correções.
