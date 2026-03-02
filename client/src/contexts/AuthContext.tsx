/**
 * AuthContext — Role-Based Authentication for DOGE Municipal Platform
 *
 * Audit entries are now persisted to Postgres via tRPC (audit.append).
 * On mount the provider fetches the last 200 entries from the DB so the
 * log survives page refreshes.  The in-memory list is kept as a fast
 * optimistic cache; the DB is the source of truth.
 *
 * Supported roles mirror the RBAC matrix in AdminRoles.tsx:
 *   city-admin | mayor | finance-director | police-chief |
 *   public-works | community-dev | parks-director | it-admin
 */
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { ROLES } from "@/pages/AdminRoles";
import { trpc } from "@/lib/trpc";

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

// ─── Audit log entry (client-side shape) ──────────────────────────────────────
export interface AuditEntry {
  id: string;
  timestamp: Date;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  category: "access" | "rbac" | "auth" | "data" | "iot";
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
  auditLoading: boolean;
  appendAudit: (entry: Omit<AuditEntry, "id" | "timestamp" | "actor" | "actorRole">) => void;
  clearAuditLog: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

/** Convert a DB row (from audit.list) to the client AuditEntry shape */
function rowToEntry(row: {
  clientId: string;
  ts: number;
  isoTime: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  category: string;
  severity: string;
  detail: string | null;
}): AuditEntry {
  return {
    id: row.clientId,
    timestamp: new Date(row.ts),
    actor: row.actor,
    actorRole: row.actorRole,
    action: row.action,
    target: row.target,
    category: row.category as AuditEntry["category"],
    severity: row.severity as AuditEntry["severity"],
    detail: row.detail ?? "",
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [roleId, setRoleId] = useState<string>(() => {
    return sessionStorage.getItem("wl_role") ?? "city-admin";
  });
  const [localLog, setLocalLog] = useState<AuditEntry[]>([]);

  const role = ROLES.find(r => r.id === roleId) ?? ROLES[0];
  const actorName = ACTOR_NAMES[roleId] ?? "Unknown User";

  // ── Fetch persisted log from DB on mount ──────────────────────────────────
  const { data: dbRows, isLoading: auditLoading, refetch } = trpc.audit.list.useQuery(
    { limit: 200 },
    { refetchOnWindowFocus: false }
  );

  // Merge DB rows into local log (DB is source of truth; local adds optimistic entries)
  const dbEntries: AuditEntry[] = (dbRows ?? []).map(rowToEntry);

  // Combine: local optimistic entries that aren't yet in DB + DB entries
  const dbIds = new Set(dbEntries.map(e => e.id));
  const optimisticOnly = localLog.filter(e => !dbIds.has(e.id));
  const auditLog = [...optimisticOnly, ...dbEntries].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

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

  // ── tRPC mutations ────────────────────────────────────────────────────────
  const appendMutation = trpc.audit.append.useMutation({
    onSuccess: () => { refetch(); },
  });
  const clearMutation = trpc.audit.clear.useMutation({
    onSuccess: () => { setLocalLog([]); refetch(); },
  });

  const switchRole = useCallback((newRoleId: string) => {
    const newRole = ROLES.find(r => r.id === newRoleId);
    const oldRole = ROLES.find(r => r.id === roleId);
    setRoleId(newRoleId);
    const now = Date.now();
    const clientId = `AUD-SW-${now}`;
    const entry: AuditEntry = {
      id: clientId,
      timestamp: new Date(now),
      actor: ACTOR_NAMES[newRoleId] ?? "Unknown",
      actorRole: newRole?.name ?? newRoleId,
      action: "ROLE_SWITCH",
      target: `${oldRole?.name ?? roleId} → ${newRole?.name ?? newRoleId}`,
      category: "auth",
      severity: "info",
      detail: `Session role switched from '${oldRole?.name}' to '${newRole?.name}' for demo purposes.`,
    };
    // Optimistic local update
    setLocalLog(prev => [entry, ...prev]);
    // Persist to DB
    appendMutation.mutate({
      clientId,
      ts: now,
      isoTime: new Date(now).toISOString(),
      actor: entry.actor,
      actorRole: entry.actorRole,
      action: entry.action,
      target: entry.target,
      category: entry.category,
      severity: entry.severity,
      detail: entry.detail,
    });
  }, [roleId, appendMutation]);

  const appendAudit = useCallback((entry: Omit<AuditEntry, "id" | "timestamp" | "actor" | "actorRole">) => {
    const now = Date.now();
    const clientId = `AUD-${now}-${Math.random().toString(36).slice(2, 6)}`;
    const full: AuditEntry = {
      ...entry,
      id: clientId,
      timestamp: new Date(now),
      actor: actorName,
      actorRole: role.name,
    };
    // Optimistic local update
    setLocalLog(prev => [full, ...prev]);
    // Persist to DB (also triggers push notification for critical events server-side)
    appendMutation.mutate({
      clientId,
      ts: now,
      isoTime: new Date(now).toISOString(),
      actor: actorName,
      actorRole: role.name,
      action: entry.action,
      target: entry.target,
      category: entry.category,
      severity: entry.severity,
      detail: entry.detail,
    });
  }, [actorName, role.name, appendMutation]);

  const clearAuditLog = useCallback(() => {
    clearMutation.mutate();
  }, [clearMutation]);

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
      auditLoading,
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
