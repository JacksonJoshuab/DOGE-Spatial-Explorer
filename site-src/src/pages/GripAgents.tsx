import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Zap, Shield, CheckCircle, Clock, Activity, Brain, TrendingUp } from "lucide-react";

const AGENTS = [
  {
    id: "print-scheduler",
    name: "Print Scheduler Agent",
    domain: "Manufacturing",
    trigger: "Print queue / ECO release",
    output: "Optimized print schedule + material allocation",
    owner: "Print tech lead",
    status: "Planned",
    annual_benefit: 18000,
    annual_cost: 3600,
    color: "#60a5fa",
    icon: "🖨️",
    description: "Optimizes Bambu X1 Carbon farm scheduling based on order backlog, material availability, and ECO release status. Reduces idle printer time and rush reprints.",
    capabilities: ["Queue optimization", "Material planning", "ECO gating", "Shift scheduling"],
    human_gates: ["ECO release approval", "Material substitution"],
  },
  {
    id: "assembly-copilot",
    name: "Assembly Copilot Agent",
    domain: "Manufacturing",
    trigger: "Serial release / NCR",
    output: "Serial-specific work instruction card",
    owner: "Assembly lead",
    status: "Planned",
    annual_benefit: 12000,
    annual_cost: 2400,
    color: "#a78bfa",
    icon: "🔧",
    description: "Generates per-serial work instruction cards from ECO-controlled BOMs. Flags NCRs and routes to CAPA workflow automatically.",
    capabilities: ["Work instruction generation", "NCR routing", "CAPA drafting", "Serial tracking"],
    human_gates: ["CAPA closure approval", "NCR disposition"],
  },
  {
    id: "jetson-provisioning",
    name: "Jetson Provisioning Agent",
    domain: "Programming",
    trigger: "Image release / serial creation",
    output: "Config pack + test script",
    owner: "Programming lead",
    status: "Planned",
    annual_benefit: 22000,
    annual_cost: 4800,
    color: "#34d399",
    icon: "⚡",
    description: "Automates Jetson Orin Nano Super image flashing, calibration, and post-flash test execution. Reduces programming cycle time from 1.25 hrs to ~20 min.",
    capabilities: ["Image flashing", "Calibration automation", "Test execution", "Serial provisioning"],
    human_gates: ["Image release sign-off", "Calibration verification"],
  },
  {
    id: "quality-triage",
    name: "Quality Triage Agent",
    domain: "Quality",
    trigger: "Test fail / inspection image",
    output: "Defect class + CAPA draft",
    owner: "Quality manager",
    status: "Planned",
    annual_benefit: 15000,
    annual_cost: 3000,
    color: "#f59e0b",
    icon: "🔍",
    description: "Classifies inspection failures using computer vision and historical defect data. Drafts CAPA documents and routes to responsible engineer.",
    capabilities: ["Defect classification", "Vision inspection", "CAPA drafting", "Trend analysis"],
    human_gates: ["CAPA closure", "Outbound quality hold release"],
  },
  {
    id: "commercial-copilot",
    name: "Commercial Copilot Agent",
    domain: "Sales / Support",
    trigger: "Quote, order, RMA, renewal",
    output: "Response draft + next-best action",
    owner: "Commercial ops",
    status: "Planned",
    annual_benefit: 28000,
    annual_cost: 6000,
    color: "#f472b6",
    icon: "💼",
    description: "Handles quote generation, order acknowledgment, RMA initiation, and renewal reminders. Surfaces next-best-action recommendations for commercial ops.",
    capabilities: ["Quote generation", "Order processing", "RMA workflow", "Renewal alerts"],
    human_gates: ["Pricing approval", "Outbound customer commitments"],
  },
  {
    id: "exec-control-tower",
    name: "Executive Control Tower Agent",
    domain: "Leadership",
    trigger: "Monthly close / KPI refresh",
    output: "Variance narrative + action list",
    owner: "CEO / COO",
    status: "Planned",
    annual_benefit: 35000,
    annual_cost: 7200,
    color: "#38bdf8",
    icon: "🏛️",
    description: "Synthesizes monthly financial close data into board-ready variance narratives and prioritized action lists. Integrates with all operational KPI streams.",
    capabilities: ["Variance analysis", "Narrative generation", "Action prioritization", "Board reporting"],
    human_gates: ["Pricing decisions", "Strategic commitments"],
  },
];

const ORCHESTRATION_RULES = [
  { from: "Print Scheduler", to: "Assembly Copilot", trigger: "Print complete → serial released", color: "#60a5fa" },
  { from: "Assembly Copilot", to: "Jetson Provisioning", trigger: "Assembly complete → programming queue", color: "#a78bfa" },
  { from: "Jetson Provisioning", to: "Quality Triage", trigger: "Flash complete → QA test trigger", color: "#34d399" },
  { from: "Quality Triage", to: "Commercial Copilot", trigger: "QA pass → order fulfillment", color: "#f59e0b" },
  { from: "All Agents", to: "Executive Control Tower", trigger: "Monthly close → KPI aggregation", color: "#38bdf8" },
];

