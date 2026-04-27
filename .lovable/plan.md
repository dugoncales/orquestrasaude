
# Plano: Persistir extrações IA e linkar com paciente cadastrado

Hoje a extração da `IAplanilhas` (etapa 5) roda só em memória. Cada upload morre quando a aba fecha. Esse sprint **transforma os resultados em ações reais no sistema**: cruza com pacientes cadastrados pelo CPF, salva tudo no banco com referência ao paciente, e gera automaticamente:

- **Alertas** para cada red flag encontrada
- **Orientações** para cada "próximo passo sugerido"
- **Registros de parâmetro** para cada valor extraído com `confidence: 'alta'`

Resultado: o profissional faz upload da planilha → IA extrai → ele revisa → 1 clique e aquilo vira pendência real na Jornada Clínica do paciente certo.

## Decisões de produto

| Tema | Escolha |
|---|---|
| Match paciente | Por **CPF normalizado** (só dígitos). Sem CPF → fica como "não vinculado" mas ainda é salvo. |
| Quem pode salvar | Profissional só salva extrações de pacientes que ele acessa (RLS via `can_access_patient`). Admin/manager veem tudo. |
| Quando salvar | Não-automático. Após extração, usuário escolhe "Salvar todos" ou marca paciente por paciente e clica "Salvar selecionados". Permite revisar antes de virar alerta real. |
| O que gera automaticamente | Red flag → `alerts` (severidade `critical`) · Próximo passo → `orientacoes` · Param `confidence:'alta'` → `parameter_records` · Highlight crítico → `alerts` (severidade `warning`). |
| Highlights moderados/baixos | Ficam guardados no JSON da extração mas não viram alerta. |
| Reprocessamento | Se o mesmo CPF já tem extração no upload, marca como "atualização" — nova entrada com `replaces_id` apontando pra anterior. Não apaga histórico. |

## 1. Migrations (3)

### 1.1 Tabela `clinical_extractions`
Guarda o resultado bruto da IA por linha de planilha + match com paciente.

```sql
CREATE TABLE public.clinical_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid,                          -- nullable (sem match)
  cpf_raw text,                             -- como veio na planilha
  cpf_normalized text,                      -- só dígitos, índice
  patient_name_source text NOT NULL,        -- nome como veio na planilha
  source_filename text,
  source_row_index integer,                 -- 0-based, pra rastrear

  summary text,
  highlights jsonb DEFAULT '[]'::jsonb,
  extracted_params jsonb DEFAULT '[]'::jsonb,
  red_flags text[] DEFAULT '{}',
  suggested_next_steps text[] DEFAULT '{}',
  notes text[] DEFAULT '{}',

  model text,                               -- ex: google/gemini-3-flash-preview
  confidence_overall text,                  -- alta/media/baixa (média dos params)

  applied boolean NOT NULL DEFAULT false,   -- true = gerou alerts/orientacoes
  applied_at timestamptz,
  applied_by uuid,                          -- user_id

  replaces_id uuid REFERENCES public.clinical_extractions(id) ON DELETE SET NULL,
  created_by uuid,                          -- user_id que rodou a extração
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clinical_extractions_patient ON public.clinical_extractions(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_clinical_extractions_cpf ON public.clinical_extractions(cpf_normalized) WHERE cpf_normalized IS NOT NULL;
CREATE INDEX idx_clinical_extractions_created ON public.clinical_extractions(created_at DESC);

ALTER TABLE public.clinical_extractions ENABLE ROW LEVEL SECURITY;

-- SELECT: admin/manager veem tudo; professional vê o que ele criou OU de paciente que acessa
CREATE POLICY "Extractions select" ON public.clinical_extractions
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
    OR created_by = auth.uid()
    OR (patient_id IS NOT NULL AND can_access_patient(auth.uid(), patient_id))
  );

-- INSERT: qualquer authenticated com role profissional+; obriga created_by = auth.uid()
CREATE POLICY "Extractions insert" ON public.clinical_extractions
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'professional'))
  );

-- UPDATE: admin/manager OU criador OU quem acessa o paciente (pra marcar applied)
CREATE POLICY "Extractions update" ON public.clinical_extractions
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager')
    OR created_by = auth.uid()
    OR (patient_id IS NOT NULL AND can_access_patient(auth.uid(), patient_id))
  );

-- DELETE: admin
CREATE POLICY "Extractions delete" ON public.clinical_extractions
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
```

