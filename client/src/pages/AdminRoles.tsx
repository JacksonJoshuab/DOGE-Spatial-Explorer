/**
 * AdminRoles — /admin/roles
 * Role-Based Access Control panel for the City Administrator.
 * Assign the 8 municipal roles to staff accounts and control which
 * platform modules each role can access.
 *
 * Design: Civic Intelligence Light
 */
import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Shield, Users, Lock, Unlock, ChevronDown, ChevronUp,
  Plus, Pencil, Trash2, CheckCircle2, XCircle, Save, X,
  Eye, EyeOff, AlertTriangle, UserCog, Key, Building2, QrCode, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

// ─── Role definitions ─────────────────────────────────────────────────────────
export const ROLES = [
  {
    id: "city-admin",
    name: "City Administrator",
    description: "Full platform access including RBAC management, audit studio, and all department hubs.",
    color: "oklch(0.45 0.20 240)",
    icon: "🏛️",
    level: 5,
  },
  {
    id: "mayor",
    name: "Mayor / Council",
    description: "Read-only access to dashboards, transparency reports, and council packet generator.",
    color: "oklch(0.42 0.18 145)",
    icon: "⚖️",
    level: 4,
  },
  {
    id: "finance-director",
    name: "Finance Director",
    description: "Finance Hub, Capital Hub, Budget Amendment workflow, and CSV export access.",
    color: "oklch(0.65 0.20 55)",
    icon: "💰",
    level: 4,
  },
  {
    id: "police-chief",
    name: "Police Chief",
    description: "LE Hub, Evidence Room, SCIF, Detention Center, and body camera access.",
    color: "oklch(0.55 0.22 25)",
    icon: "🚔",
    level: 4,
  },
  {
    id: "public-works",
    name: "Public Works Director",
    description: "Utilities Hub, Spatial Map, IoT sensor management, and work order dispatch.",
    color: "oklch(0.50 0.18 200)",
    icon: "🔧",
    level: 3,
  },
  {
    id: "community-dev",
    name: "Community Dev Director",
    description: "Community Dev Hub, TIF districts, permits, grants, and budget amendment.",
    color: "oklch(0.55 0.18 290)",
    icon: "🏗️",
    level: 3,
  },
  {
    id: "parks-director",
    name: "Parks & Rec Director",
    description: "Parks Hub, trail sensors, facility reservations, and irrigation management.",
    color: "oklch(0.42 0.18 145)",
    icon: "🌳",
    level: 3,
  },
  {
    id: "it-admin",
    name: "IT Administrator",
    description: "Hardware Marketplace, IoT network, Resident Portal admin, and SCIF monitoring.",
    color: "oklch(0.45 0.20 240)",
    icon: "💻",
    level: 4,
  },
];

// ─── Module permissions matrix ────────────────────────────────────────────────
const MODULES = [
  { id: "dashboard",      label: "Main Dashboard",         category: "Core" },
  { id: "spatial-map",    label: "Spatial Map / IoT",       category: "Core" },
  { id: "audit-studio",   label: "Audit Studio",            category: "Core" },
  { id: "operations",     label: "Operations Center",       category: "Core" },
  { id: "transparency",   label: "Transparency Dashboard",  category: "Core" },
  { id: "council-report", label: "Council Report Generator",category: "Core" },
  { id: "finance-hub",    label: "Finance Hub",             category: "Finance" },
  { id: "capital-hub",    label: "Capital Hub",             category: "Finance" },
  { id: "hardware-mkt",   label: "Hardware Marketplace",    category: "Finance" },
  { id: "le-hub",         label: "LE Hub",                  category: "Departments" },
  { id: "utilities",      label: "Utilities Hub",           category: "Departments" },
  { id: "parks",          label: "Parks & Rec Hub",         category: "Departments" },
  { id: "community-dev",  label: "Community Dev Hub",       category: "Departments" },
  { id: "evidence-room",  label: "Evidence Room",           category: "Secure" },
  { id: "scif",           label: "SCIF Management",         category: "Secure" },
  { id: "detention",      label: "Detention Center",        category: "Secure" },
  { id: "records",        label: "Records Management",      category: "Secure" },
  { id: "resident-portal",label: "Resident Portal Admin",   category: "Resident" },
  { id: "ip-pipeline",    label: "IP Pipeline",             category: "Resident" },
  { id: "admin-roles",    label: "Admin: RBAC Panel",       category: "Admin" },
];

