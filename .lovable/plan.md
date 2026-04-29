# Plano: Tornar o app totalmente funcional (uso real)

Hoje o app já está conectado ao banco em quase tudo (leitura), mas várias **ações** ainda são botões decorativos, há dados **mock** em duas telas e o Editor No-Code **não persiste** as alterações. Este sprint fecha essas pontas em ordem de impacto clínico, deixando o app pronto para uso real ponta a ponta.

## Estado atual (o que já funciona)

- Leitura real: `Pacientes`, `Jornada Clínica`, `Perfil Paciente`, `Consultas`, `Exames`, `Questionários`, `BI`, `Linhas de Cuidado`, `Auditoria`, `IA Planilhas`, dashboards de profissional/paciente.
- Hooks de mutação já existem para: patients, appointments, exams, tasks, attachments, parameter_records, professionals, patient_assignments, journeys, clinical_extractions.
- IA de planilhas: extração + persistência + apply (alertas/orientações/parâmetros) já implementados.
- Auth + RLS + roles + audit_logs funcionando.

## O que ainda não é "uso real"

| Onde | Problema |
|---|---|
| `Pacientes` | Botão "Novo Paciente" sem ação |
| `Consultas` | "Nova Consulta", "Iniciar" sem ação |
| `Exames` | "Nova Solicitação", marcar resultado sem ação |
| `Questionários` | "Novo Questionário", responder sem ação |
| `JornadaClinica` | Botões de avançar etapa, registrar pendência, criar tarefa sem mutação |
| `PerfilPaciente` | Editar dados, registrar parâmetro, anexar arquivo sem ação |
| `EditorNoCode` | Edita só em memória — não salva no banco |
| `StudioAdmin` | `mockUsers`, `mockAudit`, `mockPermissionsMatrix` ainda em uso |
| `DashboardGestor` | `mockAIInsights` decorativo |
| `DashboardPaciente` | Falta CTA real (responder questionário, ver exame) |
| Hooks faltando | `useCreateCareLine` / Update / Delete (Editor depende disso); `useCreate/UpdateAlert`, `useCreateOrientacao`, `useCreateAutomationRule` (CRUD), `useUpdateUserRole` |

## Decisões de produto

| Tema | Escolha |
|---|---|
| Onde criar paciente / consulta / exame | Dialog modal na própria tela (não rota nova) — mais rápido pro fluxo clínico |
| Forms | `react-hook-form` + `zod`; reaproveita `Dialog`, `Form`, `Input`, `Select`, `Textarea` já no projeto |
| Permissão de ações | Botões só aparecem para roles autorizadas (admin/manager/professional vinculado) |
| Exclusão | Soft delete onde possível (status='inativo'); hard delete só admin |
| Editor No-Code | Botão "Salvar" explícito no header (evita salvar a cada tecla); detecta dirty state |
| Mocks | Substituir por dados reais; quando vazio, mostrar empty state com CTA |

## Sprints (5 entregas em ordem)

### Sprint 1 — CRUD essencial dos pacientes e jornadas
**Impacto: maior. Sem isso, nada flui.**
- `Pacientes`: dialog "Novo Paciente" (campos mínimos: nome, CPF, sexo, nascimento, telefone, convênio, unidade) → `useCreatePatient`. Validação Zod (CPF formato, datas).
- `PerfilPaciente`: botão "Editar" que abre o mesmo dialog em modo edição → `useUpdatePatient`. Inclui edição de diagnósticos, alergias, medicações, fatores de risco (chips editáveis).
- `PerfilPaciente`: card "Registrar parâmetro" → dialog com seleção de parâmetro (`parameterDictionary`), valor, data → `useCreateParameterRecord`. Ao salvar, recalcula `risk_level`/`score_risco` via função SQL nova `recalc_patient_risk(_patient_id)`.
- `PerfilPaciente`: card "Adicionar orientação" → `useCreateOrientacao` (novo).
- `JornadaClinica`: ações da etapa atual:
  - "Concluir etapa" → update step.status='concluido', incrementa `current_step_index`.
  - "Registrar pendência" → adiciona texto em `pendencias[]`.
  - "Criar tarefa" → dialog → `useCreateTask`.
  - "Agendar consulta da etapa" → `useCreateAppointment` com `journey_step_id` preenchido.

