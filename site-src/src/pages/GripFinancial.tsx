import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Activity, ChevronDown } from "lucide-react";

// ── Model constants ────────────────────────────────────────────────────────────
const ASP = 1249;
const MONTHLY_UNITS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 100, 100];
const MONTHS = ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"];

const SCENARIOS = {
  conservative: { units_mult: 0.7, label: "Conservative", color: "#f59e0b", asp_mult: 0.95 },
  base:         { units_mult: 1.0, label: "Base Case",    color: "#60a5fa", asp_mult: 1.0  },
  aggressive:   { units_mult: 1.3, label: "Aggressive",   color: "#34d399", asp_mult: 1.05 },
};

const UNIT_VARIABLE_COGS_INHOUSE = 35.75 + 28 + 175 + 55 + 35 + 249 + 8 + 18 + 15 + (2.5*32) + (1.25*55) + (0.5*25) + (ASP*0.03) + (ASP*0.01);
const UNIT_VARIABLE_COGS_LOCAL   = 65 + 28 + 175 + 55 + 35 + 249 + 8 + 18 + 15 + (2.5*32) + (1.25*55) + (0.5*25) + (ASP*0.03) + (ASP*0.01);
const UNIT_VARIABLE_COGS_DOMESTIC = 55 + 28 + 175 + 55 + 35 + 249 + 8 + 18 + 15 + (2.5*32) + (1.25*55) + (0.5*25) + (ASP*0.03) + (ASP*0.01);
const UNIT_VARIABLE_COGS_INTL    = 42 + 28 + 175 + 55 + 35 + 249 + 8 + 18 + 15 + (2.5*32) + (1.25*55) + (0.5*25) + (ASP*0.03) + (ASP*0.01);

const FIXED_OPEX_INHOUSE = 3500 + 4000 + 4000 + 5000 + 2000 + 2500 + 1500 + 1000 + 250;
const FIXED_OPEX_OUTSOURCED = 3500 + 4000 + 5000 + 2000 + 2500 + 1500 + 1000 + 2250;

const PRODUCTION_SCENARIOS = [
  { key: "inhouse",  label: "In-House",      cogs: UNIT_VARIABLE_COGS_INHOUSE,   fixed: FIXED_OPEX_INHOUSE,    color: "#60a5fa" },
  { key: "local",    label: "Local Bureau",  cogs: UNIT_VARIABLE_COGS_LOCAL,     fixed: FIXED_OPEX_OUTSOURCED, color: "#a78bfa" },
  { key: "domestic", label: "Domestic",      cogs: UNIT_VARIABLE_COGS_DOMESTIC,  fixed: FIXED_OPEX_OUTSOURCED, color: "#34d399" },
  { key: "intl",     label: "International", cogs: UNIT_VARIABLE_COGS_INTL,      fixed: FIXED_OPEX_OUTSOURCED, color: "#f59e0b" },
];

function calcEBITDA(units: number[], asp: number, cogs: number, fixed: number) {
  return units.map(u => u * (asp - cogs) - fixed);
}

function calcCumulative(arr: number[]) {
  let cum = 0;
  return arr.map(v => { cum += v; return cum; });
}

function MiniLine({ data, color, height = 50, width = 200 }: { data: number[]; color: string; height?: number; width?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  const zeroY = height - ((0 - min) / range) * (height - 4) - 2;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <line x1={0} y1={zeroY} x2={width} y2={zeroY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3,3" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle
          key={i}
          cx={(i / (data.length - 1)) * width}
          cy={height - ((v - min) / range) * (height - 4) - 2}
          r="2.5"
          fill={v >= 0 ? color : "#ef4444"}
        />
      ))}
    </svg>
  );
}