// Default permissions per role
const DEFAULT_PERMISSIONS: Record<string, Set<string>> = {
  "city-admin":     new Set(MODULES.map(m => m.id)),
  "mayor":          new Set(["dashboard","spatial-map","transparency","council-report","audit-studio","finance-hub","capital-hub"]),
  "finance-director": new Set(["dashboard","finance-hub","capital-hub","hardware-mkt","audit-studio","council-report","transparency","community-dev"]),
  "police-chief":   new Set(["dashboard","le-hub","evidence-room","scif","detention","records","spatial-map","operations"]),
  "public-works":   new Set(["dashboard","utilities","spatial-map","operations","hardware-mkt","records"]),
  "community-dev":  new Set(["dashboard","community-dev","transparency","finance-hub","records","spatial-map"]),
  "parks-director": new Set(["dashboard","parks","spatial-map","operations","records"]),
  "it-admin":       new Set(["dashboard","spatial-map","hardware-mkt","resident-portal","ip-pipeline","scif","records","operations"]),
};

// ─── Staff accounts ───────────────────────────────────────────────────────────
interface StaffAccount {
  id: string;
  name: string;
  email: string;
  roleId: string;
  department: string;
  active: boolean;
  lastLogin: string;
  mfaEnabled: boolean;
}

const INITIAL_STAFF: StaffAccount[] = [
  { id: "SA-001", name: "Leigh Ann Erickson", email: "lerickson@westlibertyia.gov", roleId: "city-admin", department: "Administration", active: true, lastLogin: "Today, 8:42 AM", mfaEnabled: true },
  { id: "SA-002", name: "Kevin Ollendieck", email: "kollendieck@westlibertyia.gov", roleId: "mayor", department: "City Council", active: true, lastLogin: "Yesterday, 2:15 PM", mfaEnabled: true },
  { id: "SA-003", name: "Brenda Sherwood", email: "bsherwood@westlibertyia.gov", roleId: "finance-director", department: "Finance", active: true, lastLogin: "Today, 9:01 AM", mfaEnabled: true },
  { id: "SA-004", name: "Chief James Doyle", email: "jdoyle@westlibertyia.gov", roleId: "police-chief", department: "Police", active: true, lastLogin: "Today, 7:30 AM", mfaEnabled: true },
  { id: "SA-005", name: "Marcus Webb", email: "mwebb@westlibertyia.gov", roleId: "public-works", department: "Public Works", active: true, lastLogin: "Today, 6:55 AM", mfaEnabled: false },
  { id: "SA-006", name: "Carla Mendez", email: "cmendez@westlibertyia.gov", roleId: "community-dev", department: "Community Development", active: true, lastLogin: "Mar 1, 3:40 PM", mfaEnabled: true },
  { id: "SA-007", name: "Tom Harrington", email: "tharrington@westlibertyia.gov", roleId: "parks-director", department: "Parks & Recreation", active: true, lastLogin: "Mar 1, 11:20 AM", mfaEnabled: false },
  { id: "SA-008", name: "Priya Nair", email: "pnair@westlibertyia.gov", roleId: "it-admin", department: "IT", active: true, lastLogin: "Today, 8:15 AM", mfaEnabled: true },
  { id: "SA-009", name: "Council Member Rivera", email: "jrivera@westlibertyia.gov", roleId: "mayor", department: "City Council", active: true, lastLogin: "Feb 28, 4:00 PM", mfaEnabled: false },
  { id: "SA-010", name: "Officer K. Thompson", email: "kthompson@westlibertyia.gov", roleId: "police-chief", department: "Police", active: false, lastLogin: "Feb 20, 1:00 PM", mfaEnabled: false },
];

const MODULE_CATEGORIES = ["Core", "Finance", "Departments", "Secure", "Resident", "Admin"];

