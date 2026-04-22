import { describe, expect, it } from "vitest";
import {
  ALERT_TRANSITIONS,
  JOURNEY_TRANSITIONS,
  PHASE1_CARE_LINE_SEEDS,
  PHASE1_JOURNEY_TEMPLATES,
  TASK_TRANSITIONS,
  can,
  canTransition,
} from "@/domain/carejourney";
import { resolveRoutePermission } from "@/config/permissions";
import { appendAuditLog, getAuditLogs } from "@/lib/audit-log";

describe("carejourney phase 1", () => {
  it("deve permitir permissoes de profissional para pacientes", () => {
    expect(can("professional", "patients", "read")).toBe(true);
    expect(can("professional", "patients", "assign_care_line")).toBe(true);
  });

  it("deve bloquear paciente em dashboard executivo", () => {
    expect(can("patient", "dashboards_executive", "read")).toBe(false);
  });

  it("deve bloquear manager para editar pacientes", () => {
    expect(can("manager", "patients", "update")).toBe(false);
  });

  it("deve permitir paciente visualizar consultas e bloquear BI", () => {
    expect(can("patient", "appointments", "read")).toBe(true);
    expect(can("patient", "bi", "read")).toBe(false);
  });

  it("deve permitir manager visualizar linhas de cuidado", () => {
    expect(can("manager", "care_lines", "read")).toBe(true);
  });

  it("deve resolver permissão para rota dinâmica de paciente", () => {
    expect(resolveRoutePermission("/pacientes/abc-123")).toEqual({
      resource: "patients",
      action: "read",
    });
  });

  it("deve registrar trilha de auditoria para acesso negado", () => {
    const before = getAuditLogs().length;
    const entry = appendAuditLog({
      type: "access_denied",
      actorRole: "patient",
      resource: "bi",
      action: "read",
      path: "/bi",
    });

    const after = getAuditLogs().length;
    expect(after).toBe(before + 1);
    expect(entry.type).toBe("access_denied");
    expect(entry.resource).toBe("bi");
  });

  it("deve respeitar transicoes de jornada", () => {
    expect(canTransition(JOURNEY_TRANSITIONS, "nao_iniciado", "em_andamento")).toBe(true);
    expect(canTransition(JOURNEY_TRANSITIONS, "concluido", "em_andamento")).toBe(false);
  });

  it("deve respeitar transicoes de alerta", () => {
    expect(canTransition(ALERT_TRANSITIONS, "novo", "triagem")).toBe(true);
    expect(canTransition(ALERT_TRANSITIONS, "resolvido", "triagem")).toBe(false);
  });

  it("deve respeitar transicoes de tarefa", () => {
    expect(canTransition(TASK_TRANSITIONS, "pendente", "em_andamento")).toBe(true);
    expect(canTransition(TASK_TRANSITIONS, "concluida", "em_andamento")).toBe(false);
  });

  it("deve ter sementes das 2 linhas piloto", () => {
    expect(PHASE1_CARE_LINE_SEEDS.map((line) => line.id)).toEqual(["diabetes", "hipertensao"]);
    expect(PHASE1_JOURNEY_TEMPLATES).toHaveLength(2);
  });
});
