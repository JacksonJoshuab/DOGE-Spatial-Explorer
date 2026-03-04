import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch, GitCommit, GitMerge, GitPullRequest,
  Plus, ArrowLeftRight, CheckCircle, AlertCircle,
  Clock, User, Tag, ChevronRight, ChevronDown,
  Upload, Download, RefreshCw, Eye, Trash2, Copy,
  Triangle, Box, Zap, Layers, Settings, Code
} from "lucide-react";

interface Commit {
  id: string;
  hash: string;
  message: string;
  author: string;
  device: string;
  timestamp: string;
  branch: string;
  changes: { added: number; modified: number; deleted: number };
  tags: string[];
  parent: string | null;
}

interface DiffEntry {
  id: string;
  objectName: string;
  objectType: string;
  changeType: "added" | "modified" | "deleted" | "renamed";
  property: string;
  oldValue: string | null;
  newValue: string | null;
  source: "blender" | "visionos" | "quest" | "ipad";
}

interface Branch {
  name: string;
  lastCommit: string;
  ahead: number;
  behind: number;
  active: boolean;
  author: string;
}

const COMMITS: Commit[] = [
  {
    id: "c1", hash: "a3f9b2c", message: "Add plasma ring emission material with Z-Pinch glow",
    author: "Vision Pro #1", device: "👓", timestamp: "2 min ago", branch: "main",
    changes: { added: 2, modified: 5, deleted: 0 }, tags: ["v2.3.1"], parent: "c2"
  },
  {
    id: "c2", hash: "7e1d4a8", message: "Update particle system count to 2048, fix simulation bounds",
    author: "Blender WS", device: "🔷", timestamp: "18 min ago", branch: "main",
    changes: { added: 0, modified: 3, deleted: 1 }, tags: [], parent: "c3"
  },
  {
    id: "c3", hash: "2b5f9e1", message: "Merge branch 'feature/aurora-gradient' into main",
    author: "iPad Pro", device: "📱", timestamp: "1h ago", branch: "main",
    changes: { added: 4, modified: 8, deleted: 2 }, tags: [], parent: "c4"
  },
  {
    id: "c4", hash: "9c3a7f2", message: "Add bounding box wireframe with RGB axis indicators",
    author: "Quest 3", device: "🥽", timestamp: "2h ago", branch: "main",
    changes: { added: 3, modified: 1, deleted: 0 }, tags: ["v2.3.0"], parent: "c5"
  },
  {
    id: "c5", hash: "f4b8d3e", message: "Initial Z-Pinch plasma column mesh — 18432 verts",
    author: "Blender WS", device: "🔷", timestamp: "5h ago", branch: "main",
    changes: { added: 12, modified: 0, deleted: 0 }, tags: ["v2.2.0", "initial"], parent: null
  },
];

const DIFF_ENTRIES: DiffEntry[] = [
  { id: "d1", objectName: "Plasma Ring Mat", objectType: "material", changeType: "modified", property: "emission_color", oldValue: "#5030cc", newValue: "#7040ff", source: "visionos" },
  { id: "d2", objectName: "Plasma Ring Mat", objectType: "material", changeType: "modified", property: "emission_strength", oldValue: "2.0", newValue: "3.5", source: "visionos" },
  { id: "d3", objectName: "Plasma Rings (×18)", objectType: "mesh", changeType: "modified", property: "location.z", oldValue: "0.0", newValue: "0.05", source: "blender" },
  { id: "d4", objectName: "Core Sphere", objectType: "mesh", changeType: "modified", property: "scale", oldValue: "[1,1,1]", newValue: "[1.1,1.1,1.1]", source: "visionos" },
  { id: "d5", objectName: "Aurora Gradient Mat", objectType: "material", changeType: "added", property: "—", oldValue: null, newValue: "New material created", source: "blender" },
  { id: "d6", objectName: "Temp Light", objectType: "light", changeType: "deleted", property: "—", oldValue: "Point Light, energy=500", newValue: null, source: "blender" },
  { id: "d7", objectName: "Z-Pinch Column", objectType: "mesh", changeType: "modified", property: "subdivision_level", oldValue: "2", newValue: "3", source: "blender" },
  { id: "d8", objectName: "Particle System", objectType: "particles", changeType: "modified", property: "count", oldValue: "1024", newValue: "2048", source: "blender" },
];