### Sprint 2 — CRUD de consultas, exames, questionários
- `Consultas`:
  - "Nova Consulta" → dialog (paciente, profissional, tipo, data, hora, linha) → `useCreateAppointment`.
  - "Iniciar" → `useUpdateAppointment` para status='realizada' + abrir dialog de "Registrar atendimento" (observações, parâmetros aferidos, próximas orientações).
  - "Cancelar/Reagendar" → menu por linha.
- `Exames`:
  - "Nova Solicitação" → dialog → `useCreateExam` (status='solicitado').
  - Linha do exame: "Registrar resultado" → dialog (data + valor textual + opcional anexo via `useUploadAttachment` → bucket `attachments`).
- `Questionários`:
  - "Novo Questionário" (admin/manager) → dialog cria `questionnaires` + permite adicionar `questionnaire_items` (perguntas).
  - "Enviar para paciente" → cria `questionnaire_responses` em status pendente.
  - "Responder" (paciente) → tela simples de preenchimento → calcula score → `useUpdateQuestionnaireResponse`.

### Sprint 3 — Editor No-Code persistente + Linhas de Cuidado
- Hook novo `useCareLines.ts` ganha `useCreateCareLine`, `useUpdateCareLine`, `useDeleteCareLine`.
- `EditorNoCode`:
  - Header: indicador "modificado" + botão "Salvar" (disabled se limpo). Salva a linha selecionada (upsert) e dispara invalidate.
  - Botão "+ Nova linha" cria no banco direto (não só local).
  - Botão "Excluir" pede confirmação e chama delete.
  - Toast de sucesso/erro com nome da linha.
- `LinhasDeCuidado`: usa o mesmo hook para refletir mudanças do editor sem refresh.
- Migration: triggers de audit também em `care_lines` (já cobre via padrão? validar e adicionar se faltar).

### Sprint 4 — StudioAdmin real (substituir mocks)
- Substituir `mockUsers` por `profiles` + `user_roles` + `professionals` reais (hook novo `useTeamMembers` que faz join). Já existe `TeamManagement`; estender pra:
  - Trocar role (admin only) → `useUpdateUserRole` (insert/delete em `user_roles`).
  - Convidar usuário (admin) → edge function `invite-user` que chama `auth.admin.inviteUserByEmail`.
  - Desativar (`professionals.ativo=false`).
- Substituir `mockAudit` pelo último `audit_logs` (já existe `useAuditLogs`).
- Substituir `mockPermissionsMatrix` por uma matriz **derivada** das RLS (estática, mas documentada num arquivo único `src/config/permissions.ts` que vira fonte da UI; deixar claro que é "visualização", a verdade está nas policies).
- Card de "Regras de automação": CRUD usando `useAutomationRules` + novos `useCreate/Update/DeleteAutomationRule`.

