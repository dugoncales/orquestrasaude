export type AutomationSeverity = "low" | "medium" | "high" | "critical";

export interface AutomationRuleRuntime {
  id: string;
  name: string;
  severity: AutomationSeverity;
  lookbackWindowDays: number;
  cooldownHours: number;
  requiredDataQualityScore: number;
  requiresHumanValidation: boolean;
  conditionKey: string;
  actions: string[];
}

export interface AutomationEvaluationInput {
  flags: Record<string, boolean>;
  dataQualityScore: number;
  now?: Date;
  lastTriggeredAt?: Date | null;
}

export interface AutomationEvaluationResult {
  ruleId: string;
  shouldTrigger: boolean;
  reasons: string[];
}

function isInCooldown(lastTriggeredAt: Date | null | undefined, now: Date, cooldownHours: number) {
  if (!lastTriggeredAt) return false;
  const diffMs = now.getTime() - lastTriggeredAt.getTime();
  return diffMs < cooldownHours * 60 * 60 * 1000;
}

export function evaluateAutomationRule(
  rule: AutomationRuleRuntime,
  input: AutomationEvaluationInput,
): AutomationEvaluationResult {
  const reasons: string[] = [];
  const now = input.now ?? new Date();

  if (input.dataQualityScore < rule.requiredDataQualityScore) {
    reasons.push("data_quality_below_threshold");
  }

  if (isInCooldown(input.lastTriggeredAt, now, rule.cooldownHours)) {
    reasons.push("rule_in_cooldown");
  }

  if (!input.flags[rule.conditionKey]) {
    reasons.push("condition_not_met");
  }

  return {
    ruleId: rule.id,
    shouldTrigger: reasons.length === 0,
    reasons,
  };
}

export function evaluateAutomationRules(
  rules: AutomationRuleRuntime[],
  input: AutomationEvaluationInput,
): AutomationEvaluationResult[] {
  return rules.map((rule) => evaluateAutomationRule(rule, input));
}
