/**
 * SpatialStudio — /spatial-studio
 * Full spatial editing studio with live 3D viewport (React Three Fiber),
 * scene graph, properties panel, AI generation, privacy controls, and collaboration.
 * Apple Vision Pro spatial computing design language.
 */
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import {
  Box, Eye, EyeOff, Users, Shield, Wifi, WifiOff, Monitor,
  Smartphone, Headphones, Layers, Activity, Send, Lock, Unlock,
  Plus, Trash2, RotateCcw, Download, Upload, Zap, Brain,
  Globe, Cpu, HardDrive, Gauge, RefreshCw, ChevronRight,
  Maximize2, Minimize2, Play, Pause, Settings, Camera,
  Palette, Move3D, Grid3X3, Sun, Moon, Sparkles, Image,
  Volume2, Radio, Database, Cloud, CloudOff, Check, X,
  AlertTriangle, Info, ArrowUpRight, Copy, Share2, Layers3,
  ScanLine, Crosshair, RotateCw, Scale, MousePointer2,
  ChevronDown, ChevronUp, Sliders, Wand2, Video, Mic,
  MicOff, VideoOff, PhoneCall, PhoneOff, Atom, Waves,
  Triangle, Circle, Square, Hexagon, Star,
  AlignCenter, AlignLeft, AlignRight, Group, Ungroup,
  FolderOpen, Save, FileJson, Package, Boxes, Lightbulb,
  SunMedium, Aperture, Focus, Flame, Snowflake, Wind,
  GitBranch, History, Clock, Bell, BellOff, Filter,
  Search, ZoomIn, ZoomOut, Maximize, LayoutGrid, List,
  PanelLeft, PanelRight, PanelBottom, SidebarOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const SpatialViewport = lazy(() => import("@/components/spatial/SpatialViewport"));

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface SceneNode {
  id: string;
  name: string;
  type: "mesh" | "light" | "camera" | "group" | "audio" | "particle" | "text3D" | "volumetric" | "privacyZone";
  visible: boolean;
  locked: boolean;
  children: SceneNode[];
  transform: { x: number; y: number; z: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number };
  color?: string;
  geometry?: "box" | "sphere" | "cylinder" | "cone" | "torus" | "plane";
}

interface Collaborator {
  id: string;
  name: string;
  platform: "visionOS" | "metaQuest" | "blender" | "web" | "iPadOS" | "tvOS";
  color: string;
  status: "active" | "idle" | "away";
  selectedNodeId?: string;
  cursorPosition?: { x: number; y: number; z: number };
}

interface SecurityLayer {
  name: string;
  layer: string;
  status: "secure" | "warning" | "error";
  protocol: string;
}

interface AIJob {
  id: string;
  type: string;
  prompt: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
}

/* ─── Demo Data ─────────────────────────────────────────────────────────────── */
const DEMO_SCENE: SceneNode[] = [
  {
    id: "root", name: "Scene Root", type: "group", visible: true, locked: false,
    transform: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
    children: [
      {
        id: "plasma-col", name: "Z-Pinch Plasma Column", type: "volumetric", visible: true, locked: false,
        transform: { x: 0, y: 2.5, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 5, sz: 1 },
        color: "#4A90D9", children: []
      },
      {
        id: "bounding-box", name: "Simulation Bounds", type: "mesh", visible: true, locked: true,
        geometry: "box",
        transform: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 5, sz: 1 },
        color: "#FF69B4", children: []
      },
      {
        id: "sensor-array", name: "IoT Sensor Array", type: "group", visible: true, locked: false,
        transform: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
        children: [
          { id: "sensor-1", name: "Temp Sensor A", type: "mesh", geometry: "sphere", visible: true, locked: false, transform: { x: -3, y: 0.5, z: 2, rx: 0, ry: 0, rz: 0, sx: 0.3, sy: 0.3, sz: 0.3 }, color: "#E74C3C", children: [] },
          { id: "sensor-2", name: "Pressure Sensor B", type: "mesh", geometry: "sphere", visible: true, locked: false, transform: { x: 3, y: 0.5, z: -2, rx: 0, ry: 0, rz: 0, sx: 0.3, sy: 0.3, sz: 0.3 }, color: "#2ECC71", children: [] },
          { id: "sensor-3", name: "RF Antenna C", type: "mesh", geometry: "cylinder", visible: true, locked: false, transform: { x: 0, y: 1.5, z: 4, rx: 0, ry: 0, rz: 0, sx: 0.15, sy: 1, sz: 0.15 }, color: "#F39C12", children: [] },
        ]
      },
      {
        id: "lights", name: "Lighting Rig", type: "group", visible: true, locked: false,
        transform: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
        children: [
          { id: "key-light", name: "Key Light", type: "light", visible: true, locked: false, transform: { x: 5, y: 8, z: 5, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 }, color: "#FFF5E0", children: [] },
          { id: "fill-light", name: "Fill Light", type: "light", visible: true, locked: false, transform: { x: -3, y: 3, z: -3, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 }, color: "#4A90D9", children: [] },
        ]
      },
      { id: "camera-main", name: "Main Camera", type: "camera", visible: true, locked: false, transform: { x: 4, y: 3, z: 6, rx: -0.3, ry: 0.5, rz: 0, sx: 1, sy: 1, sz: 1 }, color: "#F59E0B", children: [] },
    ]
  }
];

