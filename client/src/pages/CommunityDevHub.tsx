/**
 * CommunityDevHub — Civic Intelligence Light
 * Community Development operations: TIF district tracking, permit pipeline,
 * grant management, and the critical FY2024 budget burn-rate chart showing
 * the 115% overrun that is the top audit finding for West Liberty.
 */
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, TrendingDown, AlertTriangle, Building2, FileText,
  DollarSign, MapPin, Clock, CheckCircle2, XCircle, Plus,
  BarChart3, Users, Calendar, ExternalLink
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line, Legend
} from "recharts";

// ── Budget burn-rate data (FY2024 actuals — the 115% overrun) ────────────────
const BURN_RATE_MONTHLY = [
  { month: "Jul", budget: 42500, actual: 38200, cumBudget: 42500, cumActual: 38200 },
  { month: "Aug", budget: 42500, actual: 44100, cumBudget: 85000, cumActual: 82300 },
  { month: "Sep", budget: 42500, actual: 51800, cumBudget: 127500, cumActual: 134100 },
  { month: "Oct", budget: 42500, actual: 48900, cumBudget: 170000, cumActual: 183000 },
  { month: "Nov", budget: 42500, actual: 55200, cumBudget: 212500, cumActual: 238200 },
  { month: "Dec", budget: 42500, actual: 62100, cumBudget: 255000, cumActual: 300300 },
  { month: "Jan", budget: 42500, actual: 58400, cumBudget: 297500, cumActual: 358700 },
  { month: "Feb", budget: 42500, actual: 71300, cumBudget: 340000, cumActual: 430000 },
  { month: "Mar", budget: 42500, actual: 66800, cumBudget: 382500, cumActual: 496800 },
  { month: "Apr", budget: 42500, actual: 59200, cumBudget: 425000, cumActual: 556000 },
  { month: "May", budget: 42500, actual: 68400, cumBudget: 467500, cumActual: 624400 },
  { month: "Jun", budget: 42500, actual: 72700, cumBudget: 510000, cumActual: 697100 },
];

const BUDGET_SUMMARY = {
  approved: 510000,
  actual: 697100,
  variance: 187100,
  variancePct: 36.7,
  totalBudgetLine: "Community Development",
  fy: "FY2024",
};

// ── TIF Districts ────────────────────────────────────────────────────────────
const TIF_DISTRICTS = [
  {
    id: "TIF-1", name: "Downtown Urban Renewal",
    established: 2008, expires: 2028,
    totalValue: 4820000, baseValue: 2100000, increment: 2720000,
    annualRevenue: 136000, ytdRevenue: 102000, budget: 115000,
    status: "active", projects: 3,
    description: "Covers the commercial core along Calhoun St and Elm St corridors",
  },
  {
    id: "TIF-2", name: "Industrial Park Expansion",
    established: 2015, expires: 2035,
    totalValue: 8340000, baseValue: 5200000, increment: 3140000,
    annualRevenue: 157000, ytdRevenue: 118000, budget: 145000,
    status: "active", projects: 2,
    description: "West Liberty Industrial Park — supports manufacturing and logistics tenants",
  },
  {
    id: "TIF-3", name: "Highway 6 Corridor",
    established: 2019, expires: 2039,
    totalValue: 3210000, baseValue: 2800000, increment: 410000,
    annualRevenue: 20500, ytdRevenue: 15400, budget: 22000,
    status: "active", projects: 1,
    description: "Highway 6 commercial strip — retail and service sector development",
  },
];

