import { supabase } from "@/integrations/supabase/client";
import {
  AutomationEvaluationInput,
  AutomationEvaluationResult,
  AutomationRuleRuntime,
  evaluateAutomationRule,
} from "@/domain/carejourney";

interface PersistAutomationEventInput {
  rule: AutomationRuleRuntime;
  patientId: string;
  careLineId?: string;
  evaluation: AutomationEvaluationResult;
  input: AutomationEvaluationInput;
}

function computeCooldownUntil(now: Date, cooldownHours: number): string {
  const value = new Date(now.getTime() + cooldownHours * 60 * 60 * 1000);
  return value.toISOString();
}

export async function persistAutomationEvent({
  rule,
  patientId,
  careLineId,
  evaluation,
  input,
}: PersistAutomationEventInput) {
  const now = input.now ?? new Date();

  const payload = {
    conditionKey: rule.conditionKey,
    reasons: evaluation.reasons,
    dataQualityScore: input.dataQualityScore,
    flags: input.flags,
    actions: rule.actions,
    lookbackWindowDays: rule.lookbackWindowDays,
    requiresHumanValidation: rule.requiresHumanValidation,
  };

  const { error } = await supabase.from("automation_events").insert({
    rule_id: rule.id,
    patient_id: patientId,
    care_line_id: careLineId ?? null,
    severity: rule.severity,
    status: evaluation.shouldTrigger ? "triggered" : "suppressed",
    triggered_at: now.toISOString(),
    cooldown_until: computeCooldownUntil(now, rule.cooldownHours),
    payload_json: payload,
  });

  if (error) throw error;
}

interface EvaluateAndPersistInput {
  rule: AutomationRuleRuntime;
  patientId: string;
  careLineId?: string;
  input: AutomationEvaluationInput;
}

export async function evaluateAndPersistAutomationRule({
  rule,
  patientId,
  careLineId,
  input,
}: EvaluateAndPersistInput): Promise<AutomationEvaluationResult> {
  const evaluation = evaluateAutomationRule(rule, input);
  await persistAutomationEvent({
    rule,
    patientId,
    careLineId,
    evaluation,
    input,
  });
  return evaluation;
}
