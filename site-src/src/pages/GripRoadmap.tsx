import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, CheckCircle, Clock, Zap, Package, Star, ArrowRight } from "lucide-react";

const SKUS = [
  {
    id: "grip-orin-base",
    name: "DOGE-GRIP ORIN™ Base",
    asp: 1249,
    status: "Active",
    color: "#60a5fa",
    description: "5-DOF robotic hand with Jetson Orin Nano Super, 5 smart servos, fingertip sensing, and Bambu X1 Carbon printed shell.",
    wave: 1,
    target: "Engineering, research, early adopters",
  },
  {
    id: "grip-orin-pro",
    name: "DOGE-GRIP ORIN™ Pro",
    asp: 1899,
    status: "Roadmap",
    color: "#a78bfa",
    description: "Enhanced actuators, force/torque wrist sensor, upgraded camera module, and extended calibration package.",
    wave: 2,
    target: "Industrial automation, OEM integrators",
  },
  {
    id: "grip-orin-edu",
    name: "DOGE-GRIP ORIN™ Edu",
    asp: 999,
    status: "Roadmap",
    color: "#34d399",
    description: "Education-optimized firmware, Isaac ROS curriculum pack, safety-limited mode, and classroom management software.",
    wave: 2,
    target: "Universities, vocational training, K-12 robotics",
  },
  {
    id: "grip-orin-field",
    name: "DOGE-GRIP ORIN™ Field",
    asp: 1599,
    status: "Roadmap",
    color: "#f59e0b",
    description: "IP65-rated enclosure, shock-tolerant wrist mount, extended temperature range, and field service firmware.",
    wave: 3,
    target: "Field service, outdoor inspection, AMR integration",
  },
  {
    id: "grip-orin-medical",
    name: "DOGE-GRIP ORIN™ Medical",
    asp: 3499,
    status: "Roadmap",
    color: "#f472b6",
    description: "Medical-grade materials, FDA 510(k) pathway, sterile packaging, and clinical AI diagnostic firmware.",
    wave: 4,
    target: "Clinical diagnostics, surgical assist, medical OEMs",
  },
];

const RELEASE_WAVES = [
  {
    wave: 1,
    label: "Wave 1 — Launch",
    quarter: "Q1–Q2 Y1",
    color: "#60a5fa",
    items: [
      "DOGE-GRIP ORIN™ Base SKU launch",
      "6-printer Bambu X1 Carbon farm operational",
      "Jetson Orin Nano Super provisioning pipeline",
      "Direct sales channel live",
      "Basic RBAC + serialization system",
    ],
    status: "Active",
  },
  {
    wave: 2,
    label: "Wave 2 — Scale",
    quarter: "Q3–Q4 Y1",
    color: "#a78bfa",
    items: [
      "DOGE-GRIP ORIN™ Pro + Edu SKUs",
      "Dealer and distributor channel launch",
      "OEM bundle catalog (XAutoLab, Eko)",
      "AI agent registry deployment (Phase 1)",
      "Isaac ROS curriculum integration",
    ],
    status: "Planned",
  },
  {
    wave: 3,
    label: "Wave 3 — Expand",
    quarter: "Q1–Q2 Y2",
    color: "#34d399",
    items: [
      "DOGE-GRIP ORIN™ Field SKU",
      "International distribution (Canada, UK)",
      "Fabrication cell + field ops bundles",
      "Digital twin SaaS launch",
      "Full AI agent suite (all 6 agents)",
    ],
    status: "Planned",
  },
  {
    wave: 4,
    label: "Wave 4 — Platform",
    quarter: "Q3–Q4 Y2",
    color: "#f59e0b",
    items: [
      "DOGE-GRIP ORIN™ Medical SKU",
      "FDA 510(k) submission",
      "Humanoid platform integration",
      "Developer SDK + app marketplace",
      "Academy certification program",
    ],
    status: "Planned",
  },
];

