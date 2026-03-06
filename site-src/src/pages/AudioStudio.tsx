import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Volume2, Music, Mic, Radio, Headphones, Zap, Play, Pause,
  Square, SkipBack, SkipForward, Download, Upload, Plus,
  Lock, Unlock, Eye, EyeOff, Layers, Globe, Activity
} from "lucide-react";

// ── waveform bar component ────────────────────────────────────────────────────
function WaveformBar({ height, active, color }: { height: number; active: boolean; color: string }) {
  return (
    <motion.div
      className="w-full rounded-sm"
      style={{ backgroundColor: active ? color : color + "50" }}
      animate={{ height: `${height}%` }}
      transition={{ duration: 0.1 }}
    />
  );
}

// ── audio source types ────────────────────────────────────────────────────────
const AUDIO_SOURCES = [
  { id: "plasma", name: "Plasma Hum",       type: "ambient",  icon: "⚡", color: "#60a5fa", x: 50, y: 50, radius: 3.2, gain: 0.8, muted: false, soloed: false, freq: "120 Hz",  format: "Ambisonics" },
  { id: "ring1",  name: "Ring Resonance 1", type: "point",    icon: "🔵", color: "#a78bfa", x: 35, y: 40, radius: 1.5, gain: 0.6, muted: false, soloed: false, freq: "440 Hz",  format: "Stereo" },
  { id: "ring2",  name: "Ring Resonance 2", type: "point",    icon: "🔵", color: "#a78bfa", x: 65, y: 40, radius: 1.5, gain: 0.6, muted: false, soloed: false, freq: "880 Hz",  format: "Stereo" },
  { id: "spark",  name: "Spark Crackle",    type: "particle", icon: "✨", color: "#f59e0b", x: 50, y: 30, radius: 0.8, gain: 0.4, muted: false, soloed: false, freq: "2-8 kHz", format: "Mono" },
  { id: "amb",    name: "Space Ambience",   type: "reverb",   icon: "🌌", color: "#34d399", x: 50, y: 70, radius: 8.0, gain: 0.3, muted: false, soloed: false, freq: "Full",    format: "Spatial" },
  { id: "voice",  name: "Narrator Voice",   type: "voice",    icon: "🎙️", color: "#f87171", x: 20, y: 60, radius: 2.0, gain: 0.9, muted: false, soloed: false, freq: "300 Hz",  format: "Mono" },
];

const REVERB_PRESETS = ["None", "Small Room", "Large Hall", "Cathedral", "Plasma Chamber", "Deep Space", "Custom"];

