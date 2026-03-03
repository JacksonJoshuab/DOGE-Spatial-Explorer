/**
 * DeviceManager — /devices
 * Cross-platform device management dashboard for all connected spatial
 * editing devices: Vision Pro, Meta Quest, iPads, Apple TVs, Blender
 * workstations, and cloud render nodes.
 */
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import {
  Monitor, Smartphone, Headphones, Eye, Box, Cloud, Globe,
  Wifi, WifiOff, Battery, BatteryCharging, BatteryLow,
  Shield, Lock, Cpu, HardDrive, Gauge, Thermometer,
  RefreshCw, Settings, Trash2, Power, Download, Upload,
  Check, X, AlertTriangle, ChevronRight, Plus, Zap,
  Activity, Radio, Database
} from "lucide-react";
import { toast } from "sonner";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface Device {
  id: string;
  name: string;
  platform: "visionOS" | "metaQuest" | "iPadOS" | "tvOS" | "desktop" | "cloud";
  model: string;
  osVersion: string;
  status: "online" | "idle" | "offline" | "updating";
  battery?: number;
  isCharging?: boolean;
  lastSeen: string;
  ipAddress: string;
  storage: { used: number; total: number };
  memory: { used: number; total: number };
  cpu: number;
  gpu: number;
  temperature?: number;
  capabilities: string[];
  encryptionStatus: "active" | "inactive";
  firmwareVersion: string;
  syncStatus: "synced" | "syncing" | "pending" | "error";
}

/* ─── Demo Data ────────────────────────────────────────────────────────────── */

const DEVICES: Device[] = [
  {
    id: "d1", name: "Vision Pro (Office)", platform: "visionOS", model: "Apple Vision Pro (2nd Gen)",
    osVersion: "visionOS 3.0 beta 4", status: "online", battery: 78, isCharging: false,
    lastSeen: "now", ipAddress: "192.168.1.42", storage: { used: 128, total: 512 },
    memory: { used: 12, total: 16 }, cpu: 34, gpu: 67, temperature: 38,
    capabilities: ["RealityKit", "SharePlay", "Hand Tracking", "Eye Tracking", "LiDAR", "Spatial Audio", "Persona"],
    encryptionStatus: "active", firmwareVersion: "21A5312g", syncStatus: "synced",
  },
  {
    id: "d2", name: "Quest 3 (Lab)", platform: "metaQuest", model: "Meta Quest 3 (512GB)",
    osVersion: "v69.0", status: "online", battery: 54, isCharging: true,
    lastSeen: "now", ipAddress: "192.168.1.87", storage: { used: 234, total: 512 },
    memory: { used: 8, total: 12 }, cpu: 45, gpu: 72, temperature: 41,
    capabilities: ["Passthrough", "Hand Tracking", "Spatial Anchors", "OpenXR", "Meta Spatial SDK"],
    encryptionStatus: "active", firmwareVersion: "69.0.0.327", syncStatus: "synced",
  },
  {
    id: "d3", name: "iPad Pro 13\"", platform: "iPadOS", model: "iPad Pro 13\" M4",
    osVersion: "iPadOS 19.0 beta 3", status: "online", battery: 92, isCharging: false,
    lastSeen: "now", ipAddress: "192.168.1.103", storage: { used: 312, total: 1024 },
    memory: { used: 6, total: 16 }, cpu: 12, gpu: 8, temperature: 32,
    capabilities: ["LiDAR", "Apple Pencil Pro", "Stage Manager", "Continuity Camera"],
    encryptionStatus: "active", firmwareVersion: "23A5312f", syncStatus: "synced",
  },
  {
    id: "d4", name: "Apple TV 4K", platform: "tvOS", model: "Apple TV 4K (3rd Gen)",
    osVersion: "tvOS 19.0 beta 3", status: "idle",
    lastSeen: "2m ago", ipAddress: "192.168.1.55", storage: { used: 32, total: 128 },
    memory: { used: 2, total: 4 }, cpu: 5, gpu: 3,
    capabilities: ["AirPlay", "Spatial Audio", "SharePlay Viewer"],
    encryptionStatus: "active", firmwareVersion: "23M5312e", syncStatus: "synced",
  },
  {
    id: "d5", name: "Blender Workstation", platform: "desktop", model: "Mac Studio M3 Ultra",
    osVersion: "macOS 16.0 beta 3", status: "online",
    lastSeen: "now", ipAddress: "192.168.1.10", storage: { used: 2048, total: 8192 },
    memory: { used: 48, total: 192 }, cpu: 28, gpu: 45, temperature: 44,
    capabilities: ["Blender 4.3", "Metal GPU", "USDZ Export", "GLB Export", "Neural Engine"],
    encryptionStatus: "active", firmwareVersion: "25A5312g", syncStatus: "syncing",
  },
  {
    id: "d6", name: "Cloud Render Node", platform: "cloud", model: "8x A100 GPU Cluster",
    osVersion: "Ubuntu 24.04 LTS", status: "online",
    lastSeen: "now", ipAddress: "10.0.1.200", storage: { used: 4096, total: 16384 },
    memory: { used: 256, total: 640 }, cpu: 62, gpu: 78, temperature: 52,
    capabilities: ["Text-to-3D", "Image-to-3D", "Neural Radiance Fields", "Gaussian Splatting", "Distributed Rendering"],
    encryptionStatus: "active", firmwareVersion: "v2.4.1", syncStatus: "synced",
  },
];

