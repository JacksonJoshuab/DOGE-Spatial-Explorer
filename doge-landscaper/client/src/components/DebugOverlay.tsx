/*
 * DOGE-LANDSCAPER — Live Debug Overlay
 * Design: Spatial Glass Command Deck
 * Shows live Nvidia Jetson Orin telemetry from WebSocket simulation
 * Toggle with the Bug icon in TopNav
 */

import { motion } from "framer-motion";
import { Bug, Cpu, Wifi, Activity, Eye, Zap, Navigation, Wind } from "lucide-react";
import type { TelemetryData } from "@/hooks/useTelemetry";

interface DebugOverlayProps {
  telemetry: TelemetryData;
  wsStatus: "connecting" | "connected" | "simulated" | "error";
}

function DebugRow({ label, value, highlight }: { label: string; value: string; highlight?: "green" | "yellow" | "red" | "cyan" | "blue" }) {
  const colorMap = {
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    cyan: "text-cyan-400",
    blue: "text-blue-400",
  };
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[9px] text-white/40 flex-shrink-0">{label}</span>
      <span className={`text-[9px] font-mono text-right ${highlight ? colorMap[highlight] : "text-white/70"}`}>
        {value}
      </span>
    </div>
  );
}

function DebugSection({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-2.5 animate-hud-flicker">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={color}>{icon}</span>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${color}`}>{title}</span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function miniBar(value: number, max: number = 100, color: string = "bg-cyan-400") {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="inline-flex items-center gap-1">
      <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-mono text-white/70">{Math.round(value)}%</span>
    </div>
  );
}

