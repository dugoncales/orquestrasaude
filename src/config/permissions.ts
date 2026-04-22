import { Action, Resource } from "@/domain/carejourney";

export interface RoutePermission {
  resource: Resource;
  action: Action;
}

export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  "/pacientes": { resource: "patients", action: "read" },
  "/pacientes/:id": { resource: "patients", action: "read" },
  "/jornadas": { resource: "journeys", action: "read" },
  "/linhas-de-cuidado": { resource: "care_lines", action: "read" },
  "/consultas": { resource: "appointments", action: "read" },
  "/exames": { resource: "exams", action: "read" },
  "/questionarios": { resource: "questionnaires", action: "read" },
  "/bi": { resource: "bi", action: "read" },
  "/ia": { resource: "ai", action: "read" },
  "/editor": { resource: "admin_studio", action: "update" },
  "/configuracoes": { resource: "admin_studio", action: "read" },
};

export function resolveRoutePermission(pathname: string): RoutePermission | null {
  if (pathname.startsWith("/pacientes/") && pathname !== "/pacientes") {
    return ROUTE_PERMISSIONS["/pacientes/:id"];
  }

  return ROUTE_PERMISSIONS[pathname] ?? null;
}
