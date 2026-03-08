/**
 * Executive Dashboard — All American Concrete
 * Real-time operational overview: job sites, fleet, crew, alerts, materials
 */
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { AlertTriangle, Truck, Users, Package, CheckCircle2, Clock, Building2, Zap, Fuel } from "lucide-react";
import { Link } from "wouter";

// ─── Job site data ────────────────────────────────────────────────────────────
const JOB_SITES = [
  { id: "JS-001", name: "County Road 22 Expansion",      status: "active",   yardage: 4200, pourStart: "06:30 AM", deadline: "1:00 PM", crew: 6, mixers: 3 },
  { id: "JS-002", name: "West Liberty Community Center", status: "active",   yardage: 1850, pourStart: "08:00 AM", deadline: "3:00 PM", crew: 4, mixers: 2 },
  { id: "JS-003", name: "Iowa 70 Bridge Deck Repair",    status: "standby",  yardage: 2600, pourStart: "TBD",      deadline: "TBD",     crew: 2, mixers: 1 },
  { id: "JS-004", name: "Muscatine Co. Rd. 16 Overlay",  status: "scheduled", yardage: 3100, pourStart: "03/10",   deadline: "03/10",   crew: 0, mixers: 0 },
];

// ─── Fleet summary ────────────────────────────────────────────────────────────
const FLEET_SUMMARY = [
  { label: "Operational",  count: 9,  color: "oklch(0.45 0.18 145)" },
  { label: "Maintenance",  count: 2,  color: "oklch(0.55 0.18 75)"  },
  { label: "Alert",        count: 1,  color: "oklch(0.50 0.22 25)"  },
];

// ─── Material inventory ───────────────────────────────────────────────────────
const MATERIALS = [
  { name: "Portland Cement Type I/II", unit: "tons", stock: 42.5, reorder: 20, color: "oklch(0.45 0.20 240)" },
  { name: "Coarse Aggregate #57",      unit: "tons", stock: 118,  reorder: 50, color: "oklch(0.45 0.18 145)" },
  { name: "Fine Aggregate (Sand)",     unit: "tons", stock: 85,   reorder: 40, color: "oklch(0.55 0.18 75)"  },
  { name: "Air Entraining Agent",      unit: "gal",  stock: 28,   reorder: 30, color: "oklch(0.50 0.22 25)"  },
  { name: "Fly Ash Class C",           unit: "tons", stock: 8.5,  reorder: 15, color: "oklch(0.50 0.22 25)"  },
  { name: "Rebar Grade 60 #4",         unit: "tons", stock: 3.2,  reorder: 5,  color: "oklch(0.50 0.22 25)"  },
];

// ─── Active alerts ────────────────────────────────────────────────────────────
const ALERTS = [
  { id: "ALT-001", title: "Batch Plant Moisture Sensor #3 Anomaly", severity: "warning", source: "IoT — Batch Plant", note: "Manual override active since 06:15 AM" },
  { id: "ALT-002", title: "MT-007 Low Fuel (68%)", severity: "warning", source: "Fleet — MT-007", note: "Refuel stop at Yard ~09:30 AM" },
  { id: "ALT-003", title: "JS-003 IDOT Inspector Pending", severity: "info", source: "Job Site — JS-003", note: "Iowa 70 pour on hold until inspector arrival" },
  { id: "ALT-004", title: "MT-002 Drum Bearing Replacement", severity: "info", source: "Maintenance — MT-002", note: "ETA back in service: 03/09" },
];

