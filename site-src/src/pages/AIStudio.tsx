import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Box, Palette, Camera, Volume2, Sparkles, Radio,
  Play, Pause, Check, X, Clock, Zap, Download, Plus,
  ChevronRight, Loader2, Activity, Cpu, HardDrive,
  Image, Mic, Wand2, Layers, Globe, Package, RefreshCw
} from "lucide-react";

type GenType = "text-3d" | "text-texture" | "image-3d" | "audio-scene" | "text-scene" | "rf-spatial";
type JobStatus = "queued" | "processing" | "completed" | "failed";

interface Job {
  id: string;
  type: GenType;
  prompt: string;
  status: JobStatus;
  progress: number;
  startedAt: string;
  duration?: string;
  outputFormat?: string;
  polyCount?: number;
  resolution?: string;
}

const GEN_TYPES: { id: GenType; label: string; desc: string; icon: any; color: string; gradient: string }[] = [
  { id: "text-3d", label: "Text → 3D Model", desc: "Generate a 3D mesh from a text description", icon: Box, color: "text-blue-400", gradient: "from-blue-600 to-cyan-600" },
  { id: "text-texture", label: "Text → Texture", desc: "Generate PBR textures from description", icon: Palette, color: "text-purple-400", gradient: "from-purple-600 to-pink-600" },
  { id: "image-3d", label: "Image → 3D", desc: "Reconstruct 3D geometry from photos", icon: Camera, color: "text-green-400", gradient: "from-green-600 to-emerald-600" },
  { id: "audio-scene", label: "Audio → Scene", desc: "Generate spatial environment from audio", icon: Volume2, color: "text-amber-400", gradient: "from-amber-600 to-orange-600" },
  { id: "text-scene", label: "Text → Full Scene", desc: "Generate a complete 3D scene", icon: Sparkles, color: "text-pink-400", gradient: "from-pink-600 to-rose-600" },
  { id: "rf-spatial", label: "RF → Spatial", desc: "Convert RF data to 3D spatial geometry", icon: Radio, color: "text-cyan-400", gradient: "from-cyan-600 to-teal-600" },
];

const INITIAL_JOBS: Job[] = [
  { id: "j1", type: "text-3d", prompt: "Z-pinch plasma column with aurora rings", status: "completed", progress: 100, startedAt: "10:02 AM", duration: "1m 48s", outputFormat: "USDZ", polyCount: 18400 },
  { id: "j2", type: "text-texture", prompt: "Plasma energy field PBR texture set", status: "completed", progress: 100, startedAt: "10:08 AM", duration: "2m 12s", outputFormat: "PNG", resolution: "4096×4096" },
  { id: "j3", type: "image-3d", prompt: "City Hall exterior scan reconstruction", status: "processing", progress: 67, startedAt: "10:15 AM" },
  { id: "j4", type: "audio-scene", prompt: "Plasma discharge spatial environment", status: "processing", progress: 34, startedAt: "10:18 AM" },
  { id: "j5", type: "text-scene", prompt: "Physics laboratory with plasma equipment", status: "queued", progress: 0, startedAt: "10:20 AM" },
  { id: "j6", type: "rf-spatial", prompt: "RF antenna array spatial geometry from CSV", status: "queued", progress: 0, startedAt: "10:21 AM" },
];

const EXAMPLE_PROMPTS: Record<GenType, string[]> = {
  "text-3d": ["A plasma column with glowing rings", "Futuristic sensor array device", "Volumetric energy field"],
  "text-texture": ["Metallic plasma surface PBR", "Glowing energy emission map", "Sci-fi panel surface"],
  "image-3d": ["Upload photo to reconstruct", "Scan from multiple angles", "Single image depth estimation"],
  "audio-scene": ["Plasma discharge recording", "City ambient soundscape", "RF interference audio"],
  "text-scene": ["Physics laboratory with plasma equipment", "Outdoor sensor deployment site", "Control room with displays"],
  "rf-spatial": ["WiFi signal strength map", "Cellular tower coverage", "RF interference pattern"],
};

