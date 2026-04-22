# Orquestra Care

**Plataforma premium para gestão longitudinal de jornadas clínicas.**

Orquestra Care orquestra o cuidado ao paciente ao longo do tempo: mostra **onde o paciente está** na jornada, **o que está pendente**, **quem deve agir**, **qual o próximo passo** e **quais parâmetros estão fora da meta**. Não é prontuário eletrônico nem agenda genérica — é o painel central de operação clínica longitudinal.

---

## Stack

- **Frontend:** React 18 + Vite 5 + TypeScript 5
- **Estilo:** Tailwind CSS v3 + shadcn/ui (tema escuro premium)
- **Roteamento:** React Router 6
- **Estado de servidor:** TanStack Query (React Query)
- **Backend:** Lovable Cloud (Supabase gerenciado — PostgreSQL + Auth + Storage + Edge Functions)
- **Gráficos:** Recharts
- **Ícones:** Lucide React

---

## Variáveis de ambiente

O arquivo `.env` é gerado automaticamente pelo Lovable Cloud. **Não edite manualmente.**

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL da instância de backend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon) — segura para o cliente |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto |

### Flags opcionais

| Variável | Default | Descrição |
|---|---|---|
| `VITE_ENABLE_ROLE_SWITCHER` | `false` | Quando `true`, exibe o seletor de perfil (paciente/profissional/gestor/admin) no header. Útil para demos e desenvolvimento; **não habilitar em produção**. |

---

## Como rodar localmente

```bash
npm install
npm run dev
```

O servidor sobe em `http://localhost:8080`.

### Outros comandos

```bash
npm run build       # build de produção
npm run preview     # preview do build
npm run test        # roda Vitest
npm run lint        # lint do projeto
```

---

## Como publicar

1. Abra o projeto no [Lovable](https://lovable.dev).
2. Clique em **Publish** no canto superior direito.
3. A URL pública fica disponível imediatamente em `<seu-projeto>.lovable.app`.
4. Para domínio customizado, use **Project Settings → Domains**.

---

## Roles (perfis de acesso)

A aplicação tem 4 perfis. Cada um vê um dashboard e um menu lateral diferente.

| Role | Visão principal |
|---|---|
| `patient` | Sua jornada, próximas consultas, exames pendentes, questionários, orientações da equipe. |
| `professional` | Carteira de pacientes, agenda do dia, tarefas pendentes, alertas clínicos, jornada clínica detalhada. |
| `manager` | Visão agregada: produtividade, KPIs por linha de cuidado, BI assistencial, IA de planilhas. |
| `admin` | Studio de configuração: linhas de cuidado, automações, permissões, editor no-code. |

> ⚠️ A autenticação real (Supabase Auth + tabela `profiles` + `user_roles`) está prevista para a próxima sprint. Hoje o `AuthContext` é mockado e a troca de perfil é feita via flag de desenvolvimento (ver acima).

---

## Visão do schema do banco

13 tabelas no schema `public`:

### Núcleo clínico
- **`patients`** — cadastro do paciente, diagnósticos, medicações, fatores de risco, score de risco, metas (`goals` JSON), linhas ativas.
- **`care_lines`** — linhas de cuidado (DM2, HAS, Obesidade, etc.), critérios de inclusão/saída, parâmetros clínicos, metas, alertas, automações, indicadores de BI.
- **`journeys`** — instâncias de uma linha de cuidado para um paciente. Tem `current_step_index`.
- **`journey_steps`** — etapas de uma jornada (ordenadas por `step_order`), com pendências, prazos e responsável.

### Agenda e produção
- **`appointments`** — consultas (vinculadas a paciente, etapa de jornada e linha de cuidado).
- **`exams`** — exames solicitados/realizados.
- **`tasks`** — tarefas operacionais e clínicas (com prioridade e prazo).

### Engajamento
- **`questionnaires`** — definição de questionários (PROMs/PREMs).
- **`questionnaire_responses`** — respostas com score.
- **`orientacoes`** — orientações textuais da equipe ao paciente.

### Telemetria clínica
- **`parameter_records`** — séries temporais de parâmetros clínicos (PA, glicemia, peso, HbA1c, etc.) usadas para calcular tendência e desvio de meta.

### Operação
- **`alerts`** — alertas clínicos/operacionais com severidade.
- **`automation_rules`** — regras de automação por linha de cuidado.

### Relações principais
```
patients 1—N journeys N—1 care_lines
journeys 1—N journey_steps
patients 1—N { appointments, exams, tasks, parameter_records, questionnaire_responses, alerts, orientacoes }
care_lines 1—N { journeys, appointments, exams, tasks, questionnaires, automation_rules }
journey_steps 1—N { appointments, exams, tasks }  (vínculo opcional)
```

> Os tipos TypeScript do schema vivem em `src/integrations/supabase/types.ts` (auto-gerado, **não editar**). Os hooks de acesso ficam em `src/hooks/use*.ts`. Helpers de mapeamento snake_case → camelCase em `src/lib/db-helpers.ts`.

---

## Roadmap (próximas sprints)

- **Sprint 2:** Auth real (Supabase Auth + `profiles` + `user_roles`), proteção de rotas, redirect para login.
- **Sprint 3:** Refatoração do `DashboardPaciente` removendo dependências mockadas; orientações reais.
- **Sprint 4:** Hooks com filtro server-side (`useAppointments(patientId)`, `useTodayAppointments`, etc.); revisão `id` vs `slug` em care lines.
- **Sprint 5:** RLS por role, audit logs, anexos (laudos/exames), melhorias de escala.
