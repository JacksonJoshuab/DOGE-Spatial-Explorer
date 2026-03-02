/**
 * AuditStudio — Civic Intelligence Dark
 * Audit findings management with West Liberty FY2024 data
 */
import DashboardLayout from "@/components/DashboardLayout";
import { AlertTriangle, CheckCircle2, Clock, Shield, FileText, TrendingUp, DollarSign, Download, Printer, Activity, UserCog, ShieldAlert, Database, Lock } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useAuth, AuditEntry } from "@/contexts/AuthContext";

function exportAuditPDF(findings: typeof FINDINGS) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const openFindings = findings.filter(f => f.status === "open");
  const inProgress = findings.filter(f => f.status === "in-progress");
  const resolved = findings.filter(f => f.status === "resolved");
  const totalExposure = findings.filter(f => f.status !== "resolved").reduce((s, f) => s + f.amount, 0);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>West Liberty FY2024 Audit Findings Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DM Sans', Arial, sans-serif; font-size: 11px; color: #1a1f2e; background: white; padding: 40px; }
    .header { border-bottom: 3px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px; }
    .city-name { font-size: 20px; font-weight: 700; color: #1e40af; letter-spacing: -0.5px; }
    .report-title { font-size: 14px; font-weight: 600; color: #374151; margin-top: 4px; }
    .meta { font-size: 10px; color: #6b7280; margin-top: 6px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .summary-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }
    .summary-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; }
    .summary-value { font-size: 22px; font-weight: 700; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; margin-top: 24px; }
    .finding { border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px; margin-bottom: 10px; page-break-inside: avoid; }
    .finding-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .finding-id { font-family: monospace; font-size: 10px; color: #6b7280; }
    .badges { display: flex; gap: 6px; }
    .badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px; text-transform: uppercase; }
    .badge-critical { background: #fef2f2; color: #dc2626; }
    .badge-high { background: #fffbeb; color: #d97706; }
    .badge-medium { background: #eff6ff; color: #2563eb; }
    .badge-low { background: #f0fdf4; color: #16a34a; }
    .badge-open { background: #fef2f2; color: #dc2626; }
    .badge-in-progress { background: #fffbeb; color: #d97706; }
    .badge-resolved { background: #f0fdf4; color: #16a34a; }
    .finding-title { font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .finding-dept { font-size: 10px; color: #6b7280; margin-bottom: 8px; }
    .label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 3px; }
    .text { font-size: 10px; color: #374151; line-height: 1.5; margin-bottom: 8px; }
    .meta-row { display: flex; gap: 24px; margin-top: 8px; }
    .meta-item { font-size: 10px; }
    .exposure { font-weight: 700; color: #dc2626; font-family: monospace; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 9px; color: #9ca3af; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="city-name">City of West Liberty, Iowa</div>
    <div class="report-title">FY2024 Audit Findings Report — City Council Packet</div>
    <div class="meta">Prepared by: DOGE Municipal Platform · Generated: ${dateStr} · Confidential — For Official Use Only</div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-label">Open Findings</div>
      <div class="summary-value" style="color:#dc2626">${openFindings.length}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">In Progress</div>
      <div class="summary-value" style="color:#d97706">${inProgress.length}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Resolved</div>
      <div class="summary-value" style="color:#16a34a">${resolved.length}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Total Exposure</div>
      <div class="summary-value" style="color:#dc2626;font-size:16px">\$${totalExposure.toLocaleString()}</div>
    </div>
  </div>

  ${["open", "in-progress", "resolved"].map(status => {
    const group = findings.filter(f => f.status === status);
    if (group.length === 0) return "";
    return `
    <div class="section-title">${status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)} Findings (${group.length})</div>
    ${group.map(f => `
    <div class="finding">
      <div class="finding-header">
        <div class="finding-id">${f.id}</div>
        <div class="badges">
          <span class="badge badge-${f.severity}">${f.severity}</span>
          <span class="badge badge-${f.status}">${f.status}</span>
        </div>
      </div>
      <div class="finding-title">${f.title}</div>
      <div class="finding-dept">${f.dept}</div>
      <div class="label">Finding</div>
      <div class="text">${f.description}</div>
      <div class="label">Recommendation</div>
      <div class="text">${f.recommendation}</div>
      <div class="meta-row">
        <div class="meta-item"><strong>Due Date:</strong> ${f.dueDate}</div>
        ${f.amount > 0 ? `<div class="meta-item"><strong>Financial Exposure:</strong> <span class="exposure">\$${f.amount.toLocaleString()}</span></div>` : ""}
      </div>
    </div>`).join("")}
    `;
  }).join("")}

  <div class="footer">
    <span>City of West Liberty, Iowa · 111 W 7th Street · (319) 627-2418 · cityhall@westlibertyia.gov</span>
    <span>DOGE Municipal Platform · FY2024 Audit Report · Page 1 of 1</span>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
  toast.success("Audit report opened — use Print → Save as PDF for City Council packet");
}

const FINDINGS = [
  {
    id: "AUD-2024-001",
    title: "Community Development Budget Overrun",
    dept: "Community Development",
    severity: "critical",
    status: "open",
    amount: 76000,
    description: "FY2024 Community Development expenditures reached $581,000 against a $505,000 budget — a 115% utilization rate and $76,000 overrun. Root cause: unbudgeted consultant fees for TIF district planning.",
    recommendation: "Implement real-time budget alerts at 80% and 95% thresholds. Require pre-approval for expenditures exceeding 10% of remaining budget.",
    dueDate: "2025-03-31",
  },
  {
    id: "AUD-2024-002",
    title: "TIF District Revenue Variance",
    dept: "Finance",
    severity: "high",
    status: "in-progress",
    amount: 47000,
    description: "Tax Increment Financing district revenues came in $47,000 below projection due to delayed commercial development on parcels 12-14 of the downtown TIF zone.",
    recommendation: "Update TIF revenue projections quarterly. Establish contingency reserve equal to 15% of projected TIF revenues.",
    dueDate: "2025-06-30",
  },
  {
    id: "AUD-2024-003",
    title: "Intergovernmental Revenue Shortfall",
    dept: "General Government",
    severity: "high",
    status: "in-progress",
    amount: 89000,
    description: "State shared revenue and road use tax receipts were $89,000 below FY2024 budget projections, primarily due to delayed Iowa DOT distributions.",
    recommendation: "Build 5% contingency buffer into intergovernmental revenue projections. Establish direct communication channel with Iowa DAS for early warning.",
    dueDate: "2025-04-30",
  },
  {
    id: "AUD-2024-004",
    title: "Water Utility Capital Reserve Underfunding",
    dept: "Water Utility",
    severity: "medium",
    status: "open",
    amount: 124000,
    description: "Water utility capital reserve fund balance is $124,000 below the minimum 10% of annual revenue target required by the 2022 revenue bond covenants.",
    recommendation: "Increase water rate by 3.5% effective FY2025 Q1. Transfer $62,000 from operating surplus to capital reserve by December 31.",
    dueDate: "2025-12-31",
  },
  {
    id: "AUD-2024-005",
    title: "Debt Service Coverage Ratio",
    dept: "Finance",
    severity: "medium",
    status: "resolved",
    amount: 0,
    description: "FY2024 debt service coverage ratio of 1.23x is above the 1.10x bond covenant minimum but below the 1.35x target. Total outstanding debt: $1,823,964.",
    recommendation: "Maintain current debt service schedule. Avoid new general obligation issuance until coverage ratio exceeds 1.40x.",
    dueDate: "2024-12-31",
  },
  {
    id: "AUD-2024-006",
    title: "Parks & Recreation Equipment Procurement",
    dept: "Parks & Recreation",
    severity: "low",
    status: "resolved",
    amount: 0,
    description: "Three equipment purchases between $5,000–$10,000 were not competitively bid as required by Iowa Code §26.3 for purchases over $5,000.",
    recommendation: "Implement automated procurement workflow requiring competitive bid documentation for all purchases over $5,000.",
    dueDate: "2024-12-31",
  },
];

const SEVERITY_CONFIG = {
  critical: { color: "oklch(0.50 0.22 25)", label: "Critical", bg: "oklch(0.50 0.22 25 / 10%)" },
  high: { color: "oklch(0.55 0.18 75)", label: "High", bg: "oklch(0.55 0.18 75 / 10%)" },
  medium: { color: "oklch(0.40 0.18 240)", label: "Medium", bg: "oklch(0.70 0.18 240 / 12%)" },
  low: { color: "oklch(0.45 0.18 145)", label: "Low", bg: "oklch(0.45 0.18 145 / 10%)" },
};

const STATUS_CONFIG = {
  open: { color: "oklch(0.50 0.22 25)", label: "Open" },
  "in-progress": { color: "oklch(0.55 0.18 75)", label: "In Progress" },
  resolved: { color: "oklch(0.45 0.18 145)", label: "Resolved" },
};

const CATEGORY_CONFIG: Record<AuditEntry["category"], { label: string; color: string; icon: React.ElementType }> = {
  rbac:   { label: "RBAC",   color: "oklch(0.50 0.22 280)", icon: UserCog },
  access: { label: "Access", color: "oklch(0.55 0.22 25)",  icon: ShieldAlert },
  auth:   { label: "Auth",   color: "oklch(0.50 0.18 240)", icon: Lock },
  data:   { label: "Data",   color: "oklch(0.45 0.18 145)", icon: Database },
  iot:    { label: "IoT",    color: "oklch(0.50 0.18 75)",  icon: Activity },
};

const SEVERITY_AUDIT_CONFIG: Record<AuditEntry["severity"], { color: string; bg: string }> = {
  info:     { color: "oklch(0.45 0.18 145)", bg: "oklch(0.45 0.18 145 / 10%)" },
  warning:  { color: "oklch(0.55 0.18 75)",  bg: "oklch(0.55 0.18 75 / 12%)" },
  critical: { color: "oklch(0.50 0.22 25)",  bg: "oklch(0.50 0.22 25 / 12%)" },
};

export default function AuditStudio() {
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const { auditLog, clearAuditLog } = useAuth();
  const filtered = filter === "all" ? FINDINGS : FINDINGS.filter(f => f.status === filter || f.severity === filter);

  const selectedFinding = FINDINGS.find(f => f.id === selected);

  const openCount = FINDINGS.filter(f => f.status === "open").length;
  const inProgressCount = FINDINGS.filter(f => f.status === "in-progress").length;
  const resolvedCount = FINDINGS.filter(f => f.status === "resolved").length;
  const totalExposure = FINDINGS.filter(f => f.status !== "resolved").reduce((s, f) => s + f.amount, 0);

  return (
    <DashboardLayout title="Audit Studio — FY2024">
      <div className="p-6 space-y-6">
        {/* Export toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>Audit Studio</h1>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>FY2024 Audit Findings · City of West Liberty, Iowa</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportAuditPDF(FINDINGS)}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-all"
              style={{ background: "oklch(0.40 0.18 240)", color: "oklch(0.97 0.004 240)" }}
            >
              <Printer className="w-3.5 h-3.5" />
              Export for City Council
            </button>
            <button
              onClick={() => exportAuditPDF(FINDINGS.filter(f => f.status !== "resolved"))}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-all"
              style={{ background: "oklch(0 0 0 / 5%)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.35 0.018 250)" }}
            >
              <Download className="w-3.5 h-3.5" />
              Open Findings Only
            </button>
          </div>
        </div>
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Open Findings", value: openCount, icon: AlertTriangle, color: "oklch(0.50 0.22 25)" },
            { label: "In Progress", value: inProgressCount, icon: Clock, color: "oklch(0.55 0.18 75)" },
            { label: "Resolved", value: resolvedCount, icon: CheckCircle2, color: "oklch(0.45 0.18 145)" },
            { label: "Financial Exposure", value: `$${totalExposure.toLocaleString()}`, icon: DollarSign, color: "oklch(0.50 0.22 25)" },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-lg" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
              <stat.icon className="w-4 h-4 mb-2" style={{ color: stat.color }} />
              <div className="metric-value text-2xl" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {["all", "open", "in-progress", "resolved", "critical", "high", "medium"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 rounded text-xs font-medium capitalize transition-all"
              style={{
                background: filter === f ? "oklch(0.45 0.20 240 / 15%)" : "oklch(1 0 0)",
                border: `1px solid ${filter === f ? "oklch(0.45 0.20 240 / 30%)" : "oklch(0 0 0 / 8%)"}`,
                color: filter === f ? "oklch(0.40 0.18 240)" : "oklch(0.45 0.012 250)",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Findings list */}
          <div className="space-y-2">
            {filtered.map((finding) => {
              const sev = SEVERITY_CONFIG[finding.severity as keyof typeof SEVERITY_CONFIG];
              const sta = STATUS_CONFIG[finding.status as keyof typeof STATUS_CONFIG];
              return (
                <button
                  key={finding.id}
                  onClick={() => setSelected(finding.id === selected ? null : finding.id)}
                  className="w-full text-left p-4 rounded-lg transition-all"
                  style={{
                    background: selected === finding.id ? "oklch(0.96 0.006 240)" : "oklch(1 0 0)",
                    border: `1px solid ${selected === finding.id ? "oklch(0.45 0.20 240 / 20%)" : "oklch(0 0 0 / 8%)"}`,
                    borderLeft: `3px solid ${sev.color}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="text-xs font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{finding.id}</div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: sev.bg, color: sev.color }}>{sev.label}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: `${sta.color.replace(")", " / 12%)")}`, color: sta.color }}>{sta.label}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold mb-1" style={{ color: "oklch(0.25 0.018 250)" }}>{finding.title}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>{finding.dept}</span>
                    {finding.amount > 0 && (
                      <span className="text-[10px] font-mono font-bold" style={{ color: "oklch(0.50 0.22 25)" }}>
                        ${finding.amount.toLocaleString()} exposure
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div>
            {selectedFinding ? (
              <div className="p-5 rounded-xl sticky top-4" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                <div className="text-xs font-mono mb-1" style={{ color: "oklch(0.52 0.010 250)" }}>{selectedFinding.id}</div>
                <h3 className="text-base font-bold mb-3" style={{ color: "oklch(0.18 0.018 250)", fontFamily: "'Syne', sans-serif" }}>{selectedFinding.title}</h3>
                <div className="space-y-4">
                  <div>
                    <div className="section-label mb-1.5">Finding</div>
                    <p className="text-xs leading-relaxed" style={{ color: "oklch(0.60 0.010 250)" }}>{selectedFinding.description}</p>
                  </div>
                  <div>
                    <div className="section-label mb-1.5">Recommendation</div>
                    <p className="text-xs leading-relaxed" style={{ color: "oklch(0.60 0.010 250)" }}>{selectedFinding.recommendation}</p>
                  </div>
                  <div className="flex gap-3">
                    <div>
                      <div className="section-label mb-0.5">Due Date</div>
                      <div className="text-xs font-mono" style={{ color: "oklch(0.40 0.18 240)" }}>{selectedFinding.dueDate}</div>
                    </div>
                    {selectedFinding.amount > 0 && (
                      <div>
                        <div className="section-label mb-0.5">Financial Exposure</div>
                        <div className="text-xs font-mono font-bold" style={{ color: "oklch(0.50 0.22 25)" }}>${selectedFinding.amount.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toast.success(`Remediation plan opened for ${selectedFinding.id}`)}
                    className="w-full py-2 rounded text-xs font-semibold"
                    style={{ background: "oklch(0.45 0.20 240)", color: "oklch(0.18 0.018 250)" }}
                  >
                    Open Remediation Plan
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 rounded-xl" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                <Shield className="w-8 h-8 mb-2" style={{ color: "oklch(0.45 0.012 250)" }} />
                <div className="text-xs" style={{ color: "oklch(0.48 0.012 250)" }}>Select a finding to view details</div>
              </div>
            )}
          </div>
        </div>
        {/* RBAC & Access Audit Log */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: "oklch(0.45 0.20 240)" }} />
              <h2 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>RBAC &amp; Access Audit Log</h2>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "oklch(0.45 0.20 240 / 10%)", color: "oklch(0.40 0.18 240)", border: "1px solid oklch(0.45 0.20 240 / 20%)" }}>
                {auditLog.length} entries
              </span>
            </div>
            <button
              onClick={() => { clearAuditLog(); toast.success("Audit log cleared"); }}
              className="text-[10px] px-2 py-1 rounded font-medium transition-all"
              style={{ background: "oklch(0 0 0 / 5%)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.52 0.010 250)" }}
            >
              Clear Log
            </button>
          </div>

          {auditLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
              <Shield className="w-8 h-8 mb-2" style={{ color: "oklch(0.70 0.010 250)" }} />
              <div className="text-xs" style={{ color: "oklch(0.52 0.010 250)" }}>No audit events recorded yet</div>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0 0 0 / 8%)" }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "oklch(0.965 0.005 240)", borderBottom: "1px solid oklch(0 0 0 / 8%)" }}>
                    {["ID", "Time", "Actor", "Category", "Action", "Target", "Severity"].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 font-bold text-[9px] uppercase tracking-wider" style={{ color: "oklch(0.45 0.010 250)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry, i) => {
                    const cat = CATEGORY_CONFIG[entry.category];
                    const sev = SEVERITY_AUDIT_CONFIG[entry.severity];
                    const CatIcon = cat.icon;
                    return (
                      <tr
                        key={entry.id}
                        className="transition-colors"
                        style={{ background: i % 2 === 0 ? "oklch(1 0 0)" : "oklch(0.985 0.003 240)", borderBottom: "1px solid oklch(0 0 0 / 5%)" }}
                        title={entry.detail}
                      >
                        <td className="px-3 py-2.5 font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{entry.id}</td>
                        <td className="px-3 py-2.5 font-mono whitespace-nowrap" style={{ color: "oklch(0.52 0.010 250)" }}>
                          {entry.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold" style={{ color: "oklch(0.25 0.018 250)" }}>{entry.actor}</div>
                          <div className="text-[9px]" style={{ color: "oklch(0.55 0.010 250)" }}>{entry.actorRole}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded w-fit" style={{ background: `${cat.color.replace(")", " / 12%)")}`, color: cat.color }}>
                            <CatIcon className="w-2.5 h-2.5" />
                            {cat.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono font-semibold text-[10px]" style={{ color: "oklch(0.35 0.018 250)" }}>{entry.action}</td>
                        <td className="px-3 py-2.5 max-w-[200px] truncate" style={{ color: "oklch(0.45 0.010 250)" }} title={entry.target}>{entry.target}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: sev.bg, color: sev.color }}>
                            {entry.severity}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