function JobRow({ job }: { job: Job }) {
  const genType = GEN_TYPES.find(g => g.id === job.type)!;
  const Icon = genType.icon;
  return (
    <div className="flex items-center gap-3 p-3 bg-white/3 hover:bg-white/5 border border-white/8 rounded-xl transition-colors">
      <div className={`p-2 rounded-lg bg-gradient-to-br ${genType.gradient} flex-shrink-0`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs font-medium text-gray-200 truncate">{job.prompt}</p>
          <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
            job.status === "completed" ? "bg-green-500/15 text-green-400" :
            job.status === "processing" ? "bg-blue-500/15 text-blue-400" :
            job.status === "queued" ? "bg-gray-500/15 text-gray-400" :
            "bg-red-500/15 text-red-400"
          }`}>
            {job.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-gray-600">
          <span>{genType.label}</span>
          <span>{job.startedAt}</span>
          {job.duration && <span>⏱ {job.duration}</span>}
          {job.outputFormat && <span className="font-mono text-gray-500">{job.outputFormat}</span>}
          {job.polyCount && <span>{(job.polyCount / 1000).toFixed(0)}K poly</span>}
          {job.resolution && <span>{job.resolution}</span>}
        </div>
        {job.status === "processing" && (
          <div className="mt-1.5 h-1 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${job.progress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {job.status === "completed" && (
          <>
            <button className="p-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-green-400 transition-colors"><Download className="w-3 h-3" /></button>
            <button className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 transition-colors"><Plus className="w-3 h-3" /></button>
          </>
        )}
        {job.status === "processing" && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
        {job.status === "queued" && <Clock className="w-4 h-4 text-gray-500" />}
      </div>
    </div>
  );
}

export default function AIStudio() {
  const [selectedType, setSelectedType] = useState<GenType>("text-3d");
  const [prompt, setPrompt] = useState("A plasma column with glowing rings");
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [quality, setQuality] = useState<"draft" | "standard" | "high">("high");
  const [polyTarget, setPolyTarget] = useState<"low" | "medium" | "high">("medium");
  const [texRes, setTexRes] = useState<"512" | "1024" | "2048" | "4096">("2048");
  const [exportFmt, setExportFmt] = useState<"USDZ" | "GLB" | "FBX">("USDZ");
  const [activeTab, setActiveTab] = useState<"generate" | "jobs" | "assets">("generate");
  const [gpuUsage, setGpuUsage] = useState(78);

  useEffect(() => {
    const interval = setInterval(() => {
      setGpuUsage(prev => Math.min(99, Math.max(60, prev + (Math.random() - 0.5) * 8)));
      setJobs(prev => prev.map(j => j.status === "processing" ? { ...j, progress: Math.min(100, j.progress + Math.random() * 3) } : j));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = () => {
    const newJob: Job = {
      id: `j${Date.now()}`, type: selectedType, prompt,
      status: "processing", progress: 0,
      startedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setJobs(prev => [newJob, ...prev]);
    setActiveTab("jobs");
  };

  const genType = GEN_TYPES.find(g => g.id === selectedType)!;
  const completedJobs = jobs.filter(j => j.status === "completed").length;
  const processingJobs = jobs.filter(j => j.status === "processing").length;
  const queuedJobs = jobs.filter(j => j.status === "queued").length;

  return (
    <div className="h-full bg-[#08080F] text-white overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/8 bg-[#0A0A16] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Generation Studio</h1>
              <p className="text-xs text-gray-500">Text-to-3D · Text-to-Texture · Image-to-3D · Audio-to-Scene · RF-to-Spatial</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: "Completed", value: completedJobs, color: "text-green-400" },
              { label: "Processing", value: processingJobs, color: "text-blue-400" },
              { label: "Queued", value: queuedJobs, color: "text-gray-400" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-500">{s.label}</p>
              </div>
            ))}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <Cpu className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-purple-300 font-mono">GPU {gpuUsage.toFixed(0)}%</span>
              <span className="text-[10px] text-gray-500">8× A100</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3">
          {(["generate", "jobs", "assets"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                activeTab === tab ? "bg-purple-500/20 text-purple-300 border border-purple-500/20" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}>
              {tab} {tab === "jobs" && `(${jobs.length})`} {tab === "assets" && `(${completedJobs})`}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === "generate" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Generation type selector */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Generation Type</h2>
              <div className="space-y-2">
                {GEN_TYPES.map(gt => (
                  <button key={gt.id} onClick={() => setSelectedType(gt.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left ${
                      selectedType === gt.id
                        ? "bg-white/8 border-white/20 text-white"
                        : "bg-white/3 border-white/8 text-gray-400 hover:bg-white/5 hover:text-gray-200"
                    }`}>
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gt.gradient} flex-shrink-0`}>
                      <gt.icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{gt.label}</p>
                      <p className="text-[9px] text-gray-600 truncate">{gt.desc}</p>
                    </div>
                    {selectedType === gt.id && <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt + config */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{genType.label}</h2>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder={`Describe what to generate…`}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {EXAMPLE_PROMPTS[selectedType].map(ex => (
                      <button key={ex} onClick={() => setPrompt(ex)}
                        className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/8 rounded-full text-[9px] text-gray-500 hover:text-gray-300 transition-colors truncate max-w-[140px]">
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${genType.gradient} hover:opacity-90 shadow-lg`}
              >
                <Sparkles className="w-4 h-4" />
                Generate {genType.label}
              </button>
            </div>

            {/* Parameters */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Parameters</h2>

              {[
                { label: "Quality", options: ["draft", "standard", "high"], value: quality, setValue: setQuality },
                { label: "Polygon Target", options: ["low", "medium", "high"], value: polyTarget, setValue: setPolyTarget },
              ].map(({ label, options, value, setValue }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-500 mb-1.5">{label}</p>
                  <div className="flex gap-1">
                    {options.map(opt => (
                      <button key={opt} onClick={() => (setValue as any)(opt)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium capitalize transition-colors ${
                          value === opt ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-white/5 text-gray-500 border border-white/8 hover:bg-white/10"
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <p className="text-[10px] text-gray-500 mb-1.5">Texture Resolution</p>
                <div className="grid grid-cols-4 gap-1">
                  {(["512", "1024", "2048", "4096"] as const).map(r => (
                    <button key={r} onClick={() => setTexRes(r)}
                      className={`py-1.5 rounded-lg text-[9px] font-mono transition-colors ${
                        texRes === r ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-white/5 text-gray-500 border border-white/8 hover:bg-white/10"
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-gray-500 mb-1.5">Export Format</p>
                <div className="flex gap-1">
                  {(["USDZ", "GLB", "FBX"] as const).map(f => (
                    <button key={f} onClick={() => setExportFmt(f)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-medium transition-colors ${
                        exportFmt === f ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-white/5 text-gray-500 border border-white/8 hover:bg-white/10"
                      }`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/8 space-y-2">
                <p className="text-[10px] text-gray-500">Estimated Output</p>
                {[
                  ["Polygons", quality === "high" ? "~25K" : quality === "standard" ? "~12K" : "~5K"],
                  ["Texture Maps", "Albedo, Normal, Roughness, AO"],
                  ["File Size", quality === "high" ? "~25 MB" : "~12 MB"],
                  ["Generation Time", quality === "high" ? "~2min" : "~45s"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-600">{k}</span>
                    <span className="text-gray-400 font-mono text-right max-w-[120px] truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Generation Jobs</h2>
              <button className="p-1.5 text-gray-500 hover:text-white transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
            </div>
            {jobs.map(job => <JobRow key={job.id} job={job} />)}
          </div>
        )}

        {activeTab === "assets" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {jobs.filter(j => j.status === "completed").map(job => {
              const gt = GEN_TYPES.find(g => g.id === job.type)!;
              return (
                <div key={job.id} className="bg-[#0F0F1E] border border-white/8 rounded-xl overflow-hidden hover:border-white/16 transition-colors group">
                  <div className={`aspect-video bg-gradient-to-br ${gt.gradient} opacity-20 flex items-center justify-center relative`}>
                    <gt.icon className="w-8 h-8 text-white/40" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 gap-2">
                      <button className="p-2 bg-white/20 rounded-full text-white"><Download className="w-3.5 h-3.5" /></button>
                      <button className="p-2 bg-blue-500/60 rounded-full text-white"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] font-medium text-gray-200 truncate">{job.prompt}</p>
                    <div className="flex items-center justify-between mt-1 text-[9px] text-gray-600">
                      <span className="font-mono">{job.outputFormat}</span>
                      {job.polyCount && <span>{(job.polyCount/1000).toFixed(0)}K poly</span>}
                      {job.resolution && <span>{job.resolution}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
