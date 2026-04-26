// Lovable AI: extrai parâmetros clínicos, highlights e red flags
// de campos de texto livre (anotações, evolução, observações, etc.)
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "extract_clinical",
    description:
      "Extrai dados clínicos estruturados a partir de campos de texto livre de prontuário em PT-BR.",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description:
            "Resumo executivo de 3 a 5 linhas em PT-BR sobre o estado clínico atual, tendência e pontos de atenção.",
        },
        highlights: {
          type: "array",
          description:
            "Lista de 3 a 6 fatos clinicamente relevantes encontrados no texto (ex: resultado de exame fora da meta, sintoma novo, evento adverso).",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              category: {
                type: "string",
                enum: [
                  "exame",
                  "sintoma",
                  "evento_adverso",
                  "medicacao",
                  "queixa",
                  "outro",
                ],
              },
              severity: {
                type: "string",
                enum: ["critico", "alto", "moderado", "baixo"],
              },
            },
            required: ["text", "category", "severity"],
            additionalProperties: false,
          },
        },
        extractedParams: {
          type: "array",
          description:
            "Parâmetros clínicos quantitativos identificados no texto. Não invente valores.",
          items: {
            type: "object",
            properties: {
              field: {
                type: "string",
                enum: [
                  "hba1c",
                  "glicemia",
                  "pas",
                  "pad",
                  "imc",
                  "peso",
                  "ldl",
                  "hdl",
                  "colesterol_total",
                  "triglicerides",
                  "creatinina",
                  "albuminuria",
                  "phq9",
                  "gad7",
                  "act",
                  "outro",
                ],
              },
              fieldOther: { type: "string" },
              value: { type: "string", description: "Valor como string para preservar formatos (ex: '9,8' ou '140/90')" },
              unit: { type: "string" },
              date: { type: "string", description: "ISO yyyy-mm-dd se identificável" },
              source: { type: "string", description: "Trecho fonte exato (≤80 chars)" },
              confidence: { type: "string", enum: ["alta", "media", "baixa"] },
            },
            required: ["field", "value", "source", "confidence"],
            additionalProperties: false,
          },
        },
        redFlags: {
          type: "array",
          description:
            "Sinais que exigem ação imediata (crise hipertensiva, ideação suicida, dor torácica, sangramento ativo, etc.)",
          items: { type: "string" },
        },
        suggestedNextSteps: {
          type: "array",
          description: "3 a 5 próximos passos acionáveis pelo profissional.",
          items: { type: "string" },
        },
        notes: {
          type: "array",
          description: "Ambiguidades, dados conflitantes, ou observações sobre confiança da extração.",
          items: { type: "string" },
        },
      },
      required: [
        "summary",
        "highlights",
        "extractedParams",
        "redFlags",
        "suggestedNextSteps",
        "notes",
      ],
      additionalProperties: false,
    },
  },
} as const;

const SYSTEM_PROMPT = `Você é um especialista em registro clínico de prontuário em português brasileiro.
Recebe campos de texto livre de um paciente e deve extrair informação estruturada.

Regras:
1. Extraia parâmetros QUANTITATIVOS (HbA1c, glicemia, PA, IMC, peso, lipídios, creatinina, albuminúria, PHQ-9, GAD-7, ACT). Sempre cite o trecho fonte exato (≤80 chars). Use confidence='baixa' quando o valor estiver ambíguo, indireto ou sem unidade clara.
2. Identifique HIGHLIGHTS — fatos clinicamente relevantes (resultados fora da meta, sintomas novos, eventos adversos, queixas com impacto funcional, hospitalização recente).
3. Identifique RED FLAGS — sinais que exigem ação IMEDIATA (crise hipertensiva, ideação suicida, dor torácica anginosa, sintomas neurológicos focais, sangramento ativo).
4. Resumo executivo de 3-5 linhas: estado atual, tendência, pontos de atenção.
5. 3-5 próximos passos acionáveis.

NUNCA invente valores. NUNCA infira diagnósticos não escritos. Se um campo estiver vazio ou irrelevante, retorne arrays vazios.

Responda chamando a função extract_clinical.`;

function truncate(s: string, max: number) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + " […truncado]" : s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const patientName: string = String(body.patientName ?? "Paciente").slice(0, 200);
    const fields: Record<string, string> = body.fields ?? {};
    const structuredData = body.structuredData ?? null;
    const model: string = body.model || "google/gemini-3-flash-preview";

    // Concatena campos texto (rotulados, truncados pra ~6k cada)
    const fieldKeys = Object.keys(fields).filter(
      (k) => typeof fields[k] === "string" && fields[k].trim().length > 0,
    );
    if (fieldKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum campo texto fornecido para extração." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fieldsBlock = fieldKeys
      .map((k) => `### ${k}\n${truncate(fields[k], 6000)}`)
      .join("\n\n");

    const userMsg = `Paciente: ${patientName}

Dados estruturados já conhecidos (NÃO duplique na extração):
${structuredData ? JSON.stringify(structuredData, null, 2) : "(nenhum)"}

Campos de texto livre:
${fieldsBlock}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "extract_clinical" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({ error: "Créditos do workspace esgotados. Adicione créditos em Settings > Workspace > Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call returned:", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "IA não retornou extração estruturada", raw: data?.choices?.[0]?.message?.content ?? null }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args:", e, toolCall.function.arguments);
      return new Response(
        JSON.stringify({ error: "Falha ao decodificar resposta da IA" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clinical-extract error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