export default function AdminRoles() {
  const { appendAudit } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, Set<string>>>(DEFAULT_PERMISSIONS);
  const [staff, setStaff] = useState<StaffAccount[]>(INITIAL_STAFF);
  const [activeView, setActiveView] = useState<"matrix" | "staff">("matrix");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(MODULE_CATEGORIES));
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", roleId: "public-works", department: "" });
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

  // ── MFA Enrollment modal state ─────────────────────────────────────────────
  const [mfaEnrollTarget, setMfaEnrollTarget] = useState<StaffAccount | null>(null);
  const [mfaStep, setMfaStep] = useState<"loading" | "scan" | "verify" | "done">("loading");
  const [mfaQrUrl, setMfaQrUrl] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const mfaCodeRef = useRef<HTMLInputElement>(null);

  const generateSecretMutation = trpc.mfa.generateSecret.useMutation();
  const verifyAndEnrollMutation = trpc.mfa.verifyAndEnroll.useMutation();

  const openMfaEnroll = async (member: StaffAccount) => {
    setMfaEnrollTarget(member);
    setMfaStep("loading");
    setMfaCode("");
    setMfaError("");
    try {
      const result = await generateSecretMutation.mutateAsync({
        openId: member.id,
        accountName: member.email,
      });
      setMfaSecret(result.secret);
      // Encode otpauth URI into a QR code via Google Charts API
      setMfaQrUrl(`https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(result.otpauthUrl)}`);
      setMfaStep("scan");
    } catch {
      toast.error("Failed to generate TOTP secret. Try again.");
      setMfaEnrollTarget(null);
    }
  };

  const submitMfaEnroll = async () => {
    if (mfaCode.length !== 6) { setMfaError("Enter a 6-digit code."); return; }
    setMfaError("");
    try {
      const result = await verifyAndEnrollMutation.mutateAsync({
        openId: mfaEnrollTarget!.id,
        code: mfaCode,
      });
      if (!result.success) {
        setMfaError(result.error ?? "Invalid code. Try again.");
        return;
      }
      setMfaStep("done");
      setStaff(prev => prev.map(s => s.id === mfaEnrollTarget!.id ? { ...s, mfaEnabled: true } : s));
      appendAudit({
        action: "MFA_ENROLLED",
        target: `${mfaEnrollTarget!.name} (${mfaEnrollTarget!.id})`,
        category: "rbac",
        severity: "info",
        detail: `MFA successfully enrolled for ${mfaEnrollTarget!.email} via TOTP.`,
      });
      toast.success(`MFA enrolled for ${mfaEnrollTarget!.name}`);
    } catch {
      setMfaError("Server error. Please try again.");
    }
  };

  const togglePermission = (roleId: string, moduleId: string) => {
    const wasGranted = permissions[roleId]?.has(moduleId);
    setPermissions(prev => {
      const next = { ...prev, [roleId]: new Set(prev[roleId]) };
      if (next[roleId].has(moduleId)) {
        next[roleId].delete(moduleId);
      } else {
        next[roleId].add(moduleId);
      }
      return next;
    });
    setPendingChanges(prev => new Set(Array.from(prev).concat(roleId)));
    const roleName = ROLES.find(r => r.id === roleId)?.name ?? roleId;
    const modLabel = MODULES.find(m => m.id === moduleId)?.label ?? moduleId;
    appendAudit({
      action: wasGranted ? "ROLE_REVOKED" : "ROLE_GRANTED",
      target: `${roleName} — ${modLabel}`,
      category: "rbac",
      severity: "warning",
      detail: `Module '${modLabel}' ${wasGranted ? "revoked from" : "granted to"} role '${roleName}'. Change pending save.`,
    });
  };

  const saveChanges = () => {
    const count = pendingChanges.size;
    const roleNames = Array.from(pendingChanges).map(id => ROLES.find(r => r.id === id)?.name ?? id).join(", ");
    setPendingChanges(new Set());
    toast.success(`Permissions saved for ${count} role${count > 1 ? "s" : ""}`);
    appendAudit({
      action: "PERMISSIONS_SAVED",
      target: roleNames,
      category: "rbac",
      severity: "info",
      detail: `Permission changes committed for ${count} role(s): ${roleNames}.`,
    });
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const addStaffMember = () => {
    if (!newStaff.name || !newStaff.email) {
      toast.error("Name and email are required");
      return;
    }
    const account: StaffAccount = {
      id: `SA-${String(staff.length + 1).padStart(3, "0")}`,
      name: newStaff.name,
      email: newStaff.email,
      roleId: newStaff.roleId,
      department: newStaff.department,
      active: true,
      lastLogin: "Never",
      mfaEnabled: false,
    };
    setStaff(prev => [...prev, account]);
    setNewStaff({ name: "", email: "", roleId: "public-works", department: "" });
    setShowAddStaff(false);
    toast.success(`${account.name} added — invitation email queued`);
    const roleName = ROLES.find(r => r.id === account.roleId)?.name ?? account.roleId;
    appendAudit({
      action: "STAFF_ADDED",
      target: `${account.name} (${account.id}) — ${roleName}`,
      category: "rbac",
      severity: "info",
      detail: `New staff account created: ${account.name} <${account.email}>, role '${roleName}', dept '${account.department}'.`,
    });
  };

  const toggleStaffActive = (id: string) => {
    const member = staff.find(s => s.id === id);
    setStaff(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
    toast.success(member?.active ? `${member?.name} deactivated` : `${member?.name} reactivated`);
    if (member) {
      appendAudit({
        action: member.active ? "STAFF_DEACTIVATED" : "STAFF_REACTIVATED",
        target: `${member.name} (${member.id})`,
        category: "rbac",
        severity: member.active ? "warning" : "info",
        detail: `Staff account ${member.id} (${member.name}) ${member.active ? "deactivated — all active sessions invalidated" : "reactivated — access restored"}.`,
      });
    }
  };

  const toggleMFA = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, mfaEnabled: !s.mfaEnabled } : s));
  };

  const getRoleById = (id: string) => ROLES.find(r => r.id === id);

  const filteredRoles = selectedRole ? ROLES.filter(r => r.id === selectedRole) : ROLES;

  return (
    <DashboardLayout title="Admin — Role-Based Access Control">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4" style={{ color: "oklch(0.45 0.20 240)" }} />
              <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "oklch(0.45 0.20 240)", fontFamily: "'JetBrains Mono', monospace" }}>
                Access Control
              </span>
            </div>
            <h1 className="text-2xl font-black" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
              Role-Based Access Control
            </h1>
            <p className="text-sm mt-1" style={{ color: "oklch(0.52 0.010 250)" }}>
              Manage staff accounts and module permissions for {ROLES.length} roles across {staff.filter(s => s.active).length} active users.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingChanges.size > 0 && (
              <button
                onClick={saveChanges}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: "oklch(0.45 0.20 240)", color: "#fff" }}
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes ({pendingChanges.size})
              </button>
            )}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Roles", value: ROLES.length, icon: UserCog, color: "oklch(0.45 0.20 240)" },
            { label: "Active Staff", value: staff.filter(s => s.active).length, icon: Users, color: "oklch(0.42 0.18 145)" },
            { label: "MFA Enabled", value: staff.filter(s => s.mfaEnabled).length, icon: Key, color: "oklch(0.65 0.20 55)" },
            { label: "Platform Modules", value: MODULES.length, icon: Building2, color: "oklch(0.55 0.18 290)" },
          ].map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-xl border p-4 flex items-center gap-3" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${kpi.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
                <div>
                  <div className="text-xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.18 0.018 250)" }}>{kpi.value}</div>
                  <div className="text-[11px]" style={{ color: "oklch(0.55 0.010 250)" }}>{kpi.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View toggle */}
        <div className="flex gap-2">
          {(["matrix", "staff"] as const).map(v => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeView === v ? "oklch(0.45 0.20 240)" : "oklch(1 0 0)",
                color: activeView === v ? "#fff" : "oklch(0.45 0.010 250)",
                border: `1px solid ${activeView === v ? "oklch(0.45 0.20 240)" : "oklch(0 0 0 / 10%)"}`,
              }}
            >
              {v === "matrix" ? "Permission Matrix" : "Staff Accounts"}
            </button>
          ))}
        </div>

        {/* ── Permission Matrix ── */}
        {activeView === "matrix" && (
          <div className="space-y-4">
            {/* Role filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold" style={{ color: "oklch(0.52 0.010 250)" }}>Filter by role:</span>
              <button
                onClick={() => setSelectedRole(null)}
                className="px-2.5 py-1 rounded text-[11px] font-semibold transition-all"
                style={{
                  background: !selectedRole ? "oklch(0.45 0.20 240)" : "oklch(0.965 0.005 240)",
                  color: !selectedRole ? "#fff" : "oklch(0.45 0.010 250)",
                  border: `1px solid ${!selectedRole ? "oklch(0.45 0.20 240)" : "oklch(0 0 0 / 8%)"}`,
                }}
              >
                All Roles
              </button>
              {ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(selectedRole === r.id ? null : r.id)}
                  className="px-2.5 py-1 rounded text-[11px] font-semibold transition-all"
                  style={{
                    background: selectedRole === r.id ? r.color : "oklch(0.965 0.005 240)",
                    color: selectedRole === r.id ? "#fff" : "oklch(0.45 0.010 250)",
                    border: `1px solid ${selectedRole === r.id ? r.color : "oklch(0 0 0 / 8%)"}`,
                  }}
                >
                  {r.icon} {r.name}
                </button>
              ))}
            </div>

            {/* Matrix table */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr style={{ background: "oklch(0.975 0.004 240)", borderBottom: "1px solid oklch(0 0 0 / 8%)" }}>
                      <th className="px-4 py-3 text-left font-bold sticky left-0 z-10" style={{ background: "oklch(0.975 0.004 240)", color: "oklch(0.45 0.010 250)", minWidth: 180 }}>
                        Module
                      </th>
                      {filteredRoles.map(role => (
                        <th key={role.id} className="px-3 py-3 text-center font-bold" style={{ color: role.color, minWidth: 100 }}>
                          <div>{role.icon}</div>
                          <div className="text-[9px] mt-0.5 leading-tight">{role.name}</div>
                          {pendingChanges.has(role.id) && (
                            <div className="text-[8px] mt-0.5" style={{ color: "oklch(0.65 0.20 55)" }}>● unsaved</div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULE_CATEGORIES.map(cat => {
                      const catModules = MODULES.filter(m => m.category === cat);
                      const isExpanded = expandedCategories.has(cat);
                      return (
                        <>
                          {/* Category header row */}
                          <tr
                            key={`cat-${cat}`}
                            onClick={() => toggleCategory(cat)}
                            className="cursor-pointer"
                            style={{ background: "oklch(0.965 0.005 240)", borderBottom: "1px solid oklch(0 0 0 / 6%)" }}
                          >
                            <td className="px-4 py-2 sticky left-0 z-10" style={{ background: "oklch(0.965 0.005 240)" }}>
                              <div className="flex items-center gap-2">
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: "oklch(0.45 0.010 250)" }}>{cat}</span>
                                <span className="text-[9px] font-mono" style={{ color: "oklch(0.60 0.010 250)" }}>({catModules.length})</span>
                              </div>
                            </td>
                            {filteredRoles.map(r => {
                              const grantedCount = catModules.filter(m => permissions[r.id]?.has(m.id)).length;
                              return (
                                <td key={r.id} className="px-3 py-2 text-center">
                                  <span className="text-[9px] font-mono" style={{ color: grantedCount === catModules.length ? "oklch(0.42 0.18 145)" : grantedCount === 0 ? "oklch(0.55 0.22 25)" : "oklch(0.65 0.20 55)" }}>
                                    {grantedCount}/{catModules.length}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                          {/* Module rows */}
                          {isExpanded && catModules.map((mod, idx) => (
                            <tr
                              key={mod.id}
                              style={{ background: idx % 2 === 0 ? "oklch(1 0 0)" : "oklch(0.990 0.002 240)", borderBottom: "1px solid oklch(0 0 0 / 4%)" }}
                            >
                              <td className="px-4 py-2.5 sticky left-0 z-10" style={{ background: idx % 2 === 0 ? "oklch(1 0 0)" : "oklch(0.990 0.002 240)" }}>
                                <div className="flex items-center gap-2">
                                  {mod.category === "Secure" && <Lock className="w-3 h-3 flex-shrink-0" style={{ color: "oklch(0.55 0.22 25)" }} />}
                                  <span style={{ color: "oklch(0.28 0.014 250)" }}>{mod.label}</span>
                                </div>
                              </td>
                              {filteredRoles.map(role => {
                                const granted = permissions[role.id]?.has(mod.id) ?? false;
                                const isSecure = mod.category === "Secure";
                                return (
                                  <td key={role.id} className="px-3 py-2.5 text-center">
                                    <button
                                      onClick={() => togglePermission(role.id, mod.id)}
                                      className="w-6 h-6 rounded flex items-center justify-center mx-auto transition-all"
                                      style={{
                                        background: granted
                                          ? isSecure ? "oklch(0.55 0.22 25 / 15%)" : `${role.color}15`
                                          : "oklch(0.965 0.005 240)",
                                        border: `1px solid ${granted
                                          ? isSecure ? "oklch(0.55 0.22 25 / 40%)" : `${role.color}40`
                                          : "oklch(0 0 0 / 10%)"}`,
                                      }}
                                      title={`${granted ? "Revoke" : "Grant"} ${mod.label} for ${role.name}`}
                                    >
                                      {granted
                                        ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: isSecure ? "oklch(0.55 0.22 25)" : role.color }} />
                                        : <XCircle className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.005 250)" }} />
                                      }
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {pendingChanges.size > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "oklch(0.65 0.20 55 / 8%)", border: "1px solid oklch(0.65 0.20 55 / 25%)" }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.40 0.018 250)" }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: "oklch(0.65 0.20 55)" }} />
                  <strong>{pendingChanges.size} role{pendingChanges.size > 1 ? "s" : ""}</strong> have unsaved permission changes.
                </div>
                <button
                  onClick={saveChanges}
                  className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold"
                  style={{ background: "oklch(0.45 0.20 240)", color: "#fff" }}
                >
                  <Save className="w-3.5 h-3.5" />
                  Save All Changes
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Staff Accounts ── */}
        {activeView === "staff" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>Staff Accounts</h3>
                <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{staff.filter(s => s.active).length} active · {staff.filter(s => !s.active).length} inactive · {staff.filter(s => !s.mfaEnabled && s.active).length} without MFA</p>
              </div>
              <button
                onClick={() => setShowAddStaff(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: "oklch(0.45 0.20 240)", color: "#fff" }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Staff
              </button>
            </div>

            {/* MFA warning */}
            {staff.filter(s => !s.mfaEnabled && s.active).length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: "oklch(0.65 0.20 55 / 8%)", border: "1px solid oklch(0.65 0.20 55 / 25%)", color: "oklch(0.40 0.018 250)" }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.65 0.20 55)" }} />
                <span><strong>{staff.filter(s => !s.mfaEnabled && s.active).length} active accounts</strong> do not have MFA enabled. Require MFA for all staff with access to secure modules.</span>
              </div>
            )}

            {/* Add staff form */}
            {showAddStaff && (
              <div className="rounded-xl border p-5" style={{ background: "oklch(0.975 0.004 240)", borderColor: "oklch(0.45 0.20 240 / 30%)", borderWidth: 2 }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>New Staff Account</h4>
                  <button onClick={() => setShowAddStaff(false)}><X className="w-4 h-4" style={{ color: "oklch(0.52 0.010 250)" }} /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Full Name", key: "name", placeholder: "Jane Smith" },
                    { label: "Email", key: "email", placeholder: "jsmith@westlibertyia.gov" },
                    { label: "Department", key: "department", placeholder: "Public Works" },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-[11px] font-semibold mb-1" style={{ color: "oklch(0.45 0.010 250)" }}>{field.label}</label>
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        value={newStaff[field.key as keyof typeof newStaff]}
                        onChange={e => setNewStaff(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                        style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 12%)", color: "oklch(0.18 0.018 250)" }}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "oklch(0.45 0.010 250)" }}>Role</label>
                    <select
                      value={newStaff.roleId}
                      onChange={e => setNewStaff(prev => ({ ...prev, roleId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                      style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 12%)", color: "oklch(0.18 0.018 250)" }}
                    >
                      {ROLES.map(r => (
                        <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={addStaffMember}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: "oklch(0.45 0.20 240)", color: "#fff" }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Account
                  </button>
                  <button
                    onClick={() => setShowAddStaff(false)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: "oklch(0.965 0.005 240)", color: "oklch(0.45 0.010 250)", border: "1px solid oklch(0 0 0 / 8%)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Staff table */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ background: "oklch(0.975 0.004 240)", borderBottom: "1px solid oklch(0 0 0 / 8%)" }}>
                      {["Staff Member", "Role", "Department", "Last Login", "MFA", "Status", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-bold" style={{ color: "oklch(0.45 0.010 250)", fontFamily: "'JetBrains Mono', monospace" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((member, idx) => {
                      const role = getRoleById(member.roleId);
                      return (
                        <tr
                          key={member.id}
                          style={{
                            background: !member.active ? "oklch(0.975 0.003 240)" : idx % 2 === 0 ? "oklch(1 0 0)" : "oklch(0.990 0.002 240)",
                            borderBottom: "1px solid oklch(0 0 0 / 5%)",
                            opacity: member.active ? 1 : 0.6,
                          }}
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>{member.name}</div>
                            <div className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{member.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-semibold"
                              style={{
                                background: `${role?.color ?? "oklch(0.45 0.20 240)"}15`,
                                color: role?.color ?? "oklch(0.45 0.20 240)",
                                border: `1px solid ${role?.color ?? "oklch(0.45 0.20 240)"}30`,
                              }}
                            >
                              {role?.icon} {role?.name}
                            </span>
                          </td>
                          <td className="px-4 py-3" style={{ color: "oklch(0.45 0.010 250)" }}>{member.department}</td>
                          <td className="px-4 py-3 font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{member.lastLogin}</td>
                          <td className="px-4 py-3">
                            {member.mfaEnabled ? (
                              <span
                                className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  background: "oklch(0.42 0.18 145 / 12%)",
                                  color: "oklch(0.38 0.18 145)",
                                  border: "1px solid oklch(0.42 0.18 145 / 30%)",
                                }}
                              >
                                <Key className="w-2.5 h-2.5" /> ON
                              </span>
                            ) : (
                              <button
                                onClick={() => member.active && openMfaEnroll(member)}
                                disabled={!member.active}
                                className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-all"
                                style={{
                                  background: "oklch(0.55 0.22 25 / 12%)",
                                  color: "oklch(0.48 0.22 25)",
                                  border: "1px solid oklch(0.55 0.22 25 / 30%)",
                                  opacity: member.active ? 1 : 0.5,
                                  cursor: member.active ? "pointer" : "not-allowed",
                                }}
                                title="Click to enroll in MFA"
                              >
                                <QrCode className="w-2.5 h-2.5" /> Enable
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-semibold"
                              style={{
                                background: member.active ? "oklch(0.42 0.18 145 / 12%)" : "oklch(0 0 0 / 6%)",
                                color: member.active ? "oklch(0.38 0.18 145)" : "oklch(0.52 0.010 250)",
                                border: `1px solid ${member.active ? "oklch(0.42 0.18 145 / 30%)" : "oklch(0 0 0 / 10%)"}`,
                              }}
                            >
                              {member.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => toggleStaffActive(member.id)}
                                className="p-1.5 rounded transition-all"
                                style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)" }}
                                title={member.active ? "Deactivate" : "Reactivate"}
                              >
                                {member.active
                                  ? <EyeOff className="w-3 h-3" style={{ color: "oklch(0.52 0.010 250)" }} />
                                  : <Eye className="w-3 h-3" style={{ color: "oklch(0.42 0.18 145)" }} />
                                }
                              </button>
                              <button
                                onClick={() => {
                                  setActiveView("matrix");
                                  setSelectedRole(member.roleId);
                                }}
                                className="p-1.5 rounded transition-all"
                                style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)" }}
                                title="View role permissions"
                              >
                                <Shield className="w-3 h-3" style={{ color: "oklch(0.45 0.20 240)" }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Role cards */}
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>Role Definitions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROLES.map(role => {
              const memberCount = staff.filter(s => s.roleId === role.id && s.active).length;
              const moduleCount = permissions[role.id]?.size ?? 0;
              return (
                <div
                  key={role.id}
                  className="rounded-xl border p-4 cursor-pointer transition-all"
                  style={{
                    background: selectedRole === role.id ? `${role.color}08` : "oklch(1 0 0)",
                    borderColor: selectedRole === role.id ? role.color : "oklch(0 0 0 / 8%)",
                    borderWidth: selectedRole === role.id ? 2 : 1,
                  }}
                  onClick={() => {
                    setSelectedRole(selectedRole === role.id ? null : role.id);
                    setActiveView("matrix");
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{role.icon}</span>
                    <div>
                      <div className="text-[12px] font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>{role.name}</div>
                      <div className="text-[9px] font-mono" style={{ color: "oklch(0.55 0.010 250)" }}>Level {role.level}</div>
                    </div>
                  </div>
                  <p className="text-[10px] mb-3 leading-relaxed" style={{ color: "oklch(0.45 0.010 250)" }}>{role.description}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span style={{ color: "oklch(0.55 0.010 250)" }}>
                      <Users className="w-3 h-3 inline mr-1" />{memberCount} staff
                    </span>
                    <span style={{ color: role.color }}>
                      <Shield className="w-3 h-3 inline mr-1" />{moduleCount} modules
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[11px] text-center py-2" style={{ color: "oklch(0.60 0.010 250)" }}>
          RBAC Admin Panel — City of West Liberty, IA · Changes are logged to the audit trail · Iowa Code Ch. 22 compliance
        </div>
      </div>

      {/* ── MFA Enrollment Modal ── */}
      {mfaEnrollTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 55%)" }}
          onClick={e => { if (e.target === e.currentTarget) setMfaEnrollTarget(null); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl shadow-2xl p-6"
            style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 10%)" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4" style={{ color: "oklch(0.45 0.20 240)" }} />
                <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>Enable MFA</span>
              </div>
              <button onClick={() => setMfaEnrollTarget(null)} className="p-1 rounded" style={{ color: "oklch(0.52 0.010 250)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] mb-4" style={{ color: "oklch(0.45 0.010 250)" }}>
              Enrolling <strong>{mfaEnrollTarget.name}</strong> ({mfaEnrollTarget.email})
            </p>

            {mfaStep === "loading" && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.45 0.20 240)" }} />
                <span className="text-[11px]" style={{ color: "oklch(0.52 0.010 250)" }}>Generating TOTP secret…</span>
              </div>
            )}

            {mfaStep === "scan" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-2 rounded-xl" style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                    <img src={mfaQrUrl} alt="TOTP QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-[10px] text-center" style={{ color: "oklch(0.52 0.010 250)" }}>
                    Scan with Google Authenticator, Authy, or any TOTP app
                  </p>
                </div>
                <div className="rounded-lg p-2" style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 6%)" }}>
                  <div className="text-[9px] font-bold mb-1" style={{ color: "oklch(0.52 0.010 250)" }}>MANUAL ENTRY KEY</div>
                  <div className="font-mono text-[10px] break-all" style={{ color: "oklch(0.18 0.018 250)" }}>{mfaSecret}</div>
                </div>
                <button
                  onClick={() => { setMfaStep("verify"); setTimeout(() => mfaCodeRef.current?.focus(), 50); }}
                  className="w-full py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: "oklch(0.45 0.20 240)", color: "oklch(1 0 0)" }}
                >
                  I've scanned the code →
                </button>
              </div>
            )}

            {mfaStep === "verify" && (
              <div className="space-y-4">
                <p className="text-[11px]" style={{ color: "oklch(0.45 0.010 250)" }}>
                  Enter the 6-digit code from your authenticator app to confirm enrollment.
                </p>
                <input
                  ref={mfaCodeRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={e => { setMfaCode(e.target.value.replace(/\D/g, "")); setMfaError(""); }}
                  onKeyDown={e => e.key === "Enter" && submitMfaEnroll()}
                  placeholder="000000"
                  className="w-full text-center text-2xl font-mono tracking-[0.4em] py-3 rounded-lg outline-none"
                  style={{
                    background: "oklch(0.97 0.003 240)",
                    border: `1px solid ${mfaError ? "oklch(0.55 0.22 25)" : "oklch(0 0 0 / 12%)"}`,
                    color: "oklch(0.18 0.018 250)",
                  }}
                />
                {mfaError && <p className="text-[10px]" style={{ color: "oklch(0.55 0.22 25)" }}>{mfaError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => setMfaStep("scan")}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)", color: "oklch(0.45 0.010 250)" }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={submitMfaEnroll}
                    disabled={verifyAndEnrollMutation.isPending}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1"
                    style={{ background: "oklch(0.45 0.20 240)", color: "oklch(1 0 0)", opacity: verifyAndEnrollMutation.isPending ? 0.7 : 1 }}
                  >
                    {verifyAndEnrollMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Verify & Enroll
                  </button>
                </div>
              </div>
            )}

            {mfaStep === "done" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "oklch(0.42 0.18 145 / 15%)" }}>
                  <CheckCircle2 className="w-6 h-6" style={{ color: "oklch(0.38 0.18 145)" }} />
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm mb-1" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>MFA Enrolled</div>
                  <p className="text-[11px]" style={{ color: "oklch(0.52 0.010 250)" }}>
                    {mfaEnrollTarget.name} can now authenticate with their TOTP app.
                  </p>
                </div>
                <button
                  onClick={() => setMfaEnrollTarget(null)}
                  className="w-full py-2 rounded-lg text-sm font-semibold"
                  style={{ background: "oklch(0.42 0.18 145)", color: "oklch(1 0 0)" }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
