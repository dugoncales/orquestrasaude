
# Plano: Aprimorar IAplanilhas — extração inteligente de texto clínico livre

Hoje a tela `IAplanilhas` só consegue analisar dados quando estão em **colunas estruturadas** (uma coluna por parâmetro: `hba1c`, `pas`, `phq9`, etc.). Funciona bem pra planilhas operacionais limpas, mas falha quando o dado clínico está **misturado dentro de uma coluna de texto** — o caso real de "Anotações", "Evolução", "Observações", "Resumo da consulta", "Resultado do exame".

Esse sprint adiciona uma **camada de extração via Lovable AI** que lê esses campos texto e produz, por paciente:
- Parâmetros clínicos extraídos (HbA1c, PA, IMC, escores) com valor + data + fonte (qual coluna/linha)
- Resumo executivo do estado clínico (3-5 linhas)
- Highlights — os 3-5 fatos mais relevantes (resultado de exame fora da meta, sintoma novo, evento adverso, queixa importante)
- Bandeiras vermelhas (red flags clínicas)
- Próximos passos sugeridos baseados no que foi extraído

## Decisões de produto

| Tema | Escolha |
|---|---|
| Modelo | `google/gemini-3-flash-preview` (default — rápido + barato, multimodal). Permite override pra `gemini-2.5-pro` em "modo profundo". |
| Quando rodar IA | **Etapa 4 nova** ("Extração IA"), opcional, após a Etapa 3 (Insights baseados em colunas). Usuário decide se ativa. |
| Quais colunas processar | Auto-detecção de colunas com texto longo (>120 chars médios) + override manual com checkboxes. Default: marca colunas mapeadas como `anotacoes`, `evolucao`, `observacoes`, `resultado`, `resumo`. |
| Limite de linhas por execução | 50 pacientes/batch (configurável). Pra planilhas maiores: barra de progresso, 1 paciente por chamada, com retry e backoff. |
| Custo / rate limit | Surface em toast: 402 = sem créditos; 429 = throttling. Botão "Pausar/Retomar". |
| Persistência | Resultado fica em memória (estado React). Sem salvar no backend nesta sprint — mantém escopo. |

## 1. Schema de campo novo no mapeamento

`MAPPED_FIELD_OPTIONS` ganha:
- `anotacoes` — texto livre clínico
- `evolucao` — evolução SOAP / progresso
- `observacoes` — observações gerais
- `resumo_consulta` — resumo de consulta
- `resultado_exame` — laudo / resultado de exame em texto

Em `KNOWN_FIELDS` (`src/lib/clinical-analysis.ts`), padrões pra auto-mapeamento:
```ts
anotacoes: ['anotacoes', 'anotações', 'notas', 'notes', 'observacao_clinica'],
evolucao: ['evolucao', 'evolução', 'progresso', 'soap', 'historia'],
observacoes: ['observacoes', 'observações', 'obs', 'remarks'],
resumo_consulta: ['resumo', 'resumo_consulta', 'sumario', 'sumário'],
resultado_exame: ['resultado', 'laudo', 'result', 'descricao_exame', 'descrição_laudo'],
```

## 2. Edge Function `clinical-extract`

`supabase/functions/clinical-extract/index.ts`. Rotas:

### POST `/clinical-extract`
Body:
```ts
{
  patientName: string,
  fields: Record<string, string>,   // { anotacoes: "...", evolucao: "..." }
  structuredData?: Record<string, unknown>, // dados que JÁ vieram estruturados (HbA1c, PAS, etc.) pra IA não duplicar
  model?: string,                   // default google/gemini-3-flash-preview
}
```

Response (estruturado via tool calling — sem JSON.parse frágil):
```ts
{
  summary: string,                  // 3-5 linhas
  highlights: Array<{
    text: string,                   // "HbA1c 9,8% identificada na evolução de 12/03"
    category: 'exame' | 'sintoma' | 'evento_adverso' | 'medicacao' | 'queixa' | 'outro',
    severity: 'critico' | 'alto' | 'moderado' | 'baixo',
  }>,
  extractedParams: Array<{
    field: 'hba1c' | 'glicemia' | 'pas' | 'pad' | 'imc' | 'peso' | 'ldl' | 'hdl' | 'phq9' | 'gad7' | 'act' | 'creatinina' | 'albuminuria' | 'outro',
    fieldOther?: string,            // quando field='outro'
    value: number | string,
    unit?: string,
    date?: string,                  // ISO se identificável
    source: string,                 // qual campo de texto / qual trecho ("anotacoes: 'HbA1c=9,8 em 12/03'")
    confidence: 'alta' | 'media' | 'baixa',
  }>,
  redFlags: string[],               // ex: "Menção a dor torácica não investigada"
  suggestedNextSteps: string[],
  notes: string[],                  // ambiguidades, dados conflitantes
}
```

