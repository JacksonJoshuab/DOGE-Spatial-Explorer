/**
 * FleetEquipment.tsx — All American Concrete Fleet & Equipment Dashboard
 *
 * Displays real-time status of all AAC mixer trucks, pump units, screeds,
 * and support vehicles with assignment, fuel, and maintenance tracking.
 */

import { useState } from "react";
import {
  Truck, AlertTriangle, CheckCircle2, Wrench, Fuel,
  MapPin, User, Clock, Filter, RefreshCw,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

// ─── Fleet data (mirrors server/agents.ts) ───────────────────────────────────
const FLEET = [
  { id: "MT-001", name: "Mixer Truck #1",       type: "Concrete Mixer",  status: "operational", fuelPct: 82,  mileage: 41220, assignedTo: "JS-002 — West Liberty Community Center",  driver: "Jake Hoffman",   lastService: "2026-02-18" },
  { id: "MT-003", name: "Mixer Truck #3",       type: "Concrete Mixer",  status: "operational", fuelPct: 76,  mileage: 58340, assignedTo: "JS-001 — County Road 22 Expansion",       driver: "Mike Torres",    lastService: "2026-02-25" },
  { id: "MT-005", name: "Mixer Truck #5",       type: "Concrete Mixer",  status: "operational", fuelPct: 91,  mileage: 29870, assignedTo: "JS-002 — West Liberty Community Center",  driver: "Maria Vega",     lastService: "2026-03-01" },
  { id: "MT-007", name: "Mixer Truck #7",       type: "Concrete Mixer",  status: "operational", fuelPct: 68,  mileage: 63110, assignedTo: "JS-001 — County Road 22 Expansion",       driver: "Dave Kline",     lastService: "2026-02-10", alert: "Low fuel — refuel at Yard ~09:30 AM" },
  { id: "MT-009", name: "Mixer Truck #9",       type: "Concrete Mixer",  status: "operational", fuelPct: 85,  mileage: 22450, assignedTo: "JS-003 — Iowa 70 Bridge Deck Repair",     driver: "Ron Schultz",    lastService: "2026-02-28" },
  { id: "MT-002", name: "Mixer Truck #2",       type: "Concrete Mixer",  status: "maintenance", fuelPct: 40,  mileage: 78900, assignedTo: null, driver: null, lastService: "2026-01-30", maintenanceNote: "Drum bearing replacement — ETA 03/09" },
  { id: "MT-004", name: "Mixer Truck #4",       type: "Concrete Mixer",  status: "maintenance", fuelPct: 55,  mileage: 71200, assignedTo: null, driver: null, lastService: "2026-01-15", maintenanceNote: "Hydraulic line repair — ETA 03/08" },
  { id: "PU-001", name: "Pump Unit #1",         type: "Concrete Pump",   status: "operational", fuelPct: 72,  mileage: null,  assignedTo: "JS-003 — Iowa 70 Bridge Deck Repair",     driver: null,             lastService: "2026-02-20" },
  { id: "PU-002", name: "Pump Unit #2",         type: "Concrete Pump",   status: "operational", fuelPct: 88,  mileage: null,  assignedTo: "JS-001 — County Road 22 Expansion",       driver: null,             lastService: "2026-02-22" },
  { id: "SC-001", name: "Screed #1",            type: "Power Screed",    status: "operational", fuelPct: 95,  mileage: null,  assignedTo: "JS-002 — West Liberty Community Center",  driver: null,             lastService: "2026-03-02" },
  { id: "BT-001", name: "Batch Plant Control",  type: "IoT Device",      status: "alert",       fuelPct: null, mileage: null, assignedTo: "Batch Plant",                             driver: "Carla Nguyen",   lastService: "2026-02-01", alert: "Moisture sensor #3 anomaly — manual override active since 06:15 AM" },
  { id: "FT-001", name: "Fuel Tanker",          type: "Support Vehicle", status: "operational", fuelPct: 100, mileage: null,  assignedTo: "Yard — on standby",                       driver: null,             lastService: "2026-02-28" },
];

const STATUS_CONFIG = {
  operational: { label: "Operational",  color: "oklch(0.45 0.18 145)", bg: "oklch(0.97 0.010 145)", border: "oklch(0.85 0.06 145)" },
  maintenance:  { label: "Maintenance", color: "oklch(0.55 0.18 75)",  bg: "oklch(0.98 0.012 75)",  border: "oklch(0.88 0.08 75)"  },
  alert:        { label: "Alert",       color: "oklch(0.50 0.22 25)",  bg: "oklch(0.98 0.015 25)",  border: "oklch(0.88 0.08 25)"  },
};

function FuelBar({ pct }: { pct: number }) {
  const color = pct >= 75 ? "oklch(0.45 0.18 145)" : pct >= 40 ? "oklch(0.55 0.18 75)" : "oklch(0.50 0.22 25)";
  return (
    <div className="flex items-center gap-2">
      <Fuel className="w-3 h-3 flex-shrink-0" style={{ color }} />
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.92 0.005 240)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

type FleetUnit = typeof FLEET[0];

function UnitCard({ unit }: { unit: FleetUnit }) {
  const cfg = STATUS_CONFIG[unit.status as keyof typeof STATUS_CONFIG];
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold" style={{ color: "oklch(0.18 0.018 250)" }}>{unit.name}</div>
          <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>{unit.type} · {unit.id}</div>
        </div>
        <div
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
          style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
        >
          {cfg.label}
        </div>
      </div>

      {/* Alert / maintenance note */}
      {(unit.alert || unit.maintenanceNote) && (
        <div
          className="flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-[11px]"
          style={{
            background: unit.status === "alert" ? "oklch(0.96 0.020 25)" : "oklch(0.97 0.015 75)",
            color: unit.status === "alert" ? "oklch(0.45 0.20 25)" : "oklch(0.45 0.18 75)",
          }}
        >
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {unit.alert ?? unit.maintenanceNote}
        </div>
      )}

      {/* Assignment */}
      {unit.assignedTo && (
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "oklch(0.35 0.012 250)" }}>
          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "oklch(0.55 0.15 240)" }} />
          {unit.assignedTo}
        </div>
      )}

      {/* Driver */}
      {unit.driver && (
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "oklch(0.35 0.012 250)" }}>
          <User className="w-3 h-3 flex-shrink-0" style={{ color: "oklch(0.55 0.15 270)" }} />
          {unit.driver}
        </div>
      )}

      {/* Fuel bar */}
      {unit.fuelPct !== null && unit.fuelPct !== undefined && (
        <FuelBar pct={unit.fuelPct} />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: `${cfg.color}20` }}>
        {unit.mileage !== null && unit.mileage !== undefined ? (
          <div className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>
            {unit.mileage.toLocaleString()} mi
          </div>
        ) : <div />}
        <div className="flex items-center gap-1 text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>
          <Clock className="w-3 h-3" />
          Service: {unit.lastService}
        </div>
      </div>
    </div>
  );
}

