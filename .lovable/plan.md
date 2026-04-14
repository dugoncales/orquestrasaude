

# Plano: Módulo Linhas de Cuidado — Configuração Completa por Patologia

O `LinhasDeCuidado.tsx` atual é um grid simples de cards. O `CareLine` type só tem parâmetros, PROMs, PREMs e contadores. Precisamos expandir o modelo de dados e criar uma interface rica de detalhamento por linha, com todas as dimensões clínicas e operacionais solicitadas.

---

## Mudanças

### 1. `src/data/types.ts` — Expandir `CareLine`

Adicionar ao tipo `CareLine`:
- `criteriosInclusao: string[]` — critérios clínicos para entrada na linha
- `criteriosSaida: string[]` — critérios para alta/saída
- `metas: { parametro: string; operador: string; valor: number; unidade: string }[]` — metas clínicas da linha
- `tarefasPadrao: { nome: string; responsavel: string; etapa: string; compartilhada?: boolean }[]` — tarefas padrão (flag compartilhada para evitar duplicidade cross-linha)
- `examesPadrao: { nome: string; frequencia: string; etapa: string }[]` — exames esperados
- `automacoes: { condicao: string; acao: string; ativa: boolean }[]` — regras de automação da linha
- `alertas: { condicao: string; severidade: 'warning' | 'critical'; mensagem: string }[]` — alertas configurados

### 2. `src/data/care-lines.ts` — Dados completos por linha

Preencher as 6 linhas com todos os campos:

- **Diabetes**: critérios (HbA1c ≥ 6.5%, glicemia ≥ 126, etc.), metas (HbA1c < 7%, LDL < 100, etc.), exames (HbA1c trimestral, fundoscopia anual, etc.), tarefas (contagem de carbo, avaliação de pés, etc.), automações e alertas específicos
- **Hipertensão**: critérios (PAS ≥ 140 ou PAD ≥ 90), metas (PA < 130/80), exames (creatinina, MAPA), tarefas (aferição domiciliar, adesão medicamentosa)
- **Obesidade**: critérios (IMC ≥ 30), metas (perda ≥ 5% peso), exames (perfil metabólico), tarefas (diário alimentar, avaliação bariátrica se IMC > 40)
- **Dislipidemia**: critérios (LDL > 160 ou risco CV alto), metas (LDL < 100 ou < 70 se alto risco), exames (perfil lipídico semestral)
- **Saúde Mental**: critérios (PHQ-9 ≥ 10 ou GAD-7 ≥ 10), metas (PHQ-9 < 5, WHO-5 > 50), exames/escalas, tarefas (psicoterapia, monitoramento de crise)
- **Asma**: critérios (ACT < 20 ou uso de resgate > 2x/sem), metas (ACT ≥ 20, zero exacerbações), exames (espirometria), tarefas (técnica inalatória, plano de ação)

Tarefas compartilhadas entre linhas (ex: "Aferição de peso", "Avaliação de adesão") marcadas com `compartilhada: true` para deduplicação na visão integrada.

### 3. `src/pages/LinhasDeCuidado.tsx` — Reescrever completamente

**Header**
- Título "Linhas de Cuidado" com contagem
- Toggle "Visão por Linha" / "Visão Integrada do Paciente"
- Botão "Nova Linha"

**Visão por Linha** (padrão)
- Grid de cards por linha (atual, melhorado)
- Click no card → expande drawer/seção detalhada com tabs internas:
  - **Resumo**: KPIs da linha (pacientes, adesão, fora da meta)
  - **Critérios**: inclusão e saída com badges
  - **Parâmetros & Metas**: tabela com parâmetro, meta, unidade, operador
  - **Tarefas**: lista de tarefas padrão com etapa vinculada e badge "compartilhada" quando aplicável
  - **Exames**: lista de exames padrão com frequência
  - **PROMs/PREMs**: cards com nome e tipo
  - **Automações**: condição → ação, toggle ativo
  - **Alertas**: condição, severidade, mensagem

**Visão Integrada do Paciente** (novo)
- Seletor de paciente (dropdown com pacientes que têm múltiplas linhas ativas)
- Mostra todas as linhas ativas do paciente lado a lado
- Destaca tarefas compartilhadas (aparece uma vez, vinculada a múltiplas linhas)
- Mostra parâmetros que se sobrepõem entre linhas (ex: peso compartilhado entre Diabetes/Obesidade)
- Metas consolidadas com indicador de qual linha define cada meta

### 4. Rota — Adicionar sub-rota de detalhe

Adicionar rota `/linhas-de-cuidado/:id` para acesso direto ao detalhe da linha (opcional, pode ser modal/drawer).

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/data/types.ts` | Expandir `CareLine` com novos campos |
| `src/data/care-lines.ts` | Dados completos para 6 linhas |
| `src/pages/LinhasDeCuidado.tsx` | Reescrever — grid + detalhe expandido + visão integrada |
| `src/App.tsx` | Adicionar rota `/linhas-de-cuidado/:id` (se sub-rota) |

