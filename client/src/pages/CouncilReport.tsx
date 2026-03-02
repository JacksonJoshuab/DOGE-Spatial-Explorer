/**
 * CouncilReport — City Council Report Generator
 * Assembles a formatted monthly packet from Audit Studio, Community Dev,
 * and Department Hub summaries. Print-ready via window.print().
 */
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Printer, FileText, CheckSquare, Square, AlertTriangle,
  TrendingUp, TrendingDown, Shield, Droplets, ShieldCheck,
  Trees, HardHat, Wrench, BarChart3, Calendar, Building2,
  ChevronDown, ChevronUp, Download
} from "lucide-react";

const MEETING_DATE = "March 10, 2026";
const REPORT_PERIOD = "FY2024 Annual Review — Q3 Update";

// ── Audit findings ────────────────────────────────────────────────────────────
const AUDIT_FINDINGS = [
  { id: "AF-2024-001", severity: "critical", dept: "Community Development", title: "Budget Overrun — 115% of Approved Appropriation", amount: "$187,100", detail: "Actual expenditures of $697,100 exceeded the approved budget of $510,000. Primary drivers: contracted services (+$57K), legal/consulting (+$33.4K), grant match obligations (+$25K). Immediate remediation plan required." },
  { id: "AF-2024-002", severity: "high", dept: "Community Development", title: "TIF District Revenue Shortfall", amount: "$47,000", detail: "Downtown Urban Renewal TIF (TIF-1) collected $89,000 against a projected $136,000 — a 34.6% shortfall attributed to delayed commercial property reassessments." },
  { id: "AF-2024-003", severity: "high", dept: "Finance", title: "Intergovernmental Revenue Variance", amount: "$124,000", detail: "State shared revenue receipts came in $124,000 below projection due to revised state allocation formula. Finance Director has filed a formal inquiry with IEDA." },
  { id: "AF-2024-004", severity: "medium", dept: "Public Works", title: "Capital Project Carryover — Water Main Replacement", amount: "$310,000", detail: "Phase 2 of the Calhoun St water main replacement was not completed in FY2024. $310,000 appropriation carried forward to FY2025 per Iowa Code §384.20." },
  { id: "AF-2024-005", severity: "medium", dept: "Police", title: "Fleet Maintenance Deferred", amount: "$28,400", detail: "Three patrol vehicles exceeded recommended service intervals. Deferred maintenance totaling $28,400 has been added to FY2025 Public Safety budget request." },
  { id: "AF-2024-006", severity: "low", dept: "Parks & Recreation", title: "Irrigation System Upgrade Delayed", amount: "$14,200", detail: "IrriSmart sensor deployment at Wildcat Park delayed to FY2025 due to supply chain constraints. No material budget impact." },
];

// ── Department summaries ──────────────────────────────────────────────────────
const DEPT_SUMMARIES = [
  { name: "Police Department", icon: ShieldCheck, budget: 1842000, actual: 1700000, pct: 92, status: "under", note: "$142K under budget. Vacancy savings from 2 unfilled officer positions." },
  { name: "Public Works", icon: Wrench, budget: 2180000, actual: 2095000, pct: 96, status: "under", note: "$85K under budget. Capital project carryover of $310K to FY2025." },
  { name: "Water/Sewer Utilities", icon: Droplets, budget: 4320000, actual: 4280000, pct: 99, status: "on-track", note: "On target. Rate study underway for FY2026 rate adjustment." },
  { name: "Parks & Recreation", icon: Trees, budget: 680000, actual: 589000, pct: 87, status: "under", note: "$91K under budget. IrriSmart deployment deferred to FY2025." },
  { name: "Community Development", icon: HardHat, budget: 510000, actual: 697100, pct: 137, status: "over", note: "CRITICAL: 115% overrun. See AF-2024-001. Remediation plan due March 15." },
  { name: "Administration/Finance", icon: BarChart3, budget: 1240000, actual: 1198000, pct: 97, status: "on-track", note: "On target. Audit fees $12K above projection; offset by personnel savings." },
  { name: "Fire/EMS (contracted)", icon: Shield, budget: 890000, actual: 890000, pct: 100, status: "on-track", note: "Fixed-cost contract with Muscatine County. No variance." },
];

