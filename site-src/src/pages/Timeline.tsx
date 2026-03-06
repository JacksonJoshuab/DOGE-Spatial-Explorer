import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, Play, Pause, Square, SkipBack, SkipForward,
  Plus, Trash2, Lock, Unlock, Eye, EyeOff, ChevronRight,
  ChevronDown, GitBranch, Download, Upload, Zap, RefreshCw,
  Diamond, Circle, Triangle
} from "lucide-react";

// ── types ─────────────────────────────────────────────────────────────────────
interface Keyframe { frame: number; value: number; easing: "linear" | "ease" | "bounce"; }
interface Track {
  id: string; name: string; object: string; property: string;
  color: string; locked: boolean; visible: boolean; muted: boolean;
  keyframes: Keyframe[];
  expanded: boolean;
}

// ── initial data ──────────────────────────────────────────────────────────────
const INITIAL_TRACKS: Track[] = [
  { id: "t1", name: "Z-Pinch Column", object: "Z-Pinch Column", property: "Location Z", color: "#60a5fa", locked: false, visible: true, muted: false, expanded: true,
    keyframes: [{ frame: 0, value: 0, easing: "ease" }, { frame: 30, value: 2.5, easing: "ease" }, { frame: 60, value: 0, easing: "bounce" }, { frame: 90, value: -1, easing: "ease" }, { frame: 120, value: 0, easing: "ease" }] },
  { id: "t2", name: "Plasma Rings", object: "Plasma Rings ×18", property: "Scale", color: "#a78bfa", locked: false, visible: true, muted: false, expanded: false,
    keyframes: [{ frame: 0, value: 1, easing: "ease" }, { frame: 45, value: 1.8, easing: "ease" }, { frame: 90, value: 0.6, easing: "bounce" }, { frame: 120, value: 1, easing: "ease" }] },
  { id: "t3", name: "Core Sphere", object: "Core Sphere", property: "Emission Strength", color: "#34d399", locked: false, visible: true, muted: false, expanded: false,
    keyframes: [{ frame: 0, value: 0, easing: "linear" }, { frame: 20, value: 5, easing: "ease" }, { frame: 50, value: 2, easing: "ease" }, { frame: 80, value: 8, easing: "ease" }, { frame: 120, value: 3, easing: "ease" }] },
  { id: "t4", name: "Camera", object: "Main Camera", property: "Focal Length", color: "#f59e0b", locked: false, visible: true, muted: false, expanded: false,
    keyframes: [{ frame: 0, value: 35, easing: "ease" }, { frame: 60, value: 85, easing: "ease" }, { frame: 120, value: 50, easing: "ease" }] },
  { id: "t5", name: "Particle Count", object: "Particle System", property: "Count", color: "#f87171", locked: true, visible: true, muted: false, expanded: false,
    keyframes: [{ frame: 0, value: 0, easing: "linear" }, { frame: 30, value: 2048, easing: "ease" }, { frame: 90, value: 4096, easing: "ease" }, { frame: 120, value: 1024, easing: "ease" }] },
  { id: "t6", name: "Area Light", object: "Area Light 01", property: "Energy", color: "#ec4899", locked: false, visible: true, muted: true, expanded: false,
    keyframes: [{ frame: 0, value: 100, easing: "ease" }, { frame: 40, value: 500, easing: "ease" }, { frame: 80, value: 200, easing: "ease" }, { frame: 120, value: 100, easing: "ease" }] },
];

const TOTAL_FRAMES = 120;
const FPS = 24;

