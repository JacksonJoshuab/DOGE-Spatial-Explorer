import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Circle, Square, Play, Pause, SkipBack, SkipForward, Download,
  Upload, Trash2, Camera, Mic, Video, Clock, HardDrive, Zap,
  ChevronRight, Eye, Share2, Film, Layers, Activity, Cpu
} from "lucide-react";

const RECORDINGS = [
  { id: 1, name: "Z-Pinch Plasma Session", duration: "4:32", size: "284 MB", date: "2026-03-05 14:22", devices: ["Vision Pro", "Quest 3"], frames: 8192, fps: 30, format: "USDA", thumbnail: "plasma", status: "ready" },
  { id: 2, name: "Collaboration Review — Team Alpha", duration: "12:07", size: "1.2 GB", date: "2026-03-04 09:15", devices: ["Vision Pro", "iPad Pro", "Blender"], frames: 21840, fps: 60, format: "USDA", thumbnail: "collab", status: "ready" },
  { id: 3, name: "Material Shader Test", duration: "2:18", size: "142 MB", date: "2026-03-03 16:44", devices: ["Blender", "Quest 3"], frames: 4140, fps: 30, format: "GLB", thumbnail: "shader", status: "processing" },
  { id: 4, name: "LiDAR Scan — Room 4B", duration: "0:47", size: "67 MB", date: "2026-03-02 11:30", devices: ["Vision Pro"], frames: 1410, fps: 30, format: "USDZ", thumbnail: "lidar", status: "ready" },
  { id: 5, name: "Physics Sim Export", duration: "1:55", size: "98 MB", date: "2026-03-01 08:00", devices: ["Blender"], frames: 3450, fps: 30, format: "ABC", thumbnail: "physics", status: "ready" },
];

const TRACKS = [
  { id: "cam",   label: "Camera",        color: "bg-blue-500",   active: true,  data: [0.8,0.9,0.7,0.95,0.85,0.6,0.75,0.9,0.8,0.7,0.85,0.9,0.75,0.8,0.95,0.7] },
  { id: "mesh",  label: "Mesh Edits",    color: "bg-purple-500", active: true,  data: [0.3,0.5,0.8,0.4,0.9,0.6,0.3,0.7,0.5,0.8,0.4,0.6,0.9,0.3,0.5,0.7] },
  { id: "mat",   label: "Materials",     color: "bg-amber-500",  active: true,  data: [0.1,0.2,0.6,0.3,0.1,0.8,0.4,0.2,0.6,0.3,0.7,0.1,0.4,0.8,0.2,0.5] },
  { id: "audio", label: "Spatial Audio", color: "bg-green-500",  active: false, data: [0.6,0.7,0.5,0.8,0.6,0.7,0.5,0.9,0.6,0.7,0.5,0.8,0.6,0.4,0.7,0.5] },
  { id: "collab",label: "Collaboration", color: "bg-pink-500",   active: true,  data: [0.2,0.4,0.3,0.5,0.7,0.4,0.6,0.3,0.8,0.5,0.4,0.7,0.3,0.6,0.4,0.5] },
  { id: "hand",  label: "Hand Tracking", color: "bg-cyan-500",   active: true,  data: [0.9,0.8,0.95,0.7,0.85,0.9,0.8,0.75,0.9,0.85,0.8,0.95,0.7,0.85,0.9,0.8] },
];

const EXPORT_FORMATS = [
  { id: "usda",  label: "USDA",   desc: "Universal Scene Description (ASCII)", icon: "🍎", size: "~284 MB" },
  { id: "usdz",  label: "USDZ",   desc: "Compressed USD for visionOS/iOS",     icon: "📦", size: "~142 MB" },
  { id: "glb",   label: "GLB",    desc: "Binary glTF 2.0 for Meta/Web",        icon: "🥽", size: "~198 MB" },
  { id: "abc",   label: "Alembic",desc: "Alembic for Blender/VFX pipeline",    icon: "🔷", size: "~312 MB" },
  { id: "fbx",   label: "FBX",    desc: "Autodesk FBX for DCC tools",          icon: "🔧", size: "~256 MB" },
  { id: "mp4",   label: "MP4",    desc: "Video export with spatial metadata",  icon: "🎬", size: "~89 MB" },
];

