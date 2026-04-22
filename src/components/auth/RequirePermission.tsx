import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Action, Resource, can } from "@/domain/carejourney";
import { appendAuditLog } from "@/lib/audit-log";

interface RequirePermissionProps {
  children: ReactNode;
  resource: Resource;
  action: Action;
}

export function RequirePermission({ children, resource, action }: RequirePermissionProps) {
  const { role } = useAuth();
  const location = useLocation();

  if (!role) {
    return <Navigate to="/" replace />;
  }

  if (!can(role, resource, action)) {
    const audit = appendAuditLog({
      type: "access_denied",
      actorRole: role,
      resource,
      action,
      path: location.pathname,
    });

    return (
      <Navigate
        to="/forbidden"
        state={{ from: location.pathname, auditId: audit.id }}
        replace
      />
    );
  }

  return <>{children}</>;
}