/* ─── Helper Components ────────────────────────────────────────────────────── */

function PlatformIcon({ platform, size = 18 }: { platform: string; size?: number }) {
  switch (platform) {
    case "visionOS": return <Eye size={size} />;
    case "metaQuest": return <Headphones size={size} />;
    case "iPadOS": return <Smartphone size={size} />;
    case "tvOS": return <Monitor size={size} />;
    case "desktop": return <Monitor size={size} />;
    case "cloud": return <Cloud size={size} />;
    default: return <Globe size={size} />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    online: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", label: "Online" },
    idle: { bg: "rgba(245,158,11,0.1)", color: "#d97706", label: "Idle" },
    offline: { bg: "rgba(107,114,128,0.1)", color: "#6b7280", label: "Offline" },
    updating: { bg: "rgba(74,144,217,0.1)", color: "#4A90D9", label: "Updating" },
    synced: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", label: "Synced" },
    syncing: { bg: "rgba(74,144,217,0.1)", color: "#4A90D9", label: "Syncing" },
    pending: { bg: "rgba(245,158,11,0.1)", color: "#d97706", label: "Pending" },
    error: { bg: "rgba(239,68,68,0.1)", color: "#dc2626", label: "Error" },
    active: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", label: "Active" },
    inactive: { bg: "rgba(107,114,128,0.1)", color: "#6b7280", label: "Inactive" },
  };
  const c = config[status] || config.offline;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px",
      borderRadius: 12, background: c.bg, color: c.color, fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color }} />
      {c.label}
    </span>
  );
}