const NPI_GATES = [
  { gate: "Concept Review", criteria: "Market sizing, competitive analysis, BOM feasibility", status: "Complete", color: "#34d399" },
  { gate: "Design Freeze", criteria: "CAD locked, BOM approved, supplier qualified", status: "In Progress", color: "#60a5fa" },
  { gate: "Pilot Build", criteria: "10-unit pilot, functional test pass, QA sign-off", status: "Planned", color: "#f59e0b" },
  { gate: "Manufacturing Release", criteria: "SOP complete, RBAC configured, serialization live", status: "Planned", color: "#a78bfa" },
  { gate: "Commercial Launch", criteria: "Pricing approved, channel ready, support trained", status: "Planned", color: "#f472b6" },
];

export default function GripRoadmap() {
  const [selectedWave, setSelectedWave] = useState<number | null>(null);

  return (
    <div className="min-h-full bg-[#08080F] text-white p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Product Roadmap</h1>
        <p className="text-xs text-gray-500 mt-1">DOGE-GRIP ORIN™ · SKU portfolio · Release waves · NPI gates</p>
      </div>

      {/* SKU Portfolio */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">SKU Portfolio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SKUS.map((sku, i) => (
            <motion.div
              key={sku.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold text-white">{sku.name}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Wave {sku.wave}</div>
                </div>
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: sku.status === "Active" ? "#34d39920" : "#f59e0b20",
                    color: sku.status === "Active" ? "#34d399" : "#f59e0b",
                    border: `1px solid ${sku.status === "Active" ? "#34d39930" : "#f59e0b30"}`,
                  }}
                >
                  {sku.status}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">{sku.description}</p>
              <div className="text-[10px] text-gray-500 mb-2">
                <span className="text-gray-600">Target: </span>{sku.target}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="text-sm font-bold" style={{ color: sku.color }}>${sku.asp.toLocaleString()}</div>
                <div className="text-[9px] text-gray-600">list price</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Release Waves */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Release Waves</h2>
        <div className="space-y-3">
          {RELEASE_WAVES.map((wave, i) => (
            <motion.div
              key={wave.wave}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`glass glass-hover rounded-xl overflow-hidden cursor-pointer`}
              onClick={() => setSelectedWave(selectedWave === wave.wave ? null : wave.wave)}
            >
              <div className="flex items-center gap-4 p-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: wave.color + "20", border: `1px solid ${wave.color}30` }}>
                  <span className="text-xs font-bold" style={{ color: wave.color }}>{wave.wave}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{wave.label}</span>
                    <span className="text-[9px] text-gray-500">{wave.quarter}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{wave.items.length} deliverables</div>
                </div>
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: wave.status === "Active" ? "#34d39920" : "#f59e0b20",
                    color: wave.status === "Active" ? "#34d399" : "#f59e0b",
                  }}
                >
                  {wave.status}
                </span>
              </div>

              {selectedWave === wave.wave && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="px-4 pb-4 border-t border-white/5"
                >
                  <div className="pt-3 space-y-1.5">
                    {wave.items.map((item, j) => (
                      <div key={j} className="flex items-center gap-2">
                        {wave.status === "Active" ? (
                          <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        ) : (
                          <Clock className="w-3 h-3 text-gray-600 flex-shrink-0" />
                        )}
                        <span className="text-[10px] text-gray-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* NPI Gates */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">NPI Readiness Gates</h2>
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left p-4 text-gray-500">Gate</th>
                <th className="text-left p-4 text-gray-500">Exit Criteria</th>
                <th className="text-right p-4 text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {NPI_GATES.map((gate, i) => (
                <motion.tr
                  key={gate.gate}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="border-b border-white/4 hover:bg-white/3"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: gate.color }} />
                      <span className="font-medium text-white">{gate.gate}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400">{gate.criteria}</td>
                  <td className="p-4 text-right">
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: gate.color + "20", color: gate.color }}
                    >
                      {gate.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
