/*
 * DOGE-LANDSCAPER — Live Weather Panel
 * Design: Spatial Glass Command Deck
 * Data: Open-Meteo API (free, no key) — West Liberty, Iowa 52776
 * Spray window analysis based on Iowa groundskeeper best practices
 */

import { motion } from "framer-motion";
import { 
  Wind, Droplets, Thermometer, RefreshCw, WifiOff,
  CheckCircle, XCircle, AlertTriangle, Clock, MapPin, Eye
} from "lucide-react";
import { useWeather, type HourlyWeather } from "@/hooks/useWeather";
import { toast } from "sonner";

const SPRAY_COLORS: Record<HourlyWeather["sprayRisk"], { bg: string; text: string; border: string; label: string }> = {
  optimal:    { bg: "bg-green-500/20",  text: "text-green-300",  border: "border-green-500/40",  label: "Optimal" },
  acceptable: { bg: "bg-yellow-500/15", text: "text-yellow-300", border: "border-yellow-500/30", label: "OK" },
  caution:    { bg: "bg-orange-500/15", text: "text-orange-300", border: "border-orange-500/30", label: "Caution" },
  "no-spray": { bg: "bg-red-500/15",    text: "text-red-300",    border: "border-red-500/30",    label: "No Spray" },
};

function WindDirArrow({ degrees }: { degrees: number }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" style={{ transform: `rotate(${degrees}deg)`, display: "inline-block" }}>
      <path d="M 8 2 L 11 12 L 8 10 L 5 12 Z" fill="currentColor" />
    </svg>
  );
}

