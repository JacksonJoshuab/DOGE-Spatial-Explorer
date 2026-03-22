import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, CheckCircle, AlertCircle, Clock, Zap, Shield } from "lucide-react";

const ROBOT_FAMILIES = [
  {
    id: "desktop",
    family: "Desktop Educational Arm",
    example: "Elephant Robotics myCobot",
    mount: "Light wrist flange + USB/serial bridge",
    power: "24V ext + USB/Ethernet",
    notes: "Best for training and low-risk demos. Easy integration, low cost, ideal for university labs.",
    confidence: 92,
    color: "#60a5fa",
    status: "Planned",
    kpi: "Pass-rate by SKU",
    complexity: "Low",
    asp_uplift: 1250,
  },
  {
    id: "prosumer",
    family: "Prosumer Cobot Arm",
    example: "UFACTORY Lite 6",
    mount: "Adapter plate + quick disconnect",
    power: "24V + Ethernet",
    notes: "Good bundle candidate for SMB and education markets. Strong ROI for light industrial tasks.",
    confidence: 85,
    color: "#a78bfa",
    status: "Planned",
    kpi: "Qualified bundle count",
    complexity: "Low–Medium",
    asp_uplift: 1500,
  },
  {
    id: "industrial",
    family: "Industrial Cobot",
    example: "Universal Robots class",
    mount: "ISO flange adapter + guarded cable path",
    power: "24V/48V + Ethernet/IP gateway",
    notes: "Higher ASP, stronger safety review required. Best for manufacturing and assembly automation.",
    confidence: 78,
    color: "#34d399",
    status: "Planned",
    kpi: "Pilot approvals",
    complexity: "Medium",
    asp_uplift: 2500,
  },
  {
    id: "mobile",
    family: "Mobile Manipulator",
    example: "AMR + collaborative arm",
    mount: "Shock-tolerant mount + lockout",
    power: "Battery / DC bus + Wi-Fi",
    notes: "Field demo and service workflow fit. Requires vibration-tolerant wrist design.",
    confidence: 70,
    color: "#f59e0b",
    status: "Planned",
    kpi: "Field uptime",
    complexity: "Medium–High",
    asp_uplift: 2000,
  },
  {
    id: "humanoid",
    family: "Humanoid / Advanced Platform",
    example: "Research humanoid integration",
    mount: "Custom wrist kit + firmware profile",
    power: "Custom power budget + CAN/Ethernet",
    notes: "Use for flagship R&D partnerships. Highest engineering investment, highest strategic value.",
    confidence: 55,
    color: "#f472b6",
    status: "Planned",
    kpi: "Engineering cycle time",
    complexity: "High",
    asp_uplift: 4000,
  },
];

