/**
 * SpatialStudio — /spatial-studio
 * Cross-platform spatial editing management dashboard.
 * Provides a web-based control center for visionOS, Meta Quest, Blender,
 * and companion device sessions with real-time collaboration, 3D viewport,
 * privacy controls, and AI generation tools.
 */
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Eye, EyeOff, Users, Shield, Wifi, WifiOff, Monitor,
  Smartphone, Headphones, Layers, Activity, Send, Lock, Unlock,
  Plus, Trash2, RotateCcw, Download, Upload, Zap, Brain,
  Globe, Cpu, HardDrive, Gauge, RefreshCw, ChevronRight,
  Maximize2, Minimize2, Play, Pause, Settings, Camera,
  Palette, Move3D, Grid3X3, Sun, Moon, Sparkles, Image,
  Volume2, Radio, Database, Cloud, CloudOff, Check, X,
  AlertTriangle, Info, ArrowUpRight, Copy, Share2
} from "lucide-react";
import { toast } from "sonner";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface SceneNode {
  id: string;
  name: string;
  type: "mesh" | "light" | "camera" | "group" | "audio" | "particle" | "text3D" | "volumetric";
  visible: boolean;
  locked: boolean;
  children: SceneNode[];
  transform: { x: number; y: number; z: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number };
  color?: string;
}

interface Collaborator {
  id: string;
  name: string;
  platform: "visionOS" | "metaQuest" | "blender" | "web" | "iPadOS" | "tvOS";
  color: string;
  status: "active" | "idle" | "away";
  selectedNodeId?: string;
}

interface ConnectedDevice {
  id: string;
  name: string;
  platform: string;
  status: "online" | "idle" | "offline";
  lastSeen: string;
  battery?: number;
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
  resultUrl?: string;
}

/* ─── Demo Data ────────────────────────────────────────────────────────────── */

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
        id: "env-dome", name: "Environment Dome", type: "mesh", visible: true, locked: true,
        transform: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 50, sy: 50, sz: 50 },
        color: "#1a1a2e", children: []
      },
      {
        id: "sensor-array", name: "IoT Sensor Array", type: "group", visible: true, locked: false,
        transform: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
        children: [
          { id: "sensor-1", name: "Temp Sensor A", type: "mesh", visible: true, locked: false, transform: { x: -3, y: 0.5, z: 2, rx: 0, ry: 0, rz: 0, sx: 0.2, sy: 0.2, sz: 0.2 }, color: "#E74C3C", children: [] },
          { id: "sensor-2", name: "Pressure Sensor B", type: "mesh", visible: true, locked: false, transform: { x: 3, y: 0.5, z: -2, rx: 0, ry: 0, rz: 0, sx: 0.2, sy: 0.2, sz: 0.2 }, color: "#2ECC71", children: [] },
          { id: "sensor-3", name: "RF Antenna C", type: "mesh", visible: true, locked: false, transform: { x: 0, y: 3, z: 4, rx: 0, ry: 0, rz: 0, sx: 0.3, sy: 1, sz: 0.3 }, color: "#F39C12", children: [] },
        ]
      },
      {
        id: "lights", name: "Lighting", type: "group", visible: true, locked: false,
        transform: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 },
        children: [
          { id: "key-light", name: "Key Light", type: "light", visible: true, locked: false, transform: { x: 5, y: 8, z: 3, rx: -45, ry: 30, rz: 0, sx: 1, sy: 1, sz: 1 }, color: "#FFFFFF", children: [] },
          { id: "fill-light", name: "Fill Light", type: "light", visible: true, locked: false, transform: { x: -4, y: 6, z: -2, rx: -30, ry: -20, rz: 0, sx: 1, sy: 1, sz: 1 }, color: "#B4C7E7", children: [] },
        ]
      },
      { id: "main-cam", name: "Main Camera", type: "camera", visible: true, locked: false, transform: { x: 0, y: 3, z: 10, rx: -15, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 }, children: [] },
    ]
  },
];

