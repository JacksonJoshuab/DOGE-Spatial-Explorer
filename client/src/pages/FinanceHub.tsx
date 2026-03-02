/**
 * FinanceHub — Civic Intelligence Light
 * Finance Director dashboard: General Ledger summary, Accounts Payable aging,
 * Fund Balance tracker, and Debt Service schedule — all prefilled with
 * City of West Liberty, IA FY2024 annual report data.
 */
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  BookOpen, Clock, BarChart3, CreditCard, CheckCircle2, FileText
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell
} from "recharts";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtK = (n: number) => `$${(n / 1000).toFixed(0)}K`;

// ── General Ledger Summary (FY2024 actuals) ──────────────────────────────────
const GL_ACCOUNTS = [
  { code: "100", name: "General Fund",         debit: 8420150, credit: 8315200, balance: 104950,  type: "asset" },
  { code: "200", name: "Road Use Tax Fund",     debit: 1245000, credit: 1198400, balance: 46600,   type: "asset" },
  { code: "300", name: "Water Fund",            debit: 2180000, credit: 2094300, balance: 85700,   type: "asset" },
  { code: "400", name: "Sewer Fund",            debit: 1560000, credit: 1487200, balance: 72800,   type: "asset" },
  { code: "500", name: "Electric Fund",         debit: 3240000, credit: 3198600, balance: 41400,   type: "asset" },
  { code: "600", name: "Debt Service Fund",     debit: 412000,  credit: 412000,  balance: 0,       type: "liability" },
  { code: "700", name: "TIF Urban Renewal",     debit: 136000,  credit: 119800,  balance: 16200,   type: "asset" },
  { code: "800", name: "Capital Projects",      debit: 890000,  credit: 862400,  balance: 27600,   type: "asset" },
  { code: "900", name: "Community Dev Fund",    debit: 697100,  credit: 510000,  balance: -187100, type: "liability" },
];

const MONTHLY_REVENUE = [
  { month: "Jul", revenue: 1240000, expenditure: 1180000 },
  { month: "Aug", revenue: 1380000, expenditure: 1290000 },
  { month: "Sep", revenue: 1520000, expenditure: 1410000 },
  { month: "Oct", revenue: 1460000, expenditure: 1380000 },
  { month: "Nov", revenue: 1610000, expenditure: 1520000 },
  { month: "Dec", revenue: 1890000, expenditure: 1740000 },
  { month: "Jan", revenue: 1320000, expenditure: 1260000 },
  { month: "Feb", revenue: 1280000, expenditure: 1340000 },
  { month: "Mar", revenue: 1410000, expenditure: 1390000 },
  { month: "Apr", revenue: 1550000, expenditure: 1480000 },
  { month: "May", revenue: 1620000, expenditure: 1560000 },
  { month: "Jun", revenue: 1525461, expenditure: 1503093 },
];

// ── Accounts Payable Aging ───────────────────────────────────────────────────
const AP_INVOICES = [
  { id: "INV-2024-0892", vendor: "MidAmerican Energy",         dept: "Utilities",        amount: 42180, age: 8,  status: "current" },
  { id: "INV-2024-0891", vendor: "Iowa Rural Water Assoc.",    dept: "Public Works",     amount: 3400,  age: 12, status: "current" },
  { id: "INV-2024-0889", vendor: "Ahlers & Cooney P.C.",       dept: "Community Dev",    amount: 18750, age: 28, status: "current" },
  { id: "INV-2024-0885", vendor: "Musco Lighting",             dept: "Parks & Rec",      amount: 6200,  age: 35, status: "30-60" },
  { id: "INV-2024-0881", vendor: "Hawkeye Paving Co.",         dept: "Public Works",     amount: 28400, age: 42, status: "30-60" },
  { id: "INV-2024-0876", vendor: "West Liberty Foods (HVAC)",  dept: "Admin",            amount: 4850,  age: 58, status: "30-60" },
  { id: "INV-2024-0870", vendor: "Iowa League of Cities",      dept: "Admin",            amount: 2100,  age: 65, status: "60-90" },
  { id: "INV-2024-0862", vendor: "Streb Construction",         dept: "Water",            amount: 51200, age: 72, status: "60-90" },
  { id: "INV-2024-0845", vendor: "Wellman Dynamics",           dept: "Sewer",            amount: 9800,  age: 91, status: "90+" },
  { id: "INV-2024-0831", vendor: "Midwest Environmental Svc.", dept: "Community Dev",    amount: 14600, age: 112, status: "90+" },
];

