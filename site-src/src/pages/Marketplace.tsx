import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Download, Star, RefreshCw, CheckCircle, Shield,
  Zap, Box, Palette, GitBranch, Activity, Globe, Lock,
  Search, Filter, ChevronDown, ExternalLink, Package, AlertTriangle
} from "lucide-react";

const PLUGINS = [
  {
    id: "doge-bridge",
    name: "DOGE Spatial Bridge",
    author: "DOGE Team",
    version: "2.1.4",
    latestVersion: "2.1.4",
    category: "Sync",
    icon: "🔷",
    color: "#60a5fa",
    rating: 4.9,
    reviews: 1247,
    downloads: 48200,
    size: "2.4 MB",
    blenderMin: "4.0",
    description: "Real-time bidirectional sync between Blender and all spatial devices. CRDT conflict resolution, E2EE, WebSocket transport.",
    tags: ["sync", "visionOS", "Meta", "CRDT", "E2EE"],
    installed: true,
    featured: true,
    verified: true,
    changelog: "v2.1.4: Fixed subdivision modifier sync, improved VRAM reporting, added Quest 3 Pro support.",
  },
  {
    id: "spatial-materials",
    name: "Spatial PBR Materials",
    author: "SpatialLab",
    version: "1.8.2",
    latestVersion: "1.9.0",
    category: "Materials",
    icon: "🎨",
    color: "#a78bfa",
    rating: 4.7,
    reviews: 892,
    downloads: 31500,
    size: "18.7 MB",
    blenderMin: "3.6",
    description: "500+ physically-based materials optimized for visionOS RealityKit and Meta Spatial SDK. Auto-converts to USDZ/MDL.",
    tags: ["materials", "PBR", "USDZ", "MDL", "RealityKit"],
    installed: true,
    featured: true,
    verified: true,
    changelog: "v1.9.0: Added 120 new aurora/plasma materials, improved MDL export, visionOS 3 compatibility.",
    updateAvailable: true,
  },
  {
    id: "node-exporter",
    name: "Node Graph Exporter",
    author: "BlenderXR",
    version: "1.3.1",
    latestVersion: "1.3.1",
    category: "Export",
    icon: "⚡",
    color: "#34d399",
    rating: 4.5,
    reviews: 534,
    downloads: 19800,
    size: "1.1 MB",
    blenderMin: "4.1",
    description: "Export Blender shader node graphs to MaterialX, MDL, and USDZ with full procedural texture baking.",
    tags: ["nodes", "MaterialX", "export", "shader"],
    installed: false,
    featured: false,
    verified: true,
    changelog: "v1.3.1: MaterialX 1.39 support, improved ACES color space handling.",
  },
  {
    id: "render-bridge",
    name: "Cloud Render Bridge",
    author: "RenderCloud Inc",
    version: "3.0.1",
    latestVersion: "3.0.1",
    category: "Rendering",
    icon: "☁️",
    color: "#f59e0b",
    rating: 4.8,
    reviews: 2103,
    downloads: 67400,
    size: "3.2 MB",
    blenderMin: "3.6",
    description: "Submit Blender renders to distributed GPU farms. Supports Cycles, EEVEE, LuxCore. Auto-delivers to spatial devices.",
    tags: ["render", "cloud", "Cycles", "EEVEE", "GPU"],
    installed: true,
    featured: true,
    verified: true,
    changelog: "v3.0.1: Added Apple M4 node support, improved tile distribution algorithm.",
  },
  {
    id: "lidar-import",
    name: "LiDAR Scene Importer",
    author: "ScanLab",
    version: "0.9.4",
    latestVersion: "0.9.4",
    category: "Import",
    icon: "📡",
    color: "#f87171",
    rating: 4.3,
    reviews: 287,
    downloads: 8900,
    size: "5.6 MB",
    blenderMin: "4.0",
    description: "Import Apple Vision Pro LiDAR scans directly into Blender as mesh, point cloud, or Gaussian splat.",
    tags: ["LiDAR", "scan", "point cloud", "Gaussian splat"],
    installed: false,
    featured: false,
    verified: true,
    changelog: "v0.9.4: Improved mesh reconstruction, added Gaussian splat export.",
  },
  {
    id: "shareplay-collab",
    name: "SharePlay Collaboration",
    author: "DOGE Team",
    version: "1.1.0",
    latestVersion: "1.2.0",
    category: "Collaboration",
    icon: "👥",
    color: "#60a5fa",
    rating: 4.6,
    reviews: 445,
    downloads: 14200,
    size: "0.8 MB",
    blenderMin: "4.1",
    description: "Join FaceTime SharePlay sessions directly from Blender. See participant cursors, annotations, and live edits.",
    tags: ["SharePlay", "FaceTime", "collaboration", "cursor"],
    installed: false,
    featured: false,
    verified: true,
    changelog: "v1.2.0: Added participant avatar display, improved cursor sync latency.",
    updateAvailable: false,
  },
  {
    id: "animation-sync",
    name: "NLA Animation Sync",
    author: "AnimBridge",
    version: "2.0.3",
    latestVersion: "2.0.3",
    category: "Animation",
    icon: "🎬",
    color: "#ec4899",
    rating: 4.4,
    reviews: 678,
    downloads: 22100,
    size: "1.9 MB",
    blenderMin: "4.0",
    description: "Sync Blender NLA editor tracks to visionOS RealityKit animations and Meta Spatial SDK animation clips.",
    tags: ["animation", "NLA", "RealityKit", "keyframe"],
    installed: false,
    featured: false,
    verified: true,
    changelog: "v2.0.3: Fixed quaternion interpolation, added USDZ animation export.",
  },
  {
    id: "audio-spatial",
    name: "Spatial Audio Tools",
    author: "AudioXR",
    version: "1.5.2",
    latestVersion: "1.5.2",
    category: "Audio",
    icon: "🔊",
    color: "#34d399",
    rating: 4.7,
    reviews: 391,
    downloads: 12700,
    size: "4.1 MB",
    blenderMin: "3.6",
    description: "Place and preview 3D spatial audio sources in Blender. Export to Apple Spatial Audio and Meta Audio SDK formats.",
    tags: ["audio", "spatial", "HRTF", "ambisonics"],
    installed: false,
    featured: false,
    verified: false,
    changelog: "v1.5.2: Added Ambisonics B-format support, improved HRTF preview.",
  },
];

