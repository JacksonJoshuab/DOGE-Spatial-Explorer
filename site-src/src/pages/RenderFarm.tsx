import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server, Play, Pause, Square, Clock, Cpu, MemoryStick,
  Zap, CheckCircle, AlertCircle, RefreshCw, Download,
  Monitor, Cloud, HardDrive, Activity, Eye, Settings,
  ChevronRight, BarChart3, Layers, Film, Image
} from "lucide-react";

interface RenderJob {
  id: string;
  name: string;
  scene: string;
  frames: [number, number];
  currentFrame: number;
  engine: "CYCLES" | "EEVEE" | "WORKBENCH";
  samples: number;
  resolution: string;
  status: "rendering" | "queued" | "complete" | "failed" | "paused";
  progress: number;
  timeElapsed: string;
  timeRemaining: string;
  node: string;
  outputFormat: string;
  priority: "high" | "normal" | "low";
  submittedBy: string;
}

interface RenderNode {
  id: string;
  name: string;
  type: "local" | "cloud" | "apple-silicon";
  gpu: string;
  vram: string;
  cpuUsage: number;
  gpuUsage: number;
  ramUsage: number;
  status: "active" | "idle" | "offline";
  currentJob: string | null;
  renderSpeed: number;
  location: string;
}

const INITIAL_JOBS: RenderJob[] = [
  {
    id: "j1", name: "Z-Pinch_Final_v3", scene: "Z-Pinch Plasma Column",
    frames: [1, 240], currentFrame: 87, engine: "CYCLES", samples: 512,
    resolution: "3840×2160", status: "rendering", progress: 36,
    timeElapsed: "1h 24m", timeRemaining: "2h 31m",
    node: "RTX-Node-01", outputFormat: "EXR", priority: "high", submittedBy: "Vision Pro #1"
  },
  {
    id: "j2", name: "Plasma_Rings_Preview", scene: "Plasma Rings (×18)",
    frames: [1, 60], currentFrame: 60, engine: "EEVEE", samples: 64,
    resolution: "1920×1080", status: "complete", progress: 100,
    timeElapsed: "12m", timeRemaining: "—",
    node: "M4-Ultra-01", outputFormat: "PNG", priority: "normal", submittedBy: "Blender WS"
  },
  {
    id: "j3", name: "Core_Sphere_Turntable", scene: "Core Sphere",
    frames: [1, 120], currentFrame: 0, engine: "CYCLES", samples: 256,
    resolution: "2560×1440", status: "queued", progress: 0,
    timeElapsed: "—", timeRemaining: "~45m",
    node: "—", outputFormat: "MP4", priority: "normal", submittedBy: "iPad Pro"
  },
  {
    id: "j4", name: "Particle_Sim_Bake", scene: "Particle System",
    frames: [1, 480], currentFrame: 156, engine: "CYCLES", samples: 1024,
    resolution: "4096×4096", status: "rendering", progress: 32,
    timeElapsed: "3h 12m", timeRemaining: "6h 44m",
    node: "Cloud-GPU-03", outputFormat: "EXR", priority: "high", submittedBy: "Vision Pro #2"
  },
  {
    id: "j5", name: "Lighting_Rig_Test", scene: "Lighting Rig",
    frames: [1, 30], currentFrame: 0, engine: "EEVEE", samples: 32,
    resolution: "1280×720", status: "failed", progress: 45,
    timeElapsed: "4m", timeRemaining: "—",
    node: "RTX-Node-02", outputFormat: "PNG", priority: "low", submittedBy: "Blender WS"
  },
  {
    id: "j6", name: "Full_Scene_Composite", scene: "Scene Root",
    frames: [1, 360], currentFrame: 0, engine: "CYCLES", samples: 2048,
    resolution: "7680×4320", status: "queued", progress: 0,
    timeElapsed: "—", timeRemaining: "~18h",
    node: "—", outputFormat: "EXR", priority: "high", submittedBy: "Vision Pro #1"
  },
];

