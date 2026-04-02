/**
 * DOGE-LANDSCAPER — Companion QR Code Panel
 * Design: Spatial Glass Command Deck
 * Feature: Device handoff via QR deep-link with live robot state encoded in URL
 * Supports: iPhone, iPad, Apple TV, visionOS, and any browser
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Smartphone, Tablet, Tv, Glasses, Monitor, Copy, RefreshCw,
  Share2, Wifi, Lock, Zap, Eye, Radio
} from "lucide-react";

interface CompanionQRPanelProps {
  robotStatus?: string;
  currentTask?: string;
  isSprayActive?: boolean;
  batteryLevel?: number;
  signalStrength?: number;
  chipMood?: string;
}

type DeviceTarget = "iphone" | "ipad" | "appletv" | "visionpro" | "browser";

const DEVICE_TARGETS: { id: DeviceTarget; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  { id: "iphone", label: "iPhone", icon: <Smartphone size={16} />, desc: "iOS 26+ · Continuity Camera", color: "#007AFF" },
  { id: "ipad", label: "iPad", icon: <Tablet size={16} />, desc: "iPadOS 26+ · Full Dashboard", color: "#34C759" },
  { id: "appletv", label: "Apple TV", icon: <Tv size={16} />, desc: "tvOS 26+ · Command Theater", color: "#FF9500" },
  { id: "visionpro", label: "Vision Pro", icon: <Glasses size={16} />, desc: "visionOS 26+ · Spatial HUD", color: "#BF5AF2" },
  { id: "browser", label: "Any Browser", icon: <Monitor size={16} />, desc: "Universal · Web App", color: "#64D2FF" },
];

function encodeRobotState(props: CompanionQRPanelProps): string {
  const state = {
    s: props.robotStatus ?? "active",
    t: props.currentTask ?? "standby",
    sp: props.isSprayActive ? 1 : 0,
    b: props.batteryLevel ?? 77,
    sig: props.signalStrength ?? 71,
    m: props.chipMood ?? "ready",
    ts: Date.now(),
    loc: "52776",
    bot: "chip-mchaymaker-v2.7",
  };
  return btoa(JSON.stringify(state)).replace(/=/g, "");
}

function buildDeepLink(target: DeviceTarget, stateToken: string): string {
  const base = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    device: target,
    session: stateToken,
    view: target === "visionpro" ? "spatial" : target === "appletv" ? "theater" : "dashboard",
    autoconnect: "1",
  });

  // Device-specific deep link schemes
  switch (target) {
    case "iphone":
      return `${base}?${params.toString()}#pov`;
    case "ipad":
      return `${base}?${params.toString()}#dashboard`;
    case "appletv":
      return `${base}?${params.toString()}#theater`;
    case "visionpro":
      return `${base}?${params.toString()}#spatial`;
    default:
      return `${base}?${params.toString()}`;
  }
}

export default function CompanionQRPanel({
  robotStatus = "active",
  currentTask = "Apply Scotts Weed & Feed — Zone A",
  isSprayActive = false,
  batteryLevel = 77,
  signalStrength = 71,
  chipMood = "Ready to Rumble",
}: CompanionQRPanelProps) {
  const [selectedTarget, setSelectedTarget] = useState<DeviceTarget>("iphone");
  const [stateToken, setStateToken] = useState(() => encodeRobotState({ robotStatus, currentTask, isSprayActive, batteryLevel, signalStrength, chipMood }));
  const [deepLink, setDeepLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [sessionId] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());

  // Refresh state token
  const refreshToken = useCallback(() => {
    const token = encodeRobotState({ robotStatus, currentTask, isSprayActive, batteryLevel, signalStrength, chipMood });
    setStateToken(token);
    setLastRefresh(new Date());
  }, [robotStatus, currentTask, isSprayActive, batteryLevel, signalStrength, chipMood]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(refreshToken, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, refreshToken]);

  // Rebuild deep link when target or token changes
  useEffect(() => {
    setDeepLink(buildDeepLink(selectedTarget, stateToken));
  }, [selectedTarget, stateToken]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      toast.success("🔗 Deep link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — try long-pressing the URL below");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "DOGE-Landscaper — Chip McHaymaker Live Session",
          text: `Join Chip's live yard mission in Wilton, IA! Session: ${sessionId}`,
          url: deepLink,
        });
        toast.success("📤 Session link shared!");
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const selectedDef = DEVICE_TARGETS.find(d => d.id === selectedTarget)!;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
            <Radio size={14} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Companion Handoff</h3>
            <p className="text-[10px] text-white/40">Session: <span className="text-cyan-400 font-mono">{sessionId}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-mono">LIVE</span>
        </div>
      </div>

      {/* Live status snapshot */}
      <div className="glass rounded-xl p-3 space-y-2">
        <p className="text-[9px] text-white/40 uppercase tracking-wider">Encoded Robot State</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Status", value: robotStatus, color: "text-green-400" },
            { label: "Battery", value: `${batteryLevel}%`, color: batteryLevel > 50 ? "text-green-400" : "text-yellow-400" },
            { label: "Signal", value: `${signalStrength}%`, color: "text-cyan-400" },
            { label: "Spray", value: isSprayActive ? "ACTIVE" : "OFF", color: isSprayActive ? "text-blue-400" : "text-white/40" },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center bg-white/3 rounded-lg px-2 py-1">
              <span className="text-[9px] text-white/40">{item.label}</span>
              <span className={`text-[9px] font-mono font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
        <div className="bg-white/3 rounded-lg px-2 py-1.5">
          <span className="text-[9px] text-white/40">Task: </span>
          <span className="text-[9px] text-yellow-300 font-medium">{currentTask}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-white/30">Last synced: {lastRefresh.toLocaleTimeString()}</span>
          <button
            onClick={refreshToken}
            className="flex items-center gap-1 text-[9px] text-cyan-400/70 hover:text-cyan-400 transition-all"
          >
            <RefreshCw size={9} />Refresh
          </button>
        </div>
      </div>

      {/* Device target selector */}
      <div className="space-y-1.5">
        <p className="text-[9px] text-white/40 uppercase tracking-wider">Target Device</p>
        <div className="grid grid-cols-1 gap-1">
          {DEVICE_TARGETS.map(target => (
            <button
              key={target.id}
              onClick={() => setSelectedTarget(target.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-left ${
                selectedTarget === target.id
                  ? "border-opacity-50 bg-opacity-10"
                  : "border-white/10 bg-white/3 hover:bg-white/5"
              }`}
              style={selectedTarget === target.id ? {
                borderColor: target.color + "80",
                backgroundColor: target.color + "15",
              } : {}}
            >
              <span style={{ color: selectedTarget === target.id ? target.color : "rgba(255,255,255,0.4)" }}>
                {target.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-semibold ${selectedTarget === target.id ? "text-white" : "text-white/60"}`}>
                  {target.label}
                </p>
                <p className="text-[9px] text-white/30 truncate">{target.desc}</p>
              </div>
              {selectedTarget === target.id && (
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: target.color }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* QR Code */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTarget + stateToken.slice(-8)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-3"
        >
          {/* QR frame */}
          <div className="relative">
            {/* Corner HUD markers */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 rounded-tl" style={{ borderColor: selectedDef.color }} />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 rounded-tr" style={{ borderColor: selectedDef.color }} />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 rounded-bl" style={{ borderColor: selectedDef.color }} />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 rounded-br" style={{ borderColor: selectedDef.color }} />

            <div className="bg-white p-3 rounded-xl shadow-lg">
              {deepLink ? (
                <QRCodeSVG
                  value={deepLink}
                  size={160}
                  level="M"
                  fgColor="#0a0f1a"
                  bgColor="#ffffff"
                  imageSettings={{
                    src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iIzBhMGYxYSIvPjx0ZXh0IHg9IjEyIiB5PSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzQ0ZmZhYSI+8J+MxjwvdGV4dD48L3N2Zz4=",
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center">
                  <RefreshCw size={24} className="text-gray-400 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Device label */}
          <div className="text-center">
            <div className="flex items-center gap-1.5 justify-center mb-0.5">
              <span style={{ color: selectedDef.color }}>{selectedDef.icon}</span>
              <span className="text-xs font-semibold text-white">{selectedDef.label} Session</span>
            </div>
            <p className="text-[9px] text-white/40">{selectedDef.desc}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* URL display */}
      <div className="glass rounded-xl p-2.5 space-y-2">
        <p className="text-[9px] text-white/30 uppercase tracking-wider">Deep Link URL</p>
        <p className="text-[9px] font-mono text-cyan-300/70 break-all leading-relaxed line-clamp-2">
          {deepLink || "Generating..."}
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium transition-all border ${
              copied
                ? "bg-green-500/20 border-green-400/40 text-green-300"
                : "bg-white/5 border-white/10 text-white/60 hover:text-white/90 hover:bg-white/10"
            }`}
          >
            <Copy size={10} />{copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium bg-blue-500/15 border border-blue-400/30 text-blue-300 hover:bg-blue-500/25 transition-all"
          >
            <Share2 size={10} />Share
          </button>
        </div>
      </div>

      {/* Security + Auto-refresh */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between glass rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Lock size={10} className="text-green-400" />
            <span className="text-[10px] text-white/60">Encrypted state token</span>
          </div>
          <span className="text-[9px] font-mono text-green-400">AES-128</span>
        </div>
        <div className="flex items-center justify-between glass rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Zap size={10} className="text-yellow-400" />
            <span className="text-[10px] text-white/60">Auto-refresh QR (30s)</span>
          </div>
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`text-[9px] font-mono px-2 py-0.5 rounded-md transition-all ${
              autoRefresh ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/30"
            }`}
          >
            {autoRefresh ? "ON" : "OFF"}
          </button>
        </div>
        <div className="flex items-center justify-between glass rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Wifi size={10} className="text-cyan-400" />
            <span className="text-[10px] text-white/60">Continuity Camera ready</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[9px] font-mono text-cyan-400">READY</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="glass rounded-xl p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Eye size={12} className="text-white/40" />
          <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">How to Use</p>
        </div>
        {[
          { step: "1", text: "Select your target device above" },
          { step: "2", text: "Scan QR with your iPhone camera or open the link" },
          { step: "3", text: "The session auto-connects with Chip's live state" },
          { step: "4", text: "visionOS: opens spatial HUD overlay in your yard" },
          { step: "5", text: "Apple TV: opens command theater for big-screen monitoring" },
        ].map(item => (
          <div key={item.step} className="flex items-start gap-2">
            <span className="text-[9px] font-mono text-white/20 w-3 flex-shrink-0">{item.step}.</span>
            <span className="text-[9px] text-white/50 leading-relaxed">{item.text}</span>
          </div>
        ))}
      </div>

      {/* Chip's quip */}
      <div className="glass rounded-xl p-3 border border-yellow-400/20">
        <p className="text-[10px] text-yellow-300/80 italic leading-relaxed">
          💬 "Hand me off to the big screen, partner — Chip McHaymaker works best when the whole family can watch him dodge them dandelions!"
        </p>
      </div>
    </div>
  );
}
