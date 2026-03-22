import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Cpu, Zap, Package, TrendingUp, DollarSign, Users, Bot,
  ChevronRight, Activity, Shield, Layers, ArrowUpRight,
  BarChart3, Wrench, Globe, Star, CheckCircle, Clock
} from "lucide-react";

const UNIT_COSTS = [
  { label: "Jetson Orin Nano Super", value: 249, color: "#60a5fa" },
  { label: "Actuators (×5)", value: 175, color: "#a78bfa" },
  { label: "Controller + PSU", value: 55, color: "#34d399" },
  { label: "Printed Shell (In-House)", value: 35.75, color: "#f59e0b" },
  { label: "Sensors / Camera / Wiring", value: 35, color: "#f472b6" },
  { label: "Mechanical HW / Tendons", value: 28, color: "#fb923c" },
  { label: "Outbound Shipping", value: 18, color: "#38bdf8" },
  { label: "Software / Support Provision", value: 15, color: "#4ade80" },
  { label: "Packaging Materials", value: 8, color: "#e879f9" },
];

const MONTHLY_UNITS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 100, 100];
const MONTHS = ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"];

const ASP = 1249;
const TOTAL_UNIT_COST = UNIT_COSTS.reduce((s, c) => s + c.value, 0);
const ASSEMBLY_LABOR = 2.5 * 32;
const PROG_LABOR = 1.25 * 55;
const QA_LABOR = 0.5 * 25;
const TOTAL_VARIABLE_COGS = TOTAL_UNIT_COST + ASSEMBLY_LABOR + PROG_LABOR + QA_LABOR + (ASP * 0.03) + (ASP * 0.01);
const GROSS_MARGIN = ((ASP - TOTAL_VARIABLE_COGS) / ASP * 100).toFixed(1);
const YEAR1_UNITS = MONTHLY_UNITS.reduce((a, b) => a + b, 0);
const YEAR1_REVENUE = YEAR1_UNITS * ASP;

const KPI_CARDS = [
  { label: "List Price (ASP)", value: "$1,249", sub: "Per unit", icon: DollarSign, color: "from-blue-500 to-cyan-500", glow: "rgba(74,144,217,0.3)" },
  { label: "Gross Margin", value: `${GROSS_MARGIN}%`, sub: "In-house production", icon: TrendingUp, color: "from-green-500 to-emerald-500", glow: "rgba(16,185,129,0.3)" },
  { label: "Year 1 Units", value: YEAR1_UNITS.toLocaleString(), sub: "10 → 100 units/mo", icon: Package, color: "from-purple-500 to-pink-500", glow: "rgba(139,92,246,0.3)" },
  { label: "Year 1 Revenue", value: `$${(YEAR1_REVENUE / 1000).toFixed(0)}K`, sub: "Base case forecast", icon: BarChart3, color: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.3)" },
  { label: "Printer Farm", value: "6×", sub: "Bambu X1 Carbon", icon: Cpu, color: "from-pink-500 to-rose-500", glow: "rgba(236,72,153,0.3)" },
  { label: "AI Agents", value: "6", sub: "Planned registry", icon: Bot, color: "from-teal-500 to-cyan-500", glow: "rgba(20,184,166,0.3)" },
];

const QUICK_LINKS = [
  { href: "/grip-financial", label: "Financial Model", icon: DollarSign, color: "text-blue-400", desc: "P&L, cash waterfall, scenarios" },
  { href: "/grip-oem", label: "OEM Ecosystem", icon: Globe, color: "text-purple-400", desc: "White-label catalog, bundles" },
  { href: "/grip-robots", label: "Robot Compatibility", icon: Wrench, color: "text-green-400", desc: "5 robot families, cell layouts" },
  { href: "/grip-agents", label: "AI Agent Registry", icon: Bot, color: "text-amber-400", desc: "6 agents, ROI model" },
  { href: "/grip-roadmap", label: "Product Roadmap", icon: Layers, color: "text-pink-400", desc: "SKUs, release waves, NPI" },
  { href: "/grip-risk", label: "Risk & Ops", icon: Shield, color: "text-teal-400", desc: "Risk heatmap, staffing, milestones" },
];

const VERSION_LOG = [
  { ver: "v63", desc: "Adjacency cross-promo funnels, OEM vertical solutions, clinical AI bundles" },
  { ver: "v59", desc: "Adjacency products and cross-promo expanded" },
  { ver: "v50", desc: "AI agent registry, multi-agent orchestration, agent command center" },
  { ver: "v40", desc: "Apple design standards, Liquid Glass theme, VisionOS spatial UI" },
  { ver: "v28", desc: "Microsoft 365 integration — SharePoint, Graph, Teams, RBAC" },
  { ver: "v26", desc: "HR + legal expansion — compensation, commission, org design" },
];

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 160; const h = 40;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  const fillPts = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle
        cx={(data.length - 1) / (data.length - 1) * w}
        cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2}
        r="3" fill={color}
      />
    </svg>
  );
}