const CELL_LAYOUTS = [
  {
    name: "Bench Integration Cell",
    robot: "Desktop arm + DOGE-GRIP ORIN",
    mount: "Single-hand test flange / quick-change wrist",
    space: "6×8 ft bench, power, Ethernet, camera",
    use: "Engineering bring-up / demos",
    kpi: "Integration readiness",
    color: "#60a5fa",
  },
  {
    name: "Pilot Assembly Cell",
    robot: "Collaborative arm + fixture table",
    mount: "Dual quick-change bracket",
    space: "10×12 ft, compressed air optional, UPS",
    use: "Low-volume assembly / QA",
    kpi: "Throughput per shift",
    color: "#a78bfa",
  },
  {
    name: "OEM Bundle Staging Cell",
    robot: "Pallet rack + robot crate area",
    mount: "Pre-mounted shipping configuration",
    space: "12×12 ft, barcode, pack bench",
    use: "Bundle prep / outbound",
    kpi: "Bundle release time",
    color: "#34d399",
  },
  {
    name: "Training Simulator Cell",
    robot: "Mobile robot / arm simulator station",
    mount: "Training-safe dummy interface",
    space: "8×10 ft, display, remote support",
    use: "Customer/operator training",
    kpi: "Training completion",
    color: "#f59e0b",
  },
  {
    name: "Experience Center Cell",
    robot: "Showcase robot + screen wall",
    mount: "Demo-ready branded wrist kit",
    space: "12×16 ft, AV, network, lighting",
    use: "Sales demos / partner enablement",
    kpi: "Demo conversion",
    color: "#f472b6",
  },
];

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function GripRobots() {
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"compat" | "cells">("compat");

  return (
    <div className="min-h-full bg-[#08080F] text-white p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Robot Compatibility Matrix</h1>
        <p className="text-xs text-gray-500 mt-1">DOGE-GRIP ORIN™ · 5 robot families · Cell layouts · Interface strategy</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Robot Families", value: ROBOT_FAMILIES.length.toString(), color: "#60a5fa", icon: Wrench },
          { label: "Cell Layouts", value: CELL_LAYOUTS.length.toString(), color: "#a78bfa", icon: Shield },
          { label: "Avg Confidence", value: `${Math.round(ROBOT_FAMILIES.reduce((s, r) => s + r.confidence, 0) / ROBOT_FAMILIES.length)}%`, color: "#34d399", icon: CheckCircle },
          { label: "Max ASP Uplift", value: `$${Math.max(...ROBOT_FAMILIES.map(r => r.asp_uplift)).toLocaleString()}`, color: "#f59e0b", icon: Zap },
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
            { key: "compat", label: "Compatibility Matrix" },
            { key: "cells", label: "Cell Layouts" },
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
            {tab === "compat" && (
              <motion.div key="compat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {ROBOT_FAMILIES.map((robot, i) => (
                  <motion.div
                    key={robot.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`glass glass-hover rounded-xl p-4 cursor-pointer transition-all ${selected === robot.id ? "border-glow" : ""}`}
                    onClick={() => setSelected(selected === robot.id ? null : robot.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: robot.color + "20", border: `1px solid ${robot.color}30` }}>
                        <Wrench className="w-5 h-5" style={{ color: robot.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-semibold text-white">{robot.family}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{robot.complexity}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Planned</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500 mb-2">{robot.example}</div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Mount / Interface</div>
                            <div className="text-[10px] text-gray-300">{robot.mount}</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Power / Data</div>
                            <div className="text-[10px] text-gray-300">{robot.power}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="text-[9px] text-gray-600 mb-1">Integration Confidence</div>
                            <ConfidenceBar value={robot.confidence} color={robot.color} />
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] text-gray-600">ASP Uplift</div>
                            <div className="text-xs font-bold" style={{ color: robot.color }}>+${robot.asp_uplift.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {selected === robot.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-white/8">
                            <p className="text-[10px] text-gray-400 leading-relaxed">{robot.notes}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span className="text-[10px] text-gray-400">Primary KPI: <span className="text-white">{robot.kpi}</span></span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {tab === "cells" && (
              <motion.div key="cells" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CELL_LAYOUTS.map((cell, i) => (
                    <motion.div
                      key={cell.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="glass rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cell.color }} />
                        <h3 className="text-sm font-semibold text-white">{cell.name}</h3>
                      </div>
                      <div className="space-y-2 text-[10px]">
                        {[
                          { label: "Robot / Device", value: cell.robot },
                          { label: "Mount Config", value: cell.mount },
                          { label: "Space / Utilities", value: cell.space },
                          { label: "Primary Use", value: cell.use },
                          { label: "KPI", value: cell.kpi },
                        ].map(row => (
                          <div key={row.label} className="flex gap-2">
                            <span className="text-gray-600 w-24 flex-shrink-0">{row.label}</span>
                            <span className="text-gray-300">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-gray-300">
                    Standardized cell layouts reduce install variance and speed white-label rollout.
                    Target: compatible OEM robot SKUs with clear power/data envelopes and white-label-ready bundle options.
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
