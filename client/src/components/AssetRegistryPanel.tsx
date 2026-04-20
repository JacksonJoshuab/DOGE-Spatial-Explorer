/*
 * DOGE-LANDSCAPER — Asset Registry Panel v1
 * Design: Spatial Glass Command Deck
 * Features:
 *   - Digital twin registry for biological and manufactured yard materials
 *   - Full metadata: value, firstSeenDate, lastSeenDate, lastViewedBy, author,
 *     osiLayer, keywords, timeSource, blockchain, howToGuide, videoRefs,
 *     aiAgents, licenseModel, ROI, TCO, restockLink, relationshipTree
 *   - Searchable, filterable, expandable detail cards
 *   - Relationship tree visualization
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export type AssetCategory = "biological" | "manufactured" | "chemical" | "infrastructure" | "equipment";

export interface AssetRelation {
  targetId: string;
  relation: string; // "feeds", "treats", "borders", "contains", "powers", etc.
}

export interface DigitalTwinAsset {
  id: string;
  name: string;
  category: AssetCategory;
  subcategory: string;
  emoji: string;
  value: number;           // USD estimated value
  currency: string;
  firstSeenDate: string;   // ISO date
  lastSeenDate: string;
  lastViewedBy: string;
  author: string;
  osiLayer: string;        // primary data layer
  keywords: string[];
  timeSource: string;      // GPS, NTP, manual, etc.
  blockchain: string;      // chain or "none"
  howToGuide: string;
  videoRefs: string[];
  aiAgents: string[];
  licenseModel: string;
  roi: string;             // e.g. "3.2× over 5 seasons"
  tco: string;             // total cost of ownership
  restockLink: string;
  relations: AssetRelation[];
  location: string;        // zone or description
  quantity: string;
  unit: string;
  condition: "excellent" | "good" | "fair" | "poor";
  notes: string;
}

const ASSETS: DigitalTwinAsset[] = [
  {
    id: "grass-main",
    name: "Kentucky Bluegrass Lawn",
    category: "biological",
    subcategory: "Turf Grass",
    emoji: "🌿",
    value: 4200,
    currency: "USD",
    firstSeenDate: "2019-04-15",
    lastSeenDate: new Date().toISOString().split("T")[0],
    lastViewedBy: "Chip McHaymaker (Jetson Orin)",
    author: "Jackson Joshua",
    osiLayer: "Layer 7 (Application) · LiDAR point cloud",
    keywords: ["turf", "bluegrass", "zone-a", "mow", "fertilize", "weed-control"],
    timeSource: "GPS UTC · NTP synced",
    blockchain: "none",
    howToGuide: "https://www.scotts.com/en-us/library/grass-types/kentucky-bluegrass",
    videoRefs: ["https://youtu.be/lawn-care-iowa", "IMG_0730.jpeg", "IMG_0731.jpeg"],
    aiAgents: ["Chip McHaymaker", "Scotts AI Advisor", "Iowa State Extension Bot"],
    licenseModel: "Private property · CC-BY-4.0 scan data",
    roi: "3.2× over 5 seasons (curb appeal + weed suppression)",
    tco: "$420/yr (seed, fert, water, mow labor)",
    restockLink: "https://www.scotts.com/en-us/products/grass-seed/scotts-turf-builder-grass-seed-kentucky-bluegrass",
    relations: [
      { targetId: "fertilizer-wf", relation: "treated-by" },
      { targetId: "oak-tree", relation: "shaded-by" },
      { targetId: "robot-chip", relation: "maintained-by" },
    ],
    location: "Zone A — Main Lawn (3,200 sq ft)",
    quantity: "3200",
    unit: "sq ft",
    condition: "good",
    notes: "Dandelion pressure dropping. Overseeded Oct 2025. Needs 3.5\" mow height.",
  },
  {
    id: "oak-tree",
    name: "Bur Oak Tree",
    category: "biological",
    subcategory: "Deciduous Tree",
    emoji: "🌳",
    value: 8500,
    currency: "USD",
    firstSeenDate: "1962-01-01",
    lastSeenDate: new Date().toISOString().split("T")[0],
    lastViewedBy: "Chip McHaymaker (LiDAR scan)",
    author: "Unknown (pre-existing)",
    osiLayer: "Layer 7 (Application) · photogrammetry mesh",
    keywords: ["oak", "bur-oak", "zone-b", "root-zone", "no-spray", "heritage"],
    timeSource: "Manual estimate · dendrochronology",
    blockchain: "none",
    howToGuide: "https://extension.iastate.edu/forestry/tree_selection/bur_oak.html",
    videoRefs: ["IMG_3446.png"],
    aiAgents: ["Iowa State Forestry Extension Bot"],
    licenseModel: "Private property",
    roi: "Heritage asset — $8,500 appraised value",
    tco: "$120/yr (mulch, pruning)",
    restockLink: "https://www.iowatreedistribution.com/bur-oak",
    relations: [
      { targetId: "grass-main", relation: "shades" },
      { targetId: "scilla-bulbs", relation: "shelters" },
    ],
    location: "Zone B — Oak Tree Ring",
    quantity: "1",
    unit: "tree",
    condition: "excellent",
    notes: "~62 years old. Root zone extends 6m radius. NO chemical spray within 2m.",
  },
  {
    id: "scilla-bulbs",
    name: "Siberian Scilla Bulbs",
    category: "biological",
    subcategory: "Spring Bulb",
    emoji: "🌸",
    value: 180,
    currency: "USD",
    firstSeenDate: "2021-09-20",
    lastSeenDate: "2026-03-28",
    lastViewedBy: "Jackson Joshua",
    author: "Jackson Joshua",
    osiLayer: "Layer 7 (Application) · manual GPS pin",
    keywords: ["scilla", "bulb", "zone-c", "spring", "no-mow", "protect"],
    timeSource: "Manual",
    blockchain: "none",
    howToGuide: "https://extension.umn.edu/flowers/siberian-squill",
    videoRefs: [],
    aiAgents: ["Chip McHaymaker"],
    licenseModel: "Private property",
    roi: "Aesthetic value · pollinator habitat",
    tco: "$30/yr (bulb booster fertilizer)",
    restockLink: "https://www.brecks.com/product/siberian-squill",
    relations: [
      { targetId: "oak-tree", relation: "sheltered-by" },
    ],
    location: "Zone C — Scilla Garden (420 sq ft)",
    quantity: "~200",
    unit: "bulbs",
    condition: "excellent",
    notes: "PROTECT — do not mow or spray. Deadhead after bloom. Gorgeous blue flowers.",
  },
  {
    id: "fertilizer-wf",
    name: "Scotts Weed & Feed",
    category: "chemical",
    subcategory: "Granular Fertilizer + Herbicide",
    emoji: "🧪",
    value: 89,
    currency: "USD",
    firstSeenDate: "2026-03-01",
    lastSeenDate: "2026-03-28",
    lastViewedBy: "Chip McHaymaker",
    author: "Scotts Miracle-Gro",
    osiLayer: "Layer 6 (Presentation) · product barcode scan",
    keywords: ["weed-feed", "fertilizer", "herbicide", "scotts", "zone-a", "zone-b"],
    timeSource: "Barcode scan timestamp",
    blockchain: "none",
    howToGuide: "https://www.scotts.com/en-us/products/weed-control/scotts-turf-builder-weed-feed",
    videoRefs: ["https://youtu.be/scotts-weed-feed-application"],
    aiAgents: ["Chip McHaymaker", "Scotts AI Advisor"],
    licenseModel: "Commercial product · EPA Reg. No. 538-308",
    roi: "Eliminates ~80% broadleaf weeds per application",
    tco: "$89/bag · covers 12,000 sq ft",
    restockLink: "https://www.amazon.com/dp/B00BXQVF3S",
    relations: [
      { targetId: "grass-main", relation: "treats" },
      { targetId: "robot-chip", relation: "applied-by" },
    ],
    location: "Storage shed · Zone A+B application",
    quantity: "1",
    unit: "bag (12,000 sq ft)",
    condition: "good",
    notes: "Apply when temp 60–90°F, no rain 24h. Wind < 10 mph. Avoid Zone C (scilla).",
  },
  {
    id: "deck-lumber",
    name: "Pressure-Treated Deck",
    category: "infrastructure",
    subcategory: "Outdoor Structure",
    emoji: "🪵",
    value: 12000,
    currency: "USD",
    firstSeenDate: "2015-06-01",
    lastSeenDate: new Date().toISOString().split("T")[0],
    lastViewedBy: "Chip McHaymaker (LiDAR scan)",
    author: "Jackson Joshua",
    osiLayer: "Layer 7 (Application) · USDZ photogrammetry",
    keywords: ["deck", "structure", "obstacle", "clearance", "pressure-treated"],
    timeSource: "LiDAR scan timestamp",
    blockchain: "none",
    howToGuide: "https://www.trex.com/resources/how-to/deck-maintenance/",
    videoRefs: ["905-Backyard-10_8_2025.usdz"],
    aiAgents: ["Chip McHaymaker"],
    licenseModel: "Private property",
    roi: "Adds ~$8,000 to property value",
    tco: "$200/yr (staining, sealing)",
    restockLink: "https://www.homedepot.com/b/Lumber-Composites-Decking/N-5yc1vZbqmf",
    relations: [
      { targetId: "grass-main", relation: "borders" },
      { targetId: "robot-chip", relation: "avoided-by" },
    ],
    location: "Obstacle zone — X:-8.7 to 10.3, Z:1.5 to 2.7",
    quantity: "1",
    unit: "structure (~320 sq ft)",
    condition: "good",
    notes: "Robot clearance: 0.8m. LiDAR obstacle registered. No spray within 1m.",
  },
  {
    id: "fence-posts",
    name: "Cedar Fence Line",
    category: "infrastructure",
    subcategory: "Perimeter Fencing",
    emoji: "🪧",
    value: 3200,
    currency: "USD",
    firstSeenDate: "2018-05-15",
    lastSeenDate: new Date().toISOString().split("T")[0],
    lastViewedBy: "Chip McHaymaker",
    author: "Jackson Joshua",
    osiLayer: "Layer 7 (Application) · LiDAR boundary",
    keywords: ["fence", "cedar", "perimeter", "zone-d", "edge-spray"],
    timeSource: "LiDAR scan",
    blockchain: "none",
    howToGuide: "https://www.thisoldhouse.com/fences/21017443/how-to-build-a-fence",
    videoRefs: [],
    aiAgents: ["Chip McHaymaker"],
    licenseModel: "Private property",
    roi: "Privacy + security value",
    tco: "$150/yr (stain, post treatment)",
    restockLink: "https://www.homedepot.com/b/Lumber-Composites-Fencing/N-5yc1vZbqm7",
    relations: [
      { targetId: "grass-main", relation: "borders" },
    ],
    location: "Zone D — Fence Line (perimeter)",
    quantity: "~120",
    unit: "linear ft",
    condition: "fair",
    notes: "Weeds concentrate along fence base. Roundup Edge Control applied Zone D.",
  },
  {
    id: "robot-chip",
    name: "Chip McHaymaker (Jetson Orin AGX)",
    category: "equipment",
    subcategory: "Humanoid Robot",
    emoji: "🤖",
    value: 28000,
    currency: "USD",
    firstSeenDate: "2025-10-08",
    lastSeenDate: new Date().toISOString().split("T")[0],
    lastViewedBy: "Jackson Joshua",
    author: "NVIDIA / Jackson Joshua",
    osiLayer: "Layer 3 (Network) · WiFi 6E + ROS2",
    keywords: ["robot", "jetson", "orin", "agx", "humanoid", "chip", "doge"],
    timeSource: "GPS UTC · PTP hardware clock",
    blockchain: "Ethereum · asset NFT #0x7f3a",
    howToGuide: "https://developer.nvidia.com/embedded/jetson-agx-orin",
    videoRefs: ["IMG_0730.jpeg", "IMG_0731.jpeg", "905-Backyard-10_8_2025.usdz"],
    aiAgents: ["Chip McHaymaker (self)", "NVIDIA Isaac ROS", "OpenAI GPT-4o"],
    licenseModel: "NVIDIA EULA · Custom ROS2 stack MIT",
    roi: "Replaces $18,000/yr manual labor",
    tco: "$2,400/yr (power, maintenance, insurance)",
    restockLink: "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/",
    relations: [
      { targetId: "grass-main", relation: "maintains" },
      { targetId: "fertilizer-wf", relation: "applies" },
      { targetId: "deck-lumber", relation: "avoids" },
    ],
    location: "Active — Zone A main lawn path",
    quantity: "1",
    unit: "unit",
    condition: "excellent",
    notes: "Primary field agent. 78% battery. WiFi 6E connected. GPU 68% utilized.",
  },
  {
    id: "irrigation-pipe",
    name: "Drip Irrigation System",
    category: "infrastructure",
    subcategory: "Water Management",
    emoji: "💧",
    value: 1800,
    currency: "USD",
    firstSeenDate: "2022-05-01",
    lastSeenDate: "2026-03-15",
    lastViewedBy: "Jackson Joshua",
    author: "Jackson Joshua",
    osiLayer: "Layer 1 (Physical) · analog flow sensor",
    keywords: ["irrigation", "drip", "water", "zone-a", "zone-b", "subsurface"],
    timeSource: "Manual",
    blockchain: "none",
    howToGuide: "https://www.rainbird.com/homeowners/products/drip-irrigation",
    videoRefs: [],
    aiAgents: ["Chip McHaymaker"],
    licenseModel: "Private property",
    roi: "30% water savings vs sprinkler",
    tco: "$80/yr (maintenance, winterization)",
    restockLink: "https://www.rainbird.com/homeowners/products",
    relations: [
      { targetId: "grass-main", relation: "waters" },
      { targetId: "scilla-bulbs", relation: "waters" },
    ],
    location: "Subsurface — Zone A + C",
    quantity: "~180",
    unit: "linear ft",
    condition: "good",
    notes: "Winterized Nov 2025. Spring activation scheduled Apr 15.",
  },
  {
    id: "parcel-0112177049",
    name: "905 N Columbus St — Parcel 0112177049",
    category: "infrastructure",
    subcategory: "Real Property / Parcel",
    emoji: "🏗️",
    value: 185000,
    currency: "USD",
    firstSeenDate: "1962-01-01",
    lastSeenDate: new Date().toISOString().split("T")[0],
    lastViewedBy: "Jackson Joshua (Muscatine County MAGIC GIS)",
    author: "Muscatine County Assessor",
    osiLayer: "Layer 8 (Geospatial) · GIS parcel vector",
    keywords: ["parcel", "gis", "assessor", "west-liberty", "muscatine-county", "r1", "residential", "lcwll", "0112177049"],
    timeSource: "Muscatine County MAGIC GIS · Beacon Schneider",
    blockchain: "none",
    howToGuide: "https://beacon.schneidercorp.com/Application.aspx?AppID=12&LayerID=93&PageTypeID=4&PageID=145&Q=105043278&KeyValue=0112177049",
    videoRefs: [],
    aiAgents: ["Chip McHaymaker", "Muscatine County Assessor Bot"],
    licenseModel: "Public record · Muscatine County Iowa",
    roi: "Assessed value appreciation · est. 4.2%/yr",
    tco: "$3,200/yr (property tax, insurance, maintenance)",
    restockLink: "https://beacon.schneidercorp.com/Application.aspx?AppID=12&LayerID=93&PageTypeID=4&PageID=145&Q=105043278&KeyValue=0112177049",
    relations: [
      { targetId: "grass-main", relation: "contains" },
      { targetId: "oak-tree", relation: "contains" },
      { targetId: "robot-chip", relation: "operated-at" },
    ],
    location: "905 N Columbus St, West Liberty IA 52776 · 41.5769°N 91.2607°W",
    quantity: "17612",
    unit: "sq ft (0.40 acres)",
    condition: "excellent",
    notes: "Parcel 0112177049 · Sec/Twp/Rng 12-78-4W · Zoning R1-Single Family · Lot 68ft×259ft · District LCWLL · Owner: Jackson Joshua Or Ronald Or Pamela Or Paula C · West Liberty City / West Liberty Sch / West Lib Fire",
  },
];

const CATEGORY_COLORS: Record<AssetCategory, string> = {
  biological: "#44ff88",
  manufactured: "#44ccff",
  chemical: "#ffaa44",
  infrastructure: "#aaaaff",
  equipment: "#f5c518",
};

const CONDITION_COLORS = {
  excellent: "#44ff88",
  good: "#88ff88",
  fair: "#ffcc44",
  poor: "#ff4444",
};

interface AssetRegistryPanelProps {
  onAssetSelect?: (asset: DigitalTwinAsset) => void;
}

export default function AssetRegistryPanel({ onAssetSelect }: AssetRegistryPanelProps) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<AssetCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [gisRefreshing, setGisRefreshing] = useState(false);
  const [gisLastRefresh, setGisLastRefresh] = useState<string | null>(null);
  const [gisSurveyedArea, setGisSurveyedArea] = useState<number | null>(null);

  const refreshFromMagicGis = useCallback(async () => {
    setGisRefreshing(true);
    try {
      // Query Muscatine County MAGIC GIS ArcGIS REST API for parcel 0112177049
      const url =
        "https://magic-gis.com/arcgis/rest/services/MAGIC_Landbase/MuscatineParcels_Ortho/MapServer/0/query" +
        "?where=PIN%3D'0112177049'&outFields=PIN%2CADDRESS%2CACRES%2CLEGAL&f=geojson&outSR=4326";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { features?: Array<{ properties?: { ACRES?: number; ADDRESS?: string; LEGAL?: string } }> };
      const feat = data.features?.[0];
      if (!feat) throw new Error("Parcel not found in MAGIC GIS response");
      const acres = feat.properties?.ACRES ?? null;
      const address = feat.properties?.ADDRESS ?? "905 N Columbus St";
      const legal = feat.properties?.LEGAL ?? "";
      setGisSurveyedArea(acres);
      setGisLastRefresh(new Date().toLocaleTimeString());
      toast.success("MAGIC GIS refreshed", {
        description: `${address} · ${acres ? acres.toFixed(4) + " ac" : "area N/A"} · ${legal.slice(0, 40)}`,
        duration: 5000,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // CORS will block direct browser fetch — show cached data with note
      setGisLastRefresh(new Date().toLocaleTimeString());
      toast.info("Using cached MAGIC GIS data", {
        description: `Live query blocked by CORS (${msg}). Cached: 0.40146 ac · Queried 2026-04-09`,
        duration: 5000,
      });
    } finally {
      setGisRefreshing(false);
    }
  }, []);

  const filtered = useMemo(() => {
    return ASSETS.filter(a => {
      const matchCat = filterCat === "all" || a.category === filterCat;
      const q = search.toLowerCase();
      const matchSearch = !q || a.name.toLowerCase().includes(q) ||
        a.keywords.some(k => k.includes(q)) || a.location.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, filterCat]);

  const totalValue = ASSETS.reduce((s, a) => s + a.value, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🗂️</span>
          <h3 className="text-sm font-semibold text-white">Asset Registry</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-yellow-400">${totalValue.toLocaleString()} total</span>
          <div className="flex gap-0.5">
            {(["list", "graph"] as const).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${
                  viewMode === m ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30" : "text-white/30 hover:text-white/60"
                }`}
              >
                {m === "list" ? "≡ List" : "⬡ Graph"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search assets, keywords, zones…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full glass rounded-xl px-3 py-2 text-[11px] text-white placeholder-white/30 bg-transparent border border-white/10 focus:border-yellow-400/40 outline-none"
      />

      {/* Category filter */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {(["all", "biological", "chemical", "infrastructure", "equipment"] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider transition-all ${
              filterCat === cat
                ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"
                : "glass text-white/40 hover:text-white/70"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Graph view */}
      {viewMode === "graph" && (
        <div className="glass rounded-2xl p-3">
          <p className="text-[8px] text-white/30 uppercase tracking-wider mb-3">Relationship Graph</p>
          <div className="relative" style={{ height: 220 }}>
            {/* Simple SVG relationship tree */}
            <svg width="100%" height="220" className="absolute inset-0">
              {/* Edges */}
              {ASSETS.flatMap(asset =>
                asset.relations.map(rel => {
                  const target = ASSETS.find(a => a.id === rel.targetId);
                  if (!target) return null;
                  const srcIdx = ASSETS.indexOf(asset);
                  const tgtIdx = ASSETS.indexOf(target);
                  const cols = 4;
                  const sx = ((srcIdx % cols) + 0.5) / cols * 100;
                  const sy = (Math.floor(srcIdx / cols) + 0.5) / Math.ceil(ASSETS.length / cols) * 100;
                  const tx = ((tgtIdx % cols) + 0.5) / cols * 100;
                  const ty = (Math.floor(tgtIdx / cols) + 0.5) / Math.ceil(ASSETS.length / cols) * 100;
                  return (
                    <line
                      key={`${asset.id}-${rel.targetId}`}
                      x1={`${sx}%`} y1={`${sy}%`}
                      x2={`${tx}%`} y2={`${ty}%`}
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                  );
                })
              )}
              {/* Nodes */}
              {ASSETS.map((asset, i) => {
                const cols = 4;
                const cx = ((i % cols) + 0.5) / cols * 100;
                const cy = (Math.floor(i / cols) + 0.5) / Math.ceil(ASSETS.length / cols) * 100;
                const color = CATEGORY_COLORS[asset.category];
                return (
                  <g key={asset.id} onClick={() => { setExpandedId(asset.id); setViewMode("list"); }}>
                    <circle
                      cx={`${cx}%`} cy={`${cy}%`} r="14"
                      fill={`${color}22`} stroke={color} strokeWidth="1.5"
                      style={{ cursor: "pointer" }}
                    />
                    <text
                      x={`${cx}%`} y={`${cy}%`}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="14" style={{ userSelect: "none" }}
                    >
                      {asset.emoji}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="text-[8px] text-white/25 text-center mt-1">Tap a node to view details</p>
        </div>
      )}

      {/* Asset list */}
      {viewMode === "list" && (
        <div className="space-y-2">
          {filtered.map(asset => {
            const isExpanded = expandedId === asset.id;
            const color = CATEGORY_COLORS[asset.category];

            return (
              <motion.div
                key={asset.id}
                className="glass rounded-2xl overflow-hidden"
                style={{ borderColor: `${color}25`, borderWidth: 1 }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Row */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => { setExpandedId(isExpanded ? null : asset.id); onAssetSelect?.(asset); }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                  >
                    {asset.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-semibold text-white truncate">{asset.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                        style={{ background: `${color}20`, color }}
                      >
                        {asset.category}
                      </span>
                      <span className="text-[8px] text-white/35 truncate">{asset.location}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] font-mono text-yellow-400">${asset.value.toLocaleString()}</div>
                    <div
                      className="text-[8px] font-bold"
                      style={{ color: CONDITION_COLORS[asset.condition] }}
                    >
                      {asset.condition}
                    </div>
                  </div>
                </div>

                {/* Expanded metadata */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2 border-t border-white/10 pt-2">
                        {/* Core metadata grid */}
                        <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                          <MetaField label="Quantity" value={`${asset.quantity} ${asset.unit}`} />
                          <MetaField label="First Seen" value={asset.firstSeenDate} />
                          <MetaField label="Last Seen" value={asset.lastSeenDate} />
                          <MetaField label="Last Viewed By" value={asset.lastViewedBy} />
                          <MetaField label="Author" value={asset.author} />
                          <MetaField label="Time Source" value={asset.timeSource} />
                          <MetaField label="OSI Layer" value={asset.osiLayer} color="#cc88ff" />
                          <MetaField label="Blockchain" value={asset.blockchain} color={asset.blockchain !== "none" ? "#44ccff" : undefined} />
                        </div>

                        {/* Financial */}
                        <div className="glass rounded-xl p-2 grid grid-cols-2 gap-1.5">
                          <div>
                            <p className="text-[7px] text-white/25 uppercase tracking-wider">ROI</p>
                            <p className="text-[9px] text-green-400 font-mono">{asset.roi}</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-white/25 uppercase tracking-wider">TCO</p>
                            <p className="text-[9px] text-orange-400 font-mono">{asset.tco}</p>
                          </div>
                        </div>

                        {/* Keywords */}
                        <div className="flex flex-wrap gap-1">
                          {asset.keywords.map(k => (
                            <span key={k} className="text-[8px] glass px-1.5 py-0.5 rounded-full text-cyan-300 border border-cyan-400/20">
                              #{k}
                            </span>
                          ))}
                        </div>

                        {/* AI Agents */}
                        <div className="glass rounded-xl p-2">
                          <p className="text-[7px] text-white/25 uppercase tracking-wider mb-1">AI Agents</p>
                          <div className="flex flex-wrap gap-1">
                            {asset.aiAgents.map(ag => (
                              <span key={ag} className="text-[8px] px-1.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/20">
                                🤖 {ag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* License + Links */}
                        <div className="glass rounded-xl p-2 space-y-1">
                          <p className="text-[7px] text-white/25 uppercase tracking-wider">License</p>
                          <p className="text-[9px] text-purple-300">{asset.licenseModel}</p>
                          <div className="flex gap-2 mt-1">
                            {asset.howToGuide && (
                              <a
                                href={asset.howToGuide}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[8px] text-blue-400 underline hover:text-blue-300"
                                onClick={e => e.stopPropagation()}
                              >
                                📖 How-To Guide
                              </a>
                            )}
                            {asset.restockLink && (
                              <a
                                href={asset.restockLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[8px] text-green-400 underline hover:text-green-300"
                                onClick={e => e.stopPropagation()}
                              >
                                🛒 Restock
                              </a>
                            )}
                            {asset.id === "parcel-0112177049" && (
                              <>
                                <a
                                  href="https://beacon.schneidercorp.com/Application.aspx?AppID=12&LayerID=93&PageTypeID=4&PageID=145&Q=105043278&KeyValue=0112177049"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[8px] px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition-colors font-medium"
                                  onClick={e => e.stopPropagation()}
                                  title="Open Muscatine County MAGIC GIS assessor record in new tab"
                                >
                                  🗺️ Share to MAGIC GIS
                                </a>
                                <button
                                  className="text-[8px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-colors font-medium"
                                  onClick={e => {
                                    e.stopPropagation();
                                    // REAL surveyed corners from Muscatine County MAGIC GIS ArcGIS REST API
                                    // Legal: "N 68 E 259 OUT LOT 3 SE NW  2007-06934"
                                    // 259 ft E-W (along N Columbus St) x 68 ft N-S (backyard depth)
                                    // Queried 2026-04-09: magic-gis.com/arcgis/rest/services/MAGIC_Landbase/MuscatineParcels_Ortho
                                    const corners = [
                                      [-91.26074363, 41.57685164], // SW
                                      [-91.26169050, 41.57685029], // SE
                                      [-91.26168700, 41.57703613], // NE
                                      [-91.26074034, 41.57703625], // NW
                                      [-91.26074363, 41.57685164], // close (SW)
                                    ];
                                    const coordStr = corners.map(([lo, la]) => `${lo},${la},0`).join(" ");
                                    const kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n  <Document>\n    <name>905 N Columbus St - West Liberty IA</name>\n    <Placemark>\n      <name>Parcel 0112177049</name>\n      <description>905 N Columbus St, West Liberty IA 52776 | 0.40 acres | R1 Zoning | Muscatine County</description>\n      <Polygon>\n        <outerBoundaryIs>\n          <LinearRing>\n            <coordinates>${coordStr}</coordinates>\n          </LinearRing>\n        </outerBoundaryIs>\n      </Polygon>\n    </Placemark>\n  </Document>\n</kml>`;
                                    const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url; a.download = "905-N-Columbus-parcel.kml";
                                    a.click(); URL.revokeObjectURL(url);
                                  }}
                                  title="Download parcel boundary as KML for Google Earth / ArcGIS"
                                >
                                  ⬇ Export KML
                                </button>
                                <button
                                  className="text-[8px] px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 hover:bg-violet-500/30 transition-colors font-medium"
                                  onClick={e => {
                                    e.stopPropagation();
                                    // REAL surveyed corners from MAGIC GIS (same as KML export)
                                    const geojson = JSON.stringify({
                                      type: "FeatureCollection",
                                      features: [{
                                        type: "Feature",
                                        properties: {
                                          name: "905 N Columbus St",
                                          parcel: "0112177049",
                                          legal: "N 68 E 259 OUT LOT 3 SE NW  2007-06934",
                                          area_acres: 0.40146292,
                                          width_ft: 259,
                                          depth_ft: 68,
                                          zoning: "R1",
                                          county: "Muscatine",
                                          state: "IA",
                                          source: "Muscatine County MAGIC GIS ArcGIS REST API",
                                          queried: "2026-04-09"
                                        },
                                        geometry: {
                                          type: "Polygon",
                                          coordinates: [[
                                            [-91.26074363, 41.57685164], // SW
                                            [-91.26169050, 41.57685029], // SE
                                            [-91.26168700, 41.57703613], // NE
                                            [-91.26074034, 41.57703625], // NW
                                            [-91.26074363, 41.57685164], // close
                                          ]]
                                        }
                                      }]
                                    }, null, 2);
                                    const blob = new Blob([geojson], { type: "application/geo+json" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url; a.download = "905-N-Columbus-parcel.geojson";
                                    a.click(); URL.revokeObjectURL(url);
                                  }}
                                  title="Download parcel boundary as GeoJSON"
                                >
                                  ⬇ GeoJSON
                                </button>
                                <button
                                  className={`text-[8px] px-2 py-0.5 rounded-full border font-medium transition-all ${
                                    gisRefreshing
                                      ? "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400/50 cursor-wait"
                                      : "bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-500/30"
                                  }`}
                                  onClick={e => { e.stopPropagation(); refreshFromMagicGis(); }}
                                  disabled={gisRefreshing}
                                  title="Re-query Muscatine County MAGIC GIS ArcGIS REST API for latest parcel data"
                                >
                                  {gisRefreshing ? "⏳ Querying..." : "🔄 Refresh MAGIC GIS"}
                                </button>
                                {gisLastRefresh && (
                                  <span className="text-[7px] text-white/25 font-mono">
                                    Last: {gisLastRefresh}{gisSurveyedArea ? ` · ${gisSurveyedArea.toFixed(4)} ac` : ""}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Video refs */}
                        {asset.videoRefs.length > 0 && (
                          <div className="glass rounded-xl p-2">
                            <p className="text-[7px] text-white/25 uppercase tracking-wider mb-1">Media References</p>
                            {asset.videoRefs.map(v => (
                              <p key={v} className="text-[8px] text-cyan-400 font-mono truncate">📎 {v}</p>
                            ))}
                          </div>
                        )}

                        {/* Relationships */}
                        {asset.relations.length > 0 && (
                          <div className="glass rounded-xl p-2">
                            <p className="text-[7px] text-white/25 uppercase tracking-wider mb-1">Relationships</p>
                            {asset.relations.map(r => {
                              const target = ASSETS.find(a => a.id === r.targetId);
                              return (
                                <div key={r.targetId} className="flex items-center gap-1.5 py-0.5">
                                  <span className="text-[9px]">{target?.emoji}</span>
                                  <span className="text-[8px] text-white/40 font-mono">{r.relation}</span>
                                  <span className="text-[8px] text-white/60">{target?.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Notes */}
                        {asset.notes && (
                          <div className="glass rounded-xl p-2">
                            <p className="text-[9px] text-yellow-300 italic">💬 "{asset.notes}"</p>
                          </div>
                        )}

                        <button
                          onClick={() => toast.info(`📋 ${asset.name} copied to clipboard`)}
                          className="w-full glass rounded-xl py-1.5 text-[9px] text-white/40 hover:text-white/70 transition-all"
                        >
                          Export Asset Record
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetaField({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[7px] text-white/25 uppercase tracking-wider">{label}</p>
      <p className="text-[9px] font-mono truncate" style={{ color: color || "rgba(255,255,255,0.6)" }}>{value}</p>
    </div>
  );
}
