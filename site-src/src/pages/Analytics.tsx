import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Activity, Cpu, Zap, Clock, Eye, Users, Globe,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw,
  Download, Filter, Calendar, ChevronDown, Layers, Box, Triangle
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────
function useAnimatedValue(target: number, speed = 0.08) {
  const [val, setVal] = useState(target);
  const ref = useRef(target);
  useEffect(() => {
    const id = setInterval(() => {
      ref.current += (target - ref.current) * speed;
      setVal(Math.round(ref.current * 10) / 10);
    }, 50);
    return () => clearInterval(id);
  }, [target, speed]);
  return val;
}

function Sparkline({ data, color = "#60a5fa", height = 32 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120; const h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - ((data[data.length - 1] - min) / range) * h} r="2.5" fill={color} />
    </svg>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

// ── fake data generators ──────────────────────────────────────────────────────
function genHistory(base: number, noise: number, len = 30) {
  return Array.from({ length: len }, (_, i) => base + Math.sin(i * 0.4) * noise + (Math.random() - 0.5) * noise * 0.5);
}

const DEVICES = [
  { id: "vp1", name: "Vision Pro #1", icon: "👓", platform: "visionOS", color: "#60a5fa" },
  { id: "q3",  name: "Quest 3",       icon: "🥽", platform: "Meta",     color: "#a78bfa" },
  { id: "ipad",name: "iPad Pro",      icon: "📱", platform: "iPadOS",   color: "#34d399" },
  { id: "bld", name: "Blender WS",    icon: "🔷", platform: "Blender",  color: "#fbbf24" },
];

const SCENE_OBJECTS = [
  { name: "Z-Pinch Column",    verts: 18432, tris: 36864, drawCalls: 4,  ms: 2.1 },
  { name: "Plasma Rings ×18",  verts: 9216,  tris: 18432, drawCalls: 18, ms: 3.8 },
  { name: "Particle System",   verts: 4096,  tris: 0,     drawCalls: 1,  ms: 6.6 },
  { name: "Bounding Box",      verts: 24,    tris: 12,    drawCalls: 1,  ms: 0.1 },
  { name: "Area Light 01",     verts: 4,     tris: 2,     drawCalls: 1,  ms: 0.4 },
  { name: "Main Camera",       verts: 0,     tris: 0,     drawCalls: 0,  ms: 0.0 },
];

const EVENTS = [
  { time: "00:00:04.231", type: "sync",    device: "👓", msg: "Transform synced: Z-Pinch Column → 3 devices",   ok: true },
  { time: "00:00:04.118", type: "render",  device: "🥽", msg: "Frame 847 rendered in 10.8 ms (Cycles)",         ok: true },
  { time: "00:00:03.990", type: "warn",    device: "🔷", msg: "Subdivision modifier on Z-Pinch has unapplied changes", ok: false },
  { time: "00:00:03.774", type: "sync",    device: "📱", msg: "Material 'Plasma Ring Mat' updated → visionOS",  ok: true },
  { time: "00:00:03.512", type: "collab",  device: "👓", msg: "Collaborator Vision Pro #2 joined session",      ok: true },
  { time: "00:00:03.200", type: "ai",      device: "☁️", msg: "Text→3D job completed: 'aurora gradient sphere'", ok: true },
  { time: "00:00:02.988", type: "warn",    device: "🥽", msg: "VRAM usage at 87% — consider reducing samples",  ok: false },
  { time: "00:00:02.701", type: "sync",    device: "🔷", msg: "Particle system count updated: 2048 → 4096",     ok: true },
];

// ── main component ────────────────────────────────────────────────────────────
export default function Analytics() {
  const [timeRange, setTimeRange] = useState("1h");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [tab, setTab] = useState<"overview" | "scene" | "network" | "events">("overview");
  const [tick, setTick] = useState(0);

  // live-ish metrics
  const [fps, setFps] = useState(56.1);
  const [simMs, setSimMs] = useState(6.6);
  const [vram, setVram] = useState(5.9);
  const [syncLatency, setSyncLatency] = useState(13);
  const [bandwidth, setBandwidth] = useState(1.9);
  const [activeUsers, setActiveUsers] = useState(3);

  const [fpsHistory, setFpsHistory] = useState(() => genHistory(56, 6));
  const [simHistory, setSimHistory] = useState(() => genHistory(6.6, 1.2));
  const [latHistory, setLatHistory] = useState(() => genHistory(13, 4));
  const [bwHistory,  setBwHistory]  = useState(() => genHistory(1.9, 0.4));

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setFps(v => Math.max(30, Math.min(72, v + (Math.random() - 0.5) * 3)));
      setSimMs(v => Math.max(4, Math.min(12, v + (Math.random() - 0.5) * 0.5)));
      setVram(v => Math.max(4, Math.min(9.8, v + (Math.random() - 0.5) * 0.2)));
      setSyncLatency(v => Math.max(5, Math.min(40, v + (Math.random() - 0.5) * 3)));
      setBandwidth(v => Math.max(0.5, Math.min(5, v + (Math.random() - 0.5) * 0.3)));
      setFpsHistory(h => [...h.slice(1), fps]);
      setSimHistory(h => [...h.slice(1), simMs]);
      setLatHistory(h => [...h.slice(1), syncLatency]);
      setBwHistory(h => [...h.slice(1), bandwidth]);
    }, 800);
    return () => clearInterval(id);
  }, [fps, simMs, syncLatency, bandwidth]);

  const animFps = useAnimatedValue(fps);
  const animSim = useAnimatedValue(simMs);
  const animVram = useAnimatedValue(vram);
  const animLat = useAnimatedValue(syncLatency);

  const METRIC_CARDS = [
    { label: "UI Framerate", value: animFps.toFixed(1), unit: "fps", icon: Activity, color: "#60a5fa", history: fpsHistory, good: animFps > 50, trend: "+2.1" },
    { label: "Sim Time",     value: animSim.toFixed(1), unit: "ms",  icon: Zap,      color: "#a78bfa", history: simHistory, good: animSim < 8,  trend: "-0.3" },
    { label: "VRAM Usage",   value: animVram.toFixed(1), unit: "/ 9.8 GiB", icon: Cpu, color: "#f59e0b", history: fpsHistory.map(v => v / 10), good: animVram < 8, trend: "+0.2" },
    { label: "Sync Latency", value: animLat.toFixed(0), unit: "ms",  icon: Globe,    color: "#34d399", history: latHistory, good: animLat < 25, trend: "-4" },
  ];

  const DEVICE_METRICS = DEVICES.map(d => ({
    ...d,
    fps:     Math.round(40 + Math.random() * 30),
    cpu:     Math.round(20 + Math.random() * 60),
    gpu:     Math.round(30 + Math.random() * 60),
    mem:     Math.round(30 + Math.random() * 50),
    latency: Math.round(8 + Math.random() * 30),
    synced:  Math.random() > 0.2,
  }));

  return (
    <div className="min-h-screen bg-[#08080F] text-white p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Spatial Analytics
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Live performance metrics · Scene profiling · Network telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time range */}
          <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden text-xs">
            {["15m","1h","6h","24h"].map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 transition-colors ${timeRange === r ? "bg-blue-500/20 text-blue-300" : "text-gray-400 hover:text-gray-200"}`}>
                {r}
              </button>
            ))}
          </div>
          {/* Device filter */}
          <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 outline-none">
            <option value="all">All Devices</option>
            {DEVICES.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
          </select>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400 font-mono">LIVE</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/8">
        {(["overview","scene","network","events"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? "border-blue-400 text-blue-300" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {METRIC_CARDS.map(m => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <m.icon className="w-4 h-4" style={{ color: m.color }} />
                    <span className="text-xs text-gray-400">{m.label}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${m.good ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {m.trend}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold font-mono" style={{ color: m.color }}>{m.value}</span>
                    <span className="text-xs text-gray-500 ml-1">{m.unit}</span>
                  </div>
                  <Sparkline data={m.history} color={m.color} />
                </div>
                <MiniBar value={parseFloat(m.value)} max={m.label === "UI Framerate" ? 72 : m.label === "VRAM Usage" ? 9.8 : m.label === "Sim Time" ? 16 : 50} color={m.color} />
              </motion.div>
            ))}
          </div>

          {/* Device performance grid */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Per-Device Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-white/8">
                    <th className="text-left pb-2 font-medium">Device</th>
                    <th className="text-right pb-2 font-medium">FPS</th>
                    <th className="text-right pb-2 font-medium">CPU</th>
                    <th className="text-right pb-2 font-medium">GPU</th>
                    <th className="text-right pb-2 font-medium">MEM</th>
                    <th className="text-right pb-2 font-medium">Latency</th>
                    <th className="text-right pb-2 font-medium">Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {DEVICE_METRICS.map(d => (
                    <tr key={d.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-2.5 flex items-center gap-2">
                        <span>{d.icon}</span>
                        <div>
                          <p className="text-gray-200 font-medium">{d.name}</p>
                          <p className="text-gray-600 text-[10px]">{d.platform}</p>
                        </div>
                      </td>
                      <td className="text-right py-2.5">
                        <span className={`font-mono ${d.fps > 50 ? "text-green-400" : d.fps > 30 ? "text-amber-400" : "text-red-400"}`}>{d.fps}</span>
                      </td>
                      <td className="text-right py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${d.cpu}%` }} />
                          </div>
                          <span className="font-mono text-gray-300 w-8">{d.cpu}%</span>
                        </div>
                      </td>
                      <td className="text-right py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-400 rounded-full" style={{ width: `${d.gpu}%` }} />
                          </div>
                          <span className="font-mono text-gray-300 w-8">{d.gpu}%</span>
                        </div>
                      </td>
                      <td className="text-right py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${d.mem}%` }} />
                          </div>
                          <span className="font-mono text-gray-300 w-8">{d.mem}%</span>
                        </div>
                      </td>
                      <td className="text-right py-2.5 font-mono">
                        <span className={d.latency < 20 ? "text-green-400" : d.latency < 35 ? "text-amber-400" : "text-red-400"}>{d.latency}ms</span>
                      </td>
                      <td className="text-right py-2.5">
                        {d.synced
                          ? <span className="text-green-400 flex items-center justify-end gap-1"><CheckCircle className="w-3 h-3" /> Synced</span>
                          : <span className="text-amber-400 flex items-center justify-end gap-1"><AlertTriangle className="w-3 h-3" /> Pending</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simulation stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Bounds",      value: "128×128×384", icon: Box,      color: "#60a5fa" },
              { label: "Voxels",      value: "6.3 Mvox",    icon: Layers,   color: "#a78bfa" },
              { label: "Sim Speed",   value: "947 Mvox/s",  icon: Zap,      color: "#34d399" },
              { label: "Resolution",  value: "1439×889",    icon: Eye,      color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-3 flex items-center gap-3">
                <s.icon className="w-5 h-5 flex-shrink-0" style={{ color: s.color }} />
                <div>
                  <p className="text-[10px] text-gray-500">{s.label}</p>
                  <p className="text-sm font-mono font-bold text-white">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCENE TAB */}
      {tab === "scene" && (
        <div className="space-y-4">
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Triangle className="w-4 h-4 text-blue-400" /> Scene Object Profiler
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-white/8">
                    <th className="text-left pb-2 font-medium">Object</th>
                    <th className="text-right pb-2 font-medium">Vertices</th>
                    <th className="text-right pb-2 font-medium">Triangles</th>
                    <th className="text-right pb-2 font-medium">Draw Calls</th>
                    <th className="text-right pb-2 font-medium">Render (ms)</th>
                    <th className="text-right pb-2 font-medium">% Budget</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {SCENE_OBJECTS.map(obj => {
                    const pct = (obj.ms / 16.67) * 100;
                    return (
                      <tr key={obj.name} className="hover:bg-white/3 transition-colors">
                        <td className="py-2.5 text-gray-200 font-medium">{obj.name}</td>
                        <td className="text-right py-2.5 font-mono text-gray-300">{obj.verts.toLocaleString()}</td>
                        <td className="text-right py-2.5 font-mono text-gray-300">{obj.tris.toLocaleString()}</td>
                        <td className="text-right py-2.5 font-mono text-gray-300">{obj.drawCalls}</td>
                        <td className="text-right py-2.5 font-mono">
                          <span className={obj.ms > 5 ? "text-amber-400" : "text-green-400"}>{obj.ms.toFixed(1)}</span>
                        </td>
                        <td className="text-right py-2.5">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct > 40 ? "bg-amber-400" : "bg-blue-400"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                            <span className="font-mono text-gray-400 w-8">{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/8 text-gray-400 font-medium">
                    <td className="pt-2">Total</td>
                    <td className="text-right pt-2 font-mono">{SCENE_OBJECTS.reduce((a,o) => a+o.verts,0).toLocaleString()}</td>
                    <td className="text-right pt-2 font-mono">{SCENE_OBJECTS.reduce((a,o) => a+o.tris,0).toLocaleString()}</td>
                    <td className="text-right pt-2 font-mono">{SCENE_OBJECTS.reduce((a,o) => a+o.drawCalls,0)}</td>
                    <td className="text-right pt-2 font-mono text-amber-400">{SCENE_OBJECTS.reduce((a,o) => a+o.ms,0).toFixed(1)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Render budget heatmap */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Render Budget Heatmap (16.67ms frame)</h3>
            <div className="flex gap-1 h-12 rounded-lg overflow-hidden">
              {SCENE_OBJECTS.filter(o => o.ms > 0).map(obj => {
                const pct = (obj.ms / 16.67) * 100;
                const hue = pct > 40 ? "#f59e0b" : pct > 20 ? "#60a5fa" : "#34d399";
                return (
                  <div key={obj.name} className="relative group flex-shrink-0 h-full rounded cursor-pointer transition-opacity hover:opacity-80"
                    style={{ width: `${pct}%`, backgroundColor: hue }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-black/70 truncate px-0.5">{pct > 10 ? obj.name.split(" ")[0] : ""}</span>
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 border border-white/10 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {obj.name}: {obj.ms.toFixed(1)}ms ({pct.toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
              <div className="flex-1 h-full bg-white/5 rounded" />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>0ms</span><span>8.3ms (50%)</span><span>16.67ms (100%)</span>
            </div>
          </div>
        </div>
      )}

      {/* NETWORK TAB */}
      {tab === "network" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bandwidth chart */}
            <div className="bg-white/3 border border-white/8 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" /> Sync Bandwidth
              </h3>
              <div className="flex items-end gap-1 h-24">
                {bwHistory.map((v, i) => {
                  const h = Math.max(4, (v / 5) * 96);
                  return (
                    <div key={i} className="flex-1 rounded-sm transition-all duration-300"
                      style={{ height: h, backgroundColor: i === bwHistory.length - 1 ? "#34d399" : "#34d39940" }} />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>{timeRange} ago</span>
                <span className="text-green-400 font-mono">{bandwidth.toFixed(2)} GB/s now</span>
                <span>now</span>
              </div>
            </div>

            {/* Latency chart */}
            <div className="bg-white/3 border border-white/8 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" /> Sync Latency
              </h3>
              <div className="flex items-end gap-1 h-24">
                {latHistory.map((v, i) => {
                  const h = Math.max(4, (v / 50) * 96);
                  const color = v < 20 ? "#34d399" : v < 35 ? "#f59e0b" : "#f87171";
                  return (
                    <div key={i} className="flex-1 rounded-sm transition-all duration-300"
                      style={{ height: h, backgroundColor: i === latHistory.length - 1 ? color : color + "40" }} />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>{timeRange} ago</span>
                <span className="text-blue-400 font-mono">{syncLatency.toFixed(0)}ms now</span>
                <span>now</span>
              </div>
            </div>
          </div>

          {/* Protocol breakdown */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Protocol Breakdown</h3>
            <div className="space-y-3">
              {[
                { proto: "WebSocket (CRDT)",   pct: 62, bytes: "1.18 GB/s", color: "#60a5fa" },
                { proto: "WebRTC (FaceTime)",  pct: 24, bytes: "0.46 GB/s", color: "#a78bfa" },
                { proto: "REST (Assets)",      pct: 8,  bytes: "0.15 GB/s", color: "#34d399" },
                { proto: "gRPC (AI Proxy)",    pct: 6,  bytes: "0.11 GB/s", color: "#f59e0b" },
              ].map(p => (
                <div key={p.proto} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">{p.proto}</span>
                    <span className="font-mono text-gray-400">{p.bytes} ({p.pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: p.color }}
                      initial={{ width: 0 }} animate={{ width: `${p.pct}%` }} transition={{ duration: 1, ease: "easeOut" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EVENTS TAB */}
      {tab === "events" && (
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Live Event Stream
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-green-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Streaming
            </div>
          </div>
          <div className="space-y-1.5 font-mono text-xs max-h-96 overflow-y-auto">
            {EVENTS.map((e, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-3 px-3 py-2 rounded-lg ${e.ok ? "bg-white/3" : "bg-amber-500/5 border border-amber-500/10"}`}>
                <span className="text-gray-600 flex-shrink-0">{e.time}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] flex-shrink-0 ${
                  e.type === "sync" ? "bg-blue-500/20 text-blue-300" :
                  e.type === "render" ? "bg-purple-500/20 text-purple-300" :
                  e.type === "warn" ? "bg-amber-500/20 text-amber-300" :
                  e.type === "collab" ? "bg-green-500/20 text-green-300" :
                  "bg-pink-500/20 text-pink-300"
                }`}>{e.type}</span>
                <span className="flex-shrink-0">{e.device}</span>
                <span className={`flex-1 ${e.ok ? "text-gray-300" : "text-amber-300"}`}>{e.msg}</span>
                {e.ok
                  ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                  : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                }
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