const DEMO_COLLABORATORS: Collaborator[] = [
  { id: "c1", name: "Alex (Vision Pro)", platform: "visionOS", color: "#4A90D9", status: "active", selectedNodeId: "plasma-col" },
  { id: "c2", name: "Jordan (Quest 3)", platform: "metaQuest", color: "#E74C3C", status: "active", selectedNodeId: "sensor-1" },
  { id: "c3", name: "Sam (Blender)", platform: "blender", color: "#2ECC71", status: "idle" },
  { id: "c4", name: "Taylor (iPad)", platform: "iPadOS", color: "#F39C12", status: "active" },
];

const DEMO_DEVICES: ConnectedDevice[] = [
  { id: "d1", name: "Vision Pro (Office)", platform: "visionOS", status: "online", lastSeen: "now", battery: 78 },
  { id: "d2", name: "Quest 3 (Lab)", platform: "metaQuest", status: "online", lastSeen: "now", battery: 54 },
  { id: "d3", name: "iPad Pro 13\"", platform: "iPadOS", status: "online", lastSeen: "now", battery: 92 },
  { id: "d4", name: "Apple TV 4K", platform: "tvOS", status: "idle", lastSeen: "2m ago" },
  { id: "d5", name: "Blender Workstation", platform: "desktop", status: "online", lastSeen: "now" },
  { id: "d6", name: "Cloud Render Node", platform: "cloud", status: "online", lastSeen: "now" },
];

const OSI_LAYERS: SecurityLayer[] = [
  { name: "Application", layer: "L7", status: "secure", protocol: "TLS 1.3 + E2EE" },
  { name: "Presentation", layer: "L6", status: "secure", protocol: "AES-256-GCM" },
  { name: "Session", layer: "L5", status: "secure", protocol: "JWT + SharePlay" },
  { name: "Transport", layer: "L4", status: "secure", protocol: "TLS 1.3" },
  { name: "Network", layer: "L3", status: "secure", protocol: "IPsec / WireGuard" },
  { name: "Data Link", layer: "L2", status: "secure", protocol: "802.11ax WPA3" },
  { name: "Physical", layer: "L1", status: "secure", protocol: "Secure Enclave" },
];

/* ─── Helper Components ────────────────────────────────────────────────────── */

function PlatformIcon({ platform, size = 16 }: { platform: string; size?: number }) {
  const s = { width: size, height: size };
  switch (platform) {
    case "visionOS": return <Eye style={s} />;
    case "metaQuest": return <Headphones style={s} />;
    case "blender": return <Box style={s} />;
    case "iPadOS": return <Smartphone style={s} />;
    case "tvOS": return <Monitor style={s} />;
    case "desktop": return <Monitor style={s} />;
    case "cloud": return <Cloud style={s} />;
    default: return <Globe style={s} />;
  }
}

function StatusDot({ status }: { status: string }) {
  const color = status === "online" || status === "active" || status === "secure"
    ? "#22c55e" : status === "idle" ? "#f59e0b"
    : status === "warning" ? "#f59e0b" : "#ef4444";
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, marginRight: 6 }} />;
}

function NodeTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "mesh": return <Box size={14} />;
    case "light": return <Sun size={14} />;
    case "camera": return <Camera size={14} />;
    case "group": return <Grid3X3 size={14} />;
    case "audio": return <Volume2 size={14} />;
    case "particle": return <Sparkles size={14} />;
    case "text3D": return <span style={{ fontSize: 12, fontWeight: 700 }}>T</span>;
    case "volumetric": return <Layers size={14} />;
    default: return <Box size={14} />;
  }
}

/* ─── 3D Viewport (Canvas) ─────────────────────────────────────────────────── */