// ─── Pour volume chart data ───────────────────────────────────────────────────
const POUR_CHART = [
  { site: "JS-001", planned: 4200, color: "oklch(0.45 0.20 240)" },
  { site: "JS-002", planned: 1850, color: "oklch(0.45 0.18 145)" },
  { site: "JS-003", planned: 2600, color: "oklch(0.55 0.18 75)"  },
  { site: "JS-004", planned: 3100, color: "oklch(0.50 0.22 25)"  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ElementType;
}) {
  return (
    <div className="data-card flex items-start gap-3">
      <div className="rounded-lg p-2 flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <div className="section-label mb-0.5">{label}</div>
        <div className="metric-value" style={{ color }}>{value}</div>
        {sub && <div className="text-xs mt-0.5 font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{sub}</div>}
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="px-3 py-2 rounded text-xs font-mono" style={{ background: "oklch(0.98 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.25 0.018 250)" }}>
        <div>{payload[0]?.payload?.site}</div>
        <div style={{ color: "oklch(0.40 0.18 240)" }}>{payload[0]?.value?.toLocaleString()} cu yd</div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const totalYardage = JOB_SITES.filter(s => s.status === "active").reduce((s, j) => s + j.yardage, 0);
  const totalCrew = JOB_SITES.reduce((s, j) => s + j.crew, 0);
  const lowStockCount = MATERIALS.filter(m => m.stock < m.reorder).length;

  return (
    <DashboardLayout title="Executive Dashboard">
      <div className="p-6 space-y-6">

        {/* Critical alert banner */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: "oklch(0.62 0.22 25 / 10%)", border: "1px solid oklch(0.62 0.22 25 / 25%)" }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.50 0.22 25)" }} />
          <div className="text-sm" style={{ color: "oklch(0.50 0.22 25)" }}>
            <strong>JS-001 critical window:</strong> 4,200 cu yd pour must complete before 1 PM weather cutoff.
            Batch Plant moisture sensor #3 on manual override — verify spot-check plan with QC lead.
          </div>
          <Link href="/daily-brief" className="ml-auto text-xs font-semibold no-underline flex-shrink-0" style={{ color: "oklch(0.50 0.22 25)" }}>
            View Brief →
          </Link>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={Building2} label="Active Pours Today"     value={`${JOB_SITES.filter(s => s.status === "active").length} sites`}  sub={`${totalYardage.toLocaleString()} cu yd total`} color="oklch(0.45 0.20 240)" />
          <MetricCard icon={Truck}     label="Fleet Operational"      value="9 / 12"  sub="2 maintenance · 1 alert"  color="oklch(0.45 0.18 145)" />
          <MetricCard icon={Users}     label="Crew On-Site / En-Route" value={`${totalCrew} staff`} sub="3 additional on standby"  color="oklch(0.45 0.18 270)" />
          <MetricCard icon={Package}   label="Low Stock Materials"    value={lowStockCount}  sub="Reorder required"  color="oklch(0.50 0.22 25)" />
        </div>

        {/* Pour chart + Fleet pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart */}
          <div className="lg:col-span-2 data-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>Planned Pour Volume by Job Site</div>
                <div className="text-xs mt-0.5" style={{ color: "oklch(0.48 0.012 250)" }}>March 7, 2026 — cubic yards</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={POUR_CHART} barCategoryGap="35%">
                <XAxis dataKey="site" tick={{ fontSize: 10, fill: "oklch(0.52 0.010 250)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "oklch(0.52 0.010 250)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(1)}K`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(1 0 0 / 4%)" }} />
                <Bar dataKey="planned" radius={[4, 4, 0, 0]}>
                  {POUR_CHART.map((d) => (
                    <Cell key={d.site} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fleet pie */}
          <div className="data-card">
            <div className="text-sm font-semibold mb-1" style={{ color: "oklch(0.18 0.018 250)" }}>Fleet Status</div>
            <div className="text-xs mb-3" style={{ color: "oklch(0.48 0.012 250)" }}>12 total units</div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={FLEET_SUMMARY} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="count" paddingAngle={3}>
                  {FLEET_SUMMARY.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v} units`} contentStyle={{ background: "oklch(0.98 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", fontSize: 11, color: "oklch(0.25 0.018 250)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {FLEET_SUMMARY.map((r) => (
                <div key={r.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                    <span className="text-[10px]" style={{ color: "oklch(0.48 0.012 250)" }}>{r.label}</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold" style={{ color: r.color }}>{r.count}</span>
                </div>
              ))}
            </div>
            <Link href="/fleet" className="block mt-3 text-center text-xs no-underline" style={{ color: "oklch(0.55 0.18 240)" }}>
              View Fleet Details →
            </Link>
          </div>
        </div>

        {/* Job site cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>Job Site Status</div>
            <Link href="/operations" className="text-xs no-underline" style={{ color: "oklch(0.65 0.18 240)" }}>View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {JOB_SITES.map((site) => {
              const statusColor = site.status === "active" ? "oklch(0.45 0.18 145)" : site.status === "standby" ? "oklch(0.55 0.18 75)" : "oklch(0.52 0.010 250)";
              const statusBg = site.status === "active" ? "oklch(0.97 0.010 145)" : site.status === "standby" ? "oklch(0.98 0.012 75)" : "oklch(0.985 0.003 240)";
              return (
                <div
                  key={site.id}
                  className="p-4 rounded-lg"
                  style={{ background: statusBg, border: `1px solid ${statusColor}30` }}
                >
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div className="text-xs font-bold leading-tight" style={{ color: "oklch(0.18 0.018 250)" }}>{site.name}</div>
                    <div className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase flex-shrink-0" style={{ background: `${statusColor}18`, color: statusColor }}>
                      {site.status}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono mb-1" style={{ color: "oklch(0.52 0.010 250)" }}>{site.id}</div>
                  {site.yardage > 0 && (
                    <div className="text-sm font-bold font-mono" style={{ color: statusColor }}>{site.yardage.toLocaleString()} <span className="text-[10px] font-normal">cu yd</span></div>
                  )}
                  {site.pourStart !== "TBD" && site.pourStart !== "03/10" && (
                    <div className="text-[10px] mt-1" style={{ color: "oklch(0.52 0.010 250)" }}>
                      Pour: {site.pourStart} → {site.deadline}
                    </div>
                  )}
                  {site.crew > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>
                      <span><Users className="w-3 h-3 inline mr-0.5" />{site.crew} crew</span>
                      <span><Truck className="w-3 h-3 inline mr-0.5" />{site.mixers} mixers</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts + Material inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Alerts */}
          <div className="data-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: "oklch(0.55 0.18 75)" }} />
                <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>Active Alerts</div>
              </div>
              <Link href="/daily-brief" className="text-xs no-underline" style={{ color: "oklch(0.65 0.18 240)" }}>Full brief →</Link>
            </div>
            <div className="space-y-2">
              {ALERTS.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-2.5 rounded" style={{ background: "oklch(0.985 0.003 240)" }}>
                  <div className="mt-0.5">
                    {alert.severity === "warning"
                      ? <AlertTriangle className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.18 75)" }} />
                      : <Clock className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.15 240)" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: "oklch(0.22 0.018 250)" }}>{alert.title}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>{alert.source}</div>
                    <div className="text-[10px] mt-0.5 italic" style={{ color: "oklch(0.48 0.012 250)" }}>{alert.note}</div>
                  </div>
                  <div className={`badge-${alert.severity === "warning" ? "warning" : "info"} mt-0.5 flex-shrink-0`}>{alert.severity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Material inventory */}
          <div className="data-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" style={{ color: "oklch(0.45 0.18 145)" }} />
                <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>Material Inventory</div>
              </div>
              <span className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{lowStockCount} low-stock</span>
            </div>
            <div className="space-y-2.5">
              {MATERIALS.map((mat) => {
                const pct = Math.min((mat.stock / (mat.reorder * 3)) * 100, 100);
                const isLow = mat.stock < mat.reorder;
                return (
                  <div key={mat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {isLow && <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: "oklch(0.50 0.22 25)" }} />}
                        <span className="text-[11px] font-medium" style={{ color: isLow ? "oklch(0.45 0.20 25)" : "oklch(0.22 0.018 250)" }}>{mat.name}</span>
                      </div>
                      <span className="text-[10px] font-mono" style={{ color: isLow ? "oklch(0.50 0.22 25)" : "oklch(0.52 0.010 250)" }}>
                        {mat.stock} {mat.unit}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "oklch(0.92 0.005 240)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: isLow ? "oklch(0.50 0.22 25)" : mat.color }}
                      />
                    </div>
                    {isLow && (
                      <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.55 0.18 25)" }}>
                        Below reorder point ({mat.reorder} {mat.unit})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/daily-brief"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold no-underline transition-all"
            style={{ background: "oklch(0.45 0.20 240)", color: "white", boxShadow: "0 2px 8px oklch(0.45 0.20 240 / 30%)" }}
          >
            <Zap className="w-4 h-4" />
            Generate Daily Brief
          </Link>
          <Link
            href="/fleet"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium no-underline"
            style={{ background: "oklch(0.97 0.005 240)", border: "1px solid oklch(0.88 0.005 240)", color: "oklch(0.35 0.018 250)" }}
          >
            <Truck className="w-4 h-4" />
            Fleet & Equipment
          </Link>
          <Link
            href="/operations"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium no-underline"
            style={{ background: "oklch(0.97 0.005 240)", border: "1px solid oklch(0.88 0.005 240)", color: "oklch(0.35 0.018 250)" }}
          >
            <Building2 className="w-4 h-4" />
            Operations Center
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
