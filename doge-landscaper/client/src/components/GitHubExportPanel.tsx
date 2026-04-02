/**
 * DOGE-LANDSCAPER — GitHub Export Panel
 * Pushes Markdown mission logs to JacksonJoshuab/DOGE-Spatial-Explorer
 * Design: Spatial Glass Command Deck
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Github, Key, Upload, CheckCircle, AlertCircle, Loader2, ExternalLink, Trash2, Lock, BookOpen, GitCommit } from "lucide-react";
import { useGitHubExport, type MissionLogEntry } from "@/hooks/useGitHubExport";
import type { RobotPersona } from "@/lib/data";

interface GitHubExportPanelProps {
  persona: RobotPersona;
  completedTaskIds: string[];
  isSprayActive: boolean;
  windSpeed?: number;
  temperature?: number;
  humidity?: number;
  weatherCondition?: string;
}

const CHIP_NOTES = [
  "Well butter my biscuit, that lawn ain't gonna treat itself! Got through the main zones without a single dandelion complaint.",
  "Corn's not the only thing growing tall in Wilton today — them weeds were putting up a fight, but Chip prevailed!",
  "Applied the Scotts Weed & Feed with surgical precision. Shield guard held strong near the flower beds. No overspray incidents to report.",
  "Wind cooperated like a good neighbor today. Spray windows were optimal — Chip McHaymaker does NOT mess around with overspray.",
  "Checked the scilla bulbs by the oak tree — looking healthy! Avoided the root zone as instructed. That tree's been there longer than I have.",
];

export default function GitHubExportPanel({
  persona,
  completedTaskIds,
  isSprayActive,
  windSpeed = 0,
  temperature = 58,
  humidity = 68,
  weatherCondition = "Partly Cloudy",
}: GitHubExportPanelProps) {
  const { state, setToken, clearToken, exportToGitHub } = useGitHubExport();
  const [tokenInput, setTokenInput] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(!state.hasToken);
  const [showTokenValue, setShowTokenValue] = useState(false);

  const handleSaveToken = () => {
    if (!tokenInput.trim()) {
      toast.error("Please enter a valid GitHub PAT");
      return;
    }
    if (!tokenInput.startsWith("ghp_") && !tokenInput.startsWith("github_pat_")) {
      toast.warning("⚠️ Token format looks unusual — make sure it's a valid GitHub PAT");
    }
    setToken(tokenInput);
    setTokenInput("");
    setShowTokenInput(false);
    toast.success("🔑 GitHub token saved for this session");
  };

  const handleExport = async () => {
    const zonesCompleted: string[] = [];
    if (completedTaskIds.includes("task-2")) zonesCompleted.push("A", "B");
    if (completedTaskIds.includes("task-3")) zonesCompleted.push("C");
    if (completedTaskIds.includes("task-4")) zonesCompleted.push("D");

    const entry: MissionLogEntry = {
      date: new Date().toISOString(),
      persona,
      completedTaskIds,
      isSprayActive,
      windSpeed,
      temperature,
      humidity,
      weatherCondition,
      zonesCompleted,
      productsUsed: completedTaskIds.includes("task-2") ? ["Scotts Turf Builder Weed & Feed (12,000 sq ft)"] : [],
      notes: CHIP_NOTES[Math.floor(Math.random() * CHIP_NOTES.length)],
    };

    await exportToGitHub(entry);

    if (state.status !== "error") {
      toast.success("📤 Mission log pushed to GitHub!", {
        description: `${completedTaskIds.length}/6 tasks · ${zonesCompleted.length} zones · DOGE-Spatial-Explorer`,
        duration: 6000,
      });
    }
  };

  const completionPct = Math.round((completedTaskIds.length / 6) * 100);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-700/50 border border-gray-500/30 flex items-center justify-center">
            <Github size={14} className="text-gray-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">GitHub Mission Log</h3>
            <p className="text-[10px] text-white/40">
              <span className="text-cyan-400 font-mono">JacksonJoshuab/DOGE-Spatial-Explorer</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${state.hasToken ? "bg-green-400" : "bg-red-400"}`} />
          <span className={`text-[9px] font-mono ${state.hasToken ? "text-green-400" : "text-red-400"}`}>
            {state.hasToken ? "AUTH" : "NO TOKEN"}
          </span>
        </div>
      </div>

      {/* Token setup */}
      <AnimatePresence>
        {showTokenInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl p-3 space-y-2 border border-yellow-400/20"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Key size={11} className="text-yellow-400" />
              <span className="text-[10px] text-yellow-300 font-semibold">GitHub Personal Access Token</span>
            </div>
            <p className="text-[9px] text-white/40 leading-relaxed">
              Create a PAT at <span className="text-cyan-400">github.com/settings/tokens</span> with <span className="font-mono text-white/60">repo</span> scope. Token is stored in localStorage — persists across sessions. Clear anytime below.
            </p>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <input
                  type={showTokenValue ? "text" : "password"}
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSaveToken()}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-white/80 placeholder-white/20 focus:outline-none focus:border-yellow-400/40"
                />
                <button
                  onClick={() => setShowTokenValue(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  <Lock size={9} />
                </button>
              </div>
              <button
                onClick={handleSaveToken}
                className="px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 text-[10px] font-semibold hover:bg-yellow-500/30 transition-all"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token status */}
      {state.hasToken && !showTokenInput && (
        <div className="flex items-center justify-between glass rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={11} className="text-green-400" />
            <span className="text-[10px] text-white/60">Token active (saved in localStorage)</span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowTokenInput(true)}
              className="text-[9px] text-white/30 hover:text-white/60 transition-all"
            >
              Change
            </button>
            <button
              onClick={() => { clearToken(); setShowTokenInput(true); toast.info("Token cleared"); }}
              className="text-[9px] text-red-400/60 hover:text-red-400 transition-all"
            >
              <Trash2 size={9} />
            </button>
          </div>
        </div>
      )}

      {!state.hasToken && !showTokenInput && (
        <button
          onClick={() => setShowTokenInput(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-yellow-400/20 text-yellow-300/60 text-[10px] hover:bg-yellow-500/10 transition-all"
        >
          <Key size={10} />Add GitHub Token
        </button>
      )}

      {/* Mission snapshot */}
      <div className="glass rounded-xl p-3 space-y-2">
        <p className="text-[9px] text-white/40 uppercase tracking-wider">Report Preview</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Tasks Done", value: `${completedTaskIds.length}/6`, color: completedTaskIds.length >= 4 ? "text-green-400" : "text-yellow-400" },
            { label: "Completion", value: `${completionPct}%`, color: "text-cyan-400" },
            { label: "Wind", value: `${windSpeed.toFixed(0)} mph`, color: windSpeed > 10 ? "text-red-400" : "text-green-400" },
            { label: "Spray", value: isSprayActive ? "ACTIVE" : "OFF", color: isSprayActive ? "text-blue-400" : "text-white/30" },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center bg-white/3 rounded-lg px-2 py-1">
              <span className="text-[9px] text-white/40">{item.label}</span>
              <span className={`text-[9px] font-mono font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
        <div className="bg-white/3 rounded-lg px-2 py-1.5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-white/40">Progress</span>
            <span className="text-[9px] font-mono text-white/60">{completionPct}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completionPct}%`,
                background: completionPct >= 80 ? "oklch(0.72 0.19 145)" : completionPct >= 50 ? "oklch(0.78 0.18 75)" : "oklch(0.65 0.22 30)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Export button */}
      <motion.button
        onClick={handleExport}
        disabled={state.status === "pushing" || !state.hasToken}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border ${
          !state.hasToken
            ? "bg-white/3 border-white/10 text-white/20 cursor-not-allowed"
            : state.status === "pushing"
            ? "bg-gray-700/30 border-gray-500/30 text-gray-400 cursor-wait"
            : state.status === "success"
            ? "bg-green-500/20 border-green-400/40 text-green-300"
            : state.status === "error"
            ? "bg-red-500/20 border-red-400/40 text-red-300"
            : "bg-gray-700/30 border-gray-400/30 text-white hover:bg-gray-600/40"
        }`}
        whileHover={{ scale: state.hasToken && state.status === "idle" ? 1.02 : 1 }}
        whileTap={{ scale: state.hasToken && state.status === "idle" ? 0.98 : 1 }}
      >
        {state.status === "pushing" ? (
          <><Loader2 size={14} className="animate-spin" />Pushing to GitHub...</>
        ) : state.status === "success" ? (
          <><CheckCircle size={14} />Pushed Successfully!</>
        ) : state.status === "error" ? (
          <><AlertCircle size={14} />Push Failed — Retry</>
        ) : (
          <><Upload size={14} /><Github size={14} />Push Mission Log to GitHub</>
        )}
      </motion.button>

      {/* Status message */}
      <AnimatePresence>
        {state.message && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`glass rounded-xl px-3 py-2 flex items-start gap-2 ${
              state.status === "error" ? "border border-red-500/20" :
              state.status === "success" ? "border border-green-500/20" :
              "border border-white/10"
            }`}
          >
            {state.status === "error" ? <AlertCircle size={11} className="text-red-400 mt-0.5 flex-shrink-0" /> :
             state.status === "success" ? <CheckCircle size={11} className="text-green-400 mt-0.5 flex-shrink-0" /> :
             <Loader2 size={11} className="text-cyan-400 mt-0.5 flex-shrink-0 animate-spin" />}
            <span className="text-[10px] text-white/60 leading-relaxed">{state.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Commit link */}
      <AnimatePresence>
        {state.commitUrl && (
          <motion.a
            href={state.commitUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 glass rounded-xl px-3 py-2.5 border border-green-500/20 hover:bg-green-500/10 transition-all group"
          >
            <GitCommit size={12} className="text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-green-300 font-semibold">View commit on GitHub</p>
              <p className="text-[9px] text-white/30 truncate font-mono">{state.commitUrl}</p>
            </div>
            <ExternalLink size={10} className="text-white/30 group-hover:text-white/60 transition-all flex-shrink-0" />
          </motion.a>
        )}
      </AnimatePresence>

      {/* Repo info */}
      <div className="glass rounded-xl p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpen size={11} className="text-white/40" />
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Log Structure</p>
        </div>
        {[
          { path: "mission-logs/", desc: "Daily Markdown reports" },
          { path: "YYYY-MM-DD-HHmm-chip-mission.md", desc: "Timestamped log file" },
          { path: "Includes:", desc: "Tasks · Weather · Zones · Products · Chip's notes" },
        ].map(item => (
          <div key={item.path} className="flex items-start gap-2">
            <span className="text-[9px] font-mono text-cyan-400/60 flex-shrink-0">{item.path}</span>
            <span className="text-[9px] text-white/30">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* Chip's quip */}
      <div className="glass rounded-xl p-3 border border-yellow-400/20">
        <p className="text-[10px] text-yellow-300/80 italic leading-relaxed">
          💬 "Every great lawn deserves a paper trail, partner. Chip McHaymaker commits his work — to the yard AND to GitHub!"
        </p>
      </div>
    </div>
  );
}
