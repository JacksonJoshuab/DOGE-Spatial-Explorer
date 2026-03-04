import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Activity, RefreshCw, CheckCircle, AlertCircle, Clock,
  ArrowLeftRight, Play, Pause, Settings, Terminal, Wifi,
  Eye, Download, Upload, Layers, Box, Triangle, Circle,
  ChevronRight, ChevronDown, Monitor, Cpu, MemoryStick, HardDrive
} from "lucide-react";

const SYNC_EVENTS = [
  { id: 1, time: "00:00:00.021", type: "mesh_update", obj: "Z-Pinch Column", verts: 18432, tris: 36864, dir: "out", status: "synced" },
  { id: 2, time: "00:00:00.043", type: "material_update", obj: "Plasma Ring Mat", shader: "PrincipledBSDF", dir: "out", status: "synced" },
  { id: 3, time: "00:00:00.067", type: "transform", obj: "Bounding Box", pos: [0, 0, 0], rot: [0, 0, 0], dir: "out", status: "synced" },
  { id: 4, time: "00:00:00.089", type: "camera_sync", obj: "Main Camera", fov: 45, dir: "in", status: "synced" },
  { id: 5, time: "00:00:00.112", type: "light_update", obj: "Area Light 01", energy: 1000, dir: "out", status: "pending" },
  { id: 6, time: "00:00:00.134", type: "particle_system", obj: "Plasma Particles", count: 2048, dir: "out", status: "synced" },
  { id: 7, time: "00:00:00.156", type: "modifier_apply", obj: "Subdivision", level: 3, dir: "out", status: "error" },
  { id: 8, time: "00:00:00.178", type: "armature_pose", obj: "Rig.001", bones: 24, dir: "in", status: "synced" },
];

const BLENDER_OBJECTS = [
  { name: "Z-Pinch Column", type: "mesh", verts: 18432, polys: 36864, synced: true, modified: false },
  { name: "Plasma Rings (×18)", type: "mesh", verts: 3240, polys: 6480, synced: true, modified: true },
  { name: "Core Sphere", type: "mesh", verts: 512, polys: 1024, synced: true, modified: false },
  { name: "Particle System", type: "particles", verts: 2048, polys: 0, synced: true, modified: false },
  { name: "Bounding Box", type: "empty", verts: 0, polys: 0, synced: true, modified: false },
  { name: "Area Light 01", type: "light", verts: 0, polys: 0, synced: false, modified: true },
  { name: "Main Camera", type: "camera", verts: 0, polys: 0, synced: true, modified: false },
  { name: "Lighting Rig", type: "collection", verts: 0, polys: 0, synced: true, modified: false },
];

const CHANNEL_STATS = [
  { label: "Sync Rate", value: "60", unit: "Hz", color: "text-green-400", icon: Activity },
  { label: "Latency", value: "12", unit: "ms", color: "text-blue-400", icon: Zap },
  { label: "Objects", value: "847", unit: "synced", color: "text-purple-400", icon: Layers },
  { label: "Bandwidth", value: "2.4", unit: "MB/s", color: "text-amber-400", icon: Wifi },
];

const ADDON_LOG = [
  { time: "04:31:22", level: "INFO", msg: "DOGE Bridge v2.1.0 initialized" },
  { time: "04:31:22", level: "INFO", msg: "WebSocket connected to ws://localhost:9001" },
  { time: "04:31:23", level: "INFO", msg: "Scene handshake complete — 847 objects registered" },
  { time: "04:31:24", level: "INFO", msg: "RealityKit coordinate bridge active (Z-up → Y-up)" },
  { time: "04:31:24", level: "INFO", msg: "CRDT session joined: session_a3f9b2" },
  { time: "04:31:25", level: "SYNC", msg: "Full scene snapshot sent (14.2 MB)" },
  { time: "04:31:26", level: "SYNC", msg: "Delta sync active — watching depsgraph" },
  { time: "04:31:27", level: "WARN", msg: "Modifier 'Subdivision' on Z-Pinch Column has unapplied changes" },
  { time: "04:31:28", level: "SYNC", msg: "Material 'Plasma Ring Mat' updated → pushed to visionOS" },
  { time: "04:31:29", level: "SYNC", msg: "Camera transform synced from Vision Pro" },
  { time: "04:31:30", level: "INFO", msg: "Collaborator 'Vision Pro #1' joined session" },
  { time: "04:31:31", level: "SYNC", msg: "Particle system 'Plasma Particles' synced (2048 particles)" },
];