const BRANCHES: Branch[] = [
  { name: "main", lastCommit: "a3f9b2c", ahead: 0, behind: 0, active: true, author: "Vision Pro #1" },
  { name: "feature/aurora-gradient", lastCommit: "3d7c9f1", ahead: 2, behind: 1, active: false, author: "Blender WS" },
  { name: "feature/particle-sim-v2", lastCommit: "8a2e5b4", ahead: 5, behind: 3, active: false, author: "Quest 3" },
  { name: "hotfix/material-conflict", lastCommit: "1f4d8c2", ahead: 1, behind: 0, active: false, author: "iPad Pro" },
];

const sourceIcon = (s: string) => {
  if (s === "visionos") return "👓";
  if (s === "quest") return "🥽";
  if (s === "ipad") return "📱";
  return "🔷";
};

const changeColor = {
  added: "text-green-400 bg-green-500/10 border-green-500/20",
  modified: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  deleted: "text-red-400 bg-red-500/10 border-red-500/20",
  renamed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

const changePrefix = {
  added: "+",
  modified: "~",
  deleted: "−",
  renamed: "→",
};

export default function SceneVersionControl() {
  const [selectedCommit, setSelectedCommit] = useState<string>("c1");
  const [activeBranch, setActiveBranch] = useState("main");
  const [expandedCommit, setExpandedCommit] = useState<string | null>("c1");
  const [view, setView] = useState<"history" | "diff" | "branches">("history");
  const [commitMsg, setCommitMsg] = useState("");
  const [syncing, setSyncing] = useState(false);

  const selectedCommitDef = COMMITS.find(c => c.id === selectedCommit);

  const handleCommit = () => {
    if (!commitMsg.trim()) return;
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setCommitMsg("");
    }, 1500);
  };

  const totalChanges = DIFF_ENTRIES.length;
  const addedCount = DIFF_ENTRIES.filter(d => d.changeType === "added").length;
  const modifiedCount = DIFF_ENTRIES.filter(d => d.changeType === "modified").length;
  const deletedCount = DIFF_ENTRIES.filter(d => d.changeType === "deleted").length;

  return (
    <div className="flex flex-col h-full bg-[#08080F] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8 bg-[#0A0A16] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">Scene Version Control</h1>
          <p className="text-[10px] text-gray-500">Git-style spatial scene history · CRDT diff · Multi-device branching</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-[10px] text-emerald-400">
            <GitBranch className="w-3 h-3" />
            {activeBranch}
          </div>
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
            {(["history", "diff", "branches"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all capitalize ${
                  view === v ? "bg-emerald-500/20 text-emerald-300" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {v === "history" ? "History" : v === "diff" ? "Diff" : "Branches"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-white/5 border-b border-white/8 flex-shrink-0">
        {[
          { label: "Commits", value: COMMITS.length.toString(), color: "text-emerald-400", icon: GitCommit },
          { label: "Staged Changes", value: `+${addedCount} ~${modifiedCount} −${deletedCount}`, color: "text-amber-400", icon: Code },
          { label: "Branches", value: BRANCHES.length.toString(), color: "text-blue-400", icon: GitBranch },
          { label: "Contributors", value: "4", color: "text-purple-400", icon: User },
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
        {/* Main panel */}
        <div className="flex-1 flex flex-col min-h-0">
          {view === "history" && (
            <div className="flex-1 overflow-y-auto">
              {/* Commit graph */}
              <div className="p-4 space-y-1">
                {COMMITS.map((commit, idx) => (
                  <div key={commit.id}>
                    <motion.div
                      onClick={() => {
                        setSelectedCommit(commit.id);
                        setExpandedCommit(expandedCommit === commit.id ? null : commit.id);
                      }}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedCommit === commit.id
                          ? "border-emerald-500/30 bg-emerald-500/8"
                          : "border-white/8 hover:border-white/15 hover:bg-white/3"
                      }`}
                    >
                      {/* Graph line */}
                      <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                        <div className={`w-3 h-3 rounded-full border-2 ${
                          selectedCommit === commit.id ? "border-emerald-400 bg-emerald-400/30" : "border-gray-600 bg-[#08080F]"
                        }`} />
                        {idx < COMMITS.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1 h-6" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-white truncate">{commit.message}</span>
                          {commit.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/25 rounded text-[8px] text-emerald-300">
                              <Tag className="w-2 h-2" />{tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-[9px] text-gray-500">
                          <span className="font-mono text-gray-600">{commit.hash}</span>
                          <span>{commit.device} {commit.author}</span>
                          <span><Clock className="w-2.5 h-2.5 inline mr-0.5" />{commit.timestamp}</span>
                          <span className="text-green-400">+{commit.changes.added}</span>
                          <span className="text-amber-400">~{commit.changes.modified}</span>
                          <span className="text-red-400">−{commit.changes.deleted}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button className="p-1 text-gray-600 hover:text-emerald-400 transition-colors" title="Checkout">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-blue-400 transition-colors" title="Cherry-pick">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {expandedCommit === commit.id ? (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </div>
                    </motion.div>

                    {/* Expanded diff preview */}
                    <AnimatePresence>
                      {expandedCommit === commit.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-6"
                        >
                          <div className="border border-white/8 rounded-xl bg-[#0D0D1A] p-3 mb-1 mt-1">
                            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Changes in this commit</p>
                            <div className="space-y-1">
                              {DIFF_ENTRIES.slice(0, 4).map(d => (
                                <div key={d.id} className="flex items-center gap-2 text-[9px]">
                                  <span className={`w-4 h-4 flex items-center justify-center rounded text-[8px] font-bold border ${changeColor[d.changeType]}`}>
                                    {changePrefix[d.changeType]}
                                  </span>
                                  <span className="text-gray-400">{d.objectName}</span>
                                  <span className="text-gray-600">·</span>
                                  <span className="text-gray-500">{d.property}</span>
                                  {d.oldValue && d.newValue && (
                                    <>
                                      <span className="text-red-400 font-mono line-through">{d.oldValue}</span>
                                      <span className="text-gray-600">→</span>
                                      <span className="text-green-400 font-mono">{d.newValue}</span>
                                    </>
                                  )}
                                  <span className="ml-auto">{sourceIcon(d.source)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "diff" && (
            <div className="flex-1 overflow-y-auto">
              <div className="sticky top-0 bg-[#0A0A16] border-b border-white/8 px-4 py-2 flex items-center gap-3">
                <span className="text-[9px] text-gray-600 uppercase tracking-wider">Working Tree Changes</span>
                <span className="text-[9px] text-green-400">+{addedCount} added</span>
                <span className="text-[9px] text-amber-400">~{modifiedCount} modified</span>
                <span className="text-[9px] text-red-400">−{deletedCount} deleted</span>
              </div>
              <div className="p-4 space-y-1.5">
                {DIFF_ENTRIES.map(d => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/8 bg-[#0D0D1A] hover:border-white/15 transition-colors"
                  >
                    <span className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold border flex-shrink-0 ${changeColor[d.changeType]}`}>
                      {changePrefix[d.changeType]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">{d.objectName}</span>
                        <span className="text-[9px] text-gray-600 capitalize">{d.objectType}</span>
                        <span className="text-[9px] text-gray-500">· {d.property}</span>
                      </div>
                      {d.oldValue && d.newValue && (
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[9px]">
                          <span className="text-red-400 bg-red-500/10 px-1 rounded">{d.oldValue}</span>
                          <span className="text-gray-600">→</span>
                          <span className="text-green-400 bg-green-500/10 px-1 rounded">{d.newValue}</span>
                        </div>
                      )}
                      {d.changeType === "added" && d.newValue && (
                        <div className="text-[9px] text-green-400 mt-0.5">{d.newValue}</div>
                      )}
                      {d.changeType === "deleted" && d.oldValue && (
                        <div className="text-[9px] text-red-400 line-through mt-0.5">{d.oldValue}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm" title={d.source}>{sourceIcon(d.source)}</span>
                      <button className="text-[9px] text-gray-600 hover:text-emerald-400 transition-colors">Stage</button>
                      <button className="text-[9px] text-gray-600 hover:text-red-400 transition-colors">Discard</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {view === "branches" && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {BRANCHES.map(branch => (
                  <div
                    key={branch.name}
                    className={`p-3 rounded-xl border transition-all ${
                      branch.active ? "border-emerald-500/30 bg-emerald-500/8" : "border-white/8 hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <GitBranch className={`w-3.5 h-3.5 ${branch.active ? "text-emerald-400" : "text-gray-500"}`} />
                      <span className={`text-xs font-semibold ${branch.active ? "text-emerald-300" : "text-white"}`}>
                        {branch.name}
                      </span>
                      {branch.active && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-[8px] text-emerald-300">
                          HEAD
                        </span>
                      )}
                      <span className="ml-auto text-[9px] text-gray-600 font-mono">{branch.lastCommit}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] text-gray-500">
                      <span>by {branch.author}</span>
                      {branch.ahead > 0 && <span className="text-green-400">↑ {branch.ahead} ahead</span>}
                      {branch.behind > 0 && <span className="text-amber-400">↓ {branch.behind} behind</span>}
                    </div>
                    {!branch.active && (
                      <div className="flex gap-1.5 mt-2">
                        <button className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-gray-400 hover:bg-white/10 transition-colors flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5" /> Checkout
                        </button>
                        <button className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1">
                          <GitMerge className="w-2.5 h-2.5" /> Merge
                        </button>
                        <button className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-[9px] text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-1">
                          <GitPullRequest className="w-2.5 h-2.5" /> PR
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Commit panel */}
        <div className="w-64 flex-shrink-0 border-l border-white/8 bg-[#0A0A14] flex flex-col">
          <div className="px-3 py-2 border-b border-white/8">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider">Commit Changes</p>
          </div>

          <div className="p-3 flex-1 flex flex-col gap-3">
            {/* Staged summary */}
            <div className="p-2.5 bg-white/3 border border-white/8 rounded-xl">
              <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Staged ({totalChanges})</p>
              <div className="flex gap-3 text-[10px]">
                <span className="text-green-400 font-mono">+{addedCount}</span>
                <span className="text-amber-400 font-mono">~{modifiedCount}</span>
                <span className="text-red-400 font-mono">−{deletedCount}</span>
              </div>
            </div>

            {/* Commit message */}
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5">Commit Message</p>
              <textarea
                value={commitMsg}
                onChange={e => setCommitMsg(e.target.value)}
                placeholder="Describe your spatial changes…"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-[10px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-gray-600">Author:</span>
              <span className="text-emerald-400">👓 Vision Pro #1</span>
            </div>

            {/* Branch */}
            <div className="flex items-center gap-2 text-[10px]">
              <GitBranch className="w-3 h-3 text-gray-600" />
              <span className="text-gray-600">Branch:</span>
              <span className="text-emerald-400 font-mono">{activeBranch}</span>
            </div>

            <button
              onClick={handleCommit}
              disabled={!commitMsg.trim() || syncing}
              className={`w-full py-2 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                commitMsg.trim() && !syncing
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30"
                  : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
              }`}
            >
              {syncing ? (
                <><RefreshCw className="w-3 h-3 animate-spin" /> Committing…</>
              ) : (
                <><GitCommit className="w-3 h-3" /> Commit to {activeBranch}</>
              )}
            </button>

            <div className="border-t border-white/8 pt-3 space-y-1.5">
              <button className="w-full py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-400 hover:bg-white/10 transition-colors flex items-center justify-center gap-1">
                <Upload className="w-3 h-3" /> Push to Remote
              </button>
              <button className="w-full py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-400 hover:bg-white/10 transition-colors flex items-center justify-center gap-1">
                <Download className="w-3 h-3" /> Pull from Remote
              </button>
              <button className="w-full py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1">
                <GitBranch className="w-3 h-3" /> New Branch
              </button>
            </div>
          </div>

          {/* Recent contributors */}
          <div className="border-t border-white/8 p-3">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Contributors</p>
            <div className="space-y-1.5">
              {[
                { name: "Vision Pro #1", device: "👓", commits: 12 },
                { name: "Blender WS", device: "🔷", commits: 8 },
                { name: "Quest 3", device: "🥽", commits: 5 },
                { name: "iPad Pro", device: "📱", commits: 3 },
              ].map(c => (
                <div key={c.name} className="flex items-center gap-2 text-[9px]">
                  <span>{c.device}</span>
                  <span className="text-gray-400 flex-1">{c.name}</span>
                  <span className="text-gray-600 font-mono">{c.commits} commits</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