// ── Permit pipeline ──────────────────────────────────────────────────────────
const PERMITS = [
  {
    id: "BP-2024-0412", type: "Commercial Build", applicant: "Midwest Logistics LLC",
    address: "1420 Industrial Dr", value: 2800000, submitted: "Jan 15, 2024",
    status: "approved", inspector: "Dave Kowalski", days: 18,
    description: "New 45,000 sq ft distribution warehouse — Industrial Park",
  },
  {
    id: "BP-2024-0389", type: "Residential — Multi-Family", applicant: "Hernandez Properties",
    address: "312 N Calhoun St", value: 485000, submitted: "Feb 2, 2024",
    status: "under-review", inspector: "Dave Kowalski", days: 28,
    description: "8-unit apartment conversion from commercial building",
  },
  {
    id: "BP-2024-0401", type: "Commercial Renovation", applicant: "West Liberty Pharmacy",
    address: "109 E 3rd St", value: 92000, submitted: "Feb 18, 2024",
    status: "approved", inspector: "Sarah Timm", days: 12,
    description: "Interior renovation and ADA accessibility upgrades",
  },
  {
    id: "BP-2024-0415", type: "Residential — Single Family", applicant: "Morales Construction",
    address: "847 Sunset Dr", value: 215000, submitted: "Mar 1, 2024",
    status: "pending", inspector: "Unassigned", days: 2,
    description: "New single-family home — 3BR/2BA, 1,850 sq ft",
  },
  {
    id: "BP-2024-0398", type: "Demolition", applicant: "City of West Liberty",
    address: "220 W 5th St", value: 28000, submitted: "Jan 28, 2024",
    status: "approved", inspector: "Sarah Timm", days: 8,
    description: "Demolition of condemned structure — blighted property program",
  },
  {
    id: "BP-2024-0422", type: "Sign Permit", applicant: "Fareway Stores Inc",
    address: "1200 N Calhoun St", value: 12000, submitted: "Mar 3, 2024",
    status: "pending", inspector: "Unassigned", days: 1,
    description: "Replacement of exterior signage — updated brand identity",
  },
];

// ── Grants ───────────────────────────────────────────────────────────────────
const GRANTS = [
  {
    id: "GR-2024-001", name: "CDBG — Community Development Block Grant",
    agency: "HUD / Iowa Economic Development Authority",
    amount: 350000, received: 262500, remaining: 87500,
    purpose: "Downtown streetscape improvements and ADA compliance upgrades",
    status: "active", deadline: "Dec 31, 2024", matchRequired: 87500,
    matchMet: 87500, reportsDue: "Quarterly",
  },
  {
    id: "GR-2024-002", name: "Iowa Main Street — Downtown Revitalization",
    agency: "Iowa Economic Development Authority",
    amount: 75000, received: 75000, remaining: 0,
    purpose: "Façade improvement grants for downtown commercial property owners",
    status: "completed", deadline: "Jun 30, 2024", matchRequired: 75000,
    matchMet: 75000, reportsDue: "Final submitted",
  },
  {
    id: "GR-2024-003", name: "USDA Rural Development — Business Grant",
    agency: "USDA Rural Development",
    amount: 150000, received: 0, remaining: 150000,
    purpose: "Small business technical assistance and micro-loan program",
    status: "pending-award", deadline: "Apr 15, 2024", matchRequired: 50000,
    matchMet: 50000, reportsDue: "Semi-annual",
  },
  {
    id: "GR-2024-004", name: "EPA Brownfields Assessment Grant",
    agency: "US Environmental Protection Agency",
    amount: 200000, received: 100000, remaining: 100000,
    purpose: "Phase I/II environmental assessments — former industrial sites",
    status: "active", deadline: "Sep 30, 2025", matchRequired: 0,
    matchMet: 0, reportsDue: "Annual",
  },
];

// ── Overspend categories ─────────────────────────────────────────────────────
const OVERSPEND_BREAKDOWN = [
  { category: "Personnel — Overtime", budgeted: 18000, actual: 42800, variance: 24800 },
  { category: "Contracted Services", budgeted: 85000, actual: 142000, variance: 57000 },
  { category: "Grant Match Obligations", budgeted: 62500, actual: 87500, variance: 25000 },
  { category: "Legal & Consulting", budgeted: 28000, actual: 61400, variance: 33400 },
  { category: "Materials & Supplies", budgeted: 14500, actual: 31200, variance: 16700 },
  { category: "Travel & Training", budgeted: 8000, actual: 18200, variance: 10200 },
  { category: "Capital Outlay", budgeted: 294000, actual: 314000, variance: 20000 },
];

