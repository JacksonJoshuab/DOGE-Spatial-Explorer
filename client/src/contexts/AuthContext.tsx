/**
 * AuthContext — Role-Based Authentication for DOGE Municipal Platform
 *
 * In production this context would validate a JWT from the city's IdP
 * (Iowa OCIO SSO, Okta, or Azure AD) and decode the role claim.
 * For the demo environment it persists the selected role in sessionStorage
 * so field crews can switch personas without a full login flow.
 *
 * Supported roles mirror the RBAC matrix in AdminRoles.tsx:
 *   city-admin | mayor | finance-director | police-chief |
 *   public-works | community-dev | parks-director | it-admin
 */
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { ROLES } from "@/pages/AdminRoles";

// ─── Module permission map (mirrors DEFAULT_PERMISSIONS in AdminRoles.tsx) ────
const ROLE_MODULES: Record<string, string[]> = {
  "city-admin": ["*"], // wildcard — all modules
  "mayor":          ["dashboard","spatial-map","transparency","council-report","audit-studio","finance-hub","capital-hub"],
  "finance-director": ["dashboard","finance-hub","capital-hub","hardware-mkt","audit-studio","council-report","transparency","community-dev"],
  "police-chief":   ["dashboard","le-hub","evidence-room","scif","detention","records","spatial-map","operations"],
  "public-works":   ["dashboard","utilities","spatial-map","operations","hardware-mkt","records"],
  "community-dev":  ["dashboard","community-dev","transparency","finance-hub","records","spatial-map"],
  "parks-director": ["dashboard","parks","spatial-map","operations","records"],
  "it-admin":       ["dashboard","spatial-map","hardware-mkt","resident-portal","ip-pipeline","scif","records","operations"],
};

// Route → module-id mapping for guard checks
export const ROUTE_MODULE_MAP: Record<string, string> = {
  "/admin/roles":    "admin-roles",
  "/secure":         "scif",
  "/le-hub":         "le-hub",
  "/records":        "records",
  "/audit":          "audit-studio",
  "/finance":        "finance-hub",
  "/capital-hub":    "capital-hub",
  "/community-dev":  "community-dev",
  "/utilities":      "utilities",
  "/parks":          "parks",
  "/operations":     "operations",
  "/map":            "spatial-map",
  "/hardware":       "hardware-mkt",
  "/ip-pipeline":    "ip-pipeline",
  "/council-report": "council-report",
  "/transparency":   "transparency",
  "/staff":          "dashboard",
  "/dashboard":      "dashboard",
};

// ─── Audit log entry ──────────────────────────────────────────────────────────
export interface AuditEntry {
  id: string;
  timestamp: Date;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  category: "access" | "rbac" | "auth" | "data";
  severity: "info" | "warning" | "critical";
  detail: string;
}

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
  roleId: string;
  roleName: string;
  roleIcon: string;
  actorName: string;
  isAuthenticated: boolean;
  canAccess: (moduleId: string) => boolean;
  canAccessRoute: (path: string) => boolean;
  switchRole: (roleId: string) => void;
  auditLog: AuditEntry[];
  appendAudit: (entry: Omit<AuditEntry, "id" | "timestamp" | "actor" | "actorRole">) => void;
  clearAuditLog: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Seed audit entries ───────────────────────────────────────────────────────