function ProgressBar({ value, max, color = "#4A90D9", height = 6 }: { value: number; max: number; color?: string; height?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : color;
  return (
    <div style={{ height, borderRadius: height / 2, background: "rgba(0,0,0,0.08)", overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", borderRadius: height / 2, background: barColor, width: `${pct}%`, transition: "width 0.3s" }} />
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */

export default function DeviceManager() {
  const [selectedDevice, setSelectedDevice] = useState<string>("d1");
  const device = DEVICES.find(d => d.id === selectedDevice);

  return (
    <DashboardLayout title="Device Manager">
      <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>

        {/* Device List */}
        <div style={{
          width: 320, borderRight: "1px solid rgba(0,0,0,0.1)", overflow: "auto",
          background: "rgba(0,0,0,0.02)", flexShrink: 0, padding: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Connected Devices</span>
            <span style={{
              padding: "2px 8px", borderRadius: 12, background: "rgba(34,197,94,0.1)",
              color: "#16a34a", fontSize: 11, fontWeight: 600,
            }}>
              {DEVICES.filter(d => d.status !== "offline").length} online
            </span>
          </div>

          {DEVICES.map(d => (
            <div key={d.id} onClick={() => setSelectedDevice(d.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 8, marginBottom: 4, cursor: "pointer",
              background: selectedDevice === d.id ? "rgba(74,144,217,0.08)" : "transparent",
              border: selectedDevice === d.id ? "1px solid rgba(74,144,217,0.15)" : "1px solid transparent",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: "rgba(0,0,0,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <PlatformIcon platform={d.platform} size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                <div style={{ fontSize: 10, color: "rgba(0,0,0,0.4)" }}>{d.model}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                <StatusBadge status={d.status} />
                {d.battery !== undefined && (
                  <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, color: d.battery < 20 ? "#ef4444" : "rgba(0,0,0,0.4)" }}>
                    {d.isCharging ? <BatteryCharging size={10} /> : d.battery < 20 ? <BatteryLow size={10} /> : <Battery size={10} />}
                    {d.battery}%
                  </div>
                )}
              </div>
            </div>
          ))}

          <button style={{
            width: "100%", padding: "10px", borderRadius: 8, border: "1px dashed rgba(0,0,0,0.15)",
            background: "transparent", fontSize: 12, cursor: "pointer", marginTop: 8,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4, color: "rgba(0,0,0,0.4)",
          }}>
            <Plus size={14} /> Pair New Device
          </button>
        </div>

        {/* Device Detail */}
        {device && (
          <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
            <div style={{ maxWidth: 800 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 12, background: "rgba(0,0,0,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <PlatformIcon platform={device.platform} size={28} />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{device.name}</h2>
                  <div style={{ fontSize: 13, color: "rgba(0,0,0,0.5)" }}>{device.model} · {device.osVersion}</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <StatusBadge status={device.status} />
                  <StatusBadge status={device.syncStatus} />
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
                {/* CPU */}
                <div style={{ padding: 14, borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Cpu size={14} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>CPU Usage</span>
                    <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700 }}>{device.cpu}%</span>
                  </div>
                  <ProgressBar value={device.cpu} max={100} color="#4A90D9" />
                </div>

                {/* GPU */}
                <div style={{ padding: 14, borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Zap size={14} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>GPU Usage</span>
                    <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700 }}>{device.gpu}%</span>
                  </div>
                  <ProgressBar value={device.gpu} max={100} color="#9B59B6" />
                </div>

                {/* Memory */}
                <div style={{ padding: 14, borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <HardDrive size={14} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Memory</span>
                    <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700 }}>{device.memory.used}/{device.memory.total} GB</span>
                  </div>
                  <ProgressBar value={device.memory.used} max={device.memory.total} color="#2ECC71" />
                </div>

                {/* Storage */}
                <div style={{ padding: 14, borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Database size={14} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Storage</span>
                    <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700 }}>{device.storage.used}/{device.storage.total} GB</span>
                  </div>
                  <ProgressBar value={device.storage.used} max={device.storage.total} color="#F39C12" />
                </div>

                {/* Temperature */}
                {device.temperature && (
                  <div style={{ padding: 14, borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Thermometer size={14} />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Temperature</span>
                      <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700 }}>{device.temperature}°C</span>
                    </div>
                    <ProgressBar value={device.temperature} max={80} color="#E74C3C" />
                  </div>
                )}

                {/* Battery */}
                {device.battery !== undefined && (
                  <div style={{ padding: 14, borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      {device.isCharging ? <BatteryCharging size={14} /> : <Battery size={14} />}
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Battery</span>
                      <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700 }}>{device.battery}%</span>
                    </div>
                    <ProgressBar value={device.battery} max={100} color={device.battery < 20 ? "#ef4444" : "#22c55e"} />
                  </div>
                )}
              </div>

              {/* Capabilities */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Capabilities</h3>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {device.capabilities.map(cap => (
                    <span key={cap} style={{
                      padding: "4px 10px", borderRadius: 16, background: "rgba(74,144,217,0.08)",
                      border: "1px solid rgba(74,144,217,0.15)", fontSize: 11, fontWeight: 600, color: "#4A90D9",
                    }}>
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Network & Security */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                <div style={{ padding: 14, borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Wifi size={14} /> Network
                  </h3>
                  <div style={{ fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                      <span style={{ color: "rgba(0,0,0,0.5)" }}>IP Address</span>
                      <span style={{ fontFamily: "monospace" }}>{device.ipAddress}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                      <span style={{ color: "rgba(0,0,0,0.5)" }}>Last Seen</span>
                      <span>{device.lastSeen}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                      <span style={{ color: "rgba(0,0,0,0.5)" }}>Firmware</span>
                      <span style={{ fontFamily: "monospace" }}>{device.firmwareVersion}</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Shield size={14} /> Security
                  </h3>
                  <div style={{ fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                      <span style={{ color: "rgba(0,0,0,0.5)" }}>Encryption</span>
                      <StatusBadge status={device.encryptionStatus} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                      <span style={{ color: "rgba(0,0,0,0.5)" }}>Sync Status</span>
                      <StatusBadge status={device.syncStatus} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                      <span style={{ color: "rgba(0,0,0,0.5)" }}>Secure Enclave</span>
                      <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 11 }}>Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => toast.success("Sync initiated")} style={{
                  padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)",
                  background: "#4A90D9", color: "#fff", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <RefreshCw size={14} /> Force Sync
                </button>
                <button onClick={() => toast.info("Update check started")} style={{
                  padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)",
                  background: "#fff", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Download size={14} /> Check Updates
                </button>
                <button onClick={() => toast.info("Diagnostics running...")} style={{
                  padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)",
                  background: "#fff", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Activity size={14} /> Run Diagnostics
                </button>
                <button style={{
                  padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)",
                  background: "#fff", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Settings size={14} /> Settings
                </button>
                <button onClick={() => toast.error("Device unpaired")} style={{
                  padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)",
                  background: "rgba(239,68,68,0.05)", color: "#dc2626", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Trash2 size={14} /> Unpair
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
