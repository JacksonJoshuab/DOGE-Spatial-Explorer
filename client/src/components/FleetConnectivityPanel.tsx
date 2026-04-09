/*
 * DOGE-LANDSCAPER — Fleet Connectivity Panel v1
 * Design: Spatial Glass Command Deck
 * Features:
 *   - Toggle icons for Drone, Humanoid Robot, Vehicle, Accessory agents
 *   - Each agent: connection state, battery %, signal strength, elevation/volume
 *   - Mission task list updates to show which agents are assigned
 *   - OSI layer connectivity status per agent type
 *   - Last-seen timestamp and GPS coordinates
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ── Agent type definitions ────────────────────────────────────────────────────
export type AgentType = "drone" | "humanoid" | "vehicle" | "accessory";
export type AgentStatus = "online" | "offline" | "standby" | "error";

export interface FleetAgent {
  id: string;
  type: AgentType;
  name: string;
  model: string;
  status: AgentStatus;
  battery: number;        // 0–100
  signal: number;         // 0–100
  elevation: number;      // meters AGL (above ground level)
  volume: string;         // operational volume description
  lat: number;
  lon: number;
  lastSeen: string;
  assignedTask: string | null;
  osiLayer: string;       // primary OSI layer for comms
  ipAddress: string;
  firmware: string;
  serialNumber: string;
}

const INITIAL_FLEET: FleetAgent[] = [
  {
    id: "drone-1",
    type: "drone",
    name: "Scout-1",
    model: "DJI Matrice 30T",
    status: "online",
    battery: 87,
    signal: 94,
    elevation: 12.5,
    volume: "0–30m AGL · 50m radius",
    lat: 41.57688,
    lon: -91.26066,
    lastSeen: new Date().toISOString(),
    assignedTask: "morning-survey",
    osiLayer: "Layer 2 (Data Link) · 5.8GHz",
    ipAddress: "192.168.4.101",
    firmware: "v04.01.0040",
    serialNumber: "DJI-M30T-8842A",
  },
  {
    id: "drone-2",
    type: "drone",
    name: "Spray-Drone",
    model: "DJI Agras T40",
    status: "standby",
    battery: 62,
    signal: 78,
    elevation: 0,
    volume: "0–5m AGL · spray swath 9m",
    lat: 41.57681,
    lon: -91.26078,
    lastSeen: new Date(Date.now() - 300000).toISOString(),
    assignedTask: "weed-feed-apply",
    osiLayer: "Layer 2 (Data Link) · 2.4GHz",
    ipAddress: "192.168.4.102",
    firmware: "v03.02.0018",
    serialNumber: "DJI-T40-2291C",
  },
  {
    id: "robot-1",
    type: "humanoid",
    name: "Chip McHaymaker",
    model: "NVIDIA Jetson Orin AGX",
    status: "online",
    battery: 78,
    signal: 99,
    elevation: 0,
    volume: "Ground level · 1.8m height",
    lat: 41.57683,
    lon: -91.26073,
    lastSeen: new Date().toISOString(),
    assignedTask: "mow-main",
    osiLayer: "Layer 3 (Network) · WiFi 6E",
    ipAddress: "192.168.4.10",
    firmware: "JetPack 6.1",
    serialNumber: "NV-ORIN-AGX-7741",
  },
  {
    id: "vehicle-1",
    type: "vehicle",
    name: "Hauler-1",
    model: "Husqvarna CEORA",
    status: "standby",
    battery: 91,
    signal: 85,
    elevation: 0,
    volume: "Ground level · 0.6m height",
    lat: 41.57678,
    lon: -91.26083,
    lastSeen: new Date(Date.now() - 120000).toISOString(),
    assignedTask: "edge-beds",
    osiLayer: "Layer 2 (Data Link) · BLE 5.3",
    ipAddress: "192.168.4.201",
    firmware: "v2.4.1",
    serialNumber: "HUS-CEORA-0044",
  },
  {
    id: "accessory-1",
    type: "accessory",
    name: "Weather Station",
    model: "Davis Vantage Pro 2",
    status: "online",
    battery: 100,
    signal: 100,
    elevation: 2.1,
    volume: "Fixed mount · 2.1m AGL",
    lat: 41.57695,
    lon: -91.26058,
    lastSeen: new Date().toISOString(),
    assignedTask: null,
    osiLayer: "Layer 1 (Physical) · 433MHz",
    ipAddress: "192.168.4.50",
    firmware: "v3.80",
    serialNumber: "DAVIS-VP2-9921",
  },
  {
    id: "accessory-2",
    type: "accessory",
    name: "Soil Sensor Array",
    model: "Teros 12 × 4",
    status: "online",
    battery: 74,
    signal: 88,
    elevation: -0.15,
    volume: "Subsurface · 15cm depth",
    lat: 41.57685,
    lon: -91.26073,
    lastSeen: new Date().toISOString(),
    assignedTask: "weed-feed-apply",
    osiLayer: "Layer 2 (Data Link) · Zigbee",
    ipAddress: "192.168.4.51",
    firmware: "v1.2.3",
    serialNumber: "TEROS-12-4X-0088",
  },
];

const AGENT_ICONS: Record<AgentType, string> = {
  drone: "🚁",
  humanoid: "🤖",
  vehicle: "🚜",
  accessory: "📡",
};

const AGENT_COLORS: Record<AgentType, string> = {
  drone: "#44ccff",
  humanoid: "#f5c518",
  vehicle: "#44ff88",
  accessory: "#ff88cc",
};

const STATUS_COLORS: Record<AgentStatus, string> = {
  online: "#44ff88",
  standby: "#ffcc44",
  offline: "#888",
  error: "#ff4444",
};

interface FleetConnectivityPanelProps {
  onFleetChange?: (agents: FleetAgent[]) => void;
}

export default function FleetConnectivityPanel({ onFleetChange }: FleetConnectivityPanelProps) {
  const [agents, setAgents] = useState<FleetAgent[]>(INITIAL_FLEET);
  const [expandedId, setExpandedId] = useState<string | null>("robot-1");
  const [filterType, setFilterType] = useState<AgentType | "all">("all");

  // Simulate live telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(a => {
        if (a.status === "offline") return a;
        const battDelta = a.status === "online" ? -0.05 : 0;
        const signalJitter = (Math.random() - 0.5) * 3;
        return {
          ...a,
          battery: Math.max(0, Math.min(100, a.battery + battDelta)),
          signal: Math.max(0, Math.min(100, a.signal + signalJitter)),
          lastSeen: a.status === "online" ? new Date().toISOString() : a.lastSeen,
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Notify parent of fleet changes
  useEffect(() => {
    onFleetChange?.(agents);
  }, [agents, onFleetChange]);

  const toggleAgent = (id: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next: AgentStatus = a.status === "offline" ? "standby" : "offline";
      toast.info(`${AGENT_ICONS[a.type]} ${a.name} → ${next.toUpperCase()}`, {
        description: next === "offline" ? "Removed from mission path" : "Added to mission queue",
        duration: 3000,
      });
      return { ...a, status: next };
    }));
  };

  const activateAgent = (id: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next: AgentStatus = a.status === "online" ? "standby" : "online";
      toast.success(`${AGENT_ICONS[a.type]} ${a.name} → ${next.toUpperCase()}`, {
        description: next === "online" ? "Agent activated — path updated" : "Agent on standby",
        duration: 3000,
      });
      return { ...a, status: next, lastSeen: new Date().toISOString() };
    }));
  };

  const filtered = filterType === "all" ? agents : agents.filter(a => a.type === filterType);
  const onlineCount = agents.filter(a => a.status === "online").length;
  const totalCount = agents.length;

  const formatLastSeen = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 10000) return "Just now";
    if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    return new Date(iso).toLocaleTimeString();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🛰️</span>
          <h3 className="text-sm font-semibold text-white">Fleet Connectivity</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${onlineCount > 0 ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
          <span className="text-[10px] font-mono text-white/60">{onlineCount}/{totalCount} ONLINE</span>
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(["all", "drone", "humanoid", "vehicle", "accessory"] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-all ${
              filterType === type
                ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"
                : "glass text-white/40 hover:text-white/70"
            }`}
          >
            {type === "all" ? "All" : `${AGENT_ICONS[type]} ${type}`}
          </button>
        ))}
      </div>

      {/* Agent cards */}
      <div className="space-y-2">
        {filtered.map(agent => {
          const isExpanded = expandedId === agent.id;
          const color = AGENT_COLORS[agent.type];
          const statusColor = STATUS_COLORS[agent.status];
          const isActive = agent.status !== "offline";

          return (
            <motion.div
              key={agent.id}
              className="glass rounded-2xl overflow-hidden"
              style={{ borderColor: isActive ? `${color}30` : "transparent", borderWidth: 1 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Agent row */}
              <div className="flex items-center gap-3 p-3">
                {/* Toggle button */}
                <button
                  onClick={() => toggleAgent(agent.id)}
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: isActive ? `${color}22` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isActive ? color + "44" : "rgba(255,255,255,0.1)"}`,
                  }}
                  title={isActive ? "Deactivate agent" : "Activate agent"}
                >
                  <span className="text-xl" style={{ filter: isActive ? "none" : "grayscale(1) opacity(0.4)" }}>
                    {AGENT_ICONS[agent.type]}
                  </span>
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0" onClick={() => setExpandedId(isExpanded ? null : agent.id)}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-semibold text-white truncate">{agent.name}</span>
                    <span
                      className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                      style={{ background: `${statusColor}22`, color: statusColor }}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-white/40 truncate">{agent.model}</span>
                  </div>
                  {/* Battery + signal bars */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] text-white/30">🔋</span>
                      <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${agent.battery}%`,
                            background: agent.battery > 50 ? "#44ff88" : agent.battery > 20 ? "#ffcc44" : "#ff4444",
                          }}
                        />
                      </div>
                      <span className="text-[8px] font-mono text-white/40">{Math.round(agent.battery)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] text-white/30">📶</span>
                      <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${agent.signal}%`, background: "#44ccff" }}
                        />
                      </div>
                      <span className="text-[8px] font-mono text-white/40">{Math.round(agent.signal)}%</span>
                    </div>
                  </div>
                </div>

                {/* Elevation badge */}
                <div className="flex-shrink-0 text-right">
                  <div
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-lg"
                    style={{ background: `${color}15`, color }}
                  >
                    {agent.elevation >= 0 ? `+${agent.elevation.toFixed(1)}m` : `${agent.elevation.toFixed(2)}m`}
                  </div>
                  <div className="text-[7px] text-white/25 mt-0.5 text-right">AGL</div>
                </div>
              </div>

              {/* Expanded detail */}
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
                      {/* Volume & GPS */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="glass rounded-xl p-2">
                          <p className="text-[8px] text-white/30 uppercase tracking-wider mb-1">Op Volume</p>
                          <p className="text-[9px] text-cyan-300 font-mono">{agent.volume}</p>
                        </div>
                        <div className="glass rounded-xl p-2">
                          <p className="text-[8px] text-white/30 uppercase tracking-wider mb-1">GPS</p>
                          <p className="text-[9px] font-mono text-white/60">{agent.lat.toFixed(5)}°</p>
                          <p className="text-[9px] font-mono text-white/60">{agent.lon.toFixed(5)}°</p>
                        </div>
                      </div>

                      {/* OSI + Network */}
                      <div className="glass rounded-xl p-2">
                        <p className="text-[8px] text-white/30 uppercase tracking-wider mb-1">Network</p>
                        <p className="text-[9px] text-purple-300 font-mono">{agent.osiLayer}</p>
                        <p className="text-[9px] text-white/40 font-mono mt-0.5">{agent.ipAddress} · FW {agent.firmware}</p>
                        <p className="text-[8px] text-white/25 font-mono mt-0.5">S/N: {agent.serialNumber}</p>
                      </div>

                      {/* Assigned task */}
                      {agent.assignedTask && (
                        <div className="glass rounded-xl p-2 flex items-center gap-2">
                          <span className="text-[9px] text-white/30">📋 Task:</span>
                          <span className="text-[9px] text-yellow-300 font-mono">{agent.assignedTask}</span>
                        </div>
                      )}

                      {/* Last seen */}
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-white/25">Last seen: {formatLastSeen(agent.lastSeen)}</span>
                        <button
                          onClick={() => activateAgent(agent.id)}
                          className="text-[9px] font-semibold px-2 py-1 rounded-lg transition-all"
                          style={{
                            background: agent.status === "online" ? "rgba(255,204,68,0.15)" : `${color}22`,
                            color: agent.status === "online" ? "#ffcc44" : color,
                            border: `1px solid ${agent.status === "online" ? "#ffcc4440" : color + "40"}`,
                          }}
                        >
                          {agent.status === "online" ? "⏸ Standby" : "▶ Activate"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Fleet summary */}
      <div className="glass rounded-2xl p-3">
        <p className="text-[8px] text-white/30 uppercase tracking-wider mb-2">Fleet Summary</p>
        <div className="grid grid-cols-4 gap-2">
          {(["drone", "humanoid", "vehicle", "accessory"] as AgentType[]).map(type => {
            const typeAgents = agents.filter(a => a.type === type);
            const typeOnline = typeAgents.filter(a => a.status === "online").length;
            return (
              <div key={type} className="text-center">
                <div className="text-xl mb-0.5" style={{ filter: typeOnline > 0 ? "none" : "grayscale(1) opacity(0.3)" }}>
                  {AGENT_ICONS[type]}
                </div>
                <div className="text-[9px] font-mono" style={{ color: AGENT_COLORS[type] }}>
                  {typeOnline}/{typeAgents.length}
                </div>
                <div className="text-[7px] text-white/25 capitalize">{type}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
