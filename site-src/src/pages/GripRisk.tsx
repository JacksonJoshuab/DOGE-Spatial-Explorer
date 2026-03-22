import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, Users, CheckCircle, Clock, TrendingUp, Activity } from "lucide-react";

const RISKS = [
  {
    id: "supply",
    category: "Supply Chain",
    risk: "Jetson Orin Nano Super supply disruption",
    likelihood: 3,
    impact: 5,
    owner: "Ops / GM",
    mitigation: "Dual-source qualification, 90-day safety stock, alternative Orin module evaluation",
    residual: 2,
    color: "#ef4444",
  },
  {
    id: "print-capacity",
    category: "Manufacturing",
    risk: "Printer farm capacity constraint above 90 units/month",
    likelihood: 4,
    impact: 3,
    owner: "Print Tech Lead",
    mitigation: "Printer scale trigger at 90 units/mo, pre-qualified local bureau for overflow",
    residual: 2,
    color: "#f59e0b",
  },
  {
    id: "quality",
    category: "Quality",
    risk: "Actuator failure rate exceeds 3% RMA threshold",
    likelihood: 2,
    impact: 4,
    owner: "Quality Manager",
    mitigation: "100% actuator test before assembly, supplier OTIF monitoring, CAPA pipeline",
    residual: 1,
    color: "#f59e0b",
  },
  {
    id: "software",
    category: "Software",
    risk: "Jetson image regression breaks field units",
    likelihood: 3,
    impact: 4,
    owner: "Programming Lead",
    mitigation: "OTA rollback capability, staged rollout (5% → 25% → 100%), HIL test automation",
    residual: 2,
    color: "#f59e0b",
  },
  {
    id: "finance",
    category: "Finance",
    risk: "Cash shortfall before break-even (Month 6–8)",
    likelihood: 3,
    impact: 5,
    owner: "CEO / Finance",
    mitigation: "Equipment debt/lease facility, borrowing base monitoring, conservative scenario planning",
    residual: 2,
    color: "#ef4444",
  },
  {
    id: "legal",
    category: "Legal / IP",
    risk: "Patent challenge on hand mechanism design",
    likelihood: 2,
    impact: 4,
    owner: "Legal / CEO",
    mitigation: "IP portfolio budget, freedom-to-operate analysis, provisional filings",
    residual: 2,
    color: "#a78bfa",
  },
  {
    id: "channel",
    category: "Go-to-Market",
    risk: "Dealer channel ramp slower than forecast",
    likelihood: 3,
    impact: 3,
    owner: "Commercial Ops",
    mitigation: "Direct channel as primary, dealer incentive program, deal registration protection",
    residual: 2,
    color: "#34d399",
  },
  {
    id: "regulatory",
    category: "Regulatory",
    risk: "Export control classification delays international launch",
    likelihood: 2,
    impact: 3,
    owner: "Legal / Ops",
    mitigation: "ECCN classification review, EAR99 design target, staged international rollout",
    residual: 1,
    color: "#60a5fa",
  },
];

const STAFFING = [
  { role: "Ops / GM", type: "Shared", payroll: 3500, color: "#60a5fa" },
  { role: "Print Tech", type: "In-House", payroll: 4000, color: "#a78bfa" },
  { role: "Assembly Tech", type: "Direct", payroll: 4000, color: "#34d399" },
  { role: "Programming / Controls", type: "Direct", payroll: 5000, color: "#f59e0b" },
  { role: "QA / Fulfillment", type: "Direct", payroll: 2000, color: "#f472b6" },
];

const MILESTONES = [
  { milestone: "Printer farm operational (6×)", date: "M1", status: "Active", color: "#34d399" },
  { milestone: "First 10 units shipped", date: "M1", status: "Active", color: "#34d399" },
  { milestone: "Dealer channel launch", date: "M3", status: "Planned", color: "#60a5fa" },
  { milestone: "Break-even (in-house)", date: "M6–M8", status: "Planned", color: "#f59e0b" },
  { milestone: "100 units/month run rate", date: "M10", status: "Planned", color: "#a78bfa" },
  { milestone: "OEM bundle catalog live", date: "M4", status: "Planned", color: "#f472b6" },
  { milestone: "AI agent Phase 1 deployment", date: "M5", status: "Planned", color: "#38bdf8" },
  { milestone: "International distribution (CA/UK)", date: "M14", status: "Planned", color: "#fb923c" },
];

