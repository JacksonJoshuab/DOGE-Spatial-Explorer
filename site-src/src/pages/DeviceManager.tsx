import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Monitor, Smartphone, Headphones, Tv, Globe, Cpu,
  Wifi, WifiOff, Battery, Activity, Zap, Settings,
  RefreshCw, Download, Upload, Trash2, Plus, Eye,
  Lock, Shield, CheckCircle, AlertCircle, XCircle,
  HardDrive, Thermometer, Radio, Camera, Layers,
  ChevronRight, MoreHorizontal, Power, Send
} from "lucide-react";

interface Device {
  id: string;
  name: string;
  type: "visionPro" | "questPro" | "quest3" | "ipad" | "appletv" | "blender" | "cloud";
  platform: string;
  status: "connected" | "idle" | "offline" | "syncing";
  battery?: number;
  cpu: number;
  gpu: number;
  memory: number;
  storage: number;
  latency: number;
  fps: number;
  ip: string;
  capabilities: string[];
  lastSeen: string;
}

const DEVICES: Device[] = [
  {
    id: "d1", name: "Apple Vision Pro", type: "visionPro", platform: "visionOS 3.0 beta",
    status: "connected", battery: 78, cpu: 34, gpu: 61, memory: 72, storage: 45, latency: 12, fps: 90,
    ip: "192.168.1.101",
    capabilities: ["RealityKit", "SharePlay", "Hand Tracking", "Eye Tracking", "LiDAR", "Spatial Audio", "Persona", "EyeSight"],
    lastSeen: "Now"
  },
  {
    id: "d2", name: "Meta Quest 3", type: "quest3", platform: "Meta Spatial SDK 71",
    status: "connected", battery: 62, cpu: 28, gpu: 44, memory: 58, storage: 32, latency: 18, fps: 72,
    ip: "192.168.1.102",
    capabilities: ["OpenXR", "Passthrough", "Hand Tracking", "Mixed Reality", "Horizon Worlds", "Meta Avatars"],
    lastSeen: "Now"
  },
  {
    id: "d3", name: "iPad Pro M4", type: "ipad", platform: "iPadOS 18.2",
    status: "connected", battery: 91, cpu: 12, gpu: 8, memory: 34, storage: 28, latency: 8, fps: 120,
    ip: "192.168.1.103",
    capabilities: ["Remote Control", "Scene Preview", "Asset Upload", "Pencil Input", "Stage Manager"],
    lastSeen: "Now"
  },
  {
    id: "d4", name: "Apple TV 4K", type: "appletv", platform: "tvOS 18.2",
    status: "idle", cpu: 5, gpu: 3, memory: 18, storage: 12, latency: 22, fps: 60,
    ip: "192.168.1.104",
    capabilities: ["Presentation Mode", "AirPlay", "Scene Broadcast", "4K Display"],
    lastSeen: "2m ago"
  },
  {
    id: "d5", name: "Blender Workstation", type: "blender", platform: "Blender 4.3 + Plugin 2.0",
    status: "connected", cpu: 45, gpu: 78, memory: 62, storage: 55, latency: 35, fps: 56,
    ip: "10.0.0.50",
    capabilities: ["CRDT Sync", "USDZ Export", "GLB Export", "AI Generation", "Physics Sim", "Render Farm"],
    lastSeen: "Now"
  },
  {
    id: "d6", name: "Cloud Render Node", type: "cloud", platform: "8× NVIDIA A100",
    status: "syncing", cpu: 82, gpu: 94, memory: 88, storage: 15, latency: 45, fps: 0,
    ip: "cloud.doge-spatial.io",
    capabilities: ["AI Generation", "Render Farm", "Asset Processing", "CRDT Relay", "WebRTC TURN"],
    lastSeen: "Now"
  },
];

const DEVICE_ICONS: Record<string, any> = {
  visionPro: () => <span className="text-lg">👓</span>,
  quest3: () => <span className="text-lg">🥽</span>,
  questPro: () => <span className="text-lg">🥽</span>,
  ipad: () => <span className="text-lg">📱</span>,
  appletv: () => <span className="text-lg">📺</span>,
  blender: () => <span className="text-lg">🔷</span>,
  cloud: () => <span className="text-lg">☁️</span>,
};

