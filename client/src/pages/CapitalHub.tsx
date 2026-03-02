/**
 * Capital Hub — Civic Intelligence Dark
 * Municipal capital-raising dashboard
 * Revenue bonds, TIF financing, IP licensing, investor portal
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { DollarSign, TrendingUp, FileText, Building2, BarChart3, Shield, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const INSTRUMENTS = [
  {
    id: "bond-water",
    type: "Revenue Bond",
    name: "Water Infrastructure Revenue Bond",
    series: "Series 2025-A",
    amount: 2500000,
    raised: 1875000,
    rate: "4.85%",
    maturity: "20 years",
    rating: "A+",
    ratingAgency: "Moody's",
    minInvestment: 5000,
    color: "oklch(0.45 0.20 240)",
    description: "Financing West Liberty's water main replacement program. Backed by utility revenue from 1,420 water accounts. Iowa Code §384.24 compliant.",
    use: "Water main replacement (8.2 miles), pump station upgrades, SCADA modernization",
    security: "Net utility revenues, debt service reserve fund",
    status: "Active",
    daysLeft: 47,
  },
  {
    id: "tif-downtown",
    type: "TIF Bond",
    name: "Downtown TIF Development Bond",
    series: "Series 2025-B",
    amount: 750000,
    raised: 412500,
    rate: "5.25%",
    maturity: "15 years",
    rating: "BBB+",
    ratingAgency: "S&P",
    minInvestment: 2500,
    color: "oklch(0.55 0.18 75)",
    description: "Tax Increment Financing for downtown West Liberty revitalization. Captures incremental property tax growth from the Muscatine Ave corridor.",
    use: "Streetscape improvements, facade grants, business attraction incentives",
    security: "TIF district incremental tax revenues",
    status: "Active",
    daysLeft: 31,
  },
  {
    id: "iot-ip",
    type: "IP Licensing Fund",
    name: "Municipal IoT IP Licensing Fund",
    series: "Series 2025-C",
    amount: 125000,
    raised: 87500,
    rate: "8.5% target",
    maturity: "5 years",
    rating: "Unrated",
    ratingAgency: "—",
    minInvestment: 1000,
    color: "oklch(0.45 0.18 145)",
    description: "Revenue participation fund backed by royalties from West Liberty's 12 patented IoT devices licensed to other municipalities nationwide.",
    use: "Patent prosecution, licensing program management, royalty collection",
    security: "IP royalty revenue stream, patent portfolio",
    status: "Active",
    daysLeft: 89,
  },
];

const HISTORICAL_DATA = [
  { month: "Jan", revenue: 1420000, expenses: 1380000 },
  { month: "Feb", revenue: 1380000, expenses: 1350000 },
  { month: "Mar", revenue: 1510000, expenses: 1480000 },
  { month: "Apr", revenue: 1490000, expenses: 1420000 },
  { month: "May", revenue: 1560000, expenses: 1510000 },
  { month: "Jun", revenue: 1620000, expenses: 1580000 },
  { month: "Jul", revenue: 1580000, expenses: 1540000 },
  { month: "Aug", revenue: 1640000, expenses: 1590000 },
  { month: "Sep", revenue: 1520000, expenses: 1480000 },
  { month: "Oct", revenue: 1490000, expenses: 1450000 },
  { month: "Nov", revenue: 1430000, expenses: 1390000 },
  { month: "Dec", revenue: 1370000, expenses: 1340000 },
];

const CREDIT_METRICS = [
  { label: "General Obligation Debt", value: "$1,823,964", pct: "2.1% of legal limit", color: "oklch(0.45 0.18 145)", status: "Excellent" },
  { label: "Debt Per Capita", value: "$473", pct: "vs $2,100 state avg", color: "oklch(0.45 0.18 145)", status: "Excellent" },
  { label: "Debt Service Coverage", value: "4.2x", pct: "Utility bonds", color: "oklch(0.45 0.18 145)", status: "Strong" },
  { label: "Fund Balance", value: "$2.1M", pct: "12% of revenue", color: "oklch(0.40 0.18 240)", status: "Adequate" },
  { label: "Property Tax Rate", value: "$16.24", pct: "per $1,000 AV", color: "oklch(0.40 0.18 240)", status: "Competitive" },
  { label: "Assessed Valuation", value: "$112M", pct: "+3.2% YoY growth", color: "oklch(0.45 0.18 145)", status: "Growing" },
];

export default function CapitalHub() {
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0]);
  const [investAmount, setInvestAmount] = useState(selectedInstrument.minInvestment);

  const annualReturn = (investAmount * parseFloat(selectedInstrument.rate) / 100).toFixed(0);
  const pctRaised = Math.round((selectedInstrument.raised / selectedInstrument.amount) * 100);

  const handleInvest = () => {
    toast.success(`Investment inquiry submitted for $${investAmount.toLocaleString()} in ${selectedInstrument.name}. West Liberty Finance will contact you within 2 business days.`);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.975 0.004 240)" }}>
      <Navbar />

      {/* Header */}
      <section className="py-14 border-b" style={{ background: "oklch(0.965 0.005 240)", borderColor: "oklch(0 0 0 / 8%)" }}>
        <div className="container">
          <div className="flex items-center gap-2 mb-4">
            <span className="badge-success">3 ACTIVE INSTRUMENTS</span>
            <span className="badge-info">$3.375M TOTAL RAISE</span>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.95 0.008 240)" }}>
            West Liberty<br />
            <span style={{ color: "oklch(0.45 0.18 145)" }}>Capital Hub</span>
          </h1>
          <p className="text-sm max-w-xl" style={{ color: "oklch(0.60 0.010 250)" }}>
            Municipal bond offerings, TIF financing, and IP licensing funds. Invest directly in
            West Liberty's infrastructure and innovation — backed by real city revenues and
            Iowa Code-compliant debt instruments.
          </p>
        </div>
      </section>

      {/* Credit metrics */}
      <section className="py-10 border-b" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
        <div className="container">
          <div className="section-label mb-4">Credit Profile — City of West Liberty, IA</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {CREDIT_METRICS.map((m) => (
              <div key={m.label} className="p-3 rounded-lg" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                <div className="metric-value text-base" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[10px] mt-0.5 font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{m.pct}</div>
                <div className="section-label mt-1.5">{m.label}</div>
                <span className="badge-success mt-1.5 inline-block">{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instruments */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Instrument list */}
            <div className="space-y-3">
              <div className="section-label mb-2">Active Offerings</div>
              {INSTRUMENTS.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => { setSelectedInstrument(inst); setInvestAmount(inst.minInvestment); }}
                  className="w-full text-left p-4 rounded-lg transition-all"
                  style={{
                    background: selectedInstrument.id === inst.id ? "oklch(0.18 0.016 250)" : "oklch(1 0 0)",
                    border: `1px solid ${selectedInstrument.id === inst.id ? inst.color.replace(")", " / 40%)") : "oklch(0 0 0 / 8%)"}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-[10px] font-mono mb-0.5" style={{ color: inst.color }}>{inst.type}</div>
                      <div className="text-sm font-semibold" style={{ color: "oklch(0.25 0.018 250)" }}>{inst.name}</div>
                    </div>
                    <span className="badge-success">{inst.status}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-2">
                    <span style={{ color: "oklch(0.48 0.012 250)" }}>Target: <span className="font-mono" style={{ color: "oklch(0.28 0.018 250)" }}>${(inst.amount / 1000000).toFixed(2)}M</span></span>
                    <span style={{ color: "oklch(0.48 0.012 250)" }}>Rate: <span className="font-mono" style={{ color: inst.color }}>{inst.rate}</span></span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "oklch(0 0 0 / 8%)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round(inst.raised / inst.amount * 100)}%`, background: inst.color }} />
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="font-mono" style={{ color: inst.color }}>{Math.round(inst.raised / inst.amount * 100)}% funded</span>
                    <span style={{ color: "oklch(0.48 0.012 250)" }}>{inst.daysLeft} days left</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-xl" style={{ background: "oklch(1 0 0)", border: `1px solid ${selectedInstrument.color.replace(")", " / 25%)")}` }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[10px] font-mono mb-1" style={{ color: selectedInstrument.color }}>{selectedInstrument.type} · {selectedInstrument.series}</div>
                    <h2 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>{selectedInstrument.name}</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: "oklch(0.48 0.012 250)" }}>Credit Rating</div>
                    <div className="text-lg font-mono font-bold" style={{ color: selectedInstrument.color }}>{selectedInstrument.rating}</div>
                    <div className="text-[10px]" style={{ color: "oklch(0.48 0.012 250)" }}>{selectedInstrument.ratingAgency}</div>
                  </div>
                </div>

                <p className="text-sm leading-relaxed mb-4" style={{ color: "oklch(0.60 0.010 250)" }}>{selectedInstrument.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Interest Rate", value: selectedInstrument.rate },
                    { label: "Maturity", value: selectedInstrument.maturity },
                    { label: "Min Investment", value: `$${selectedInstrument.minInvestment.toLocaleString()}` },
                    { label: "Days Remaining", value: `${selectedInstrument.daysLeft}d` },
                  ].map((item) => (
                    <div key={item.label} className="p-2.5 rounded-lg text-center" style={{ background: "oklch(0.965 0.005 240)" }}>
                      <div className="metric-value text-base" style={{ color: selectedInstrument.color }}>{item.value}</div>
                      <div className="section-label mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg" style={{ background: "oklch(0.965 0.005 240)" }}>
                    <div className="section-label mb-1.5">Use of Proceeds</div>
                    <p className="text-xs" style={{ color: "oklch(0.45 0.012 250)" }}>{selectedInstrument.use}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "oklch(0.965 0.005 240)" }}>
                    <div className="section-label mb-1.5">Security</div>
                    <p className="text-xs" style={{ color: "oklch(0.45 0.012 250)" }}>{selectedInstrument.security}</p>
                  </div>
                </div>

                {/* Funding progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: "oklch(0.45 0.012 250)" }}>Funding Progress</span>
                    <span className="font-mono" style={{ color: selectedInstrument.color }}>${(selectedInstrument.raised / 1000000).toFixed(2)}M of ${(selectedInstrument.amount / 1000000).toFixed(2)}M ({pctRaised}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0 0 0 / 8%)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pctRaised}%`, background: selectedInstrument.color }} />
                  </div>
                </div>

                {/* Investment calculator */}
                <div className="p-4 rounded-lg" style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                  <div className="section-label mb-3">Investment Calculator</div>
                  <div className="mb-3">
                    <label className="text-xs mb-1.5 block" style={{ color: "oklch(0.60 0.010 250)" }}>
                      Investment amount: <span className="font-mono font-bold" style={{ color: selectedInstrument.color }}>${investAmount.toLocaleString()}</span>
                    </label>
                    <input
                      type="range"
                      min={selectedInstrument.minInvestment}
                      max={selectedInstrument.amount - selectedInstrument.raised}
                      step={selectedInstrument.minInvestment}
                      value={investAmount}
                      onChange={(e) => setInvestAmount(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs" style={{ color: "oklch(0.48 0.012 250)" }}>Estimated annual return</div>
                      <div className="metric-value text-xl" style={{ color: "oklch(0.45 0.18 145)" }}>${Number(annualReturn).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={handleInvest}
                      className="flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm"
                      style={{ background: selectedInstrument.color, color: "oklch(0.10 0.010 250)" }}
                    >
                      Invest Now <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Revenue chart */}
              <div className="p-5 rounded-xl" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                <div className="text-sm font-semibold mb-1" style={{ color: "oklch(0.18 0.018 250)" }}>Monthly Revenue vs. Expenses</div>
                <div className="text-xs mb-4" style={{ color: "oklch(0.48 0.012 250)" }}>FY2024 — demonstrates debt service capacity</div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={HISTORICAL_DATA}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.45 0.20 240)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.45 0.20 240)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.50 0.22 25)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="oklch(0.50 0.22 25)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "oklch(0.52 0.010 250)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "oklch(0.52 0.010 250)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v: number) => `$${(v / 1000000).toFixed(2)}M`} contentStyle={{ background: "oklch(0.98 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", fontSize: 11, color: "oklch(0.25 0.018 250)" }} />
                    <Area type="monotone" dataKey="revenue" stroke="oklch(0.45 0.20 240)" fill="url(#revGrad)" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="expenses" stroke="oklch(0.50 0.22 25)" fill="url(#expGrad)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
