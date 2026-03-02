/**
 * Executive Dashboard — Civic Intelligence Dark
 * Real-time budget monitoring for West Liberty, IA FY2024
 * All 9 departments, audit queue, revenue breakdown, critical alerts
 */
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle2, Clock, FileText, Wifi } from "lucide-react";
import { Link } from "wouter";

const DEPT_DATA = [
  { dept: "General Govt", budget: 1420000, actual: 1398000, pct: 98.5, status: "ok" },
  { dept: "Public Safety", budget: 2180000, actual: 2038000, pct: 93.5, status: "ok" },
  { dept: "Public Works", budget: 3250000, actual: 3189000, pct: 98.1, status: "ok" },
  { dept: "Community Dev", budget: 505000, actual: 581000, pct: 115.0, status: "critical" },
  { dept: "Parks & Rec", budget: 890000, actual: 799000, pct: 89.8, status: "ok" },
  { dept: "Water Utility", budget: 4200000, actual: 4156000, pct: 99.0, status: "ok" },
  { dept: "Sewer Utility", budget: 2800000, actual: 2743000, pct: 97.9, status: "ok" },
  { dept: "Debt Service", budget: 1823964, actual: 1823964, pct: 100.0, status: "watch" },
  { dept: "Capital Projects", budget: 265129, actual: 605129, pct: 128.3, status: "critical" },
];

const REVENUE_DATA = [
  { name: "Property Tax", value: 4820000, color: "oklch(0.45 0.20 240)" },
  { name: "Utility Revenue", value: 6950000, color: "oklch(0.45 0.18 145)" },
  { name: "Intergovernmental", value: 3210000, color: "oklch(0.55 0.18 75)" },
  { name: "Charges for Services", value: 1420000, color: "oklch(0.50 0.22 25)" },
  { name: "Other", value: 1105461, color: "oklch(0.45 0.18 300)" },
];

const AUDIT_QUEUE = [
  { id: "AUD-2024-001", title: "Community Dev Budget Overrun", severity: "critical", dept: "Community Development", amount: "$76,000", status: "Open" },
  { id: "AUD-2024-002", title: "TIF Fund Variance", severity: "warning", dept: "Finance", amount: "$47,000", status: "In Review" },
  { id: "AUD-2024-003", title: "Capital Projects Overrun", severity: "critical", dept: "Public Works", amount: "$340,000", status: "Open" },
  { id: "AUD-2024-004", title: "Intergovernmental Revenue Shortfall", severity: "warning", dept: "Finance", amount: "$89,000", status: "Monitoring" },
  { id: "AUD-2024-005", title: "Water Utility Depreciation Schedule", severity: "info", dept: "Utilities", amount: "$12,000", status: "Resolved" },
];

const IOT_NODES = [
  { id: "NODE-001", location: "City Hall", type: "Environmental", status: "online", lastPing: "12s ago" },
  { id: "NODE-002", location: "Water Tower #1", type: "Pressure/Flow", status: "online", lastPing: "8s ago" },
  { id: "NODE-003", location: "Main St & 3rd Ave", type: "Traffic/Air", status: "online", lastPing: "5s ago" },
  { id: "NODE-004", location: "Wastewater Plant", type: "Water Quality", status: "online", lastPing: "3s ago" },
  { id: "NODE-005", location: "City Park", type: "Soil/Irrigation", status: "offline", lastPing: "14m ago" },
  { id: "NODE-006", location: "Police Station", type: "Security/Env", status: "online", lastPing: "2s ago" },
];