function BarGroup({ data, colors, labels, height = 80 }: { data: number[][]; colors: string[]; labels: string[]; height?: number }) {
  const allVals = data.flat();
  const maxAbs = Math.max(...allVals.map(Math.abs));
  const barW = 8;
  const gap = 2;
  const groupGap = 6;
  const totalW = data[0].length * (data.length * (barW + gap) + groupGap);
  return (
    <svg width={totalW} height={height + 20} className="overflow-visible">
      {data[0].map((_, mi) => (
        data.map((series, si) => {
          const v = series[mi];
          const barH = Math.abs(v) / maxAbs * (height / 2 - 4);
          const x = mi * (data.length * (barW + gap) + groupGap) + si * (barW + gap);
          const y = v >= 0 ? height / 2 - barH : height / 2;
          return (
            <rect key={`${mi}-${si}`} x={x} y={y} width={barW} height={barH}
              fill={colors[si]} opacity={0.8} rx={1} />
          );
        })
      ))}
      <line x1={0} y1={height / 2} x2={totalW} y2={height / 2} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {MONTHS.map((m, i) => (
        <text key={m} x={i * (data.length * (barW + gap) + groupGap) + (data.length * (barW + gap)) / 2} y={height + 14}
          textAnchor="middle" fill="#6b7280" fontSize="8">{m}</text>
      ))}
    </svg>
  );
}

