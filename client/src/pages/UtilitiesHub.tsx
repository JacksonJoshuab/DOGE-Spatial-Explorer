/**
 * UtilitiesHub — /utilities (dashboard)
 * Expanded Utilities section for West Liberty municipal infrastructure
 * Covers: Water Distribution, Wastewater/Sewer, Natural Gas, Electric,
 *         SCADA Integration, Work Orders, Billing Analytics, Asset Management
 * Design: Civic Intelligence Light — white/light-grey backgrounds, dark text, blue/teal accents
 */
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { Link } from "wouter";
import {
  Droplets, Zap, Wrench, Activity, BarChart3, AlertTriangle,
  CheckCircle2, Clock, ChevronRight, TrendingUp, TrendingDown,
  Gauge, Thermometer, Wind, DollarSign, MapPin, Settings,
  ArrowUpRight, Send, Package, Radio
} from "lucide-react";
import { toast } from "sonner";

// ─── West Liberty Utilities Data ─────────────────────────────────────────────
const UTILITY_STATS = [
  { label: "Water Pressure (avg)", value: "71 PSI", sub: "Normal range: 60–80 PSI", icon: Gauge, color: "oklch(0.45 0.20 240)", status: "ok" },
  { label: "Daily Water Usage", value: "148K gal", sub: "↓ 3.2% vs. 30-day avg", icon: Droplets, color: "oklch(0.45 0.20 240)", status: "ok" },
  { label: "Lift Station Level", value: "42%", sub: "Pump 1 ON · Pump 2 STANDBY", icon: Activity, color: "oklch(0.50 0.22 280)", status: "ok" },
  { label: "Active Alerts", value: "2", sub: "1 pressure, 1 storm drain", icon: AlertTriangle, color: "oklch(0.58 0.22 25)", status: "alert" },
  { label: "Open Work Orders", value: "5", sub: "2 urgent, 3 routine", icon: Wrench, color: "oklch(0.50 0.18 75)", status: "warn" },
  { label: "Monthly Revenue", value: "$142K", sub: "Water + Sewer + Gas", icon: DollarSign, color: "oklch(0.38 0.18 145)", status: "ok" },
];

const WATER_ZONES = [
  { zone: "Zone 1 — Downtown", sensors: 4, pressure: "72 PSI", flow: "14.2 GPM", status: "normal", customers: 412 },
  { zone: "Zone 2 — North Residential", sensors: 3, pressure: "68 PSI", flow: "11.8 GPM", status: "normal", customers: 287 },
  { zone: "Zone 3 — Industrial Park", sensors: 2, pressure: "58 PSI", flow: "9.1 GPM", status: "warning", customers: 38 },
  { zone: "Zone 4 — South Residential", sensors: 3, pressure: "74 PSI", flow: "13.4 GPM", status: "normal", customers: 341 },
  { zone: "Zone 5 — West Liberty Schools", sensors: 2, pressure: "71 PSI", flow: "8.2 GPM", status: "normal", customers: 6 },
];

const SEWER_ASSETS = [
  { id: "LS-001", name: "Main Lift Station", address: "S Calhoun St", level: 42, pump1: "ON", pump2: "STANDBY", status: "normal", lastMaint: "Feb 12, 2026" },
  { id: "LS-002", name: "North Lift Station", address: "N Elm St & W 8th St", level: 28, pump1: "ON", pump2: "OFF", status: "normal", lastMaint: "Jan 28, 2026" },
  { id: "SD-001", name: "Storm Drain — N Calhoun", address: "N Calhoun & W 5th St", level: 78, pump1: "N/A", pump2: "N/A", status: "alert", lastMaint: "Mar 1, 2026" },
  { id: "SD-002", name: "Storm Drain — E 3rd St", address: "E 3rd & N Maple St", level: 31, pump1: "N/A", pump2: "N/A", status: "normal", lastMaint: "Feb 20, 2026" },
];