export default function AudioStudio() {
  const [sources, setSources] = useState(AUDIO_SOURCES);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(120);
  const [selectedSource, setSelectedSource] = useState(AUDIO_SOURCES[0]);
  const [reverbPreset, setReverbPreset] = useState("Plasma Chamber");
  const [masterGain, setMasterGain] = useState(0.85);
  const [hrtfEnabled, setHrtfEnabled] = useState(true);
  const [ambisonicsOrder, setAmbisonicsOrder] = useState(3);
  const [tick, setTick] = useState(0);
  const [waveData, setWaveData] = useState(() => Array.from({ length: 64 }, () => Math.random() * 60 + 10));
  const [spectrumData, setSpectrumData] = useState(() => Array.from({ length: 32 }, () => Math.random() * 80 + 5));
  const [dragging, setDragging] = useState<string | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      if (playing) {
        setCurrentTime(t => (t + 0.1) % duration);
        setWaveData(d => d.map(v => Math.max(5, Math.min(95, v + (Math.random() - 0.5) * 20))));
        setSpectrumData(d => d.map((v, i) => Math.max(2, Math.min(98, v + (Math.random() - 0.5) * 15 - i * 0.3))));
      }
    }, 100);
    return () => clearInterval(id);
  }, [playing, duration]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  const toggleMute = (id: string) => setSources(ss => ss.map(s => s.id === id ? { ...s, muted: !s.muted } : s));
  const toggleSolo = (id: string) => setSources(ss => ss.map(s => s.id === id ? { ...s, soloed: !s.soloed } : s));
  const setGain = (id: string, gain: number) => setSources(ss => ss.map(s => s.id === id ? { ...s, gain } : s));

  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (selectedSource) {
      setSources(ss => ss.map(s => s.id === selectedSource.id ? { ...s, x, y } : s));
      setSelectedSource(prev => ({ ...prev, x, y }));
    }
  };

  return (
    <div className="min-h-screen bg-[#08080F] text-white p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Headphones className="w-5 h-5 text-green-400" /> Spatial Audio Studio
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">3D positional audio · HRTF · Ambisonics · Blender sync</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${hrtfEnabled ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/5 border-white/10 text-gray-400"}`}>
            <Headphones className="w-3.5 h-3.5" /> HRTF {hrtfEnabled ? "ON" : "OFF"}
          </div>
          <button onClick={() => setHrtfEnabled(h => !h)} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-colors">
            Toggle HRTF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-xs hover:bg-amber-500/30 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export to Blender
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: 3D audio field */}
        <div className="lg:col-span-2 space-y-4">
          {/* Spatial field */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" /> 3D Audio Field
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Click to move selected source</span>
                <span className="px-2 py-0.5 bg-white/5 rounded font-mono">Ambisonics {ambisonicsOrder}rd order</span>
              </div>
            </div>

            {/* The 3D field */}
            <div ref={fieldRef} onClick={handleFieldClick}
              className="relative w-full aspect-video bg-[#050510] rounded-xl border border-white/5 overflow-hidden cursor-crosshair select-none">
              {/* Grid */}
              <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="10%" height="10%" patternUnits="objectBoundingBox">
                    <path d="M 0 0 L 0 100 100 100 100 0 Z" fill="none" stroke="#ffffff" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Listener (center) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full border border-white/10 scale-150 animate-ping" style={{ animationDuration: "3s" }} />
                <div className="absolute inset-0 rounded-full border border-white/5 scale-300" style={{ transform: "scale(3)" }} />
              </div>

              {/* Audio sources */}
              {sources.map(src => (
                <div key={src.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-all ${src.muted ? "opacity-30" : "opacity-100"}`}
                  style={{ left: `${src.x}%`, top: `${src.y}%` }}
                  onClick={e => { e.stopPropagation(); setSelectedSource(src); }}>
                  {/* Radius ring */}
                  <div className="absolute rounded-full border opacity-20 -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: "50%", top: "50%",
                      width: `${src.radius * 20}px`, height: `${src.radius * 20}px`,
                      borderColor: src.color,
                      backgroundColor: src.color + "10",
                    }} />
                  {/* Source dot */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 transition-all ${selectedSource?.id === src.id ? "scale-125" : "scale-100"}`}
                    style={{ backgroundColor: src.color + "30", borderColor: src.color }}>
                    {src.icon}
                  </div>
                  {/* Label */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[9px] text-gray-400 bg-black/60 px-1.5 py-0.5 rounded">
                    {src.name}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="absolute bottom-2 left-2 text-[9px] text-gray-600 space-y-0.5">
                <div className="flex items-center gap-1"><Headphones className="w-3 h-3" /> Listener (you)</div>
                <div>Click field to move selected source</div>
              </div>
            </div>
          </div>

          {/* Waveform + spectrum */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/3 border border-white/8 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" /> Waveform
              </h3>
              <div className="flex items-end gap-0.5 h-16">
                {waveData.map((v, i) => (
                  <WaveformBar key={i} height={v} active={playing} color="#60a5fa" />
                ))}
              </div>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-400" /> Spectrum
              </h3>
              <div className="flex items-end gap-0.5 h-16">
                {spectrumData.map((v, i) => (
                  <WaveformBar key={i} height={v} active={playing} color={`hsl(${260 + i * 3}, 70%, 65%)`} />
                ))}
              </div>
            </div>
          </div>

          {/* Transport */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <button className="p-2 text-gray-400 hover:text-white transition-colors"><SkipBack className="w-4 h-4" /></button>
                <button onClick={() => setPlaying(p => !p)}
                  className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 hover:bg-blue-500/30 transition-colors">
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button onClick={() => { setPlaying(false); setCurrentTime(0); }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"><Square className="w-4 h-4" /></button>
                <button className="p-2 text-gray-400 hover:text-white transition-colors"><SkipForward className="w-4 h-4" /></button>
              </div>

              {/* Progress bar */}
              <div className="flex-1 space-y-1">
                <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer">
                  <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${(currentTime / duration) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Master gain */}
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <input type="range" min="0" max="1" step="0.01" value={masterGain}
                  onChange={e => setMasterGain(parseFloat(e.target.value))}
                  className="w-20 accent-blue-400" />
                <span className="text-xs text-gray-400 font-mono w-8">{Math.round(masterGain * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Source mixer + settings */}
        <div className="space-y-4">
          {/* Source mixer */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" /> Mixer
              </h3>
              <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Source
              </button>
            </div>
            <div className="space-y-2">
              {sources.map(src => (
                <div key={src.id}
                  onClick={() => setSelectedSource(src)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${selectedSource?.id === src.id ? "border-blue-500/30 bg-blue-500/5" : "border-white/5 bg-white/2 hover:bg-white/5"}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm">{src.icon}</span>
                    <span className="text-xs text-gray-200 flex-1 truncate">{src.name}</span>
                    <span className="text-[9px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">{src.format}</span>
                    <button onClick={e => { e.stopPropagation(); toggleMute(src.id); }}
                      className={`p-1 rounded transition-colors ${src.muted ? "text-red-400 bg-red-500/10" : "text-gray-500 hover:text-gray-300"}`}>
                      {src.muted ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); toggleSolo(src.id); }}
                      className={`p-1 rounded transition-colors text-[9px] font-bold ${src.soloed ? "text-amber-400 bg-amber-500/10" : "text-gray-600 hover:text-gray-400"}`}>
                      S
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: src.color }} />
                    <input type="range" min="0" max="1" step="0.01" value={src.gain}
                      onChange={e => setGain(src.id, parseFloat(e.target.value))}
                      onClick={e => e.stopPropagation()}
                      className="flex-1 h-1 accent-blue-400" style={{ accentColor: src.color }} />
                    <span className="text-[10px] text-gray-500 font-mono w-8">{Math.round(src.gain * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected source properties */}
          {selectedSource && (
            <motion.div key={selectedSource.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>{selectedSource.icon}</span> {selectedSource.name}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: "Type",    value: selectedSource.type },
                  { label: "Format",  value: selectedSource.format },
                  { label: "Freq",    value: selectedSource.freq },
                  { label: "Radius",  value: `${selectedSource.radius}m` },
                  { label: "X",       value: `${selectedSource.x.toFixed(1)}%` },
                  { label: "Y",       value: `${selectedSource.y.toFixed(1)}%` },
                ].map(p => (
                  <div key={p.label} className="bg-white/3 rounded-lg p-2">
                    <p className="text-[9px] text-gray-600">{p.label}</p>
                    <p className="text-gray-200 font-mono">{p.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-500">Radius (m)</p>
                <input type="range" min="0.5" max="10" step="0.1" value={selectedSource.radius}
                  onChange={e => {
                    const r = parseFloat(e.target.value);
                    setSources(ss => ss.map(s => s.id === selectedSource.id ? { ...s, radius: r } : s));
                    setSelectedSource(prev => ({ ...prev, radius: r }));
                  }}
                  className="w-full accent-blue-400" />
              </div>
            </motion.div>
          )}

          {/* Reverb settings */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Music className="w-4 h-4 text-green-400" /> Reverb & Environment
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Preset</p>
                <select value={reverbPreset} onChange={e => setReverbPreset(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 outline-none">
                  {REVERB_PRESETS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              {[
                { label: "Room Size",  value: 0.72 },
                { label: "Diffusion",  value: 0.85 },
                { label: "Decay",      value: 0.6 },
                { label: "Pre-Delay",  value: 0.3 },
              ].map(p => (
                <div key={p.label} className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>{p.label}</span>
                    <span className="font-mono">{Math.round(p.value * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.01" defaultValue={p.value}
                    className="w-full accent-green-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Export */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Export Formats</h3>
            <div className="grid grid-cols-2 gap-2">
              {["Apple Spatial Audio", "Meta Audio SDK", "Ambisonics B-Format", "Blender Scene", "USDZ Audio", "WAV Stems"].map(f => (
                <button key={f} className="flex items-center gap-1.5 px-2.5 py-2 bg-white/3 border border-white/8 rounded-lg text-[10px] text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors text-left">
                  <Download className="w-3 h-3 flex-shrink-0" /> {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