function RiskMatrix({ risks }: { risks: typeof RISKS }) {
  const cells: (typeof RISKS[0] | null)[][] = Array.from({ length: 5 }, () => Array(5).fill(null));
  risks.forEach(r => {
    const row = 5 - r.impact;
    const col = r.likelihood - 1;
    cells[row][col] = r;
  });

  const cellColor = (row: number, col: number) => {
    const score = (5 - row) * (col + 1);
    if (score >= 15) return "bg-red-500/20 border-red-500/30";
    if (score >= 8) return "bg-amber-500/20 border-amber-500/30";
    return "bg-green-500/10 border-green-500/20";
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] text-gray-600 rotate-[-90deg] w-4">Impact ↑</span>
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-1 mb-1">
            {[5, 4, 3, 2, 1].map(impact => (
              <div key={impact} className="col-span-1">
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map(likelihood => {
                    const cell = cells[5 - impact][likelihood - 1];
                    return (
                      <div
                        key={likelihood}
                        className={`h-8 rounded border text-center flex items-center justify-center text-[8px] font-bold ${cellColor(5 - impact, likelihood - 1)}`}
                        title={cell ? `${cell.risk} (L:${cell.likelihood} I:${cell.impact})` : ""}
                      >
                        {cell ? <span className="truncate px-0.5">{cell.category.slice(0, 3)}</span> : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="text-[9px] text-gray-600 text-center mt-1">Likelihood →</div>
        </div>
      </div>
    </div>
  );
}

export default function GripRisk() {
  const [tab, setTab] = useState<"risks" | "staffing" | "milestones">("risks");
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);

  const totalPayroll = STAFFING.reduce((s, r) => s + r.payroll, 0);
  const highRisks = RISKS.filter(r => r.likelihood * r.impact >= 12).length;
  const medRisks = RISKS.filter(r => r.likelihood * r.impact >= 6 && r.likelihood * r.impact < 12).length;

  return (
    <div className="min-h-full bg-[#08080F] text-white p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Risk & Operations</h1>
        <p className="text-xs text-gray-500 mt-1">DOGE-GRIP ORIN™ · Risk heatmap · Staffing plan · Milestone tracker</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Risks", value: RISKS.length.toString(), color: "#60a5fa", icon: Shield },
          { label: "High / Critical", value: highRisks.toString(), color: "#ef4444", icon: AlertTriangle },
          { label: "Medium", value: medRisks.toString(), color: "#f59e0b", icon: Activity },
          { label: "Monthly Payroll", value: `$${totalPayroll.toLocaleString()}`, color: "#34d399", icon: Users },
        ].map(kpi => (
          <div key={kpi.label} className="glass rounded-xl p-4">
            <kpi.icon className="w-4 h-4 mb-2" style={{ color: kpi.color }} />
            <div className="text-lg font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex border-b border-white/8">
          {[
            { key: "risks", label: "Risk Register" },
            { key: "staffing", label: "Staffing Plan" },
            { key: "milestones", label: "Milestones" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
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
            {tab === "risks" && (
              <motion.div key="risks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-2">
                  {RISKS.sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact)).map((risk, i) => {
                    const score = risk.likelihood * risk.impact;
                    const severity = score >= 12 ? "High" : score >= 6 ? "Medium" : "Low";
                    const sevColor = score >= 12 ? "#ef4444" : score >= 6 ? "#f59e0b" : "#34d399";
                    return (
                      <motion.div
                        key={risk.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`glass glass-hover rounded-xl p-4 cursor-pointer ${selectedRisk === risk.id ? "border-glow" : ""}`}
                        onClick={() => setSelectedRisk(selectedRisk === risk.id ? null : risk.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: sevColor + "20" }}>
                            <AlertTriangle className="w-4 h-4" style={{ color: sevColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-white">{risk.risk}</span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: risk.color + "20", color: risk.color }}>
                                  {risk.category}
                                </span>
                                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: sevColor + "20", color: sevColor }}>
                                  {severity}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-gray-500">
                              <span>L: <span className="text-white">{risk.likelihood}</span>/5</span>
                              <span>I: <span className="text-white">{risk.impact}</span>/5</span>
                              <span>Score: <span style={{ color: sevColor }}>{score}</span></span>
                              <span>Owner: <span className="text-gray-300">{risk.owner}</span></span>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {selectedRisk === risk.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-white/8 space-y-2">
                                <div>
                                  <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Mitigation</div>
                                  <p className="text-[10px] text-gray-300">{risk.mitigation}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-gray-600">Residual risk score:</span>
                                  <span className="text-[10px] font-bold text-green-400">{risk.residual * risk.likelihood}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {tab === "staffing" && (
              <motion.div key="staffing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="text-sm font-semibold text-white mb-4">Direct Labor & Payroll Plan</h3>
                <div className="space-y-3">
                  {STAFFING.map((staff, i) => (
                    <motion.div
                      key={staff.role}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-4 p-4 glass rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: staff.color + "20" }}>
                        <Users className="w-4 h-4" style={{ color: staff.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{staff.role}</div>
                        <div className="text-[10px] text-gray-500">{staff.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{ color: staff.color }}>${staff.payroll.toLocaleString()}</div>
                        <div className="text-[9px] text-gray-600">per month</div>
                      </div>
                      <div className="w-24">
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(staff.payroll / totalPayroll) * 100}%`, backgroundColor: staff.color }} />
                        </div>
                        <div className="text-[9px] text-gray-600 mt-0.5 text-right">{((staff.payroll / totalPayroll) * 100).toFixed(0)}%</div>
                      </div>
                    </motion.div>
                  ))}
                  <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/8">
                    <span className="text-sm font-semibold text-white">Total Monthly Payroll</span>
                    <span className="text-lg font-bold text-blue-300">${totalPayroll.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "milestones" && (
              <motion.div key="milestones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="text-sm font-semibold text-white mb-4">Key Milestones</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-white/8" />
                  <div className="space-y-3">
                    {MILESTONES.map((ms, i) => (
                      <motion.div
                        key={ms.milestone}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-4 pl-10 relative"
                      >
                        <div
                          className="absolute left-3 w-3 h-3 rounded-full border-2 border-[#08080F]"
                          style={{ backgroundColor: ms.color }}
                        />
                        <div className="flex-1 flex items-center gap-3 p-3 glass rounded-xl">
                          <div className="flex-1">
                            <div className="text-xs font-medium text-white">{ms.milestone}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-400">{ms.date}</span>
                            <span
                              className="text-[9px] px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: ms.status === "Active" ? "#34d39920" : "#f59e0b20",
                                color: ms.status === "Active" ? "#34d399" : "#f59e0b",
                              }}
                            >
                              {ms.status}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
