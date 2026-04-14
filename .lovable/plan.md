

# Plano: Clinical Insight AI — Módulo Completo de Análise de Planilhas

O `IAplanilhas.tsx` atual é um mock simples com upload fake e 2 tabs básicas. Reescrever completamente com fluxo multi-etapas, preview de dados, validação, mapeamento de colunas e insights ricos.

---

## Mudanças

### 1. `src/pages/IAplanilhas.tsx` — Reescrever completamente

**Fluxo em 4 etapas (stepper visual)**

**Etapa 1 — Upload**
- Drag & drop zone para XLSX/CSV
- Aceita `<input type="file" accept=".xlsx,.csv">`
- Parse real com SheetJS (xlsx) — já disponível ou instalar
- Ao carregar, extrai headers e primeiras linhas
- Exibe: nome do arquivo, registros, colunas, tamanho

**Etapa 2 — Preview & Mapeamento**
- Tabela scrollável com primeiras 10 linhas dos dados
- Mapeamento automático de colunas: detecta campos como "Nome", "CPF", "HbA1c", "PA", "IMC", "PHQ-9", etc. por nome/padrão
- Cada coluna mostra: nome original → campo mapeado (dropdown editável)
- Badges verdes para mapeamentos automáticos, amarelos para sugeridos, cinza para não mapeados

**Etapa 3 — Validação & Qualidade**
- Score geral de qualidade dos dados (0-100) com barra visual
- Lista de problemas encontrados:
  - Campos obrigatórios faltantes (nome, CPF)
  - Valores fora de range (HbA1c > 20, PA negativa)
  - Registros duplicados
  - Campos vazios por coluna (% completude)
- Tabela com completude por coluna (barra de progresso)
- Botão "Prosseguir com X registros válidos"

**Etapa 4 — Insights (3 sub-tabs)**

Sub-tab **Por Paciente**:
- Cards expandidos por paciente com:
  - Score de prioridade (0-100) com cor semáforo
  - Parâmetros fora da meta (lista com valor atual vs meta)
  - Risco clínico identificado (badge + texto explicativo)
  - Risco operacional (dias sem retorno, PROMs pendentes)
  - Sinais de não adesão (faltou consulta, sem exame, valores piorando)
  - **Racional**: texto explicando POR QUE foi priorizado
  - **Próximos passos**: sugestões assistenciais concretas
- Filtro por prioridade (crítico/alto/moderado/baixo)
- Ordenação por score

Sub-tab **Por Coorte**:
- KPIs agregados: % fora da meta, % sem retorno, % com risco alto, média de adesão
- Tabela de indicadores por linha de cuidado
- Distribuição de risco (barras horizontais)
- Top 5 problemas mais frequentes

Sub-tab **Qualidade dos Dados**:
- Resumo da validação (da etapa 3, persistido)
- Detalhamento por campo com sugestões de correção

**Toda análise é mock/client-side** — sem backend. Os dados são parseados localmente e cruzados com regras hardcoded (metas das careLines, ranges válidos, etc.).

### 2. Dependência: `xlsx` (SheetJS)

Instalar `xlsx` para parse real de arquivos XLSX/CSV no browser.

### 3. Mock analysis engine

Criar funções utilitárias em `src/lib/clinical-analysis.ts`:
- `mapColumns(headers: string[])` — mapeamento automático por padrão
- `validateData(rows, mapping)` — validação de qualidade
- `analyzePatient(row, mapping, careLines)` — gera insight por paciente
- `analyzeCohort(rows, mapping)` — gera insight agregado
- Score de prioridade baseado em: parâmetros fora da meta (peso 40%), dias sem retorno (peso 20%), sinais de não adesão (peso 20%), risco clínico (peso 20%)

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/IAplanilhas.tsx` | Reescrever — fluxo multi-etapas completo |
| `src/lib/clinical-analysis.ts` | Novo — engine de análise e mapeamento |
| `package.json` | Adicionar `xlsx` |

