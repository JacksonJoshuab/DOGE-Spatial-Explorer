/* TrainingSimulator — Interactive groundskeeper decision training */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { BookOpen, CheckCircle, XCircle, Trophy, RotateCcw, ChevronRight, Star } from "lucide-react";
import type { RobotPersona } from "@/lib/data";

interface Scenario {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  image: string;
  options: { text: string; correct: boolean; feedback: string }[];
  chipTip: string;
}

interface TrainingSimulatorProps {
  scenarios: Scenario[];
  persona: RobotPersona;
}

const DIFFICULTY_COLORS = {
  Easy: "text-green-400",
  Medium: "text-yellow-400",
  Hard: "text-red-400",
};

export default function TrainingSimulator({ scenarios, persona }: TrainingSimulatorProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [showTip, setShowTip] = useState(false);

  const scenario = scenarios[currentIdx];
  const isAnswered = selected !== null;
  const isCorrect = selected !== null && scenario.options[selected]?.correct;

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelected(idx);
    const correct = scenario.options[idx].correct;
    if (correct) {
      setScore(s => s + 1);
      toast.success("🌱 Correct! " + persona.name + " approves!", { duration: 3000 });
    } else {
      toast.error("❌ Not quite — read Chip's tip!", { duration: 3000 });
    }
    setCompleted(prev => { const next = new Set(Array.from(prev)); next.add(scenario.id); return next; });
    setShowTip(true);
  };

  const nextScenario = () => {
    setCurrentIdx(i => (i + 1) % scenarios.length);
    setSelected(null);
    setShowTip(false);
  };

  const reset = () => {
    setCurrentIdx(0);
    setSelected(null);
    setScore(0);
    setCompleted(new Set());
    setShowTip(false);
    toast.info("🔄 Training reset — back to basics!");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">Training Simulator</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 glass rounded-lg px-2 py-1">
            <Trophy size={11} className="text-yellow-400" />
            <span className="text-[10px] text-yellow-400 font-bold">{score}/{scenarios.length}</span>
          </div>
          <button onClick={reset} className="glass rounded-lg p-1.5 text-white/40 hover:text-white/80 transition-all">
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      {/* Scenario selector */}
      <div className="flex gap-1.5">
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setCurrentIdx(i); setSelected(null); setShowTip(false); }}
            className={`flex-1 rounded-lg py-1.5 text-[10px] font-medium transition-all relative ${
              i === currentIdx 
                ? "glass-gold text-yellow-300 border border-yellow-400/30" 
                : "glass text-white/50 hover:text-white/80"
            }`}
          >
            {completed.has(s.id) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
                <span className="text-[7px] text-black font-bold">✓</span>
              </span>
            )}
            {i + 1}
          </button>
        ))}
      </div>

      {/* Scenario card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scenario.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          {/* Header */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="relative h-28">
              <img src={scenario.image} alt={scenario.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold ${DIFFICULTY_COLORS[scenario.difficulty as keyof typeof DIFFICULTY_COLORS]}`}>
                    {scenario.difficulty}
                  </span>
                  <span className="text-[10px] text-white/40">·</span>
                  <span className="text-[10px] text-white/50">Scenario {currentIdx + 1} of {scenarios.length}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{scenario.title}</h4>
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-white/80 leading-relaxed">{scenario.description}</p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {scenario.options.map((option, idx) => {
              let optionStyle = "glass text-white/80 hover:bg-white/10";
              if (isAnswered) {
                if (option.correct) optionStyle = "glass-green text-green-300 border border-green-400/40";
                else if (idx === selected && !option.correct) optionStyle = "glass-red text-red-300 border border-red-400/40";
                else optionStyle = "glass text-white/30";
              }

              return (
                <motion.button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left rounded-xl p-3 text-xs transition-all ${optionStyle}`}
                  whileHover={!isAnswered ? { scale: 1.01 } : {}}
                  whileTap={!isAnswered ? { scale: 0.99 } : {}}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isAnswered && option.correct ? "border-green-400 bg-green-400/20" :
                      isAnswered && idx === selected && !option.correct ? "border-red-400 bg-red-400/20" :
                      "border-white/20"
                    }`}>
                      {isAnswered && option.correct && <CheckCircle size={10} className="text-green-400" />}
                      {isAnswered && idx === selected && !option.correct && <XCircle size={10} className="text-red-400" />}
                      {(!isAnswered || (isAnswered && !option.correct && idx !== selected)) && (
                        <span className="text-[9px] text-white/40">{String.fromCharCode(65 + idx)}</span>
                      )}
                    </div>
                    <span className="leading-relaxed">{option.text}</span>
                  </div>
                  {isAnswered && idx === selected && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 text-[10px] leading-relaxed border-t border-white/10 pt-2 text-white/70"
                    >
                      {option.feedback}
                    </motion.p>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Chip's tip */}
          <AnimatePresence>
            {showTip && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-gold rounded-xl p-3"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Star size={12} className="text-yellow-400" />
                  <span className="text-[10px] font-bold text-yellow-400">Chip's Expert Tip</span>
                </div>
                <p className="text-[11px] text-yellow-100 leading-relaxed">{scenario.chipTip}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next button */}
          {isAnswered && (
            <motion.button
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={nextScenario}
              className="w-full glass-gold rounded-xl py-2.5 text-sm font-semibold text-yellow-300 border border-yellow-400/30 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Next Scenario <ChevronRight size={14} />
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
