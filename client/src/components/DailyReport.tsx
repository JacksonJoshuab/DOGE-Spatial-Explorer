/**
 * DOGE-LANDSCAPER — Chip's Daily Report
 * Design: Spatial Glass Command Deck
 * Generates a print-ready PDF via window.print() with a styled report
 * including completed tasks, zones treated, products used, weather, and Chip's quips.
 */

import { useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Printer, Download, Leaf, CheckCircle, CloudRain, Package, MessageSquare, MapPin } from "lucide-react";
import type { RobotPersona } from "@/lib/data";

interface ReportTask {
  id: string;
  name: string;
  time: string;
  zone?: string;
  product?: string;
  duration: string;
  completed: boolean;
  chipNote?: string;
}

interface ReportWeather {
  condition: string;
  tempF: number;
  windMph: number;
  humidity: number;
  sprayWindows: string[];
}

interface DailyReportProps {
  persona: RobotPersona;
  completedTaskIds: string[];
  isSprayActive: boolean;
}

const REPORT_TASKS: ReportTask[] = [
  { id: "task-1", name: "Morning Yard Survey", time: "6:39 AM", zone: "All Zones", product: "None", duration: "15 min", completed: true, chipNote: "Walked the whole property. Dandelion count: 47. Oak tree lookin' healthy. Scilla patch is GORGEOUS this year!" },
  { id: "task-2", name: "Apply Scotts Weed & Feed", time: "8:00 AM", zone: "Zone A & B", product: "Scotts Turf Builder Weed & Feed (12,000 sq ft bag)", duration: "45 min", completed: false, chipNote: "Wind at 8mph — acceptable. Shield guard deployed. Minimum overspray protocol active. Them dandelions don't stand a chance!" },
  { id: "task-3", name: "Mow Main Lawn", time: "10:00 AM", zone: "Zone A", product: "None", duration: "60 min", completed: false, chipNote: "Setting blade height to 3.5 inches. Iowa bluegrass loves a high cut in spring. Don't scalp it!" },
  { id: "task-4", name: "Edge Garden Beds", time: "11:30 AM", zone: "Zone C & D", product: "Roundup Edge Control", duration: "30 min", completed: false, chipNote: "Careful around them Scilla bulbs! Those blue flowers are protected property." },
  { id: "task-5", name: "Mulch Oak Tree Ring", time: "1:00 PM", zone: "Zone B", product: "Cedar Mulch (2 cu ft)", duration: "20 min", completed: false, chipNote: "3-inch layer around the base. Keep it away from the trunk — no volcano mulching on my watch!" },
  { id: "task-6", name: "Evening Inspection & Report", time: "5:00 PM", zone: "All Zones", product: "None", duration: "15 min", completed: false, chipNote: "Final walkthrough. Document any missed spots. Check soil moisture. Call it a day, partner!" },
];

const REPORT_WEATHER: ReportWeather = {
  condition: "Partly Cloudy",
  tempF: 58,
  windMph: 8,
  humidity: 62,
  sprayWindows: ["7:00 AM – 9:30 AM (wind 5-8 mph ✓)", "3:00 PM – 5:00 PM (wind 4-7 mph ✓)"],
};

const ZONE_SUMMARY = [
  { id: "A", name: "Main Lawn", area: "3,200 sq ft", status: "Treated", product: "Scotts Weed & Feed", color: "#00ff88" },
  { id: "B", name: "Oak Tree Ring", area: "800 sq ft", status: "Mulched", product: "Cedar Mulch", color: "#ffaa00" },
  { id: "C", name: "Scilla Garden", area: "420 sq ft", status: "Protected", product: "None — flower zone", color: "#8866ff" },
  { id: "D", name: "Fence Line", area: "1,100 sq ft", status: "Edged", product: "Roundup Edge Control", color: "#4488ff" },
];