function MetricCard({ label, value, sub, trend, color }: {
  label: string; value: string; sub?: string; trend?: "up" | "down" | "flat"; color: string;
}) {
  return (
    <div className="data-card">
      <div className="section-label mb-2">{label}</div>
      <div className="metric-value" style={{ color }}>{value}</div>
      {sub && <div className="text-xs mt-1 font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{sub}</div>}
      {trend && (
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" ? <TrendingUp className="w-3 h-3" style={{ color: "oklch(0.45 0.18 145)" }} /> : <TrendingDown className="w-3 h-3" style={{ color: "oklch(0.50 0.22 25)" }} />}
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded text-xs font-mono" style={{ background: "oklch(0.98 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.25 0.018 250)" }}>
        <div>{payload[0]?.payload?.dept || payload[0]?.name}</div>
        <div style={{ color: "oklch(0.40 0.18 240)" }}>${(payload[0]?.value / 1000000).toFixed(2)}M</div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const totalBudget = DEPT_DATA.reduce((s, d) => s + d.budget, 0);
  const totalActual = DEPT_DATA.reduce((s, d) => s + d.actual, 0);
  const overBudget = DEPT_DATA.filter(d => d.status === "critical").length;

  return (
    <DashboardLayout title="Executive Dashboard — FY2024">
      <div className="p-6 space-y-6">
        {/* Critical alert banner */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: "oklch(0.62 0.22 25 / 10%)", border: "1px solid oklch(0.62 0.22 25 / 25%)" }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.50 0.22 25)" }} />
          <div className="text-sm" style={{ color: "oklch(0.50 0.22 25)" }}>
            <strong>2 departments over budget:</strong> Community Development (+$76K, 115%) and Capital Projects (+$340K, 128%). Immediate review recommended.
          </div>
          <Link href="/audit" className="ml-auto text-xs font-semibold no-underline flex-shrink-0" style={{ color: "oklch(0.50 0.22 25)" }}>
            View Audit →
          </Link>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Revenue" value="$17.5M" sub="FY2024 actual" color="oklch(0.45 0.18 145)" trend="up" />
          <MetricCard label="Total Expenditures" value="$17.3M" sub="vs $17.5M budget" color="oklch(0.40 0.18 240)" />
          <MetricCard label="Net Surplus" value="+$172K" sub="1.0% of revenue" color="oklch(0.45 0.18 145)" trend="up" />
          <MetricCard label="Dept Overruns" value={`${overBudget}/9`} sub="Critical alerts" color="oklch(0.50 0.22 25)" />
        </div>

        {/* Budget chart + Revenue pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart */}
          <div className="lg:col-span-2 data-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>Department Budget vs. Actual</div>
                <div className="text-xs mt-0.5" style={{ color: "oklch(0.48 0.012 250)" }}>FY2024 — All amounts in $M</div>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1" style={{ color: "oklch(0.45 0.012 250)" }}>
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "oklch(0.45 0.20 240 / 30%)" }} /> Budget
                </span>
                <span className="flex items-center gap-1" style={{ color: "oklch(0.45 0.012 250)" }}>
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "oklch(0.45 0.20 240)" }} /> Actual
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={DEPT_DATA} barGap={2} barCategoryGap="30%">
                <XAxis dataKey="dept" tick={{ fontSize: 9, fill: "oklch(0.52 0.010 250)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "oklch(0.52 0.010 250)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "oklch(1 0 0 / 4%)" }} />
                <Bar dataKey="budget" fill="oklch(0.45 0.20 240 / 20%)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="actual" radius={[2, 2, 0, 0]}>
                  {DEPT_DATA.map((d) => (
                    <Cell key={d.dept} fill={d.status === "critical" ? "oklch(0.50 0.22 25)" : d.status === "watch" ? "oklch(0.55 0.18 75)" : "oklch(0.45 0.20 240)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue pie */}
          <div className="data-card">
            <div className="text-sm font-semibold mb-1" style={{ color: "oklch(0.18 0.018 250)" }}>Revenue Sources</div>
            <div className="text-xs mb-3" style={{ color: "oklch(0.48 0.012 250)" }}>FY2024 — $17.5M total</div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={REVENUE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                  {REVENUE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `$${(v / 1000000).toFixed(2)}M`} contentStyle={{ background: "oklch(0.98 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", fontSize: 11, color: "oklch(0.25 0.018 250)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {REVENUE_DATA.map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                    <span className="text-[10px]" style={{ color: "oklch(0.48 0.012 250)" }}>{r.name}</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: "oklch(0.65 0.010 250)" }}>
                    ${(r.value / 1000000).toFixed(2)}M
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dept cards */}
        <div>
          <div className="text-sm font-semibold mb-3" style={{ color: "oklch(0.18 0.018 250)" }}>Department Detail</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEPT_DATA.map((d) => (
              <div
                key={d.dept}
                className="p-4 rounded-lg"
                style={{
                  background: d.status === "critical" ? "oklch(0.62 0.22 25 / 6%)" : "oklch(1 0 0)",
                  border: `1px solid ${d.status === "critical" ? "oklch(0.50 0.22 25 / 20%)" : d.status === "watch" ? "oklch(0.75 0.18 75 / 20%)" : "oklch(0 0 0 / 8%)"}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: "oklch(0.22 0.018 250)" }}>{d.dept}</span>
                  <span className={`badge-${d.status === "critical" ? "critical" : d.status === "watch" ? "warning" : "success"}`}>
                    {d.status === "critical" ? "OVER" : d.status === "watch" ? "WATCH" : "OK"}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-mono mb-1.5" style={{ color: "oklch(0.48 0.012 250)" }}>
                  <span>Budget: ${(d.budget / 1000).toFixed(0)}K</span>
                  <span>Actual: ${(d.actual / 1000).toFixed(0)}K</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "oklch(0 0 0 / 8%)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(d.pct, 100)}%`,
                      background: d.status === "critical" ? "oklch(0.50 0.22 25)" : d.status === "watch" ? "oklch(0.55 0.18 75)" : "oklch(0.45 0.20 240)",
                    }}
                  />
                </div>
                <div
                  className="text-[10px] font-mono font-bold"
                  style={{ color: d.status === "critical" ? "oklch(0.50 0.22 25)" : d.status === "watch" ? "oklch(0.50 0.18 75)" : "oklch(0.45 0.18 145)" }}
                >
                  {d.pct.toFixed(1)}% of budget used
                  {d.status === "critical" && ` (+$${((d.actual - d.budget) / 1000).toFixed(0)}K over)`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit queue + IoT nodes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Audit queue */}
          <div className="data-card">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>Audit Queue</div>
              <Link href="/audit" className="text-xs no-underline" style={{ color: "oklch(0.65 0.18 240)" }}>View all →</Link>
            </div>
            <div className="space-y-2">
              {AUDIT_QUEUE.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-2.5 rounded" style={{ background: "oklch(0.985 0.003 240)" }}>
                  <div className="mt-0.5">
                    {item.severity === "critical" ? (
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: "oklch(0.50 0.22 25)" }} />
                    ) : item.severity === "warning" ? (
                      <Clock className="w-3.5 h-3.5" style={{ color: "oklch(0.50 0.18 75)" }} />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "oklch(0.45 0.18 145)" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: "oklch(0.22 0.018 250)" }}>{item.title}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>{item.dept} · {item.id}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] font-mono font-semibold" style={{ color: item.severity === "critical" ? "oklch(0.50 0.22 25)" : "oklch(0.50 0.18 75)" }}>{item.amount}</div>
                    <div className={`badge-${item.status === "Resolved" ? "success" : item.status === "Open" ? "critical" : "warning"} mt-0.5`}>{item.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IoT nodes */}
          <div className="data-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" style={{ color: "oklch(0.45 0.18 145)" }} />
                <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>IoT Node Status</div>
              </div>
              <Link href="/map" className="text-xs no-underline" style={{ color: "oklch(0.65 0.18 240)" }}>View map →</Link>
            </div>
            <div className="space-y-2">
              {IOT_NODES.map((node) => (
                <div key={node.id} className="flex items-center gap-3 p-2.5 rounded" style={{ background: "oklch(0.985 0.003 240)" }}>
                  <span className={`status-dot ${node.status === "online" ? "green" : "red"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium" style={{ color: "oklch(0.22 0.018 250)" }}>{node.location}</div>
                    <div className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>{node.type} · {node.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono" style={{ color: node.status === "online" ? "oklch(0.45 0.18 145)" : "oklch(0.50 0.22 25)" }}>
                      {node.status === "online" ? "ONLINE" : "OFFLINE"}
                    </div>
                    <div className="text-[9px]" style={{ color: "oklch(0.48 0.012 250)" }}>{node.lastPing}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
