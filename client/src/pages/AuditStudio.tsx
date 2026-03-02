/**
 * AuditStudio — Civic Intelligence Dark
 * Audit findings management with West Liberty FY2024 data
 */
import DashboardLayout from "@/components/DashboardLayout";
import { AlertTriangle, CheckCircle2, Clock, Shield, FileText, TrendingUp, DollarSign } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

export default function AuditStudio() {
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = filter === "all" ? FINDINGS : FINDINGS.filter(f => f.status === filter || f.severity === filter);
  const selectedFinding = FINDINGS.find(f => f.id === selected);

  const openCount = FINDINGS.filter(f => f.status === "open").length;
  const inProgressCount = FINDINGS.filter(f => f.status === "in-progress").length;
  const resolvedCount = FINDINGS.filter(f => f.status === "resolved").length;
  const totalExposure = FINDINGS.filter(f => f.status !== "resolved").reduce((s, f) => s + f.amount, 0);

  return (
    <DashboardLayout title="Audit Studio — FY2024">
      <div className="p-6 space-y-6">
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
      </div>
    </DashboardLayout>
  );
}