function Viewport3D({ nodes, selectedId, onSelect }: { nodes: SceneNode[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const drawScene = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    // Dark background
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(100,100,150,0.15)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    const cx = w / 2;
    const cy = h * 0.65;

    // Bounding box
    ctx.strokeStyle = "rgba(255,150,200,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 120, cy - 280, 240, 300);

    // Plasma column — volumetric glow effect
    const gradient = ctx.createLinearGradient(cx, cy - 260, cx, cy + 20);
    gradient.addColorStop(0, "rgba(100,150,255,0.0)");
    gradient.addColorStop(0.2, "rgba(100,150,255,0.3)");
    gradient.addColorStop(0.5, "rgba(150,100,255,0.6)");
    gradient.addColorStop(0.7, "rgba(200,100,255,0.8)");
    gradient.addColorStop(1, "rgba(255,150,200,0.4)");

    // Outer glow
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.1 * Math.sin(t * 2);
    ctx.filter = "blur(20px)";
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 20);
    ctx.quadraticCurveTo(cx - 50, cy - 130, cx - 15, cy - 260);
    ctx.lineTo(cx + 15, cy - 260);
    ctx.quadraticCurveTo(cx + 50, cy - 130, cx + 30, cy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Inner bright column
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.filter = "blur(6px)";
    const innerGrad = ctx.createLinearGradient(cx, cy - 260, cx, cy + 20);
    innerGrad.addColorStop(0, "rgba(180,200,255,0.1)");
    innerGrad.addColorStop(0.3, "rgba(100,150,255,0.7)");
    innerGrad.addColorStop(0.6, "rgba(180,120,255,0.9)");
    innerGrad.addColorStop(1, "rgba(255,180,220,0.5)");
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 10);
    ctx.quadraticCurveTo(cx - 25, cy - 130, cx - 6, cy - 250);
    ctx.lineTo(cx + 6, cy - 250);
    ctx.quadraticCurveTo(cx + 25, cy - 130, cx + 12, cy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Pinch nodes (toroidal structures)
    for (let i = 0; i < 8; i++) {
      const ny = cy - 20 - i * 30;
      const spread = 8 + i * 2 + 3 * Math.sin(t * 3 + i);
      ctx.save();
      ctx.globalAlpha = 0.6 + 0.2 * Math.sin(t * 2 + i * 0.5);
      ctx.filter = "blur(3px)";
      const nodeGrad = ctx.createRadialGradient(cx, ny, 0, cx, ny, spread + 10);
      nodeGrad.addColorStop(0, "rgba(200,150,255,0.9)");
      nodeGrad.addColorStop(0.5, "rgba(100,100,255,0.4)");
      nodeGrad.addColorStop(1, "rgba(100,100,255,0.0)");
      ctx.fillStyle = nodeGrad;
      ctx.beginPath();
      ctx.ellipse(cx, ny, spread, spread * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Sensor dots
    const sensors = [
      { x: cx - 100, y: cy + 30, color: "#E74C3C", label: "Temp A" },
      { x: cx + 100, y: cy + 30, color: "#2ECC71", label: "Press B" },
      { x: cx, y: cy - 100, color: "#F39C12", label: "RF C" },
    ];
    sensors.forEach(s => {
      ctx.save();
      ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 4);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(s.label, s.x, s.y + 22);
    });

    // Axes indicator (bottom-left)
    const ax = 50, ay = h - 50;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#E74C3C"; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 30, ay); ctx.stroke();
    ctx.strokeStyle = "#2ECC71"; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - 30); ctx.stroke();
    ctx.strokeStyle = "#4A90D9"; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 15, ay + 15); ctx.stroke();
    ctx.fillStyle = "#E74C3C"; ctx.font = "10px system-ui"; ctx.fillText("X", ax + 33, ay + 4);
    ctx.fillStyle = "#2ECC71"; ctx.fillText("Y", ax - 4, ay - 33);
    ctx.fillStyle = "#4A90D9"; ctx.fillText("Z", ax + 18, ay + 28);

    // Render stats overlay (top-right)
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    const stats = [
      `Render Quality: High`,
      `View Mode: Lit`,
      `Bounds: 128x128x384`,
      `Voxels: 6.3 Mvox`,
      `Sim Time: ${(t * 1000 % 10).toFixed(1)} ms`,
      `Sim Speed: 947 Mvox/s`,
      `Resolution: ${w}x${h}`,
      `UI Framerate: 60 fps`,
      `VRAM: 5.9 / 9.8 GiB`,
    ];
    stats.forEach((s, i) => {
      ctx.fillText(s, w - 16, 24 + i * 18);
    });
    ctx.textAlign = "left";

    // Title
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 14px system-ui";
    ctx.fillText("Z-Pinch Plasma Column — Squatter Man — Aurora", 16, h - 30);
    ctx.font = "11px system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("Simulation of the Z-Pinch Plasma Column / Squatter Man / Aurora", 16, h - 14);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvas.style.width = rect.width + "px";
        canvas.style.height = rect.height + "px";
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      timeRef.current += 0.016;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
        drawScene(ctx, rect.width, rect.height, timeRef.current);
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [drawScene]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", borderRadius: 8 }} />;
}

/* ─── Scene Hierarchy Panel ────────────────────────────────────────────────── */

function SceneHierarchy({ nodes, selectedId, onSelect, depth = 0 }: { nodes: SceneNode[]; selectedId: string | null; onSelect: (id: string) => void; depth?: number }) {
  return (
    <>
      {nodes.map(node => (
        <div key={node.id}>
          <div
            onClick={() => onSelect(node.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "4px 8px",
              paddingLeft: 8 + depth * 16,
              background: selectedId === node.id ? "rgba(74,144,217,0.15)" : "transparent",
              borderLeft: selectedId === node.id ? "2px solid #4A90D9" : "2px solid transparent",
              cursor: "pointer", borderRadius: 4, fontSize: 13,
              color: node.visible ? "inherit" : "rgba(255,255,255,0.3)",
            }}
          >
            <NodeTypeIcon type={node.type} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.name}</span>
            {node.locked && <Lock size={12} style={{ opacity: 0.4 }} />}
            {!node.visible && <EyeOff size={12} style={{ opacity: 0.4 }} />}
          </div>
          {node.children.length > 0 && <SceneHierarchy nodes={node.children} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />}
        </div>
      ))}
    </>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */

export default function SpatialStudio() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("plasma-col");
  const [activeTab, setActiveTab] = useState<"scene" | "collab" | "devices" | "security" | "ai">("scene");
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [privacyMode, setPrivacyMode] = useState<"private" | "team" | "org">("team");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiJobs, setAiJobs] = useState<AIJob[]>([]);
  const [syncCount, setSyncCount] = useState(0);
  const [latency, setLatency] = useState(42);

  // Simulate live sync counter
  useEffect(() => {
    const iv = setInterval(() => {
      setSyncCount(c => c + Math.floor(Math.random() * 5) + 1);
      setLatency(38 + Math.floor(Math.random() * 20));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const handleAIGenerate = (type: string) => {
    if (!aiPrompt.trim()) { toast.error("Enter a prompt first"); return; }
    const job: AIJob = {
      id: `job-${Date.now()}`,
      type,
      prompt: aiPrompt,
      status: "processing",
      progress: 0,
    };
    setAiJobs(prev => [job, ...prev]);
    setAiPrompt("");
    toast.success(`${type} job started`);

    // Simulate progress
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 20;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setAiJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: "completed", progress: 100 } : j));
        toast.success(`${type} completed!`);
      } else {
        setAiJobs(prev => prev.map(j => j.id === job.id ? { ...j, progress: Math.min(p, 99) } : j));
      }
    }, 800);
  };

  return (
    <DashboardLayout title="Spatial Studio">
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", overflow: "hidden" }}>

        {/* ── Top Bar ──────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "8px 16px",
          borderBottom: "1px solid rgba(0,0,0,0.1)", background: "rgba(0,0,0,0.02)",
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Layers size={18} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Z-Pinch Plasma Simulation</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            {/* Sync status */}
            <div style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
              borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: isLiveSync ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              color: isLiveSync ? "#16a34a" : "#dc2626",
              border: `1px solid ${isLiveSync ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
            }}>
              {isLiveSync ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isLiveSync ? "LIVE SYNC" : "OFFLINE"}
            </div>

            {/* Latency */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 11, background: "rgba(0,0,0,0.05)", fontFamily: "monospace" }}>
              <Activity size={12} /> {latency}ms
            </div>

            {/* Ops counter */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 11, background: "rgba(0,0,0,0.05)", fontFamily: "monospace" }}>
              <RefreshCw size={12} /> {syncCount} ops
            </div>

            {/* Privacy badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
              borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: "rgba(147,51,234,0.1)", color: "#7c3aed",
              border: "1px solid rgba(147,51,234,0.2)", cursor: "pointer",
            }} onClick={() => setPrivacyMode(p => p === "private" ? "team" : p === "team" ? "org" : "private")}>
              <Lock size={12} />
              {privacyMode === "private" ? "PRIVATE" : privacyMode === "team" ? "TEAM" : "ORG"}
            </div>

            {/* Collaborator avatars */}
            <div style={{ display: "flex", marginLeft: 8 }}>
              {DEMO_COLLABORATORS.map((c, i) => (
                <div key={c.id} title={`${c.name} (${c.platform})`} style={{
                  width: 28, height: 28, borderRadius: "50%", background: c.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#fff",
                  border: "2px solid #fff", marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i,
                  position: "relative",
                }}>
                  {c.name.charAt(0)}
                  <span style={{
                    position: "absolute", bottom: -1, right: -1, width: 8, height: 8,
                    borderRadius: "50%", background: c.status === "active" ? "#22c55e" : "#f59e0b",
                    border: "1.5px solid #fff",
                  }} />
                </div>
              ))}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: "rgba(0,0,0,0.4)", marginLeft: -8,
                border: "2px solid #fff", cursor: "pointer",
              }}>+</div>
            </div>

            <button onClick={() => setIsLiveSync(!isLiveSync)} style={{
              padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.15)",
              background: isLiveSync ? "#dc2626" : "#16a34a", color: "#fff",
              fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}>
              {isLiveSync ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
            </button>
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Left Panel — Scene Hierarchy */}
          <div style={{
            width: 260, borderRight: "1px solid rgba(0,0,0,0.1)", overflow: "auto",
            background: "rgba(0,0,0,0.02)", flexShrink: 0,
          }}>
            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
              {(["scene", "collab", "devices", "security", "ai"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: "8px 4px", fontSize: 10, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: 0.5, cursor: "pointer",
                  border: "none", borderBottom: activeTab === tab ? "2px solid #4A90D9" : "2px solid transparent",
                  background: "transparent", color: activeTab === tab ? "#4A90D9" : "rgba(0,0,0,0.4)",
                }}>
                  {tab === "scene" && <Layers size={12} />}
                  {tab === "collab" && <Users size={12} />}
                  {tab === "devices" && <Monitor size={12} />}
                  {tab === "security" && <Shield size={12} />}
                  {tab === "ai" && <Brain size={12} />}
                </button>
              ))}
            </div>

            <div style={{ padding: "8px 0" }}>
              {activeTab === "scene" && (
                <SceneHierarchy nodes={DEMO_SCENE} selectedId={selectedNodeId} onSelect={setSelectedNodeId} />
              )}

              {activeTab === "collab" && (
                <div style={{ padding: "0 8px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, padding: "8px 0 4px", color: "rgba(0,0,0,0.4)" }}>
                    Online ({DEMO_COLLABORATORS.filter(c => c.status === "active").length})
                  </div>
                  {DEMO_COLLABORATORS.map(c => (
                    <div key={c.id} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                      borderRadius: 6, marginBottom: 2,
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%", background: c.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
                      }}>{c.name.charAt(0)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 4 }}>
                          <PlatformIcon platform={c.platform} size={10} /> {c.platform}
                        </div>
                      </div>
                      <StatusDot status={c.status} />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "devices" && (
                <div style={{ padding: "0 8px" }}>
                  {DEMO_DEVICES.map(d => (
                    <div key={d.id} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                      borderRadius: 6, marginBottom: 2,
                    }}>
                      <PlatformIcon platform={d.platform} size={16} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                        <div style={{ fontSize: 10, color: "rgba(0,0,0,0.4)" }}>{d.lastSeen}{d.battery ? ` · ${d.battery}%` : ""}</div>
                      </div>
                      <StatusDot status={d.status} />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "security" && (
                <div style={{ padding: "0 8px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, padding: "8px 0 4px", color: "rgba(0,0,0,0.4)" }}>
                    OSI Security Stack
                  </div>
                  {OSI_LAYERS.map(layer => (
                    <div key={layer.layer} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
                      borderRadius: 6, marginBottom: 2, fontSize: 12,
                    }}>
                      <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.3)", width: 20 }}>{layer.layer}</span>
                      <span style={{ flex: 1 }}>{layer.name}</span>
                      <span style={{ fontSize: 9, color: "rgba(0,0,0,0.4)", fontFamily: "monospace" }}>{layer.protocol}</span>
                      <StatusDot status={layer.status} />
                    </div>
                  ))}
                  <div style={{ marginTop: 12, padding: 8, borderRadius: 8, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#16a34a" }}>
                      <Check size={14} /> All Layers Secure
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(0,0,0,0.4)", marginTop: 4 }}>
                      E2E encryption active · Secure Enclave verified · Privacy zones enforced
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "ai" && (
                <div style={{ padding: "0 8px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, padding: "8px 0 4px", color: "rgba(0,0,0,0.4)" }}>
                    AI Generation
                  </div>
                  <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Describe what to generate..."
                    style={{
                      width: "100%", minHeight: 60, padding: 8, borderRadius: 6,
                      border: "1px solid rgba(0,0,0,0.15)", fontSize: 12, resize: "vertical",
                      fontFamily: "system-ui",
                    }}
                  />
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                    {[
                      { label: "3D Model", type: "Text-to-3D", icon: <Box size={12} /> },
                      { label: "Texture", type: "Text-to-Texture", icon: <Palette size={12} /> },
                      { label: "Scene", type: "Text-to-Scene", icon: <Layers size={12} /> },
                      { label: "From Image", type: "Image-to-3D", icon: <Image size={12} /> },
                    ].map(btn => (
                      <button key={btn.type} onClick={() => handleAIGenerate(btn.type)} style={{
                        padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.15)",
                        background: "rgba(74,144,217,0.08)", fontSize: 10, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4, fontWeight: 600,
                      }}>
                        {btn.icon} {btn.label}
                      </button>
                    ))}
                  </div>
                  {aiJobs.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "rgba(0,0,0,0.3)", marginBottom: 4 }}>Jobs</div>
                      {aiJobs.map(job => (
                        <div key={job.id} style={{
                          padding: "6px 8px", borderRadius: 6, marginBottom: 4,
                          background: job.status === "completed" ? "rgba(34,197,94,0.08)" : "rgba(0,0,0,0.03)",
                          border: `1px solid ${job.status === "completed" ? "rgba(34,197,94,0.15)" : "rgba(0,0,0,0.08)"}`,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 600 }}>{job.type}</div>
                          <div style={{ fontSize: 10, color: "rgba(0,0,0,0.4)", marginBottom: 4 }}>{job.prompt}</div>
                          <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.1)", overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: 2, transition: "width 0.3s",
                              width: `${job.progress}%`,
                              background: job.status === "completed" ? "#22c55e" : "#4A90D9",
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center — 3D Viewport */}
          <div style={{ flex: 1, position: "relative", background: "#0a0a1a", overflow: "hidden" }}>
            <Viewport3D nodes={DEMO_SCENE} selectedId={selectedNodeId} onSelect={setSelectedNodeId} />

            {/* Viewport toolbar */}
            <div style={{
              position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column", gap: 4,
            }}>
              {[
                { icon: <Move3D size={16} />, label: "Move" },
                { icon: <RotateCcw size={16} />, label: "Rotate" },
                { icon: <Maximize2 size={16} />, label: "Scale" },
              ].map((tool, i) => (
                <button key={i} title={tool.label} style={{
                  width: 32, height: 32, borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)",
                  background: i === 0 ? "rgba(74,144,217,0.3)" : "rgba(0,0,0,0.4)",
                  color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {tool.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel — Properties */}
          <div style={{
            width: 280, borderLeft: "1px solid rgba(0,0,0,0.1)", overflow: "auto",
            background: "rgba(0,0,0,0.02)", flexShrink: 0, padding: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "rgba(0,0,0,0.4)", marginBottom: 8 }}>
              Properties
            </div>

            {selectedNodeId && (() => {
              const findNode = (nodes: SceneNode[], id: string): SceneNode | null => {
                for (const n of nodes) {
                  if (n.id === id) return n;
                  const found = findNode(n.children, id);
                  if (found) return found;
                }
                return null;
              };
              const node = findNode(DEMO_SCENE, selectedNodeId);
              if (!node) return null;

              return (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <NodeTypeIcon type={node.type} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{node.name}</span>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.5)", marginBottom: 4 }}>Transform</div>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: "4px 8px", fontSize: 12, marginBottom: 12 }}>
                    <span style={{ color: "rgba(0,0,0,0.4)" }}>Pos</span>
                    <input type="number" value={node.transform.x} readOnly style={{ width: "100%", padding: "2px 4px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.1)", fontSize: 11, textAlign: "center" }} />
                    <input type="number" value={node.transform.y} readOnly style={{ width: "100%", padding: "2px 4px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.1)", fontSize: 11, textAlign: "center" }} />
                    <input type="number" value={node.transform.z} readOnly style={{ width: "100%", padding: "2px 4px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.1)", fontSize: 11, textAlign: "center" }} />
                    <span style={{ color: "rgba(0,0,0,0.4)" }}>Rot</span>
                    <input type="number" value={node.transform.rx} readOnly style={{ width: "100%", padding: "2px 4px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.1)", fontSize: 11, textAlign: "center" }} />
                    <input type="number" value={node.transform.ry} readOnly style={{ width: "100%", padding: "2px 4px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.1)", fontSize: 11, textAlign: "center" }} />
                    <input type="number" value={node.transform.rz} readOnly style={{ width: "100%", padding: "2px 4px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.1)", fontSize: 11, textAlign: "center" }} />
                    <span style={{ color: "rgba(0,0,0,0.4)" }}>Scl</span>
                    <input type="number" value={node.transform.sx} readOnly style={{ width: "100%", padding: "2px 4px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.1)", fontSize: 11, textAlign: "center" }} />
                    <input type="number" value={node.transform.sy} readOnly style={{ width: "100%", padding: "2px 4px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.1)", fontSize: 11, textAlign: "center" }} />
                    <input type="number" value={node.transform.sz} readOnly style={{ width: "100%", padding: "2px 4px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.1)", fontSize: 11, textAlign: "center" }} />
                  </div>

                  {node.color && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.5)", marginBottom: 4 }}>Material</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 4, background: node.color, border: "1px solid rgba(0,0,0,0.15)" }} />
                        <span style={{ fontSize: 12, fontFamily: "monospace" }}>{node.color}</span>
                      </div>
                    </>
                  )}

                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.5)", marginBottom: 4 }}>Visibility</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <button style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.1)", background: node.visible ? "rgba(34,197,94,0.1)" : "transparent", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <Eye size={12} /> Visible
                    </button>
                    <button style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.1)", background: node.locked ? "rgba(239,68,68,0.1)" : "transparent", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      {node.locked ? <Lock size={12} /> : <Unlock size={12} />} {node.locked ? "Locked" : "Unlocked"}
                    </button>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.5)", marginBottom: 4 }}>Actions</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.1)", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <Copy size={10} /> Duplicate
                    </button>
                    <button style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.1)", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <Download size={10} /> Export
                    </button>
                    <button style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(239,68,68,0.2)", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#dc2626" }}>
                      <Trash2 size={10} /> Delete
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Connected Platforms Summary */}
            <div style={{ marginTop: 20, padding: 10, borderRadius: 8, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "rgba(0,0,0,0.3)", marginBottom: 6 }}>
                Connected Platforms
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[
                  { name: "visionOS", count: 1, color: "#4A90D9" },
                  { name: "Meta Quest", count: 1, color: "#00bcd4" },
                  { name: "Blender", count: 1, color: "#F39C12" },
                  { name: "iPadOS", count: 1, color: "#9B59B6" },
                  { name: "tvOS", count: 1, color: "#6366f1" },
                  { name: "Cloud", count: 1, color: "#22c55e" },
                ].map(p => (
                  <div key={p.name} style={{
                    display: "flex", alignItems: "center", gap: 4, fontSize: 10,
                    padding: "3px 6px", borderRadius: 4, background: `${p.color}10`,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color }} />
                    {p.name}
                    <span style={{ marginLeft: "auto", fontWeight: 700 }}>{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
