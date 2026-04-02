/*
 * DOGE-LANDSCAPER — POV Viewer
 * Design: Spatial Glass Command Deck
 * Primary view: 3D LiDAR scan (navigable Three.js)
 * Secondary view: Live camera feed with AI detection overlays
 * Toggle between modes with the top-right buttons
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, Camera, Eye, Activity, AlertTriangle, SplitSquareHorizontal, GripVertical } from "lucide-react";
import type { RobotPersona } from "@/lib/data";
import LidarViewer3D from "@/components/LidarViewer3D";

interface POVViewerProps {
  isStreaming: boolean;
  robotStatus: "idle" | "working" | "paused" | "error";
  currentTask: string;
  persona: RobotPersona;
  isSprayActive?: boolean;
  completedTaskIds?: string[];
}

const DETECTED_OBJECTS = [
  { id: 1, label: "Dandelion x23", x: 35, y: 65, color: "oklch(0.65 0.22 25)", type: "weed" },
  { id: 2, label: "Oak Tree", x: 55, y: 30, color: "oklch(0.55 0.15 145)", type: "tree" },
  { id: 3, label: "Swing Set", x: 25, y: 45, color: "oklch(0.82 0.18 85)", type: "obstacle" },
  { id: 4, label: "Scilla Bulbs", x: 70, y: 70, color: "oklch(0.65 0.15 280)", type: "flower" },
  { id: 5, label: "Fence Line", x: 80, y: 40, color: "oklch(0.85 0.18 195)", type: "boundary" },
];

const YARD_PHOTO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/116029439/cao3qXUUr9zrMdetSxxjdj/IMG_0731_a9a2a6e2.jpeg";

type ViewMode = "3d" | "camera" | "split";

export default function POVViewer({ isStreaming, robotStatus, currentTask, persona, isSprayActive = false, completedTaskIds = [] }: POVViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [showObjects, setShowObjects] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  // Before/After split view
  const [splitPos, setSplitPos] = useState(50); // percentage
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleSplitDrag = useCallback((clientX: number) => {
    if (!splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setSplitPos(pct);
  }, []);

  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const onMove = (ev: MouseEvent) => { if (isDraggingRef.current) handleSplitDrag(ev.clientX); };
    const onUp = () => { isDraggingRef.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [handleSplitDrag]);

  const handleSplitTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleSplitDrag(e.touches[0].clientX);
  }, [handleSplitDrag]);

  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setFrameCount(f => f + 1);
      setScanProgress(p => (p + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0f1a]">

      {/* === SPLIT VIEW: Before (3D) / After (Photo) === */}
      {viewMode === "split" && (
        <div ref={splitContainerRef} className="absolute inset-0 overflow-hidden select-none">
          {/* Left side: 3D LiDAR */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}>
            <LidarViewer3D isSprayActive={isSprayActive} completedTaskIds={completedTaskIds} />
          </div>
          {/* Right side: Yard photo */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}>
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${YARD_PHOTO_URL})` }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, oklch(0 0 0 / 0.5) 100%)' }} />
              {showObjects && DETECTED_OBJECTS.map(obj => (
                <div key={obj.id} className="absolute pointer-events-none" style={{ left: `${obj.x}%`, top: `${obj.y}%`, transform: 'translate(-50%, -50%)' }}>
                  <div className="border rounded px-1.5 py-0.5 text-[9px] font-mono font-bold whitespace-nowrap"
                    style={{ borderColor: obj.color, color: obj.color, background: `${obj.color.replace(')', ' / 0.15)')}` }}>
                    {obj.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Divider handle */}
          <div
            className="absolute top-0 bottom-0 z-30 flex items-center justify-center cursor-col-resize"
            style={{ left: `${splitPos}%`, transform: 'translateX(-50%)', width: 32 }}
            onMouseDown={handleSplitMouseDown}
            onTouchMove={handleSplitTouchMove}
            onTouchStart={(e) => e.preventDefault()}
          >
            <div className="w-0.5 h-full bg-yellow-400/60 absolute" />
            <div className="relative z-10 glass rounded-full p-1.5 border border-yellow-400/50 shadow-lg">
              <GripVertical size={14} className="text-yellow-300" />
            </div>
          </div>
          {/* Labels */}
          <div className="absolute top-3 z-20 pointer-events-none" style={{ left: `${Math.max(8, splitPos - 25)}%` }}>
            <div className="glass rounded-lg px-2 py-1">
              <span className="text-[9px] font-mono text-cyan-400">3D LiDAR</span>
            </div>
          </div>
          <div className="absolute top-3 z-20 pointer-events-none" style={{ left: `${Math.min(splitPos + 3, 75)}%` }}>
            <div className="glass rounded-lg px-2 py-1">
              <span className="text-[9px] font-mono text-green-400">PHOTO</span>
            </div>
          </div>
        </div>
      )}

      {/* === PRIMARY: 3D LIDAR VIEW === */}
      <AnimatePresence mode="wait">
        {viewMode === "3d" && (
          <motion.div
            key="3d"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <LidarViewer3D isSprayActive={isSprayActive} completedTaskIds={completedTaskIds} />
          </motion.div>
        )}

        {/* === SECONDARY: CAMERA / PHOTO VIEW === */}
        {viewMode === "camera" && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {isStreaming ? (
              <div
                className="w-full h-full bg-cover bg-center relative"
                style={{ backgroundImage: `url(${YARD_PHOTO_URL})` }}
              >
                {/* Vignette */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'radial-gradient(ellipse at center, transparent 50%, oklch(0 0 0 / 0.6) 100%)',
                }} />

                {/* Scan line */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div
                    className="absolute left-0 right-0 h-px"
                    style={{ background: 'oklch(0.85 0.18 195 / 0.3)' }}
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  />
                </div>

                {/* AI Detection overlays */}
                <AnimatePresence>
                  {showObjects && DETECTED_OBJECTS.map(obj => (
                    <motion.div
                      key={obj.id}
                      className="absolute pointer-events-none"
                      style={{ left: `${obj.x}%`, top: `${obj.y}%`, transform: 'translate(-50%, -50%)' }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: obj.id * 0.1 }}
                    >
                      <div className="relative">
                        <div className="border rounded px-1.5 py-0.5 text-[9px] font-mono font-bold whitespace-nowrap"
                          style={{
                            borderColor: obj.color,
                            color: obj.color,
                            background: `${obj.color.replace(')', ' / 0.15)')}`,
                            boxShadow: `0 0 8px ${obj.color.replace(')', ' / 0.3)')}`,
                          }}
                        >
                          {obj.label}
                        </div>
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l" style={{ borderColor: obj.color }} />
                        <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r" style={{ borderColor: obj.color }} />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l" style={{ borderColor: obj.color }} />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r" style={{ borderColor: obj.color }} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* LIVE badge */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none">
                  <div className="glass rounded-full px-3 py-1 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] text-red-400 font-mono font-bold">LIVE</span>
                    </div>
                    <span className="text-[10px] text-white/40">|</span>
                    <span className="text-[10px] font-mono text-white/60">{frameCount} FPS~30</span>
                    <span className="text-[10px] text-white/40">|</span>
                    <span className="text-[10px] font-mono text-white/60">4K HDR</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="glass rounded-2xl p-6 text-center">
                  <Eye size={32} className="text-white/30 mx-auto mb-2" />
                  <p className="text-sm text-white/60">Stream Paused</p>
                  <p className="text-xs text-white/30 mt-1">Tap LIVE to resume</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* === HUD OVERLAYS (always on top) === */}

      {/* HUD corners */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        <div className="hud-corner hud-corner-br" />
      </div>

      {/* Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="relative">
          <div className="w-6 h-px bg-yellow-400/40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-6 bg-yellow-400/40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-yellow-400/40 rounded-full" />
        </div>
      </div>

      {/* View mode toggle — top right */}
      <div className="absolute top-2 right-2 z-20 flex gap-1">
        <button
          onClick={() => setViewMode("3d")}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${
            viewMode === "3d"
              ? "glass-gold text-yellow-300 border border-yellow-400/30"
              : "glass text-white/50 hover:text-white/80"
          }`}
        >
          <Scan size={11} />3D LiDAR
        </button>
        <button
          onClick={() => setViewMode("camera")}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${
            viewMode === "camera"
              ? "glass-gold text-yellow-300 border border-yellow-400/30"
              : "glass text-white/50 hover:text-white/80"
          }`}
        >
          <Camera size={11} />Camera
        </button>
        <button
          onClick={() => setViewMode("split")}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${
            viewMode === "split"
              ? "glass-gold text-yellow-300 border border-yellow-400/30"
              : "glass text-white/50 hover:text-white/80"
          }`}
        >
          <SplitSquareHorizontal size={11} />Split
        </button>
        {(viewMode === "camera" || viewMode === "split") && (
          <button
            onClick={() => setShowObjects(v => !v)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${
              showObjects ? "glass text-cyan-300 border border-cyan-400/30" : "glass text-white/40"
            }`}
          >
            <Eye size={11} />AI
          </button>
        )}
      </div>

      {/* Current task — top right (below view toggle) */}
      <div className="absolute top-10 right-2 z-20 pointer-events-none">
        <div className="glass rounded-xl p-2 max-w-[180px]">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity size={10} className="text-green-400" />
            <span className="text-[9px] text-green-400 font-mono uppercase tracking-wider">Current Task</span>
          </div>
          <p className="text-[10px] text-white/90 leading-tight">{currentTask}</p>
          <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-400 rounded-full"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chip's quip — bottom center */}
      <AnimatePresence>
        {isStreaming && (
          <motion.div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none z-20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="glass rounded-xl px-3 py-1.5 max-w-[280px] text-center">
              <p className="text-[10px] text-yellow-300 italic">
                💬 "{persona.catchphrase}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence>
        {robotStatus === "error" && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="glass-red rounded-xl px-4 py-2 flex items-center gap-2 border border-red-500/50">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-xs text-red-300 font-bold">ROBOT ERROR — Check Systems</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
