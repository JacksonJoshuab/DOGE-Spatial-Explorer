/**
 * RouteGuard — enforces role-based access control on protected routes.
 * Reads the current user's role from AuthContext and redirects to /access-denied
 * if the route's required module is not in the role's permission set.
 */
import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, ROUTE_MODULE_MAP } from "@/contexts/AuthContext";

interface Props {
  path: string;
  children: ReactNode;
}

export default function RouteGuard({ path, children }: Props) {
  const { canAccessRoute, appendAudit, roleName, actorName } = useAuth();
  const [, navigate] = useLocation();
  const allowed = canAccessRoute(path);

  useEffect(() => {
    if (!allowed) {
      const moduleId = ROUTE_MODULE_MAP[path] ?? path;
      appendAudit({
        action: "ACCESS_DENIED",
        target: `Route: ${path} (module: ${moduleId})`,
        category: "access",
        severity: "warning",
        detail: `${actorName} (${roleName}) attempted to access '${path}' without the required '${moduleId}' permission.`,
      });
      navigate("/access-denied");
    }
  }, [allowed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!allowed) return null;
  return <>{children}</>;
}