Implementação:
- Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`).
- **Tool calling** com schema acima (pattern recomendado em `extracting-structured-output`).
- System prompt: especialista em registro clínico em PT-BR. Regras: não inventar valores, citar fonte exata, marcar `confidence: 'baixa'` quando ambíguo.
- Streaming desligado (resposta única estruturada).
- Tratamento 429 (rate limit) → retorno 429 com `{ error, retryAfter }`. 402 → 402 com mensagem clara.
- CORS headers + `verify_jwt = false` (paciente nem login pra usar — mas tela exige login no app).

### POST `/clinical-extract-batch` (alternativa)
Mesmo schema mas aceita array. Processa sequencial no servidor com `await Promise.allSettled` em chunks de 5.
**Decisão**: começar só com endpoint singular + chamadas paralelas controladas no client (3 simultâneas). Mais simples e dá controle de progresso fino. Batch endpoint fica pra sprint futuro se virar gargalo.

## 3. Hook `useClinicalExtraction`

`src/hooks/useClinicalExtraction.ts`:
```ts
export function useClinicalExtraction() {
  const [progress, setProgress] = useState({ done: 0, total: 0, status: 'idle' });
  const [results, setResults] = useState<Map<number, ClinicalExtraction>>(new Map());

  const run = async (
    rows: Record<string, unknown>[],
    mapping: ColumnMapping[],
    textColumns: string[],          // colunas a processar
    options: { model?: string; concurrency?: number; signal?: AbortSignal }
  ) => { /* paralelo controlado, atualiza Map e progress */ };

  const cancel = () => { /* abort */ };

  return { run, cancel, progress, results };
}
```

- Concurrency = 3.
- Cada chamada vira `supabase.functions.invoke('clinical-extract', { body })`.
- Guarda `signal` pra cancelamento.

## 4. Nova etapa "Extração IA" na UI

`src/pages/IAplanilhas.tsx`:

### 4.1 Stepper ganha 5ª etapa
`STEPS = ['Upload', 'Mapeamento', 'Validação', 'Insights', 'Extração IA']`

### 4.2 Botão "Aprofundar com IA" no fim da Etapa 3
Aparece se houver pelo menos 1 coluna mapeada como texto clínico (`anotacoes` / `evolucao` / `observacoes` / `resumo_consulta` / `resultado_exame`) **OU** colunas de texto detectadas com média >120 chars não mapeadas.

### 4.3 Tela da etapa 4
- **Cabeçalho**: contador "Processando 12/45 pacientes" + ProgressBar + botões Pausar/Cancelar.
- **Painel de configuração** (collapsible):
  - Checkbox por coluna candidata ("Incluir esta coluna na extração")
  - Select de modelo: Flash (rápido) / Pro (mais preciso)
  - Slider/select de quantidade: "Processar primeiros N" (default 50, max = total)
  - Botão "Iniciar Extração"
- **Feedback de erro de quota** (402) ou rate limit (429) — toast + estado preserva o que já foi processado.
- **Lista de resultados por paciente** (mesma estética dos cards de Insights): expansível mostrando:
  - **Resumo executivo** (texto narrativo)
  - **Highlights** (badges coloridos por severidade + categoria)
  - **Parâmetros extraídos do texto** (tabela: parâmetro / valor / unidade / data / fonte / confiança)
  - **Red flags** (lista vermelha)
  - **Próximos passos** (lista verde, mesmo padrão da etapa 3)
  - **Notas/ambiguidades** (lista cinza)
- **Botão "Mesclar com Insights estruturados"**: cria entrada agregada que combina `outOfTarget` da etapa 3 + `extractedParams` da etapa 4. (Sem persistir no backend.)

### 4.4 Integração com etapa 3
Os parâmetros extraídos com `confidence: 'alta'` aparecem com badge "via IA" na visão de paciente da etapa 3 (Insight expandido). Não modificam o `priorityScore` automaticamente nesta sprint — só sinalizam que existem.

## 5. Prompt da IA (rascunho)

```
Você é um especialista em registro clínico de prontuário em português brasileiro.
Recebe campos de texto de um paciente (anotações, evolução, etc.) e deve:

