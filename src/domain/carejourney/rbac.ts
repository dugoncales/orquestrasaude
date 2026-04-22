import { UserRole } from "@/data/types";
import { Action, RbacRule, Resource } from "./contracts";

export const PHASE1_RBAC_RULES: RbacRule[] = [
  {
    resource: "patients",
    actions: ["read", "create", "update", "assign_care_line"],
    rolesAllowed: ["professional", "admin"],
  },
  {
    resource: "journeys",
    actions: ["read", "update_step", "close_step", "reopen_step"],
    rolesAllowed: ["professional", "admin"],
  },
  {
    resource: "care_lines",
    actions: ["read", "create", "update"],
    rolesAllowed: ["professional", "manager", "admin"],
  },
  {
    resource: "appointments",
    actions: ["read"],
    rolesAllowed: ["patient", "professional", "manager", "admin"],
  },
  {
    resource: "exams",
    actions: ["read"],
    rolesAllowed: ["patient", "professional", "manager", "admin"],
  },
  {
    resource: "questionnaires",
    actions: ["read", "respond_prom", "respond_prem"],
    rolesAllowed: ["patient", "professional", "manager", "admin"],
  },
  {
    resource: "bi",
    actions: ["read"],
    rolesAllowed: ["professional", "manager", "admin"],
  },
  {
    resource: "ai",
    actions: ["read"],
    rolesAllowed: ["professional", "manager", "admin"],
  },
  {
    resource: "admin_studio",
    actions: ["read", "update"],
    rolesAllowed: ["admin"],
  },
  {
    resource: "dashboards_executive",
    actions: ["read"],
    rolesAllowed: ["manager", "admin"],
  },
  {
    resource: "self_journey",
    actions: ["read", "respond_prom", "respond_prem"],
    rolesAllowed: ["patient"],
  },
];

export function can(role: UserRole, resource: Resource, action: Action): boolean {
  return PHASE1_RBAC_RULES.some(
    (rule) =>
      rule.resource === resource &&
      rule.actions.includes(action) &&
      rule.rolesAllowed.includes(role),
  );
}
