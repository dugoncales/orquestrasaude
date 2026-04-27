// Aplica uma extração IA: gera alerts (red flags + highlights críticos),
// orientacoes (próximos passos) e parameter_records (params com confidence alta).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

interface Highlight {
  text: string;
  category?: string;
  severity?: "critico" | "alto" | "moderado" | "baixo";
}

interface ExtractedParam {
  field: string;
  fieldOther?: string;
  value: number | string;
  unit?: string;
  date?: string;
  source?: string;
  confidence?: "alta" | "media" | "baixa";
}

const KNOWN_NUMERIC_FIELDS = new Set([
  "hba1c", "glicemia", "pas", "pad", "imc", "peso", "altura",
  "ldl", "hdl", "colesterol_total", "triglicerides", "creatinina",
  "phq9", "gad7", "act", "albuminuria",
]);

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(",", ".").replace(/[^\d.\-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function safeDate(d?: string): string {
  if (d) {
    const dt = new Date(d);
    if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Cliente com JWT do usuário (respeita RLS) — para validações
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    let body: { extraction_id?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const extractionId = body.extraction_id;
    if (!extractionId || typeof extractionId !== "string") {
      return new Response(JSON.stringify({ error: "extraction_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Carregar extração via cliente do user (RLS valida que ele pode ver)
    const { data: ext, error: extErr } = await userClient
      .from("clinical_extractions")
      .select("*")
      .eq("id", extractionId)
      .maybeSingle();
    if (extErr) {
      return new Response(JSON.stringify({ error: extErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!ext) {
      return new Response(JSON.stringify({ error: "Extraction not found or no access" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (ext.applied) {
      return new Response(
        JSON.stringify({ error: "Extraction already applied", applied_at: ext.applied_at }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!ext.patient_id) {
      return new Response(
        JSON.stringify({ error: "Vincule um paciente antes de aplicar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Verificar acesso ao paciente
    const { data: canAccess } = await userClient.rpc("can_access_patient", {
      _user_id: userId,
      _patient_id: ext.patient_id,
    });
    if (!canAccess) {
      return new Response(
        JSON.stringify({ error: "Sem permissão de acesso ao paciente vinculado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Buscar nome do paciente cadastrado + nome do profissional
    const { data: patient } = await userClient
      .from("patients")
      .select("id, nome")
      .eq("id", ext.patient_id)
      .maybeSingle();
    const { data: profile } = await userClient
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const patientName = patient?.nome ?? ext.patient_name_source;
    const profissionalNome = profile?.full_name ?? "Profissional";
    const today = new Date().toISOString().slice(0, 10);

    // 4. Service-role client para inserts em massa (RLS já validada)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // a) Red flags → alerts (critical)
    const redFlags: string[] = Array.isArray(ext.red_flags) ? ext.red_flags : [];
    const alertsInserts: Array<Record<string, unknown>> = redFlags.map((rf) => ({
      patient_id: ext.patient_id,
      patient_name: patientName,
      tipo: "clinico",
      severidade: "critical",
      mensagem: `[IA] ${rf}`,
      data: today,
      lido: false,
    }));

    // b) Highlights críticos → alerts (warning)
    const highlights: Highlight[] = Array.isArray(ext.highlights) ? (ext.highlights as Highlight[]) : [];
    for (const h of highlights) {
      if (h.severity === "critico" || h.severity === "alto") {
        alertsInserts.push({
          patient_id: ext.patient_id,
          patient_name: patientName,
          tipo: "clinico",
          severidade: h.severity === "critico" ? "critical" : "warning",
          mensagem: `[IA · ${h.category ?? "highlight"}] ${h.text}`,
          data: today,
          lido: false,
        });
      }
    }

    // c) Próximos passos → orientacoes
    const nextSteps: string[] = Array.isArray(ext.suggested_next_steps) ? ext.suggested_next_steps : [];
    const orientacoesInserts = nextSteps.map((step) => ({
      patient_id: ext.patient_id,
      texto: `[IA] ${step}`,
      profissional: profissionalNome,
      data: today,
    }));

    // d) Parâmetros confidence='alta' → parameter_records
    const params: ExtractedParam[] = Array.isArray(ext.extracted_params)
      ? (ext.extracted_params as ExtractedParam[])
      : [];
    const paramInserts: Array<Record<string, unknown>> = [];
    for (const p of params) {
      if (p.confidence !== "alta") continue;
      if (!KNOWN_NUMERIC_FIELDS.has(p.field)) continue;
      const num = toNumber(p.value);
      if (num === null) continue;
      paramInserts.push({
        patient_id: ext.patient_id,
        field: p.field,
        value: num,
        date: safeDate(p.date),
      });
    }

    // 5. Inserts (cada um pode falhar parcial, agrega resultados)
    const results: Record<string, number> = { alerts: 0, orientacoes: 0, parameter_records: 0 };
    const errors: string[] = [];

    if (alertsInserts.length > 0) {
      const { error, count } = await adminClient
        .from("alerts")
        .insert(alertsInserts, { count: "exact" });
      if (error) errors.push(`alerts: ${error.message}`);
      else results.alerts = count ?? alertsInserts.length;
    }

    if (orientacoesInserts.length > 0) {
      const { error, count } = await adminClient
        .from("orientacoes")
        .insert(orientacoesInserts, { count: "exact" });
      if (error) errors.push(`orientacoes: ${error.message}`);
      else results.orientacoes = count ?? orientacoesInserts.length;
    }

    if (paramInserts.length > 0) {
      const { error, count } = await adminClient
        .from("parameter_records")
        .insert(paramInserts, { count: "exact" });
      if (error) errors.push(`parameter_records: ${error.message}`);
      else results.parameter_records = count ?? paramInserts.length;
    }

    // 6. Marca como aplicada
    const { error: updErr } = await adminClient
      .from("clinical_extractions")
      .update({
        applied: true,
        applied_at: new Date().toISOString(),
        applied_by: userId,
      })
      .eq("id", extractionId);
    if (updErr) errors.push(`update applied: ${updErr.message}`);

    return new Response(
      JSON.stringify({
        ok: errors.length === 0,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: errors.length === 0 ? 200 : 207,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