1. Extrair parâmetros clínicos QUANTITATIVOS mencionados no texto
   (HbA1c, glicemia, PA sistólica/diastólica, IMC, peso, LDL/HDL,
   creatinina, albuminúria, escores PHQ-9/GAD-7/ACT).
   - Sempre cite o trecho fonte exato (≤80 chars).
   - Marque confidence='baixa' se valor está ambíguo, indireto ou
     sem unidade explícita.
   - Inclua data se mencionada (formato ISO).

2. Identificar HIGHLIGHTS — fatos clinicamente relevantes:
   resultados de exame fora da meta, sintomas novos (dor torácica,
   dispneia, sangramento, perda de peso involuntária), eventos
   adversos a medicações, queixas com impacto funcional, hospitalização
   recente, suspensão de tratamento.

3. Identificar RED FLAGS — sinais que exigem ação imediata
   (crise hipertensiva, ideação suicida, dor torácica anginosa,
   sintomas neurológicos focais, sangramento ativo, etc.).

4. Resumo executivo de 3-5 linhas: estado clínico atual,
   tendência (melhora/piora/estável), pontos de atenção.

5. Próximos passos sugeridos (3-5 itens, acionáveis pelo profissional).

NÃO invente valores. NÃO infira diagnósticos não escritos.
Se um campo estiver vazio ou irrelevante, retorne arrays vazios.

Dados do paciente:
- Nome: {nome}
- Dados estruturados já conhecidos (não duplique): {structuredData}
- Campos texto:
  {fields como blocos rotulados}
```

## 6. Custos & avisos ao usuário

Banner discreto na etapa 4 antes de iniciar:
> "Esta análise usa IA generativa e consome créditos do workspace. ~$0,001 por paciente no modelo Flash. Para 100 pacientes ≈ $0,10."
> (números aproximados — usar valores reais de tabela quando disponíveis)

Se `402` → toast com link pra `Settings > Workspace > Usage`.

## 7. Edge cases

| Cenário | Tratamento |
|---|---|
| Coluna texto vazia em todos os pacientes | Não oferece etapa 4 |
| Texto > 8k chars num campo | Trunca em 6k (margem pro prompt). Avisa em `notes`. |
| 0 parâmetros extraídos pra um paciente | Card mostra apenas resumo + highlights + "Sem parâmetros quantitativos identificados no texto" |
| Cancelamento mid-batch | Mantém resultados já obtidos; permite retomar do índice X |
| Mesma chamada falha 3x | Marca paciente como erro; lista no topo "3 pacientes não processados" + botão "Tentar novamente só esses" |
| Erro de parse do tool call | Trata como falha do paciente, salva raw response em `notes` pra debug |

## 8. Métricas (futuro, fora desta sprint)
- Tempo médio por paciente
- % de extrações com `confidence:'alta'`
- % de pacientes com red flag
- Comparativo: parâmetros estruturados vs extraídos do texto

## Arquivos editados / criados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/clinical-extract/index.ts` | **novo** — edge function com tool calling Lovable AI |
| `src/hooks/useClinicalExtraction.ts` | **novo** — orquestra batch com concurrency + abort |
| `src/lib/clinical-analysis.ts` | adicionar `KNOWN_FIELDS` para campos texto; export type `ClinicalExtraction` |
| `src/pages/IAplanilhas.tsx` | nova etapa 5 com config, progresso e visualização de resultados; botão "via IA" na etapa 3 |
| `src/components/shared/HighlightBadge.tsx` | **novo** — badge categorizado por severidade |

Sem migrations. Sem mudança de schema do banco. Sem persistência.

## Fora de escopo (próximas iterações)

1. **Persistir extrações no Supabase** (tabela `clinical_extractions` ligada a `patient_id` quando o paciente já existe no sistema). Hoje só roda em memória por upload.
2. **Match automático paciente da planilha ↔ paciente cadastrado** (por CPF) e gravar highlights como `alerts` ou `orientacoes`.
3. **Batch endpoint server-side** (se 50+ pacientes virar lento).
4. **Modo "ingestão incremental"** — reanalisar só linhas novas vs upload anterior.
5. **Comparação entre uploads** (delta de evolução do paciente entre planilhas).
6. **Áudio/PDF**: aceitar upload de PDF/áudio (Lovable AI multimodal) e fazer extração — fora deste sprint.

