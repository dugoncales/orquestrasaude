

# CareJourney One 3.0 — Plano de Implementação

O projeto atual possui apenas o design system (tema escuro, Plus Jakarta Sans, status chips) e componentes UI base. Toda a estrutura de páginas, navegação, dados e lógica precisa ser construída.

Dado o tamanho do JSON (14 páginas, 4 perfis, 6 linhas de cuidado, motores de automação, BI, IA, no-code builder), a implementação será dividida em fases incrementais. Esta primeira entrega cobre a **fundação funcional completa** — layout, navegação, dados mock, e todas as páginas principais com componentes visuais.

---

## Fase 1 — Fundação (esta entrega)

### 1. Dados e tipos (src/data/)
- `types.ts` — Interfaces TypeScript para Patient, CareLine, Journey, JourneyStep, Appointment, Exam, Task, Alert, ParameterRecord, Questionnaire, AutomationRule, etc.
- `care-lines.ts` — As 6 linhas de cuidado do JSON (Diabetes, Hipertensão, Obesidade, Dislipidemia, Saúde Mental, Asma) com parâmetros, PROMs e PREMs
- `parameters.ts` — Dicionário de parâmetros clínicos (31 itens)
- `mock-patients.ts` — 8-10 pacientes fictícios com dados administrativos, clínicos, linhas ativas, jornadas em diferentes etapas
- `mock-data.ts` — Consultas, exames, tarefas, alertas, respostas de questionários

### 2. Contexto de autenticação simulado (src/contexts/)
- `AuthContext.tsx` — Provider com role switching (patient/professional/manager/admin) via seletor no header, sem backend real. Controla qual dashboard e menu é exibido.

### 3. Layout principal (src/components/layout/)
- `AppLayout.tsx` — SidebarProvider + Header + Main content
- `AppSidebar.tsx` — Sidebar fixa com menu dinâmico por role (itens do JSON: Dashboard, Pacientes, Jornadas, Linhas de Cuidado, Consultas, Exames, Questionários, BI, IA, Editor No-Code, Configurações). Ícones Lucide.
- `AppHeader.tsx` — Logo "CareJourney One", role switcher, notificações, avatar

### 4. Páginas — Dashboards por perfil (src/pages/)
- `DashboardPaciente.tsx` — Card boas-vindas, resumo jornada, próximos passos, próxima consulta, exames pendentes, questionários pendentes, metas clínicas, orientações, timeline simplificada
- `DashboardProfissional.tsx` — Pacientes prioritários, tarefas do dia, consultas do dia, faltosos, pendências clínicas/operacionais, funil de jornadas
- `DashboardGestor.tsx` — KPIs executivos (cards numéricos), gargalos, tempo entre etapas, pacientes por linha, produtividade, taxa de adesão, coortes prioritárias

### 5. Páginas — Core clínico
- `Pacientes.tsx` — Lista com busca, filtros, tabela com tags de linhas, score de risco (semáforo), status operacional
- `PerfilPaciente.tsx` — Dados admin + resumo clínico + diagnósticos + medicações + fatores de risco + linhas ativas + metas + timeline longitudinal
- `JornadaClinica.tsx` — **Tela central**: Timeline interativa horizontal com cards por etapa (10 etapas default), status visual (não iniciado/em andamento/concluído/atrasado/bloqueado), responsável, prazo, pendências, próximo passo, botões de ação
- `LinhasDeCuidado.tsx` — Catálogo com cards das 6 linhas, indicadores por linha, botões criar/editar/duplicar

### 6. Páginas — Operacional
- `Consultas.tsx` — Agenda visual (calendário), lista de consultas, status, registro de falta, reagendamento
- `Exames.tsx` — Lista de solicitações, resultados, pendências, alertas de atraso
- `Questionarios.tsx` — PROMs e PREMs: lista, status de resposta, score automático, histórico longitudinal

### 7. Páginas — Inteligência
- `BI.tsx` — 3 abas (Operacional, Clínico, Executivo) com cards de métricas e gráficos usando recharts. Filtros por período/linha/unidade/profissional
- `IAplanilhas.tsx` — Upload de arquivo, preview da base, mapeamento de colunas, análise por paciente/coorte, alertas, score de prioridade, racional do insight (tudo visual com dados mock)

### 8. Páginas — Administração
- `EditorNoCode.tsx` — Builder visual com blocos arrastáveis: etapas, parâmetros, questionários, regras, alertas, indicadores. Preview da jornada.
- `StudioAdmin.tsx` — Gestão de usuários, permissões, módulos ativos, auditoria, configurações globais

### 9. Roteamento (src/App.tsx)
- 14 rotas correspondentes às páginas do JSON
- Redirecionamento da "/" para o dashboard correto baseado no role ativo

---

## Componentes reutilizáveis criados

| Componente | Uso |
|---|---|
| `KPICard` | Cards numéricos nos dashboards |
| `StatusChip` | Chips de status em tabelas/cards |
| `TimelineStep` | Etapas da jornada clínica |
| `CareLineCard` | Card de linha de cuidado |
| `PatientRow` | Linha da tabela de pacientes |
| `RiskSemaphore` | Semáforo de risco (verde/amarelo/vermelho) |
| `TaskCard` | Card de tarefa multiprofissional |
| `AlertBanner` | Alertas clínicos e operacionais |
| `ParameterChart` | Gráfico de evolução de parâmetro |
| `PromsPremsScore` | Visualização de score de questionário |

---

## Decisões técnicas

- **Sem backend**: Todos os dados são mock em arquivos TypeScript. A estrutura está pronta para conectar a Supabase futuramente.
- **Recharts** para gráficos no BI e evolução de parâmetros
- **Lucide React** para ícones em toda a plataforma
- **React Router** para navegação entre as 14 páginas
- **Dados mock realistas** com pacientes em diferentes estágios de jornada para demonstrar o fluxo completo

---

## Estimativa de arquivos

~30 arquivos novos (4 data, 1 context, 3 layout, 14 pages, ~10 components reutilizáveis)

