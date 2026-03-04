import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette, Upload, Download, RefreshCw, CheckCircle,
  Search, Filter, Plus, Eye, Copy, Trash2, Zap,
  ArrowLeftRight, Settings, Star, Clock, Layers
} from "lucide-react";

interface Material {
  id: string;
  name: string;
  type: "principled" | "emission" | "glass" | "metal" | "subsurface" | "custom";
  baseColor: string;
  metallic: number;
  roughness: number;
  emission: string | null;
  alpha: number;
  ior: number;
  blenderName: string;
  syncStatus: "synced" | "pending" | "conflict" | "local-only";
  lastModified: string;
  usedBy: string[];
  tags: string[];
  starred: boolean;
  previewGradient: string;
}

const MATERIALS: Material[] = [
  {
    id: "m1", name: "Plasma Ring Mat", type: "emission",
    baseColor: "#1a0a3a", metallic: 0, roughness: 0.2, emission: "#7040ff", alpha: 1, ior: 1.45,
    blenderName: "Plasma_Ring_Mat", syncStatus: "synced",
    lastModified: "2m ago", usedBy: ["Plasma Rings (×18)", "Core Sphere"],
    tags: ["plasma", "emission", "vfx"], starred: true,
    previewGradient: "from-violet-900 via-purple-600 to-blue-500"
  },
  {
    id: "m2", name: "Z-Pinch Column", type: "principled",
    baseColor: "#0a0a20", metallic: 0.1, roughness: 0.8, emission: "#4080ff", alpha: 0.85, ior: 1.5,
    blenderName: "ZPinch_Column_Mat", syncStatus: "pending",
    lastModified: "5m ago", usedBy: ["Z-Pinch Column"],
    tags: ["column", "translucent"], starred: true,
    previewGradient: "from-blue-900 via-blue-700 to-cyan-500"
  },
  {
    id: "m3", name: "Bounding Box Wire", type: "emission",
    baseColor: "#ff4040", metallic: 0, roughness: 1, emission: "#ff6060", alpha: 0.7, ior: 1,
    blenderName: "BBox_Wire_Mat", syncStatus: "synced",
    lastModified: "12m ago", usedBy: ["Bounding Box"],
    tags: ["wireframe", "debug"], starred: false,
    previewGradient: "from-red-900 via-red-600 to-orange-500"
  },
  {
    id: "m4", name: "Core Sphere Glass", type: "glass",
    baseColor: "#ffffff", metallic: 0, roughness: 0, emission: null, alpha: 0.1, ior: 1.52,
    blenderName: "Core_Sphere_Glass", syncStatus: "conflict",
    lastModified: "18m ago", usedBy: ["Core Sphere"],
    tags: ["glass", "transparent", "ior"], starred: false,
    previewGradient: "from-gray-700 via-gray-400 to-white"
  },
  {
    id: "m5", name: "Aurora Gradient", type: "emission",
    baseColor: "#001a10", metallic: 0, roughness: 0.5, emission: "#00ff80", alpha: 0.6, ior: 1,
    blenderName: "Aurora_Gradient_Mat", syncStatus: "synced",
    lastModified: "34m ago", usedBy: ["Background Plane"],
    tags: ["aurora", "environment", "gradient"], starred: true,
    previewGradient: "from-green-900 via-emerald-600 to-teal-400"
  },
  {
    id: "m6", name: "Metal Electrode", type: "metal",
    baseColor: "#c0c0d0", metallic: 1, roughness: 0.15, emission: null, alpha: 1, ior: 2.5,
    blenderName: "Metal_Electrode_Mat", syncStatus: "local-only",
    lastModified: "1h ago", usedBy: ["Electrode Top", "Electrode Bottom"],
    tags: ["metal", "pbr", "electrode"], starred: false,
    previewGradient: "from-gray-600 via-gray-400 to-gray-200"
  },
  {
    id: "m7", name: "Plasma Glow Halo", type: "emission",
    baseColor: "#200030", metallic: 0, roughness: 0, emission: "#c040ff", alpha: 0.4, ior: 1,
    blenderName: "Plasma_Glow_Halo", syncStatus: "synced",
    lastModified: "2h ago", usedBy: ["Halo Sphere"],
    tags: ["glow", "halo", "vfx"], starred: false,
    previewGradient: "from-purple-900 via-fuchsia-600 to-pink-400"
  },
  {
    id: "m8", name: "Subsurface Orb", type: "subsurface",
    baseColor: "#ff8040", metallic: 0, roughness: 0.3, emission: null, alpha: 1, ior: 1.4,
    blenderName: "Subsurface_Orb_Mat", syncStatus: "synced",
    lastModified: "3h ago", usedBy: ["Energy Orb"],
    tags: ["subsurface", "organic", "sss"], starred: false,
    previewGradient: "from-orange-800 via-orange-500 to-amber-300"
  },
];