export default function GripFinancial() {
  const [activeScenario, setActiveScenario] = useState<keyof typeof SCENARIOS>("base");
  const [activeProd, setActiveProd] = useState("inhouse");
  const [tab, setTab] = useState<"ebitda" | "cashflow" | "channel" | "service">("ebitda");

  const sc = SCENARIOS[activeScenario];
  const units = MONTHLY_UNITS.map(u => Math.round(u * sc.units_mult));
  const asp = ASP * sc.asp_mult;
  const year1Units = units.reduce((a, b) => a + b, 0);
  const year1Revenue = year1Units * asp;

  const ebitdaData = PRODUCTION_SCENARIOS.map(ps => calcEBITDA(units, asp, ps.cogs, ps.fixed));
  const selectedProd = PRODUCTION_SCENARIOS.find(p => p.key === activeProd)!;
  const selectedEBITDA = calcEBITDA(units, asp, selectedProd.cogs, selectedProd.fixed);
  const year1EBITDA = selectedEBITDA.reduce((a, b) => a + b, 0);
  const breakEvenUnits = Math.ceil(selectedProd.fixed / (asp - selectedProd.cogs));

  // Cash waterfall (simplified)
  const WORKING_CAPITAL = 75000;
  const PRELAUNCH = 10000;
  const CAPEX = 15000;
  const CONTINGENCY = (CAPEX + 50 * 620 + PRELAUNCH) * 0.1;
  let cash = WORKING_CAPITAL - PRELAUNCH - CAPEX - CONTINGENCY;
  const cashFlow = selectedEBITDA.map(ebitda => {
    cash += ebitda;
    return cash;
  });

  // Channel mix
  const CHANNEL_MIX = [
    { label: "Direct", mix: 0.45, discount: 0, color: "#60a5fa" },
    { label: "Dealer", mix: 0.20, discount: 0.20, color: "#a78bfa" },
    { label: "Distributor", mix: 0.15, discount: 0.30, color: "#34d399" },
    { label: "Gov/Contract", mix: 0.20, discount: 0.12, color: "#f59e0b" },
  ];
  const blendedASP = CHANNEL_MIX.reduce((s, c) => s + c.mix * asp * (1 - c.discount), 0);

  // Service ARR
  const serviceAttachRate = 0.25;
  const servicePrice = 199;
  const serviceGM = 0.85;
  const serviceUnits = Math.round(year1Units * serviceAttachRate);
  const serviceARR = serviceUnits * servicePrice;
  const serviceProfit = serviceARR * serviceGM;

  const TABS = [
    { key: "ebitda", label: "EBITDA" },
    { key: "cashflow", label: "Cash Flow" },
    { key: "channel", label: "Channel Mix" },
    { key: "service", label: "Service ARR" },
  ] as const;

  return (
    <div className="min-h-full bg-[#08080F] text-white p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Financial Model</h1>
        <p className="text-xs text-gray-500 mt-1">DOGE-GRIP ORIN™ · Year 1 · Base case in-house production</p>
      </div>

      {/* Scenario + Production selectors */}
      <div className="flex flex-wrap gap-3">
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <span className="text-xs text-gray-500">Demand Scenario:</span>
          {(Object.entries(SCENARIOS) as [keyof typeof SCENARIOS, typeof SCENARIOS[keyof typeof SCENARIOS]][]).map(([key, sc]) => (
            <button
              key={key}
              onClick={() => setActiveScenario(key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeScenario === key ? "text-white border" : "text-gray-500 hover:text-gray-300"
              }`}
              style={activeScenario === key ? { borderColor: sc.color, backgroundColor: sc.color + "20", color: sc.color } : {}}
            >
              {sc.label}
            </button>
          ))}
        </div>
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <span className="text-xs text-gray-500">Production:</span>
          {PRODUCTION_SCENARIOS.map(ps => (
            <button
              key={ps.key}
              onClick={() => setActiveProd(ps.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeProd === ps.key ? "text-white border" : "text-gray-500 hover:text-gray-300"
              }`}
              style={activeProd === ps.key ? { borderColor: ps.color, backgroundColor: ps.color + "20", color: ps.color } : {}}
            >
              {ps.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Year 1 Revenue", value: `$${(year1Revenue / 1000).toFixed(0)}K`, icon: DollarSign, color: "#60a5fa", trend: year1Revenue > 700000 ? "up" : "down" },
          { label: "Year 1 EBITDA", value: `$${(year1EBITDA / 1000).toFixed(0)}K`, icon: TrendingUp, color: year1EBITDA >= 0 ? "#34d399" : "#ef4444", trend: year1EBITDA >= 0 ? "up" : "down" },
          { label: "Break-even Units", value: `${breakEvenUnits}/mo`, icon: Activity, color: "#f59e0b", trend: "neutral" },
          { label: "Blended ASP", value: `$${blendedASP.toFixed(0)}`, icon: BarChart3, color: "#a78bfa", trend: "neutral" },
        ].map(kpi => (
          <div key={kpi.label} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              {kpi.trend === "up" && <TrendingUp className="w-3 h-3 text-green-400" />}
              {kpi.trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
            </div>
            <div className="text-lg font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Tab content */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex border-b border-white/8">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-xs font-medium transition-colors ${
                tab === t.key ? "text-blue-300 border-b-2 border-blue-400 bg-blue-500/5" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {tab === "ebitda" && (
              <motion.div key="ebitda" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Monthly EBITDA by Production Scenario</h3>
                  <span className="text-xs text-gray-500">All 4 scenarios · {sc.label} demand</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/8">
                        <th className="text-left py-2 text-gray-500 font-medium">Month</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Units</th>
                        {PRODUCTION_SCENARIOS.map(ps => (
                          <th key={ps.key} className="text-right py-2 font-medium" style={{ color: ps.color }}>{ps.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MONTHS.map((m, i) => (
                        <tr key={m} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                          <td className="py-2 text-gray-400 font-mono">{m}</td>
                          <td className="py-2 text-white">{units[i]}</td>
                          {ebitdaData.map((series, si) => (
                            <td key={si} className={`py-2 text-right font-mono ${series[i] >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {series[i] >= 0 ? "+" : ""}${series[i].toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="border-t border-white/15 font-semibold">
                        <td className="py-2 text-white">Total Y1</td>
                        <td className="py-2 text-white">{year1Units}</td>
                        {ebitdaData.map((series, si) => {
                          const total = series.reduce((a, b) => a + b, 0);
                          return (
                            <td key={si} className={`py-2 text-right font-mono ${total >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {total >= 0 ? "+" : ""}${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {tab === "cashflow" && (
              <motion.div key="cashflow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Cash Waterfall — {selectedProd.label}</h3>
                  <span className="text-xs text-gray-500">Starting cash: $75K · After prelaunch + capex</span>
                </div>
                <div className="overflow-x-auto">
                  <MiniLine data={cashFlow} color={selectedProd.color} height={80} width={600} />
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/8">
                        <th className="text-left py-2 text-gray-500">Month</th>
                        <th className="text-right py-2 text-gray-500">EBITDA</th>
                        <th className="text-right py-2 text-gray-500">Ending Cash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MONTHS.map((m, i) => (
                        <tr key={m} className="border-b border-white/4 hover:bg-white/3">
                          <td className="py-1.5 text-gray-400 font-mono">{m}</td>
                          <td className={`py-1.5 text-right font-mono ${selectedEBITDA[i] >= 0 ? "text-green-400" : "text-red-400"}`}>
                            ${selectedEBITDA[i].toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className={`py-1.5 text-right font-mono ${cashFlow[i] >= 0 ? "text-white" : "text-red-400"}`}>
                            ${cashFlow[i].toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {tab === "channel" && (
              <motion.div key="channel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="text-sm font-semibold text-white mb-4">Channel Mix & Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {CHANNEL_MIX.map(ch => (
                      <div key={ch.label} className="p-3 bg-white/3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white">{ch.label}</span>
                          <span className="text-xs font-mono" style={{ color: ch.color }}>{(ch.mix * 100).toFixed(0)}% mix</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span>Discount: {(ch.discount * 100).toFixed(0)}%</span>
                          <span>Net ASP: <span className="text-white">${(asp * (1 - ch.discount)).toFixed(0)}</span></span>
                        </div>
                        <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${ch.mix * 100}%`, backgroundColor: ch.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <div className="text-xs text-gray-400 mb-1">Blended ASP (channel mix)</div>
                      <div className="text-2xl font-bold text-blue-300">${blendedASP.toFixed(0)}</div>
                      <div className="text-[10px] text-gray-500 mt-1">vs. list price ${asp.toFixed(0)}</div>
                    </div>
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                      <div className="text-xs text-gray-400 mb-1">Year 1 Channel Revenue</div>
                      <div className="text-2xl font-bold text-purple-300">${(year1Units * blendedASP / 1000).toFixed(0)}K</div>
                      <div className="text-[10px] text-gray-500 mt-1">at {year1Units} units blended</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "service" && (
              <motion.div key="service" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="text-sm font-semibold text-white mb-4">Service & Software ARR</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Attach Rate", value: "25%", sub: "of shipped units", color: "#60a5fa" },
                    { label: "Annual Sub Price", value: "$199", sub: "per attached unit", color: "#a78bfa" },
                    { label: "Service Gross Margin", value: "85%", sub: "software/support", color: "#34d399" },
                  ].map(m => (
                    <div key={m.label} className="p-4 glass rounded-xl text-center">
                      <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{m.label}</div>
                      <div className="text-[10px] text-gray-600">{m.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">Year 1 Service ARR</div>
                    <div className="text-2xl font-bold text-green-300">${serviceARR.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 mt-1">{serviceUnits} attached units × $199</div>
                  </div>
                  <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                    <div className="text-xs text-gray-400 mb-1">Year 1 Service Profit</div>
                    <div className="text-2xl font-bold text-teal-300">${serviceProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="text-[10px] text-gray-500 mt-1">at 85% gross margin</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white/3 rounded-lg">
                  <p className="text-xs text-gray-400">
                    Service attach compounds as the installed base grows. At 100 units/month run rate, the annual service ARR
                    adds <span className="text-white font-semibold">${(100 * 12 * serviceAttachRate * servicePrice).toLocaleString()}</span> of
                    high-margin recurring revenue to the product P&L.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
