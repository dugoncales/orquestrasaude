

# Plano: Linhas de Cuidado — Exportação, Filtros e Pacientes Prioritários

Adicionar funcionalidades operacionais ao módulo existente de Linhas de Cuidado.

---

## Mudanças em `src/pages/LinhasDeCuidado.tsx`

### 1. Barra de filtros no header
- **Filtro por linha**: dropdown multi-select com as 6 linhas (filtra o grid de cards)
- **Filtro por período**: dropdown com opções "Último mês", "3 meses", "6 meses", "12 meses" (visual — afeta labels de KPIs)
- Filtros aparecem entre o header e o grid

### 2. Botão de exportação
- Botão "Exportar" ao lado de "Nova Linha"
- Gera CSV com dados consolidados das linhas visíveis (nome, pacientes, adesão, metas, automações ativas)
- Download via `Blob` + `URL.createObjectURL`

### 3. Seção "Pacientes Prioritários" na visão por linha
- Abaixo do grid de cards, nova seção com tabela/cards dos pacientes com maior risco
- Mostra pacientes ordenados por `scoreRisco` descendente
- Cada card: nome, score (badge semáforo), linhas ativas (badges coloridas), metas fora do alvo, dias sem retorno
- Filtro por linha aplicado (se filtro ativo, mostra só pacientes daquela linha)
- Limite: top 10 pacientes

### 4. No CareLineDetail — aba de pacientes
- Adicionar tab "Pacientes" no detalhe da linha
- Lista pacientes com `linhasAtivas` incluindo aquela linha
- Ordenados por risco, com metas fora do alvo destacadas

---

## Arquivo

| Arquivo | Ação |
|---|---|
| `src/pages/LinhasDeCuidado.tsx` | Adicionar filtros, exportação e seção de pacientes prioritários |

