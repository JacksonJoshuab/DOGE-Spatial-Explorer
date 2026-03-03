/**
 * AIGenerationStudio — /ai-studio
 * AI-powered 3D content generation studio.
 * Text-to-3D, Text-to-Texture, Image-to-3D, Audio-to-Scene, Text-to-Scene.
 * Apple Vision Pro spatial computing design language.
 */
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect, useRef } from "react";
import {
  Brain, Wand2, Box, Palette, Image, Volume2, Sparkles, Layers,
  Play, Pause, RotateCcw, Download, Upload, Plus, X, Check,
  ChevronRight, ChevronDown, Clock, Zap, Star, Filter,
  Search, Grid3X3, List, Eye, Share2, Copy, Trash2,
  Mic, MicOff, Camera, FileJson, Package, Boxes,
  Atom, Waves, Flame, Snowflake, Wind, Sun, Moon,
  Globe, Cloud, Database, Activity, ArrowUpRight,
  SlidersHorizontal, RefreshCw, AlertCircle, Info,
  Cpu, HardDrive, Gauge, Radio, Lightbulb
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface GenerationJob {
  id: string;
  type: "text_to_3d" | "text_to_texture" | "image_to_3d" | "audio_to_scene" | "text_to_scene" | "rf_to_spatial";
  prompt: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  createdAt: string;
  duration?: number;
  thumbnail?: string;
  modelUrl?: string;
  polyCount?: number;
  textureRes?: string;
}

interface AssetItem {
  id: string;
  name: string;
  type: "model" | "texture" | "scene" | "audio" | "material";
  source: "ai_generated" | "imported" | "scanned";
  size: string;
  format: string;
  createdAt: string;
  tags: string[];
  thumbnail?: string;
}

/* ─── Demo Data ─────────────────────────────────────────────────────────────── */
const DEMO_JOBS: GenerationJob[] = [
  { id: "j1", type: "text_to_3d", prompt: "Z-pinch plasma column with aurora effect and toroidal rings", status: "completed", progress: 100, createdAt: "10:02 AM", duration: 42, polyCount: 18400, textureRes: "2048×2048" },
  { id: "j2", type: "text_to_texture", prompt: "Plasma energy field surface — blue-purple gradient with electric discharge patterns", status: "completed", progress: 100, createdAt: "10:08 AM", duration: 18, textureRes: "4096×4096" },
  { id: "j3", type: "image_to_3d", prompt: "Reconstruct 3D from Z-pinch simulation screenshot", status: "processing", progress: 73, createdAt: "10:15 AM" },
  { id: "j4", type: "text_to_scene", prompt: "Plasma physics laboratory with multiple Z-pinch columns, diagnostic equipment, and observation stations", status: "processing", progress: 31, createdAt: "10:18 AM" },
  { id: "j5", type: "audio_to_scene", prompt: "Generate spatial environment from plasma discharge audio recording", status: "queued", progress: 0, createdAt: "10:20 AM" },
  { id: "j6", type: "rf_to_spatial", prompt: "Convert RF sensor array readings to spatial geometry", status: "queued", progress: 0, createdAt: "10:21 AM" },
];

const DEMO_ASSETS: AssetItem[] = [
  { id: "a1", name: "Z-Pinch Column v3", type: "model", source: "ai_generated", size: "4.2 MB", format: "USDZ", createdAt: "Today 10:02", tags: ["plasma", "physics", "volumetric"] },
  { id: "a2", name: "Plasma Energy Field", type: "texture", source: "ai_generated", size: "16 MB", format: "PNG", createdAt: "Today 10:08", tags: ["texture", "pbr", "plasma"] },
  { id: "a3", name: "City Hall Scan", type: "model", source: "scanned", size: "128 MB", format: "PLY", createdAt: "Yesterday", tags: ["lidar", "scan", "architecture"] },
  { id: "a4", name: "Sensor Array Mesh", type: "model", source: "imported", size: "2.1 MB", format: "GLB", createdAt: "2 days ago", tags: ["iot", "sensor", "hardware"] },
  { id: "a5", name: "Lab Environment", type: "scene", source: "ai_generated", size: "52 MB", format: "USDZ", createdAt: "Today 09:45", tags: ["scene", "lab", "environment"] },
  { id: "a6", name: "Discharge Audio", type: "audio", source: "imported", size: "8 MB", format: "WAV", createdAt: "Today 09:30", tags: ["audio", "plasma", "discharge"] },
];

const AI_TYPES = [
  { id: "text_to_3d", icon: Box, label: "Text → 3D Model", desc: "Generate a 3D mesh from a text description", color: "blue", examples: ["A plasma column with glowing rings", "Futuristic sensor array device", "Volumetric energy field"] },
  { id: "text_to_texture", icon: Palette, label: "Text → Texture", desc: "Generate PBR textures from description", color: "purple", examples: ["Metallic plasma-etched surface", "Holographic grid pattern", "Energy field emission map"] },
  { id: "image_to_3d", icon: Image, label: "Image → 3D", desc: "Reconstruct 3D geometry from photos", color: "green", examples: ["Upload a photo to reconstruct", "Simulation screenshot to mesh", "Scan image to point cloud"] },
  { id: "audio_to_scene", icon: Volume2, label: "Audio → Scene", desc: "Generate spatial environment from audio", color: "amber", examples: ["Plasma discharge recording", "Environmental ambient audio", "RF signal waveform"] },
  { id: "text_to_scene", icon: Sparkles, label: "Text → Full Scene", desc: "Generate a complete 3D scene", color: "pink", examples: ["Physics laboratory with equipment", "Plasma containment chamber", "IoT sensor deployment field"] },
  { id: "rf_to_spatial", icon: Radio, label: "RF → Spatial", desc: "Convert RF data to 3D spatial geometry", color: "cyan", examples: ["RF sensor array readings", "Electromagnetic field map", "Signal propagation volume"] },
];

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500/15 border-blue-500/40 text-blue-300",
  purple: "bg-purple-500/15 border-purple-500/40 text-purple-300",
  green: "bg-green-500/15 border-green-500/40 text-green-300",
  amber: "bg-amber-500/15 border-amber-500/40 text-amber-300",
  pink: "bg-pink-500/15 border-pink-500/40 text-pink-300",
  cyan: "bg-cyan-500/15 border-cyan-500/40 text-cyan-300",
};