// ── helpers ───────────────────────────────────────────────────────────────────
function frameToTime(frame: number) {
  const s = frame / FPS;
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toFixed(2).padStart(5, "0")}`;
}

function KeyframeMarker({ kf, trackColor, totalFrames, containerWidth, selected, onClick }:
  { kf: Keyframe; trackColor: string; totalFrames: number; containerWidth: number; selected: boolean; onClick: () => void }) {
  const x = (kf.frame / totalFrames) * containerWidth;
  return (
    <div onClick={onClick} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10 group"
      style={{ left: x }}>
      <div className={`w-3 h-3 rotate-45 border-2 transition-all ${selected ? "scale-125" : "scale-100 group-hover:scale-110"}`}
        style={{ backgroundColor: selected ? trackColor : "transparent", borderColor: trackColor }} />
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function Timeline() {
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedKf, setSelectedKf] = useState<{ trackId: string; frame: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [blenderSync, setBlenderSync] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);
  const TRACK_HEADER_W = 220;
  const TIMELINE_W = 600;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setCurrentFrame(f => {
        if (f >= TOTAL_FRAMES) { setPlaying(false); return 0; }
        return f + 1;
      });
    }, 1000 / FPS);
    return () => clearInterval(id);
  }, [playing]);

  const toggleTrackProp = (id: string, prop: "locked" | "visible" | "muted" | "expanded") => {
    setTracks(ts => ts.map(t => t.id === id ? { ...t, [prop]: !t[prop] } : t));
  };

  const scrubTimeline = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frame = Math.round((x / TIMELINE_W) * TOTAL_FRAMES);
    setCurrentFrame(Math.max(0, Math.min(TOTAL_FRAMES, frame)));
  };

  const playheadX = (currentFrame / TOTAL_FRAMES) * TIMELINE_W;

  // Frame ruler ticks
  const ticks = Array.from({ length: TOTAL_FRAMES / 5 + 1 }, (_, i) => i * 5);

  return (
    <div className="min-h-screen bg-[#08080F] text-white p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-pink-400" /> Timeline & Animation
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Keyframe editor · NLA sync · {TOTAL_FRAMES} frames @ {FPS}fps · {(TOTAL_FRAMES / FPS).toFixed(1)}s</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${blenderSync ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-white/5 border-white/10 text-gray-400"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${blenderSync ? "bg-amber-400 animate-pulse" : "bg-gray-600"}`} />
            Blender NLA {blenderSync ? "Synced" : "Offline"}
          </div>
          <button onClick={() => setBlenderSync(b => !b)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-colors">
            {blenderSync ? "Disconnect" : "Connect"}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-xs hover:bg-blue-500/30 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export USDZ
          </button>
        </div>
      </div>

      {/* Transport bar */}
      <div className="bg-white/3 border border-white/8 rounded-xl p-3 flex items-center gap-4 flex-wrap">
        {/* Playback controls */}
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentFrame(0)} className="p-1.5 text-gray-400 hover:text-white transition-colors"><SkipBack className="w-4 h-4" /></button>
          <button onClick={() => setPlaying(p => !p)}
            className="w-9 h-9 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-300 hover:bg-pink-500/30 transition-colors">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button onClick={() => { setPlaying(false); setCurrentFrame(0); }} className="p-1.5 text-gray-400 hover:text-white transition-colors"><Square className="w-4 h-4" /></button>
          <button onClick={() => setCurrentFrame(TOTAL_FRAMES)} className="p-1.5 text-gray-400 hover:text-white transition-colors"><SkipForward className="w-4 h-4" /></button>
        </div>

        {/* Frame counter */}
        <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5">
          <span className="text-xs text-gray-500">Frame</span>
          <span className="text-sm font-mono text-white font-bold w-8 text-center">{currentFrame}</span>
          <span className="text-gray-600">/</span>
          <span className="text-xs font-mono text-gray-400">{TOTAL_FRAMES}</span>
        </div>
        <div className="text-xs font-mono text-gray-400">{frameToTime(currentFrame)}</div>

        {/* Zoom */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-500">Zoom</span>
          <input type="range" min="0.5" max="3" step="0.1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))}
            className="w-20 accent-pink-400" />
          <span className="text-xs text-gray-400 font-mono w-8">{zoom.toFixed(1)}×</span>
        </div>

        {/* Add keyframe */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-colors">
          <Diamond className="w-3.5 h-3.5 text-amber-400" /> Add Keyframe
        </button>
      </div>

      {/* Main timeline area */}
      <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
        {/* Column headers */}
        <div className="flex border-b border-white/8">
          <div className="flex-shrink-0 bg-white/3 border-r border-white/8 px-3 py-2 text-[10px] text-gray-500 uppercase tracking-wider" style={{ width: TRACK_HEADER_W }}>
            Track
          </div>
          <div ref={timelineRef} className="flex-1 relative px-0 py-2 overflow-hidden cursor-pointer" style={{ minWidth: TIMELINE_W }}
            onClick={scrubTimeline}>
            {/* Ruler */}
            <div className="relative h-4">
              {ticks.map(f => (
                <div key={f} className="absolute top-0 flex flex-col items-center" style={{ left: `${(f / TOTAL_FRAMES) * 100}%` }}>
                  <div className={`w-px ${f % 10 === 0 ? "h-3 bg-white/20" : "h-1.5 bg-white/10"}`} />
                  {f % 10 === 0 && <span className="text-[9px] text-gray-600 font-mono mt-0.5">{f}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tracks */}
        <div className="relative">
          {tracks.map((track, ti) => (
            <div key={track.id} className={`border-b border-white/5 ${track.muted ? "opacity-40" : ""}`}>
              {/* Track header + keyframe row */}
              <div className="flex">
                {/* Header */}
                <div className="flex-shrink-0 border-r border-white/8 px-2 py-2 flex items-center gap-1.5" style={{ width: TRACK_HEADER_W }}>
                  <button onClick={() => toggleTrackProp(track.id, "expanded")} className="text-gray-600 hover:text-gray-400 transition-colors">
                    {track.expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: track.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 truncate">{track.name}</p>
                    <p className="text-[9px] text-gray-600 truncate">{track.property}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => toggleTrackProp(track.id, "visible")} className={`p-1 rounded transition-colors ${!track.visible ? "text-gray-600" : "text-gray-400 hover:text-gray-200"}`}>
                      {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <button onClick={() => toggleTrackProp(track.id, "locked")} className={`p-1 rounded transition-colors ${track.locked ? "text-amber-400" : "text-gray-400 hover:text-gray-200"}`}>
                      {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Keyframe lane */}
                <div className="flex-1 relative h-10 cursor-crosshair" style={{ minWidth: TIMELINE_W }}
                  onClick={e => {
                    if (track.locked) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const frame = Math.round((x / TIMELINE_W) * TOTAL_FRAMES);
                    scrubTimeline(e as any);
                  }}>
                  {/* Track background */}
                  <div className="absolute inset-0 opacity-5" style={{ backgroundColor: track.color }} />
                  {/* Vertical grid lines */}
                  {ticks.filter(f => f % 10 === 0).map(f => (
                    <div key={f} className="absolute top-0 bottom-0 w-px bg-white/5" style={{ left: `${(f / TOTAL_FRAMES) * 100}%` }} />
                  ))}
                  {/* Keyframe curve (simplified) */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    {track.keyframes.length > 1 && (
                      <polyline
                        points={track.keyframes.map(kf => {
                          const x = (kf.frame / TOTAL_FRAMES) * TIMELINE_W;
                          const maxVal = Math.max(...track.keyframes.map(k => k.value));
                          const minVal = Math.min(...track.keyframes.map(k => k.value));
                          const range = maxVal - minVal || 1;
                          const y = 40 - ((kf.value - minVal) / range) * 30 - 5;
                          return `${x},${y}`;
                        }).join(" ")}
                        fill="none"
                        stroke={track.color}
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                  {/* Keyframe markers */}
                  {track.keyframes.map(kf => (
                    <KeyframeMarker key={kf.frame} kf={kf} trackColor={track.color}
                      totalFrames={TOTAL_FRAMES} containerWidth={TIMELINE_W}
                      selected={selectedKf?.trackId === track.id && selectedKf?.frame === kf.frame}
                      onClick={() => setSelectedKf({ trackId: track.id, frame: kf.frame })} />
                  ))}
                </div>
              </div>

              {/* Expanded sub-tracks */}
              <AnimatePresence>
                {track.expanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    {["Location X", "Location Y", "Rotation Z", "Scale"].map((prop, pi) => (
                      <div key={prop} className="flex border-t border-white/3">
                        <div className="flex-shrink-0 border-r border-white/8 px-2 py-1.5 flex items-center gap-2" style={{ width: TRACK_HEADER_W }}>
                          <div className="w-3" />
                          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          <span className="text-[10px] text-gray-500">{prop}</span>
                        </div>
                        <div className="flex-1 relative h-6" style={{ minWidth: TIMELINE_W }}>
                          <div className="absolute inset-0 opacity-3" style={{ backgroundColor: track.color }} />
                          {[15, 45, 75, 105].map(f => (
                            <div key={f} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border border-white/30"
                              style={{ left: `${(f / TOTAL_FRAMES) * 100}%` }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Playhead */}
          <div className="absolute top-0 bottom-0 pointer-events-none z-30"
            style={{ left: TRACK_HEADER_W + playheadX }}>
            <div className="w-px h-full bg-red-400/80" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0 w-3 h-3 bg-red-400 rotate-45" />
          </div>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Selected keyframe */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Diamond className="w-4 h-4 text-amber-400" /> Keyframe Properties
          </h3>
          {selectedKf ? (
            <div className="space-y-3">
              {(() => {
                const track = tracks.find(t => t.id === selectedKf.trackId);
                const kf = track?.keyframes.find(k => k.frame === selectedKf.frame);
                if (!track || !kf) return null;
                return (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/3 rounded-lg p-2"><p className="text-[9px] text-gray-600">Track</p><p className="text-gray-200">{track.name}</p></div>
                      <div className="bg-white/3 rounded-lg p-2"><p className="text-[9px] text-gray-600">Frame</p><p className="text-gray-200 font-mono">{kf.frame}</p></div>
                      <div className="bg-white/3 rounded-lg p-2"><p className="text-[9px] text-gray-600">Value</p><p className="text-gray-200 font-mono">{kf.value}</p></div>
                      <div className="bg-white/3 rounded-lg p-2"><p className="text-[9px] text-gray-600">Easing</p><p className="text-gray-200">{kf.easing}</p></div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1.5">Interpolation</p>
                      <div className="flex gap-1">
                        {["linear", "ease", "bounce"].map(e => (
                          <button key={e} className={`flex-1 py-1 rounded text-[10px] transition-colors ${kf.easing === e ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-white/5 text-gray-500 hover:text-gray-300"}`}>
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete Keyframe
                    </button>
                  </>
                );
              })()}
            </div>
          ) : (
            <p className="text-xs text-gray-600">Click a keyframe diamond to select it</p>
          )}
        </div>

        {/* NLA tracks */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-amber-400" /> NLA Strips (Blender)
          </h3>
          <div className="space-y-2">
            {[
              { name: "Plasma Idle",    frames: "0–60",   color: "#60a5fa", active: true },
              { name: "Ring Pulse",     frames: "30–90",  color: "#a78bfa", active: true },
              { name: "Camera Sweep",   frames: "0–120",  color: "#f59e0b", active: false },
              { name: "Spark Burst",    frames: "45–75",  color: "#34d399", active: true },
            ].map(strip => (
              <div key={strip.name} className="flex items-center gap-2 p-2 bg-white/3 rounded-lg">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: strip.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-200 truncate">{strip.name}</p>
                  <p className="text-[9px] text-gray-600 font-mono">frames {strip.frames}</p>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${strip.active ? "bg-green-500/10 text-green-400" : "bg-white/5 text-gray-500"}`}>
                  {strip.active ? "active" : "muted"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Export options */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-400" /> Export Animation
          </h3>
          <div className="space-y-2">
            {[
              { fmt: "USDZ Animation",     icon: "👓", desc: "visionOS RealityKit" },
              { fmt: "GLB Animation",       icon: "🥽", desc: "Meta Spatial SDK" },
              { fmt: "Blender NLA",         icon: "🔷", desc: "Push to Blender" },
              { fmt: "JSON Keyframes",      icon: "☁️", desc: "Cloud storage" },
              { fmt: "Apple Motion",        icon: "📱", desc: "iPadOS preview" },
            ].map(e => (
              <button key={e.fmt} className="w-full flex items-center gap-2.5 px-3 py-2 bg-white/3 border border-white/8 rounded-lg hover:bg-white/5 transition-colors text-left">
                <span className="text-base">{e.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-200">{e.fmt}</p>
                  <p className="text-[9px] text-gray-600">{e.desc}</p>
                </div>
                <Download className="w-3.5 h-3.5 text-gray-600" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
