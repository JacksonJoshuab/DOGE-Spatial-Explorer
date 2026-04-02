/**
 * DOGE-LANDSCAPER — ChipVoicePanel
 * Design: Spatial Glass Command Deck
 * Liquid Glass panel for Chip's Voice narration controls.
 * Features: speak current task, weather, zone status, speed/pitch sliders.
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2, VolumeX, Mic, MicOff, Play, Square,
  Settings2, ChevronDown, ChevronUp, Zap
} from "lucide-react";
import { useState } from "react";
import { useChipVoice } from "@/hooks/useChipVoice";
import type { RobotPersona } from "@/lib/data";

interface ChipVoicePanelProps {
  persona: RobotPersona;
  currentTask?: string;
  currentTaskNote?: string;
  weatherCondition?: string;
  weatherTemp?: number;
  weatherWind?: number;
}

export default function ChipVoicePanel({
  persona,
  currentTask,
  currentTaskNote,
  weatherCondition = "Partly Cloudy",
  weatherTemp = 62,
  weatherWind = 7,
}: ChipVoicePanelProps) {
  const {
    speak, stop, speakTask, speakWeather, speakZone,
    isSpeaking, isSupported, settings, updateSettings,
  } = useChipVoice();
  const [showSettings, setShowSettings] = useState(false);

  if (!isSupported) {
    return (
      <div className="p-4">
        <div className="glass rounded-2xl p-4 text-center">
          <MicOff size={20} className="mx-auto mb-2 text-white/30" />
          <p className="text-xs text-white/40">Voice not supported on this browser</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={isSpeaking ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ repeat: Infinity, duration: 0.6 }}
          >
            {settings.enabled ? (
              <Volume2 size={16} className="text-yellow-400" />
            ) : (
              <VolumeX size={16} className="text-white/30" />
            )}
          </motion.div>
          <h3 className="text-sm font-semibold text-white">Chip's Voice</h3>
          {isSpeaking && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full"
            >
              SPEAKING
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateSettings({ enabled: !settings.enabled })}
            className={`text-xs px-2 py-1 rounded-lg transition-all ${
              settings.enabled
                ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                : "bg-white/5 text-white/30 border border-white/10"
            }`}
          >
            {settings.enabled ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => setShowSettings(s => !s)}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            <Settings2 size={14} />
          </button>
        </div>
      </div>

      {/* Speaking indicator waveform */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl p-3 flex items-center gap-1 justify-center"
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-yellow-400"
                animate={{ height: [4, 8 + Math.random() * 16, 4] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.3 + Math.random() * 0.4,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
              />
            ))}
            <button
              onClick={stop}
              className="ml-3 text-red-400 hover:text-red-300 transition-colors"
            >
              <Square size={12} fill="currentColor" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick speak buttons */}
      <div className="space-y-2">
        {/* Speak current task */}
        <button
          onClick={() => currentTask && speakTask(currentTask, currentTaskNote)}
          disabled={!settings.enabled || !currentTask}
          className="w-full glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <div className="w-8 h-8 rounded-lg bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
            <Zap size={14} className="text-yellow-400" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-semibold text-white">Current Task</p>
            <p className="text-[10px] text-white/50 truncate">
              {currentTask || "No active task"}
            </p>
          </div>
          <Play size={12} className="text-white/30 group-hover:text-yellow-400 transition-colors flex-shrink-0" />
        </button>

        {/* Speak weather */}
        <button
          onClick={() => speakWeather(weatherCondition, weatherTemp, weatherWind)}
          disabled={!settings.enabled}
          className="w-full glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-400/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">🌤️</span>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-semibold text-white">Weather Report</p>
            <p className="text-[10px] text-white/50">
              {weatherCondition} · {Math.round(weatherTemp)}°F · {Math.round(weatherWind)} mph
            </p>
          </div>
          <Play size={12} className="text-white/30 group-hover:text-blue-400 transition-colors flex-shrink-0" />
        </button>

        {/* Speak zone status */}
        <button
          onClick={() => speakZone("Zone A — Main Lawn", "treated", "Scotts Weed and Feed")}
          disabled={!settings.enabled}
          className="w-full glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <div className="w-8 h-8 rounded-lg bg-green-400/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">📍</span>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-semibold text-white">Zone Status</p>
            <p className="text-[10px] text-white/50">Zone A · Treated · Scotts W&F</p>
          </div>
          <Play size={12} className="text-white/30 group-hover:text-green-400 transition-colors flex-shrink-0" />
        </button>

        {/* Custom speak */}
        <button
          onClick={() => speak(persona.catchphrase, false)}
          disabled={!settings.enabled}
          className="w-full glass-gold rounded-xl p-3 flex items-center gap-3 hover:bg-yellow-400/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <div className="w-8 h-8 rounded-lg bg-yellow-400/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">🤠</span>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-semibold text-yellow-300">Chip's Catchphrase</p>
            <p className="text-[10px] text-yellow-400/70 truncate italic">"{persona.catchphrase}"</p>
          </div>
          <Play size={12} className="text-yellow-400/50 group-hover:text-yellow-400 transition-colors flex-shrink-0" />
        </button>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-4 space-y-4 overflow-hidden"
          >
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Voice Settings</p>

            {/* Speed */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/70">Speed (Iowa Drawl)</label>
                <span className="text-xs font-mono text-yellow-400">{settings.rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={settings.rate}
                onChange={e => updateSettings({ rate: parseFloat(e.target.value) })}
                className="w-full h-1.5 rounded-full accent-yellow-400 bg-white/10 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-white/30">
                <span>Slow (0.5x)</span>
                <span>Normal (1.0x)</span>
                <span>Fast (1.5x)</span>
              </div>
            </div>

            {/* Pitch */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/70">Pitch</label>
                <span className="text-xs font-mono text-yellow-400">{settings.pitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.4"
                step="0.05"
                value={settings.pitch}
                onChange={e => updateSettings({ pitch: parseFloat(e.target.value) })}
                className="w-full h-1.5 rounded-full accent-yellow-400 bg-white/10 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-white/30">
                <span>Deep</span>
                <span>Normal</span>
                <span>High</span>
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/70">Volume</label>
                <span className="text-xs font-mono text-yellow-400">{Math.round(settings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.volume}
                onChange={e => updateSettings({ volume: parseFloat(e.target.value) })}
                className="w-full h-1.5 rounded-full accent-yellow-400 bg-white/10 cursor-pointer"
              />
            </div>

            {/* Test button */}
            <button
              onClick={() => speak("Well shoot, this here voice is workin' just fine. Chip McHaymaker, corn belt cultivator, at your service!", false)}
              className="w-full glass rounded-xl py-2 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              🎙️ Test Voice
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
