import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Monitor, Smartphone, Eye, RefreshCw, Maximize2, Download, Zap, Wifi, Battery, Cpu } from "lucide-react";

const DEVICES = [
  {
    id: "visionpro",
    name: "Apple Vision Pro",
    icon: "👓",
    platform: "visionOS 3.0",
    resolution: "4K per eye",
    fov: "100°",
    refresh: "100Hz",
    battery: 78,
    latency: 12,
    connected: true,
    frameColor: "#1C1C2E",
    frameAccent: "#4A90D9",
    aspectRatio: "4/3",
    width: 320,
    height: 240,
  },
  {
    id: "quest3",
    name: "Meta Quest 3",
    icon: "🥽",
    platform: "Meta XR OS",
    resolution: "2064×2208",
    fov: "110°",
    refresh: "120Hz",
    battery: 62,
    latency: 18,
    connected: true,
    frameColor: "#1A1A2A",
    frameAccent: "#00B4D8",
    aspectRatio: "4/3",
    width: 320,
    height: 240,
  },
  {
    id: "ipad",
    name: "iPad Pro M4",
    icon: "📱",
    platform: "iPadOS 18",
    resolution: "2752×2064",
    fov: "AR Camera",
    refresh: "120Hz",
    battery: 91,
    latency: 8,
    connected: true,
    frameColor: "#1E1E2E",
    frameAccent: "#A8D8A8",
    aspectRatio: "4/3",
    width: 260,
    height: 340,
  },
  {
    id: "appletv",
    name: "Apple TV 4K",
    icon: "📺",
    platform: "tvOS 18",
    resolution: "4K HDR",
    fov: "Display",
    refresh: "120Hz",
    battery: 100,
    latency: 5,
    connected: true,
    frameColor: "#111118",
    frameAccent: "#888888",
    aspectRatio: "16/9",
    width: 380,
    height: 214,
  },
  {
    id: "blender",
    name: "Blender 4.3",
    icon: "🔷",
    platform: "Windows 11",
    resolution: "1440×889",
    fov: "Perspective",
    refresh: "56Hz",
    battery: 100,
    latency: 22,
    connected: true,
    frameColor: "#0D0D14",
    frameAccent: "#E87D0D",
    aspectRatio: "16/9",
    width: 380,
    height: 214,
  },
  {
    id: "hololens",
    name: "HoloLens 2",
    icon: "🔮",
    platform: "Windows Mixed Reality",
    resolution: "2048×1080",
    fov: "52°",
    refresh: "60Hz",
    battery: 45,
    latency: 35,
    connected: false,
    frameColor: "#1A1A2A",
    frameAccent: "#0078D4",
    aspectRatio: "4/3",
    width: 320,
    height: 240,
  },
];

function DeviceFrame({ device, tick }: { device: typeof DEVICES[0]; tick: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !device.connected) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = device.width;
    canvas.height = device.height;

    const t = tick * 0.05;
    const W = canvas.width, H = canvas.height;

    // Background
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Bounding box (Z-Pinch)
    const bx = W * 0.2, by = H * 0.05, bw = W * 0.6, bh = H * 0.9;
    ctx.strokeStyle = "rgba(255,100,100,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);

    // Plasma column
    const cx = W / 2;
    for (let y = by + 5; y < by + bh - 5; y += 3) {
      const progress = (y - by) / bh;
      const pinch = 1 - 0.6 * Math.sin(progress * Math.PI);
      const r = bw * 0.08 * pinch;
      const wobble = Math.sin(progress * 8 + t * 3) * 2;
      const alpha = 0.4 + 0.4 * Math.sin(progress * 6 + t * 2);
      const grd = ctx.createRadialGradient(cx + wobble, y, 0, cx + wobble, y, r * 3);
      grd.addColorStop(0, `rgba(150,100,255,${alpha})`);
      grd.addColorStop(0.5, `rgba(80,50,200,${alpha * 0.5})`);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx + wobble, y, r * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Coordinate axes
    ctx.strokeStyle = "rgba(255,50,50,0.7)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(20, H - 20); ctx.lineTo(45, H - 20); ctx.stroke();
    ctx.strokeStyle = "rgba(50,255,50,0.7)";
    ctx.beginPath(); ctx.moveTo(20, H - 20); ctx.lineTo(20, H - 45); ctx.stroke();
    ctx.strokeStyle = "rgba(50,100,255,0.7)";
    ctx.beginPath(); ctx.moveTo(20, H - 20); ctx.lineTo(35, H - 35); ctx.stroke();

    // Device-specific overlay
    if (device.id === "visionpro") {
      // EyeSight glow
      const eyeGrd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W/3);
      eyeGrd.addColorStop(0, "rgba(100,180,255,0.05)");
      eyeGrd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = eyeGrd;
      ctx.fillRect(0, 0, W, H);
    }

    if (device.id === "blender") {
      // Blender UI chrome
      ctx.fillStyle = "rgba(30,30,40,0.9)";
      ctx.fillRect(0, 0, W, 18);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "8px monospace";
      ctx.fillText("Blender 4.3 — Z-Pinch Plasma Session", 6, 12);
    }

    // Latency indicator
    const latColor = device.latency < 15 ? "#4CAF50" : device.latency < 30 ? "#FFC107" : "#F44336";
    ctx.fillStyle = latColor;
    ctx.beginPath();
    ctx.arc(W - 10, 10, 4, 0, Math.PI * 2);
    ctx.fill();

  }, [tick, device]);

  return (
    <div className="relative" style={{ width: device.width, height: device.height }}>
      {/* Device frame */}
      <div
        className="absolute inset-0 rounded-xl border-2 overflow-hidden"
        style={{ borderColor: device.connected ? device.frameAccent : "#333", background: device.frameColor }}
      >
        {device.connected ? (
          <canvas ref={canvasRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl mb-2">{device.icon}</p>
              <p className="text-xs text-gray-600">Disconnected</p>
            </div>
          </div>
        )}
      </div>
      {/* Device label */}
      <div className="absolute -bottom-7 left-0 right-0 flex items-center justify-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${device.connected ? "bg-green-400" : "bg-gray-600"}`} />
        <span className="text-[10px] text-gray-400">{device.name}</span>
      </div>
    </div>
  );
}