const CATEGORIES = ["All", "Sync", "Materials", "Export", "Rendering", "Import", "Collaboration", "Animation", "Audio"];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-600"}`} />
      ))}
    </div>
  );
}

function InstallButton({ plugin, onToggle }: { plugin: typeof PLUGINS[0]; onToggle: () => void }) {
  const [loading, setLoading] = useState(false);
  const handleClick = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onToggle(); }, 1200);
  };
  if (plugin.installed && plugin.updateAvailable) {
    return (
      <button onClick={handleClick} disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50">
        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        Update
      </button>
    );
  }
  if (plugin.installed) {
    return (
      <button onClick={handleClick} disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-colors group disabled:opacity-50">
        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle className="w-3.5 h-3.5 group-hover:hidden" /><span className="group-hover:hidden">Installed</span><span className="hidden group-hover:inline">Uninstall</span></>}
      </button>
    );
  }
  return (
    <button onClick={handleClick} disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50">
      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      {loading ? "Installing…" : "Install"}
    </button>
  );
}

export default function Marketplace() {
  const [plugins, setPlugins] = useState(PLUGINS);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [selected, setSelected] = useState<typeof PLUGINS[0] | null>(null);

  const toggleInstall = (id: string) => {
    setPlugins(ps => ps.map(p => p.id === id
      ? { ...p, installed: !p.installed, updateAvailable: p.updateAvailable ? false : p.updateAvailable }
      : p
    ));
  };

  const filtered = plugins
    .filter(p => category === "All" || p.category === category)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => sort === "featured" ? (b.featured ? 1 : 0) - (a.featured ? 1 : 0) : sort === "rating" ? b.rating - a.rating : b.downloads - a.downloads);

  const installedCount = plugins.filter(p => p.installed).length;
  const updateCount = plugins.filter(p => p.updateAvailable).length;

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-400" /> Plugin Marketplace
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Blender addons for spatial editing · {plugins.length} plugins · {installedCount} installed</p>
          </div>
          <div className="flex items-center gap-2">
            {updateCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                {updateCount} update{updateCount > 1 ? "s" : ""} available
              </div>
            )}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-xs hover:bg-blue-500/30 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Check Updates
            </button>
          </div>
        </div>

        {/* Search + sort */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plugins, tags…"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500/40" />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none">
            <option value="featured">Featured</option>
            <option value="rating">Top Rated</option>
            <option value="downloads">Most Downloaded</option>
          </select>
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                category === c ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-white/5 text-gray-400 border border-white/8 hover:text-gray-200"
              }`}>
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          {/* Plugin grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(plugin => (
              <motion.div key={plugin.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelected(plugin)}
                className={`bg-white/3 border rounded-xl p-4 cursor-pointer transition-all hover:bg-white/5 ${
                  selected?.id === plugin.id ? "border-blue-500/40 ring-1 ring-blue-500/20" : "border-white/8"
                }`}>
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: plugin.color + "20", border: `1px solid ${plugin.color}30` }}>
                      {plugin.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white">{plugin.name}</p>
                        {plugin.verified && <Shield className="w-3 h-3 text-blue-400" />}
                        {plugin.featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      </div>
                      <p className="text-[10px] text-gray-500">by {plugin.author} · v{plugin.version}</p>
                    </div>
                  </div>
                  {plugin.updateAvailable && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/20">
                      v{plugin.latestVersion}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{plugin.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {plugin.tags.slice(0, 3).map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 bg-white/5 text-gray-500 rounded">{t}</span>
                  ))}
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StarRating rating={plugin.rating} />
                    <span className="text-[10px] text-gray-500">{plugin.rating} ({plugin.reviews.toLocaleString()})</span>
                  </div>
                  <InstallButton plugin={plugin} onToggle={() => toggleInstall(plugin.id)} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {selected && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="w-72 flex-shrink-0 bg-white/3 border border-white/8 rounded-xl p-4 space-y-4 self-start sticky top-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: selected.color + "20", border: `1px solid ${selected.color}30` }}>
                    {selected.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selected.name}</p>
                    <p className="text-[10px] text-gray-500">by {selected.author}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Version",    value: `v${selected.version}` },
                    { label: "Size",       value: selected.size },
                    { label: "Downloads",  value: selected.downloads.toLocaleString() },
                    { label: "Blender",    value: `≥ ${selected.blenderMin}` },
                    { label: "Rating",     value: `${selected.rating}/5` },
                    { label: "Reviews",    value: selected.reviews.toLocaleString() },
                  ].map(s => (
                    <div key={s.label} className="bg-white/3 rounded-lg p-2">
                      <p className="text-[9px] text-gray-600">{s.label}</p>
                      <p className="text-xs text-gray-200 font-mono font-medium">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Description</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{selected.description}</p>
                </div>

                {/* Tags */}
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-400 rounded-full border border-white/8">{t}</span>
                    ))}
                  </div>
                </div>

                {/* Changelog */}
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Latest Changes</p>
                  <p className="text-xs text-gray-400 leading-relaxed font-mono bg-white/3 rounded-lg p-2.5">{selected.changelog}</p>
                </div>

                {/* Badges */}
                <div className="flex gap-2 flex-wrap">
                  {selected.verified && (
                    <div className="flex items-center gap-1 text-[10px] text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">
                      <Shield className="w-3 h-3" /> Verified
                    </div>
                  )}
                  {selected.featured && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                      <Star className="w-3 h-3 fill-amber-400" /> Featured
                    </div>
                  )}
                </div>

                {/* Install button */}
                <div className="w-full">
                  <InstallButton plugin={selected} onToggle={() => toggleInstall(selected.id)} />
                </div>

                <button onClick={() => setSelected(null)} className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