const statusColor: Record<string, string> = {
  active: "oklch(0.45 0.18 145)",
  completed: "oklch(0.50 0.010 250)",
  "pending-award": "oklch(0.65 0.20 55)",
  approved: "oklch(0.45 0.18 145)",
  "under-review": "oklch(0.45 0.20 240)",
  pending: "oklch(0.65 0.20 55)",
  denied: "oklch(0.55 0.22 25)",
};

function StatusBadge({ status }: { status: string }) {
  const color = statusColor[status] ?? "oklch(0.50 0.010 250)";
  const label = status.replace(/-/g, " ");
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {label}
    </span>
  );
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function CommunityDevHub() {
  const [activeTab, setActiveTab] = useState("budget");

  const totalGrantFunding = GRANTS.reduce((s, g) => s + g.amount, 0);
  const totalGrantReceived = GRANTS.reduce((s, g) => s + g.received, 0);
  const openPermits = PERMITS.filter(p => p.status === "pending" || p.status === "under-review").length;
  const activeTIF = TIF_DISTRICTS.filter(t => t.status === "active").length;

  return (
    <DashboardLayout title="Community Development Hub">
      <div className="p-6 space-y-6">

        {/* Critical alert banner */}
        <div
          className="rounded-xl border p-4 flex items-start gap-3"
          style={{ background: "oklch(0.55 0.22 25 / 6%)", borderColor: "oklch(0.55 0.22 25 / 40%)" }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.50 0.22 25)" }} />
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: "oklch(0.38 0.22 25)" }}>
              FY2024 Audit Finding — Critical Budget Overrun
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: "oklch(0.45 0.18 25)" }}>
              Community Development exceeded its approved FY2024 budget of <strong>{fmt(BUDGET_SUMMARY.approved)}</strong> by{" "}
              <strong>{fmt(BUDGET_SUMMARY.variance)} ({BUDGET_SUMMARY.variancePct}%)</strong>, reaching{" "}
              <strong>{fmt(BUDGET_SUMMARY.actual)}</strong> in actual expenditures. This is the primary finding in the FY2024 audit report.
              Primary drivers: contracted services overage ($57K), legal/consulting ($33.4K), and grant match obligations ($25K).
            </div>
          </div>
          <Button size="sm" className="flex-shrink-0 text-[11px]" style={{ background: "oklch(0.50 0.22 25)", color: "white" }}>
            View Audit Finding
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "FY2024 Budget Variance", value: `+${BUDGET_SUMMARY.variancePct}%`, sub: `${fmt(BUDGET_SUMMARY.variance)} over budget`, icon: TrendingUp, color: "oklch(0.50 0.22 25)" },
            { label: "Active TIF Districts", value: String(activeTIF), sub: `${fmt(TIF_DISTRICTS.reduce((s, t) => s + t.increment, 0))} total increment`, icon: MapPin, color: "oklch(0.45 0.20 240)" },
            { label: "Open Permits", value: String(openPermits), sub: `${PERMITS.length} total this FY`, icon: FileText, color: "oklch(0.65 0.20 55)" },
            { label: "Grant Portfolio", value: fmt(totalGrantFunding), sub: `${fmt(totalGrantReceived)} received YTD`, icon: DollarSign, color: "oklch(0.45 0.18 145)" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                  <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: kpi.color, fontFamily: "'JetBrains Mono', monospace" }}>{kpi.value}</div>
              <div className="text-[11px] font-medium mt-0.5" style={{ color: "oklch(0.35 0.014 250)" }}>{kpi.label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="budget">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />Budget
            </TabsTrigger>
            <TabsTrigger value="tif">
              <MapPin className="w-3.5 h-3.5 mr-1.5" />TIF Districts
            </TabsTrigger>
            <TabsTrigger value="permits">
              <FileText className="w-3.5 h-3.5 mr-1.5" />Permits
              {openPermits > 0 && (
                <span className="ml-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: "oklch(0.65 0.20 55)", color: "white" }}>{openPermits}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="grants">
              <DollarSign className="w-3.5 h-3.5 mr-1.5" />Grants
            </TabsTrigger>
          </TabsList>

          {/* Budget Burn-Rate Tab */}
          <TabsContent value="budget" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Cumulative burn-rate chart */}
              <div className="rounded-xl border p-5" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="mb-4">
                  <div className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                    Cumulative Spend vs. Budget — FY2024
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                    Actual spending crossed budget threshold in September
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={BURN_RATE_MONTHLY}>
                    <defs>
                      <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.45 0.20 240)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="oklch(0.45 0.20 240)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.55 0.22 25)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="oklch(0.55 0.22 25)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 6%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.50 0.010 250)" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: "oklch(0.50 0.010 250)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: number, name: string) => [fmt(v), name === "cumBudget" ? "Budget (Cumulative)" : "Actual (Cumulative)"]}
                      contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 10%)", borderRadius: "8px", fontSize: "11px" }}
                    />
                    <ReferenceLine y={510000} stroke="oklch(0.45 0.20 240)" strokeDasharray="6 3" label={{ value: "Budget Cap $510K", position: "insideTopRight", fontSize: 10, fill: "oklch(0.45 0.20 240)" }} />
                    <Area type="monotone" dataKey="cumBudget" name="cumBudget" stroke="oklch(0.45 0.20 240)" strokeWidth={2} fill="url(#budgetGrad)" />
                    <Area type="monotone" dataKey="cumActual" name="cumActual" stroke="oklch(0.55 0.22 25)" strokeWidth={2.5} fill="url(#actualGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2 text-[11px]">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full inline-block" style={{ background: "oklch(0.45 0.20 240)" }} /> Approved Budget</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full inline-block" style={{ background: "oklch(0.55 0.22 25)" }} /> Actual Spend</span>
                </div>
              </div>

              {/* Monthly variance chart */}
              <div className="rounded-xl border p-5" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="mb-4">
                  <div className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                    Monthly Budget vs. Actual
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                    Monthly approved: {fmt(42500)} · Every month exceeded budget
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={BURN_RATE_MONTHLY} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 6%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.50 0.010 250)" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: "oklch(0.50 0.010 250)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: number, name: string) => [fmt(v), name === "budget" ? "Budget" : "Actual"]}
                      contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 10%)", borderRadius: "8px", fontSize: "11px" }}
                    />
                    <Bar dataKey="budget" name="budget" fill="oklch(0.45 0.20 240)" radius={[3, 3, 0, 0]} opacity={0.6} />
                    <Bar dataKey="actual" name="actual" fill="oklch(0.55 0.22 25)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overspend breakdown */}
            <div className="rounded-xl border p-5" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="text-sm font-semibold mb-4" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                Overspend Breakdown by Category
              </div>
              <div className="space-y-3">
                {OVERSPEND_BREAKDOWN.sort((a, b) => b.variance - a.variance).map((item) => {
                  const pct = Math.round((item.actual / item.budgeted) * 100);
                  return (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-medium" style={{ color: "oklch(0.30 0.014 250)" }}>{item.category}</span>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span style={{ color: "oklch(0.50 0.010 250)" }}>Budget: {fmt(item.budgeted)}</span>
                          <span style={{ color: "oklch(0.50 0.010 250)" }}>Actual: {fmt(item.actual)}</span>
                          <span className="font-semibold font-mono" style={{ color: "oklch(0.50 0.22 25)" }}>+{fmt(item.variance)}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: "oklch(0.55 0.22 25 / 10%)", color: "oklch(0.45 0.22 25)" }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.92 0.004 286)" }}>
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (item.budgeted / item.actual) * 100)}%`,
                            background: "oklch(0.45 0.20 240)",
                          }}
                        />
                        <div
                          className="absolute top-0 h-full rounded-full"
                          style={{
                            left: `${(item.budgeted / item.actual) * 100}%`,
                            width: `${100 - (item.budgeted / item.actual) * 100}%`,
                            background: "oklch(0.55 0.22 25)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" style={{ color: "oklch(0.50 0.22 25)" }} />
                  <span className="text-[12px] font-medium" style={{ color: "oklch(0.35 0.014 250)" }}>Total Overrun: {fmt(BUDGET_SUMMARY.variance)} ({BUDGET_SUMMARY.variancePct}% over approved budget)</span>
                </div>
                <Button size="sm" variant="outline" className="text-[11px]">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />Export for City Council
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TIF Districts Tab */}
          <TabsContent value="tif" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Tax Increment Financing Districts
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                  3 active TIF districts — total increment value {fmt(TIF_DISTRICTS.reduce((s, t) => s + t.increment, 0))}
                </p>
              </div>
              <div className="text-[11px] px-2 py-1 rounded" style={{ background: "oklch(0.65 0.20 55 / 10%)", color: "oklch(0.50 0.20 55)" }}>
                TIF-1 revenue variance: −{fmt(13000)}
              </div>
            </div>

            {TIF_DISTRICTS.map((tif) => {
              const revPct = Math.round((tif.ytdRevenue / tif.annualRevenue) * 100);
              const incrementPct = Math.round((tif.increment / tif.totalValue) * 100);
              return (
                <div key={tif.id} className="rounded-xl border p-5" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold" style={{ color: "oklch(0.45 0.010 250)" }}>{tif.id}</span>
                        <StatusBadge status={tif.status} />
                        <span className="text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>Est. {tif.established} · Expires {tif.expires}</span>
                      </div>
                      <div className="text-[15px] font-semibold mt-0.5" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>{tif.name}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{tif.description}</div>
                    </div>
                    <Button variant="outline" size="sm" className="text-[11px] flex-shrink-0">
                      <MapPin className="w-3 h-3 mr-1" />View Map
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Total AV", value: fmt(tif.totalValue), color: "oklch(0.35 0.014 250)" },
                      { label: "Base Value", value: fmt(tif.baseValue), color: "oklch(0.50 0.010 250)" },
                      { label: "TIF Increment", value: fmt(tif.increment), color: "oklch(0.45 0.20 240)" },
                      { label: "Annual Revenue", value: fmt(tif.annualRevenue), color: "oklch(0.45 0.18 145)" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-3 rounded-lg" style={{ background: "oklch(0.965 0.005 240)" }}>
                        <div className="text-[13px] font-mono font-semibold" style={{ color: stat.color }}>{stat.value}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span style={{ color: "oklch(0.45 0.010 250)" }}>YTD Revenue Collection</span>
                        <span className="font-mono" style={{ color: "oklch(0.45 0.18 145)" }}>{fmt(tif.ytdRevenue)} / {fmt(tif.annualRevenue)} ({revPct}%)</span>
                      </div>
                      <Progress value={revPct} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span style={{ color: "oklch(0.45 0.010 250)" }}>Increment as % of Total Value</span>
                        <span className="font-mono" style={{ color: "oklch(0.45 0.20 240)" }}>{incrementPct}%</span>
                      </div>
                      <Progress value={incrementPct} className="h-1.5" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-[11px]" style={{ color: "oklch(0.50 0.010 250)" }}>
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{tif.projects} active projects</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{tif.expires - new Date().getFullYear()} years remaining</span>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Permits Tab */}
          <TabsContent value="permits" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Building Permit Pipeline
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                  {PERMITS.length} permits this FY · {fmt(PERMITS.reduce((s, p) => s + p.value, 0))} total project value
                </p>
              </div>
              <Button size="sm" style={{ background: "oklch(0.45 0.20 240)", color: "white" }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />New Permit
              </Button>
            </div>

            <div className="space-y-3">
              {PERMITS.map((permit) => (
                <div key={permit.id} className="rounded-xl border p-4" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-semibold" style={{ color: "oklch(0.45 0.010 250)" }}>{permit.id}</span>
                        <StatusBadge status={permit.status} />
                        <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "oklch(0.965 0.005 240)", color: "oklch(0.50 0.010 250)" }}>{permit.type}</span>
                      </div>
                      <div className="text-[13px] font-medium mt-1" style={{ color: "oklch(0.22 0.018 250)" }}>{permit.description}</div>
                      <div className="flex items-center gap-4 mt-1.5 text-[11px]" style={{ color: "oklch(0.50 0.010 250)" }}>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{permit.address}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{permit.applicant}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{fmt(permit.value)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{permit.days} days in review</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <Button variant="outline" size="sm" className="text-[11px] h-7">
                        <ExternalLink className="w-3 h-3 mr-1" />View
                      </Button>
                      {permit.status === "pending" && (
                        <Button size="sm" className="text-[11px] h-7" style={{ background: "oklch(0.45 0.18 145)", color: "white" }}>
                          Assign
                        </Button>
                      )}
                      {permit.status === "under-review" && (
                        <Button size="sm" className="text-[11px] h-7" style={{ background: "oklch(0.45 0.20 240)", color: "white" }}>
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Grants Tab */}
          <TabsContent value="grants" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Grant Portfolio
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                  {GRANTS.length} grants · {fmt(totalGrantFunding)} total · {fmt(totalGrantReceived)} received YTD
                </p>
              </div>
              <Button size="sm" style={{ background: "oklch(0.45 0.20 240)", color: "white" }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />Add Grant
              </Button>
            </div>

            <div className="space-y-4">
              {GRANTS.map((grant) => {
                const receivedPct = grant.amount > 0 ? Math.round((grant.received / grant.amount) * 100) : 100;
                return (
                  <div key={grant.id} className="rounded-xl border p-5" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-semibold" style={{ color: "oklch(0.45 0.010 250)" }}>{grant.id}</span>
                          <StatusBadge status={grant.status} />
                        </div>
                        <div className="text-[14px] font-semibold mt-0.5" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>{grant.name}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: "oklch(0.50 0.010 250)" }}>{grant.agency}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-mono font-bold" style={{ color: "oklch(0.45 0.18 145)", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(grant.amount)}</div>
                        <div className="text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>total award</div>
                      </div>
                    </div>

                    <div className="text-[12px] mb-3" style={{ color: "oklch(0.40 0.010 250)" }}>{grant.purpose}</div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[
                        { label: "Received", value: fmt(grant.received), color: "oklch(0.45 0.18 145)" },
                        { label: "Remaining", value: fmt(grant.remaining), color: grant.remaining > 0 ? "oklch(0.65 0.20 55)" : "oklch(0.50 0.010 250)" },
                        { label: "Match Required", value: fmt(grant.matchRequired), color: grant.matchMet >= grant.matchRequired ? "oklch(0.45 0.18 145)" : "oklch(0.55 0.22 25)" },
                      ].map((stat) => (
                        <div key={stat.label} className="p-2.5 rounded-lg text-center" style={{ background: "oklch(0.965 0.005 240)" }}>
                          <div className="text-[13px] font-mono font-semibold" style={{ color: stat.color }}>{stat.value}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span style={{ color: "oklch(0.45 0.010 250)" }}>Drawdown Progress</span>
                        <span className="font-mono" style={{ color: "oklch(0.45 0.18 145)" }}>{receivedPct}%</span>
                      </div>
                      <Progress value={receivedPct} className="h-1.5" />
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-[11px]" style={{ color: "oklch(0.50 0.010 250)" }}>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Deadline: {grant.deadline}</span>
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" />Reports: {grant.reportsDue}</span>
                      {grant.matchMet >= grant.matchRequired
                        ? <span className="flex items-center gap-1" style={{ color: "oklch(0.45 0.18 145)" }}><CheckCircle2 className="w-3 h-3" />Match obligation met</span>
                        : <span className="flex items-center gap-1" style={{ color: "oklch(0.55 0.22 25)" }}><XCircle className="w-3 h-3" />Match gap: {fmt(grant.matchRequired - grant.matchMet)}</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-[11px] text-center py-2" style={{ color: "oklch(0.60 0.010 250)" }}>
          Community Development Hub — City of West Liberty, IA · FY2024 Audit Data · Iowa Code Ch. 384
        </div>
      </div>
    </DashboardLayout>
  );
}