export default function WeatherPanel() {
  const { current, hourly, loading, error, lastFetched, refresh } = useWeather();

  const handleRefresh = () => {
    refresh();
    toast.info("🌤️ Refreshing West Liberty, IA weather...", { duration: 2000 });
  };

  // Current spray analysis
  const currentSprayRisk: HourlyWeather["sprayRisk"] =
    current.precipitation > 0.1 ? "no-spray"
    : current.wind > 20 ? "no-spray"
    : current.wind > 15 ? "caution"
    : current.temp < 45 || current.temp > 90 ? "caution"
    : current.wind <= 10 && current.humidity >= 50 ? "optimal"
    : "acceptable";

  const currentColors = SPRAY_COLORS[currentSprayRisk];
  const nextOptimal = hourly.find(h => h.sprayRisk === "optimal" || h.sprayRisk === "acceptable");

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">West Liberty, IA — Live Weather</h3>
          {loading && (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <RefreshCw size={12} className="text-white/40" />
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastFetched && (
            <span className="text-[10px] text-white/30 font-mono">
              {lastFetched.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            className="glass rounded-lg p-1.5 text-white/50 hover:text-white/90 transition-colors"
            title="Refresh weather"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-red rounded-xl p-3 flex items-center gap-2">
          <WifiOff size={14} className="text-red-400" />
          <div>
            <p className="text-xs text-red-300 font-medium">Weather API unavailable</p>
            <p className="text-[10px] text-red-400/70">{error} — showing cached data</p>
          </div>
        </div>
      )}

      {/* Current Conditions */}
      <div className="glass rounded-xl p-4 relative overflow-hidden">
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-light text-white">{current.temp}°</span>
              <span className="text-2xl mb-1">{current.icon}</span>
            </div>
            <p className="text-sm text-white/70 mt-1">{current.condition}</p>
            <p className="text-xs text-white/40">Feels like {current.feelsLike}°F</p>
          </div>
          <div className="text-right space-y-1.5">
            <div className="flex items-center justify-end gap-1.5 text-xs text-white/60">
              <Wind size={12} />
              <span className="font-mono">{current.wind} mph</span>
              <span className="text-white/40">{current.windDirLabel}</span>
              <WindDirArrow degrees={current.windDir} />
            </div>
            <div className="flex items-center justify-end gap-1.5 text-xs text-white/60">
              <Droplets size={12} />
              <span className="font-mono">{current.humidity}% RH</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-xs text-white/60">
              <Thermometer size={12} />
              <span className="font-mono">Dew {current.dewPoint}°F</span>
            </div>
            {current.uvIndex > 0 && (
              <div className="flex items-center justify-end gap-1.5 text-xs text-white/60">
                <Eye size={12} />
                <span className="font-mono">UV {current.uvIndex}</span>
              </div>
            )}
          </div>
        </div>

        {/* Current spray status */}
        <div className={`mt-3 rounded-lg p-2.5 flex items-center gap-2 border ${currentColors.bg} ${currentColors.border}`}>
          {currentSprayRisk === "optimal" && <CheckCircle size={14} className={currentColors.text} />}
          {currentSprayRisk === "acceptable" && <CheckCircle size={14} className={currentColors.text} />}
          {currentSprayRisk === "caution" && <AlertTriangle size={14} className={currentColors.text} />}
          {currentSprayRisk === "no-spray" && <XCircle size={14} className={currentColors.text} />}
          <div>
            <p className={`text-xs font-semibold ${currentColors.text}`}>
              Now: {currentColors.label} for Spray Application
            </p>
            <p className="text-[10px] text-white/50">
              {current.wind} mph {current.windDirLabel} · {current.humidity}% RH · {current.temp}°F
            </p>
          </div>
        </div>
      </div>

      {/* Next spray window */}
      {nextOptimal && (
        <div className="glass-green rounded-xl p-3 flex items-center gap-3">
          <Clock size={16} className="text-green-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-green-300">Next Spray Window</p>
            <p className="text-[11px] text-green-400/80">
              {nextOptimal.time} — {nextOptimal.sprayReason}
            </p>
          </div>
        </div>
      )}

      {/* Hourly Forecast */}
      <div>
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Clock size={10} />
          Hourly Forecast — Spray Windows
        </p>
        <div className="space-y-1.5">
          {(hourly.length > 0 ? hourly : []).slice(0, 12).map((h, i) => {
            const colors = SPRAY_COLORS[h.sprayRisk];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`glass rounded-lg px-3 py-2 flex items-center gap-2 border ${colors.border} transition-all hover:scale-[1.01]`}
              >
                <span className="text-[11px] font-mono text-white/60 w-16 flex-shrink-0">{h.time}</span>
                <span className="text-sm w-5 flex-shrink-0">{h.icon}</span>
                <span className="text-xs font-mono text-white/80 w-10 flex-shrink-0">{h.temp}°F</span>
                <div className="flex items-center gap-1 w-14 flex-shrink-0">
                  <Wind size={9} className="text-white/40" />
                  <span className="text-[10px] font-mono text-white/60">{h.wind}mph</span>
                </div>
                <div className="flex items-center gap-1 w-12 flex-shrink-0">
                  <Droplets size={9} className="text-white/40" />
                  <span className="text-[10px] font-mono text-white/60">{h.humidity}%</span>
                </div>
                {h.precipProb > 0 && (
                  <span className="text-[10px] text-blue-400 font-mono w-10 flex-shrink-0">
                    {h.precipProb}%🌧️
                  </span>
                )}
                <div className="ml-auto flex-shrink-0">
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {colors.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
          {hourly.length === 0 && loading && (
            <div className="glass rounded-xl p-6 text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block mb-2">
                <RefreshCw size={20} className="text-white/30" />
              </motion.div>
              <p className="text-xs text-white/40">Fetching live weather from Open-Meteo...</p>
            </div>
          )}
        </div>
      </div>

      {/* Chip's weather wisdom */}
      <div className="glass-gold rounded-xl p-3">
        <p className="text-[11px] text-yellow-300 italic">
          💬 "
          {current.wind <= 8 && current.humidity >= 50
            ? "Morning dew on the lawn, wind's calm — Chip says it's go time for Weed & Feed!"
            : current.wind > 15
            ? "Wind's kickin' today. Chip's keeping the spreader in the garage. No overspray on his watch."
            : current.temp > 85
            ? "Hot one today. Chip's raising the mow height and skipping fertilizer. He ain't trying to burn the lawn."
            : current.precipitation > 0
            ? "It's raining! Chip's inside watching Hawkeyes highlights and planning tomorrow's mission."
            : "Conditions are acceptable. Chip's got his shield guard ready and his John Deere cap on straight."}
          "
        </p>
        <p className="text-[10px] text-white/30 mt-1">— Chip McHaymaker, West Liberty Iowa Groundskeeper</p>
      </div>

      <p className="text-[9px] text-white/20 text-center">
        Live data via Open-Meteo.com · 905 N Columbus St, West Liberty, IA (41.5769°N, 91.2607°W) · Updates every 15 min
      </p>
    </div>
  );
}