export default function DailyReport({ persona, completedTaskIds }: DailyReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const completedCount = REPORT_TASKS.filter(t => completedTaskIds.includes(t.id) || t.completed).length;
  const totalCount = REPORT_TASKS.length;

  const handlePrint = () => {
    const printContent = reportRef.current?.innerHTML;
    if (!printContent) return;
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chip's Daily Report — ${today}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif; background: #fff; color: #1a1a2e; padding: 32px; }
            .report-header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #2d5a27; padding-bottom: 16px; margin-bottom: 24px; }
            .report-logo { width: 56px; height: 56px; background: #1a2e1a; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
            .report-title h1 { font-size: 22px; font-weight: 800; color: #1a2e1a; }
            .report-title p { font-size: 12px; color: #666; margin-top: 2px; }
            .report-badge { margin-left: auto; background: #2d5a27; color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #2d5a27; border-bottom: 1px solid #e0e8df; padding-bottom: 6px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .stat-card { background: #f0f7ee; border-radius: 10px; padding: 12px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: 800; color: #2d5a27; }
            .stat-label { font-size: 10px; color: #666; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }
            .task-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
            .task-check { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #ccc; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; }
            .task-check.done { background: #2d5a27; border-color: #2d5a27; color: white; font-size: 10px; }
            .task-name { font-size: 13px; font-weight: 600; color: #1a1a2e; }
            .task-meta { font-size: 11px; color: #888; margin-top: 2px; }
            .task-note { font-size: 11px; color: #555; font-style: italic; margin-top: 4px; background: #fafaf0; padding: 4px 8px; border-left: 2px solid #c8a800; border-radius: 2px; }
            .zone-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
            .zone-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
            .zone-name { font-size: 13px; font-weight: 600; flex: 1; }
            .zone-status { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: #e8f5e9; color: #2d5a27; font-weight: 600; }
            .zone-product { font-size: 11px; color: #888; margin-left: 8px; }
            .weather-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .weather-card { background: #f0f4ff; border-radius: 10px; padding: 10px; text-align: center; }
            .weather-value { font-size: 18px; font-weight: 700; color: #1a3a8a; }
            .weather-label { font-size: 10px; color: #666; text-transform: uppercase; }
            .spray-window { font-size: 12px; color: #1a3a8a; padding: 6px 10px; background: #e8f0ff; border-radius: 6px; margin-top: 6px; }
            .chip-quote { background: #1a2e1a; color: #c8f0b0; padding: 16px; border-radius: 12px; font-size: 13px; font-style: italic; margin-top: 16px; }
            .chip-quote strong { color: #c8a800; font-style: normal; }
            .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e0e8df; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; }
            @media print {
              body { padding: 16px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>window.onload = () => { window.print(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
          style={{ background: "oklch(0.35 0.12 145)", color: "#c8f0b0" }}
        >
          <Printer size={16} />
          Print / Save PDF
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm glass text-white/70"
        >
          <Download size={16} />
        </motion.button>
      </div>

      {/* Report preview */}
      <div className="glass rounded-2xl overflow-hidden">
        <div ref={reportRef} className="bg-white text-gray-900 p-5 text-sm" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif" }}>

          {/* Header */}
          <div className="report-header" style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: "3px solid #2d5a27", paddingBottom: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, background: "#1a2e1a", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🌱</div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1a2e1a", margin: 0 }}>Chip's Daily Lawn Report</h1>
              <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0" }}>DOGE-Landscaper · 905 Backyard, West Liberty, Iowa 52776 · Zone 5b</p>
              <p style={{ fontSize: 11, color: "#888", margin: "1px 0 0" }}>{today}</p>
            </div>
            <div style={{ marginLeft: "auto", background: "#2d5a27", color: "white", padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              {completedCount}/{totalCount} Tasks
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { value: `${completedCount}/${totalCount}`, label: "Tasks Done" },
              { value: "4", label: "Zones Treated" },
              { value: "2", label: "Products Used" },
              { value: `${REPORT_WEATHER.tempF}°F`, label: "Temp" },
            ].map(s => (
              <div key={s.label} style={{ background: "#f0f7ee", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#2d5a27" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Weather */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1a3a8a", borderBottom: "1px solid #e0e8f0", paddingBottom: 6, marginBottom: 10 }}>
              ☀️ Weather Conditions
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { value: `${REPORT_WEATHER.tempF}°F`, label: "Temperature" },
                { value: `${REPORT_WEATHER.windMph} mph`, label: "Wind Speed" },
                { value: `${REPORT_WEATHER.humidity}%`, label: "Humidity" },
              ].map(w => (
                <div key={w.label} style={{ background: "#f0f4ff", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1a3a8a" }}>{w.value}</div>
                  <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase" }}>{w.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#1a3a8a", marginBottom: 4 }}>Optimal Spray Windows:</div>
              {REPORT_WEATHER.sprayWindows.map((w, i) => (
                <div key={i} style={{ fontSize: 11, color: "#1a3a8a", padding: "5px 10px", background: "#e8f0ff", borderRadius: 6, marginBottom: 4 }}>✓ {w}</div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2d5a27", borderBottom: "1px solid #e0e8df", paddingBottom: 6, marginBottom: 10 }}>
              ✅ Today's Tasks
            </div>
            {REPORT_TASKS.map(task => {
              const done = completedTaskIds.includes(task.id) || task.completed;
              return (
                <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${done ? "#2d5a27" : "#ccc"}`, background: done ? "#2d5a27" : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10 }}>
                    {done ? "✓" : ""}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: done ? "#2d5a27" : "#1a1a2e" }}>{task.name}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{task.time} · {task.duration} · {task.zone}{task.product && task.product !== "None" ? ` · ${task.product}` : ""}</div>
                    {task.chipNote && (
                      <div style={{ fontSize: 11, color: "#555", fontStyle: "italic", marginTop: 4, background: "#fafaf0", padding: "3px 8px", borderLeft: "2px solid #c8a800", borderRadius: 2 }}>
                        💬 "{task.chipNote}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Zone Summary */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2d5a27", borderBottom: "1px solid #e0e8df", paddingBottom: 6, marginBottom: 10 }}>
              🗺️ Zone Treatment Summary
            </div>
            {ZONE_SUMMARY.map(zone => (
              <div key={zone.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: zone.color, flexShrink: 0 }} />
                <div style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>Zone {zone.id} — {zone.name}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{zone.area}</div>
                <div style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#e8f5e9", color: "#2d5a27", fontWeight: 600 }}>{zone.status}</div>
                <div style={{ fontSize: 11, color: "#888", marginLeft: 4 }}>{zone.product}</div>
              </div>
            ))}
          </div>

          {/* Chip's Quote */}
          <div style={{ background: "#1a2e1a", color: "#c8f0b0", padding: 16, borderRadius: 12, fontSize: 13, fontStyle: "italic", marginBottom: 16 }}>
            <strong style={{ color: "#c8a800", fontStyle: "normal" }}>Chip McHaymaker says: </strong>
            "{persona.catchphrase}" — Another day, another dandelion defeated. West Liberty's finest lawn is in good hands, partner!
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#aaa", borderTop: "1px solid #e0e8df", paddingTop: 10, marginTop: 8 }}>
            <span>DOGE-Landscaper v2.7 · Nvidia Jetson Orin AGX · iOS 27 / visionOS 27</span>
            <span>Generated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Preview label */}
      <div className="flex items-center gap-2 px-1">
        <FileText size={12} className="text-white/30" />
        <span className="text-[10px] text-white/30">Tap "Print / Save PDF" to export. On iOS, choose "Save to Files" from the print dialog.</span>
      </div>
    </div>
  );
}

// Compact summary card for embedding in Mission panel
export function DailyReportButton({ persona, completedTaskIds, isSprayActive }: DailyReportProps) {
  return (
    <div className="px-4 pb-4">
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-3 border-b border-white/10 flex items-center gap-2">
          <FileText size={14} className="text-green-400" />
          <span className="text-xs font-semibold text-white/80">Chip's Daily Report</span>
          <span className="ml-auto text-[10px] text-white/40">PDF Export</span>
        </div>
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="glass rounded-xl p-2">
              <div className="text-lg font-bold text-green-400">{completedTaskIds.length}</div>
              <div className="text-[9px] text-white/40">Done</div>
            </div>
            <div className="glass rounded-xl p-2">
              <div className="text-lg font-bold text-blue-400">4</div>
              <div className="text-[9px] text-white/40">Zones</div>
            </div>
            <div className="glass rounded-xl p-2">
              <div className="text-lg font-bold text-yellow-400">2</div>
              <div className="text-[9px] text-white/40">Products</div>
            </div>
          </div>
          <ReportExportButton persona={persona} completedTaskIds={completedTaskIds} isSprayActive={isSprayActive} />
        </div>
      </div>
    </div>
  );
}

function ReportExportButton({ persona, completedTaskIds }: DailyReportProps) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const completedCount = completedTaskIds.length;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chip's Daily Report — ${today}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; background: #fff; color: #1a1a2e; padding: 32px; }
            h1 { font-size: 22px; font-weight: 800; color: #1a2e1a; margin-bottom: 4px; }
            .sub { font-size: 12px; color: #666; margin-bottom: 20px; }
            .stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
            .stat { background: #f0f7ee; border-radius: 10px; padding: 12px; text-align: center; }
            .stat-v { font-size: 24px; font-weight: 800; color: #2d5a27; }
            .stat-l { font-size: 10px; color: #666; text-transform: uppercase; }
            h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #2d5a27; border-bottom: 1px solid #e0e8df; padding-bottom: 6px; margin: 20px 0 10px; }
            .task { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
            .dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #ccc; flex-shrink: 0; margin-top: 2px; }
            .dot.done { background: #2d5a27; border-color: #2d5a27; }
            .task-name { font-size: 13px; font-weight: 600; }
            .task-meta { font-size: 11px; color: #888; margin-top: 2px; }
            .note { font-size: 11px; font-style: italic; color: #555; background: #fafaf0; padding: 3px 8px; border-left: 2px solid #c8a800; margin-top: 4px; }
            .zone-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid #f5f5f5; }
            .zdot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
            .chip-box { background: #1a2e1a; color: #c8f0b0; padding: 16px; border-radius: 12px; font-size: 13px; font-style: italic; margin-top: 20px; }
            .footer { margin-top: 24px; font-size: 10px; color: #aaa; display: flex; justify-content: space-between; border-top: 1px solid #e0e8df; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div style="display:flex;align-items:center;gap:14px;border-bottom:3px solid #2d5a27;padding-bottom:14px;margin-bottom:20px">
            <div style="font-size:32px">🌱</div>
            <div>
              <h1>Chip's Daily Lawn Report</h1>
              <div class="sub">DOGE-Landscaper · 905 Backyard, West Liberty, Iowa 52776 · Zone 5b · ${today}</div>
            </div>
            <div style="margin-left:auto;background:#2d5a27;color:white;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:700">${completedCount}/6 Tasks</div>
          </div>
          <div class="stats">
            <div class="stat"><div class="stat-v">${completedCount}/6</div><div class="stat-l">Tasks Done</div></div>
            <div class="stat"><div class="stat-v">4</div><div class="stat-l">Zones</div></div>
            <div class="stat"><div class="stat-v">2</div><div class="stat-l">Products</div></div>
            <div class="stat"><div class="stat-v">58°F</div><div class="stat-l">Temp</div></div>
          </div>
          <h2>☀️ Weather</h2>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
            <div style="background:#f0f4ff;border-radius:10px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:700;color:#1a3a8a">58°F</div><div style="font-size:10px;color:#666">Temperature</div></div>
            <div style="background:#f0f4ff;border-radius:10px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:700;color:#1a3a8a">8 mph</div><div style="font-size:10px;color:#666">Wind</div></div>
            <div style="background:#f0f4ff;border-radius:10px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:700;color:#1a3a8a">62%</div><div style="font-size:10px;color:#666">Humidity</div></div>
          </div>
          <h2>✅ Tasks</h2>
          ${REPORT_TASKS.map(t => {
            const done = completedTaskIds.includes(t.id) || t.completed;
            return `<div class="task"><div class="dot ${done ? "done" : ""}"></div><div><div class="task-name" style="color:${done ? "#2d5a27" : "#1a1a2e"}">${t.name}</div><div class="task-meta">${t.time} · ${t.duration} · ${t.zone}${t.product && t.product !== "None" ? ` · ${t.product}` : ""}</div>${t.chipNote ? `<div class="note">💬 "${t.chipNote}"</div>` : ""}</div></div>`;
          }).join("")}
          <h2>🗺️ Zone Summary</h2>
          ${ZONE_SUMMARY.map(z => `<div class="zone-row"><div class="zdot" style="background:${z.color}"></div><div style="flex:1;font-weight:600;font-size:13px">Zone ${z.id} — ${z.name}</div><div style="font-size:11px;color:#888">${z.area}</div><div style="font-size:11px;padding:2px 8px;border-radius:10px;background:#e8f5e9;color:#2d5a27;font-weight:600;margin-left:8px">${z.status}</div><div style="font-size:11px;color:#888;margin-left:8px">${z.product}</div></div>`).join("")}
          <div class="chip-box"><strong style="color:#c8a800;font-style:normal">Chip McHaymaker says: </strong>"${persona.catchphrase}" — Another day, another dandelion defeated. West Liberty's finest lawn is in good hands, partner!</div>
          <div class="footer"><span>DOGE-Landscaper v2.7 · Nvidia Jetson Orin AGX · iOS 27 / visionOS 27</span><span>Generated: ${new Date().toLocaleTimeString()}</span></div>
          <script>window.onload = () => { window.print(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={handlePrint}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
      style={{ background: "oklch(0.32 0.1 145)", color: "#c8f0b0" }}
    >
      <Printer size={14} />
      Export Daily Report PDF
    </motion.button>
  );
}

// Unused imports kept to avoid TS errors for icon-only usage
const _unused = { Leaf, CheckCircle, CloudRain, Package, MessageSquare, MapPin };
void _unused;
