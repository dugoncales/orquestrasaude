# CareJourney One — Processo de Aprovação Clínica e Técnica

## Objetivo
Garantir que mudanças de contrato (produto/dados/regras) tenham validação multidisciplinar antes de publicação.

## Etapas obrigatórias
1. **Proposta (Produto)**
   - Atualizar `carejourney-one.v3.1.json` e `CHANGELOG.md`.
   - Indicar impacto em RBAC, automações, BI e IA.

2. **Revisão Clínica (Clinical Ops)**
   - Validar segurança assistencial e risco de alert fatigue.
   - Validar metas, parâmetros e janelas temporais.

3. **Revisão Técnica (Engenharia)**
   - Validar viabilidade de implementação e migrações.
   - Validar impacto de performance e compatibilidade.

4. **Aprovação Final (Produto + Clínica + Engenharia)**
   - Marcar status da versão (`draft` → `approved`).
   - Registrar aprovadores e data no changelog da versão.

5. **Publicação**
   - Executar rollout faseado (Fase 1, 2, 3).
   - Monitorar KPIs/SLOs pós-publicação.

## Critérios de bloqueio
- Mudança sem revisão clínica.
- Mudança com quebra de contrato sem incremento MAJOR.
- Mudança de automação sem política de severidade/cooldown.