const ICON_COLOR: Record<string, string> = {
  blue: "text-blue-400", purple: "text-purple-400", green: "text-green-400",
  amber: "text-amber-400", pink: "text-pink-400", cyan: "text-cyan-400",
};

/* ─── Components ─────────────────────────────────────────────────────────────── */

function JobCard({ job }: { job: GenerationJob }) {
  const typeConfig = AI_TYPES.find(t => t.id === job.type);
  const Icon = typeConfig?.icon || Box;
  const color = typeConfig?.color || "blue";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/8 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg border ${COLOR_MAP[color]} flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-200 truncate">{typeConfig?.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ml-2 ${
              job.status === "completed" ? "bg-green-500/20 text-green-400" :
              job.status === "processing" ? "bg-blue-500/20 text-blue-400" :
              job.status === "failed" ? "bg-red-500/20 text-red-400" :
              "bg-gray-500/20 text-gray-400"
            }`}>
              {job.status}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 truncate mb-2">{job.prompt}</p>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
            <motion.div
              className={`h-full rounded-full ${job.status === "completed" ? "bg-green-500" : job.status === "failed" ? "bg-red-500" : "bg-blue-500"}`}
              initial={{ width: 0 }}
              animate={{ width: `${job.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.createdAt}</span>
            <div className="flex items-center gap-2">
              {job.duration && <span>{job.duration}s</span>}
              {job.polyCount && <span>{(job.polyCount / 1000).toFixed(1)}K poly</span>}
              {job.textureRes && <span>{job.textureRes}</span>}
            </div>
          </div>
          {job.status === "completed" && (
            <div className="flex gap-1.5 mt-2">
              <button className="flex-1 flex items-center justify-center gap-1 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded text-[10px] text-blue-400 transition-colors">
                <Eye className="w-3 h-3" /> Preview
              </button>
              <button onClick={() => toast.success("Importing to scene...")} className="flex-1 flex items-center justify-center gap-1 py-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded text-[10px] text-green-400 transition-colors">
                <Plus className="w-3 h-3" /> Import
              </button>
              <button onClick={() => toast.success("Downloading...")} className="p-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-gray-400">
                <Download className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AssetCard({ asset }: { asset: AssetItem }) {
  const icons = { model: Box, texture: Palette, scene: Sparkles, audio: Volume2, material: Layers };
  const Icon = icons[asset.type] || Box;
  const sourceColors = { ai_generated: "text-purple-400 bg-purple-500/10", imported: "text-blue-400 bg-blue-500/10", scanned: "text-green-400 bg-green-500/10" };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/8 transition-colors group">
      <div className="aspect-video bg-gradient-to-br from-white/5 to-white/10 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
        <Icon className="w-8 h-8 text-white/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${sourceColors[asset.source]}`}>
            {asset.source.replace("_", " ")}
          </span>
          <span className="text-[9px] text-gray-400 font-mono">{asset.format}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-gray-200 truncate mb-1">{asset.name}</p>
      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
        <span>{asset.size}</span>
        <span>{asset.createdAt}</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {asset.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-gray-500">{tag}</span>
        ))}
      </div>
      <div className="hidden group-hover:flex gap-1">
        <button className="flex-1 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded text-[10px] text-blue-400">Import</button>
        <button className="p-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-gray-400"><Download className="w-3 h-3" /></button>
        <button className="p-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-gray-400"><Copy className="w-3 h-3" /></button>
        <button className="p-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded text-red-400"><Trash2 className="w-3 h-3" /></button>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */

export default function AIGenerationStudio() {
  const [jobs, setJobs] = useState<GenerationJob[]>(DEMO_JOBS);
  const [assets] = useState<AssetItem[]>(DEMO_ASSETS);
  const [selectedType, setSelectedType] = useState("text_to_3d");
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<"generate" | "jobs" | "assets">("generate");
  const [assetView, setAssetView] = useState<"grid" | "list">("grid");
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modelParams, setModelParams] = useState({
    quality: "high",
    polyTarget: "medium",
    textureRes: "2048",
    format: "usdz",
    includePhysics: false,
    includeAnimation: false,
    generateLODs: true,
  });

  // Simulate job progress
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(prev => prev.map(j => {
        if (j.status === "processing" && j.progress < 100) {
          const p = Math.min(100, j.progress + Math.random() * 3);
          return { ...j, progress: p, status: p >= 100 ? "completed" : "processing" };
        }
        if (j.status === "queued") {
          const processingCount = prev.filter(x => x.status === "processing").length;
          if (processingCount < 2) return { ...j, status: "processing", progress: 1 };
        }
        return j;
      }));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const submitGeneration = () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    const newJob: GenerationJob = {
      id: `j${Date.now()}`,
      type: selectedType as GenerationJob["type"],
      prompt,
      status: "queued",
      progress: 0,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setJobs(prev => [newJob, ...prev]);
    setPrompt("");
    toast.success("Generation queued", { description: `${AI_TYPES.find(t => t.id === selectedType)?.label}` });
    setActiveTab("jobs");
  };

  const selectedTypeConfig = AI_TYPES.find(t => t.id === selectedType);

  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === "completed").length,
    processing: jobs.filter(j => j.status === "processing").length,
    queued: jobs.filter(j => j.status === "queued").length,
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0A0A14] text-white">
        {/* Header */}
        <div className="border-b border-white/10 bg-[#0F0F1E] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">AI Generation Studio</h1>
                <p className="text-sm text-gray-400">Text-to-3D · Text-to-Texture · Image-to-3D · Audio-to-Scene · RF-to-Spatial</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Stats */}
              {[
                { label: "Completed", value: stats.completed, color: "text-green-400" },
                { label: "Processing", value: stats.processing, color: "text-blue-400" },
                { label: "Queued", value: stats.queued, color: "text-amber-400" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-gray-500">{s.label}</p>
                </div>
              ))}
              <div className="w-px h-8 bg-white/10" />
              {/* GPU status */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <Cpu className="w-3.5 h-3.5 text-green-400" />
                <div>
                  <p className="text-[10px] text-gray-400">GPU</p>
                  <p className="text-xs font-mono text-white">8× A100</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-4">
            {[
              { id: "generate", icon: Wand2, label: "Generate" },
              { id: "jobs", icon: Activity, label: `Jobs (${stats.total})` },
              { id: "assets", icon: Package, label: `Assets (${assets.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Generate Tab */}
          {activeTab === "generate" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left — Type selector */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Generation Type</h2>
                {AI_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedType === type.id
                        ? `${COLOR_MAP[type.color]} scale-[1.01]`
                        : "bg-white/3 border-white/8 text-gray-400 hover:bg-white/8"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedType === type.id ? "bg-white/10" : "bg-white/5"}`}>
                      <type.icon className={`w-4 h-4 ${selectedType === type.id ? ICON_COLOR[type.color] : "text-gray-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{type.label}</p>
                      <p className="text-[11px] text-gray-500 truncate">{type.desc}</p>
                    </div>
                    {selectedType === type.id && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Center — Prompt */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  {selectedTypeConfig?.label}
                </h2>

                {/* Image upload for image_to_3d */}
                {selectedType === "image_to_3d" && (
                  <div
                    className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-white/40 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadedImage ? (
                      <div className="relative">
                        <img src={uploadedImage} alt="Uploaded" className="max-h-32 mx-auto rounded-lg" />
                        <button onClick={e => { e.stopPropagation(); setUploadedImage(null); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Drop image or click to upload</p>
                        <p className="text-xs text-gray-600 mt-1">PNG, JPG, WEBP up to 20MB</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setUploadedImage(ev.target?.result as string); r.readAsDataURL(f); } }} />
                  </div>
                )}

                {/* Audio recording for audio_to_scene */}
                {selectedType === "audio_to_scene" && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <button
                      onClick={() => { setIsRecording(!isRecording); if (!isRecording) toast.success("Recording started..."); else toast.success("Recording stopped"); }}
                      className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all ${isRecording ? "bg-red-500 animate-pulse" : "bg-white/10 hover:bg-white/20"}`}
                    >
                      {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <p className="text-sm text-gray-400 mt-2">{isRecording ? "Recording... tap to stop" : "Tap to record audio"}</p>
                    <p className="text-xs text-gray-600 mt-1">Or upload an audio file below</p>
                  </div>
                )}

                {/* Prompt textarea */}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder={selectedTypeConfig?.examples[0] || "Describe what to generate..."}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-purple-500/50 h-28"
                  />
                  {/* Example prompts */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedTypeConfig?.examples.map(ex => (
                      <button key={ex} onClick={() => setPrompt(ex)}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-gray-400 hover:text-gray-200 transition-colors">
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate button */}
                <button
                  onClick={submitGeneration}
                  disabled={!prompt.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate {selectedTypeConfig?.label}
                </button>
              </div>

              {/* Right — Parameters */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Parameters</h2>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                  {/* Quality */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Quality</label>
                    <div className="grid grid-cols-3 gap-1">
                      {["draft", "standard", "high"].map(q => (
                        <button key={q} onClick={() => setModelParams(p => ({ ...p, quality: q }))}
                          className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${modelParams.quality === q ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"}`}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Poly target */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Polygon Target</label>
                    <div className="grid grid-cols-3 gap-1">
                      {["low", "medium", "high"].map(p => (
                        <button key={p} onClick={() => setModelParams(prev => ({ ...prev, polyTarget: p }))}
                          className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${modelParams.polyTarget === p ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Texture resolution */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Texture Resolution</label>
                    <div className="grid grid-cols-4 gap-1">
                      {["512", "1024", "2048", "4096"].map(r => (
                        <button key={r} onClick={() => setModelParams(p => ({ ...p, textureRes: r }))}
                          className={`py-1.5 rounded-lg text-[10px] font-mono transition-colors ${modelParams.textureRes === r ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Export format */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Export Format</label>
                    <div className="grid grid-cols-3 gap-1">
                      {["usdz", "glb", "fbx"].map(f => (
                        <button key={f} onClick={() => setModelParams(p => ({ ...p, format: f }))}
                          className={`py-1.5 rounded-lg text-xs font-mono uppercase transition-colors ${modelParams.format === f ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Toggles */}
                  <div className="space-y-2">
                    {[
                      { key: "includePhysics", label: "Include Physics Colliders" },
                      { key: "includeAnimation", label: "Generate Idle Animation" },
                      { key: "generateLODs", label: "Generate LOD Levels" },
                    ].map(toggle => (
                      <div key={toggle.key} className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{toggle.label}</span>
                        <button
                          onClick={() => setModelParams(p => ({ ...p, [toggle.key]: !p[toggle.key as keyof typeof p] }))}
                          className={`w-8 h-4 rounded-full transition-colors relative ${modelParams[toggle.key as keyof typeof modelParams] ? "bg-purple-500" : "bg-white/10"}`}
                        >
                          <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${modelParams[toggle.key as keyof typeof modelParams] ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model info */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Estimated Output</p>
                  {[
                    ["Polygons", modelParams.polyTarget === "low" ? "~5K" : modelParams.polyTarget === "medium" ? "~25K" : "~100K"],
                    ["Texture Maps", "Albedo, Normal, Roughness, AO"],
                    ["File Size", modelParams.quality === "draft" ? "~2 MB" : modelParams.quality === "standard" ? "~8 MB" : "~25 MB"],
                    ["Generation Time", modelParams.quality === "draft" ? "~15s" : modelParams.quality === "standard" ? "~45s" : "~2min"],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500">{l}</span>
                      <span className="text-gray-200 font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === "jobs" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Generation Jobs</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => toast.success("Clearing completed jobs...")} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400">
                    <Trash2 className="w-3.5 h-3.5" /> Clear Completed
                  </button>
                  <button onClick={() => setActiveTab("generate")} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs text-white font-medium">
                    <Plus className="w-3.5 h-3.5" /> New Job
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {jobs.map(job => <JobCard key={job.id} job={job} />)}
              </div>
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === "assets" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Asset Library</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" placeholder="Search assets..." className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white/30 w-40" />
                  </div>
                  <button onClick={() => setAssetView(assetView === "grid" ? "list" : "grid")} className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400">
                    {assetView === "grid" ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400">
                    <Upload className="w-3.5 h-3.5" /> Import
                  </button>
                </div>
              </div>
              <div className={assetView === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3" : "space-y-2"}>
                {assets.map(asset => <AssetCard key={asset.id} asset={asset} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