const DEMO_COLLABORATORS: Collaborator[] = [
  { id: "c1", name: "Alex (Vision Pro)", platform: "visionOS", color: "#3B82F6", status: "active", selectedNodeId: "plasma-col", cursorPosition: { x: 0.5, y: 2, z: 0.5 } },
  { id: "c2", name: "Sam (Quest 3)", platform: "metaQuest", color: "#8B5CF6", status: "active", cursorPosition: { x: -1, y: 1.5, z: 1 } },
  { id: "c3", name: "Jordan (Blender)", platform: "blender", color: "#F59E0B", status: "idle", cursorPosition: { x: 2, y: 0, z: -1 } },
  { id: "c4", name: "Taylor (iPad)", platform: "iPadOS", color: "#10B981", status: "active", cursorPosition: { x: -2, y: 1, z: -2 } },
];

const SECURITY_LAYERS: SecurityLayer[] = [
  { name: "Physical", layer: "L1", status: "secure", protocol: "Apple Silicon Secure Enclave" },
  { name: "Data Link", layer: "L2", status: "secure", protocol: "802.11ax Wi-Fi 6E" },
  { name: "Network", layer: "L3", status: "secure", protocol: "IPv6 + Private Relay" },
  { name: "Transport", layer: "L4", status: "secure", protocol: "TLS 1.3 / QUIC" },
  { name: "Session", layer: "L5", status: "secure", protocol: "SharePlay E2E" },
  { name: "Presentation", layer: "L6", status: "secure", protocol: "AES-256-GCM" },
  { name: "Application", layer: "L7", status: "warning", protocol: "CRDT Sync (verifying)" },
];

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function PlatformBadge({ platform }: { platform: string }) {
  const config: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    visionOS: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", icon: "👁" },
    metaQuest: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", icon: "🥽" },
    blender: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", icon: "🎨" },
    web: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", icon: "🌐" },
    iPadOS: { bg: "bg-teal-500/20", text: "text-teal-400", border: "border-teal-500/30", icon: "📱" },
    tvOS: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", icon: "📺" },
  };
  const c = config[platform] || config.web;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {c.icon} {platform}
    </span>
  );
}

function NodeIcon({ type }: { type: string }) {
  const icons: Record<string, JSX.Element> = {
    mesh: <Box className="w-3 h-3" />,
    light: <SunMedium className="w-3 h-3 text-yellow-400" />,
    camera: <Aperture className="w-3 h-3 text-blue-400" />,
    group: <Layers3 className="w-3 h-3 text-gray-400" />,
    audio: <Volume2 className="w-3 h-3 text-green-400" />,
    particle: <Sparkles className="w-3 h-3 text-purple-400" />,
    text3D: <AlignCenter className="w-3 h-3 text-pink-400" />,
    volumetric: <Atom className="w-3 h-3 text-cyan-400" />,
    privacyZone: <Shield className="w-3 h-3 text-red-400" />,
  };
  return icons[type] || <Box className="w-3 h-3" />;
}

