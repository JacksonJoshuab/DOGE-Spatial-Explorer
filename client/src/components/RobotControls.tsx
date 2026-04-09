/* RobotControls — iOS-style robot control pad */
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Play, Pause, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap, Shield, Home, Navigation, Wind, Lock } from "lucide-react";

interface RobotControlsProps {
  robotStatus: "idle" | "working" | "paused" | "error";
  onStatusChange: (s: "idle" | "working" | "paused" | "error") => void;
  currentTask: string;
  isSprayActive?: boolean;
  onSprayToggle?: () => void;
  windSpeed?: number;
  sprayLocked?: boolean;
}

export default function RobotControls({ robotStatus, onStatusChange, currentTask, isSprayActive, onSprayToggle, windSpeed = 0, sprayLocked = false }: RobotControlsProps) {
  const handleMove = (dir: string) => {
    toast.info(`🤖 Moving ${dir}`, { duration: 1500 });
  };

  const handleAction = (action: string) => {
    if (action === "pause") {
      onStatusChange(robotStatus === "paused" ? "working" : "paused");
      toast.info(robotStatus === "paused" ? "▶️ Resumed" : "⏸ Paused");
    } else if (action === "home") {
      toast.success("🏠 Returning to base...");
      onStatusChange("idle");
    } else if (action === "emergency") {
      onStatusChange("error");
      toast.error("🛑 Emergency stop activated!", { duration: 5000 });
    } else if (action === "spray") {
      toast.success("💨 Spray activated — minimum overspray mode");
    }
  };

  return (
    <div className="flex items-end gap-3">
      {/* D-Pad */}
      <div className="glass rounded-2xl p-2">
        <div className="grid grid-cols-3 gap-1" style={{ width: 90 }}>
          <div />
          <motion.button
            onClick={() => handleMove("Forward")}
            className="glass rounded-lg p-2 flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all"
            whileTap={{ scale: 0.9 }}
          >
            <ChevronUp size={14} className="text-white/80" />
          </motion.button>
          <div />
          <motion.button
            onClick={() => handleMove("Left")}
            className="glass rounded-lg p-2 flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all"
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft size={14} className="text-white/80" />
          </motion.button>
          <div className="glass rounded-full flex items-center justify-center" style={{ width: 28, height: 28 }}>
            <div className={`w-2 h-2 rounded-full ${
              robotStatus === "working" ? "bg-green-400 animate-status-pulse" :
              robotStatus === "paused" ? "bg-yellow-400" :
              robotStatus === "error" ? "bg-red-400 animate-status-pulse" :
              "bg-white/30"
            }`} />
          </div>
          <motion.button
            onClick={() => handleMove("Right")}
            className="glass rounded-lg p-2 flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all"
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight size={14} className="text-white/80" />
          </motion.button>
          <div />
          <motion.button
            onClick={() => handleMove("Back")}
            className="glass rounded-lg p-2 flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all"
            whileTap={{ scale: 0.9 }}
          >
            <ChevronDown size={14} className="text-white/80" />
          </motion.button>
          <div />
        </div>
      </div>

      {/* Action buttons */}
      <div className="glass rounded-2xl p-2 flex flex-col gap-1.5">
        <motion.button
          onClick={() => handleAction("pause")}
          className={`rounded-xl px-3 py-1.5 text-[10px] font-semibold flex items-center gap-1.5 transition-all ${
            robotStatus === "paused" 
              ? "glass-green text-green-300 border border-green-400/30" 
              : "glass-gold text-yellow-300 border border-yellow-400/30"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {robotStatus === "paused" ? <Play size={11} /> : <Pause size={11} />}
          {robotStatus === "paused" ? "Resume" : "Pause"}
        </motion.button>

        <motion.button
          onClick={() => {
            if (sprayLocked) {
              toast.error(`🌬️ Spray LOCKED — Wind ${windSpeed.toFixed(0)} mph exceeds 10 mph limit`, { duration: 4000 });
              return;
            }
            if (onSprayToggle) onSprayToggle();
            else handleAction("spray");
          }}
          className={`rounded-xl px-3 py-1.5 text-[10px] font-semibold flex items-center gap-1.5 transition-all border ${
            sprayLocked
              ? "bg-red-900/30 border-red-500/40 text-red-400 cursor-not-allowed"
              : isSprayActive
              ? "glass-green text-green-300 border-green-400/30"
              : "glass-green text-green-300 border-green-400/30"
          }`}
          whileHover={{ scale: sprayLocked ? 1 : 1.05 }}
          whileTap={{ scale: sprayLocked ? 1 : 0.95 }}
          title={sprayLocked ? `Wind ${windSpeed.toFixed(0)} mph — spray locked` : "Toggle spray"}
        >
          {sprayLocked ? <Lock size={11} /> : <Zap size={11} />}
          {sprayLocked ? `Locked ${windSpeed.toFixed(0)}mph` : isSprayActive ? "Stop Spray" : "Spray"}
        </motion.button>
        {sprayLocked && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-900/20 border border-red-500/20">
            <Wind size={9} className="text-red-400 animate-pulse" />
            <span className="text-[8px] text-red-400 font-mono">WIND LOCK</span>
          </div>
        )}

        <motion.button
          onClick={() => handleAction("home")}
          className="glass rounded-xl px-3 py-1.5 text-[10px] font-semibold text-white/60 flex items-center gap-1.5 hover:text-white/90 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Home size={11} />
          Home
        </motion.button>

        <motion.button
          onClick={() => handleAction("emergency")}
          className="glass-red rounded-xl px-3 py-1.5 text-[10px] font-bold text-red-300 border border-red-400/30 flex items-center gap-1.5"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Shield size={11} />
          E-STOP
        </motion.button>
      </div>
    </div>
  );
}