// ── IoT / operational highlights ─────────────────────────────────────────────
const IOT_HIGHLIGHTS = [
  { label: "Active IoT sensor nodes", value: "47", trend: "up" },
  { label: "Work orders closed this quarter", value: "83", trend: "up" },
  { label: "Avg. work order response time", value: "4.2 hrs", trend: "down" },
  { label: "Water main pressure alerts resolved", value: "12 / 12", trend: "up" },
  { label: "Lift station uptime", value: "99.7%", trend: "up" },
  { label: "Open critical alerts", value: "3", trend: "neutral" },
];

// ── Financial summary ─────────────────────────────────────────────────────────
const FINANCIAL = {
  totalRevenue: 17505461,
  totalExpenses: 17333093,
  surplus: 172368,
  debtOutstanding: 1823964,
  debtLimit: 91200000,
  debtPct: 2.0,
  generalFundBalance: 2840000,
};

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtM = (n: number) => `$${(n / 1000000).toFixed(2)}M`;

const severityColor: Record<string, string> = {
  critical: "oklch(0.50 0.22 25)",
  high: "oklch(0.55 0.20 35)",
  medium: "oklch(0.60 0.18 55)",
  low: "oklch(0.50 0.18 145)",
};

const SECTIONS = [
  { id: "cover", label: "Cover Page" },
  { id: "financial", label: "Financial Summary" },
  { id: "audit", label: "Audit Findings" },
  { id: "departments", label: "Department Summaries" },
  { id: "operations", label: "Operations & IoT" },
  { id: "action", label: "Action Items" },
];

