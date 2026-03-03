/**
 * AssetLibrary — /assets
 * Spatial asset management — USDZ, GLB, FBX, textures, materials, scenes.
 * Upload, organize, preview, and push to spatial devices.
 */
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import {
  Package, Box, Palette, Sparkles, Volume2, Layers, Image,
  Upload, Download, Plus, Search, Grid3X3, List, Filter,
  Trash2, Copy, Share2, Eye, Tag, Clock, HardDrive,
  ChevronDown, Star, StarOff, ArrowUpRight, Check,
  Cpu, Globe, Cloud, Smartphone, Monitor, Headphones,
  FileJson, Boxes, Atom, Zap, Activity, Database
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface Asset {
  id: string;
  name: string;
  type: "model" | "texture" | "scene" | "audio" | "material" | "script";
  source: "ai_generated" | "imported" | "scanned" | "procedural";
  format: string;
  size: string;
  polyCount?: number;
  resolution?: string;
  createdAt: string;
  tags: string[];
  starred: boolean;
  platforms: string[];
  description: string;
}

/* ─── Demo Data ─────────────────────────────────────────────────────────────── */
const ASSETS: Asset[] = [
  { id: "a1", name: "Z-Pinch Plasma Column v3", type: "model", source: "ai_generated", format: "USDZ", size: "4.2 MB", polyCount: 18400, createdAt: "Today 10:02", tags: ["plasma", "physics", "volumetric"], starred: true, platforms: ["visionOS", "metaQuest", "blender"], description: "High-fidelity Z-pinch plasma column with aurora effect and toroidal compression rings" },
  { id: "a2", name: "Plasma Energy Field Texture", type: "texture", source: "ai_generated", format: "PNG", size: "16 MB", resolution: "4096×4096", createdAt: "Today 10:08", tags: ["texture", "pbr", "plasma", "emission"], starred: true, platforms: ["visionOS", "blender"], description: "PBR texture set with albedo, normal, roughness, AO, and emission maps" },
  { id: "a3", name: "City Hall 3D Scan", type: "model", source: "scanned", format: "PLY", size: "128 MB", polyCount: 2400000, createdAt: "Yesterday", tags: ["lidar", "scan", "architecture", "government"], starred: false, platforms: ["visionOS", "blender"], description: "Full LiDAR scan of City Hall exterior and interior — 2.4M polygon mesh" },
  { id: "a4", name: "IoT Sensor Array", type: "model", source: "imported", format: "GLB", size: "2.1 MB", polyCount: 8200, createdAt: "2 days ago", tags: ["iot", "sensor", "hardware"], starred: false, platforms: ["visionOS", "metaQuest", "blender"], description: "Modular IoT sensor array with temperature, pressure, and RF antenna components" },
  { id: "a5", name: "Physics Lab Environment", type: "scene", source: "ai_generated", format: "USDZ", size: "52 MB", createdAt: "Today 09:45", tags: ["scene", "lab", "environment", "physics"], starred: true, platforms: ["visionOS", "metaQuest"], description: "Complete physics laboratory scene with equipment, lighting, and spatial audio zones" },
  { id: "a6", name: "Plasma Discharge Audio", type: "audio", source: "imported", format: "WAV", size: "8 MB", createdAt: "Today 09:30", tags: ["audio", "plasma", "discharge", "spatial"], starred: false, platforms: ["visionOS", "metaQuest"], description: "Spatial audio recording of plasma discharge for audio-to-scene generation" },
  { id: "a7", name: "Metallic Plasma Material", type: "material", source: "procedural", format: "MDL", size: "0.8 MB", createdAt: "3 days ago", tags: ["material", "metallic", "pbr", "plasma"], starred: false, platforms: ["visionOS", "blender"], description: "Procedural MDL material with plasma energy emission and metallic base" },
  { id: "a8", name: "Sensor Placement Script", type: "script", source: "procedural", format: "Swift", size: "12 KB", createdAt: "1 week ago", tags: ["script", "iot", "placement", "automation"], starred: false, platforms: ["visionOS"], description: "RealityKit script for automated IoT sensor placement and spatial anchoring" },
];

const TYPE_ICONS: Record<string, any> = { model: Box, texture: Palette, scene: Sparkles, audio: Volume2, material: Layers, script: FileJson };
const TYPE_COLORS: Record<string, string> = {
  model: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  texture: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  scene: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  audio: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  material: "text-green-400 bg-green-500/10 border-green-500/20",
  script: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
};
const SOURCE_COLORS: Record<string, string> = {
  ai_generated: "text-purple-400 bg-purple-500/10",
  imported: "text-blue-400 bg-blue-500/10",
  scanned: "text-green-400 bg-green-500/10",
  procedural: "text-amber-400 bg-amber-500/10",
};
const PLATFORM_ICONS: Record<string, string> = {
  visionOS: "👓", metaQuest: "🥽", blender: "🔷", web: "🌐", iPadOS: "📱", tvOS: "📺"
};

/* ─── Asset Card ─────────────────────────────────────────────────────────────── */
function AssetCard({ asset, view, onToggleStar }: { asset: Asset; view: "grid" | "list"; onToggleStar: (id: string) => void }) {
  const Icon = TYPE_ICONS[asset.type] || Box;
  const typeColor = TYPE_COLORS[asset.type] || TYPE_COLORS.model;
  const sourceColor = SOURCE_COLORS[asset.source] || SOURCE_COLORS.imported;

  if (view === "list") {
    return (
      <div className="flex items-center gap-4 p-3 bg-white/3 hover:bg-white/6 border border-white/8 rounded-xl transition-colors group">
        <div className={`p-2 rounded-lg border flex-shrink-0 ${typeColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-200 truncate">{asset.name}</p>
            {asset.starred && <Star className="w-3 h-3 text-amber-400 flex-shrink-0 fill-amber-400" />}
          </div>
          <p className="text-xs text-gray-500 truncate">{asset.description}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {asset.tags.slice(0, 3).map(t => <span key={t} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-gray-500">{t}</span>)}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-500">
          <span className="font-mono">{asset.format}</span>
          <span>{asset.size}</span>
          {asset.polyCount && <span>{(asset.polyCount / 1000).toFixed(0)}K poly</span>}
          {asset.resolution && <span>{asset.resolution}</span>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => toast.success(`Importing ${asset.name}...`)} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded text-blue-400"><Plus className="w-3.5 h-3.5" /></button>
          <button onClick={() => toast.success(`Downloading ${asset.name}...`)} className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-gray-400"><Download className="w-3.5 h-3.5" /></button>
          <button onClick={() => onToggleStar(asset.id)} className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-gray-400">
            {asset.starred ? <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> : <StarOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all group">
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center relative">
        <Icon className="w-10 h-10 text-white/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${sourceColor}`}>{asset.source.replace("_", " ")}</span>
          <button onClick={() => onToggleStar(asset.id)} className="p-1 bg-black/40 rounded-full">
            {asset.starred ? <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> : <StarOff className="w-3 h-3 text-gray-500" />}
          </button>
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${typeColor}`}>{asset.format}</span>
          <div className="flex gap-0.5">
            {asset.platforms.map(p => <span key={p} className="text-xs">{PLATFORM_ICONS[p]}</span>)}
          </div>
        </div>
        {/* Hover actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <button onClick={() => toast.success(`Previewing ${asset.name}...`)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"><Eye className="w-4 h-4" /></button>
          <button onClick={() => toast.success(`Importing ${asset.name} to scene...`)} className="p-2 bg-blue-500/80 hover:bg-blue-500 rounded-full text-white"><Plus className="w-4 h-4" /></button>
          <button onClick={() => toast.success(`Downloading ${asset.name}...`)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"><Download className="w-4 h-4" /></button>
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-200 truncate mb-0.5">{asset.name}</p>
        <p className="text-[10px] text-gray-500 truncate mb-2">{asset.description}</p>
        <div className="flex items-center justify-between text-[10px] text-gray-600">
          <span>{asset.size}</span>
          {asset.polyCount && <span>{(asset.polyCount / 1000).toFixed(0)}K poly</span>}
          {asset.resolution && <span>{asset.resolution}</span>}
          <span>{asset.createdAt}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {asset.tags.slice(0, 3).map(t => <span key={t} className="px-1.5 py-0.5 bg-white/5 border border-white/8 rounded text-[9px] text-gray-500">{t}</span>)}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function AssetLibrary() {
  const [assets, setAssets] = useState<Asset[]>(ASSETS);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");

  const toggleStar = (id: string) => setAssets(prev => prev.map(a => a.id === id ? { ...a, starred: !a.starred } : a));

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.includes(search.toLowerCase()));
    const matchType = filterType === "all" || a.type === filterType;
    const matchSource = filterSource === "all" || a.source === filterSource;
    return matchSearch && matchType && matchSource;
  });

  const totalSize = assets.reduce((acc, a) => acc + parseFloat(a.size), 0);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0A0A14] text-white">
        {/* Header */}
        <div className="border-b border-white/10 bg-[#0F0F1E] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Asset Library</h1>
                <p className="text-sm text-gray-400">USDZ · GLB · FBX · Textures · Materials · Scenes · Audio</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {[
                { label: "Total Assets", value: assets.length, color: "text-blue-400" },
                { label: "Starred", value: assets.filter(a => a.starred).length, color: "text-amber-400" },
                { label: "AI Generated", value: assets.filter(a => a.source === "ai_generated").length, color: "text-purple-400" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-gray-500">{s.label}</p>
                </div>
              ))}
              <div className="w-px h-8 bg-white/10" />
              <button onClick={() => toast.success("Opening upload dialog...")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition-colors">
                <Upload className="w-4 h-4" /> Upload Asset
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none">
              <option value="all">All Types</option>
              {["model", "texture", "scene", "audio", "material", "script"].map(t => <option key={t} value={t} className="bg-gray-900 capitalize">{t}</option>)}
            </select>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none">
              <option value="all">All Sources</option>
              {["ai_generated", "imported", "scanned", "procedural"].map(s => <option key={s} value={s} className="bg-gray-900">{s.replace("_", " ")}</option>)}
            </select>
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={() => setView("grid")} className={`p-2 rounded-lg border transition-colors ${view === "grid" ? "bg-blue-500/20 border-blue-500/30 text-blue-400" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}><Grid3X3 className="w-4 h-4" /></button>
              <button onClick={() => setView("list")} className={`p-2 rounded-lg border transition-colors ${view === "list" ? "bg-blue-500/20 border-blue-500/30 text-blue-400" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}><List className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No assets match your filters</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(asset => <AssetCard key={asset.id} asset={asset} view="grid" onToggleStar={toggleStar} />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(asset => <AssetCard key={asset.id} asset={asset} view="list" onToggleStar={toggleStar} />)}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