const typeIcon = (type: string) => {
  switch (type) {
    case "mesh": return <Triangle className="w-3 h-3 text-blue-400" />;
    case "light": return <Zap className="w-3 h-3 text-amber-400" />;
    case "camera": return <Eye className="w-3 h-3 text-green-400" />;
    case "particles": return <Circle className="w-3 h-3 text-purple-400" />;
    default: return <Box className="w-3 h-3 text-gray-400" />;
  }
};

export default function BlenderBridge() {
  const [connected, setConnected] = useState(true);
  const [syncActive, setSyncActive] = useState(true);
  const [syncEvents, setSyncEvents] = useState(SYNC_EVENTS);
  const [logLines, setLogLines] = useState(ADDON_LOG);
  const [fps, setFps] = useState(60);
  const [latency, setLatency] = useState(12);
  const [bandwidth, setBandwidth] = useState(2.4);
  const [selectedObj, setSelectedObj] = useState(BLENDER_OBJECTS[0]);
  const [expandedSection, setExpandedSection] = useState<string | null>("objects");
  const logRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    if (!syncActive) return;
    const interval = setInterval(() => {
      tickRef.current++;
      setFps(58 + Math.floor(Math.random() * 5));
      setLatency(10 + Math.floor(Math.random() * 8));
      setBandwidth(+(1.8 + Math.random() * 1.2).toFixed(1));

      if (tickRef.current % 3 === 0) {
        const types = ["mesh_update", "material_update", "transform", "camera_sync", "light_update"];
        const objs = ["Z-Pinch Column", "Plasma Ring Mat", "Core Sphere", "Area Light 01", "Main Camera"];
        const newEvent = {
          id: Date.now(),
          time: new Date().toISOString().split("T")[1].slice(0, 12),
          type: types[Math.floor(Math.random() * types.length)],
          obj: objs[Math.floor(Math.random() * objs.length)],
          verts: Math.floor(Math.random() * 20000),
          tris: Math.floor(Math.random() * 40000),
          dir: Math.random() > 0.5 ? "out" : "in",
          status: Math.random() > 0.1 ? "synced" : "pending",
        };
        setSyncEvents(prev => [newEvent, ...prev.slice(0, 11)]);
      }

      if (tickRef.current % 5 === 0) {
        const msgs = [
          "Delta sync: 3 objects updated",
          "Material 'Plasma Ring Mat' pushed",
          "Camera transform received from Vision Pro",
          "Particle cache invalidated — resyncing",
          "CRDT merge: 2 remote changes applied",
          "Geometry nodes evaluated — 18432 verts",
        ];
        const levels = ["SYNC", "SYNC", "SYNC", "INFO", "WARN"];
        const newLog = {
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          level: levels[Math.floor(Math.random() * levels.length)],
          msg: msgs[Math.floor(Math.random() * msgs.length)],
        };
        setLogLines(prev => [...prev.slice(-30), newLog]);
        setTimeout(() => {
          if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        }, 50);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [syncActive]);

  const statusColor = connected ? "text-green-400" : "text-red-400";
  const statusBg = connected ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20";

  return (
    <div className="flex flex-col h-full bg-[#08080F] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8 bg-[#0A0A16] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
          <ArrowLeftRight className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">Blender Live Bridge</h1>
          <p className="text-[10px] text-gray-500">Real-time bidirectional sync · CRDT · WebSocket</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium ${statusBg} ${statusColor}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            {connected ? "Blender Connected" : "Disconnected"}
          </div>
          <button
            onClick={() => setSyncActive(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              syncActive ? "bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25" : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            {syncActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {syncActive ? "Pause Sync" : "Resume Sync"}
          </button>
          <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-px bg-white/5 border-b border-white/8 flex-shrink-0">
        {CHANNEL_STATS.map(s => (
          <div key={s.label} className="flex items-center gap-3 px-4 py-2.5 bg-[#09090F]">
            <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
            <div>
              <div className={`text-base font-bold font-mono ${s.color}`}>
                {s.label === "Sync Rate" ? fps : s.label === "Latency" ? latency : s.label === "Bandwidth" ? bandwidth : s.value}
                <span className="text-xs font-normal text-gray-500 ml-1">{s.unit}</span>
              </div>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Object list + addon log */}
        <div className="w-64 flex-shrink-0 border-r border-white/8 flex flex-col bg-[#0A0A14]">
          {/* Blender Objects */}
          <div className="border-b border-white/8">
            <button
              onClick={() => setExpandedSection(expandedSection === "objects" ? null : "objects")}
              className="flex items-center gap-2 w-full px-3 py-2 text-[10px] text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
            >
              {expandedSection === "objects" ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Blender Scene Objects
              <span className="ml-auto text-[9px] bg-white/8 px-1.5 py-0.5 rounded">{BLENDER_OBJECTS.length}</span>
            </button>
            <AnimatePresence>
              {expandedSection === "objects" && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-2 pb-2 space-y-0.5 max-h-52 overflow-y-auto">
                    {BLENDER_OBJECTS.map(obj => (
                      <button
                        key={obj.name}
                        onClick={() => setSelectedObj(obj)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                          selectedObj.name === obj.name
                            ? "bg-orange-500/15 border border-orange-500/20"
                            : "hover:bg-white/5"
                        }`}
                      >
                        {typeIcon(obj.type)}
                        <span className={`text-[10px] flex-1 truncate ${selectedObj.name === obj.name ? "text-orange-300" : "text-gray-300"}`}>
                          {obj.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {obj.modified && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Modified" />
                          )}
                          <div className={`w-1.5 h-1.5 rounded-full ${obj.synced ? "bg-green-400" : "bg-red-400"}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Selected object properties */}
          <div className="border-b border-white/8 px-3 py-2">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Selected Object</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                {typeIcon(selectedObj.type)}
                <span className="text-xs text-white font-medium truncate">{selectedObj.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div className="bg-white/5 rounded px-2 py-1">
                  <div className="text-gray-500">Type</div>
                  <div className="text-gray-200 capitalize">{selectedObj.type}</div>
                </div>
                <div className="bg-white/5 rounded px-2 py-1">
                  <div className="text-gray-500">Status</div>
                  <div className={selectedObj.synced ? "text-green-400" : "text-red-400"}>
                    {selectedObj.synced ? "Synced" : "Pending"}
                  </div>
                </div>
                {selectedObj.verts > 0 && (
                  <>
                    <div className="bg-white/5 rounded px-2 py-1">
                      <div className="text-gray-500">Vertices</div>
                      <div className="text-gray-200">{selectedObj.verts.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 rounded px-2 py-1">
                      <div className="text-gray-500">Polygons</div>
                      <div className="text-gray-200">{selectedObj.polys.toLocaleString()}</div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-1 mt-2">
                <button className="flex-1 flex items-center justify-center gap-1 py-1 bg-orange-500/15 border border-orange-500/20 rounded text-[10px] text-orange-300 hover:bg-orange-500/25 transition-colors">
                  <Upload className="w-3 h-3" /> Push
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-1 bg-blue-500/15 border border-blue-500/20 rounded text-[10px] text-blue-300 hover:bg-blue-500/25 transition-colors">
                  <Download className="w-3 h-3" /> Pull
                </button>
              </div>
            </div>
          </div>

          {/* Addon log */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
              <Terminal className="w-3 h-3 text-gray-500" />
              <span className="text-[9px] text-gray-600 uppercase tracking-wider">Addon Console</span>
              <div className={`ml-auto w-1.5 h-1.5 rounded-full ${syncActive ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto px-2 py-1 font-mono space-y-0.5">
              {logLines.map((line, i) => (
                <div key={i} className="flex gap-1.5 text-[9px] leading-relaxed">
                  <span className="text-gray-700 flex-shrink-0">{line.time}</span>
                  <span className={`flex-shrink-0 font-bold ${
                    line.level === "ERROR" ? "text-red-400" :
                    line.level === "WARN" ? "text-amber-400" :
                    line.level === "SYNC" ? "text-blue-400" : "text-gray-500"
                  }`}>[{line.level}]</span>
                  <span className="text-gray-300">{line.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Sync event stream */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Bridge visualization */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-white/8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-300">Live Sync Stream</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">{syncEvents.length} events</span>
                <button className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Clear
                </button>
              </div>
            </div>

            {/* Bridge diagram */}
            <div className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/8">
              {/* Blender side */}
              <div className="flex flex-col items-center gap-1 w-24 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center">
                  <span className="text-lg">🔷</span>
                </div>
                <span className="text-[10px] text-orange-300 font-medium">Blender 4.3</span>
                <span className="text-[9px] text-gray-600">localhost:9001</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] text-green-400">Active</span>
                </div>
              </div>

              {/* Bridge */}
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-center gap-1 w-full">
                  <div className="flex-1 h-px bg-gradient-to-r from-orange-500/50 to-blue-500/50" />
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
                    <ArrowLeftRight className="w-3 h-3 text-gray-400" />
                    <span className="text-[9px] text-gray-400">WebSocket</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-purple-500/50" />
                </div>
                <div className="flex gap-2 text-[9px] text-gray-600">
                  <span>CRDT · Delta sync · E2EE</span>
                </div>
                {/* Animated packets */}
                <div className="relative w-full h-4 overflow-hidden">
                  {syncActive && [0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400"
                      initial={{ left: "0%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4, ease: "linear" }}
                    />
                  ))}
                  {syncActive && [0, 1].map(i => (
                    <motion.div
                      key={`r${i}`}
                      className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-400"
                      initial={{ left: "100%" }}
                      animate={{ left: "0%" }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.7, ease: "linear" }}
                    />
                  ))}
                </div>
              </div>

              {/* Spatial targets */}
              <div className="flex gap-2 flex-shrink-0">
                {[
                  { icon: "👓", label: "Vision Pro", color: "blue" },
                  { icon: "🥽", label: "Quest 3", color: "purple" },
                  { icon: "📱", label: "iPadOS", color: "green" },
                ].map(t => (
                  <div key={t.label} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-lg bg-${t.color}-500/15 border border-${t.color}-500/25 flex items-center justify-center text-sm`}>
                      {t.icon}
                    </div>
                    <span className="text-[8px] text-gray-500">{t.label}</span>
                    <div className={`w-1.5 h-1.5 rounded-full bg-${t.color}-400 animate-pulse`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Event table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-[#0A0A16] border-b border-white/8">
                <tr className="text-gray-600 uppercase tracking-wider">
                  <th className="text-left px-4 py-2 font-medium">Time</th>
                  <th className="text-left px-4 py-2 font-medium">Event Type</th>
                  <th className="text-left px-4 py-2 font-medium">Object</th>
                  <th className="text-left px-4 py-2 font-medium">Direction</th>
                  <th className="text-left px-4 py-2 font-medium">Details</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {syncEvents.map((ev, i) => (
                    <motion.tr
                      key={ev.id}
                      initial={{ opacity: 0, backgroundColor: "rgba(245,158,11,0.1)" }}
                      animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
                      transition={{ duration: 0.8 }}
                      className="border-b border-white/4 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-4 py-2 font-mono text-gray-600">{ev.time}</td>
                      <td className="px-4 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                          ev.type === "mesh_update" ? "bg-blue-500/15 text-blue-300" :
                          ev.type === "material_update" ? "bg-purple-500/15 text-purple-300" :
                          ev.type === "transform" ? "bg-green-500/15 text-green-300" :
                          ev.type === "camera_sync" ? "bg-cyan-500/15 text-cyan-300" :
                          ev.type === "particle_system" ? "bg-pink-500/15 text-pink-300" :
                          "bg-amber-500/15 text-amber-300"
                        }`}>
                          {ev.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-300 font-medium">{ev.obj}</td>
                      <td className="px-4 py-2">
                        <div className={`flex items-center gap-1 ${ev.dir === "out" ? "text-orange-400" : "text-blue-400"}`}>
                          {ev.dir === "out" ? <Upload className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                          {ev.dir === "out" ? "Blender → Spatial" : "Spatial → Blender"}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-500 font-mono">
                        {ev.verts ? `${ev.verts.toLocaleString()} verts` : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {ev.status === "synced" ? (
                          <span className="flex items-center gap-1 text-green-400"><CheckCircle className="w-3 h-3" /> Synced</span>
                        ) : ev.status === "pending" ? (
                          <span className="flex items-center gap-1 text-amber-400"><Clock className="w-3 h-3" /> Pending</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400"><AlertCircle className="w-3 h-3" /> Error</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: System info */}
        <div className="w-56 flex-shrink-0 border-l border-white/8 bg-[#0A0A14] flex flex-col">
          <div className="px-3 py-2 border-b border-white/8">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider">Blender System</p>
          </div>
          <div className="p-3 space-y-3">
            {[
              { icon: Cpu, label: "CPU", value: "AMD Threadripper", usage: 34, color: "bg-blue-500" },
              { icon: Monitor, label: "GPU", value: "RTX 4090 24GB", usage: 67, color: "bg-purple-500" },
              { icon: MemoryStick, label: "RAM", value: "128 GB DDR5", usage: 45, color: "bg-green-500" },
              { icon: HardDrive, label: "VRAM", value: "5.9 / 24 GiB", usage: 25, color: "bg-amber-500" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className="w-3 h-3 text-gray-500" />
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider">{item.label}</span>
                  <span className="ml-auto text-[9px] text-gray-400">{item.usage}%</span>
                </div>
                <div className="text-[10px] text-gray-300 mb-1">{item.value}</div>
                <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${item.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.usage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 py-2 border-t border-white/8 border-b border-white/8">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider">Addon Info</p>
          </div>
          <div className="p-3 space-y-2 text-[10px]">
            {[
              { label: "Addon Version", value: "v2.1.0" },
              { label: "Blender Version", value: "4.3.2" },
              { label: "Protocol", value: "DOGE-SP v3" },
              { label: "Session ID", value: "a3f9b2" },
              { label: "Objects Tracked", value: "847" },
              { label: "Pending Changes", value: "3" },
              { label: "Coord System", value: "Z-up → Y-up" },
              { label: "Compression", value: "LZ4 + CRDT" },
            ].map(item => (
              <div key={item.label} className="flex justify-between">
                <span className="text-gray-600">{item.label}</span>
                <span className="text-gray-300 font-mono">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto p-3 border-t border-white/8 space-y-1.5">
            <button className="w-full py-1.5 bg-orange-500/15 border border-orange-500/25 rounded-lg text-[10px] text-orange-300 hover:bg-orange-500/25 transition-colors font-medium">
              Force Full Sync
            </button>
            <button className="w-full py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-400 hover:bg-white/10 transition-colors">
              Open Blender Addon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