const SEED_AUDIT: AuditEntry[] = [
  {
    id: "AUD-0001",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    actor: "Leigh Ann Erickson",
    actorRole: "City Administrator",
    action: "ROLE_GRANTED",
    target: "Police Chief — SCIF Management",
    category: "rbac",
    severity: "warning",
    detail: "Module 'SCIF Management' granted to role 'Police Chief' by City Administrator.",
  },
  {
    id: "AUD-0002",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    actor: "Priya Nair",
    actorRole: "IT Administrator",
    action: "STAFF_DEACTIVATED",
    target: "Officer K. Thompson (SA-010)",
    category: "rbac",
    severity: "warning",
    detail: "Staff account SA-010 deactivated. All active sessions invalidated.",
  },
  {
    id: "AUD-0003",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    actor: "Brenda Sherwood",
    actorRole: "Finance Director",
    action: "DATA_EXPORT",
    target: "General Ledger FY2024",
    category: "data",
    severity: "info",
    detail: "CSV export of General Ledger (9 accounts, FY2024) downloaded.",
  },
  {
    id: "AUD-0004",
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    actor: "Leigh Ann Erickson",
    actorRole: "City Administrator",
    action: "ROLE_REVOKED",
    target: "Community Dev Director — Finance Hub",
    category: "rbac",
    severity: "warning",
    detail: "Module 'Finance Hub' revoked from role 'Community Dev Director'.",
  },
  {
    id: "AUD-0005",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    actor: "System",
    actorRole: "IoT Gateway",
    action: "SENSOR_ALERT",
    target: "WL-VALVE-001 — Water Pressure",
    category: "access",
    severity: "critical",
    detail: "IoT sensor WL-VALVE-001 reported pressure anomaly: 42 PSI (threshold: 45 PSI).",
  },
];

// ─── Provider ─────────────────────────────────────────────────────────────────
const ACTOR_NAMES: Record<string, string> = {
  "city-admin":       "Leigh Ann Erickson",
  "mayor":            "Kevin Ollendieck",
  "finance-director": "Brenda Sherwood",
  "police-chief":     "Chief James Doyle",
  "public-works":     "Marcus Webb",
  "community-dev":    "Carla Mendez",
  "parks-director":   "Tom Harrington",
  "it-admin":         "Priya Nair",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [roleId, setRoleId] = useState<string>(() => {
    return sessionStorage.getItem("wl_role") ?? "city-admin";
  });
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(SEED_AUDIT);

  const role = ROLES.find(r => r.id === roleId) ?? ROLES[0];
  const actorName = ACTOR_NAMES[roleId] ?? "Unknown User";

  useEffect(() => {
    sessionStorage.setItem("wl_role", roleId);
  }, [roleId]);

  const canAccess = useCallback((moduleId: string): boolean => {
    const modules = ROLE_MODULES[roleId] ?? [];
    return modules.includes("*") || modules.includes(moduleId);
  }, [roleId]);

  const canAccessRoute = useCallback((path: string): boolean => {
    const moduleId = ROUTE_MODULE_MAP[path];
    if (!moduleId) return true; // public route
    return canAccess(moduleId);
  }, [canAccess]);

  const switchRole = useCallback((newRoleId: string) => {
    const newRole = ROLES.find(r => r.id === newRoleId);
    const oldRole = ROLES.find(r => r.id === roleId);
    setRoleId(newRoleId);
    // Append auth audit entry
    setAuditLog(prev => [{
      id: `AUD-${String(prev.length + 1).padStart(4, "0")}`,
      timestamp: new Date(),
      actor: ACTOR_NAMES[newRoleId] ?? "Unknown",
      actorRole: newRole?.name ?? newRoleId,
      action: "ROLE_SWITCH",
      target: `${oldRole?.name ?? roleId} → ${newRole?.name ?? newRoleId}`,
      category: "auth",
      severity: "info",
      detail: `Session role switched from '${oldRole?.name}' to '${newRole?.name}' for demo purposes.`,
    }, ...prev]);
  }, [roleId]);

  const appendAudit = useCallback((entry: Omit<AuditEntry, "id" | "timestamp" | "actor" | "actorRole">) => {
    setAuditLog(prev => [{
      ...entry,
      id: `AUD-${String(prev.length + 1).padStart(4, "0")}`,
      timestamp: new Date(),
      actor: actorName,
      actorRole: role.name,
    }, ...prev]);
  }, [actorName, role.name]);

  const clearAuditLog = useCallback(() => setAuditLog([]), []);

  return (
    <AuthContext.Provider value={{
      roleId,
      roleName: role.name,
      roleIcon: role.icon,
      actorName,
      isAuthenticated: true,
      canAccess,
      canAccessRoute,
      switchRole,
      auditLog,
      appendAudit,
      clearAuditLog,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
