/**
 * PrivacyDashboard — /privacy
 * Spatial editing privacy and security control center.
 * OSI layer visualization, privacy zones, E2E encryption, and audit log.
 * Apple Vision Pro spatial computing design language.
 */
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import {
  Shield, Lock, Unlock, Eye, EyeOff, Key, Check, X, AlertTriangle,
  Info, Users, Globe, Cloud, Database, Cpu, Wifi, Activity,
  ChevronRight, Plus, Trash2, RefreshCw, Download, Copy,
  Clock, AlertCircle, CheckCircle, XCircle, Layers,
  Fingerprint, Smartphone, Monitor, Headphones, Box,
  Radio, Zap, ArrowUpRight, Filter, Search, Bell, BellOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface OSILayer {
  layer: string;
  name: string;
  status: "secure" | "warning" | "error" | "monitoring";
  protocol: string;
  details: string;
  lastChecked: string;
  encryptionBits?: number;
}

interface PrivacyZone {
  id: string;
  name: string;
  level: "public" | "team" | "private" | "classified";
  users: string[];
  nodes: string[];
  encryption: string;
  active: boolean;
}

interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  platform: string;
  action: string;
  resource: string;
  status: "allowed" | "denied" | "warning";
  ipAddress: string;
}

/* ─── Demo Data ─────────────────────────────────────────────────────────────── */
const OSI_LAYERS: OSILayer[] = [
  { layer: "L7", name: "Application", status: "secure", protocol: "TLS 1.3 + E2EE", details: "SharePlay encrypted session with CRDT sync", lastChecked: "now", encryptionBits: 256 },
  { layer: "L6", name: "Presentation", status: "secure", protocol: "AES-256-GCM", details: "All spatial data encrypted before transmission", lastChecked: "now", encryptionBits: 256 },
  { layer: "L5", name: "Session", status: "secure", protocol: "JWT + SharePlay", details: "Session tokens rotate every 60 minutes", lastChecked: "1m ago", encryptionBits: 256 },
  { layer: "L4", name: "Transport", status: "secure", protocol: "TLS 1.3 / QUIC", details: "Perfect forward secrecy enabled", lastChecked: "1m ago", encryptionBits: 256 },
  { layer: "L3", name: "Network", status: "warning", protocol: "IPv6 + Private Relay", details: "Private Relay active — verifying endpoint", lastChecked: "2m ago" },
  { layer: "L2", name: "Data Link", status: "secure", protocol: "802.11ax WPA3", details: "Wi-Fi 6E with WPA3-Enterprise", lastChecked: "2m ago" },
  { layer: "L1", name: "Physical", status: "secure", protocol: "Apple Silicon Secure Enclave", details: "Hardware-level key storage and attestation", lastChecked: "now" },
];

const PRIVACY_ZONES: PrivacyZone[] = [
  { id: "z1", name: "Main Scene", level: "team", users: ["Alex (Vision Pro)", "Sam (Quest 3)", "Jordan (Blender)", "Taylor (iPad)"], nodes: ["Z-Pinch Column", "Sensor Array", "Lighting Rig"], encryption: "AES-256-GCM", active: true },
  { id: "z2", name: "Classified Data Layer", level: "classified", users: ["Alex (Vision Pro)"], nodes: ["Raw Simulation Data", "Classified Measurements"], encryption: "AES-256-GCM + Secure Enclave", active: true },
  { id: "z3", name: "Public Preview", level: "public", users: ["*"], nodes: ["Rendered Output", "Public Thumbnail"], encryption: "TLS 1.3", active: true },
  { id: "z4", name: "Admin Controls", level: "private", users: ["You (Web)"], nodes: ["Privacy Zone Config", "Audit Log", "Key Management"], encryption: "AES-256-GCM + 2FA", active: true },
];