const RENDER_NODES: RenderNode[] = [
  {
    id: "rn1", name: "RTX-Node-01", type: "local", gpu: "NVIDIA RTX 4090", vram: "24 GB",
    cpuUsage: 45, gpuUsage: 94, ramUsage: 67, status: "active",
    currentJob: "j1", renderSpeed: 12.4, location: "Local Workstation"
  },
  {
    id: "rn2", name: "M4-Ultra-01", type: "apple-silicon", gpu: "Apple M4 Ultra (76-core)", vram: "192 GB",
    cpuUsage: 28, gpuUsage: 71, ramUsage: 42, status: "active",
    currentJob: "j2", renderSpeed: 9.8, location: "Mac Studio"
  },
  {
    id: "rn3", name: "RTX-Node-02", type: "local", gpu: "NVIDIA RTX 3090", vram: "24 GB",
    cpuUsage: 12, gpuUsage: 8, ramUsage: 31, status: "idle",
    currentJob: null, renderSpeed: 0, location: "Local Workstation"
  },
  {
    id: "rn4", name: "Cloud-GPU-01", type: "cloud", gpu: "A100 80GB SXM4", vram: "80 GB",
    cpuUsage: 89, gpuUsage: 98, ramUsage: 78, status: "active",
    currentJob: "j4", renderSpeed: 28.6, location: "AWS us-east-1"
  },
  {
    id: "rn5", name: "Cloud-GPU-02", type: "cloud", gpu: "A100 80GB SXM4", vram: "80 GB",
    cpuUsage: 0, gpuUsage: 0, ramUsage: 0, status: "offline",
    currentJob: null, renderSpeed: 0, location: "AWS us-east-1"
  },
  {
    id: "rn6", name: "Cloud-GPU-03", type: "cloud", gpu: "H100 80GB NVL", vram: "80 GB",
    cpuUsage: 76, gpuUsage: 91, ramUsage: 65, status: "active",
    currentJob: "j4", renderSpeed: 41.2, location: "GCP us-central1"
  },
];

