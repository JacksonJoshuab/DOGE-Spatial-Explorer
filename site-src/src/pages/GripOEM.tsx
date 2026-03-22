import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Package, DollarSign, Star, ArrowUpRight, CheckCircle, Layers } from "lucide-react";

const OEM_CATALOG = [
  {
    id: "xautolab",
    name: "XAutoLab Bundle",
    category: "Education / Research",
    description: "Desktop arm + DOGE-GRIP ORIN + Isaac ROS curriculum pack. Targets university robotics labs and vocational training centers.",
    asp: 2499,
    margin: 0.38,
    status: "Planned",
    color: "#60a5fa",
    tags: ["Education", "ROS2", "Isaac"],
    includes: ["DOGE-GRIP ORIN™", "Desktop cobot arm", "Isaac ROS curriculum", "Lab safety kit"],
  },
  {
    id: "eko",
    name: "Eko Clinical Bundle",
    category: "Medical / Diagnostics",
    description: "Clinical AI diagnostic hand with Eko stethoscope integration. White-labeled for medical device OEMs.",
    asp: 4999,
    margin: 0.42,
    status: "Planned",
    color: "#34d399",
    tags: ["Medical", "AI Diagnostics", "FDA"],
    includes: ["DOGE-GRIP ORIN™", "Eko stethoscope module", "Clinical AI firmware", "Compliance docs"],
  },
  {
    id: "fabrication",
    name: "Fabrication Cell Bundle",
    category: "Manufacturing",
    description: "Sheet metal bending + laser cut integration with DOGE-GRIP ORIN for lights-out fabrication cells.",
    asp: 6999,
    margin: 0.35,
    status: "Planned",
    color: "#f59e0b",
    tags: ["Manufacturing", "Laser", "Sheet Metal"],
    includes: ["DOGE-GRIP ORIN™", "Quick-change wrist kit", "Fabrication firmware", "Safety interlocks"],
  },
  {
    id: "fieldops",
    name: "Field Ops Bundle",
    category: "Field Service",
    description: "AMR-mounted DOGE-GRIP ORIN for field inspection, maintenance, and service dispatch optimization.",
    asp: 5499,
    margin: 0.36,
    status: "Planned",
    color: "#a78bfa",
    tags: ["Field Service", "AMR", "Inspection"],
    includes: ["DOGE-GRIP ORIN™", "Shock-tolerant mount", "Field firmware", "Remote support module"],
  },
  {
    id: "drone",
    name: "Drone Dock FieldOps",
    category: "Aerial / Survey",
    description: "Drone dock integration with DOGE-GRIP ORIN for autonomous field scan, twin generation, and sample collection.",
    asp: 7499,
    margin: 0.33,
    status: "Planned",
    color: "#f472b6",
    tags: ["Drone", "Digital Twin", "Survey"],
    includes: ["DOGE-GRIP ORIN™", "Drone dock interface", "Scan-to-make firmware", "Field twin software"],
  },
  {
    id: "electronics",
    name: "OpenPnP Electronics Line",
    category: "Electronics Assembly",
    description: "Pick-and-place electronics assembly with DOGE-GRIP ORIN and OpenPnP integration for PCB production.",
    asp: 3999,
    margin: 0.40,
    status: "Planned",
    color: "#38bdf8",
    tags: ["Electronics", "PnP", "PCB"],
    includes: ["DOGE-GRIP ORIN™", "PCB gripper tooling", "OpenPnP firmware", "Vision inspection"],
  },
];

const ADJACENCY_CATEGORIES = [
  { name: "Printing Accessories", items: ["Filament bundles", "Nozzle kits", "Build plates", "Enclosure upgrades"], color: "#60a5fa" },
  { name: "Sensors & Vision", items: ["Fingertip tactile sensors", "Wrist cameras", "Force/torque sensors", "Depth cameras"], color: "#a78bfa" },
  { name: "Software & Cloud", items: ["Isaac ROS license", "Digital twin SaaS", "Remote fleet ops", "OTA management"], color: "#34d399" },
  { name: "Training & Academy", items: ["Operator certification", "ROS2 curriculum", "Safety training", "Demo kits"], color: "#f59e0b" },
];

const PARTNER_TIERS = [
  { tier: "Authorized Reseller", discount: "15%", requirements: "Online store + 2 demos/yr", color: "#60a5fa" },
  { tier: "Silver Partner", discount: "20%", requirements: "5 units/yr + training cert", color: "#9ca3af" },
  { tier: "Gold Partner", discount: "25%", requirements: "20 units/yr + dedicated SE", color: "#f59e0b" },
  { tier: "Platinum OEM", discount: "30%", requirements: "50 units/yr + white-label rights", color: "#a78bfa" },
];

