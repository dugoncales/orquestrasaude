# CareJourney One v3.1 — Checklist de Execucao

## Objetivo
Transformar o JSON de produto em contrato executavel para backend, frontend, dados e operacao clinica.

## Bloco 1 — Governanca
- [x] Definir `schema_version`, `status`, `updated_at`, `owner_team` por release.
- [x] Publicar changelog por versao.
- [x] Definir processo de aprovacao clinica e tecnica.

## Bloco 2 — Seguranca e Perfis
- [x] Implementar RBAC por recurso/acao.
- [x] Cobrir regras por testes automatizados.
- [x] Ativar trilha de auditoria para alteracoes sensiveis.

## Bloco 3 — Jornada Longitudinal
- [x] Implementar state machine de jornada.
- [x] Implementar state machine de tarefas.
- [x] Implementar state machine de alertas.
- [x] Definir SLO para transicao entre etapas.

## Bloco 4 — Regras e Automacoes
- [x] Adicionar severidade e cooldown em todas as regras.
- [x] Definir janela temporal de analise por regra.
- [x] Exigir qualidade minima de dado para disparo.
- [x] Definir validacao humana para casos high/critical.

## Bloco 5 — IA Explicavel
- [x] Registrar `model_version`, `input_snapshot_id`, `confidence_score`.
- [x] Exibir `evidence_fields` no insight.
- [x] Guardar aprovacao humana e timestamp.
- [x] Bloquear acao automatica sem explicacao.

## Bloco 6 — BI com Semantica Unica
- [x] Criar dicionario oficial de metricas.
- [x] Definir dono e frequencia de cada KPI.
- [x] Alinhar formulas entre produto e operacao.

## Bloco 7 — Go-live faseado
- [x] Fase 1 (4-6 semanas): fundacao, RBAC, jornada, 2 linhas piloto.
- [x] Fase 2 (4-8 semanas): automacoes, tarefas multiprofissionais, PROM/PREM.
- [x] Fase 3 (6-10 semanas): BI completo, no-code versionado, IA auditavel.