function UnitCostDonut() {
  const total = UNIT_COSTS.reduce((s, c) => s + c.value, 0);
  const cx = 80; const cy = 80; const r = 60; const inner = 38;
  let angle = -Math.PI / 2;
  const slices = UNIT_COSTS.map(c => {
    const sweep = (c.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const xi1 = cx + inner * Math.cos(angle - sweep);
    const yi1 = cy + inner * Math.sin(angle - sweep);
    const xi2 = cx + inner * Math.cos(angle);
    const yi2 = cy + inner * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { ...c, d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z` };
  });
  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {slices.map((s, i) => (
        <path key={i} d={s.d} fill={s.color} opacity={0.85} />
      ))}
      <circle cx={cx} cy={cy} r={inner - 2} fill="#0A0A16" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">${total.toFixed(0)}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#9ca3af" fontSize="9">unit COGS</text>
    </svg>
  );
}

export default function GripDashboard() {
  const [tick, setTick] = useState(0);
  const [liveUnits, setLiveUnits] = useState(47);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setLiveUnits(v => Math.max(40, Math.min(55, v + Math.round((Math.random() - 0.5) * 3))));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const revenueData = MONTHLY_UNITS.map(u => u * ASP / 1000);

  return (
    <div className="min-h-full bg-[#08080F] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">DOGE-GRIP ORIN™</h1>
              <p className="text-xs text-gray-500">Business Intelligence Dashboard · v63</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 max-w-2xl">
            AI-powered robotic hand on NVIDIA Jetson Orin Nano Super · 6-printer Bambu X1 Carbon farm ·
            Full OEM white-label ecosystem · 200+ operational model sheets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">MODEL LIVE</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPI_CARDS.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass rounded-xl p-4 relative overflow-hidden"
            style={{ boxShadow: `0 0 20px ${kpi.glow}` }}
          >
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${kpi.color} opacity-10 rounded-full -translate-y-4 translate-x-4`} />
            <kpi.icon className={`w-4 h-4 mb-2 bg-gradient-to-br ${kpi.color} text-transparent`} style={{ WebkitBackgroundClip: "text" }} />
            <div className="text-lg font-bold text-white">{kpi.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{kpi.sub}</div>
            <div className="text-[9px] text-gray-600 mt-1 uppercase tracking-wider">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue forecast chart */}
        <div className="lg:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Year 1 Revenue Forecast</h2>
              <p className="text-xs text-gray-500">Base case · In-house production · $K/month</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <Activity className="w-3 h-3" />
              <span>+{((MONTHLY_UNITS[11] - MONTHLY_UNITS[0]) / MONTHLY_UNITS[0] * 100).toFixed(0)}% growth</span>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-32">
            {revenueData.map((v, i) => (
              <motion.div
                key={i}
                className="flex-1 flex flex-col items-center gap-1"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                style={{ transformOrigin: "bottom" }}
              >
                <div
                  className="w-full rounded-t-sm relative overflow-hidden"
                  style={{
                    height: `${(v / Math.max(...revenueData)) * 100}%`,
                    background: `linear-gradient(to top, #4A90D9, #8B5CF6)`,
                    opacity: 0.8,
                  }}
                >
                  <div className="absolute inset-0 bg-white/5" />
                </div>
                <span className="text-[8px] text-gray-600">{MONTHS[i]}</span>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <div className="text-xs text-gray-500">
              Total Y1: <span className="text-white font-semibold">${(YEAR1_REVENUE / 1000).toFixed(0)}K</span>
            </div>
            <div className="text-xs text-gray-500">
              Peak month: <span className="text-white font-semibold">${(Math.max(...revenueData)).toFixed(0)}K</span>
            </div>
            <div className="text-xs text-gray-500">
              Units: <span className="text-white font-semibold">{YEAR1_UNITS}</span>
            </div>
          </div>
        </div>

        {/* Unit cost donut */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Unit Cost Breakdown</h2>
          <p className="text-xs text-gray-500 mb-4">In-house BOM + labor</p>
          <div className="flex items-center justify-center mb-4">
            <UnitCostDonut />
          </div>
          <div className="space-y-1.5">
            {UNIT_COSTS.slice(0, 5).map(c => (
              <div key={c.label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-[10px] text-gray-400 flex-1 truncate">{c.label}</span>
                <span className="text-[10px] text-white font-mono">${c.value}</span>
              </div>
            ))}
            <div className="text-[9px] text-gray-600 mt-1">+{UNIT_COSTS.length - 5} more components</div>
          </div>
        </div>
      </div>

      {/* Quick navigation */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Model Sections</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_LINKS.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={link.href}
                className="glass glass-hover rounded-xl p-4 flex flex-col gap-2 group transition-all"
              >
                <link.icon className={`w-5 h-5 ${link.color}`} />
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">{link.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{link.desc}</div>
                </div>
                <ArrowUpRight className="w-3 h-3 text-gray-600 group-hover:text-blue-400 transition-colors ml-auto" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Version log */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Model Version History</h2>
            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">v63 current</span>
          </div>
          <div className="space-y-2">
            {VERSION_LOG.map((v, i) => (
              <div key={v.ver} className="flex items-start gap-3">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? "bg-blue-400 animate-pulse" : "bg-gray-600"}`} />
                <div>
                  <span className="text-[10px] font-mono text-blue-300">{v.ver}</span>
                  <span className="text-[10px] text-gray-400 ml-2">{v.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live production status */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Production Assumptions</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-green-400">Base Case</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Print Hours / Unit", value: "22 hrs", icon: Clock },
              { label: "Printer Utilization", value: "80%", icon: Activity },
              { label: "Assembly Labor Rate", value: "$32/hr", icon: Users },
              { label: "Programming Rate", value: "$55/hr", icon: Cpu },
              { label: "Launch Inventory", value: "50 units", icon: Package },
              { label: "Working Capital", value: "$75K", icon: DollarSign },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 p-2 bg-white/3 rounded-lg">
                <item.icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500">{item.label}</div>
                  <div className="text-xs font-semibold text-white">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">Gross Margin (in-house)</span>
              <span className="text-sm font-bold text-green-400">{GROSS_MARGIN}%</span>
            </div>
            <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${GROSS_MARGIN}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