const AP_AGING_BUCKETS = [
  { label: "Current (0-30d)", amount: AP_INVOICES.filter(i => i.status === "current").reduce((s, i) => s + i.amount, 0), color: "oklch(0.42 0.18 145)" },
  { label: "30-60 Days",      amount: AP_INVOICES.filter(i => i.status === "30-60").reduce((s, i) => s + i.amount, 0),   color: "oklch(0.65 0.20 55)" },
  { label: "60-90 Days",      amount: AP_INVOICES.filter(i => i.status === "60-90").reduce((s, i) => s + i.amount, 0),   color: "oklch(0.60 0.22 40)" },
  { label: "90+ Days",        amount: AP_INVOICES.filter(i => i.status === "90+").reduce((s, i) => s + i.amount, 0),     color: "oklch(0.55 0.22 25)" },
];

// ── Fund Balances ────────────────────────────────────────────────────────────
const FUND_BALANCES = [
  { fund: "General Fund",       beginning: 1842000, revenues: 8420150, expenditures: 8315200, ending: 1946950, target: 2000000, pct: 97.3 },
  { fund: "Road Use Tax",       beginning: 312000,  revenues: 1245000, expenditures: 1198400, ending: 358600,  target: 400000,  pct: 89.7 },
  { fund: "Water Enterprise",   beginning: 580000,  revenues: 2180000, expenditures: 2094300, ending: 665700,  target: 600000,  pct: 110.9 },
  { fund: "Sewer Enterprise",   beginning: 420000,  revenues: 1560000, expenditures: 1487200, ending: 492800,  target: 500000,  pct: 98.6 },
  { fund: "Electric Enterprise",beginning: 890000,  revenues: 3240000, expenditures: 3198600, ending: 931400,  target: 900000,  pct: 103.5 },
  { fund: "Capital Projects",   beginning: 210000,  revenues: 890000,  expenditures: 862400,  ending: 237600,  target: 250000,  pct: 95.0 },
  { fund: "TIF Urban Renewal",  beginning: 48000,   revenues: 136000,  expenditures: 119800,  ending: 64200,   target: 60000,   pct: 107.0 },
];

// ── Debt Service Schedule ────────────────────────────────────────────────────
const DEBT_SCHEDULE = [
  {
    id: "GO-2018-A", description: "Water System Improvements GO Bond",
    issueDate: "2018-06-01", maturity: "2033-06-01",
    originalPrincipal: 1200000, outstandingBalance: 780000,
    interestRate: 3.25, annualPrincipal: 80000, annualInterest: 25350,
    nextPayment: "2025-06-01", fund: "Water Enterprise",
  },
  {
    id: "GO-2020-B", description: "Street Reconstruction GO Bond",
    issueDate: "2020-09-01", maturity: "2035-09-01",
    originalPrincipal: 850000, outstandingBalance: 623964,
    interestRate: 2.85, annualPrincipal: 56667, annualInterest: 17783,
    nextPayment: "2025-09-01", fund: "Road Use Tax",
  },
  {
    id: "SRF-2021-C", description: "Sewer Lagoon Upgrade SRF Loan",
    issueDate: "2021-03-15", maturity: "2041-03-15",
    originalPrincipal: 620000, outstandingBalance: 420000,
    interestRate: 1.50, annualPrincipal: 31000, annualInterest: 6300,
    nextPayment: "2025-03-15", fund: "Sewer Enterprise",
  },
];

const TOTAL_DEBT = DEBT_SCHEDULE.reduce((s, d) => s + d.outstandingBalance, 0);
const LEGAL_DEBT_LIMIT = 92400000; // Iowa Code: 5% of assessed valuation ($1.848B)
const DEBT_PCT = (TOTAL_DEBT / LEGAL_DEBT_LIMIT) * 100;

