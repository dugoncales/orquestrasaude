

# Plano: Editor No-Code de Linhas de Cuidado — Builder Profissional

O `EditorNoCode.tsx` atual e um mock estático com lista de blocos e preview fixo. Reescrever completamente como um builder interativo com gestao completa de linhas de cuidado.

---

## Arquitetura

Layout em 3 paineis: **sidebar de linhas** (lista/criar/duplicar) + **area central com tabs de configuracao** + **preview da jornada** (colapsavel).

---

## Mudancas

### 1. `src/pages/EditorNoCode.tsx` — Reescrever completamente

**Sidebar esquerda (painel de linhas)**
- Lista das 6 linhas existentes (de `careLines`) com icone e cor
- Botao "Nova Linha" — cria linha em branco com campos vazios
- Botao "Duplicar" em cada linha — clona dados da linha selecionada
- Click seleciona a linha para edicao
- Linha selecionada destacada

**Area central — 10 tabs de configuracao**
Cada tab edita uma dimensao da `CareLine` selecionada:

1. **Geral**: nome, icone (selector), cor (color picker simples)
2. **Etapas da Jornada**: lista editavel de etapas (adicionar, remover, reordenar) — usa `defaultSteps` como template
3. **Criterios**: inclusao e saida — listas editaveis com input + botao adicionar
4. **Parametros Clinicos**: lista editavel de parametros vinculados a linha
5. **Metas**: tabela editavel com parametro, operador (dropdown), valor, unidade
6. **PROMs/PREMs**: listas separadas, editaveis — adicionar/remover itens
7. **Tarefas**: lista com nome, responsavel, etapa, toggle compartilhada
8. **Exames**: lista com nome, frequencia, etapa
9. **Automacoes**: lista com condicao (text), acao (text), toggle ativo
10. **Alertas**: lista com condicao, severidade (dropdown warning/critical), mensagem

Cada tab com layout limpo: titulo, descricao curta, lista de itens com acoes inline (editar/remover), botao "Adicionar" no final.

**Painel direito — Preview da Jornada**
- Preview visual das etapas configuradas (vertical, com numeracao)
- Indicadores resumidos: total de metas, tarefas, exames, automacoes ativas, alertas
- Colapsavel para dar mais espaco a area central
- Badge de contagem por secao

**Indicadores de BI** (tab 10 — bonus)
- Nao existe no tipo atual. Adicionar campo `indicadoresBI: { nome: string; formula: string; tipo: string }[]` ao tipo CareLine em `types.ts`
- Tab permite definir indicadores customizados por linha

**Estado local**
- Tudo gerenciado com `useState` — nao persiste (mock)
- Inicializa com copia dos dados de `careLines`
- Edicoes atualizam estado local imediatamente
- Toast de confirmacao em acoes (salvar, duplicar, deletar)

### 2. `src/data/types.ts` — Adicionar campo

Adicionar ao `CareLine`:
- `indicadoresBI?: { nome: string; formula: string; tipo: string }[]`

---

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/EditorNoCode.tsx` | Reescrever — builder completo com 3 paineis e 10 tabs |
| `src/data/types.ts` | Adicionar `indicadoresBI` ao `CareLine` |

