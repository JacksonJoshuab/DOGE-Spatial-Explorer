/* RecommendationsPanel — AI groundskeeper recommendations */
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Leaf, AlertTriangle, CheckCircle, ChevronRight, Zap, Eye } from "lucide-react";
import type { RobotPersona } from "@/lib/data";

interface Recommendation {
  id: string;
  priority: string;
  category: string;
  title: string;
  description: string;
  action: string;
  confidence: number;
  image: string | null;
}

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  persona: RobotPersona;
}

const PRIORITY_CONFIG = {
  urgent: { color: "text-red-400", bg: "glass-red", border: "border-red-400/30", label: "URGENT", icon: "🚨" },
  high: { color: "text-orange-400", bg: "glass-gold", border: "border-orange-400/30", label: "HIGH", icon: "⚠️" },
  medium: { color: "text-yellow-400", bg: "glass", border: "border-yellow-400/20", label: "MEDIUM", icon: "📋" },
  low: { color: "text-green-400", bg: "glass-green", border: "border-green-400/30", label: "LOW", icon: "💡" },
};

export default function RecommendationsPanel({ recommendations, persona }: RecommendationsPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>("rec-1");

  const active = recommendations.filter(r => !dismissed.has(r.id));

  const dismiss = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setDismissed(prev => { const next = new Set(Array.from(prev)); next.add(id); return next; });
    toast.info("📋 Recommendation noted");
  };

  const schedule = (rec: Recommendation, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    toast.success(`📅 Scheduled: ${rec.action}`, { description: "Added to tomorrow's mission plan" });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Leaf size={16} className="text-green-400" />
          <h3 className="text-sm font-semibold text-white">AI Recommendations</h3>
        </div>
        <div className="flex items-center gap-1 glass rounded-lg px-2 py-1">
          <Zap size={11} className="text-cyan-400" />
          <span className="text-[10px] telemetry text-cyan-400">Nvidia AI</span>
        </div>
      </div>

      {/* AI model info */}
      <div className="glass rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <Eye size={12} className="text-cyan-400" />
          <span className="text-[10px] text-white/60">Vision Analysis — West Liberty, IA Backyard</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="text-center">
            <p className="text-xs font-bold text-cyan-400">94.2%</p>
            <p className="text-[9px] text-white/40">Confidence</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-white">12</p>
            <p className="text-[9px] text-white/40">Objects</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-red-400">23</p>
            <p className="text-[9px] text-white/40">Weeds</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-2">
        {active.length === 0 && (
          <div className="glass-green rounded-xl p-6 text-center">
            <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
            <p className="text-sm text-green-300 font-medium">All clear!</p>
            <p className="text-xs text-white/50 mt-1">No pending recommendations</p>
            <p className="text-[10px] text-yellow-300 mt-2 italic">💬 "{persona.catchphrase}"</p>
          </div>
        )}

        {active.map((rec, i) => {
          const config = PRIORITY_CONFIG[rec.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
          const isExpanded = expanded === rec.id;

          return (
            <motion.div
              key={rec.id}
              className={`${config.bg} rounded-xl overflow-hidden border ${config.border}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div 
                className="flex items-start gap-2 p-3 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : rec.id)}
              >
                <span className="text-sm mt-0.5">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[9px] font-bold ${config.color}`}>{config.label}</span>
                    <span className="text-[9px] text-white/30">·</span>
                    <span className="text-[9px] text-white/50">{rec.category}</span>
                    <span className="text-[9px] text-white/30">·</span>
                    <span className="text-[9px] telemetry text-cyan-400">{rec.confidence}%</span>
                  </div>
                  <p className="text-xs font-semibold text-white">{rec.title}</p>
                </div>
                <ChevronRight size={12} className={`text-white/40 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </div>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-2 border-t border-white/10 pt-2">
                    {rec.image && (
                      <img src={rec.image} alt={rec.title} className="w-full h-24 object-cover rounded-lg" />
                    )}
                    <p className="text-xs text-white/70 leading-relaxed">{rec.description}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => schedule(rec, e)}
                        className="flex-1 glass-gold rounded-lg py-1.5 text-[10px] font-semibold text-yellow-300 border border-yellow-400/30 hover:bg-yellow-400/20 transition-all"
                      >
                        📅 {rec.action}
                      </button>
                      <button
                        onClick={(e) => dismiss(rec.id, e)}
                        className="glass rounded-lg px-3 py-1.5 text-[10px] text-white/40 hover:text-white/80 transition-all"
                      >
                        ✓ Done
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Chip's note */}
      <div className="glass-gold rounded-xl p-3">
        <p className="text-[11px] text-yellow-300 italic">
          💬 "The AI sees what I see, but I've been doing this since before AI was a thing. 
          Well... I AM AI. Never mind."
        </p>
        <p className="text-[10px] text-white/40 mt-1">— {persona.name}</p>
      </div>
    </div>
  );
}
