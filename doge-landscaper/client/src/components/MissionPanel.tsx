/* MissionPanel — Daily mission tasks with status tracking */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle, Clock, Play, Pause, AlertTriangle, ChevronDown, ChevronRight, Navigation, Zap } from "lucide-react";
import type { RobotPersona } from "@/lib/data";

interface Task {
  id: string;
  time: string;
  name: string;
  description: string;
  zone: string;
  duration: string;
  priority: string;
  status: string;
  tools: string[];
  chipNote: string;
}

interface MissionPanelProps {
  tasks: Task[];
  persona: RobotPersona;
  onTaskComplete?: (taskId: string) => void;
  robotProgress?: number; // 0–1, driven by animation loop
}

const PRIORITY_COLORS = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-green-400",
};

const STATUS_CONFIG = {
  completed: { color: "text-green-400", bg: "glass-green", icon: <CheckCircle size={12} /> },
  "in-progress": { color: "text-yellow-400", bg: "glass-gold", icon: <Play size={12} /> },
  pending: { color: "text-white/40", bg: "glass", icon: <Clock size={12} /> },
};

// Zone coverage map: which task IDs have spray zones and their path segment range
const ZONE_SPRAY_TASKS: Record<string, { label: string; start: number; end: number }> = {
  "weed-feed-apply": { label: "Zone A+B", start: 0.0, end: 0.5 },
  "mow-main":        { label: "Zone C",   start: 0.5, end: 0.75 },
  "edge-beds":       { label: "Zone D",   start: 0.75, end: 1.0 },
};

export default function MissionPanel({ tasks, persona, onTaskComplete, robotProgress = 0 }: MissionPanelProps) {
  const [taskStates, setTaskStates] = useState<Record<string, string>>(
    Object.fromEntries(tasks.map(t => [t.id, t.status]))
  );
  const [expanded, setExpanded] = useState<string | null>("weed-feed-apply");

  const completed = Object.values(taskStates).filter(s => s === "completed").length;
  const progress = (completed / tasks.length) * 100;

  const cycleStatus = (id: string) => {
    const states = ["pending", "in-progress", "completed"];
    const current = taskStates[id];
    const next = states[(states.indexOf(current) + 1) % states.length];
    setTaskStates(prev => ({ ...prev, [id]: next }));
    const task = tasks.find(t => t.id === id);
    if (next === "completed") {
      toast.success(`✅ Task complete: ${task?.name}`, { description: persona.catchphrase });
      onTaskComplete?.(id);
    } else if (next === "in-progress") {
      toast.info(`▶️ Started: ${task?.name}`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Navigation size={16} className="text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">Today's Mission</h3>
        </div>
        <span className="text-[10px] text-white/50 font-mono">
          {completed}/{tasks.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="glass rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/60">Mission Progress</span>
          <span className="text-xs font-bold text-yellow-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, oklch(0.55 0.15 145), oklch(0.82 0.18 85))' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="text-[10px] text-white/40 mt-1.5 italic">
          💬 "{persona.catchphrase}"
        </p>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {tasks.map((task, i) => {
          const status = taskStates[task.id];
          const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
          const isExpanded = expanded === task.id;

          return (
            <motion.div
              key={task.id}
              className={`${config.bg} rounded-xl overflow-hidden`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div 
                className="flex items-center gap-2 p-3 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : task.id)}
              >
                <div className={config.color}>{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-white/40">{task.time}</span>
                    <span className={`text-[9px] font-bold uppercase ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-white truncate">{task.name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-white/40">{task.duration}</span>
                  {isExpanded ? <ChevronDown size={12} className="text-white/40" /> : <ChevronRight size={12} className="text-white/40" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2 border-t border-white/10 pt-2">
                      <p className="text-xs text-white/70 leading-relaxed">{task.description}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {task.tools.map(tool => (
                          <span key={tool} className="text-[9px] glass px-1.5 py-0.5 rounded-full text-cyan-300 border border-cyan-400/20">
                            {tool}
                          </span>
                        ))}
                      </div>

                      <div className="glass rounded-lg p-2">
                        <p className="text-[10px] text-yellow-300 italic">💬 "{task.chipNote}"</p>
                      </div>

                      {/* Zone spray coverage bar */}
                      {ZONE_SPRAY_TASKS[task.id] && status === "in-progress" && (() => {
                        const zone = ZONE_SPRAY_TASKS[task.id];
                        const localPct = Math.max(0, Math.min(1,
                          (robotProgress - zone.start) / (zone.end - zone.start)
                        ));
                        const pct = Math.round(localPct * 100);
                        return (
                          <div className="glass rounded-lg p-2 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-cyan-300 font-semibold">📡 {zone.label} Coverage</span>
                              <span className="text-[9px] font-mono text-cyan-400">{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: pct >= 80 ? 'oklch(0.72 0.19 145)' : pct >= 40 ? 'oklch(0.78 0.18 185)' : 'oklch(0.65 0.22 220)' }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <p className="text-[8px] text-white/30">
                              {pct < 30 ? '🚜 Chip is heading in...' : pct < 70 ? '⚡ Coverage in progress' : pct < 100 ? '✅ Almost done!' : '🎉 Zone complete!'}
                            </p>
                          </div>
                        );
                      })()}

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); cycleStatus(task.id); }}
                          className={`flex-1 rounded-lg py-1.5 text-[10px] font-semibold transition-all ${
                            status === "completed" 
                              ? "glass text-white/50 hover:text-white/80"
                              : status === "in-progress"
                              ? "glass-green text-green-300 border border-green-400/30"
                              : "glass-gold text-yellow-300 border border-yellow-400/30"
                          }`}
                        >
                          {status === "completed" ? "↩ Reset" : status === "in-progress" ? "✅ Complete" : "▶ Start"}
                        </button>
                        <div className="glass rounded-lg px-2 flex items-center">
                          <span className="text-[9px] text-white/40">{task.zone}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