const STATUS_CONFIG = {
  connected: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", dot: "bg-green-400", label: "Connected" },
  idle: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400", label: "Idle" },
  offline: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", dot: "bg-red-400", label: "Offline" },
  syncing: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", dot: "bg-blue-400 animate-pulse", label: "Syncing" },
};

function MetricBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function DeviceCard({ device }: { device: Device }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[device.status];
  const DevIcon = DEVICE_ICONS[device.type] || (() => <Monitor className="w-5 h-5" />);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0F0F1E] border border-white/8 rounded-2xl overflow-hidden hover:border-white/14 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
          <DevIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white truncate">{device.name}</p>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${status.bg} ${status.color}`}>
              <span className={`inline-block w-1 h-1 rounded-full mr-1 ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 truncate">{device.platform} · {device.ip}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {device.battery !== undefined && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Battery className="w-3 h-3" />
              <span className="font-mono">{device.battery}%</span>
            </div>
          )}
          <span className="text-[10px] text-gray-500 font-mono">{device.latency}ms</span>
          {device.fps > 0 && <span className="text-[10px] text-green-400 font-mono">{device.fps}fps</span>}
        </div>
      </div>

      {/* Metrics */}
      <div className="px-4 pb-3 space-y-1.5">
        {[
          { label: "CPU", value: device.cpu, color: "bg-blue-500" },
          { label: "GPU", value: device.gpu, color: "bg-purple-500" },
          { label: "RAM", value: device.memory, color: "bg-green-500" },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-2">
            <span className="text-[9px] text-gray-600 w-6 font-mono">{m.label}</span>
            <MetricBar value={m.value} color={m.color} />
            <span className="text-[9px] text-gray-500 font-mono w-7 text-right">{m.value}%</span>
          </div>
        ))}
      </div>

      {/* Capabilities */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-1">
          {device.capabilities.slice(0, expanded ? undefined : 4).map(cap => (
            <span key={cap} className="px-1.5 py-0.5 bg-white/5 border border-white/8 rounded text-[9px] text-gray-500">{cap}</span>
          ))}
          {!expanded && device.capabilities.length > 4 && (
            <button onClick={() => setExpanded(true)} className="px-1.5 py-0.5 bg-white/5 border border-white/8 rounded text-[9px] text-blue-400">
              +{device.capabilities.length - 4} more
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <button className="flex-1 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 rounded-lg text-[10px] text-blue-400 font-medium transition-colors flex items-center justify-center gap-1">
          <Send className="w-3 h-3" /> Push Scene
        </button>
        <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-gray-400 font-medium transition-colors flex items-center justify-center gap-1">
          <Eye className="w-3 h-3" /> Preview
        </button>
        <button className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-500 transition-colors">
          <Settings className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

export default function DeviceManager() {
  const [devices, setDevices] = useState<Device[]>(DEVICES);
  const [filter, setFilter] = useState<"all" | "connected" | "idle" | "offline">("all");

  const filtered = devices.filter(d => filter === "all" || d.status === filter);
  const connected = devices.filter(d => d.status === "connected").length;
  const totalLatency = devices.filter(d => d.status === "connected").reduce((a, d) => a + d.latency, 0);
  const avgLatency = connected > 0 ? Math.round(totalLatency / connected) : 0;

  return (
    <div className="h-full bg-[#08080F] text-white overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/8 bg-[#0A0A16] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Device Manager</h1>
            <p className="text-xs text-gray-500 mt-0.5">visionOS · Meta Quest · iPadOS · tvOS · Blender · Cloud</p>
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: "Connected", value: connected, color: "text-green-400" },
              { label: "Avg Latency", value: `${avgLatency}ms`, color: "text-blue-400" },
              { label: "Platforms", value: devices.length, color: "text-purple-400" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-500">{s.label}</p>
              </div>
            ))}
            <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/80 hover:bg-blue-600 rounded-xl text-xs font-medium text-white transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Device
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mt-3">
          {(["all", "connected", "idle", "offline"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-blue-500/20 text-blue-300 border border-blue-500/20" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}>
              {f} {f !== "all" && `(${devices.filter(d => d.status === f).length})`}
            </button>
          ))}
          <button className="ml-auto p-1.5 text-gray-500 hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Device grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(device => <DeviceCard key={device.id} device={device} />)}
      </div>
    </div>
  );
}
