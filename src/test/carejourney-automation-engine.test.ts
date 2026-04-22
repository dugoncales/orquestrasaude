import { describe, expect, it, vi } from "vitest";
import { evaluateAndPersistAutomationRule } from "@/lib/automation-engine";
import { AutomationRuleRuntime } from "@/domain/carejourney";

vi.mock("@/integrations/supabase/client", () => {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn().mockReturnValue({ insert });
  return {
    supabase: { from },
  };
});

const rule: AutomationRuleRuntime = {
  id: "rule-test",
  name: "Regra Teste",
  severity: "medium",
  lookbackWindowDays: 30,
  cooldownHours: 24,
  requiredDataQualityScore: 70,
  requiresHumanValidation: false,
  conditionKey: "flag_true",
  actions: ["abrir_tarefa"],
};

describe("automation engine persistence", () => {
  it("deve avaliar e persistir evento suprimido quando condição não é atendida", async () => {
    const result = await evaluateAndPersistAutomationRule({
      rule,
      patientId: "patient-1",
      input: {
        flags: { flag_true: false },
        dataQualityScore: 90,
      },
    });

    expect(result.shouldTrigger).toBe(false);
    expect(result.reasons).toContain("condition_not_met");
  });
});
