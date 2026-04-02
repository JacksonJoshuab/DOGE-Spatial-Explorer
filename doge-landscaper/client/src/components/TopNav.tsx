/* TopNav — Floating glass pill navigation bar */
import { motion } from "framer-motion";
import { Wifi, Battery, Thermometer, Bug, Camera, CameraOff, Cpu, Radio } from "lucide-react";
import type { RobotPersona } from "@/lib/data";

interface TopNavProps {
  persona: RobotPersona;
  batteryLevel: number;
  signalStrength: number;
  robotStatus: "idle" | "working" | "paused" | "error";
  debugVisible: boolean;
  onToggleDebug: () => void;
  onToggleStream: () => void;
  isStreaming: boolean;
}

const STATUS_COLORS = {
  idle: "text-white/60",
  working: "text-green-400",
  paused: "text-yellow-400",
  error: "text-red-400",
};

const STATUS_LABELS = {
  idle: "IDLE",
  working: "ACTIVE",
  paused: "PAUSED",
  error: "ERROR",
};

export default function TopNav({
  persona, batteryLevel, signalStrength, robotStatus,
  debugVisible, onToggleDebug, onToggleStream, isStreaming
}: TopNavProps) {
  const batteryColor = batteryLevel > 50 ? "text-green-400" : batteryLevel > 25 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between"
      style={{
        background: 'oklch(0.09 0.015 260 / 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid oklch(1 0 0 / 0.1)',
      }}
    >
      {/* Left: Brand + Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg glass-green flex items-center justify-center">
            <span className="text-sm">🤖</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">DOGE-Landscaper</span>
              <span className="text-[10px] glass text-white/50 px-1.5 py-0.5 rounded-full border border-white/10">v2.7</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-status-pulse ${
                robotStatus === "working" ? "bg-green-400" :
                robotStatus === "paused" ? "bg-yellow-400" :
                robotStatus === "error" ? "bg-red-400" : "bg-white/40"
              }`} />
              <span className={`text-[10px] font-mono ${STATUS_COLORS[robotStatus]}`}>
                {STATUS_LABELS[robotStatus]}
              </span>
              <span className="text-[10px] text-white/30">|</span>
              <span className="text-[10px] text-white/50 font-mono">Wilton, IA 52776</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Robot Name */}
      <div className="hidden md:flex items-center gap-2">
        <div className="glass rounded-full px-4 py-1.5 flex items-center gap-2">
          <span className="text-xs font-semibold text-yellow-300">{persona.name}</span>
          <span className="text-[10px] text-white/40">·</span>
          <span className="text-[10px] text-white/60">{persona.mood}</span>
        </div>
      </div>

      {/* Right: Status indicators + controls */}
      <div className="flex items-center gap-2">
        {/* Signal */}
        <div className="flex items-center gap-1 glass rounded-lg px-2 py-1">
          <Wifi size={12} className={signalStrength > 70 ? "text-green-400" : "text-yellow-400"} />
          <span className="text-[10px] telemetry">{Math.round(signalStrength)}%</span>
        </div>

        {/* Battery */}
        <div className="flex items-center gap-1 glass rounded-lg px-2 py-1">
          <Battery size={12} className={batteryColor} />
          <span className={`text-[10px] telemetry ${batteryColor}`}>{Math.round(batteryLevel)}%</span>
        </div>

        {/* iOS/visionOS indicators */}
        <div className="hidden sm:flex items-center gap-1 glass rounded-lg px-2 py-1">
          <Radio size={12} className="text-blue-400" />
          <span className="text-[10px] text-blue-300 font-mono">iOS 27</span>
        </div>

        {/* Stream toggle */}
        <motion.button
          onClick={onToggleStream}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${
            isStreaming ? "glass-green text-green-300 border border-green-400/30" : "glass text-white/50"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isStreaming ? "Pause stream" : "Resume stream"}
        >
          <Camera size={12} />
          <span className="hidden sm:inline">{isStreaming ? "LIVE" : "PAUSED"}</span>
        </motion.button>

        {/* Debug toggle */}
        <motion.button
          onClick={onToggleDebug}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${
            debugVisible ? "glass-gold text-yellow-300 border border-yellow-400/30" : "glass text-white/50 hover:text-white/80"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Toggle debug overlay"
        >
          <Bug size={12} />
          <span className="hidden sm:inline">DEBUG</span>
        </motion.button>
      </div>
    </div>
  );
}
