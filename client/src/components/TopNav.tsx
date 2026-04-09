/*
 * TopNav — Apple-native slim command bar
 * Mobile: single 36px pill row — robot icon · status · battery · ⋯ menu
 * Desktop: full-width glass bar with persona pill + all status badges
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, Battery, Bug, Camera, Radio, Satellite, MoreHorizontal, X } from "lucide-react";
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

const STATUS_BG: Record<string, string> = {
  idle: "bg-white/30", working: "bg-green-400", paused: "bg-yellow-400", error: "bg-red-400",
};
const STATUS_LABELS: Record<string, string> = {
  idle: "IDLE", working: "ACTIVE", paused: "PAUSED", error: "ERROR",
};
const STATUS_COLORS: Record<string, string> = {
  idle: "text-white/50", working: "text-green-400", paused: "text-yellow-400", error: "text-red-400",
};

export default function TopNav({
  persona, batteryLevel, signalStrength, robotStatus,
  debugVisible, onToggleDebug, onToggleStream, isStreaming
}: TopNavProps) {
  const batteryColor = batteryLevel > 50 ? "text-green-400" : batteryLevel > 25 ? "text-yellow-400" : "text-red-400";
  const [showMenu, setShowMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  // ── MOBILE: slim single-row pill ──────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          paddingTop: `env(safe-area-inset-top, 0px)`,
          paddingLeft: `env(safe-area-inset-left, 0px)`,
          paddingRight: `env(safe-area-inset-right, 0px)`,
        }}
      >
        <div
          className="mx-3 mt-2 flex items-center justify-between rounded-2xl px-3 py-1.5"
          style={{
            background: 'oklch(0.09 0.015 260 / 0.92)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid oklch(1 0 0 / 0.1)',
            boxShadow: '0 2px 16px oklch(0 0 0 / 0.4)',
            minHeight: 40,
          }}
        >
          {/* Left: icon + name + status dot */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(145deg, oklch(0.55 0.15 145 / 0.8), oklch(0.35 0.12 145 / 0.9))' }}
            >
              <span className="text-xs">🤖</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_BG[robotStatus]} ${robotStatus === "working" ? "animate-pulse" : ""}`} />
              <span className={`text-[11px] font-semibold ${STATUS_COLORS[robotStatus]}`}>{persona.name.split(" ")[0]}</span>
            </div>
          </div>

          {/* Right: battery + ⋯ */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Battery size={12} className={batteryColor} />
              <span className={`text-[10px] font-mono ${batteryColor}`}>{Math.round(batteryLevel)}%</span>
            </div>
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setShowMenu(v => !v)}
                className="glass rounded-xl p-1.5 flex items-center justify-center"
                aria-label="More options"
              >
                {showMenu ? <X size={13} className="text-white/70" /> : <MoreHorizontal size={13} className="text-white/70" />}
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ type: "spring", damping: 20, stiffness: 400 }}
                    className="absolute top-full right-0 mt-2 z-50 rounded-2xl overflow-hidden"
                    style={{
                      background: 'oklch(0.12 0.02 260 / 0.97)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid oklch(1 0 0 / 0.12)',
                      boxShadow: '0 8px 32px oklch(0 0 0 / 0.6)',
                      minWidth: 200,
                    }}
                  >
                    {/* Signal */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                      <div className="flex items-center gap-2">
                        <Wifi size={13} className={signalStrength > 70 ? "text-green-400" : "text-yellow-400"} />
                        <span className="text-[11px] text-white/60">Signal</span>
                      </div>
                      <span className="text-[11px] font-mono text-white/80">{Math.round(signalStrength)}%</span>
                    </div>
                    {/* Platform */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                      <div className="flex items-center gap-2">
                        <Radio size={13} className="text-blue-400" />
                        <span className="text-[11px] text-white/60">Platform</span>
                      </div>
                      <span className="text-[11px] font-mono text-blue-300">iOS 27</span>
                    </div>
                    {/* GPS */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                      <div className="flex items-center gap-2">
                        <Satellite size={13} className="text-cyan-400" />
                        <span className="text-[11px] text-white/60">GPS</span>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-300">41.577°N</span>
                    </div>
                    {/* Stream toggle */}
                    <button
                      onClick={() => { onToggleStream(); setShowMenu(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 border-b border-white/8 active:bg-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <Camera size={13} className={isStreaming ? "text-green-400" : "text-white/40"} />
                        <span className="text-[11px] text-white/60">Stream</span>
                      </div>
                      <span className={`text-[11px] font-mono font-bold ${isStreaming ? "text-green-400" : "text-white/40"}`}>
                        {isStreaming ? "LIVE" : "OFF"}
                      </span>
                    </button>
                    {/* Debug toggle */}
                    <button
                      onClick={() => { onToggleDebug(); setShowMenu(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 active:bg-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <Bug size={13} className={debugVisible ? "text-yellow-400" : "text-white/40"} />
                        <span className="text-[11px] text-white/60">Debug</span>
                      </div>
                      <span className={`text-[11px] font-mono font-bold ${debugVisible ? "text-yellow-400" : "text-white/40"}`}>
                        {debugVisible ? "ON" : "OFF"}
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── DESKTOP: full-width glass bar ─────────────────────────────────────────
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
      style={{
        paddingTop: `calc(env(safe-area-inset-top, 0px) + 8px)`,
        paddingLeft: `calc(env(safe-area-inset-left, 0px) + 16px)`,
        paddingRight: `calc(env(safe-area-inset-right, 0px) + 16px)`,
        paddingBottom: 8,
        background: 'oklch(0.09 0.015 260 / 0.88)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        borderBottom: '1px solid oklch(1 0 0 / 0.1)',
        boxShadow: '0 1px 0 oklch(1 0 0 / 0.12) inset',
      }}
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(145deg, oklch(0.55 0.15 145 / 0.8), oklch(0.35 0.12 145 / 0.9))', boxShadow: '0 2px 8px oklch(0 0 0 / 0.5)' }}
        >
          <span className="text-base">🤖</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight leading-none">DOGE-Landscaper</span>
            <span className="text-[9px] glass text-white/40 px-1.5 py-0.5 rounded-full border border-white/10 font-mono">v2.8</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${STATUS_BG[robotStatus]} ${robotStatus === "working" ? "animate-pulse" : ""}`} />
            <span className={`text-[9px] font-mono ${STATUS_COLORS[robotStatus]}`}>{STATUS_LABELS[robotStatus]}</span>
            <span className="text-[9px] text-white/20">·</span>
            <span className="text-[9px] text-white/40 font-mono">West Liberty, IA</span>
          </div>
        </div>
      </div>

      {/* Center: Persona pill */}
      <div className="hidden md:flex items-center gap-2">
        <motion.div
          className="glass rounded-full px-4 py-1.5 flex items-center gap-2 cursor-default"
          whileHover={{ scale: 1.02 }}
        >
          <span className="text-xs font-semibold text-yellow-300">{persona.name}</span>
          <span className="text-[9px] text-white/30">·</span>
          <span className="text-[9px] text-white/50 capitalize">{persona.mood}</span>
          <span className="text-[9px] text-white/30">·</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[9px] font-mono text-cyan-400">3 online</span>
          </div>
        </motion.div>
      </div>

      {/* Right: Status badges */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 glass rounded-lg px-2 py-1">
          <Wifi size={11} className={signalStrength > 70 ? "text-green-400" : "text-yellow-400"} />
          <span className="text-[9px] font-mono text-white/60">{Math.round(signalStrength)}%</span>
        </div>
        <div className="flex items-center gap-1 glass rounded-lg px-2 py-1">
          <Battery size={11} className={batteryColor} />
          <span className={`text-[9px] font-mono ${batteryColor}`}>{Math.round(batteryLevel)}%</span>
        </div>
        <motion.button
          onClick={onToggleStream}
          className={`haptic flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-medium transition-all ${
            isStreaming ? "glass-green text-green-300 border border-green-400/30" : "glass text-white/50"
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <Camera size={11} />
          <span className="hidden sm:inline">{isStreaming ? "LIVE" : "PAUSED"}</span>
        </motion.button>
        <motion.button
          onClick={onToggleDebug}
          className={`haptic flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-medium transition-all ${
            debugVisible ? "glass-gold text-yellow-300 border border-yellow-400/30" : "glass text-white/50 hover:text-white/80"
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <Bug size={11} />
          <span className="hidden sm:inline">DEBUG</span>
        </motion.button>
      </div>
    </div>
  );
}