export default function CouncilReport() {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(SECTIONS.map(s => [s.id, true]))
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handlePrint = () => {
    window.print();
  };

  const criticalCount = AUDIT_FINDINGS.filter(f => f.severity === "critical").length;
  const highCount = AUDIT_FINDINGS.filter(f => f.severity === "high").length;

  return (
    <DashboardLayout title="City Council Report Generator">
      {/* Print styles injected inline */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { page-break-after: always; }
          body { background: white !important; }
          .print-area { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="p-4 md:p-6 space-y-6">

        {/* Controls — hidden on print */}
        <div className="no-print rounded-xl border p-5 space-y-4" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                Report Configuration
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                Select sections to include in the Council packet, then click Print / Export.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-[12px]"
                onClick={() => setSelected(Object.fromEntries(SECTIONS.map(s => [s.id, true])))}
              >
                Select All
              </Button>
              <Button
                onClick={handlePrint}
                size="sm"
                className="text-[12px] gap-1.5"
                style={{ background: "oklch(0.35 0.18 250)", color: "white" }}
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Export PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] text-left transition-all"
                style={{
                  background: selected[s.id] ? "oklch(0.35 0.18 250 / 8%)" : "transparent",
                  borderColor: selected[s.id] ? "oklch(0.35 0.18 250 / 40%)" : "oklch(0 0 0 / 10%)",
                  color: selected[s.id] ? "oklch(0.28 0.18 250)" : "oklch(0.50 0.010 250)",
                }}
              >
                {selected[s.id]
                  ? <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.35 0.18 250)" }} />
                  : <Square className="w-3.5 h-3.5 flex-shrink-0" />
                }
                {s.label}
              </button>
            ))}
          </div>

          {/* Alert summary */}
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "oklch(0.50 0.22 25)" }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              <strong>{criticalCount}</strong> critical finding{criticalCount !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "oklch(0.55 0.20 35)" }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              <strong>{highCount}</strong> high-priority finding{highCount !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "oklch(0.45 0.18 145)" }}>
              <Calendar className="w-3.5 h-3.5" />
              Meeting date: <strong>{MEETING_DATE}</strong>
            </div>
          </div>
        </div>

        {/* ── PRINT AREA ── */}
        <div className="print-area space-y-6 max-w-4xl mx-auto">

          {/* COVER PAGE */}
          {selected.cover && (
            <div className="print-page rounded-xl border overflow-hidden" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="p-8 text-center" style={{ background: "oklch(0.18 0.020 250)" }}>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.45 0.20 240 / 25%)", border: "1px solid oklch(0.55 0.20 240 / 40%)" }}>
                    <Building2 className="w-6 h-6" style={{ color: "oklch(0.72 0.18 240)" }} />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.95 0.008 240)" }}>
                  City of West Liberty, Iowa
                </div>
                <div className="text-base mb-4" style={{ color: "oklch(0.65 0.010 250)" }}>
                  City Council Regular Meeting
                </div>
                <div className="text-3xl font-bold mb-2" style={{ fontFamily: "'Syne', sans-serif", color: "white" }}>
                  Monthly Operations Report
                </div>
                <div className="text-base" style={{ color: "oklch(0.72 0.18 240)" }}>{REPORT_PERIOD}</div>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4 border-t" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
                {[
                  { label: "Meeting Date", value: MEETING_DATE },
                  { label: "Prepared By", value: "DOGE Municipal Platform" },
                  { label: "City Administrator", value: "Matt Muckler" },
                  { label: "Total Revenue", value: fmtM(FINANCIAL.totalRevenue) },
                  { label: "Total Expenses", value: fmtM(FINANCIAL.totalExpenses) },
                  { label: "Net Surplus", value: fmt(FINANCIAL.surplus) },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className="text-[11px] mb-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{item.label}</div>
                    <div className="text-[13px] font-semibold" style={{ color: "oklch(0.22 0.018 250)" }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-4 text-center text-[11px]" style={{ color: "oklch(0.60 0.010 250)" }}>
                111 W 7th St, West Liberty, IA 52776 · (319) 627-2418 · cityofwestlibertyia.org
              </div>
            </div>
          )}

          {/* FINANCIAL SUMMARY */}
          {selected.financial && (
            <div className="print-page rounded-xl border overflow-hidden" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: "oklch(0 0 0 / 8%)", background: "oklch(0.965 0.005 240)" }}>
                <BarChart3 className="w-4 h-4" style={{ color: "oklch(0.45 0.20 240)" }} />
                <h3 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Financial Summary — FY2024
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Revenue", value: fmtM(FINANCIAL.totalRevenue), color: "oklch(0.45 0.18 145)", icon: TrendingUp },
                    { label: "Total Expenditures", value: fmtM(FINANCIAL.totalExpenses), color: "oklch(0.45 0.20 240)", icon: TrendingDown },
                    { label: "Net Surplus", value: fmt(FINANCIAL.surplus), color: "oklch(0.45 0.18 145)", icon: TrendingUp },
                    { label: "General Fund Balance", value: fmtM(FINANCIAL.generalFundBalance), color: "oklch(0.45 0.20 240)", icon: BarChart3 },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-lg p-4 text-center" style={{ background: "oklch(0.965 0.005 240)" }}>
                      <stat.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: stat.color }} />
                      <div className="text-lg font-bold font-mono" style={{ color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg p-4" style={{ background: "oklch(0.965 0.005 240)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-medium" style={{ color: "oklch(0.35 0.014 250)" }}>
                      Debt Outstanding vs. Legal Limit
                    </span>
                    <span className="text-[12px] font-mono" style={{ color: "oklch(0.45 0.18 145)" }}>
                      {fmt(FINANCIAL.debtOutstanding)} / {fmtM(FINANCIAL.debtLimit)} ({FINANCIAL.debtPct}%)
                    </span>
                  </div>
                  <Progress value={FINANCIAL.debtPct} className="h-2" />
                  <div className="text-[11px] mt-1.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                    Debt capacity utilization is well within Iowa Code §384.24 limits. No new debt issuance anticipated in FY2025.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT FINDINGS */}
          {selected.audit && (
            <div className="print-page rounded-xl border overflow-hidden" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 8%)", background: "oklch(0.965 0.005 240)" }}>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: "oklch(0.50 0.22 25)" }} />
                  <h3 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                    Audit Findings — FY2024
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded" style={{ background: "oklch(0.50 0.22 25 / 10%)", color: "oklch(0.45 0.22 25)" }}>{criticalCount} Critical</span>
                  <span className="px-2 py-0.5 rounded" style={{ background: "oklch(0.55 0.20 35 / 10%)", color: "oklch(0.48 0.20 35)" }}>{highCount} High</span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {AUDIT_FINDINGS.map(finding => (
                  <div key={finding.id} className="rounded-lg border overflow-hidden" style={{ borderColor: `${severityColor[finding.severity]}25` }}>
                    <button
                      className="w-full flex items-start gap-3 p-4 text-left no-print"
                      onClick={() => toggleExpand(finding.id)}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: severityColor[finding.severity] }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono" style={{ color: "oklch(0.50 0.010 250)" }}>{finding.id}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: `${severityColor[finding.severity]}15`, color: severityColor[finding.severity] }}>{finding.severity}</span>
                          <span className="text-[11px]" style={{ color: "oklch(0.50 0.010 250)" }}>{finding.dept}</span>
                        </div>
                        <div className="text-[13px] font-medium mt-0.5" style={{ color: "oklch(0.22 0.018 250)" }}>{finding.title}</div>
                        <div className="text-[12px] font-mono font-semibold mt-0.5" style={{ color: severityColor[finding.severity] }}>{finding.amount}</div>
                      </div>
                      {expanded[finding.id]
                        ? <ChevronUp className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }} />
                        : <ChevronDown className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }} />
                      }
                    </button>
                    {/* Always show detail in print, toggle on screen */}
                    <div className={`px-4 pb-4 text-[12px] ${expanded[finding.id] ? "" : "hidden"} print:block`} style={{ color: "oklch(0.40 0.010 250)" }}>
                      {finding.detail}
                    </div>
                    {/* Print-only version (always visible) */}
                    <div className="hidden print:block px-4 pb-4 text-[12px]" style={{ color: "oklch(0.40 0.010 250)" }}>
                      {finding.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEPARTMENT SUMMARIES */}
          {selected.departments && (
            <div className="print-page rounded-xl border overflow-hidden" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: "oklch(0 0 0 / 8%)", background: "oklch(0.965 0.005 240)" }}>
                <Building2 className="w-4 h-4" style={{ color: "oklch(0.45 0.20 240)" }} />
                <h3 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Department Budget Summaries — FY2024
                </h3>
              </div>
              <div className="p-5 space-y-3">
                {DEPT_SUMMARIES.map(dept => {
                  const color = dept.status === "over"
                    ? "oklch(0.50 0.22 25)"
                    : dept.status === "on-track"
                    ? "oklch(0.45 0.20 240)"
                    : "oklch(0.45 0.18 145)";
                  return (
                    <div key={dept.name} className="rounded-lg p-4 border" style={{ borderColor: `${color}20`, background: `${color}05` }}>
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                          <dept.icon className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold" style={{ color: "oklch(0.22 0.018 250)" }}>{dept.name}</span>
                            <div className="flex items-center gap-2 text-[11px]">
                              <span style={{ color: "oklch(0.50 0.010 250)" }}>Budget: {fmt(dept.budget)}</span>
                              <span style={{ color: "oklch(0.50 0.010 250)" }}>Actual: {fmt(dept.actual)}</span>
                              <span className="font-mono font-bold" style={{ color }}>{dept.pct}%</span>
                            </div>
                          </div>
                          <div className="mt-2 mb-1">
                            <Progress value={Math.min(dept.pct, 100)} className="h-1.5" />
                          </div>
                          <div className="text-[11px]" style={{ color: "oklch(0.50 0.010 250)" }}>{dept.note}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* OPERATIONS & IoT */}
          {selected.operations && (
            <div className="print-page rounded-xl border overflow-hidden" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: "oklch(0 0 0 / 8%)", background: "oklch(0.965 0.005 240)" }}>
                <Wrench className="w-4 h-4" style={{ color: "oklch(0.45 0.18 145)" }} />
                <h3 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Operations & IoT Infrastructure
                </h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {IOT_HIGHLIGHTS.map(item => (
                    <div key={item.label} className="rounded-lg p-4" style={{ background: "oklch(0.965 0.005 240)" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.trend === "up" && <TrendingUp className="w-3 h-3" style={{ color: "oklch(0.45 0.18 145)" }} />}
                        {item.trend === "down" && <TrendingDown className="w-3 h-3" style={{ color: "oklch(0.50 0.22 25)" }} />}
                        {item.trend === "neutral" && <div className="w-3 h-3 rounded-full" style={{ background: "oklch(0.65 0.20 55)" }} />}
                      </div>
                      <div className="text-lg font-bold font-mono" style={{ color: "oklch(0.22 0.018 250)", fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTION ITEMS */}
          {selected.action && (
            <div className="rounded-xl border overflow-hidden" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: "oklch(0 0 0 / 8%)", background: "oklch(0.965 0.005 240)" }}>
                <FileText className="w-4 h-4" style={{ color: "oklch(0.45 0.20 240)" }} />
                <h3 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Recommended Council Actions
                </h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { priority: "Immediate", action: "Direct City Administrator to submit Community Development remediation plan by March 15, 2026, addressing the $187,100 FY2024 budget overrun (AF-2024-001).", ref: "AF-2024-001" },
                  { priority: "Immediate", action: "Authorize Finance Director to file formal appeal with IEDA regarding the $124,000 intergovernmental revenue shortfall (AF-2024-003).", ref: "AF-2024-003" },
                  { priority: "March Meeting", action: "Approve FY2025 budget amendment to carry forward $310,000 for Phase 2 of the Calhoun St water main replacement project (AF-2024-004).", ref: "AF-2024-004" },
                  { priority: "April Meeting", action: "Receive and review TIF-1 Downtown Urban Renewal reassessment report and authorize corrective action if revenue shortfall persists.", ref: "AF-2024-002" },
                  { priority: "Q2 FY2025", action: "Authorize procurement of 12 additional IoT sensor nodes for Phase 2 expansion — fund from Capital Hub IoT Infrastructure Bond.", ref: "IoT-EXP-01" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "oklch(0.965 0.005 240)" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold" style={{ background: "oklch(0.35 0.18 250)", color: "white" }}>{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{
                          background: item.priority === "Immediate" ? "oklch(0.50 0.22 25 / 12%)" : "oklch(0.45 0.20 240 / 10%)",
                          color: item.priority === "Immediate" ? "oklch(0.45 0.22 25)" : "oklch(0.38 0.20 240)",
                        }}>{item.priority}</span>
                        <span className="text-[10px] font-mono" style={{ color: "oklch(0.55 0.010 250)" }}>Ref: {item.ref}</span>
                      </div>
                      <div className="text-[12px]" style={{ color: "oklch(0.30 0.014 250)" }}>{item.action}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-5 text-center text-[11px]" style={{ color: "oklch(0.60 0.010 250)" }}>
                Report generated by DOGE Municipal Platform · {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · City of West Liberty, IA
              </div>
            </div>
          )}
        </div>

        {/* Bottom print button */}
        <div className="no-print flex justify-center pb-4">
          <Button
            onClick={handlePrint}
            size="lg"
            className="gap-2"
            style={{ background: "oklch(0.35 0.18 250)", color: "white" }}
          >
            <Download className="w-4 h-4" />
            Print / Save as PDF
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
