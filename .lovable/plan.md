# Plano: Pendências do Sprint 5

Fechar os dois itens marcados como "pendente" do Sprint 5.

---

## 1. Gestão de equipe no `StudioAdmin`

Hoje a aba "Usuários" mostra `mockUsers` hardcoded. Substituir/complementar por uma aba "Equipe" real, com dados de `professionals` + `patient_assignments`.

### Novo componente `src/components/admin/TeamManagement.tsx`

- Tabela de profissionais (`useProfessionals`):
  - Avatar/iniciais, nome, especialidade, registro (CRM/COREN)
  - Contagem de pacientes vinculados (de `usePatientAssignments`)
  - Status ativo/inativo (toggle via `useUpdateProfessional`)
  - Busca por nome/especialidade/registro
- Botão **"Vínculos"** por linha → abre `Dialog`:
  - Lista de pacientes já vinculados, com `papel` (responsavel/apoio/observador) e botão remover
  - `Select` de paciente disponível + `Select` de papel + botão "Vincular"
  - Usa `useCreateAssignment` / `useDeleteAssignment`
  - Estado vazio acolhedor: "Nenhum paciente vinculado. Profissional não vê pacientes até receber vínculos."

### Atualização em `src/pages/StudioAdmin.tsx`

- Adicionar aba **"Equipe"** entre "Usuários" e "Permissões"
- Renderizar `<TeamManagement />` dentro
- Manter aba "Usuários" como está (mock) por enquanto — futuro: lista real via `profiles` + `user_roles`

---

## 2. Anexos na `JornadaClinica`

Hoje só `PerfilPaciente` tem `<AttachmentList>`. Adicionar na Zona C da jornada para que o profissional anexe documentos diretamente à etapa atual (laudo de exame, receita do step etc.).

### Edição em `src/pages/JornadaClinica.tsx`

Na coluna direita da Zona C (`lg:col-span-4`), adicionar novo Card "Anexos da etapa":
- Título com ícone `Paperclip` e nome do step ativo
- `<AttachmentList patientId={patient.id} relatedJourneyStepId={activeStep.id} compact />`
- O componente já lista TODOS os anexos do paciente (não filtra por step) — uploads feitos por aqui ficam vinculados ao step via `related_journey_step_id`, útil para auditoria

Posicionar após o card "Resumo Rápido".

---

## Arquivos editados / criados

| Arquivo | Mudança |
|---|---|
| `src/components/admin/TeamManagement.tsx` | **novo** — tabela + dialog de vínculos |
| `src/pages/StudioAdmin.tsx` | nova aba "Equipe" |
| `src/pages/JornadaClinica.tsx` | card de anexos na Zona C |

## Fora de escopo

- Substituir mockUsers por `profiles` reais (precisa view ou função SECURITY DEFINER porque profiles RLS só permite ver o próprio)
- UI de "responder questionário" usando `questionnaire_items`
- Edge functions / cron de automação real
