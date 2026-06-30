## Objetivo
Tornar a ativação de uma linha de cuidado uma ação clínica completa: ao marcar a linha, o sistema obriga preencher o **indicador-chave** (HbA1c em diabetes, IMC/peso em obesidade, PA em HAS, PHQ-9/GAD-7 em saúde mental, perfil lipídico em dislipidemia, ACT em asma, etc.), registra a **data de entrada** com a primeira consulta e abre o próximo agendamento. Na timeline, cada evento pendente/ativo vira clicável para tratamento direto da pendência.

## Mudanças por área

### 1. Cadastro do paciente — `PatientFormDialog`
- Ao marcar uma linha de cuidado, expandir um bloco "Indicadores iniciais — {linha}" com inputs para os parâmetros das `metas` daquela linha (mapeando label da meta → `field` do `parameterDictionary`).
- Campos: valor atual + data da medição (default = hoje). PA aparece como dois campos (PAS/PAD). PHQ-9/GAD-7 como score inteiro.
- Validação: ao salvar, exigir pelo menos o **indicador-chave principal** preenchido por linha ativa:
  - diabetes → HbA1c
  - hipertensao → PAS+PAD
  - obesidade → peso + altura → IMC (calcular)
  - dislipidemia → LDL
  - saude_mental → PHQ-9 (ou GAD-7)
  - asma → ACT
- Novo campo "Data de entrada" (default hoje) e "Data da primeira consulta" (opcional). Se preenchida, agenda automaticamente a primeira consulta (`appointments`) vinculada à linha.
- Persistência: ao salvar paciente, gravar em paralelo:
  - `patients.goals` recalculado (merge das metas das linhas ativas, currentValue = valor digitado).
  - `parameter_records` (uma linha por indicador inicial).
  - `patients.data_entrada`.
  - `appointments` da primeira consulta se data preenchida.

### 2. Indicador-chave visível no card da linha — `PerfilPaciente`
- No card "Situação por Linha de Cuidado", mostrar o **indicador-chave** com valor atual, meta e status (dentro/fora). Botão "+ Registrar" abre `RegisterParameterDialog` já pré-selecionado com o `field` chave.

### 3. Timeline clicável — `PerfilPaciente`
Cada item da timeline vira `<button>` com handler por tipo:
- **tarefa** → abre `TaskFormDialog` em modo edit para concluir/atualizar.
- **consulta** pendente/agendada → abre `AppointmentFormDialog` em modo edit (marcar realizada, reagendar, cancelar).
- **exame** sem resultado → abre `ExamResultDialog`; com resultado → abre `ExamFormDialog`.
- **alerta** → abre painel lateral com ação rápida: marcar como lido, criar tarefa, registrar parâmetro relacionado.
- Adicionar hover/focus visuais e `aria-label`.

### 4. Próximo agendamento sugerido
Após salvar consulta como "realizada" ou registrar resultado de exame, abrir confirmação "Agendar próximo retorno?" sugerindo:
- diabetes: 3 meses se HbA1c≥meta, 6 meses se na meta.
- hipertensao: 1 mês se PA fora, 3 meses se na meta.
- obesidade: 1 mês.
- dislipidemia: 3 meses se fora, 6 meses se na meta.
- saude_mental: 2 semanas se PHQ-9≥10, 1 mês se 5-9, 3 meses se <5.
- asma: 1 mês se ACT<20, 3 meses se ≥20.
Confirmar grava novo `appointment` (status agendada) vinculado à linha e profissional padrão.

### 5. Helpers/dados
- `src/lib/care-line-config.ts` (novo): mapa por slug com `keyIndicators[]` (lista de `field`), `nextAppointmentDays(value, meta)` e label do indicador-chave.
- `src/lib/db-helpers.ts`: função `metasToGoals(careLine, values)` que converte `CareLineMeta[]` em `PatientGoal[]` preenchidos, resolvendo `label → field` via `parameterDictionary`.

## Arquivos a tocar
- `src/components/dialogs/PatientFormDialog.tsx` — bloco de indicadores iniciais + data de entrada + primeira consulta.
- `src/lib/care-line-config.ts` — novo.
- `src/lib/db-helpers.ts` — `metasToGoals`, `labelToField`.
- `src/pages/PerfilPaciente.tsx` — cards de linha com indicador-chave, timeline clicável.
- `src/components/dialogs/AppointmentFormDialog.tsx` — após salvar como "realizada", disparar sugestão de próximo retorno.
- `src/components/dialogs/ExamResultDialog.tsx` — idem após registrar resultado.
- `src/components/dialogs/NextAppointmentSuggestionDialog.tsx` — novo, reutilizável.

## Fora do escopo (próximo sprint)
- Edição em massa de metas.
- Editor visual de cadências por linha (hoje fica em `care-line-config.ts`, ajustável no Studio depois).
- Notificações externas (já mapeadas no Sprint 6).
