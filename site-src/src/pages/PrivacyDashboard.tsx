import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Lock, Unlock, Eye, EyeOff, Key, AlertTriangle,
  CheckCircle, XCircle, Activity, Cpu, Wifi, Globe, Server,
  Database, Layers, Radio, Zap, RefreshCw, Download, Plus,
  Clock, User, Shield, FileText, ChevronRight, ChevronDown,
  Fingerprint, Smartphone, Monitor, Cloud, HardDrive, Network
} from "lucide-react";

interface OsiLayer {
  layer: number;
  name: string;
  protocol: string;
  status: "secure" | "warning" | "error" | "monitoring";
  details: string;
  latency?: number;
  icon: any;
}

interface PrivacyZone {
  id: string;
  name: string;
  type: "private" | "shared" | "public";
  participants: string[];
  encrypted: boolean;
  active: boolean;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  event: string;
  user: string;
  platform: string;
  status: "success" | "warning" | "blocked";
  details: string;
}

const OSI_LAYERS: OsiLayer[] = [
  { layer: 7, name: "Application", protocol: "TLS 1.3 + E2EE + CRDT", status: "secure", details: "End-to-end encrypted with AES-256-GCM. CRDT integrity verified.", latency: 0, icon: Globe },
  { layer: 6, name: "Presentation", protocol: "AES-256-GCM · ECDH P-256", status: "secure", details: "Data encrypted at rest and in transit. Key rotation every 24h.", latency: 0, icon: Lock },
  { layer: 5, name: "Session", protocol: "JWT + SharePlay + WebRTC", status: "secure", details: "Session tokens expire in 1h. SharePlay group session active.", latency: 8, icon: Key },
  { layer: 4, name: "Transport", protocol: "TLS 1.3 / QUIC / DTLS", status: "secure", details: "Perfect forward secrecy enabled. Certificate pinning active.", latency: 12, icon: Network },
  { layer: 3, name: "Network", protocol: "IPv6 + iCloud Private Relay", status: "warning", details: "Private Relay active. One node outside expected region.", latency: 45, icon: Radio },
  { layer: 2, name: "Data Link", protocol: "802.11ax WPA3-Enterprise", status: "secure", details: "WPA3-Enterprise with 802.1X authentication. PMKSA caching.", latency: 2, icon: Wifi },
  { layer: 1, name: "Physical", protocol: "Secure Enclave · T2 Chip", status: "secure", details: "Hardware-backed key storage. Biometric authentication required.", latency: 0, icon: Cpu },
];

const PRIVACY_ZONES: PrivacyZone[] = [
  { id: "z1", name: "Core Simulation Data", type: "private", participants: ["You"], encrypted: true, active: true },
  { id: "z2", name: "Collaboration Session", type: "shared", participants: ["You", "Alex", "Sam", "Taylor"], encrypted: true, active: true },
  { id: "z3", name: "Public Asset Preview", type: "public", participants: ["All"], encrypted: false, active: true },
  { id: "z4", name: "AI Generation Queue", type: "shared", participants: ["You", "Cloud Node"], encrypted: true, active: false },
];

const AUDIT_LOG: AuditEntry[] = [
  { id: "e1", timestamp: "10:21:34", event: "Session joined", user: "Alex Chen", platform: "visionOS", status: "success", details: "Vision Pro joined collaboration session" },
  { id: "e2", timestamp: "10:20:18", event: "Asset uploaded", user: "You", platform: "Web", status: "success", details: "Z-Pinch Plasma Column.usdz — 24.8 MB" },
  { id: "e3", timestamp: "10:19:55", event: "Key rotation", user: "System", platform: "Cloud", status: "success", details: "Session encryption keys rotated (24h cycle)" },
  { id: "e4", timestamp: "10:18:42", event: "Access denied", user: "Unknown", platform: "External", status: "blocked", details: "Unauthorized session join attempt blocked" },
  { id: "e5", timestamp: "10:17:30", event: "Privacy zone created", user: "You", platform: "Web", status: "success", details: "New private zone: Core Simulation Data" },
  { id: "e6", timestamp: "10:16:15", event: "Network anomaly", user: "System", platform: "Network", status: "warning", details: "Private Relay node outside expected region" },
  { id: "e7", timestamp: "10:15:00", event: "Session started", user: "You", platform: "Web", status: "success", details: "Secure session initiated with E2EE" },
];