export default function DebugOverlay({ telemetry: t, wsStatus }: DebugOverlayProps) {
  const wsColor = wsStatus === "connected" ? "text-green-400" : wsStatus === "simulated" ? "text-yellow-400" : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute top-12 left-2 z-30 w-72 space-y-2 pointer-events-none"
    >
      {/* Connection status header */}
      <div className="glass-gold rounded-lg px-2.5 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bug size={10} className="text-yellow-400" />
          <span className="text-[9px] text-yellow-400 font-mono font-bold">DEBUG MODE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${wsStatus === "simulated" ? "bg-yellow-400" : wsStatus === "connected" ? "bg-green-400" : "bg-red-400"} animate-pulse`} />
          <span className={`text-[9px] font-mono font-bold ${wsColor}`}>
            WS:{wsStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* System — Jetson Orin AGX */}
      <DebugSection icon={<Cpu size={10} />} title="JETSON ORIN AGX" color="text-cyan-400">
        <DebugRow label="CPU Usage" value="" />
        <div className="flex justify-end mb-0.5">{miniBar(t.cpuUsage, 100, "bg-cyan-400")}</div>
        <DebugRow label="GPU Usage" value="" />
        <div className="flex justify-end mb-0.5">{miniBar(t.gpuUsage, 100, "bg-purple-400")}</div>
        <DebugRow label="RAM" value={`${t.ramUsed.toFixed(1)} / ${t.ramTotal}GB`} highlight="cyan" />
        <DebugRow label="CPU Temp" value={`${Math.round(t.cpuTemp)}°C`} highlight={t.cpuTemp > 70 ? "red" : t.cpuTemp > 60 ? "yellow" : "green"} />
        <DebugRow label="GPU Temp" value={`${Math.round(t.gpuTemp)}°C`} highlight={t.gpuTemp > 75 ? "red" : t.gpuTemp > 65 ? "yellow" : "green"} />
        <DebugRow label="Power Draw" value={`${t.powerDraw.toFixed(1)}W`} highlight="cyan" />
        <DebugRow label="Uptime" value={t.uptime} />
      </DebugSection>

      {/* Sensors */}
      <DebugSection icon={<Activity size={10} />} title="SENSORS" color="text-green-400">
        <DebugRow label="LiDAR Points" value={t.lidarPoints.toLocaleString()} highlight="green" />
        <DebugRow label="LiDAR Rate" value={`${t.lidarHz} Hz`} highlight="green" />
        <DebugRow label="Camera FPS" value={`${t.cameraFps} fps`} highlight={t.cameraFps >= 28 ? "green" : "yellow"} />
        <DebugRow label="IMU Roll" value={`${t.imuRoll.toFixed(2)}°`} />
        <DebugRow label="IMU Pitch" value={`${t.imuPitch.toFixed(2)}°`} />
        <DebugRow label="IMU Yaw" value={`${t.imuYaw.toFixed(1)}°`} highlight="cyan" />
        <DebugRow label="Motor Temp" value={`${Math.round(t.motorTemp)}°C`} highlight={t.motorTemp > 55 ? "yellow" : "green"} />
      </DebugSection>

      {/* GPS + Motion */}
      <DebugSection icon={<Navigation size={10} />} title="GPS + MOTION" color="text-blue-400">
        <DebugRow label="Latitude" value={t.lat.toFixed(6)} highlight="blue" />
        <DebugRow label="Longitude" value={t.lon.toFixed(6)} highlight="blue" />
        <DebugRow label="Accuracy" value={`±${t.gpsAccuracy.toFixed(1)}m`} highlight={t.gpsAccuracy < 3 ? "green" : "yellow"} />
        <DebugRow label="Heading" value={`${Math.round(t.heading)}°`} />
        <DebugRow label="Speed" value={`${t.speed.toFixed(2)} m/s`} />
        <DebugRow label="Wind" value={`${t.windSpeed.toFixed(1)} mph @ ${Math.round(t.windDir)}°`} />
        <div className="mt-1 pt-1 border-t border-white/10">
          <p className="text-[9px] text-white/30 mb-0.5">Soil Moisture (4 zones)</p>
          <div className="flex gap-1">
            {t.soilMoisture.map((m, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className="w-6 h-8 bg-white/10 rounded-sm overflow-hidden flex flex-col-reverse">
                  <div className="bg-blue-400 rounded-sm transition-all duration-500" style={{ height: `${m}%` }} />
                </div>
                <span className="text-[8px] text-white/40">Z{i+1}</span>
              </div>
            ))}
          </div>
        </div>
      </DebugSection>

      {/* Network */}
      <DebugSection icon={<Wifi size={10} />} title="NETWORK" color="text-blue-400">
        <DebugRow label="Wi-Fi RSSI" value={`${t.wifiRssi} dBm`} highlight={t.wifiRssi > -55 ? "green" : t.wifiRssi > -70 ? "yellow" : "red"} />
        <DebugRow label="Latency" value={`${t.latencyMs} ms`} highlight={t.latencyMs < 30 ? "green" : t.latencyMs < 80 ? "yellow" : "red"} />
        <DebugRow label="Upload" value={`${t.uploadMbps.toFixed(1)} Mbps`} highlight="cyan" />
        <DebugRow label="Download" value={`${t.downloadMbps.toFixed(1)} Mbps`} highlight="cyan" />
        <DebugRow label="Continuity" value={t.continuityStatus.toUpperCase()} highlight={t.continuityStatus === "connected" ? "green" : "yellow"} />
        <DebugRow label="visionOS" value={t.visionOsStatus.toUpperCase()} highlight={t.visionOsStatus === "connected" ? "green" : "yellow"} />
        <DebugRow label="Packets" value={t.packetCount.toLocaleString()} />
      </DebugSection>

      {/* AI Inference */}
      <DebugSection icon={<Eye size={10} />} title="AI INFERENCE" color="text-yellow-400">
        <DebugRow label="Objects Detected" value={String(t.objectsDetected)} highlight="yellow" />
        <DebugRow label="Weeds ID'd" value={String(t.weedsIdentified)} highlight="red" />
        <DebugRow label="Inference Time" value={`${t.inferenceMs} ms`} highlight={t.inferenceMs < 50 ? "green" : t.inferenceMs < 70 ? "yellow" : "red"} />
        <DebugRow label="Confidence" value={`${t.aiConfidence.toFixed(1)}%`} highlight={t.aiConfidence > 90 ? "green" : t.aiConfidence > 75 ? "yellow" : "red"} />
      </DebugSection>

      {/* Power */}
      <DebugSection icon={<Zap size={10} />} title="POWER" color="text-yellow-400">
        <DebugRow label="Battery" value="" />
        <div className="flex justify-end mb-0.5">
          {miniBar(t.batteryLevel, 100, t.batteryLevel > 50 ? "bg-green-400" : t.batteryLevel > 20 ? "bg-yellow-400" : "bg-red-400")}
        </div>
        <DebugRow label="Voltage" value={`${t.batteryVoltage.toFixed(1)}V`} highlight="cyan" />
        <DebugRow label="Draw" value={`${t.powerDraw.toFixed(1)}W`} />
      </DebugSection>

      {/* Packet counter */}
      <div className="glass rounded-lg px-2 py-1 text-center">
        <span className="text-[8px] font-mono text-white/30">
          PKT #{t.packetCount.toLocaleString()} · {t.lastPacket?.toLocaleTimeString("en-US", { hour12: false }) ?? "--:--:--"}
        </span>
      </div>
    </motion.div>
  );
}