export default function GripOEM() {
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"catalog" | "adjacency" | "partners">("catalog");

  const selectedBundle = OEM_CATALOG.find(b => b.id === selected);

  return (
    <div className="min-h-full bg-[#08080F] text-white p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">OEM & White-Label Ecosystem</h1>
        <p className="text-xs text-gray-500 mt-1">DOGE-GRIP ORIN™ · Bundle catalog · Partner tiers · Adjacency products</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "OEM Bundles", value: OEM_CATALOG.length.toString(), color: "#60a5fa", icon: Package },
          { label: "Avg Bundle ASP", value: `$${Math.round(OEM_CATALOG.reduce((s, b) => s + b.asp, 0) / OEM_CATALOG.length).toLocaleString()}`, color: "#a78bfa", icon: DollarSign },
          { label: "Partner Tiers", value: "4", color: "#34d399", icon: Star },
          { label: "Adjacency Lines", value: ADJACENCY_CATEGORIES.length.toString(), color: "#f59e0b", icon: Layers },
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
            { key: "catalog", label: "Bundle Catalog" },
            { key: "adjacency", label: "Adjacency Products" },
            { key: "partners", label: "Partner Tiers" },
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
            {tab === "catalog" && (
              <motion.div key="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {OEM_CATALOG.map((bundle, i) => (
                    <motion.div
                      key={bundle.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`glass glass-hover rounded-xl p-4 cursor-pointer transition-all ${selected === bundle.id ? "border-glow" : ""}`}
                      onClick={() => setSelected(selected === bundle.id ? null : bundle.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-xs font-semibold text-white">{bundle.name}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{bundle.category}</div>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          {bundle.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">{bundle.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {bundle.tags.map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div>
                          <div className="text-sm font-bold" style={{ color: bundle.color }}>${bundle.asp.toLocaleString()}</div>
                          <div className="text-[9px] text-gray-600">bundle ASP</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-400">{(bundle.margin * 100).toFixed(0)}%</div>
                          <div className="text-[9px] text-gray-600">est. margin</div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {selected === bundle.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-white/8">
                              <div className="text-[10px] text-gray-500 mb-2">Bundle includes:</div>
                              {bundle.includes.map(item => (
                                <div key={item} className="flex items-center gap-2 mb-1">
                                  <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                                  <span className="text-[10px] text-gray-300">{item}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === "adjacency" && (
              <motion.div key="adjacency" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ADJACENCY_CATEGORIES.map((cat, i) => (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="glass rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <h3 className="text-sm font-semibold text-white">{cat.name}</h3>
                      </div>
                      <div className="space-y-2">
                        {cat.items.map(item => (
                          <div key={item} className="flex items-center gap-2 p-2 bg-white/3 rounded-lg">
                            <ArrowUpRight className="w-3 h-3 flex-shrink-0" style={{ color: cat.color }} />
                            <span className="text-xs text-gray-300">{item}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-gray-300">
                    Adjacency products are sold alongside DOGE-GRIP ORIN bundles to increase attach revenue per deal.
                    White-label content syndication cross-promotes accessories, academy certifications, and service attach
                    across all partner channels.
                  </p>
                </div>
              </motion.div>
            )}

            {tab === "partners" && (
              <motion.div key="partners" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-3">
                  {PARTNER_TIERS.map((tier, i) => (
                    <motion.div
                      key={tier.tier}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-4 p-4 glass rounded-xl"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tier.color + "20", border: `1px solid ${tier.color}30` }}>
                        <Star className="w-5 h-5" style={{ color: tier.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{tier.tier}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{tier.requirements}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: tier.color }}>{tier.discount}</div>
                        <div className="text-[9px] text-gray-600">off list price</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <h4 className="text-xs font-semibold text-white mb-2">Deal Registration</h4>
                    <p className="text-[10px] text-gray-400">Partners register deals to protect margin and receive additional MDF support. Registered deals qualify for extra 3–5% discount protection.</p>
                  </div>
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <h4 className="text-xs font-semibold text-white mb-2">Content Syndication</h4>
                    <p className="text-[10px] text-gray-400">White-label content packs, co-branded asset library, and SEO cross-promotion included for Silver tier and above.</p>
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