const STATUS_CONFIG = {
  secure: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", dot: "bg-green-400", label: "Secure" },
  warning: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400 animate-pulse", label: "Warning" },
  error: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", dot: "bg-red-400 animate-pulse", label: "Error" },
  monitoring: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", dot: "bg-blue-400", label: "Monitoring" },
};

function SecurityScore({ score }: { score: number }) {
  const color = score >= 90 ? "#10B981" : score >= 70 ? "#F59E0B" : "#EF4444";
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r="45" fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white font-mono">{score}</span>
        <span className="text-[10px] text-gray-500">/ 100</span>
      </div>
    </div>
  );
}

export default function PrivacyDashboard() {
  const [securityScore] = useState(94);
  const [keyTimeLeft, setKeyTimeLeft] = useState(82800); // 23 hours in seconds
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setKeyTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatKeyTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const warnings = OSI_LAYERS.filter(l => l.status === "warning" || l.status === "error").length;
  const secureCount = OSI_LAYERS.filter(l => l.status === "secure").length;

  return (
    <div className="h-full bg-[#08080F] text-white overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/8 bg-[#0A0A16] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-xl border border-green-500/30">
              <ShieldCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Privacy & Security</h1>
              <p className="text-xs text-gray-500">OSI Stack · Secure Enclave · E2EE · Privacy Zones · Audit Log</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: "Score", value: `${securityScore}/100`, color: "text-green-400" },
              { label: "Secure Layers", value: `${secureCount}/7`, color: "text-blue-400" },
              { label: "Warnings", value: warnings, color: warnings > 0 ? "text-amber-400" : "text-green-400" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Security score + key management */}
        <div className="space-y-4">
          {/* Score card */}
          <div className="bg-[#0F0F1E] border border-white/8 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Security Score</h3>
            <SecurityScore score={securityScore} />
            <div className="mt-4 space-y-2">
              {[
                { label: "Encryption", score: 100, color: "bg-green-500" },
                { label: "Authentication", score: 95, color: "bg-green-500" },
                { label: "Network", score: 82, color: "bg-amber-500" },
                { label: "Data Isolation", score: 98, color: "bg-green-500" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-24">{item.label}</span>
                  <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono w-8 text-right">{item.score}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key management */}
          <div className="bg-[#0F0F1E] border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Key Management</h3>
              <button className="p-1 text-gray-500 hover:text-white transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Session Key", algo: "AES-256-GCM", status: "active", timeLeft: formatKeyTime(keyTimeLeft) },
                { label: "Identity Key", algo: "ECDH P-256", status: "active", timeLeft: "30 days" },
                { label: "Signing Key", algo: "Ed25519", status: "active", timeLeft: "90 days" },
                { label: "Backup Key", algo: "RSA-4096", status: "stored", timeLeft: "Secure Enclave" },
              ].map(k => (
                <div key={k.label} className="flex items-center gap-2 p-2 bg-white/3 border border-white/8 rounded-lg">
                  <Key className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-gray-300">{k.label}</p>
                    <p className="text-[9px] text-gray-600 font-mono">{k.algo}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-[9px] font-medium ${k.status === "active" ? "text-green-400" : "text-blue-400"}`}>{k.status}</p>
                    <p className="text-[8px] text-gray-600 font-mono">{k.timeLeft}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy zones */}
          <div className="bg-[#0F0F1E] border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Privacy Zones</h3>
              <button className="p-1 text-gray-500 hover:text-white transition-colors"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            <div className="space-y-2">
              {PRIVACY_ZONES.map(zone => (
                <div key={zone.id} className={`flex items-center gap-2 p-2 rounded-lg border ${
                  zone.type === "private" ? "bg-blue-500/5 border-blue-500/15" :
                  zone.type === "shared" ? "bg-green-500/5 border-green-500/15" :
                  "bg-gray-500/5 border-gray-500/15"
                }`}>
                  {zone.encrypted ? <Lock className="w-3 h-3 text-green-400 flex-shrink-0" /> : <Unlock className="w-3 h-3 text-gray-500 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-gray-300 truncate">{zone.name}</p>
                    <p className="text-[9px] text-gray-600">{zone.participants.join(", ")}</p>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${zone.active ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: OSI Stack */}
        <div className="space-y-4">
          <div className="bg-[#0F0F1E] border border-white/8 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">OSI Security Stack</h3>
            <div className="space-y-2">
              {OSI_LAYERS.map(layer => {
                const status = STATUS_CONFIG[layer.status];
                const Icon = layer.icon;
                const isExpanded = expandedLayer === layer.layer;
                return (
                  <div key={layer.layer}>
                    <button
                      onClick={() => setExpandedLayer(isExpanded ? null : layer.layer)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left ${status.bg}`}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[9px] font-mono text-gray-500 w-4">L{layer.layer}</span>
                        <Icon className={`w-3.5 h-3.5 ${status.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-medium ${status.color}`}>{layer.name}</p>
                          {layer.latency !== undefined && layer.latency > 0 && (
                            <span className="text-[9px] text-gray-600 font-mono">{layer.latency}ms</span>
                          )}
                        </div>
                        <p className="text-[9px] text-gray-500 truncate font-mono">{layer.protocol}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                        {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 py-2 text-[10px] text-gray-500 bg-white/2 border-x border-b border-white/8 rounded-b-xl">
                            {layer.details}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* E2EE status */}
          <div className="bg-gradient-to-br from-green-600/10 to-teal-600/10 border border-green-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold text-white">End-to-End Encryption</h3>
              <span className="ml-auto px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-[9px] text-green-400 font-medium">ACTIVE</span>
            </div>
            <div className="space-y-1.5">
              {[
                "AES-256-GCM message encryption",
                "ECDH P-256 key exchange",
                "Perfect forward secrecy",
                "Secure Enclave key storage",
                "Certificate pinning enabled",
                "CRDT integrity verification",
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-400">
                  <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Audit log */}
        <div className="space-y-4">
          <div className="bg-[#0F0F1E] border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Audit Log</h3>
              <div className="flex items-center gap-1">
                <button className="p-1 text-gray-500 hover:text-white transition-colors"><RefreshCw className="w-3 h-3" /></button>
                <button className="p-1 text-gray-500 hover:text-white transition-colors"><Download className="w-3 h-3" /></button>
              </div>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {AUDIT_LOG.map(entry => (
                <div key={entry.id} className={`p-2.5 rounded-xl border ${
                  entry.status === "success" ? "bg-green-500/3 border-green-500/10" :
                  entry.status === "warning" ? "bg-amber-500/5 border-amber-500/15" :
                  "bg-red-500/5 border-red-500/15"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {entry.status === "success" ? <CheckCircle className="w-3 h-3 text-green-400" /> :
                       entry.status === "warning" ? <AlertTriangle className="w-3 h-3 text-amber-400" /> :
                       <XCircle className="w-3 h-3 text-red-400" />}
                      <span className="text-[10px] font-medium text-gray-300">{entry.event}</span>
                    </div>
                    <span className="text-[9px] text-gray-600 font-mono">{entry.timestamp}</span>
                  </div>
                  <p className="text-[9px] text-gray-500 ml-4.5">{entry.details}</p>
                  <div className="flex items-center gap-2 mt-1 ml-4.5">
                    <span className="text-[8px] text-gray-600">{entry.user}</span>
                    <span className="text-[8px] text-gray-700">·</span>
                    <span className="text-[8px] text-gray-600">{entry.platform}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