### 1.2 Função `find_patient_by_cpf`
Centraliza match (e respeita RLS).

```sql
CREATE OR REPLACE FUNCTION public.find_patient_by_cpf(_cpf text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.patients
  WHERE regexp_replace(cpf, '\D', '', 'g') = regexp_replace(_cpf, '\D', '', 'g')
  LIMIT 1
$$;
```

### 1.3 Audit trigger
Adiciona `clinical_extractions` ao `audit_trigger`.

```sql
CREATE TRIGGER audit_clinical_extractions
AFTER INSERT OR UPDATE OR DELETE ON public.clinical_extractions
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
```

## 2. Edge Function nova: `apply-extraction`

`supabase/functions/apply-extraction/index.ts`

Recebe um `extraction_id`. Faz tudo server-side com SERVICE_ROLE pra garantir consistência (transação lógica), mas valida primeiro que o usuário **pode** acessar o paciente:

```ts
// Pseudocódigo
1. Valida JWT (verify_jwt = false + validação manual via SUPABASE_JWKS).
2. Carrega extraction (com client autenticado do user → respeita RLS).
3. Se extraction.applied = true → 409.
4. Se extraction.patient_id IS NULL → 400 "vincule um paciente primeiro".
5. Verifica can_access_patient(user, patient_id) via .rpc.
6. Para cada red_flag: insert em alerts (tipo='clinico', severidade='critical', mensagem, patient_id, data=hoje).
7. Para cada highlight com severity='critico' que não vire param: insert em alerts (severidade='warning').
8. Para cada suggested_next_step: insert em orientacoes (texto, profissional=user.full_name, data=hoje, patient_id).
9. Para cada extracted_param com confidence='alta' E field reconhecido E value numérico:
   insert em parameter_records (field, value, date=param.date||hoje, patient_id).
10. Update extraction set applied=true, applied_at=now(), applied_by=user.id.
11. Retorna { alerts: N, orientacoes: M, parameter_records: K }.
```

CORS, validação Zod do body `{ extraction_id: uuid }`, tratamento 401/403/404/409.

## 3. Hooks novos

### `useClinicalExtractionsDb.ts`
```ts
useExtractions(filter?: { patientId?, applied?, limit? }) // SELECT
useSaveExtractions()        // batch INSERT a partir do estado da etapa 5
useApplyExtraction()        // chama edge function
useUnlinkExtraction()       // patient_id = null
useLinkExtractionToPatient() // patient_id = X (com lookup CPF se quiser)
```

### Ajuste em `useClinicalExtraction.ts`
Sem mudança estrutural — continua orquestrando IA. Só exporta `results` num formato fácil de mapear pra insert (já está).

## 4. UI: 3 mudanças

### 4.1 `ClinicalExtractionStep.tsx` — coluna "Vínculo" + ações de salvar

Cada card de paciente ganha:

- Badge no header esquerdo:
  - 🟢 "Vinculado: João Silva" (se CPF da planilha bateu com paciente cadastrado)
  - 🟡 "Sem vínculo (CPF não encontrado)"
  - ⚪ "Sem CPF na planilha"
- Botão "Vincular manualmente" (popover com busca de paciente por nome) quando 🟡 ou ⚪.
- Quando expandido, ao final dos detalhes:
  - Botão **"Salvar no prontuário"** (vira `clinical_extractions` row + chama `apply-extraction`).
  - Se já salvo, mostra: "✓ Aplicado em DD/MM HH:mm — gerou X alertas, Y orientações" + botão "Ver no paciente" (link `/paciente/:id`).

Toolbar acima da lista:
- Contador "12 vinculados / 3 sem CPF / 5 sem match"
- Botão **"Salvar e aplicar todos vinculados"** (loop processOne→insert→apply, com progresso)

### 4.2 `PerfilPaciente.tsx` — aba/seção "Extrações IA"

Nova seção (collapsible card) listando últimas 10 `clinical_extractions` desse paciente:
- Data, modelo usado, sumário (1ª linha), badges de # red flags / # params, quem aplicou.
- Click → modal expandido (mesmo layout do card da etapa 5) somente leitura.

