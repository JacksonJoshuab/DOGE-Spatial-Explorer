/**
 * DOGE-LANDSCAPER — Zone Treatment History Panel
 * Persistent localStorage-backed treatment log with color-coded zone status
 * Design: Spatial Glass Command Deck
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { History, Droplets, Calendar, Wind, Thermometer, Trash2, ChevronDown, ChevronUp, Plus, AlertTriangle, CheckCircle, Clock, Leaf } from "lucide-react";
import { useZoneTreatmentLog, ZONE_META } from "@/hooks/useZoneTreatmentLog";

interface ZoneTreatmentHistoryPanelProps {
  windSpeed?: number;
  temperature?: number;
  humidity?: number;
  weatherCondition?: string;
}

const STATUS_CONFIG = {
  fresh:    { label: "Fresh",    color: "text-green-400",  bg: "bg-green-500/15",  border: "border-green-400/30",  icon: CheckCircle,    dot: "bg-green-400" },
  good:     { label: "Good",     color: "text-cyan-400",   bg: "bg-cyan-500/15",   border: "border-cyan-400/30",   icon: CheckCircle,    dot: "bg-cyan-400" },
  due:      { label: "Due Soon", color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-400/30", icon: Clock,          dot: "bg-yellow-400" },
  overdue:  { label: "Overdue",  color: "text-red-400",    bg: "bg-red-500/15",    border: "border-red-400/30",    icon: AlertTriangle,  dot: "bg-red-400 animate-pulse" },
  untreated:{ label: "Untreated",color: "text-white/30",   bg: "bg-white/5",       border: "border-white/10",      icon: Leaf,           dot: "bg-white/20" },
};

const PRODUCTS = [
  "Scotts Turf Builder Weed & Feed",
  "Scotts EZ Seed Patch & Repair",
  "Preen Garden Weed Preventer",
  "Scotts DiseaseEx Lawn Fungicide",
  "Scotts Lawn Soil",
  "Roundup Weed Killer (spot treat)",
  "Milorganite Organic Fertilizer",
  "Custom / Other",
];

export default function ZoneTreatmentHistoryPanel({
  windSpeed = 0,
  temperature = 58,
  humidity = 68,
  weatherCondition = "Partly Cloudy",
}: ZoneTreatmentHistoryPanelProps) {
  const { entries, addEntry, removeEntry, clearAll, getLastTreatment, getZoneStatus } = useZoneTreatmentLog();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterZone, setFilterZone] = useState<string>("all");

  // Add form state
  const [newZone, setNewZone] = useState("A");
  const [newProduct, setNewProduct] = useState(PRODUCTS[0]);
  const [newNotes, setNewNotes] = useState("");

  const handleAdd = () => {
    if (!newProduct) { toast.error("Select a product"); return; }
    const meta = ZONE_META[newZone];
    addEntry({
      zoneId: newZone,
      zoneName: meta.name,
      product: newProduct,
      appliedAt: new Date().toISOString(),
      temperature,
      humidity,
      windSpeed,
      weatherCondition,
      applicator: "Chip McHaymaker",
      notes: newNotes || `Applied ${newProduct} to ${meta.name}. Conditions: ${temperature}°F, ${humidity}% humidity, ${windSpeed.toFixed(0)} mph wind.`,
    });
    toast.success(`✅ Logged treatment for Zone ${newZone} — ${meta.name}`, {
      description: newProduct,
      duration: 4000,
    });
    setShowAddForm(false);
    setNewNotes("");
  };

  const filtered = filterZone === "all" ? entries : entries.filter(e => e.zoneId === filterZone);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-700/40 border border-emerald-500/30 flex items-center justify-center">
            <History size={14} className="text-emerald-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Treatment History</h3>
            <p className="text-[10px] text-white/40">{entries.length} log entries · localStorage</p>
          </div>
        </div>
        <motion.button
          onClick={() => setShowAddForm(v => !v)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-semibold hover:bg-emerald-500/30 transition-all"
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={10} />Log Treatment
        </motion.button>
      </div>

      {/* Zone status grid */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(ZONE_META).map(([zoneId, meta]) => {
          const status = getZoneStatus(zoneId);
          const last = getLastTreatment(zoneId);
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <div
              key={zoneId}
              className={`glass rounded-xl p-2.5 border ${cfg.border} cursor-pointer hover:bg-white/5 transition-all`}
              onClick={() => setFilterZone(filterZone === zoneId ? "all" : zoneId)}
              style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-white">Zone {zoneId}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              </div>
              <p className="text-[9px] text-white/50 mb-1">{meta.name}</p>
              <div className="flex items-center gap-1">
                <Icon size={9} className={cfg.color} />
                <span className={`text-[9px] font-semibold ${cfg.color}`}>{cfg.label}</span>
              </div>
              {last && (
                <p className="text-[8px] text-white/25 mt-1 font-mono">{last.daysAgo}d ago</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add treatment form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl p-3 border border-emerald-400/20 space-y-2.5"
          >
            <p className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Plus size={10} />Log New Treatment
            </p>

            {/* Zone selector */}
            <div>
              <p className="text-[9px] text-white/40 mb-1">Zone</p>
              <div className="grid grid-cols-4 gap-1">
                {Object.entries(ZONE_META).map(([zoneId, meta]) => (
                  <button
                    key={zoneId}
                    onClick={() => setNewZone(zoneId)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                      newZone === zoneId
                        ? "border-white/40 text-white"
                        : "border-white/10 text-white/40 hover:border-white/20"
                    }`}
                    style={newZone === zoneId ? { backgroundColor: meta.color + "30", borderColor: meta.color + "60" } : {}}
                  >
                    {zoneId}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-white/30 mt-1">{ZONE_META[newZone].name} · {ZONE_META[newZone].area}</p>
            </div>

            {/* Product selector */}
            <div>
              <p className="text-[9px] text-white/40 mb-1">Product Applied</p>
              <select
                value={newProduct}
                onChange={e => setNewProduct(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-[10px] text-white/80 focus:outline-none focus:border-emerald-400/40"
              >
                {PRODUCTS.map(p => <option key={p} value={p} className="bg-gray-900">{p}</option>)}
              </select>
            </div>

            {/* Current conditions preview */}
            <div className="grid grid-cols-3 gap-1">
              {[
                { icon: Thermometer, label: `${temperature}°F`, color: "text-orange-400" },
                { icon: Droplets, label: `${humidity}%`, color: "text-blue-400" },
                { icon: Wind, label: `${windSpeed.toFixed(0)} mph`, color: windSpeed > 10 ? "text-red-400" : "text-green-400" },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-1 bg-white/3 rounded-lg px-2 py-1">
                  <Icon size={9} className={color} />
                  <span className={`text-[9px] font-mono ${color}`}>{label}</span>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <p className="text-[9px] text-white/40 mb-1">Notes (optional)</p>
              <textarea
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Any observations, issues, or special instructions..."
                rows={2}
                className="w-full bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-[10px] text-white/80 placeholder-white/20 focus:outline-none focus:border-emerald-400/40 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <motion.button
                onClick={handleAdd}
                className="flex-1 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-semibold hover:bg-emerald-500/30 transition-all"
                whileTap={{ scale: 0.97 }}
              >
                ✅ Log Treatment
              </motion.button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 rounded-xl glass text-white/40 text-[10px] hover:text-white/60 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterZone("all")}
          className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-semibold transition-all ${
            filterZone === "all" ? "bg-white/15 text-white" : "text-white/30 hover:text-white/60"
          }`}
        >
          All ({entries.length})
        </button>
        {Object.entries(ZONE_META).map(([zoneId, meta]) => {
          const count = entries.filter(e => e.zoneId === zoneId).length;
          return (
            <button
              key={zoneId}
              onClick={() => setFilterZone(filterZone === zoneId ? "all" : zoneId)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-semibold transition-all border ${
                filterZone === zoneId
                  ? "text-white border-white/30"
                  : "text-white/30 border-transparent hover:text-white/60"
              }`}
              style={filterZone === zoneId ? { backgroundColor: meta.color + "20", borderColor: meta.color + "40" } : {}}
            >
              Zone {zoneId} ({count})
            </button>
          );
        })}
      </div>

      {/* Log entries */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-6 text-center"
            >
              <Leaf size={24} className="text-white/20 mx-auto mb-2" />
              <p className="text-[11px] text-white/30">No treatments logged yet</p>
              <p className="text-[9px] text-white/20 mt-1">Tap "Log Treatment" to add the first entry</p>
            </motion.div>
          ) : (
            filtered.map(entry => {
              const meta = ZONE_META[entry.zoneId] ?? { color: "#fff", name: entry.zoneName };
              const isExpanded = expandedId === entry.id;
              const daysAgo = entry.daysAgo ?? 0;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass rounded-xl overflow-hidden border border-white/8"
                  style={{ borderLeftColor: meta.color + "80", borderLeftWidth: 3 }}
                >
                  <div
                    className="flex items-center gap-2.5 p-2.5 cursor-pointer hover:bg-white/5 transition-all"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
                      style={{ backgroundColor: meta.color + "30" }}
                    >
                      {entry.zoneId}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-white truncate">{entry.product}</p>
                      <p className="text-[9px] text-white/40">{entry.zoneName} · {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 text-[8px] text-white/30 font-mono">
                        <Thermometer size={8} className="text-orange-400/60" />
                        {entry.temperature}°
                        <Wind size={8} className="text-blue-400/60 ml-1" />
                        {entry.windSpeed.toFixed(0)}
                      </div>
                      {isExpanded ? <ChevronUp size={10} className="text-white/30" /> : <ChevronDown size={10} className="text-white/30" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/8"
                      >
                        <div className="p-2.5 space-y-2">
                          {/* Conditions row */}
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { icon: Thermometer, label: "Temp", value: `${entry.temperature}°F`, color: "text-orange-400" },
                              { icon: Droplets, label: "Humidity", value: `${entry.humidity}%`, color: "text-blue-400" },
                              { icon: Wind, label: "Wind", value: `${entry.windSpeed.toFixed(0)} mph`, color: entry.windSpeed > 10 ? "text-red-400" : "text-green-400" },
                            ].map(({ icon: Icon, label, value, color }) => (
                              <div key={label} className="bg-white/3 rounded-lg px-2 py-1.5 text-center">
                                <Icon size={9} className={`${color} mx-auto mb-0.5`} />
                                <p className={`text-[9px] font-mono font-bold ${color}`}>{value}</p>
                                <p className="text-[8px] text-white/25">{label}</p>
                              </div>
                            ))}
                          </div>

                          {/* Date and applicator */}
                          <div className="flex items-center gap-2 text-[9px] text-white/40">
                            <Calendar size={9} />
                            <span>{new Date(entry.appliedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                            <span className="text-white/20">·</span>
                            <span>{entry.applicator}</span>
                          </div>

                          {/* Notes */}
                          {entry.notes && (
                            <div className="bg-white/3 rounded-lg px-2.5 py-2">
                              <p className="text-[9px] text-white/50 italic leading-relaxed">"{entry.notes}"</p>
                            </div>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => {
                              removeEntry(entry.id);
                              toast.info("Entry removed from log");
                              setExpandedId(null);
                            }}
                            className="flex items-center gap-1 text-[9px] text-red-400/50 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={9} />Remove entry
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Clear all */}
      {entries.length > 0 && (
        <button
          onClick={() => {
            if (confirm("Clear all treatment history? This cannot be undone.")) {
              clearAll();
              toast.warning("Treatment history cleared");
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] text-red-400/40 hover:text-red-400/70 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
        >
          <Trash2 size={9} />Clear All History
        </button>
      )}

      {/* Chip's reminder */}
      <div className="glass rounded-xl p-3 border border-yellow-400/15">
        <p className="text-[10px] text-yellow-300/70 italic leading-relaxed">
          💬 "Scotts Weed & Feed needs 24 hours after application before rain. Check them spray windows, partner — Chip don't waste product!"
        </p>
      </div>
    </div>
  );
}
