import { UserRole } from "@/data/types";

export type Resource =
  | "patients"
  | "journeys"
  | "care_lines"
  | "appointments"
  | "exams"
  | "questionnaires"
  | "bi"
  | "ai"
  | "admin_studio"
  | "dashboards_executive"
  | "self_journey";

export type Action =
  | "read"
  | "create"
  | "update"
  | "assign_care_line"
  | "update_step"
  | "close_step"
  | "reopen_step"
  | "respond_prom"
  | "respond_prem";

export interface RbacRule {
  resource: Resource;
  actions: Action[];
  rolesAllowed: UserRole[];
}

export type JourneyState =
  | "nao_iniciado"
  | "em_andamento"
  | "em_reavaliacao"
  | "concluido"
  | "suspenso";

export type TaskState =
  | "pendente"
  | "em_andamento"
  | "concluida"
  | "cancelada"
  | "atrasada";

export type AlertState =
  | "novo"
  | "triagem"
  | "em_intervencao"
  | "resolvido"
  | "silenciado";

export interface TransitionMap<T extends string> {
  [from: string]: readonly T[];
}

export interface CareLineSeed {
  id: "diabetes" | "hipertensao";
  name: string;
  clinicalParameters: string[];
  defaultProms: string[];
  defaultPrems: string[];
}

export interface JourneyTemplateSeed {
  id: string;
  careLineId: CareLineSeed["id"];
  steps: string[];
}