### 4.3 `JornadaClinica.tsx` — banner discreto

Se houver extração não-aplicada ou recente (<7d) pro paciente: banner azul "1 extração IA pendente de revisão" com botão "Revisar".

## 5. Fluxo do usuário (ponta a ponta)

```text
┌────────────────────────────────────────────────────────────┐
│ 1. Upload planilha (.xlsx)                                 │
│ 2. Etapas 1-3 (já existe)                                  │
│ 3. Etapa 5: extração IA (já existe)                        │
│ 4. Card por paciente mostra match com cadastro:            │
│    - 12 vinculados (CPF bateu)                             │
│    - 3 sem CPF na planilha                                 │
│    - 5 com CPF mas sem cadastro                            │
│ 5. Usuário revisa, opcionalmente vincula manual            │
│ 6. Click "Salvar e aplicar todos vinculados":              │
│    a) INSERT clinical_extractions (12 rows)                │
│    b) edge fn apply-extraction × 12                        │
│    c) Cada uma cria N alertas + M orientações + K params   │
│ 7. Toast: "12 pacientes atualizados — 47 alertas, 30 ori-  │
│    entações, 18 parâmetros gerados"                        │
│ 8. Cada alerta aparece em /alertas e na Jornada Clínica    │
│    do paciente. Cada orientação em /paciente/:id.          │
└────────────────────────────────────────────────────────────┘
```

## 6. Edge cases

| Caso | Tratamento |
|---|---|
| CPF inválido (menos que 11 dígitos) | Não tenta match. Marca como "sem CPF". |
| Múltiplos pacientes com mesmo CPF | `find_patient_by_cpf` retorna o mais recente. Backend aceita; UI mostra warning "encontrados 2 cadastros, usando o mais recente". |
| Profissional sem permissão no paciente vinculado | `can_access_patient` falha → toast "você não tem acesso a este paciente, peça vínculo ao gestor". Extração fica salva mas não aplicada. |
| Reextração do mesmo CPF | Nova `clinical_extractions` com `replaces_id` apontando pra anterior. Aba do paciente lista as duas. |
| Próximo passo duplicado entre upload e o que já existe em orientacoes | Aceitável nesta sprint (sem dedup). Anotação: futuro = comparar texto. |
| Param extraído mas patient não tem `linha_cuidado` ativa | Insert vai mesmo assim (parameter_records permite). Apenas não aparecerá no painel de "fora da meta" dessa linha. |
| Edge fn 5xx no meio do batch | Cada um é independente; UI retoma os faltantes. |

## 7. Arquivos

### Migrations
- `20260427_clinical_extractions_table.sql` (tabela + RLS + índices)
- `20260427_find_patient_by_cpf.sql` (função)
- `20260427_audit_clinical_extractions.sql` (trigger)

### Edge function
- `supabase/functions/apply-extraction/index.ts` (nova)

### Frontend
- `src/hooks/useClinicalExtractionsDb.ts` (novo)
- `src/components/shared/ClinicalExtractionStep.tsx` (badges de vínculo + botões salvar/aplicar; popover busca paciente)
- `src/pages/PerfilPaciente.tsx` (nova seção "Extrações IA")
- `src/pages/JornadaClinica.tsx` (banner pendente)
- `src/integrations/supabase/types.ts` (regen automático)

## 8. Riscos & mitigações

| Risco | Mitigação |
|---|---|
| Aplicar extração ruim gera spam de alertas | UI exige clique explícito por paciente OU "salvar todos vinculados". Nada automático. |
| Conflito de versão (mesmo CPF aplicado 2x) | `replaces_id` mantém histórico. `applied=true` previne re-aplicar. |
| Edge function lenta no batch | Client envia 3 paralelas (mesma `concurrency` da extração); progresso visível. |
| RLS bloqueia leitura de extração antiga depois que profissional perde acesso | Esperado e correto. |

## 9. Fora de escopo (próximas sprints)

- Comparar uploads (delta entre extrações do mesmo paciente)
- PDF/áudio multimodal
- Dedup automática de orientações
- Acionar `automation_rules` ao aplicar extração