function TreeNode({ node, depth, selectedId, onSelect, onToggleVisible, onToggleLock }: {
  node: SceneNode; depth: number; selectedId: string | null;
  onSelect: (id: string) => void; onToggleVisible: (id: string) => void; onToggleLock: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;
  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 rounded cursor-pointer group text-xs transition-colors ${isSelected ? "bg-blue-500/20 text-blue-300" : "hover:bg-white/5 text-gray-300"}`}
        style={{ paddingLeft: `${8 + depth * 14}px`, paddingRight: "8px" }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }} className="p-0.5">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : <span className="w-4" />}
        <NodeIcon type={node.type} />
        <span className="flex-1 truncate text-[11px]">{node.name}</span>
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button onClick={e => { e.stopPropagation(); onToggleVisible(node.id); }} className="p-0.5 opacity-50 hover:opacity-100">
            {node.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
          <button onClick={e => { e.stopPropagation(); onToggleLock(node.id); }} className="p-0.5 opacity-50 hover:opacity-100">
            {node.locked ? <Lock className="w-3 h-3 text-yellow-400" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>
        {node.color && <span className="w-2 h-2 rounded-full border border-white/20 flex-shrink-0" style={{ background: node.color }} />}
      </div>
      {hasChildren && expanded && node.children.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId}
          onSelect={onSelect} onToggleVisible={onToggleVisible} onToggleLock={onToggleLock} />
      ))}
    </div>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-gray-500 w-3 font-mono">{label}</span>
      <input type="number" value={value.toFixed(2)}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-white font-mono focus:outline-none focus:border-blue-500/50 w-0"
        step={0.1} />
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */

export default function SpatialStudio() {
  const [scene, setScene] = useState<SceneNode[]>(DEMO_SCENE);
  const [collaborators] = useState<Collaborator[]>(DEMO_COLLABORATORS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("plasma-col");
  const [rightTab, setRightTab] = useState<"properties" | "ai" | "security">("properties");
  const [showGrid, setShowGrid] = useState(true);
  const [showGizmo, setShowGizmo] = useState(true);
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [showPrivacyZones, setShowPrivacyZones] = useState(true);
  const [viewMode, setViewMode] = useState<"perspective" | "top" | "front" | "right">("perspective");
  const [renderMode, setRenderMode] = useState<"solid" | "wireframe" | "material" | "xray">("solid");
  const [activeTool, setActiveTool] = useState<"select" | "move" | "rotate" | "scale">("select");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiType, setAiType] = useState("text_to_3d");
  const [aiJobs, setAiJobs] = useState<AIJob[]>([
    { id: "j1", type: "text_to_3d", prompt: "Z-pinch plasma column aurora effect", status: "completed", progress: 100 },
    { id: "j2", type: "text_to_texture", prompt: "Plasma energy field surface texture", status: "processing", progress: 67 },
  ]);
  const [fps, setFps] = useState(60);
  const [cloudStatus] = useState<"connected" | "syncing" | "offline">("connected");

  useEffect(() => {
    const i = setInterval(() => setFps(Math.floor(56 + Math.random() * 8)), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      setAiJobs(prev => prev.map(j => {
        if (j.status === "processing" && j.progress < 100) {
          const p = Math.min(100, j.progress + Math.random() * 4);
          return { ...j, progress: p, status: p >= 100 ? "completed" : "processing" };
        }
        return j;
      }));
    }, 600);
    return () => clearInterval(i);
  }, []);

  const findNode = useCallback((nodes: SceneNode[], id: string): SceneNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      const f = findNode(n.children, id);
      if (f) return f;
    }
    return null;
  }, []);

  const selectedNode = selectedNodeId ? findNode(scene, selectedNodeId) : null;

  const toggleVisible = useCallback((id: string) => {
    const t = (nodes: SceneNode[]): SceneNode[] => nodes.map(n => n.id === id ? { ...n, visible: !n.visible } : { ...n, children: t(n.children) });
    setScene(prev => t(prev));
  }, []);

  const toggleLock = useCallback((id: string) => {
    const t = (nodes: SceneNode[]): SceneNode[] => nodes.map(n => n.id === id ? { ...n, locked: !n.locked } : { ...n, children: t(n.children) });
    setScene(prev => t(prev));
  }, []);

  const updateTransform = useCallback((id: string, key: string, value: number) => {
    const u = (nodes: SceneNode[]): SceneNode[] => nodes.map(n => n.id === id ? { ...n, transform: { ...n.transform, [key]: value } } : { ...n, children: u(n.children) });
    setScene(prev => u(prev));
  }, []);

  const addNode = (type: SceneNode["type"]) => {
    const n: SceneNode = {
      id: `node_${Date.now()}`, name: `New ${type}`, type, visible: true, locked: false,
      geometry: type === "mesh" ? "box" : undefined,
      transform: { x: (Math.random() - 0.5) * 4, y: 0.5, z: (Math.random() - 0.5) * 4, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
      color: `hsl(${Math.random() * 360}, 70%, 60%)`, children: [],
    };
    setScene(prev => { const u = [...prev]; u[0] = { ...u[0], children: [...u[0].children, n] }; return u; });
    setSelectedNodeId(n.id);
    toast.success(`Added ${type} to scene`);
  };

  const submitAI = () => {
    if (!aiPrompt.trim()) return;
    const j: AIJob = { id: `j${Date.now()}`, type: aiType, prompt: aiPrompt, status: "queued", progress: 0 };
    setAiJobs(prev => [j, ...prev]);
    setAiPrompt("");
    toast.success("AI generation queued");
    setTimeout(() => setAiJobs(prev => prev.map(x => x.id === j.id ? { ...x, status: "processing" } : x)), 800);
  };

  const allNodes = scene.flatMap(n => [n, ...n.children.flatMap(c => [c, ...c.children])]);

  return (
    <DashboardLayout>
      <div className="flex flex-col bg-[#0A0A14] text-white overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0F0F1E] border-b border-white/10 flex-shrink-0 flex-wrap">
          {/* Panel toggles */}
          <div className="flex items-center gap-1 border-r border-white/10 pr-2">
            <button onClick={() => setLeftOpen(!leftOpen)} className={`p-1.5 rounded ${leftOpen ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`} title="Scene panel">
              <PanelLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setRightOpen(!rightOpen)} className={`p-1.5 rounded ${rightOpen ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`} title="Properties panel">
              <PanelRight className="w-4 h-4" />
            </button>
          </div>

          {/* Transform tools */}
          <div className="flex items-center gap-1 border-r border-white/10 pr-2">
            {[
              { id: "select", icon: MousePointer2, label: "Select" },
              { id: "move", icon: Move3D, label: "Move" },
              { id: "rotate", icon: RotateCw, label: "Rotate" },
              { id: "scale", icon: Scale, label: "Scale" },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTool(t.id as any)}
                className={`p-1.5 rounded transition-colors ${activeTool === t.id ? "bg-blue-500/30 text-blue-300" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}
                title={t.label}>
                <t.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* View modes */}
          <div className="flex items-center gap-0.5 border-r border-white/10 pr-2">
            {(["perspective", "top", "front", "right"] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${viewMode === m ? "bg-white/15 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                {m.slice(0, 4).toUpperCase()}
              </button>
            ))}
          </div>

          {/* Render modes */}
          <div className="flex items-center gap-0.5 border-r border-white/10 pr-2">
            {(["solid", "wireframe", "material", "xray"] as const).map(m => (
              <button key={m} onClick={() => setRenderMode(m)}
                className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${renderMode === m ? "bg-white/15 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                {m.slice(0, 4).toUpperCase()}
              </button>
            ))}
          </div>

          {/* Viewport overlays */}
          <div className="flex items-center gap-1 border-r border-white/10 pr-2">
            <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded ${showGrid ? "text-blue-400" : "text-gray-600 hover:text-gray-400"}`} title="Grid">
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setShowCollaborators(!showCollaborators)} className={`p-1.5 rounded ${showCollaborators ? "text-green-400" : "text-gray-600 hover:text-gray-400"}`} title="Collaborators">
              <Users className="w-4 h-4" />
            </button>
            <button onClick={() => setShowPrivacyZones(!showPrivacyZones)} className={`p-1.5 rounded ${showPrivacyZones ? "text-amber-400" : "text-gray-600 hover:text-gray-400"}`} title="Privacy zones">
              <Shield className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1" />

          {/* Live collaborators */}
          <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
            {collaborators.filter(c => c.status === "active").map(c => (
              <div key={c.id} className="w-6 h-6 rounded-full border-2 border-[#0A0A14] flex items-center justify-center text-[10px] font-bold"
                style={{ background: c.color }} title={`${c.name} · ${c.platform}`}>
                {c.name[0]}
              </div>
            ))}
            <span className="text-xs text-gray-500">{collaborators.filter(c => c.status === "active").length} live</span>
          </div>

          {/* Cloud + FPS */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 text-xs ${cloudStatus === "connected" ? "text-green-400" : "text-red-400"}`}>
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{cloudStatus}</span>
            </div>
            <div className="text-xs font-mono">
              <span className={fps >= 55 ? "text-green-400" : fps >= 30 ? "text-yellow-400" : "text-red-400"}>{fps}</span>
              <span className="text-gray-600"> fps</span>
            </div>
          </div>
        </div>

        {/* ── Main Layout ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left — Scene Graph */}
          <AnimatePresence>
            {leftOpen && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                className="flex-shrink-0 border-r border-white/10 bg-[#0D0D1C] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Scene Graph</span>
                  <div className="flex gap-1">
                    <button onClick={() => addNode("mesh")} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white" title="Add mesh"><Plus className="w-3.5 h-3.5" /></button>
                    <button className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white" title="Search"><Search className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {/* Quick add */}
                <div className="px-2 py-1.5 border-b border-white/5 flex flex-wrap gap-1">
                  {[{ type: "mesh" as const, icon: Box, label: "Mesh" }, { type: "light" as const, icon: SunMedium, label: "Light" }, { type: "camera" as const, icon: Aperture, label: "Cam" }, { type: "particle" as const, icon: Sparkles, label: "FX" }].map(item => (
                    <button key={item.type} onClick={() => addNode(item.type)}
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded text-[10px] text-gray-400 hover:text-white transition-colors">
                      <item.icon className="w-2.5 h-2.5" />{item.label}
                    </button>
                  ))}
                </div>
                {/* Tree */}
                <div className="flex-1 overflow-y-auto py-1">
                  {scene.map(n => <TreeNode key={n.id} node={n} depth={0} selectedId={selectedNodeId} onSelect={setSelectedNodeId} onToggleVisible={toggleVisible} onToggleLock={toggleLock} />)}
                </div>
                {/* Stats */}
                <div className="px-3 py-2 border-t border-white/10 bg-black/20">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {[["Objects", "12"], ["Polys", "6.3M"], ["Voxels", "6.3M"], ["Sim", "947 Mvox/s"]].map(([l, v]) => (
                      <div key={l} className="flex justify-between text-[10px]">
                        <span className="text-gray-600">{l}</span>
                        <span className="text-gray-300 font-mono">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center — 3D Viewport */}
          <div className="flex-1 relative overflow-hidden">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center bg-[#0A0A14]">
                <div className="text-center">
                  <Atom className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Initializing 3D Engine</p>
                  <p className="text-gray-600 text-xs mt-1">React Three Fiber · WebGL 2.0 · Metal</p>
                </div>
              </div>
            }>
              <SpatialViewport
                nodes={allNodes}
                collaborators={collaborators}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                showGrid={showGrid}
                showGizmo={showGizmo}
                showCollaborators={showCollaborators}
                showPrivacyZones={showPrivacyZones}
                viewMode={viewMode}
                renderMode={renderMode}
              />
            </Suspense>

            {/* Live collaborator overlay */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 pointer-events-none">
              {collaborators.filter(c => c.status === "active").map(c => (
                <motion.div key={c.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/10">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: c.color }} />
                  <span className="text-xs text-white">{c.name}</span>
                  <PlatformBadge platform={c.platform} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — Properties / AI / Security */}
          <AnimatePresence>
            {rightOpen && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                className="flex-shrink-0 border-l border-white/10 bg-[#0D0D1C] flex flex-col overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-white/10">
                  {[{ id: "properties", icon: Sliders, label: "Props" }, { id: "ai", icon: Brain, label: "AI" }, { id: "security", icon: Shield, label: "Security" }].map(tab => (
                    <button key={tab.id} onClick={() => setRightTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${rightTab === tab.id ? "text-blue-400 border-b-2 border-blue-500 bg-blue-500/5" : "text-gray-500 hover:text-gray-300"}`}>
                      <tab.icon className="w-3.5 h-3.5" />{tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {/* Properties */}
                  {rightTab === "properties" && (
                    <div className="p-3 space-y-4">
                      {selectedNode ? (
                        <>
                          <div className="flex items-center gap-2">
                            <NodeIcon type={selectedNode.type} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{selectedNode.name}</p>
                              <p className="text-[10px] text-gray-500 capitalize">{selectedNode.type}</p>
                            </div>
                            {selectedNode.color && <div className="w-5 h-5 rounded border border-white/20" style={{ background: selectedNode.color }} />}
                          </div>
                          {/* Transform */}
                          <div>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Transform</p>
                            {[{ label: "Position", keys: ["x", "y", "z"] as const }, { label: "Rotation", keys: ["rx", "ry", "rz"] as const }, { label: "Scale", keys: ["sx", "sy", "sz"] as const }].map(group => (
                              <div key={group.label} className="mb-2">
                                <p className="text-[10px] text-gray-600 mb-1">{group.label}</p>
                                <div className="grid grid-cols-3 gap-1">
                                  {group.keys.map(k => (
                                    <NumInput key={k} label={k.replace(/[rsx]/, "").toUpperCase() || k.toUpperCase()} value={selectedNode.transform[k]} onChange={v => updateTransform(selectedNode.id, k, v)} />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Geometry */}
                          {selectedNode.type === "mesh" && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Geometry</p>
                              <div className="grid grid-cols-3 gap-1">
                                {(["box", "sphere", "cylinder", "cone", "torus", "plane"] as const).map(g => (
                                  <button key={g} className={`py-1 px-1.5 rounded text-[10px] border transition-colors ${selectedNode.geometry === g ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}>{g}</button>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Visibility/Lock */}
                          <div className="flex gap-2">
                            <button onClick={() => toggleVisible(selectedNode.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs border transition-colors ${selectedNode.visible ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                              {selectedNode.visible ? <><Eye className="w-3.5 h-3.5" /> Visible</> : <><EyeOff className="w-3.5 h-3.5" /> Hidden</>}
                            </button>
                            <button onClick={() => toggleLock(selectedNode.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs border transition-colors ${selectedNode.locked ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"}`}>
                              {selectedNode.locked ? <><Lock className="w-3.5 h-3.5" /> Locked</> : <><Unlock className="w-3.5 h-3.5" /> Unlocked</>}
                            </button>
                          </div>
                          {/* Actions */}
                          <div className="flex gap-2">
                            <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-gray-300">
                              <Copy className="w-3 h-3" /> Duplicate
                            </button>
                            <button onClick={() => { setSelectedNodeId(null); toast.success("Node deleted"); }}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded text-xs text-red-400">
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                          {/* Render stats */}
                          <div className="border-t border-white/10 pt-3">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Render Info</p>
                            {[["Render Quality", "High"], ["Bounds", "128×128×384"], ["Voxels", "6.3 Mvox"], ["Sim Speed", "947 Mvox/s"], ["Render Time", "10.8 ms"], ["UI Framerate", `${fps} fps`]].map(([l, v]) => (
                              <div key={l} className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600">{l}</span>
                                <span className="text-gray-200 font-mono">{v}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-10 text-gray-600">
                          <MousePointer2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Select a node</p>
                          <p className="text-xs mt-1 text-gray-700">Click in viewport or scene graph</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI */}
                  {rightTab === "ai" && (
                    <div className="p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium">AI Generation</span>
                      </div>
                      <div className="space-y-1">
                        {[
                          { id: "text_to_3d", icon: Box, label: "Text → 3D Model" },
                          { id: "text_to_texture", icon: Palette, label: "Text → Texture" },
                          { id: "image_to_3d", icon: Image, label: "Image → 3D" },
                          { id: "audio_to_scene", icon: Volume2, label: "Audio → Scene" },
                          { id: "text_to_scene", icon: Sparkles, label: "Text → Full Scene" },
                        ].map(t => (
                          <button key={t.id} onClick={() => setAiType(t.id)}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${aiType === t.id ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-white/3 border-white/8 text-gray-400 hover:bg-white/8"}`}>
                            <t.icon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-xs">{t.label}</span>
                          </button>
                        ))}
                      </div>
                      <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                        placeholder="Describe what to generate..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-purple-500/50 h-20" />
                      <button onClick={submitAI} disabled={!aiPrompt.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">
                        <Wand2 className="w-4 h-4" /> Generate
                      </button>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Jobs</p>
                        <div className="space-y-2">
                          {aiJobs.map(job => (
                            <div key={job.id} className="bg-white/5 rounded-lg p-2 border border-white/10">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-mono text-gray-500">{job.type.replace(/_/g, " ")}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${job.status === "completed" ? "bg-green-500/20 text-green-400" : job.status === "processing" ? "bg-blue-500/20 text-blue-400" : job.status === "failed" ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-400"}`}>
                                  {job.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-300 truncate mb-1.5">{job.prompt}</p>
                              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${job.status === "completed" ? "bg-green-500" : job.status === "failed" ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${job.progress}%` }} />
                              </div>
                              {job.status === "completed" && (
                                <button className="mt-1.5 w-full text-[10px] text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1">
                                  <Download className="w-3 h-3" /> Import to Scene
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security */}
                  {rightTab === "security" && (
                    <div className="p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium">Security Status</span>
                        <span className="ml-auto text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">6/7 SECURE</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">OSI Stack</p>
                        <div className="space-y-1">
                          {SECURITY_LAYERS.map(layer => (
                            <div key={layer.layer} className={`flex items-center gap-2 p-2 rounded border text-xs ${layer.status === "secure" ? "bg-green-500/5 border-green-500/20" : layer.status === "warning" ? "bg-yellow-500/5 border-yellow-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                              <span className={`font-mono text-[10px] w-5 ${layer.status === "secure" ? "text-green-500" : layer.status === "warning" ? "text-yellow-500" : "text-red-500"}`}>{layer.layer}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-200 text-[11px]">{layer.name}</p>
                                <p className="text-gray-600 text-[9px] truncate">{layer.protocol}</p>
                              </div>
                              {layer.status === "secure" ? <Check className="w-3 h-3 text-green-400" /> : layer.status === "warning" ? <AlertTriangle className="w-3 h-3 text-yellow-400" /> : <X className="w-3 h-3 text-red-400" />}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Encryption</p>
                        {[["Algorithm", "AES-256-GCM"], ["Key Exchange", "ECDH-P256"], ["Secure Enclave", "Active"], ["Key Rotation", "Every 1h"]].map(([l, v]) => (
                          <div key={l} className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">{l}</span>
                            <span className="text-green-400 font-mono">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Privacy Zones</p>
                        {[{ name: "Main Scene", level: "team", users: 4 }, { name: "Classified", level: "classified", users: 1 }, { name: "Public Preview", level: "public", users: 12 }].map(z => (
                          <div key={z.name} className="flex items-center gap-2 p-2 rounded border border-white/10 bg-white/3 mb-1.5">
                            <Shield className="w-3 h-3 text-blue-400" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-200">{z.name}</p>
                              <p className="text-[10px] text-gray-500 capitalize">{z.level} · {z.users} users</p>
                            </div>
                          </div>
                        ))}
                        <button className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-gray-400">
                          <Plus className="w-3 h-3" /> Add Privacy Zone
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Export footer */}
                <div className="border-t border-white/10 p-3 flex-shrink-0">
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {["USDZ", "GLB", "FBX"].map(fmt => (
                      <button key={fmt} onClick={() => toast.success(`Exporting as ${fmt}...`)}
                        className="py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-gray-300 font-mono transition-colors">
                        {fmt}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => toast.success("Pushing to all connected devices...")}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors">
                    <Share2 className="w-3.5 h-3.5" /> Push to All Devices
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