const syncBadge = {
  synced: { color: "text-green-400", bg: "bg-green-500/15 border-green-500/25", label: "Synced" },
  pending: { color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/25", label: "Pending" },
  conflict: { color: "text-red-400", bg: "bg-red-500/15 border-red-500/25", label: "Conflict" },
  "local-only": { color: "text-gray-400", bg: "bg-gray-500/15 border-gray-500/25", label: "Local Only" },
};

const typeColor = {
  principled: "text-blue-400",
  emission: "text-purple-400",
  glass: "text-cyan-400",
  metal: "text-gray-300",
  subsurface: "text-orange-400",
  custom: "text-pink-400",
};

export default function MaterialSync() {
  const [materials, setMaterials] = useState(MATERIALS);
  const [selected, setSelected] = useState<string>("m1");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "synced" | "pending" | "conflict">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [syncPulse, setSyncPulse] = useState<string | null>(null);

  const selectedMat = materials.find(m => m.id === selected);

  const filtered = materials.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.some(t => t.includes(search.toLowerCase()));
    const matchFilter = filter === "all" || m.syncStatus === filter;
    return matchSearch && matchFilter;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const pendingMats = materials.filter(m => m.syncStatus === "pending");
      if (pendingMats.length > 0) {
        const mat = pendingMats[Math.floor(Math.random() * pendingMats.length)];
        setSyncPulse(mat.id);
        setTimeout(() => {
          setMaterials(prev => prev.map(m => m.id === mat.id ? { ...m, syncStatus: "synced", lastModified: "just now" } : m));
          setSyncPulse(null);
        }, 800);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [materials]);

  const handleSync = (id: string) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, syncStatus: "pending" } : m));
    setSyncPulse(id);
    setTimeout(() => {
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, syncStatus: "synced", lastModified: "just now" } : m));
      setSyncPulse(null);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#08080F] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8 bg-[#0A0A16] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
          <Palette className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">Material & Shader Sync</h1>
          <p className="text-[10px] text-gray-500">PBR library · Blender Principled BSDF · RealityKit MDL · USDZ export</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
            {(["grid", "list"] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all capitalize ${
                  viewMode === v ? "bg-pink-500/20 text-pink-300" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {v === "grid" ? "⊞ Grid" : "≡ List"}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/15 border border-pink-500/25 rounded-lg text-xs text-pink-300 hover:bg-pink-500/25 transition-colors">
            <Plus className="w-3 h-3" /> New Material
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 hover:bg-white/10 transition-colors">
            <ArrowLeftRight className="w-3 h-3" /> Sync All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-white/5 border-b border-white/8 flex-shrink-0">
        {[
          { label: "Total Materials", value: materials.length.toString(), color: "text-pink-400" },
          { label: "Synced", value: materials.filter(m => m.syncStatus === "synced").length.toString(), color: "text-green-400" },
          { label: "Pending", value: materials.filter(m => m.syncStatus === "pending").length.toString(), color: "text-amber-400" },
          { label: "Conflicts", value: materials.filter(m => m.syncStatus === "conflict").length.toString(), color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 px-4 py-2.5 bg-[#09090F]">
            <div>
              <div className={`text-base font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: Material library */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search/filter bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/8 flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <Search className="w-3 h-3 text-gray-500" />
              <input
                type="text"
                placeholder="Search materials, tags…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-[11px] text-gray-300 placeholder-gray-600 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
              {(["all", "synced", "pending", "conflict"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-1 rounded-md text-[9px] font-medium transition-all capitalize ${
                    filter === f ? "bg-pink-500/20 text-pink-300" : "text-gray-600 hover:text-gray-400"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Material grid/list */}
          <div className="flex-1 overflow-y-auto p-4">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-3 gap-3">
                {filtered.map(mat => (
                  <motion.div
                    key={mat.id}
                    onClick={() => setSelected(mat.id)}
                    className={`rounded-xl border overflow-hidden cursor-pointer transition-all ${
                      selected === mat.id
                        ? "border-pink-500/40 ring-1 ring-pink-500/20 shadow-lg shadow-pink-500/10"
                        : "border-white/10 hover:border-white/20"
                    } ${syncPulse === mat.id ? "ring-1 ring-amber-400/50" : ""}`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {/* Preview swatch */}
                    <div className={`h-20 bg-gradient-to-br ${mat.previewGradient} relative`}>
                      {/* Sphere preview simulation */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className={`w-14 h-14 rounded-full bg-gradient-to-br ${mat.previewGradient} border border-white/20`}
                          style={{
                            boxShadow: mat.emission ? `0 0 20px ${mat.emission}60, inset -4px -4px 8px rgba(0,0,0,0.5)` : "inset -4px -4px 8px rgba(0,0,0,0.5)",
                            opacity: mat.alpha,
                          }}
                        />
                      </div>
                      {mat.starred && (
                        <Star className="absolute top-2 right-2 w-3 h-3 text-amber-400 fill-amber-400" />
                      )}
                      {syncPulse === mat.id && (
                        <div className="absolute inset-0 bg-amber-400/10 animate-pulse" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5 bg-[#0D0D1A]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-semibold text-white truncate flex-1">{mat.name}</span>
                        <span className={`text-[8px] ${typeColor[mat.type]} capitalize`}>{mat.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded border ${syncBadge[mat.syncStatus].bg} ${syncBadge[mat.syncStatus].color}`}>
                          {syncBadge[mat.syncStatus].label}
                        </span>
                        <span className="text-[8px] text-gray-600">{mat.lastModified}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map(mat => (
                  <motion.div
                    key={mat.id}
                    onClick={() => setSelected(mat.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                      selected === mat.id
                        ? "border-pink-500/30 bg-pink-500/8"
                        : "border-white/8 hover:border-white/15 hover:bg-white/3"
                    }`}
                  >
                    {/* Swatch */}
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${mat.previewGradient} flex-shrink-0 border border-white/10`}
                      style={{ boxShadow: mat.emission ? `0 0 8px ${mat.emission}40` : undefined }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white truncate">{mat.name}</span>
                        {mat.starred && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-gray-500">
                        <span className={typeColor[mat.type]}>{mat.type}</span>
                        <span>·</span>
                        <span>{mat.blenderName}</span>
                        <span>·</span>
                        <span>{mat.usedBy.length} objects</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${syncBadge[mat.syncStatus].bg} ${syncBadge[mat.syncStatus].color}`}>
                        {syncBadge[mat.syncStatus].label}
                      </span>
                      <span className="text-[9px] text-gray-600">{mat.lastModified}</span>
                      <button
                        onClick={e => { e.stopPropagation(); handleSync(mat.id); }}
                        className="p-1 text-gray-600 hover:text-pink-400 transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${syncPulse === mat.id ? "animate-spin text-amber-400" : ""}`} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Material editor */}
        {selectedMat && (
          <div className="w-72 flex-shrink-0 border-l border-white/8 bg-[#0A0A14] flex flex-col overflow-y-auto">
            <div className="px-3 py-2 border-b border-white/8 flex items-center gap-2">
              <p className="text-[9px] text-gray-600 uppercase tracking-wider flex-1">Material Editor</p>
              <button
                onClick={() => handleSync(selectedMat.id)}
                className="flex items-center gap-1 text-[9px] text-pink-400 hover:text-pink-300 transition-colors"
              >
                <ArrowLeftRight className="w-3 h-3" /> Sync
              </button>
            </div>

            {/* Preview */}
            <div className={`h-32 bg-gradient-to-br ${selectedMat.previewGradient} relative flex items-center justify-center`}>
              <div
                className={`w-20 h-20 rounded-full bg-gradient-to-br ${selectedMat.previewGradient} border border-white/20`}
                style={{
                  boxShadow: selectedMat.emission
                    ? `0 0 30px ${selectedMat.emission}80, inset -6px -6px 12px rgba(0,0,0,0.6)`
                    : "inset -6px -6px 12px rgba(0,0,0,0.6)",
                  opacity: selectedMat.alpha,
                }}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${syncBadge[selectedMat.syncStatus].bg} ${syncBadge[selectedMat.syncStatus].color}`}>
                  {syncBadge[selectedMat.syncStatus].label}
                </span>
              </div>
            </div>

            <div className="p-3 space-y-3">
              {/* Name */}
              <div>
                <p className="text-xs font-bold text-white">{selectedMat.name}</p>
                <p className="text-[9px] text-gray-500 font-mono">{selectedMat.blenderName}</p>
              </div>

              {/* PBR Parameters */}
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">PBR Parameters</p>
                <div className="space-y-2">
                  {/* Base Color */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 w-20">Base Color</span>
                    <div className="w-5 h-5 rounded border border-white/20 flex-shrink-0" style={{ backgroundColor: selectedMat.baseColor }} />
                    <span className="text-[9px] text-gray-400 font-mono">{selectedMat.baseColor}</span>
                  </div>

                  {/* Metallic */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 w-20">Metallic</span>
                    <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-300 rounded-full" style={{ width: `${selectedMat.metallic * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono w-8 text-right">{selectedMat.metallic.toFixed(2)}</span>
                  </div>

                  {/* Roughness */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 w-20">Roughness</span>
                    <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${selectedMat.roughness * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono w-8 text-right">{selectedMat.roughness.toFixed(2)}</span>
                  </div>

                  {/* Alpha */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 w-20">Alpha</span>
                    <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${selectedMat.alpha * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono w-8 text-right">{selectedMat.alpha.toFixed(2)}</span>
                  </div>

                  {/* IOR */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 w-20">IOR</span>
                    <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${((selectedMat.ior - 1) / 2) * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono w-8 text-right">{selectedMat.ior.toFixed(2)}</span>
                  </div>

                  {/* Emission */}
                  {selectedMat.emission && (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500 w-20">Emission</span>
                      <div className="w-5 h-5 rounded border border-white/20 flex-shrink-0" style={{ backgroundColor: selectedMat.emission, boxShadow: `0 0 6px ${selectedMat.emission}` }} />
                      <span className="text-[9px] text-gray-400 font-mono">{selectedMat.emission}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Used by */}
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5">Used By ({selectedMat.usedBy.length})</p>
                <div className="space-y-1">
                  {selectedMat.usedBy.map(obj => (
                    <div key={obj} className="flex items-center gap-1.5 text-[9px]">
                      <Layers className="w-2.5 h-2.5 text-gray-600" />
                      <span className="text-gray-400">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {selectedMat.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-white/8 border border-white/10 rounded text-[8px] text-gray-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Export formats */}
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5">Export As</p>
                <div className="grid grid-cols-3 gap-1">
                  {["USDZ", "MDL", "GLTF", "FBX", "MTL", "JSON"].map(fmt => (
                    <button key={fmt} className="py-1 bg-white/5 border border-white/10 rounded text-[9px] text-gray-400 hover:bg-white/10 hover:text-gray-300 transition-colors">
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-white/8 space-y-1.5">
                <button
                  onClick={() => handleSync(selectedMat.id)}
                  className="w-full py-1.5 bg-pink-500/15 border border-pink-500/25 rounded-lg text-[10px] text-pink-300 hover:bg-pink-500/25 transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeftRight className="w-3 h-3" /> Sync to Blender
                </button>
                <button className="w-full py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-400 hover:bg-white/10 transition-colors flex items-center justify-center gap-1">
                  <Copy className="w-3 h-3" /> Duplicate
                </button>
                <button className="w-full py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-400 hover:bg-white/10 transition-colors flex items-center justify-center gap-1">
                  <Eye className="w-3 h-3" /> Preview in Viewport
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
