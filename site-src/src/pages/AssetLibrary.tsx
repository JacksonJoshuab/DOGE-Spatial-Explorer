import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package, Search, Filter, Grid, List, Upload, Download,
  Star, StarOff, Eye, Plus, Trash2, Tag, Clock, HardDrive,
  Box, Palette, Volume2, Layers, Image, FileJson, Zap,
  ChevronDown, MoreHorizontal, Check, Globe, Cpu, Sparkles
} from "lucide-react";

type AssetType = "all" | "3d" | "texture" | "material" | "scene" | "audio" | "script";
type AssetSource = "all" | "local" | "ai" | "cloud" | "imported";

interface Asset {
  id: string;
  name: string;
  type: "3d" | "texture" | "material" | "scene" | "audio" | "script";
  format: string;
  size: string;
  polyCount?: number;
  resolution?: string;
  source: "local" | "ai" | "cloud" | "imported";
  platforms: string[];
  starred: boolean;
  tags: string[];
  createdAt: string;
  preview?: string;
}

const ASSETS: Asset[] = [
  { id: "a1", name: "Z-Pinch Plasma Column", type: "3d", format: "USDZ", size: "24.8 MB", polyCount: 18400, source: "ai", platforms: ["👓", "🥽", "🔷"], starred: true, tags: ["plasma", "physics", "volumetric"], createdAt: "Today" },
  { id: "a2", name: "Plasma Energy PBR Set", type: "texture", format: "PNG", size: "48.2 MB", resolution: "4096×4096", source: "ai", platforms: ["👓", "🥽", "🔷"], starred: true, tags: ["pbr", "energy", "emission"], createdAt: "Today" },
  { id: "a3", name: "IoT Sensor Array", type: "3d", format: "GLB", size: "8.4 MB", polyCount: 6200, source: "local", platforms: ["👓", "🥽", "📱", "🔷"], starred: false, tags: ["sensor", "iot", "hardware"], createdAt: "Yesterday" },
  { id: "a4", name: "Physics Laboratory Scene", type: "scene", format: "USDZ", size: "156 MB", source: "ai", platforms: ["👓", "🥽"], starred: true, tags: ["scene", "lab", "physics"], createdAt: "2 days ago" },
  { id: "a5", name: "Plasma Discharge Audio", type: "audio", format: "WAV", size: "12.1 MB", source: "ai", platforms: ["👓", "🥽", "📱", "📺"], starred: false, tags: ["audio", "plasma", "spatial"], createdAt: "Today" },
  { id: "a6", name: "Energy Field Material", type: "material", format: "MDL", size: "2.8 MB", source: "cloud", platforms: ["👓", "🔷"], starred: false, tags: ["material", "energy", "pbr"], createdAt: "3 days ago" },
  { id: "a7", name: "Bounding Box Wireframe", type: "3d", format: "GLB", size: "0.4 MB", polyCount: 240, source: "local", platforms: ["👓", "🥽", "🔷"], starred: false, tags: ["bounds", "debug", "wireframe"], createdAt: "1 week ago" },
  { id: "a8", name: "Coordinate Axes Gizmo", type: "3d", format: "USDZ", size: "0.8 MB", polyCount: 480, source: "imported", platforms: ["👓", "🥽", "📱", "🔷"], starred: true, tags: ["gizmo", "axes", "debug"], createdAt: "1 week ago" },
  { id: "a9", name: "Spatial Audio Environment", type: "audio", format: "WAV", size: "34.5 MB", source: "ai", platforms: ["👓", "🥽", "📺"], starred: false, tags: ["audio", "spatial", "environment"], createdAt: "2 days ago" },
  { id: "a10", name: "Scene Sync Script", type: "script", format: "Swift", size: "18 KB", source: "local", platforms: ["👓", "📱", "📺"], starred: false, tags: ["script", "sync", "crdt"], createdAt: "5 days ago" },
  { id: "a11", name: "Gaussian Splat Capture", type: "3d", format: "SPLAT", size: "89.3 MB", source: "imported", platforms: ["👓", "🔷"], starred: true, tags: ["gaussian", "splat", "photogrammetry"], createdAt: "3 days ago" },
  { id: "a12", name: "RF Antenna Array Model", type: "3d", format: "FBX", size: "5.2 MB", polyCount: 3800, source: "ai", platforms: ["👓", "🥽", "🔷"], starred: false, tags: ["rf", "antenna", "hardware"], createdAt: "Today" },
];

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  "3d": { icon: Box, color: "text-blue-400", bg: "bg-blue-500/10" },
  texture: { icon: Image, color: "text-purple-400", bg: "bg-purple-500/10" },
  material: { icon: Palette, color: "text-pink-400", bg: "bg-pink-500/10" },
  scene: { icon: Layers, color: "text-green-400", bg: "bg-green-500/10" },
  audio: { icon: Volume2, color: "text-amber-400", bg: "bg-amber-500/10" },
  script: { icon: FileJson, color: "text-cyan-400", bg: "bg-cyan-500/10" },
};

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  local: { label: "Local", color: "text-gray-400 bg-gray-500/10 border-gray-500/20" },
  ai: { label: "AI Gen", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  cloud: { label: "Cloud", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  imported: { label: "Imported", color: "text-green-400 bg-green-500/10 border-green-500/20" },
};

function AssetCard({ asset, onToggleStar }: { asset: Asset; onToggleStar: (id: string) => void }) {
  const typeConf = TYPE_CONFIG[asset.type];
  const sourceConf = SOURCE_BADGES[asset.source];
  const Icon = typeConf.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group bg-[#0F0F1E] border border-white/8 rounded-xl overflow-hidden hover:border-white/16 transition-all"
    >
      {/* Preview area */}
      <div className={`aspect-video ${typeConf.bg} flex items-center justify-center relative`}>
        <Icon className={`w-10 h-10 ${typeConf.color} opacity-30`} />
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
          <button className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"><Eye className="w-3.5 h-3.5" /></button>
          <button className="p-2 bg-blue-500/60 hover:bg-blue-500/80 rounded-full text-white transition-colors"><Plus className="w-3.5 h-3.5" /></button>
          <button className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"><Download className="w-3.5 h-3.5" /></button>
        </div>
        <button
          onClick={() => onToggleStar(asset.id)}
          className="absolute top-2 right-2 p-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
        >
          {asset.starred ? <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> : <StarOff className="w-3 h-3 text-gray-500" />}
        </button>
        <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${sourceConf.color}`}>{sourceConf.label}</span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-medium text-gray-200 truncate mb-1">{asset.name}</p>
        <div className="flex items-center justify-between text-[9px] text-gray-500 mb-2">
          <span className="font-mono">{asset.format} · {asset.size}</span>
          <span>{asset.createdAt}</span>
        </div>
        {asset.polyCount && <p className="text-[9px] text-gray-600 mb-1">{(asset.polyCount / 1000).toFixed(1)}K polygons</p>}
        {asset.resolution && <p className="text-[9px] text-gray-600 mb-1">{asset.resolution}</p>}
        <div className="flex items-center justify-between">
          <div className="flex gap-0.5">{asset.platforms.map(p => <span key={p} className="text-sm">{p}</span>)}</div>
          <div className="flex gap-1">
            {asset.tags.slice(0, 2).map(t => (
              <span key={t} className="px-1.5 py-0.5 bg-white/5 border border-white/8 rounded text-[8px] text-gray-600">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AssetLibrary() {
  const [assets, setAssets] = useState<Asset[]>(ASSETS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetType>("all");
  const [sourceFilter, setSourceFilter] = useState<AssetSource>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showStarred, setShowStarred] = useState(false);

  const toggleStar = (id: string) => setAssets(prev => prev.map(a => a.id === id ? { ...a, starred: !a.starred } : a));

  const filtered = assets.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.tags.some(t => t.includes(search.toLowerCase()))) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
    if (showStarred && !a.starred) return false;
    return true;
  });

  const totalSize = assets.reduce((acc, a) => {
    const n = parseFloat(a.size);
    const unit = a.size.includes("MB") ? 1 : a.size.includes("KB") ? 0.001 : 1000;
    return acc + n * unit;
  }, 0);

  return (
    <div className="h-full bg-[#08080F] text-white overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/8 bg-[#0A0A16] px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/20 rounded-xl border border-pink-500/30">
              <Package className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Asset Library</h1>
              <p className="text-xs text-gray-500">{assets.length} assets · {totalSize.toFixed(0)} MB total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStarred(!showStarred)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${showStarred ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"}`}
            >
              <Star className="w-3 h-3" /> Starred
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/80 hover:bg-blue-600 rounded-xl text-xs font-medium text-white transition-colors">
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search assets…"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "3d", "texture", "material", "scene", "audio", "script"] as AssetType[]).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-colors ${
                  typeFilter === t ? "bg-blue-500/20 text-blue-300 border border-blue-500/20" : "text-gray-500 hover:text-gray-300 bg-white/3 border border-white/8"
                }`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}><Grid className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}><List className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Asset grid */}
      <div className="p-6">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(asset => <AssetCard key={asset.id} asset={asset} onToggleStar={toggleStar} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(asset => {
              const typeConf = TYPE_CONFIG[asset.type];
              const Icon = typeConf.icon;
              return (
                <div key={asset.id} className="flex items-center gap-3 p-3 bg-[#0F0F1E] border border-white/8 rounded-xl hover:border-white/14 transition-colors">
                  <div className={`p-2 rounded-lg ${typeConf.bg} flex-shrink-0`}><Icon className={`w-4 h-4 ${typeConf.color}`} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{asset.name}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      <span className="font-mono">{asset.format} · {asset.size}</span>
                      {asset.polyCount && <span>{(asset.polyCount/1000).toFixed(1)}K poly</span>}
                      <span>{asset.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {asset.platforms.map(p => <span key={p}>{p}</span>)}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleStar(asset.id)} className="p-1.5 hover:bg-white/8 rounded-lg transition-colors">
                      {asset.starred ? <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> : <StarOff className="w-3.5 h-3.5 text-gray-600" />}
                    </button>
                    <button className="p-1.5 hover:bg-white/8 rounded-lg transition-colors text-gray-500 hover:text-white"><Download className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 hover:bg-white/8 rounded-lg transition-colors text-gray-500 hover:text-white"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No assets match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