export default function GripAgents() {
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"registry" | "orchestration" | "roi">("registry");

  const totalBenefit = AGENTS.reduce((s, a) => s + a.annual_benefit, 0);
  const totalCost = AGENTS.reduce((s, a) => s + a.annual_cost, 0);
  const roi = ((totalBenefit - totalCost) / totalCost * 100).toFixed(0);

  return (
    <div className="min-h-full bg-[#08080F] text-white p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">AI Agent Registry</h1>
        <p className="text-xs text-gray-500 mt-1">DOGE-GRIP ORIN™ · 6 planned agents · Multi-agent orchestration · Human approval gates</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Registered Agents", value: AGENTS.length.toString(), color: "#60a5fa", icon: Bot },
          { label: "Annual Benefit", value: `$${(totalBenefit / 1000).toFixed(0)}K`, color: "#34d399", icon: TrendingUp },
          { label: "Annual Cost", value: `$${(totalCost / 1000).toFixed(0)}K`, color: "#f59e0b", icon: Zap },
          { label: "Agent ROI", value: `${roi}%`, color: "#a78bfa", icon: Activity },
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
            { key: "registry", label: "Agent Registry" },
            { key: "orchestration", label: "Orchestration" },
            { key: "roi", label: "ROI Model" },
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
            {tab === "registry" && (
              <motion.div key="registry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {AGENTS.map((agent, i) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`glass glass-hover rounded-xl p-4 cursor-pointer transition-all ${selected === agent.id ? "border-glow" : ""}`}
                    onClick={() => setSelected(selected === agent.id ? null : agent.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{agent.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-semibold text-white">{agent.name}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: agent.color + "20", color: agent.color }}>
                              {agent.domain}
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                              {agent.status}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-gray-600">Trigger: </span>
                            <span className="text-gray-300">{agent.trigger}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Owner: </span>
                            <span className="text-gray-300">{agent.owner}</span>
                          </div>
                        </div>
                        <div className="mt-1.5 text-[10px]">
                          <span className="text-gray-600">Output: </span>
                          <span className="text-gray-300">{agent.output}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-[10px]">
                            <span className="text-gray-600">Annual benefit: </span>
                            <span className="text-green-400 font-mono">${agent.annual_benefit.toLocaleString()}</span>
                          </div>
                          <div className="text-[10px]">
                            <span className="text-gray-600">Annual cost: </span>
                            <span className="text-amber-400 font-mono">${agent.annual_cost.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {selected === agent.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-white/8 space-y-3">
                            <p className="text-[10px] text-gray-400 leading-relaxed">{agent.description}</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5">Capabilities</div>
                                {agent.capabilities.map(cap => (
                                  <div key={cap} className="flex items-center gap-1.5 mb-1">
                                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                                    <span className="text-[10px] text-gray-300">{cap}</span>
                                  </div>
                                ))}
                              </div>
                              <div>
                                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5">Human Approval Gates</div>
                                {agent.human_gates.map(gate => (
                                  <div key={gate} className="flex items-center gap-1.5 mb-1">
                                    <Shield className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                    <span className="text-[10px] text-gray-300">{gate}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {tab === "orchestration" && (
              <motion.div key="orchestration" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="text-sm font-semibold text-white mb-4">Multi-Agent Handoff Flows</h3>
                <div className="space-y-3">
                  {ORCHESTRATION_RULES.map((rule, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-3 p-3 glass rounded-xl"
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: rule.color }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-white">{rule.from}</span>
                          <span className="text-gray-600">→</span>
                          <span className="font-medium" style={{ color: rule.color }}>{rule.to}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{rule.trigger}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-semibold text-white">Governance Principle</h4>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Human approval gates are required for: pricing decisions, ECO release, CAPA closure, provisioning sign-off,
                    and all outbound customer commitments. Agents operate within bounded authority scopes defined in the
                    AI_Agent_Command_Center governance layer.
                  </p>
                </div>
              </motion.div>
            )}

            {tab === "roi" && (
              <motion.div key="roi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="text-sm font-semibold text-white mb-4">Agent ROI Model</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/8">
                        <th className="text-left py-2 text-gray-500">Agent</th>
                        <th className="text-right py-2 text-gray-500">Annual Benefit</th>
                        <th className="text-right py-2 text-gray-500">Annual Cost</th>
                        <th className="text-right py-2 text-gray-500">Net Benefit</th>
                        <th className="text-right py-2 text-gray-500">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {AGENTS.map(agent => {
                        const net = agent.annual_benefit - agent.annual_cost;
                        const agentRoi = ((net / agent.annual_cost) * 100).toFixed(0);
                        return (
                          <tr key={agent.id} className="border-b border-white/4 hover:bg-white/3">
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <span>{agent.icon}</span>
                                <span className="text-gray-300">{agent.name}</span>
                              </div>
                            </td>
                            <td className="py-2 text-right text-green-400 font-mono">${agent.annual_benefit.toLocaleString()}</td>
                            <td className="py-2 text-right text-amber-400 font-mono">${agent.annual_cost.toLocaleString()}</td>
                            <td className="py-2 text-right text-white font-mono">${net.toLocaleString()}</td>
                            <td className="py-2 text-right font-bold" style={{ color: agent.color }}>{agentRoi}%</td>
                          </tr>
                        );
                      })}
                      <tr className="border-t border-white/15 font-semibold">
                        <td className="py-2 text-white">Total</td>
                        <td className="py-2 text-right text-green-400 font-mono">${totalBenefit.toLocaleString()}</td>
                        <td className="py-2 text-right text-amber-400 font-mono">${totalCost.toLocaleString()}</td>
                        <td className="py-2 text-right text-white font-mono">${(totalBenefit - totalCost).toLocaleString()}</td>
                        <td className="py-2 text-right text-blue-400 font-bold">{roi}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