const statusConfig = {
  rendering: { color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/25", dot: "bg-blue-400 animate-pulse", label: "Rendering" },
  queued: { color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/25", dot: "bg-amber-400", label: "Queued" },
  complete: { color: "text-green-400", bg: "bg-green-500/15 border-green-500/25", dot: "bg-green-400", label: "Complete" },
  failed: { color: "text-red-400", bg: "bg-red-500/15 border-red-500/25", dot: "bg-red-400", label: "Failed" },
  paused: { color: "text-gray-400", bg: "bg-gray-500/15 border-gray-500/25", dot: "bg-gray-400", label: "Paused" },
};

const nodeTypeIcon = (type: string) => {
  if (type === "cloud") return <Cloud className="w-3.5 h-3.5 text-blue-400" />;
  if (type === "apple-silicon") return <span className="text-sm">🍎</span>;
  return <Monitor className="w-3.5 h-3.5 text-gray-400" />;
};

export default function RenderFarm() {
  const [jobs, setJobs] = useState<RenderJob[]>(INITIAL_JOBS);
  const [nodes] = useState<RenderNode[]>(RENDER_NODES);
  const [selectedJob, setSelectedJob] = useState<string>("j1");
  const [view, setView] = useState<"jobs" | "nodes">("jobs");

  const selectedJobDef = jobs.find(j => j.id === selectedJob);

  // Animate rendering jobs
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.status !== "rendering") return job;
        const newProgress = Math.min(100, job.progress + Math.random() * 0.8);
        const newFrame = Math.floor((newProgress / 100) * (job.frames[1] - job.frames[0])) + job.frames[0];
        return { ...job, progress: newProgress, currentFrame: newFrame };
      }));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const totalFrames = jobs.reduce((s, j) => s + (j.frames[1] - j.frames[0] + 1), 0);
  const completedFrames = jobs.reduce((s, j) => s + Math.floor(j.progress / 100 * (j.frames[1] - j.frames[0] + 1)), 0);
  const activeNodes = nodes.filter(n => n.status === "active").length;
  const totalSpeed = nodes.filter(n => n.status === "active").reduce((s, n) => s + n.renderSpeed, 0);

  return (
    <div className="flex flex-col h-full bg-[#08080F] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8 bg-[#0A0A16] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Server className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">Render Farm Manager</h1>
          <p className="text-[10px] text-gray-500">Distributed cloud rendering · Blender Cycles/EEVEE · Multi-node</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
            {(["jobs", "nodes"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all capitalize ${
                  view === v ? "bg-violet-500/20 text-violet-300" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {v === "jobs" ? "Render Jobs" : "Farm Nodes"}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/15 border border-violet-500/25 rounded-lg text-xs text-violet-300 hover:bg-violet-500/25 transition-colors">
            <Play className="w-3 h-3" /> Submit Job
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-px bg-white/5 border-b border-white/8 flex-shrink-0">
        {[
          { label: "Active Nodes", value: `${activeNodes}/${nodes.length}`, color: "text-green-400", icon: Server },
          { label: "Render Speed", value: `${totalSpeed.toFixed(1)} fps`, color: "text-blue-400", icon: Zap },
          { label: "Jobs Queued", value: `${jobs.filter(j => j.status === "queued").length}`, color: "text-amber-400", icon: Clock },
          { label: "Frames Done", value: `${completedFrames}/${totalFrames}`, color: "text-purple-400", icon: Film },
          { label: "GPU Utilization", value: "88%", color: "text-cyan-400", icon: Activity },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 px-4 py-2.5 bg-[#09090F]">
            <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
            <div>
              <div className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main list */}
        <div className="flex-1 overflow-y-auto">
          {view === "jobs" ? (
            <div>
              <div className="sticky top-0 bg-[#0A0A16] border-b border-white/8 px-4 py-2 flex items-center gap-3">
                <span className="text-[9px] text-gray-600 uppercase tracking-wider">Render Queue</span>
                <span className="text-[9px] text-gray-700">— {jobs.length} jobs</span>
                <div className="ml-auto flex gap-1">
                  {["All", "Active", "Queued", "Complete"].map(f => (
                    <button key={f} className={`px-2 py-0.5 rounded text-[9px] transition-colors ${f === "All" ? "bg-white/10 text-gray-300" : "text-gray-600 hover:text-gray-400"}`}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {jobs.map(job => {
                  const sc = statusConfig[job.status];
                  const isSelected = selectedJob === job.id;
                  return (
                    <motion.div
                      key={job.id}
                      onClick={() => setSelectedJob(job.id)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${isSelected ? "bg-violet-500/8" : "hover:bg-white/3"}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Priority indicator */}
                        <div className={`w-1 h-full min-h-[40px] rounded-full flex-shrink-0 ${
                          job.priority === "high" ? "bg-red-500" : job.priority === "normal" ? "bg-blue-500" : "bg-gray-600"
                        }`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-white truncate">{job.name}</span>
                            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-medium ${sc.bg} ${sc.color}`}>
                              <div className={`w-1 h-1 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                              job.engine === "CYCLES" ? "bg-blue-500/15 text-blue-300" : "bg-amber-500/15 text-amber-300"
                            }`}>{job.engine}</span>
                          </div>

                          <div className="flex items-center gap-4 text-[10px] text-gray-500 mb-2">
                            <span>{job.scene}</span>
                            <span>Frames {job.frames[0]}–{job.frames[1]}</span>
                            <span>{job.resolution}</span>
                            <span>{job.samples} samples</span>
                            <span className="text-gray-600">{job.outputFormat}</span>
                            <span className="ml-auto text-gray-600">by {job.submittedBy}</span>
                          </div>

                          {job.status === "rendering" && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
                                  animate={{ width: `${job.progress}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                              <span className="text-[10px] text-violet-400 font-mono w-10 text-right">{job.progress.toFixed(1)}%</span>
                              <span className="text-[9px] text-gray-600">Frame {job.currentFrame}</span>
                              <span className="text-[9px] text-gray-600">⏱ {job.timeElapsed}</span>
                              <span className="text-[9px] text-gray-500">~{job.timeRemaining} left</span>
                            </div>
                          )}
                          {job.status === "complete" && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-green-500/30 rounded-full">
                                <div className="h-full w-full bg-green-500 rounded-full" />
                              </div>
                              <span className="text-[10px] text-green-400 font-mono">100%</span>
                              <span className="text-[9px] text-gray-600">Done in {job.timeElapsed}</span>
                            </div>
                          )}
                          {job.status === "queued" && (
                            <div className="text-[9px] text-gray-600">Estimated: {job.timeRemaining}</div>
                          )}
                          {job.status === "failed" && (
                            <div className="text-[9px] text-red-400">Error: Out of VRAM — reduce sample count or resolution</div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {job.status === "rendering" && (
                            <button className="p-1 text-gray-500 hover:text-amber-400 transition-colors" title="Pause">
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(job.status === "queued" || job.status === "paused") && (
                            <button className="p-1 text-gray-500 hover:text-green-400 transition-colors" title="Start">
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {job.status === "complete" && (
                            <button className="p-1 text-gray-500 hover:text-blue-400 transition-colors" title="Download">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {job.status === "failed" && (
                            <button className="p-1 text-gray-500 hover:text-amber-400 transition-colors" title="Retry">
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Cancel">
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="sticky top-0 bg-[#0A0A16] border-b border-white/8 px-4 py-2">
                <span className="text-[9px] text-gray-600 uppercase tracking-wider">Farm Nodes — {nodes.length} registered</span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                {nodes.map(node => (
                  <div key={node.id} className={`p-3 rounded-xl border bg-[#0D0D1A] transition-colors ${
                    node.status === "active" ? "border-white/12 hover:border-white/20" :
                    node.status === "idle" ? "border-white/8" : "border-white/5 opacity-60"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {nodeTypeIcon(node.type)}
                      <span className="text-xs font-semibold text-white">{node.name}</span>
                      <div className={`ml-auto w-2 h-2 rounded-full ${
                        node.status === "active" ? "bg-green-400 animate-pulse" :
                        node.status === "idle" ? "bg-amber-400" : "bg-gray-600"
                      }`} />
                    </div>
                    <div className="text-[9px] text-gray-500 mb-2">{node.gpu} · {node.vram} VRAM</div>
                    <div className="text-[9px] text-gray-600 mb-2">{node.location}</div>
                    {node.status === "active" && (
                      <>
                        <div className="space-y-1.5 mb-2">
                          {[
                            { label: "GPU", value: node.gpuUsage, color: "bg-purple-500" },
                            { label: "CPU", value: node.cpuUsage, color: "bg-blue-500" },
                            { label: "RAM", value: node.ramUsage, color: "bg-green-500" },
                          ].map(m => (
                            <div key={m.label} className="flex items-center gap-2">
                              <span className="text-[8px] text-gray-600 w-6">{m.label}</span>
                              <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                                <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.value}%` }} />
                              </div>
                              <span className="text-[8px] text-gray-500 w-6 text-right">{m.value}%</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-gray-600">Speed: <span className="text-blue-400 font-mono">{node.renderSpeed} fps</span></span>
                          {node.currentJob && <span className="text-gray-600">Job: <span className="text-violet-400">{node.currentJob}</span></span>}
                        </div>
                      </>
                    )}
                    {node.status === "idle" && (
                      <div className="text-[9px] text-amber-400">Idle — ready for jobs</div>
                    )}
                    {node.status === "offline" && (
                      <div className="text-[9px] text-gray-600">Offline</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Job details */}
        {view === "jobs" && selectedJobDef && (
          <div className="w-64 flex-shrink-0 border-l border-white/8 bg-[#0A0A14] overflow-y-auto">
            <div className="px-3 py-2 border-b border-white/8">
              <p className="text-[9px] text-gray-600 uppercase tracking-wider">Job Details</p>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <p className="text-xs font-bold text-white mb-1">{selectedJobDef.name}</p>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] ${statusConfig[selectedJobDef.status].bg} ${statusConfig[selectedJobDef.status].color}`}>
                  <div className={`w-1 h-1 rounded-full ${statusConfig[selectedJobDef.status].dot}`} />
                  {statusConfig[selectedJobDef.status].label}
                </div>
              </div>

              <div className="space-y-1.5 text-[10px]">
                {[
                  { label: "Scene", value: selectedJobDef.scene },
                  { label: "Engine", value: selectedJobDef.engine },
                  { label: "Samples", value: selectedJobDef.samples.toString() },
                  { label: "Resolution", value: selectedJobDef.resolution },
                  { label: "Frames", value: `${selectedJobDef.frames[0]} – ${selectedJobDef.frames[1]}` },
                  { label: "Current Frame", value: selectedJobDef.currentFrame.toString() },
                  { label: "Output", value: selectedJobDef.outputFormat },
                  { label: "Priority", value: selectedJobDef.priority },
                  { label: "Node", value: selectedJobDef.node || "Unassigned" },
                  { label: "Submitted By", value: selectedJobDef.submittedBy },
                  { label: "Time Elapsed", value: selectedJobDef.timeElapsed },
                  { label: "Time Remaining", value: selectedJobDef.timeRemaining },
                ].map(item => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="text-gray-300 font-mono text-right">{item.value}</span>
                  </div>
                ))}
              </div>

              {selectedJobDef.status === "rendering" && (
                <div>
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-violet-400 font-mono">{selectedJobDef.progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
                      animate={{ width: `${selectedJobDef.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/8 space-y-1.5">
                {selectedJobDef.status === "complete" && (
                  <button className="w-full py-1.5 bg-green-500/15 border border-green-500/25 rounded-lg text-[10px] text-green-300 hover:bg-green-500/25 transition-colors flex items-center justify-center gap-1">
                    <Download className="w-3 h-3" /> Download Output
                  </button>
                )}
                {selectedJobDef.status === "failed" && (
                  <button className="w-full py-1.5 bg-amber-500/15 border border-amber-500/25 rounded-lg text-[10px] text-amber-300 hover:bg-amber-500/25 transition-colors flex items-center justify-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Retry Job
                  </button>
                )}
                <button className="w-full py-1.5 bg-violet-500/15 border border-violet-500/25 rounded-lg text-[10px] text-violet-300 hover:bg-violet-500/25 transition-colors flex items-center justify-center gap-1">
                  <Eye className="w-3 h-3" /> Preview Frames
                </button>
                <button className="w-full py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-400 hover:bg-white/10 transition-colors">
                  Edit Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
