import { AutomationSeverity } from "./automation";

export interface AIInsightAuditPayload {
  modelVersion: string;
  inputSnapshotId: string;
  confidenceScore: number;
  evidenceFields: string[];
  approvedBy?: string | null;
  approvedAt?: string | null;
  severity?: AutomationSeverity;
}

export interface AIInsightValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAIInsightPayload(payload: AIInsightAuditPayload): AIInsightValidationResult {
  const errors: string[] = [];

  if (!payload.modelVersion) errors.push("model_version_required");
  if (!payload.inputSnapshotId) errors.push("input_snapshot_id_required");
  if (payload.confidenceScore < 0 || payload.confidenceScore > 1) {
    errors.push("confidence_score_out_of_range");
  }
  if (!payload.evidenceFields?.length) errors.push("evidence_fields_required");

  const isHighRisk = payload.severity === "high" || payload.severity === "critical";
  if (isHighRisk && (!payload.approvedBy || !payload.approvedAt)) {
    errors.push("human_approval_required_for_high_risk");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
