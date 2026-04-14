
# Plano: Dashboard Profissional — Cockpit Assistencial Premium

O dashboard atual tem a estrutura certa (KPIs, pacientes prioritários, pendências, funil) mas falta: consultas do dia, tarefas do dia como seção dedicada, separação de alertas clínicos vs operacionais, atalhos de registro rápido, e hierarquia visual premium.

---

## Mudanças

### 1. `DashboardProfissional.tsx` — Reescrever completamente

**Header com saudação contextual**
- "Bom dia, Dra. Ana Beatriz" com data atual
- Resumo inline: "5 pacientes precisam de atenção · 3 consultas hoje · 2 alertas críticos"

**KPIs refinados** (grid 2x2 mobile, 4 colunas desktop)
- Precisam de Ação (fora da meta)
- Consultas Hoje (agendadas para hoje)
- Tarefas do Dia (prazo = hoje ou atrasadas)
- Faltosos (busca ativa pendente)

**Alertas separados por tipo** (2 colunas: clínicos à esquerda, operacionais à direita)
- Clínicos: ícone de coração/estetoscópio, borda vermelha
- Operacionais: ícone de engrenagem, borda amarela
- Cada alerta com nome do paciente clicável → navega ao perfil

**Agenda do dia** (nova seção)
- Cards por consulta agendada para hoje com: horário, paciente, tipo, linha de cuidado
- Status chip (agendada, realizada)
- Click → navega ao perfil do paciente
- Formato timeline vertical com horários

**Pacientes prioritários** (manter e refinar)
- Ordenados por score de risco
- Cada row: semáforo + nome + etapa atual + parâmetros fora da meta como badges
- Click → navega à jornada do paciente (não apenas perfil)

**Tarefas do dia** (nova seção dedicada)
- Filtrar tarefas com prazo = hoje ou atrasadas
- Cards com: paciente, descrição, prioridade (badge colorido), prazo
- Checkbox visual para marcar como concluída (mock toggle)

**Faltosos recentes** (nova seção)
- Lista de pacientes que faltaram, com data da falta e botão "Busca Ativa"
- Badge de dias desde a falta

**Atalhos de registro rápido** (barra fixa no topo ou seção destacada)
- Botões: "Registrar Consulta", "Solicitar Exame", "Criar Tarefa", "Aplicar PROM"
- Ícones + labels, estilo ghost/outline, clicáveis (toast de "em breve" por enquanto)

**Funil de jornadas** (manter, mover para sidebar ou seção inferior)
- Já existe via JourneyFunnel, manter compact

### 2. Layout geral
- Grid responsivo: mobile single column, desktop 2-3 colunas
- Seções com títulos claros e ícones
- Cards com hover states e transições suaves

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/DashboardProfissional.tsx` | Reescrever — cockpit completo |

Nenhum arquivo de dados precisa mudar — todos os mocks já suportam as funcionalidades (consultas com data/hora, tarefas com prazo, alertas com tipo, faltosos).