### Sprint 5 — Polimentos (DashboardGestor, DashboardPaciente, alertas)
- `DashboardGestor`: substituir `mockAIInsights` por insights derivados de dados reais (top linhas com pior aderência, top pacientes em atraso, # de extrações IA recentes não revisadas).
- `DashboardPaciente`:
  - Card "Próxima consulta" → primeiro `appointments` futuro do paciente.
  - Card "Questionários pendentes" com link pra responder.
  - Card "Últimos exames" com download via attachments.
- Página `/alertas` (não existe ainda): listagem global de `alerts`, filtros por severidade/lido, "marcar como lido" → `useUpdateAlert` (novo).
- Trigger SQL: quando `parameter_records` insere valor fora da meta da linha do paciente, criar `alerts` automaticamente (substitui automação manual por DB-side).

## Hooks novos a criar

```
useCreateOrientacao         (insert orientacoes)
useCreateCareLine, useUpdateCareLine, useDeleteCareLine
useCreate/Update/DeleteQuestionnaire + Items
useUpdateQuestionnaireResponse
useUploadAttachment         (storage + insert metadata)
useUpdateAlert, useCreateAlert (manual)
useCreate/Update/DeleteAutomationRule
useTeamMembers              (profiles ⨝ user_roles ⨝ professionals)
useUpdateUserRole           (admin only; revoga + adiciona)
useInviteUser               (chama edge fn)
```

## Migrations

```
recalc_patient_risk(_patient_id uuid)   -- function: recalcula risk_level a partir de parameter_records vs goals
audit_care_lines, audit_questionnaires, audit_automation_rules  -- triggers se faltarem
trigger_param_alert                       -- função + trigger em parameter_records que insere alerts quando fora da meta
```

## Edge functions

```
invite-user                 -- admin convida via email (auth.admin.inviteUserByEmail)
recalc-risk (opcional)      -- batch noturno; útil mas não bloqueante
```

## Arquivos impactados (lista resumida)

```
src/pages/Pacientes.tsx           (+ NewPatientDialog)
src/pages/PerfilPaciente.tsx      (+ EditPatientDialog, RegisterParamDialog, AddOrientacaoDialog)
src/pages/JornadaClinica.tsx      (+ ações da etapa, NewTaskDialog)
src/pages/Consultas.tsx           (+ NewAppointmentDialog, AppointmentRowMenu)
src/pages/Exames.tsx              (+ NewExamDialog, RegisterResultDialog)
src/pages/Questionarios.tsx       (+ NewQuestionnaireDialog, RespondDialog)
src/pages/EditorNoCode.tsx        (+ save bar, dirty state, delete confirm)
src/pages/StudioAdmin.tsx         (- mocks, + dados reais, AutomationRulesCRUD)
src/pages/DashboardGestor.tsx     (- mock, + insights derivados)
src/pages/DashboardPaciente.tsx   (CTAs reais)
src/pages/Alertas.tsx             (NOVA)
src/components/dialogs/*          (NOVOS — patient, appointment, exam, task, param, etc.)
src/hooks/useCareLines.ts         (+ mutations)
src/hooks/useOrientacoes.ts       (+ create)
src/hooks/useAlerts.ts            (+ update/create)
src/hooks/useAutomationRules.ts   (+ mutations)
src/hooks/useTeamMembers.ts       (NOVO)
src/hooks/useAttachments.ts       (+ upload)
src/config/permissions.ts         (NOVO — matriz visual)
supabase/migrations/*             (3 migrations)
supabase/functions/invite-user/   (NOVA)
```

## Risco / mitigação

| Risco | Mitigação |
|---|---|
| Forms grandes ficarem confusos | Cada dialog cobre 1 ação atômica; campos avançados em `<Collapsible>` |
| Mutations dispararem RLS errada | Cada hook usa o usuário autenticado; testar como `professional` sem vínculo no paciente |
| Recalcular risco a cada insert ficar lento | Função SQL leve + chamada apenas após insert/update do parâmetro |
| Convite por email exigir SMTP | Cair no fluxo padrão do Supabase Auth (usa a própria infra) |

## Ordem de execução recomendada

1. **Sprint 1** (pacientes + jornada) — desbloqueia o trabalho clínico real
2. **Sprint 2** (consultas/exames/questionários) — preenche a operação do dia a dia
3. **Sprint 3** (Editor + linhas) — gestores configuram o sistema
4. **Sprint 4** (Studio real) — sai do "modo demo"
5. **Sprint 5** (dashboards + alertas) — última camada de visibilidade

Cada sprint é entregável independentemente. Comece pelo Sprint 1; ao aprovar, sigo direto para implementação.

## Fora de escopo

- Calendário visual (drag-drop) de consultas
- Telemedicina embutida
- Push notifications
- Importação em lote de pacientes (já existe via planilha IA)
- Integração com sistemas externos (HL7/FHIR)