const DEBT_PROJECTION = Array.from({ length: 10 }, (_, i) => {
  const year = 2025 + i;
  const balance = DEBT_SCHEDULE.reduce((s, d) => {
    const remaining = Math.max(0, d.outstandingBalance - d.annualPrincipal * i);
    return s + remaining;
  }, 0);
  return { year: String(year), balance };
});

const ageBadgeStyle = (status: string) => {
  if (status === "current") return { bg: "oklch(0.42 0.18 145 / 12%)", color: "oklch(0.38 0.18 145)", border: "oklch(0.42 0.18 145 / 30%)" };
  if (status === "30-60")   return { bg: "oklch(0.65 0.20 55 / 12%)",  color: "oklch(0.55 0.20 55)",  border: "oklch(0.65 0.20 55 / 30%)" };
  if (status === "60-90")   return { bg: "oklch(0.60 0.22 40 / 12%)",  color: "oklch(0.52 0.22 40)",  border: "oklch(0.60 0.22 40 / 30%)" };
  return { bg: "oklch(0.55 0.22 25 / 12%)", color: "oklch(0.48 0.22 25)", border: "oklch(0.55 0.22 25 / 30%)" };
};

export default function FinanceHub() {
  const [activeTab, setActiveTab] = useState("gl");

  const totalRevenue  = MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0);
  const totalExpend   = MONTHLY_REVENUE.reduce((s, m) => s + m.expenditure, 0);
  const netPosition   = totalRevenue - totalExpend;
  const totalAP       = AP_INVOICES.reduce((s, i) => s + i.amount, 0);
  const overdueAP     = AP_INVOICES.filter(i => i.status === "60-90" || i.status === "90+").reduce((s, i) => s + i.amount, 0);

  return (
    <DashboardLayout title="Finance Hub">
      <div className="p-6 space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "FY2024 Total Revenue",    value: fmt(totalRevenue),  sub: "+2.3% vs prior year",   icon: TrendingUp,   good: true },
            { label: "FY2024 Total Expenditure",value: fmt(totalExpend),   sub: "-0.8% vs prior year",   icon: TrendingDown, good: true },
            { label: "Net Fiscal Position",     value: fmt(netPosition),   sub: "Surplus",               icon: DollarSign,   good: true },
            { label: "Total Outstanding Debt",  value: fmt(TOTAL_DEBT),    sub: `${DEBT_PCT.toFixed(2)}% of legal limit`, icon: CreditCard, good: true },
          ].map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-xl border p-4" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "oklch(0.55 0.010 250)" }}>{kpi.label}</span>
                  <Icon className="w-4 h-4" style={{ color: "oklch(0.45 0.20 240)" }} />
                </div>
                <div className="text-xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.18 0.018 250)" }}>{kpi.value}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{kpi.sub}</div>
              </div>
            );
          })}
        </div>

        {/* AP Alert */}
        {overdueAP > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "oklch(0.55 0.22 25 / 8%)", border: "1px solid oklch(0.55 0.22 25 / 25%)" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.55 0.22 25)" }} />
            <span className="text-sm" style={{ color: "oklch(0.35 0.018 250)" }}>
              <strong>{fmt(overdueAP)}</strong> in accounts payable is 60+ days overdue — review recommended before fiscal year-end.
            </span>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="gl"><BookOpen className="w-3.5 h-3.5 mr-1.5" />General Ledger</TabsTrigger>
            <TabsTrigger value="ap">
              <Clock className="w-3.5 h-3.5 mr-1.5" />AP Aging
              {overdueAP > 0 && <span className="ml-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: "oklch(0.55 0.22 25)", color: "white" }}>!</span>}
            </TabsTrigger>
            <TabsTrigger value="funds"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Fund Balances</TabsTrigger>
            <TabsTrigger value="debt"><CreditCard className="w-3.5 h-3.5 mr-1.5" />Debt Service</TabsTrigger>
          </TabsList>

          {/* General Ledger Tab */}
          <TabsContent value="gl" className="mt-4 space-y-4">
            {/* Revenue vs Expenditure chart */}
            <div className="rounded-xl border p-5" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="text-sm font-semibold mb-4" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                Monthly Revenue vs. Expenditure — FY2024
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MONTHLY_REVENUE} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 6%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.55 0.010 250)" }} />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: "oklch(0.55 0.010 250)" }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="revenue"     name="Revenue"     fill="oklch(0.42 0.18 145)" radius={[3,3,0,0]} />
                  <Bar dataKey="expenditure" name="Expenditure" fill="oklch(0.45 0.20 240)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* GL Account table */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="p-4 border-b" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>Account Balances — FY2024 Year-End</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ background: "oklch(0.975 0.004 240)", borderBottom: "1px solid oklch(0 0 0 / 8%)" }}>
                      {["Code", "Account Name", "Total Debits", "Total Credits", "Net Balance", "Status"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: "oklch(0.45 0.010 250)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GL_ACCOUNTS.map((acct, i) => {
                      const isNeg = acct.balance < 0;
                      return (
                        <tr key={acct.code} style={{ background: i % 2 === 0 ? "oklch(1 0 0)" : "oklch(0.988 0.002 250)", borderBottom: "1px solid oklch(0 0 0 / 5%)" }}>
                          <td className="px-4 py-2.5 font-mono" style={{ color: "oklch(0.50 0.010 250)" }}>{acct.code}</td>
                          <td className="px-4 py-2.5 font-medium" style={{ color: "oklch(0.25 0.014 250)" }}>{acct.name}</td>
                          <td className="px-4 py-2.5 font-mono text-right" style={{ color: "oklch(0.35 0.014 250)" }}>{fmt(acct.debit)}</td>
                          <td className="px-4 py-2.5 font-mono text-right" style={{ color: "oklch(0.35 0.014 250)" }}>{fmt(acct.credit)}</td>
                          <td className="px-4 py-2.5 font-mono text-right font-semibold" style={{ color: isNeg ? "oklch(0.55 0.22 25)" : "oklch(0.38 0.18 145)" }}>
                            {isNeg ? `-${fmt(Math.abs(acct.balance))}` : fmt(acct.balance)}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{
                              background: isNeg ? "oklch(0.55 0.22 25 / 12%)" : "oklch(0.42 0.18 145 / 12%)",
                              color: isNeg ? "oklch(0.48 0.22 25)" : "oklch(0.38 0.18 145)",
                              border: `1px solid ${isNeg ? "oklch(0.55 0.22 25 / 25%)" : "oklch(0.42 0.18 145 / 25%)"}`,
                            }}>
                              {isNeg ? "Deficit" : "Surplus"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "oklch(0.965 0.006 240)", borderTop: "2px solid oklch(0 0 0 / 10%)" }}>
                      <td colSpan={2} className="px-4 py-3 font-bold text-[12px]" style={{ color: "oklch(0.18 0.018 250)" }}>TOTAL</td>
                      <td className="px-4 py-3 font-mono font-bold text-right" style={{ color: "oklch(0.18 0.018 250)" }}>{fmt(GL_ACCOUNTS.reduce((s,a)=>s+a.debit,0))}</td>
                      <td className="px-4 py-3 font-mono font-bold text-right" style={{ color: "oklch(0.18 0.018 250)" }}>{fmt(GL_ACCOUNTS.reduce((s,a)=>s+a.credit,0))}</td>
                      <td className="px-4 py-3 font-mono font-bold text-right" style={{ color: "oklch(0.38 0.18 145)" }}>{fmt(GL_ACCOUNTS.reduce((s,a)=>s+a.balance,0))}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* AP Aging Tab */}
          <TabsContent value="ap" className="mt-4 space-y-4">
            {/* Aging buckets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {AP_AGING_BUCKETS.map(b => (
                <div key={b.label} className="rounded-xl border p-4" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
                  <div className="text-[11px] font-semibold mb-1" style={{ color: "oklch(0.55 0.010 250)" }}>{b.label}</div>
                  <div className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: b.color }}>{fmt(b.amount)}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.60 0.010 250)" }}>
                    {((b.amount / totalAP) * 100).toFixed(1)}% of total AP
                  </div>
                </div>
              ))}
            </div>

            {/* AP pie chart */}
            <div className="rounded-xl border p-5" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="text-sm font-semibold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>AP Aging Distribution</div>
              <div className="flex items-center gap-6 flex-wrap">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={AP_AGING_BUCKETS} dataKey="amount" nameKey="label" cx="50%" cy="50%" outerRadius={80} strokeWidth={2} stroke="white">
                      {AP_AGING_BUCKETS.map((b, i) => <Cell key={i} fill={b.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {AP_AGING_BUCKETS.map(b => (
                    <div key={b.label} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: b.color }} />
                      <span className="text-[12px]" style={{ color: "oklch(0.35 0.014 250)" }}>{b.label}: <strong>{fmt(b.amount)}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Invoice table */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>Open Invoices</div>
                <div className="text-[12px]" style={{ color: "oklch(0.55 0.010 250)" }}>Total: <strong style={{ color: "oklch(0.25 0.014 250)" }}>{fmt(totalAP)}</strong></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ background: "oklch(0.975 0.004 240)", borderBottom: "1px solid oklch(0 0 0 / 8%)" }}>
                      {["Invoice #", "Vendor", "Department", "Amount", "Age", "Status"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: "oklch(0.45 0.010 250)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AP_INVOICES.map((inv, i) => {
                      const s = ageBadgeStyle(inv.status);
                      return (
                        <tr key={inv.id} style={{ background: i % 2 === 0 ? "oklch(1 0 0)" : "oklch(0.988 0.002 250)", borderBottom: "1px solid oklch(0 0 0 / 5%)" }}>
                          <td className="px-4 py-2.5 font-mono" style={{ color: "oklch(0.45 0.20 240)" }}>{inv.id}</td>
                          <td className="px-4 py-2.5 font-medium" style={{ color: "oklch(0.25 0.014 250)" }}>{inv.vendor}</td>
                          <td className="px-4 py-2.5" style={{ color: "oklch(0.50 0.010 250)" }}>{inv.dept}</td>
                          <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: "oklch(0.25 0.014 250)" }}>{fmt(inv.amount)}</td>
                          <td className="px-4 py-2.5" style={{ color: inv.age > 60 ? "oklch(0.55 0.22 25)" : "oklch(0.50 0.010 250)" }}>{inv.age}d</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                              {inv.status === "current" ? "Current" : inv.status === "30-60" ? "30-60 Days" : inv.status === "60-90" ? "60-90 Days" : "90+ Days"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Fund Balances Tab */}
          <TabsContent value="funds" className="mt-4 space-y-4">
            <div className="rounded-xl border p-5" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="text-sm font-semibold mb-4" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                Fund Balance vs. Target — FY2024 Year-End
              </div>
              <div className="space-y-4">
                {FUND_BALANCES.map(f => {
                  const isOver  = f.pct >= 100;
                  const isLow   = f.pct < 85;
                  const barColor = isLow ? "oklch(0.55 0.22 25)" : isOver ? "oklch(0.42 0.18 145)" : "oklch(0.45 0.20 240)";
                  return (
                    <div key={f.fund}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium" style={{ color: "oklch(0.25 0.014 250)" }}>{f.fund}</span>
                          {isLow && <AlertTriangle className="w-3 h-3" style={{ color: "oklch(0.55 0.22 25)" }} />}
                          {isOver && <CheckCircle2 className="w-3 h-3" style={{ color: "oklch(0.42 0.18 145)" }} />}
                        </div>
                        <div className="text-right">
                          <span className="text-[12px] font-mono font-semibold" style={{ color: barColor }}>{fmt(f.ending)}</span>
                          <span className="text-[11px] ml-2" style={{ color: "oklch(0.60 0.010 250)" }}>/ {fmt(f.target)} target</span>
                        </div>
                      </div>
                      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.92 0.004 250)" }}>
                        <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${Math.min(f.pct, 100)}%`, background: barColor }} />
                        {f.pct > 100 && (
                          <div className="absolute inset-y-0 right-0 rounded-full" style={{ width: `${Math.min(f.pct - 100, 20)}%`, background: "oklch(0.42 0.18 145 / 40%)" }} />
                        )}
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[10px]" style={{ color: "oklch(0.65 0.010 250)" }}>
                          Rev: {fmt(f.revenues)} · Exp: {fmt(f.expenditures)}
                        </span>
                        <span className="text-[10px] font-semibold" style={{ color: barColor }}>{f.pct.toFixed(1)}% of target</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fund balance bar chart */}
            <div className="rounded-xl border p-5" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="text-sm font-semibold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>Ending Balance vs. Target by Fund</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={FUND_BALANCES.map(f => ({ name: f.fund.replace(" Fund","").replace(" Enterprise",""), ending: f.ending, target: f.target }))} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 6%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "oklch(0.55 0.010 250)" }} />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: "oklch(0.55 0.010 250)" }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="ending" name="Ending Balance" fill="oklch(0.45 0.20 240)" radius={[3,3,0,0]} />
                  <Bar dataKey="target" name="Target Balance" fill="oklch(0.42 0.18 145 / 50%)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Debt Service Tab */}
          <TabsContent value="debt" className="mt-4 space-y-4">
            {/* Debt KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border p-4" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.55 0.010 250)" }}>Total Outstanding Debt</div>
                <div className="text-xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.18 0.018 250)" }}>{fmt(TOTAL_DEBT)}</div>
              </div>
              <div className="rounded-xl border p-4" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.55 0.010 250)" }}>Legal Debt Limit (Iowa Code)</div>
                <div className="text-xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.18 0.018 250)" }}>{fmt(LEGAL_DEBT_LIMIT)}</div>
              </div>
              <div className="rounded-xl border p-4" style={{ background: "oklch(0.42 0.18 145 / 8%)", borderColor: "oklch(0.42 0.18 145 / 25%)" }}>
                <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.38 0.18 145)" }}>Debt Utilization</div>
                <div className="text-xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.38 0.18 145)" }}>{DEBT_PCT.toFixed(3)}%</div>
                <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.50 0.010 250)" }}>Well within legal limit</div>
              </div>
            </div>

            {/* Debt schedule cards */}
            <div className="space-y-3">
              {DEBT_SCHEDULE.map(d => (
                <div key={d.id} className="rounded-xl border p-4" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono" style={{ color: "oklch(0.45 0.20 240)" }}>{d.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "oklch(0.45 0.20 240 / 10%)", color: "oklch(0.38 0.18 240)", border: "1px solid oklch(0.45 0.20 240 / 25%)" }}>{d.fund}</span>
                      </div>
                      <div className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>{d.description}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                        Issued {d.issueDate} · Matures {d.maturity} · {d.interestRate}% fixed
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.18 0.018 250)" }}>{fmt(d.outstandingBalance)}</div>
                      <div className="text-[11px]" style={{ color: "oklch(0.60 0.010 250)" }}>outstanding of {fmt(d.originalPrincipal)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Annual Principal", value: fmt(d.annualPrincipal) },
                      { label: "Annual Interest",  value: fmt(d.annualInterest) },
                      { label: "Next Payment",     value: d.nextPayment },
                    ].map(item => (
                      <div key={item.label} className="rounded-lg p-2.5" style={{ background: "oklch(0.975 0.004 240)" }}>
                        <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "oklch(0.60 0.010 250)" }}>{item.label}</div>
                        <div className="text-[12px] font-semibold font-mono" style={{ color: "oklch(0.25 0.014 250)" }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <div className="text-[10px] mb-1" style={{ color: "oklch(0.60 0.010 250)" }}>
                      Repaid: {(((d.originalPrincipal - d.outstandingBalance) / d.originalPrincipal) * 100).toFixed(1)}%
                    </div>
                    <Progress value={(d.originalPrincipal - d.outstandingBalance) / d.originalPrincipal * 100} className="h-1.5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Debt projection chart */}
            <div className="rounded-xl border p-5" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="text-sm font-semibold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>10-Year Debt Paydown Projection</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={DEBT_PROJECTION}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 6%)" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "oklch(0.55 0.010 250)" }} />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: "oklch(0.55 0.010 250)" }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Line type="monotone" dataKey="balance" name="Outstanding Balance" stroke="oklch(0.45 0.20 240)" strokeWidth={2} dot={{ r: 4, fill: "oklch(0.45 0.20 240)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-[11px] text-center py-2" style={{ color: "oklch(0.60 0.010 250)" }}>
          Finance Hub — City of West Liberty, IA · FY2024 Annual Report Data · Iowa Code Ch. 384
        </div>
      </div>
    </DashboardLayout>
  );
}
