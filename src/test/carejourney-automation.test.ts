import { describe, expect, it } from "vitest";
import {
  evaluateAutomationRule,
  evaluateAutomationRules,
  type AutomationRuleRuntime,
} from "@/domain/carejourney/automation";
import { validateAIInsightPayload } from "@/domain/carejourney/ai-governance";

const diabetesRule: AutomationRuleRuntime = {
  id: "rule-diabetes-meta",
  name: "Diabetes fora da meta",
  severity: "high",
  lookbackWindowDays: 180,
  cooldownHours: 72,
  requiredDataQualityScore: 80,
  requiresHumanValidation: true,
  conditionKey: "hba1c_above_goal",
  actions: ["gerar_alerta_clinico"],
};

describe("carejourney automation runtime", () => {
  it("deve disparar regra quando condição, qualidade e cooldown estão ok", () => {
    const result = evaluateAutomationRule(diabetesRule, {
      flags: { hba1c_above_goal: true },
      dataQualityScore: 95,
      lastTriggeredAt: null,
    });

    expect(result.shouldTrigger).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("deve bloquear regra quando estiver em cooldown", () => {
    const result = evaluateAutomationRule(diabetesRule, {
      flags: { hba1c_above_goal: true },
      dataQualityScore: 95,
      now: new Date("2026-04-22T12:00:00Z"),
      lastTriggeredAt: new Date("2026-04-22T10:00:00Z"),
    });

    expect(result.shouldTrigger).toBe(false);
    expect(result.reasons).toContain("rule_in_cooldown");
  });

  it("deve avaliar múltiplas regras", () => {
    const results = evaluateAutomationRules([diabetesRule], {
      flags: { hba1c_above_goal: false },
      dataQualityScore: 95,
    });

    expect(results).toHaveLength(1);
    expect(results[0].shouldTrigger).toBe(false);
  });

  it("deve exigir aprovação humana para insight de alto risco", () => {
    const validation = validateAIInsightPayload({
      modelVersion: "gpt-5.3",
      inputSnapshotId: "snapshot-1",
      confidenceScore: 0.92,
      evidenceFields: ["hba1c", "dias_sem_retorno"],
      severity: "high",
    });

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("human_approval_required_for_high_risk");
  });
});