const GAS_STATIONS = [
  { id: "GR-001", name: "Main Regulator Station", address: "E 7th St", pressure: "18 PSI", methane: "0.0% LEL", status: "normal", lastCalib: "Jan 15, 2026" },
  { id: "GR-002", name: "North Distribution Point", address: "N Calhoun & W 10th St", pressure: "16 PSI", methane: "0.0% LEL", status: "normal", lastCalib: "Jan 15, 2026" },
  { id: "GR-003", name: "Industrial Feeder", address: "Industrial Dr", pressure: "22 PSI", methane: "0.1% LEL", status: "normal", lastCalib: "Feb 1, 2026" },
];

const WORK_ORDERS = [
  { id: "WO-2026-0142", type: "Water Main Repair", address: "Zone 3 — Industrial Park", priority: "Urgent", status: "in-progress", assigned: "Mike Johnson", created: "Mar 2, 2026", device: "SmartValve Pro WL-VALVE-002" },
  { id: "WO-2026-0141", type: "Storm Drain Clearing", address: "N Calhoun & W 5th St", priority: "Urgent", status: "dispatched", assigned: "Tom Davis", created: "Mar 2, 2026", device: "StormNet WL-STORM-001" },
  { id: "WO-2026-0140", type: "Lift Station PM", address: "Main Lift Station, S Calhoun", priority: "Routine", status: "scheduled", assigned: "Sarah Lee", created: "Mar 1, 2026", device: "AquaSentinel WL-WATER-003" },
  { id: "WO-2026-0139", type: "Gas Meter Replacement", address: "412 E 5th St", priority: "Routine", status: "scheduled", assigned: "Mike Johnson", created: "Feb 28, 2026", device: "GasPulse WL-GAS-002" },
  { id: "WO-2026-0138", type: "Hydrant Flushing", address: "Zone 2 — N Residential", priority: "Routine", status: "complete", assigned: "Tom Davis", created: "Feb 27, 2026", device: "SmartValve Pro WL-VALVE-004" },
];

const BILLING = [
  { service: "Water", customers: 1084, revenue: "$68,420", avgBill: "$63.12", arrears: "$4,210", trend: "up" },
  { service: "Sewer", customers: 1084, revenue: "$52,180", avgBill: "$48.14", arrears: "$2,890", trend: "stable" },
  { service: "Natural Gas", customers: 892, revenue: "$21,340", avgBill: "$23.93", arrears: "$1,540", trend: "down" },
];