export default function XRPreview() {
  const [tick, setTick] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0]);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [layout, setLayout] = useState<"grid" | "focus">("grid");

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(interval);
  }, []);

  const connectedDevices = DEVICES.filter(d => d.connected);

  return (
    <div className="h-full flex flex-col bg-[#08080F] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-400" />
            XR Preview
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Live multi-device XR preview — see your scene on every connected device simultaneously</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400">{connectedDevices.length} devices live</span>
          </div>
          <button onClick={() => setSyncEnabled(s => !s)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all border ${
            syncEnabled ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300" : "bg-white/5 border-white/10 text-gray-400"
          }`}>
            <RefreshCw className={`w-3.5 h-3.5 ${syncEnabled ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
            {syncEnabled ? "Sync On" : "Sync Off"}
          </button>
          <button onClick={() => setLayout(l => l === "grid" ? "focus" : "grid")} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/8 transition-all">
            <Maximize2 className="w-3.5 h-3.5" />
            {layout === "grid" ? "Focus" : "Grid"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Device list */}
        <div className="w-52 flex-shrink-0 border-r border-white/8 overflow-y-auto">
          <div className="px-3 py-3 border-b border-white/8">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Devices ({DEVICES.length})</p>
          </div>
          <div className="p-2 space-y-1">
            {DEVICES.map(d => (
              <div
                key={d.id}
                onClick={() => setSelectedDevice(d)}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg cursor-pointer transition-all ${
                  selectedDevice.id === d.id ? "bg-indigo-500/12 border border-indigo-500/25" : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <span className="text-lg">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">{d.name}</p>
                  <p className="text-[9px] text-gray-600">{d.platform}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${d.connected ? "bg-green-400" : "bg-gray-600"}`} />
                  <span className={`text-[9px] font-mono ${d.latency < 15 ? "text-green-400" : d.latency < 30 ? "text-amber-400" : "text-red-400"}`}>{d.latency}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center — Multi-device preview grid */}
        <div className="flex-1 overflow-auto bg-[#05050A] p-8">
          {layout === "grid" ? (
            <div className="flex flex-wrap gap-12 justify-center items-start pb-12">
              {connectedDevices.map(device => (
                <DeviceFrame key={device.id} device={device} tick={tick} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <DeviceFrame device={selectedDevice} tick={tick} />
            </div>
          )}
        </div>

        {/* Right — Device details */}
        <div className="w-56 flex-shrink-0 border-l border-white/8 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
            <span className="text-lg">{selectedDevice.icon}</span>
            <p className="text-xs font-medium text-gray-300 truncate">{selectedDevice.name}</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Specs */}
            <div className="space-y-2">
              {[
                { label: "Platform",    value: selectedDevice.platform },
                { label: "Resolution",  value: selectedDevice.resolution },
                { label: "FOV",         value: selectedDevice.fov },
                { label: "Refresh",     value: selectedDevice.refresh },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-[10px] text-gray-500">{label}</span>
                  <span className="text-[10px] text-gray-300 font-mono">{value}</span>
                </div>
              ))}
            </div>

            {/* Live metrics */}
            <div className="space-y-3">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">Live Metrics</p>
              {[
                { label: "Latency", value: `${selectedDevice.latency}ms`, icon: <Wifi className="w-3 h-3" />, color: selectedDevice.latency < 15 ? "text-green-400" : selectedDevice.latency < 30 ? "text-amber-400" : "text-red-400", pct: Math.min(100, selectedDevice.latency * 2) },
                { label: "Battery", value: `${selectedDevice.battery}%`, icon: <Battery className="w-3 h-3" />, color: selectedDevice.battery > 60 ? "text-green-400" : selectedDevice.battery > 30 ? "text-amber-400" : "text-red-400", pct: selectedDevice.battery },
              ].map(({ label, value, icon, color, pct }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-gray-500">{icon}<span className="text-[10px]">{label}</span></div>
                    <span className={`text-[10px] font-mono ${color}`}>{value}</span>
                  </div>
                  <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 60 ? "#4CAF50" : pct > 30 ? "#FFC107" : "#F44336" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-1.5">
              <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 hover:bg-indigo-500/15 transition-all">
                <Zap className="w-3.5 h-3.5" />
                Push Scene
              </button>
              <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/8 transition-all">
                <Download className="w-3.5 h-3.5" />
                Capture Frame
              </button>
              <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/8 transition-all">
                <Monitor className="w-3.5 h-3.5" />
                Mirror Display
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