function WaveformBar({ height, active }: { height: number; active: boolean }) {
  return (
    <div
      className={`w-1 rounded-full transition-all ${active ? "bg-blue-400" : "bg-gray-700"}`}
      style={{ height: `${height * 48}px` }}
    />
  );
}

export default function SpatialRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(RECORDINGS[0]);
  const [playhead, setPlayhead] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState("usda");
  const [showExport, setShowExport] = useState(false);
  const [trackStates, setTrackStates] = useState(TRACKS.map(t => t.active));
  const [waveform, setWaveform] = useState(Array.from({ length: 32 }, () => Math.random()));
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = window.setInterval(() => {
        setRecordingTime(t => t + 1);
        setWaveform(Array.from({ length: 32 }, () => 0.2 + Math.random() * 0.8));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRecording]);

  useEffect(() => {
    if (isPlaying) {
      const id = window.setInterval(() => {
        setPlayhead(p => {
          if (p >= 100) { setIsPlaying(false); return 0; }
          return p + 0.3;
        });
        setWaveform(Array.from({ length: 32 }, () => 0.1 + Math.random() * 0.6));
      }, 100);
      return () => clearInterval(id);
    }
  }, [isPlaying]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const thumbnailColors: Record<string, string> = {
    plasma: "from-blue-900 to-purple-900",
    collab: "from-green-900 to-teal-900",
    shader: "from-amber-900 to-orange-900",
    lidar:  "from-cyan-900 to-blue-900",
    physics:"from-red-900 to-pink-900",
  };

  return (
    <div className="h-full flex flex-col bg-[#08080F] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-red-400" />
            Spatial Recorder
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Capture, replay, and export spatial editing sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span>2.1 TB free</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setIsRecording(r => !r); if (isRecording) setRecordingTime(0); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isRecording
                ? "bg-red-500/20 border border-red-500/40 text-red-300"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            {isRecording ? (
              <><Square className="w-3.5 h-3.5 fill-current" /> Stop · {formatTime(recordingTime)}</>
            ) : (
              <><Circle className="w-3.5 h-3.5 fill-current" /> Record</>
            )}
          </motion.button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Recording list */}
        <div className="w-72 flex-shrink-0 border-r border-white/8 flex flex-col">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Recordings ({RECORDINGS.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {RECORDINGS.map(rec => (
              <button
                key={rec.id}
                onClick={() => { setSelectedRecording(rec); setPlayhead(0); setIsPlaying(false); }}
                className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                  selectedRecording.id === rec.id ? "bg-white/8 border-l-2 border-l-blue-500" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className={`w-full h-16 rounded-lg bg-gradient-to-br ${thumbnailColors[rec.thumbnail]} mb-2 flex items-center justify-center relative overflow-hidden`}>
                  <Film className="w-6 h-6 text-white/30" />
                  {rec.status === "processing" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-[10px] text-amber-400 font-medium animate-pulse">Processing…</div>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-mono">{rec.duration}</div>
                </div>
                <p className="text-xs font-medium text-white truncate">{rec.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-500">{rec.size}</span>
                  <span className="text-[10px] text-gray-600">·</span>
                  <span className="text-[10px] text-gray-500">{rec.format}</span>
                  <span className="text-[10px] text-gray-600">·</span>
                  <span className="text-[10px] text-gray-500">{rec.fps}fps</span>
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">{rec.date}</p>
              </button>
            ))}
          </div>
          {/* Recording indicator */}
          {isRecording && (
            <div className="p-3 border-t border-white/8 bg-red-500/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-400 font-medium">Recording — {formatTime(recordingTime)}</span>
              </div>
              <div className="flex items-end gap-0.5 h-8">
                {waveform.map((h, i) => (
                  <WaveformBar key={i} height={h} active={true} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center — Playback and timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview area */}
          <div className="flex-1 relative bg-[#05050A] overflow-hidden">
            {/* Simulated viewport */}
            <div className={`absolute inset-0 bg-gradient-to-br ${thumbnailColors[selectedRecording.thumbnail]} opacity-20`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <Film className="w-10 h-10 text-white/20" />
                </div>
                <p className="text-sm text-gray-400">{selectedRecording.name}</p>
                <p className="text-xs text-gray-600 mt-1">{selectedRecording.frames.toLocaleString()} frames · {selectedRecording.fps} fps</p>
              </div>
            </div>
            {/* Playhead overlay */}
            {isPlaying && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400 font-mono">PLAYING</span>
                </div>
              </div>
            )}
            {/* Live waveform overlay during playback */}
            {isPlaying && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-8">
                {waveform.map((h, i) => (
                  <div key={i} className="w-1 rounded-full bg-blue-400/60" style={{ height: `${h * 32}px` }} />
                ))}
              </div>
            )}
          </div>

          {/* Transport controls */}
          <div className="border-t border-white/8 bg-[#0A0A16] px-6 py-3">
            {/* Playhead scrubber */}
            <div className="relative mb-3">
              <div className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer" onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                setPlayhead(((e.clientX - rect.left) / rect.width) * 100);
              }}>
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${playhead}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg border-2 border-blue-500 transition-all" style={{ left: `calc(${playhead}% - 6px)` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-600 font-mono">0:00</span>
                <span className="text-[10px] text-blue-400 font-mono">{selectedRecording.duration}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setPlayhead(0)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsPlaying(p => !p)}
                  className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </motion.button>
                <button onClick={() => setPlayhead(100)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                {selectedRecording.devices.map(d => (
                  <span key={d} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full">{d}</span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-white transition-colors" title="Screenshot">
                  <Camera className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-white transition-colors" title="Share">
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowExport(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 border border-white/15 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/12 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Track timeline */}
          <div className="border-t border-white/8 bg-[#0A0A16]">
            <div className="px-4 py-2 border-b border-white/5">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">Capture Tracks</p>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "180px" }}>
              {TRACKS.map((track, ti) => (
                <div key={track.id} className="flex items-center border-b border-white/5">
                  <div className="w-32 flex-shrink-0 flex items-center gap-2 px-3 py-2">
                    <button
                      onClick={() => setTrackStates(s => s.map((v, i) => i === ti ? !v : v))}
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${trackStates[ti] ? track.color : "bg-gray-700"}`}
                    />
                    <span className="text-[10px] text-gray-400 truncate">{track.label}</span>
                  </div>
                  <div className="flex-1 flex items-end gap-px px-2 py-1.5 h-10">
                    {track.data.map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm transition-all ${trackStates[ti] ? track.color.replace("bg-", "bg-") + "/70" : "bg-gray-800"}`}
                        style={{ height: `${h * 28}px` }}
                      />
                    ))}
                    {/* Playhead line */}
                    <div
                      className="absolute w-px h-full bg-white/30 pointer-events-none"
                      style={{ left: `${132 + (playhead / 100) * (window.innerWidth - 132 - 288)}px` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — Session info */}
        <div className="w-64 flex-shrink-0 border-l border-white/8 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Session Info</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Duration", value: selectedRecording.duration, icon: Clock },
                { label: "Size", value: selectedRecording.size, icon: HardDrive },
                { label: "Frames", value: selectedRecording.frames.toLocaleString(), icon: Film },
                { label: "FPS", value: selectedRecording.fps.toString(), icon: Activity },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/5 border border-white/8 rounded-lg p-2.5">
                  <Icon className="w-3 h-3 text-gray-500 mb-1" />
                  <p className="text-xs font-mono text-white">{value}</p>
                  <p className="text-[9px] text-gray-600">{label}</p>
                </div>
              ))}
            </div>

            {/* Devices */}
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Devices Captured</p>
              <div className="space-y-1.5">
                {selectedRecording.devices.map(d => (
                  <div key={d} className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 border border-white/8 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-xs text-gray-300">{d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Source Format</p>
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-blue-300 font-mono">{selectedRecording.format}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/8 hover:text-white transition-all">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                Preview in XR
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/8 hover:text-white transition-all">
                <Upload className="w-3.5 h-3.5 text-green-400" />
                Push to Blender
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/8 hover:text-white transition-all">
                <Share2 className="w-3.5 h-3.5 text-purple-400" />
                Share Session
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/15 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Recording
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowExport(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0F0F1A] border border-white/15 rounded-2xl p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-white mb-1">Export Recording</h3>
              <p className="text-xs text-gray-500 mb-4">{selectedRecording.name}</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {EXPORT_FORMATS.map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedFormat === fmt.id
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/8"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{fmt.icon}</span>
                      <span className="text-[9px] text-gray-500 font-mono">{fmt.size}</span>
                    </div>
                    <p className="text-xs font-bold text-white">{fmt.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{fmt.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExport(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowExport(false)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 text-sm text-white font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export {selectedFormat.toUpperCase()}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
