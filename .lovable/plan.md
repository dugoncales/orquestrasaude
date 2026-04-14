

# Plano: Studio Admin — Plataforma No-Code Profissional

O `StudioAdmin` atual é uma tela simples com 3 tabs (usuários, auditoria, configurações genéricas). O `EditorNoCode` existe separado mas é básico. Vamos unificar tudo numa experiência de studio profissional com tabs ricas cobrindo todas as áreas de configuração.

---

## Mudanças

### 1. `StudioAdmin.tsx` — Reescrever completamente

**Header**
- "CareJourney Studio" com subtítulo "Configuração e administração da plataforma"
- KPIs: Usuários ativos, Linhas de Cuidado, Regras de Automação, Parâmetros Clínicos

**Tabs principais** (8 tabs com scroll horizontal no mobile)

1. **Usuários** (refinar)
   - Tabela existente melhorada com: avatar/iniciais, role badge colorido (admin/manager/professional/patient), status ativo/inativo toggle
   - Botão "Novo Usuário" com toast

2. **Permissões** (novo)
   - Matriz visual: roles × módulos (Dashboard, Pacientes, Jornadas, BI, etc.)
   - Checkboxes ou ícones de check/x por célula
   - Mock estático — visual de controle de acesso

3. **Linhas de Cuidado** (absorver EditorNoCode)
   - Cards por linha: nome, ícone, cor, contagem de pacientes, adesão média
   - Click expande para ver: etapas da jornada padrão, parâmetros vinculados, questionários vinculados
   - Botão "Nova Linha" com toast
   - Dados vindos de `careLines` e `defaultSteps`

4. **Etapas da Jornada** (novo)
   - Lista ordenada das 10 etapas padrão com drag-handle visual (GripVertical)
   - Cada etapa mostra: nome, SLA (mock), responsável padrão
   - Botão "Nova Etapa" com toast

5. **Parâmetros Clínicos** (novo)
   - Tabela com todos os parâmetros do `parameterDictionary`
   - Colunas: campo, label, tipo, unidade, grupo
   - Filtro por grupo (laboratorial, medidas, sinais_vitais, questionário, etc.)
   - Badge colorido por grupo

6. **Questionários** (novo)
   - Lista de PROMs e PREMs por linha de cuidado
   - Dados extraídos de `careLines[].proms` e `careLines[].prems`
   - Cards com: nome, tipo (PROM/PREM), linha vinculada

7. **Alertas e Automações** (novo)
   - Mock de regras de automação: condição → ação
   - Exemplos: "Se HbA1c > 9% → criar tarefa urgente", "Se faltou consulta → gerar busca ativa"
   - Toggle ativo/inativo por regra
   - Dados do tipo `AutomationRule` já existente em types

8. **Auditoria** (manter, mover para última tab)
   - Tabela existente de log de auditoria

### 2. `mock-data.ts` — Adicionar dados mock

- `mockAutomationRules`: 5 regras de automação com condição, ações, status ativo
- `mockPermissionsMatrix`: objeto role → módulos permitidos

### 3. `EditorNoCode.tsx` — Manter como está
A funcionalidade será absorvida pela tab "Linhas de Cuidado" no Studio, mas a rota `/editor` continua existindo para acesso direto.

### 4. Sidebar admin — Simplificar
Remover "Configurações" duplicada do menu admin; "Studio" (rota `/`) já cobre tudo.

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/StudioAdmin.tsx` | Reescrever — studio completo com 8 tabs |
| `src/data/mock-data.ts` | Adicionar `mockAutomationRules`, `mockPermissionsMatrix` |
| `src/components/layout/AppSidebar.tsx` | Remover item "Configurações" do menu admin |