const ASSET_INVENTORY = [
  { category: "SmartValve Pro", deployed: 8, total: 12, coverage: "67%", nextInstall: "Q2 2026" },
  { category: "AquaSentinel Node", deployed: 3, total: 6, coverage: "50%", nextInstall: "Q3 2026" },
  { category: "GasPulse Monitor", deployed: 3, total: 4, coverage: "75%", nextInstall: "Q2 2026" },
  { category: "StormNet Drain Sensor", deployed: 2, total: 8, coverage: "25%", nextInstall: "Q2 2026" },
  { category: "BridgeWatch Monitor", deployed: 0, total: 2, coverage: "0%", nextInstall: "Q4 2026" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    "normal": { bg: "oklch(0.38 0.18 145 / 12%)", text: "oklch(0.32 0.18 145)", label: "NORMAL" },
    "warning": { bg: "oklch(0.50 0.18 75 / 12%)", text: "oklch(0.45 0.18 75)", label: "WARNING" },
    "alert": { bg: "oklch(0.58 0.22 25 / 12%)", text: "oklch(0.45 0.22 25)", label: "ALERT" },
    "ok": { bg: "oklch(0.38 0.18 145 / 12%)", text: "oklch(0.32 0.18 145)", label: "OK" },
    "in-progress": { bg: "oklch(0.40 0.18 240 / 12%)", text: "oklch(0.40 0.18 240)", label: "IN PROGRESS" },
    "dispatched": { bg: "oklch(0.50 0.18 75 / 12%)", text: "oklch(0.45 0.18 75)", label: "DISPATCHED" },
    "scheduled": { bg: "oklch(0 0 0 / 6%)", text: "oklch(0.52 0.010 250)", label: "SCHEDULED" },
    "complete": { bg: "oklch(0.38 0.18 145 / 12%)", text: "oklch(0.32 0.18 145)", label: "COMPLETE" },
    "Urgent": { bg: "oklch(0.58 0.22 25 / 12%)", text: "oklch(0.45 0.22 25)", label: "URGENT" },
    "Routine": { bg: "oklch(0 0 0 / 6%)", text: "oklch(0.52 0.010 250)", label: "ROUTINE" },
  };
  const s = map[status] || { bg: "oklch(0 0 0 / 6%)", text: "oklch(0.52 0.010 250)", label: status.toUpperCase() };
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

export default function UtilitiesHub() {
  const [activeTab, setActiveTab] = useState<"water" | "sewer" | "gas" | "workorders" | "billing" | "assets">("water");

  const TABS = [
    { id: "water", label: "Water Distribution", icon: Droplets },
    { id: "sewer", label: "Sewer / Storm", icon: Activity },
    { id: "gas", label: "Natural Gas", icon: Zap },
    { id: "workorders", label: "Work Orders", icon: Wrench },
    { id: "billing", label: "Billing Analytics", icon: DollarSign },
    { id: "assets", label: "Asset Inventory", icon: Package },
  ] as const;

  return (
    <DashboardLayout title="Utilities Hub — West Liberty, IA">
      <div className="p-6 space-y-6" style={{ background: "oklch(0.975 0.004 240)", minHeight: "100vh" }}>

        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-5 h-5" style={{ color: "oklch(0.45 0.20 240)" }} />
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>
                Utilities Hub
              </h1>
            </div>
            <p className="text-sm" style={{ color: "oklch(0.45 0.012 250)" }}>
              West Liberty Municipal Utilities · Director of Public Works · (319) 627-2418 ext. 5
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold" style={{ background: "oklch(0.58 0.22 25 / 10%)", border: "1px solid oklch(0.58 0.22 25 / 25%)", color: "oklch(0.45 0.22 25)" }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              2 ACTIVE ALERTS
            </div>
            <Link href="/map">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold" style={{ background: "oklch(0.40 0.18 240 / 10%)", border: "1px solid oklch(0.40 0.18 240 / 25%)", color: "oklch(0.40 0.18 240)" }}>
                <MapPin className="w-3.5 h-3.5" />
                Spatial Map
              </button>
            </Link>
          </div>
        </div>

        {/* ─── Stats Row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {UTILITY_STATS.map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl"
              style={{
                background: "oklch(1 0 0)",
                border: stat.status === "alert" ? "1px solid oklch(0.58 0.22 25 / 35%)" : "1px solid oklch(0 0 0 / 7%)",
                boxShadow: "0 1px 4px oklch(0 0 0 / 5%)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                {stat.status === "alert" && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "oklch(0.58 0.22 25)" }} />}
              </div>
              <div className="text-xl font-mono font-bold" style={{ color: "oklch(0.12 0.018 250)" }}>{stat.value}</div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: "oklch(0.35 0.018 250)" }}>{stat.label}</div>
              <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ─── SCADA Integration Notice ───────────────────────────────────── */}
        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "oklch(0.40 0.18 240 / 6%)", border: "1px solid oklch(0.40 0.18 240 / 18%)" }}>
          <Radio className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.40 0.18 240)" }} />
          <p className="text-xs" style={{ color: "oklch(0.35 0.018 250)" }}>
            <strong>SCADA Integration Active</strong> — All IoT sensor data (SmartValve Pro, AquaSentinel, GasPulse, StormNet) is streaming via LoRaWAN to the DOGE Municipal Platform. Last telemetry sync: <span className="font-mono">just now</span>.
          </p>
          <Link href="/hardware">
            <button className="flex items-center gap-1 text-xs font-semibold flex-shrink-0" style={{ color: "oklch(0.40 0.18 240)", background: "none", border: "none", cursor: "pointer" }}>
              Order Sensors <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>

        {/* ─── Tab Navigation ─────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "oklch(0 0 0 / 5%)" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                background: activeTab === tab.id ? "oklch(1 0 0)" : "transparent",
                color: activeTab === tab.id ? "oklch(0.40 0.18 240)" : "oklch(0.48 0.012 250)",
                boxShadow: activeTab === tab.id ? "0 1px 4px oklch(0 0 0 / 8%)" : "none",
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Water Distribution Tab ─────────────────────────────────────── */}
        {activeTab === "water" && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)", boxShadow: "0 1px 4px oklch(0 0 0 / 5%)" }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 7%)" }}>
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4" style={{ color: "oklch(0.45 0.20 240)" }} />
                  <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>Water Distribution Zones — 5 Zones · 1,084 Customers</span>
                </div>
                <div className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>SmartValve Pro · AquaSentinel</div>
              </div>
              <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
                {WATER_ZONES.map((zone) => (
                  <div key={zone.zone} className="px-5 py-4 flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: zone.status === "warning" ? "oklch(0.50 0.18 75 / 10%)" : "oklch(0.45 0.20 240 / 8%)" }}
                    >
                      <Droplets className="w-5 h-5" style={{ color: zone.status === "warning" ? "oklch(0.45 0.18 75)" : "oklch(0.45 0.20 240)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>{zone.zone}</span>
                        <StatusBadge status={zone.status} />
                      </div>
                      <div className="text-xs font-mono" style={{ color: "oklch(0.42 0.012 250)" }}>
                        Pressure: {zone.pressure} · Flow: {zone.flow} · {zone.sensors} sensors
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-mono font-bold" style={{ color: "oklch(0.18 0.018 250)" }}>{zone.customers}</div>
                      <div className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>customers</div>
                    </div>
                    {zone.status === "warning" && (
                      <button
                        onClick={() => toast.success(`Work order created for ${zone.zone}`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-semibold flex-shrink-0"
                        style={{ background: "oklch(0.58 0.22 25 / 10%)", border: "1px solid oklch(0.58 0.22 25 / 25%)", color: "oklch(0.45 0.22 25)" }}
                      >
                        <Send className="w-3 h-3" />
                        Dispatch
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Water quality summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "pH Level", value: "7.4", range: "6.5–8.5", ok: true, icon: Activity },
                { label: "Turbidity", value: "0.18 NTU", range: "< 1 NTU", ok: true, icon: Droplets },
                { label: "Free Chlorine", value: "0.82 mg/L", range: "0.5–4 mg/L", ok: true, icon: Zap },
                { label: "Water Temp", value: "52°F", range: "< 65°F", ok: true, icon: Thermometer },
              ].map((q) => (
                <div key={q.label} className="p-4 rounded-xl" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <q.icon className="w-4 h-4" style={{ color: "oklch(0.45 0.20 240)" }} />
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "oklch(0.32 0.18 145)" }} />
                  </div>
                  <div className="text-base font-mono font-bold" style={{ color: "oklch(0.18 0.018 250)" }}>{q.value}</div>
                  <div className="text-[10px] font-semibold mt-0.5" style={{ color: "oklch(0.35 0.018 250)" }}>{q.label}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>Range: {q.range}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Sewer / Storm Tab ──────────────────────────────────────────── */}
        {activeTab === "sewer" && (
          <div className="rounded-xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)", boxShadow: "0 1px 4px oklch(0 0 0 / 5%)" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 7%)" }}>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: "oklch(0.50 0.22 280)" }} />
                <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>Sewer & Storm Drain Assets</span>
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
              {SEWER_ASSETS.map((asset) => (
                <div key={asset.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>{asset.name}</span>
                      <StatusBadge status={asset.status} />
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{asset.id}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: "oklch(0.42 0.012 250)" }}>
                    <MapPin className="w-3 h-3" />
                    {asset.address}
                  </div>
                  {/* Level bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: "oklch(0.52 0.010 250)" }}>
                      <span>Fill Level</span>
                      <span className="font-mono font-bold" style={{ color: asset.level > 70 ? "oklch(0.45 0.22 25)" : "oklch(0.32 0.18 145)" }}>{asset.level}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0 0 0 / 8%)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${asset.level}%`,
                          background: asset.level > 70 ? "oklch(0.58 0.22 25)" : asset.level > 50 ? "oklch(0.50 0.18 75)" : "oklch(0.38 0.18 145)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>
                    {asset.pump1 !== "N/A" && <span>Pump 1: <strong style={{ color: "oklch(0.28 0.018 250)" }}>{asset.pump1}</strong></span>}
                    {asset.pump2 !== "N/A" && <span>Pump 2: <strong style={{ color: "oklch(0.28 0.018 250)" }}>{asset.pump2}</strong></span>}
                    <span>Last Maint: {asset.lastMaint}</span>
                    {asset.status === "alert" && (
                      <button
                        onClick={() => toast.success(`Emergency work order dispatched for ${asset.name}`)}
                        className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold"
                        style={{ background: "oklch(0.58 0.22 25)", color: "oklch(0.98 0.004 25)" }}
                      >
                        <Send className="w-3 h-3" />
                        Dispatch Emergency
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Natural Gas Tab ────────────────────────────────────────────── */}
        {activeTab === "gas" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: "oklch(0.50 0.18 75 / 6%)", border: "1px solid oklch(0.50 0.18 75 / 20%)" }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" style={{ color: "oklch(0.45 0.18 75)" }} />
                <span className="text-xs font-bold" style={{ color: "oklch(0.35 0.018 250)" }}>GasPulse Monitor Network — ATEX Zone 1 Certified</span>
              </div>
              <p className="text-xs" style={{ color: "oklch(0.45 0.012 250)" }}>
                All 3 regulator stations are monitored by GasPulse Monitor IoT devices (Patent US2024/0251093). Automated shutoff triggers activate in &lt;500ms if methane exceeds 10% LEL. Emergency contact: MidAmerican Energy (319) 527-1000.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)", boxShadow: "0 1px 4px oklch(0 0 0 / 5%)" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "oklch(0 0 0 / 7%)" }}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: "oklch(0.50 0.18 75)" }} />
                  <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>Gas Regulator Stations — 892 Customers</span>
                </div>
              </div>
              <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
                {GAS_STATIONS.map((gs) => (
                  <div key={gs.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.50 0.18 75 / 10%)" }}>
                      <Zap className="w-5 h-5" style={{ color: "oklch(0.45 0.18 75)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>{gs.name}</span>
                        <StatusBadge status={gs.status} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: "oklch(0.42 0.012 250)" }}>
                        <MapPin className="w-3 h-3" />
                        {gs.address}
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>
                        Pressure: {gs.pressure} · Methane: {gs.methane} · Last Calib: {gs.lastCalib}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: "oklch(0.32 0.18 145)" }}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      CLEAR
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Work Orders Tab ────────────────────────────────────────────── */}
        {activeTab === "workorders" && (
          <div className="rounded-xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)", boxShadow: "0 1px 4px oklch(0 0 0 / 5%)" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 7%)" }}>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4" style={{ color: "oklch(0.50 0.18 75)" }} />
                <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>Utilities Work Orders</span>
              </div>
              <Link href="/operations">
                <button className="text-xs font-semibold flex items-center gap-1" style={{ color: "oklch(0.40 0.18 240)", background: "none", border: "none", cursor: "pointer" }}>
                  Operations Center <ChevronRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
              {WORK_ORDERS.map((wo) => (
                <div key={wo.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>{wo.type}</span>
                      <StatusBadge status={wo.priority} />
                      <StatusBadge status={wo.status} />
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{wo.id}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: "oklch(0.42 0.012 250)" }}>
                    <MapPin className="w-3 h-3" />
                    {wo.address}
                  </div>
                  <div className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>
                    Assigned: {wo.assigned} · Created: {wo.created}
                  </div>
                  <div className="text-[9px] mt-0.5 font-mono" style={{ color: "oklch(0.58 0.010 250)" }}>
                    IoT Source: {wo.device}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Billing Analytics Tab ──────────────────────────────────────── */}
        {activeTab === "billing" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BILLING.map((b) => (
                <div key={b.service} className="p-5 rounded-xl" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)", boxShadow: "0 1px 4px oklch(0 0 0 / 5%)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>{b.service}</span>
                    {b.trend === "up" ? <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.38 0.18 145)" }} /> : b.trend === "down" ? <TrendingDown className="w-4 h-4" style={{ color: "oklch(0.58 0.22 25)" }} /> : <BarChart3 className="w-4 h-4" style={{ color: "oklch(0.52 0.010 250)" }} />}
                  </div>
                  <div className="text-2xl font-mono font-bold mb-1" style={{ color: "oklch(0.12 0.018 250)" }}>{b.revenue}</div>
                  <div className="text-[10px] mb-3" style={{ color: "oklch(0.52 0.010 250)" }}>Monthly Revenue · {b.customers} customers</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded" style={{ background: "oklch(0.975 0.004 240)" }}>
                      <div className="text-xs font-mono font-bold" style={{ color: "oklch(0.18 0.018 250)" }}>{b.avgBill}</div>
                      <div className="text-[9px]" style={{ color: "oklch(0.52 0.010 250)" }}>Avg Bill</div>
                    </div>
                    <div className="p-2 rounded" style={{ background: "oklch(0.58 0.22 25 / 8%)" }}>
                      <div className="text-xs font-mono font-bold" style={{ color: "oklch(0.45 0.22 25)" }}>{b.arrears}</div>
                      <div className="text-[9px]" style={{ color: "oklch(0.52 0.010 250)" }}>In Arrears</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl" style={{ background: "oklch(0.38 0.18 145 / 6%)", border: "1px solid oklch(0.38 0.18 145 / 20%)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold mb-0.5" style={{ color: "oklch(0.18 0.018 250)" }}>Total Monthly Utility Revenue</div>
                  <div className="text-2xl font-mono font-bold" style={{ color: "oklch(0.32 0.18 145)" }}>$141,940</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.45 0.012 250)" }}>Water + Sewer + Gas · FY2026 YTD on track</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] mb-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>Total Arrears</div>
                  <div className="text-lg font-mono font-bold" style={{ color: "oklch(0.45 0.22 25)" }}>$8,640</div>
                  <div className="text-[9px]" style={{ color: "oklch(0.52 0.010 250)" }}>6.1% of monthly revenue</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Asset Inventory Tab ────────────────────────────────────────── */}
        {activeTab === "assets" && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)", boxShadow: "0 1px 4px oklch(0 0 0 / 5%)" }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 7%)" }}>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" style={{ color: "oklch(0.40 0.18 240)" }} />
                  <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>IoT Asset Deployment Status</span>
                </div>
                <Link href="/hardware">
                  <button className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "oklch(0.40 0.18 240)", background: "none", border: "none", cursor: "pointer" }}>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Order More Sensors
                  </button>
                </Link>
              </div>
              <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
                {ASSET_INVENTORY.map((asset) => {
                  const pct = Math.round((asset.deployed / asset.total) * 100);
                  return (
                    <div key={asset.category} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>{asset.category}</span>
                        <span className="text-xs font-mono" style={{ color: "oklch(0.42 0.012 250)" }}>{asset.deployed} / {asset.total} deployed</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: "oklch(0 0 0 / 8%)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: pct >= 75 ? "oklch(0.38 0.18 145)" : pct >= 50 ? "oklch(0.40 0.18 240)" : "oklch(0.50 0.18 75)",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>
                        <span>{pct}% coverage</span>
                        <span>Next install: {asset.nextInstall}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