export default function FleetEquipment() {
  const [filter, setFilter] = useState<"all" | "operational" | "maintenance" | "alert">("all");

  const counts = {
    all: FLEET.length,
    operational: FLEET.filter(u => u.status === "operational").length,
    maintenance: FLEET.filter(u => u.status === "maintenance").length,
    alert: FLEET.filter(u => u.status === "alert").length,
  };

  const filtered = filter === "all" ? FLEET : FLEET.filter(u => u.status === filter);

  return (
    <DashboardLayout title="Fleet & Equipment">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-5 h-5" style={{ color: "oklch(0.45 0.20 240)" }} />
              <h1 className="text-xl font-bold" style={{ color: "oklch(0.14 0.018 250)" }}>
                Fleet & Equipment
              </h1>
            </div>
            <p className="text-sm" style={{ color: "oklch(0.52 0.010 250)" }}>
              All American Concrete · West Liberty, IA · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago" })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.52 0.010 250)" }}>
            <RefreshCw className="w-3.5 h-3.5" />
            Live status
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["all", "operational", "maintenance", "alert"] as const).map((key) => {
            const cfg = key === "all"
              ? { color: "oklch(0.45 0.20 240)", bg: "oklch(0.97 0.005 240)", border: "oklch(0.90 0.005 240)", label: "Total Units" }
              : { ...STATUS_CONFIG[key], label: STATUS_CONFIG[key].label };
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: filter === key ? cfg.bg : "oklch(0.985 0.003 240)",
                  border: `1.5px solid ${filter === key ? cfg.color : "oklch(0.92 0.005 240)"}`,
                }}
              >
                <div className="text-2xl font-bold font-mono" style={{ color: cfg.color }}>{counts[key]}</div>
                <div className="text-[10px] font-medium uppercase tracking-wide mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>
                  {cfg.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Filter label */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" style={{ color: "oklch(0.52 0.010 250)" }} />
          <span className="text-xs" style={{ color: "oklch(0.52 0.010 250)" }}>
            Showing {filtered.length} unit{filtered.length !== 1 ? "s" : ""}{filter !== "all" ? ` — ${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG].label}` : ""}
          </span>
        </div>

        {/* Fleet grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-2">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.45 0.010 250)" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
              {cfg.label}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
