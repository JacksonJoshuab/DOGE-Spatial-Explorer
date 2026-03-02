/**
 * Transparency Dashboard — Public-facing read-only page
 * Shows budget vs. actual by department, open work orders, and audit findings status.
 * Suitable for embedding on the City of West Liberty's official website.
 * Design: Civic Intelligence Light
 */
import { useState } from "react";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from "recharts";
import {
  Eye, CheckCircle2, AlertTriangle, Clock, TrendingUp, TrendingDown,
  Building2, Droplets, Shield, Wrench, Trees, FileText, DollarSign,
  Users, ExternalLink, Info, ChevronDown, ChevronUp, Code2, Copy, Check
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── West Liberty FY2024 Data ─────────────────────────────────────────────────
const DEPARTMENTS = [
  { name: "General Government", budget: 1842000, actual: 1798000, icon: Building2, color: "#3b82f6" },
  { name: "Public Safety", budget: 2156000, actual: 2014000, icon: Shield, color: "#6366f1" },
  { name: "Public Works", budget: 3241000, actual: 3189000, icon: Wrench, color: "#8b5cf6" },
  { name: "Water Utility", budget: 2890000, actual: 2743000, icon: Droplets, color: "#0ea5e9" },
  { name: "Sewer Utility", budget: 1654000, actual: 1621000, icon: Droplets, color: "#06b6d4" },
  { name: "Parks & Recreation", budget: 892000, actual: 801000, icon: Trees, color: "#10b981" },
  { name: "Community Development", budget: 1124000, actual: 1293000, icon: Building2, color: "#ef4444" },
  { name: "Finance & Admin", budget: 987000, actual: 952000, icon: DollarSign, color: "#f59e0b" },
  { name: "Library", budget: 547000, actual: 522000, icon: FileText, color: "#84cc16" },
];

const AUDIT_FINDINGS = [
  {
    id: "AF-2024-001",
    title: "Community Development Budget Overrun",
    severity: "critical",
    status: "open",
    amount: 169000,
    description: "Community Development expenditures exceeded appropriation by $169,000 (115% of budget). Amendment BA-2024-001 submitted for City Council review.",
    resolution: "Budget amendment under review. Projected resolution: Q1 FY2025.",
  },
  {
    id: "AF-2024-002",
    title: "TIF District Revenue Shortfall",
    severity: "high",
    status: "in_progress",
    amount: 87000,
    description: "TIF District #3 (Hwy 6 Corridor) generated $87,000 less than projected due to delayed commercial development.",
    resolution: "Revised revenue projections submitted. Developer timeline updated.",
  },
  {
    id: "AF-2024-003",
    title: "Intergovernmental Revenue Variance",
    severity: "medium",
    status: "in_progress",
    amount: 43000,
    description: "State road use tax receipts were $43,000 below budget due to revised IDOT distribution formula.",
    resolution: "Coordinating with IDOT on revised FY2025 allocation.",
  },
  {
    id: "AF-2024-004",
    title: "Water Fund Capital Reserve Below Target",
    severity: "medium",
    status: "resolved",
    amount: 0,
    description: "Water Fund capital reserve fell below the 15% minimum policy threshold in Q2. Corrective transfer completed in Q3.",
    resolution: "Resolved — reserve restored to 18.4% as of September 2024.",
  },
  {
    id: "AF-2024-005",
    title: "Procurement Policy Compliance",
    severity: "low",
    status: "resolved",
    amount: 0,
    description: "Three purchases between $5,000–$25,000 lacked required competitive quote documentation.",
    resolution: "Resolved — staff training completed. Updated procurement checklist implemented.",
  },
];

const WORK_ORDERS = [
  { id: "WO-2024-0847", dept: "Public Works", title: "Hwy 6 / Industrial Park Rd Pothole Repair", priority: "high", status: "in_progress", opened: "Feb 18, 2025" },
  { id: "WO-2024-0851", dept: "Water Utility", title: "Elm St Water Main Pressure Monitoring", priority: "medium", status: "open", opened: "Feb 22, 2025" },
  { id: "WO-2024-0853", dept: "Parks", title: "Wildcat Park Pavilion Roof Inspection", priority: "low", status: "open", opened: "Feb 24, 2025" },
  { id: "WO-2024-0855", dept: "Public Works", title: "Storm Drain Cleaning — Oak St Corridor", priority: "medium", status: "in_progress", opened: "Feb 25, 2025" },
  { id: "WO-2024-0858", dept: "Sewer Utility", title: "Lift Station #2 Pump Replacement", priority: "high", status: "open", opened: "Feb 26, 2025" },
  { id: "WO-2024-0860", dept: "Public Works", title: "Traffic Signal Timing Adjustment — Hwy 6", priority: "low", status: "open", opened: "Feb 27, 2025" },
];

const FISCAL_SUMMARY = {
  totalRevenue: 17505461,
  totalExpenditures: 17333093,
  surplus: 172368,
  generalFundBalance: 2184000,
  totalDebt: 1823964,
  debtLimit: 9845000,
  debtPct: 18.5,
  taxRate: 14.52,
  population: 3858,
  lastUpdated: "February 28, 2025",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return "$" + n.toLocaleString();
}

const SEVERITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  critical: { label: "Critical", bg: "oklch(0.97 0.01 25)", text: "oklch(0.45 0.22 25)", border: "oklch(0.45 0.22 25 / 25%)" },
  high: { label: "High", bg: "oklch(0.97 0.015 55)", text: "oklch(0.50 0.20 55)", border: "oklch(0.50 0.20 55 / 25%)" },
  medium: { label: "Medium", bg: "oklch(0.97 0.01 240)", text: "oklch(0.45 0.18 240)", border: "oklch(0.45 0.18 240 / 25%)" },
  low: { label: "Low", bg: "oklch(0.97 0.01 145)", text: "oklch(0.40 0.18 145)", border: "oklch(0.40 0.18 145 / 25%)" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  open: { label: "Open", color: "oklch(0.55 0.22 25)", icon: AlertTriangle },
  in_progress: { label: "In Progress", color: "oklch(0.50 0.20 55)", icon: Clock },
  resolved: { label: "Resolved", color: "oklch(0.40 0.18 145)", icon: CheckCircle2 },
};

const WO_PRIORITY: Record<string, string> = {
  high: "oklch(0.55 0.22 25)",
  medium: "oklch(0.50 0.20 55)",
  low: "oklch(0.40 0.18 145)",
};

const WO_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function Transparency() {
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState<"all" | "over" | "under">("all");
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);

  const EMBED_VARIANTS = [
    {
      id: "full",
      label: "Full Dashboard",
      desc: "Complete transparency portal with all charts and tables",
      code: `<iframe\n  src="https://dogemuni-zykc8hns.manus.space/transparency"\n  width="100%"\n  height="900"\n  frameborder="0"\n  title="City of West Liberty — Open Government Transparency Portal"\n  loading="lazy"\n  allowfullscreen\n></iframe>`,
    },
    {
      id: "compact",
      label: "Compact Widget",
      desc: "Budget summary card for sidebar or footer placement",
      code: `<iframe\n  src="https://dogemuni-zykc8hns.manus.space/transparency#summary"\n  width="400"\n  height="300"\n  frameborder="0"\n  title="West Liberty Budget Summary"\n  loading="lazy"\n></iframe>`,
    },
    {
      id: "audit",
      label: "Audit Findings Only",
      desc: "Standalone audit findings accordion for compliance pages",
      code: `<iframe\n  src="https://dogemuni-zykc8hns.manus.space/transparency#audit"\n  width="100%"\n  height="600"\n  frameborder="0"\n  title="West Liberty Audit Findings"\n  loading="lazy"\n></iframe>`,
    },
  ];
  const [selectedEmbed, setSelectedEmbed] = useState("full");

  const copyEmbed = () => {
    const variant = EMBED_VARIANTS.find(v => v.id === selectedEmbed);
    if (!variant) return;
    navigator.clipboard.writeText(variant.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const totalBudget = DEPARTMENTS.reduce((s, d) => s + d.budget, 0);
  const totalActual = DEPARTMENTS.reduce((s, d) => s + d.actual, 0);
  const overBudget = DEPARTMENTS.filter(d => d.actual > d.budget).length;
  const underBudget = DEPARTMENTS.filter(d => d.actual <= d.budget).length;

  const chartData = DEPARTMENTS.map(d => ({
    name: d.name.replace("& ", "&\n"),
    Budget: d.budget,
    Actual: d.actual,
    over: d.actual > d.budget,
  }));

  const filteredDepts = DEPARTMENTS.filter(d => {
    if (deptFilter === "over") return d.actual > d.budget;
    if (deptFilter === "under") return d.actual <= d.budget;
    return true;
  });

  const openFindings = AUDIT_FINDINGS.filter(f => f.status !== "resolved").length;
  const openWorkOrders = WORK_ORDERS.filter(w => w.status !== "completed").length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.975 0.003 240)" }}>
      <Navbar />

      <main className="flex-1">
        {/* Hero Banner */}
        <div style={{ background: "oklch(0.18 0.018 250)", borderBottom: "3px solid oklch(0.45 0.20 240)" }}>
          <div className="container py-10">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4" style={{ color: "oklch(0.65 0.18 240)" }} />
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "oklch(0.65 0.18 240)", fontFamily: "'JetBrains Mono', monospace" }}>
                    Public Transparency Portal
                  </span>
                </div>
                <h1 className="text-3xl font-black mb-2" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.95 0.005 250)" }}>
                  City of West Liberty
                </h1>
                <p className="text-sm max-w-xl" style={{ color: "oklch(0.72 0.010 250)" }}>
                  Open government data for FY2024 — budget performance, open work orders, and audit findings status. Updated monthly by the Finance Department.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-[10px] font-mono" style={{ color: "oklch(0.55 0.010 250)" }}>Last updated</div>
                <div className="text-sm font-bold" style={{ color: "oklch(0.80 0.010 250)" }}>{FISCAL_SUMMARY.lastUpdated}</div>
                <div className="text-[10px] font-mono mt-1" style={{ color: "oklch(0.55 0.010 250)" }}>Fiscal Year 2024</div>
                <a
                  href="https://cityofwestlibertyia.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] mt-1"
                  style={{ color: "oklch(0.65 0.18 240)" }}
                >
                  <ExternalLink className="w-3 h-3" /> Official City Website
                </a>
                <button
                  onClick={() => setShowEmbed(v => !v)}
                  className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded mt-2 transition-all"
                  style={{
                    background: showEmbed ? "oklch(0.45 0.20 240)" : "oklch(0.45 0.20 240 / 20%)",
                    border: "1px solid oklch(0.45 0.20 240 / 40%)",
                    color: showEmbed ? "#fff" : "oklch(0.65 0.18 240)",
                  }}
                >
                  <Code2 className="w-3 h-3" />
                  {showEmbed ? "Hide Embed Code" : "Get Embed Code"}
                </button>
              </div>
            </div>

            {/* Embed Code Generator Panel */}
            {showEmbed && (
              <div
                className="mt-6 rounded-xl overflow-hidden"
                style={{ background: "oklch(0.12 0.015 250)", border: "1px solid oklch(0.45 0.20 240 / 30%)" }}
              >
                <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "oklch(0.45 0.20 240 / 20%)" }}>
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4" style={{ color: "oklch(0.65 0.18 240)" }} />
                    <span className="text-sm font-bold" style={{ color: "oklch(0.92 0.005 250)", fontFamily: "'Syne', sans-serif" }}>Embed Code Generator</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: "oklch(0.55 0.010 250)" }}>Copy &amp; paste into your CMS or HTML</span>
                </div>
                <div className="p-5">
                  {/* Variant selector */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {EMBED_VARIANTS.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedEmbed(v.id)}
                        className="px-3 py-1.5 rounded text-xs font-semibold transition-all"
                        style={{
                          background: selectedEmbed === v.id ? "oklch(0.45 0.20 240)" : "oklch(0.22 0.015 250)",
                          color: selectedEmbed === v.id ? "#fff" : "oklch(0.65 0.010 250)",
                          border: `1px solid ${selectedEmbed === v.id ? "oklch(0.45 0.20 240)" : "oklch(0.35 0.010 250 / 40%)"}`,
                        }}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                  {EMBED_VARIANTS.filter(v => v.id === selectedEmbed).map(v => (
                    <div key={v.id}>
                      <p className="text-xs mb-3" style={{ color: "oklch(0.62 0.010 250)" }}>{v.desc}</p>
                      <div className="relative">
                        <pre
                          className="p-4 rounded-lg text-[11px] font-mono overflow-x-auto"
                          style={{ background: "oklch(0.08 0.010 250)", color: "oklch(0.78 0.12 240)", border: "1px solid oklch(0.35 0.010 250 / 30%)" }}
                        >{v.code}</pre>
                        <button
                          onClick={copyEmbed}
                          className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-semibold transition-all"
                          style={{
                            background: copied ? "oklch(0.32 0.18 145)" : "oklch(0.35 0.010 250 / 60%)",
                            color: copied ? "#fff" : "oklch(0.78 0.010 250)",
                            border: "1px solid oklch(0.45 0.010 250 / 40%)",
                          }}
                        >
                          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-[10px] mt-2" style={{ color: "oklch(0.45 0.010 250)" }}>
                        Paste this snippet into any HTML page or CMS block on cityofwestlibertyia.org. The iframe is responsive and updates automatically as data changes.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="container py-8 space-y-8">

          {/* Fiscal Summary Cards */}
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.45 0.010 250)" }}>
              FY2024 Fiscal Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Total Revenue", value: fmt(FISCAL_SUMMARY.totalRevenue), sub: "FY2024", icon: TrendingUp, color: "oklch(0.40 0.18 145)" },
                { label: "Total Expenditures", value: fmt(FISCAL_SUMMARY.totalExpenditures), sub: "FY2024", icon: TrendingDown, color: "oklch(0.45 0.18 240)" },
                { label: "Year-End Surplus", value: fmt(FISCAL_SUMMARY.surplus), sub: "Net position", icon: DollarSign, color: "oklch(0.40 0.18 145)" },
                { label: "General Fund Balance", value: fmt(FISCAL_SUMMARY.generalFundBalance), sub: "Reserve", icon: Building2, color: "oklch(0.45 0.18 240)" },
                { label: "Outstanding Debt", value: fmt(FISCAL_SUMMARY.totalDebt), sub: `${FISCAL_SUMMARY.debtPct}% of limit`, icon: FileText, color: "oklch(0.50 0.20 55)" },
                { label: "Tax Rate", value: `$${FISCAL_SUMMARY.taxRate}`, sub: "Per $1,000 AV", icon: Users, color: "oklch(0.45 0.18 240)" },
              ].map(card => (
                <div key={card.label} className="rounded-xl p-4" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                  <card.icon className="w-4 h-4 mb-2" style={{ color: card.color }} />
                  <div className="text-base font-black font-mono" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.18 0.018 250)" }}>{card.value}</div>
                  <div className="text-[10px] font-semibold mt-0.5" style={{ color: "oklch(0.32 0.018 250)" }}>{card.label}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{card.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget vs Actual Chart */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
            <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: "1px solid oklch(0 0 0 / 6%)" }}>
              <div>
                <h2 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Department Budget vs. Actual Expenditures
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>
                  FY2024 · {overBudget} department{overBudget !== 1 ? "s" : ""} over budget · {underBudget} under budget
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(["all", "over", "under"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setDeptFilter(f)}
                    className="text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      background: deptFilter === f ? "oklch(0.18 0.018 250)" : "oklch(0.965 0.005 240)",
                      color: deptFilter === f ? "oklch(0.95 0.005 250)" : "oklch(0.45 0.010 250)",
                      border: "1px solid oklch(0 0 0 / 10%)",
                    }}
                  >
                    {f === "all" ? "All" : f === "over" ? "Over Budget" : "Under Budget"}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 6%)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: "oklch(0.45 0.010 250)", fontFamily: "'DM Sans', sans-serif" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={v => "$" + (v / 1000000).toFixed(1) + "M"}
                    tick={{ fontSize: 9, fill: "oklch(0.45 0.010 250)", fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <Tooltip
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", border: "1px solid oklch(0 0 0 / 10%)", borderRadius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} />
                  <Bar dataKey="Budget" fill="oklch(0.65 0.12 240)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Actual" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.over ? "oklch(0.55 0.22 25)" : "oklch(0.45 0.18 145)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Department table */}
            <div className="px-6 pb-6">
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0 0 0 / 8%)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "oklch(0.965 0.005 240)" }}>
                      <th className="text-left px-4 py-2.5 font-semibold" style={{ color: "oklch(0.35 0.015 250)" }}>Department</th>
                      <th className="text-right px-4 py-2.5 font-semibold" style={{ color: "oklch(0.35 0.015 250)" }}>Budget</th>
                      <th className="text-right px-4 py-2.5 font-semibold" style={{ color: "oklch(0.35 0.015 250)" }}>Actual</th>
                      <th className="text-right px-4 py-2.5 font-semibold" style={{ color: "oklch(0.35 0.015 250)" }}>Variance</th>
                      <th className="text-right px-4 py-2.5 font-semibold" style={{ color: "oklch(0.35 0.015 250)" }}>% Used</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "oklch(0 0 0 / 5%)" }}>
                    {filteredDepts.map(d => {
                      const variance = d.actual - d.budget;
                      const pct = Math.round((d.actual / d.budget) * 100);
                      const over = d.actual > d.budget;
                      return (
                        <tr key={d.name} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-medium" style={{ color: "oklch(0.22 0.018 250)" }}>
                            <div className="flex items-center gap-2">
                              <d.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: d.color }} />
                              {d.name}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono" style={{ color: "oklch(0.35 0.015 250)" }}>{fmt(d.budget)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold" style={{ color: over ? "oklch(0.45 0.22 25)" : "oklch(0.40 0.18 145)" }}>{fmt(d.actual)}</td>
                          <td className="px-4 py-2.5 text-right font-mono" style={{ color: over ? "oklch(0.45 0.22 25)" : "oklch(0.40 0.18 145)" }}>
                            {over ? "+" : ""}{fmt(variance)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded font-bold"
                              style={{
                                background: over ? "oklch(0.97 0.01 25)" : "oklch(0.97 0.01 145)",
                                color: over ? "oklch(0.45 0.22 25)" : "oklch(0.40 0.18 145)",
                              }}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: "oklch(0.965 0.005 240)", borderTop: "2px solid oklch(0 0 0 / 10%)" }}>
                      <td className="px-4 py-2.5 font-bold text-xs" style={{ color: "oklch(0.22 0.018 250)" }}>Total</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-xs" style={{ color: "oklch(0.22 0.018 250)" }}>{fmt(totalBudget)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-xs" style={{ color: "oklch(0.22 0.018 250)" }}>{fmt(totalActual)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-xs" style={{ color: totalActual > totalBudget ? "oklch(0.45 0.22 25)" : "oklch(0.40 0.18 145)" }}>
                        {totalActual > totalBudget ? "+" : ""}{fmt(totalActual - totalBudget)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded font-bold"
                          style={{ background: "oklch(0.97 0.01 145)", color: "oklch(0.40 0.18 145)" }}>
                          {Math.round((totalActual / totalBudget) * 100)}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Audit Findings */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid oklch(0 0 0 / 6%)" }}>
              <div>
                <h2 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Audit Findings Status
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>
                  {AUDIT_FINDINGS.length} total findings · {openFindings} open · {AUDIT_FINDINGS.length - openFindings} resolved
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>
                <Info className="w-3.5 h-3.5" />
                Iowa Code Ch. 11 — Annual Audit Required
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
              {AUDIT_FINDINGS.map(finding => {
                const sev = SEVERITY_CONFIG[finding.severity];
                const st = STATUS_CONFIG[finding.status];
                const StatusIcon = st.icon;
                const expanded = expandedFinding === finding.id;
                return (
                  <div key={finding.id}>
                    <button
                      onClick={() => setExpandedFinding(expanded ? null : finding.id)}
                      className="w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <StatusIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: st.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[10px] font-mono font-semibold" style={{ color: "oklch(0.52 0.010 250)" }}>{finding.id}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: sev.bg, color: sev.text, border: `1px solid ${sev.border}` }}>
                                {sev.label}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: "oklch(0.965 0.005 240)", color: st.color }}>
                                {st.label}
                              </span>
                            </div>
                            <div className="text-[13px] font-semibold" style={{ color: "oklch(0.22 0.018 250)" }}>{finding.title}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {finding.amount > 0 && (
                            <div className="text-right">
                              <div className="text-sm font-mono font-bold" style={{ color: "oklch(0.45 0.22 25)", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(finding.amount)}</div>
                              <div className="text-[9px]" style={{ color: "oklch(0.55 0.010 250)" }}>variance</div>
                            </div>
                          )}
                          {expanded ? <ChevronUp className="w-4 h-4" style={{ color: "oklch(0.52 0.010 250)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "oklch(0.52 0.010 250)" }} />}
                        </div>
                      </div>
                    </button>

                    {expanded && (
                      <div className="px-6 pb-4 ml-7" style={{ borderTop: "1px solid oklch(0 0 0 / 5%)" }}>
                        <div className="pt-3 space-y-3">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "oklch(0.52 0.010 250)" }}>Finding</div>
                            <p className="text-[12px] leading-relaxed" style={{ color: "oklch(0.35 0.015 250)" }}>{finding.description}</p>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "oklch(0.52 0.010 250)" }}>Resolution Status</div>
                            <p className="text-[12px] leading-relaxed" style={{ color: "oklch(0.35 0.015 250)" }}>{finding.resolution}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Open Work Orders */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid oklch(0 0 0 / 6%)" }}>
              <div>
                <h2 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Open Work Orders
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>
                  {openWorkOrders} active work orders across all departments
                </p>
              </div>
              <Link href="/operations" className="text-[10px] font-semibold flex items-center gap-1"
                style={{ color: "oklch(0.45 0.18 240)" }}>
                <ExternalLink className="w-3 h-3" /> Full Operations Center
              </Link>
            </div>

            <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
              {WORK_ORDERS.map(wo => (
                <div key={wo.id} className="px-6 py-3.5 flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: WO_PRIORITY[wo.priority] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[10px] font-mono font-semibold" style={{ color: "oklch(0.52 0.010 250)" }}>{wo.id}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: "oklch(0.965 0.005 240)", color: "oklch(0.45 0.010 250)" }}>
                        {wo.dept}
                      </span>
                    </div>
                    <div className="text-[12px] font-medium" style={{ color: "oklch(0.22 0.018 250)" }}>{wo.title}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-[10px] font-semibold" style={{ color: WO_PRIORITY[wo.priority] }}>
                      {wo.priority.charAt(0).toUpperCase() + wo.priority.slice(1)} Priority
                    </div>
                    <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                      {WO_STATUS_LABEL[wo.status]} · {wo.opened}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)" }}>
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.45 0.18 240)" }} />
            <p className="text-[11px] leading-relaxed" style={{ color: "oklch(0.45 0.015 250)" }}>
              This transparency portal presents official City of West Liberty financial data from the FY2024 Annual Financial Report, prepared in accordance with Iowa Code Chapter 384. All figures are unaudited until the independent audit is finalized. For questions, contact the Finance Department at <strong>(319) 627-2418</strong> or email <strong>finance@westlibertyia.org</strong>. Data is updated monthly.
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