const AUDIT_LOG: AuditEvent[] = [
  { id: "e1", timestamp: "10:21 AM", user: "Alex (Vision Pro)", platform: "visionOS", action: "EDIT_NODE", resource: "Z-Pinch Column / Transform", status: "allowed", ipAddress: "192.168.1.42" },
  { id: "e2", timestamp: "10:20 AM", user: "Jordan (Blender)", platform: "blender", action: "EXPORT_SCENE", resource: "Full Scene / USDZ", status: "allowed", ipAddress: "10.0.0.15" },
  { id: "e3", timestamp: "10:18 AM", user: "Unknown", platform: "web", action: "ACCESS_CLASSIFIED", resource: "Classified Data Layer", status: "denied", ipAddress: "203.0.113.42" },
  { id: "e4", timestamp: "10:15 AM", user: "Sam (Quest 3)", platform: "metaQuest", action: "JOIN_SESSION", resource: "Z-Pinch Plasma Simulation", status: "allowed", ipAddress: "192.168.1.55" },
  { id: "e5", timestamp: "10:12 AM", user: "Taylor (iPad)", platform: "iPadOS", action: "VIEW_NODE", resource: "Sensor Array", status: "warning", ipAddress: "192.168.1.67" },
  { id: "e6", timestamp: "10:08 AM", user: "Alex (Vision Pro)", platform: "visionOS", action: "CREATE_PRIVACY_ZONE", resource: "Classified Data Layer", status: "allowed", ipAddress: "192.168.1.42" },
  { id: "e7", timestamp: "10:02 AM", user: "You (Web)", platform: "web", action: "START_SESSION", resource: "Z-Pinch Plasma Simulation", status: "allowed", ipAddress: "127.0.0.1" },
];

/* ─── Components ─────────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
    secure: { bg: "bg-green-500/15 border-green-500/30", text: "text-green-400", icon: <Check className="w-3 h-3" /> },
    warning: { bg: "bg-yellow-500/15 border-yellow-500/30", text: "text-yellow-400", icon: <AlertTriangle className="w-3 h-3" /> },
    error: { bg: "bg-red-500/15 border-red-500/30", text: "text-red-400", icon: <X className="w-3 h-3" /> },
    monitoring: { bg: "bg-blue-500/15 border-blue-500/30", text: "text-blue-400", icon: <Activity className="w-3 h-3" /> },
    allowed: { bg: "bg-green-500/15 border-green-500/30", text: "text-green-400", icon: <CheckCircle className="w-3 h-3" /> },
    denied: { bg: "bg-red-500/15 border-red-500/30", text: "text-red-400", icon: <XCircle className="w-3 h-3" /> },
  };
  const c = config[status] || config.monitoring;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${c.bg} ${c.text}`}>
      {c.icon} {status}
    </span>
  );
}

function ZoneLevelBadge({ level }: { level: string }) {
  const config: Record<string, string> = {
    public: "bg-green-500/15 border-green-500/30 text-green-400",
    team: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    private: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    classified: "bg-red-500/15 border-red-500/30 text-red-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${config[level] || config.team} capitalize`}>
      <Shield className="w-2.5 h-2.5" /> {level}
    </span>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */

export default function PrivacyDashboard() {
  const [layers] = useState<OSILayer[]>(OSI_LAYERS);
  const [zones, setZones] = useState<PrivacyZone[]>(PRIVACY_ZONES);
  const [auditLog] = useState<AuditEvent[]>(AUDIT_LOG);
  const [activeTab, setActiveTab] = useState<"overview" | "osi" | "zones" | "audit" | "keys">("overview");
  const [secureScore] = useState(94);
  const [keyRotationCountdown, setKeyRotationCountdown] = useState(3547); // seconds

  useEffect(() => {
    const i = setInterval(() => setKeyRotationCountdown(c => c > 0 ? c - 1 : 3600), 1000);
    return () => clearInterval(i);
  }, []);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const secureCount = layers.filter(l => l.status === "secure").length;
  const warningCount = layers.filter(l => l.status === "warning").length;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0A0A14] text-white">
        {/* Header */}
        <div className="border-b border-white/10 bg-[#0F0F1E] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-xl border border-green-500/30">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Privacy & Security Dashboard</h1>
                <p className="text-sm text-gray-400">OSI Stack · Privacy Zones · E2E Encryption · Audit Log · Key Management</p>
              </div>
            </div>
            {/* Security score */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="2.5"
                      strokeDasharray={`${secureScore} ${100 - secureScore}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-green-400">{secureScore}</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Security Score</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-400">{secureCount} layers secure</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-gray-400">{warningCount} warning</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Key className="w-3 h-3 text-blue-400" />
                  <span className="text-gray-400">Key rotates in {formatCountdown(keyRotationCountdown)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {[
              { id: "overview", icon: Activity, label: "Overview" },
              { id: "osi", icon: Layers, label: "OSI Stack" },
              { id: "zones", icon: Shield, label: "Privacy Zones" },
              { id: "audit", icon: Clock, label: "Audit Log" },
              { id: "keys", icon: Key, label: "Key Management" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-green-500/20 text-green-300 border border-green-500/30" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* OSI Summary */}
              <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">OSI Security Stack</h2>
                  <button onClick={() => setActiveTab("osi")} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {layers.map(layer => (
                    <div key={layer.layer} className={`flex items-center gap-3 p-3 rounded-lg border ${layer.status === "secure" ? "bg-green-500/5 border-green-500/15" : layer.status === "warning" ? "bg-yellow-500/5 border-yellow-500/15" : "bg-red-500/5 border-red-500/15"}`}>
                      <span className={`font-mono text-[10px] font-bold w-5 ${layer.status === "secure" ? "text-green-500" : layer.status === "warning" ? "text-yellow-500" : "text-red-500"}`}>{layer.layer}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-200">{layer.name}</span>
                          {layer.encryptionBits && <span className="text-[10px] text-gray-500 font-mono">{layer.encryptionBits}-bit</span>}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{layer.protocol}</p>
                      </div>
                      <StatusBadge status={layer.status} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Active Sessions", value: "3", icon: Users, color: "blue" },
                    { label: "Privacy Zones", value: "4", icon: Shield, color: "green" },
                    { label: "Denied Requests", value: "1", icon: XCircle, color: "red" },
                    { label: "Key Age", value: "47m", icon: Key, color: "amber" },
                  ].map(s => (
                    <div key={s.label} className={`bg-${s.color}-500/10 border border-${s.color}-500/20 rounded-xl p-3`}>
                      <div className="flex items-center justify-between mb-1">
                        <s.icon className={`w-4 h-4 text-${s.color}-400`} />
                      </div>
                      <p className={`text-xl font-bold font-mono text-${s.color}-400`}>{s.value}</p>
                      <p className="text-[10px] text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Encryption status */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Encryption</h3>
                  {[
                    ["Algorithm", "AES-256-GCM"],
                    ["Key Exchange", "ECDH P-256"],
                    ["Secure Enclave", "Active"],
                    ["Certificate", "Valid (364d)"],
                    ["CRDT Integrity", "Verified"],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500">{l}</span>
                      <span className="text-green-400 font-mono">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Recent audit events */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Events</h3>
                    <button onClick={() => setActiveTab("audit")} className="text-[10px] text-blue-400">View all</button>
                  </div>
                  <div className="space-y-2">
                    {auditLog.slice(0, 4).map(event => (
                      <div key={event.id} className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${event.status === "allowed" ? "bg-green-500" : event.status === "denied" ? "bg-red-500" : "bg-yellow-500"}`} />
                        <span className="text-gray-400 flex-shrink-0 font-mono text-[10px]">{event.timestamp}</span>
                        <span className="text-gray-300 truncate">{event.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OSI Stack Detail */}
          {activeTab === "osi" && (
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">OSI Security Stack — Full Detail</h2>
                <button onClick={() => toast.success("Running security scan...")} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-xs text-green-400">
                  <RefreshCw className="w-3.5 h-3.5" /> Run Scan
                </button>
              </div>
              {layers.map((layer, i) => (
                <motion.div key={layer.layer} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl border ${layer.status === "secure" ? "bg-green-500/5 border-green-500/20" : layer.status === "warning" ? "bg-yellow-500/5 border-yellow-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                  <div className="flex items-start gap-4">
                    <div className={`text-center w-10 flex-shrink-0`}>
                      <span className={`text-lg font-bold font-mono ${layer.status === "secure" ? "text-green-400" : layer.status === "warning" ? "text-yellow-400" : "text-red-400"}`}>{layer.layer}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{layer.name} Layer</span>
                          {layer.encryptionBits && (
                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono text-gray-300">{layer.encryptionBits}-bit</span>
                          )}
                        </div>
                        <StatusBadge status={layer.status} />
                      </div>
                      <p className="text-sm text-blue-400 font-mono mb-1">{layer.protocol}</p>
                      <p className="text-xs text-gray-400">{layer.details}</p>
                      <p className="text-[10px] text-gray-600 mt-1">Last checked: {layer.lastChecked}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Privacy Zones */}
          {activeTab === "zones" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Privacy Zones</h2>
                <button onClick={() => toast.success("Create privacy zone dialog...")} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-xs text-green-400">
                  <Plus className="w-3.5 h-3.5" /> New Zone
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {zones.map(zone => (
                  <motion.div key={zone.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className={`w-5 h-5 ${zone.level === "classified" ? "text-red-400" : zone.level === "private" ? "text-amber-400" : zone.level === "team" ? "text-blue-400" : "text-green-400"}`} />
                        <div>
                          <p className="text-sm font-semibold text-white">{zone.name}</p>
                          <ZoneLevelBadge level={zone.level} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${zone.active ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
                        <button onClick={() => setZones(prev => prev.map(z => z.id === zone.id ? { ...z, active: !z.active } : z))}
                          className="p-1 hover:bg-white/10 rounded text-gray-400">
                          {zone.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="text-gray-500 mb-1">Users ({zone.users.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {zone.users.slice(0, 4).map(u => (
                            <span key={u} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-gray-300">{u}</span>
                          ))}
                          {zone.users.length > 4 && <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-gray-500">+{zone.users.length - 4}</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Protected Nodes ({zone.nodes.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {zone.nodes.map(n => (
                            <span key={n} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-gray-300">{n}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-gray-500">Encryption</span>
                        <span className="text-green-400 font-mono">{zone.encryption}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Log */}
          {activeTab === "audit" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Audit Log</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" placeholder="Search events..." className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white/30 w-40" />
                  </div>
                  <button onClick={() => toast.success("Exporting audit log...")} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["Time", "User", "Platform", "Action", "Resource", "IP", "Status"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map((event, i) => (
                      <tr key={event.id} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/2" : ""} hover:bg-white/5 transition-colors`}>
                        <td className="px-4 py-3 font-mono text-gray-400">{event.timestamp}</td>
                        <td className="px-4 py-3 text-gray-200">{event.user}</td>
                        <td className="px-4 py-3 text-gray-400">{event.platform}</td>
                        <td className="px-4 py-3 font-mono text-blue-400">{event.action}</td>
                        <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{event.resource}</td>
                        <td className="px-4 py-3 font-mono text-gray-500">{event.ipAddress}</td>
                        <td className="px-4 py-3"><StatusBadge status={event.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Key Management */}
          {activeTab === "keys" && (
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Key Management</h2>
              {/* Current key */}
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-semibold text-white">Active Session Key</span>
                  </div>
                  <StatusBadge status="secure" />
                </div>
                <div className="font-mono text-xs text-gray-400 bg-black/30 rounded-lg p-3 mb-3 break-all">
                  3a7f9c2e1b8d4f6a0e5c3b9d7f2a4c8e1b6d3f9a2c7e4b1d8f5a3c6e9b2d4f7a
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[["Algorithm", "AES-256-GCM"], ["Key Length", "256 bits"], ["Created", "47 min ago"], ["Expires", formatCountdown(keyRotationCountdown)], ["Stored In", "Secure Enclave"], ["Usage Count", "1,247"]].map(([l, v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-gray-500">{l}</span>
                      <span className="text-gray-200 font-mono">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => toast.success("Key rotation initiated...")} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-xs text-green-400">
                    <RefreshCw className="w-3.5 h-3.5" /> Rotate Now
                  </button>
                  <button onClick={() => { toast.success("Key copied to clipboard"); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400">
                    <Copy className="w-3.5 h-3.5" /> Copy Public Key
                  </button>
                </div>
              </div>
              {/* Key history */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Key History</h3>
                {[
                  { id: "k1", created: "47m ago", expired: "active", algo: "AES-256-GCM", status: "active" },
                  { id: "k2", created: "1h 47m ago", expired: "47m ago", algo: "AES-256-GCM", status: "expired" },
                  { id: "k3", created: "2h 47m ago", expired: "1h 47m ago", algo: "AES-256-GCM", status: "expired" },
                ].map(key => (
                  <div key={key.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0 text-xs">
                    <Key className={`w-3.5 h-3.5 flex-shrink-0 ${key.status === "active" ? "text-green-400" : "text-gray-600"}`} />
                    <div className="flex-1">
                      <span className="font-mono text-gray-300">{key.algo}</span>
                    </div>
                    <span className="text-gray-500">Created {key.created}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${key.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-500"}`}>{key.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
