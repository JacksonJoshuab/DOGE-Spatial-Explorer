/*
 * DOGE-LANDSCAPER — Avatar Panel with Layered SVG + Mirror Reflection
 * Design: Spatial Glass Command Deck
 * Each clothing layer updates in real-time; mirror reflection is a live flipped SVG
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Edit3, RefreshCw, User, Palette } from "lucide-react";
import type { RobotPersona } from "@/lib/data";
import { ROBOT_PERSONA_DEFAULT } from "@/lib/data";
import { RobotAvatarSVG } from "@/components/RobotAvatarSVG";

interface AvatarPanelProps {
  persona: RobotPersona;
  onUpdate: (p: RobotPersona) => void;
  showEditor: boolean;
  onToggleEditor: () => void;
}

const HAT_OPTIONS = ["John Deere Green Cap", "Iowa Hawkeyes Cap", "Cowboy Hat", "Safety Helmet", "Beanie", "No Hat"];
const OUTFIT_OPTIONS = ["Denim Overalls", "Carhartt Work Pants", "Khaki Cargo Pants", "Safety Vest + Jeans", "Full Coveralls"];
const SHIRT_OPTIONS = ["Plaid Flannel", "Iowa State Cyclones Tee", "Plain White Tee", "Henley", "Long Sleeve UV Shirt"];
const BOOTS_OPTIONS = ["Steel-Toe Work Boots", "Rubber Rain Boots", "Leather Work Boots", "Composite Toe Boots"];
const MOOD_OPTIONS = ["😄 Ready to Rumble", "😤 Weed Destroyer Mode", "😎 Chill Maintenance", "🤔 Analyzing...", "😴 Low Power Mode", "🏆 Victory Lap"];
const ACCESSORY_OPTIONS = ["Scotts Turf Builder Bag", "Fertilizer Sprayer", "iPad Pro", "AirPods Max", "Garden Hose", "None"];

const HAT_COLORS = [
  { label: "JD Green", value: "#2d5a1b" },
  { label: "Hawkeye Gold", value: "#f5c518" },
  { label: "Straw", value: "#c8a84b" },
  { label: "Safety Yellow", value: "#f5a623" },
  { label: "Navy", value: "#1a2a4a" },
  { label: "Red", value: "#8b1a1a" },
];

const OUTFIT_COLORS = [
  { label: "Denim Blue", value: "#4a6fa5" },
  { label: "Carhartt Brown", value: "#6b4c2a" },
  { label: "Khaki", value: "#b5a47a" },
  { label: "Safety Orange", value: "#d4621a" },
  { label: "Forest Green", value: "#2d5a1b" },
  { label: "Charcoal", value: "#3a3a3a" },
];

const SHIRT_COLORS = [
  { label: "Plaid Red", value: "#8b4513" },
  { label: "Iowa Gold", value: "#f5c518" },
  { label: "White", value: "#e8e8e8" },
  { label: "Slate Blue", value: "#4a6fa5" },
  { label: "Forest", value: "#2d5a1b" },
  { label: "Black", value: "#1a1a1a" },
];

const EYE_COLORS = [
  { label: "Jetson Blue", value: "#00bfff" },
  { label: "Nvidia Green", value: "#76b900" },
  { label: "Alert Red", value: "#ff4444" },
  { label: "Gold", value: "#f5c518" },
  { label: "White", value: "#ffffff" },
  { label: "Purple", value: "#8b44ff" },
];

function ColorPicker({ colors, value, onChange }: { colors: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map(c => (
        <button
          key={c.value}
          onClick={() => onChange(c.value)}
          title={c.label}
          className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${value === c.value ? "border-white scale-110" : "border-white/20"}`}
          style={{ backgroundColor: c.value }}
        />
      ))}
    </div>
  );
}

export default function AvatarPanel({ persona, onUpdate, showEditor, onToggleEditor }: AvatarPanelProps) {
  const [draft, setDraft] = useState<RobotPersona>({ ...persona });
  const [saved, setSaved] = useState(false);

  const update = (key: keyof RobotPersona, value: string) => {
    setDraft(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const save = () => {
    onUpdate(draft);
    setSaved(true);
    toast.success(`🤖 ${draft.name} persona updated!`, { description: draft.catchphrase });
  };

  const reset = () => {
    setDraft({ ...ROBOT_PERSONA_DEFAULT });
    onUpdate(ROBOT_PERSONA_DEFAULT);
    toast.info("🔄 Persona reset to defaults");
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <User size={16} className="text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">Robot Persona</h3>
        </div>
        <div className="flex gap-1.5">
          <motion.button
            onClick={onToggleEditor}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${
              showEditor ? "glass-gold text-yellow-300 border border-yellow-400/30" : "glass text-white/60 hover:text-white/80"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Edit3 size={11} />
            {showEditor ? "Close" : "Edit"}
          </motion.button>
          <motion.button
            onClick={reset}
            className="glass rounded-lg p-1.5 text-white/40 hover:text-white/80 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Reset to defaults"
          >
            <RefreshCw size={11} />
          </motion.button>
        </div>
      </div>

      {/* === LIVE SVG AVATAR + MIRROR REFLECTION === */}
      <div className="relative rounded-2xl overflow-hidden" style={{ height: 280 }}>
        {/* Background gradient */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, oklch(0.12 0.025 260) 0%, oklch(0.07 0.01 260) 60%, oklch(0.04 0.005 260) 100%)',
        }} />

        {/* Floor reflection plane */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />

        {/* HUD corners */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-tr" />
          <div className="hud-corner hud-corner-bl" />
          <div className="hud-corner hud-corner-br" />
        </div>

        {/* Main avatar — centered, upper 70% */}
        <div className="absolute top-0 left-0 right-0 flex justify-center" style={{ height: "70%" }}>
          <motion.div
            key={`${draft.hat}-${draft.outfit}-${draft.shirt}-${draft.boots}-${draft.accessory}-${draft.hatColor}-${draft.outfitColor}-${draft.shirtColor}-${draft.eyeColor}`}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex items-end justify-center h-full"
          >
            <RobotAvatarSVG persona={draft} size={100} animated={true} />
          </motion.div>
        </div>

        {/* Mirror reflection — bottom 40%, flipped, faded */}
        <div
          className="absolute bottom-0 left-0 right-0 flex justify-center overflow-hidden"
          style={{ height: "38%" }}
        >
          {/* Gradient mask over reflection */}
          <div className="absolute inset-0 z-10" style={{
            background: 'linear-gradient(to bottom, transparent 0%, oklch(0.07 0.01 260 / 0.6) 60%, oklch(0.04 0.005 260) 100%)',
          }} />
          <motion.div
            key={`mirror-${draft.hat}-${draft.outfit}-${draft.shirt}-${draft.hatColor}-${draft.outfitColor}-${draft.eyeColor}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex items-start justify-center"
            style={{ marginTop: -10 }}
          >
            <RobotAvatarSVG persona={draft} size={100} mirrored={true} animated={false} />
          </motion.div>
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-3">
          <p className="text-sm font-bold text-white">{draft.name}</p>
          <p className="text-[10px] text-yellow-300">{draft.nickname}</p>
          <p className="text-[10px] text-white/50">{draft.mood}</p>
        </div>

        {/* Live indicator */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 glass rounded-full px-2 py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[8px] text-green-400 font-mono">LIVE SVG</span>
        </div>
      </div>

      {/* Bio card */}
      <div className="glass rounded-xl p-3">
        <p className="text-[11px] text-white/70 leading-relaxed italic">"{draft.bio}"</p>
        <p className="text-[10px] text-yellow-300 mt-2 font-medium">💬 "{draft.catchphrase}"</p>
      </div>

      {/* === EDITOR === */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 pt-4 space-y-4">
              <p className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <Palette size={10} />
                Customize Persona — Mirror Updates Live
              </p>
              
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-white/50">Name</label>
                <input
                  value={draft.name}
                  onChange={e => update("name", e.target.value)}
                  className="w-full glass rounded-lg px-3 py-2 text-xs text-white bg-transparent border-0 outline-none focus:ring-1 focus:ring-yellow-400/50 placeholder:text-white/20"
                  placeholder="Robot name..."
                />
              </div>

              {/* Nickname */}
              <div className="space-y-1">
                <label className="text-[10px] text-white/50">Nickname</label>
                <input
                  value={draft.nickname}
                  onChange={e => update("nickname", e.target.value)}
                  className="w-full glass rounded-lg px-3 py-2 text-xs text-white bg-transparent border-0 outline-none focus:ring-1 focus:ring-yellow-400/50"
                />
              </div>

              {/* Catchphrase */}
              <div className="space-y-1">
                <label className="text-[10px] text-white/50">Catchphrase</label>
                <input
                  value={draft.catchphrase}
                  onChange={e => update("catchphrase", e.target.value)}
                  className="w-full glass rounded-lg px-3 py-2 text-xs text-white bg-transparent border-0 outline-none focus:ring-1 focus:ring-yellow-400/50"
                />
              </div>

              {/* Hat style */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50">Hat Style</label>
                <div className="grid grid-cols-2 gap-1">
                  {HAT_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => update("hat", opt)}
                      className={`text-[10px] py-1.5 px-2 rounded-lg text-left transition-all ${draft.hat === opt ? "glass-gold text-yellow-300 border border-yellow-400/30" : "glass text-white/60 hover:text-white/90"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                <label className="text-[10px] text-white/50">Hat Color</label>
                <ColorPicker colors={HAT_COLORS} value={draft.hatColor} onChange={v => update("hatColor", v)} />
              </div>

              {/* Shirt */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50">Shirt</label>
                <div className="grid grid-cols-1 gap-1">
                  {SHIRT_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => update("shirt", opt)}
                      className={`text-[10px] py-1.5 px-2 rounded-lg text-left transition-all ${draft.shirt === opt ? "glass-gold text-yellow-300 border border-yellow-400/30" : "glass text-white/60 hover:text-white/90"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                <label className="text-[10px] text-white/50">Shirt Color</label>
                <ColorPicker colors={SHIRT_COLORS} value={draft.shirtColor} onChange={v => update("shirtColor", v)} />
              </div>

              {/* Outfit */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50">Outfit / Pants</label>
                <div className="grid grid-cols-1 gap-1">
                  {OUTFIT_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => update("outfit", opt)}
                      className={`text-[10px] py-1.5 px-2 rounded-lg text-left transition-all ${draft.outfit === opt ? "glass-gold text-yellow-300 border border-yellow-400/30" : "glass text-white/60 hover:text-white/90"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                <label className="text-[10px] text-white/50">Outfit Color</label>
                <ColorPicker colors={OUTFIT_COLORS} value={draft.outfitColor} onChange={v => update("outfitColor", v)} />
              </div>

              {/* Boots */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50">Boots</label>
                <div className="grid grid-cols-2 gap-1">
                  {BOOTS_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => update("boots", opt)}
                      className={`text-[10px] py-1.5 px-2 rounded-lg text-left transition-all ${draft.boots === opt ? "glass-gold text-yellow-300 border border-yellow-400/30" : "glass text-white/60 hover:text-white/90"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eye Color */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50">Eye / Visor Color</label>
                <ColorPicker colors={EYE_COLORS} value={draft.eyeColor} onChange={v => update("eyeColor", v)} />
              </div>

              {/* Mood */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50">Current Mood</label>
                <div className="grid grid-cols-2 gap-1">
                  {MOOD_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => update("mood", opt)}
                      className={`text-[10px] py-1.5 px-2 rounded-lg text-left transition-all ${draft.mood === opt ? "glass-gold text-yellow-300 border border-yellow-400/30" : "glass text-white/60 hover:text-white/90"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accessory */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50">Accessory</label>
                <div className="grid grid-cols-2 gap-1">
                  {ACCESSORY_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => update("accessory", opt)}
                      className={`text-[10px] py-1.5 px-2 rounded-lg text-left transition-all ${draft.accessory === opt ? "glass-gold text-yellow-300 border border-yellow-400/30" : "glass text-white/60 hover:text-white/90"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={save}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  saved ? "glass-green text-green-300 border border-green-400/30" : "glass-gold text-yellow-300 border border-yellow-400/30"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {saved ? "✅ Saved! Mirror Updated." : "💾 Save Persona — Apply to Robot"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
