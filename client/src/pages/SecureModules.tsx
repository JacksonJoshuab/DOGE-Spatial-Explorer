/**
 * Secure Modules — Civic Intelligence Dark
 * Evidence Room, SCIF Management, Detention Center
 * Modular add-ins for law enforcement and secure facilities
 */
import DashboardLayout from "@/components/DashboardLayout";
import SecureAuthGate from "@/components/SecureAuthGate";
import { useState } from "react";
import { Shield, Lock, Eye, AlertTriangle, CheckCircle2, Clock, Radio, Thermometer, Camera, Users, Key, Activity } from "lucide-react";
import { toast } from "sonner";

const MODULES = [
  { id: "evidence", label: "Evidence Room", icon: Shield, color: "oklch(0.45 0.20 240)" },
  { id: "scif", label: "SCIF Management", icon: Lock, color: "oklch(0.50 0.22 25)" },
  { id: "detention", label: "Detention Center", icon: Users, color: "oklch(0.55 0.18 75)" },
];

const EVIDENCE_ITEMS = [
  { id: "EVD-2024-0847", case: "24-WL-0847", description: "Controlled substance — methamphetamine (12.4g)", collected: "2024-11-03", officer: "Ofc. T. Ramirez", location: "Shelf A-14", temp: 67.8, humidity: 44.2, weight: "12.4g", status: "Active", chain: 4 },
  { id: "EVD-2024-0612", case: "24-WL-0612", description: "Firearm — Glock 19, S/N MXP4471", collected: "2024-08-17", officer: "Ofc. K. Williams", location: "Vault B-02", temp: 68.1, humidity: 43.9, weight: "595g", status: "Active", chain: 6 },
  { id: "EVD-2024-0391", case: "24-WL-0391", description: "Digital evidence — laptop computer, S/N 7X4KQ2", collected: "2024-05-29", officer: "Det. M. Chen", location: "Digital Locker C-07", temp: 67.5, humidity: 44.5, weight: "1.82kg", status: "Active", chain: 8 },
  { id: "EVD-2024-0215", case: "24-WL-0215", description: "Currency — $4,720 USD (bagged)", collected: "2024-03-11", officer: "Ofc. J. Torres", location: "Safe D-01", temp: 68.0, humidity: 43.8, weight: "N/A", status: "Active", chain: 5 },
  { id: "EVD-2023-1104", case: "23-WL-1104", description: "Stolen property — jewelry (14 items)", collected: "2023-12-20", officer: "Det. S. Park", location: "Shelf A-22", temp: 67.9, humidity: 44.1, weight: "N/A", status: "Pending Disposition", chain: 7 },
  { id: "EVD-2023-0889", case: "23-WL-0889", description: "Vehicle parts — catalytic converter", collected: "2023-10-05", officer: "Ofc. B. Johnson", location: "Garage E-03", temp: 71.2, humidity: 52.1, weight: "4.2kg", status: "Released to Court", chain: 9 },
];

const CHAIN_OF_CUSTODY = [
  { time: "2025-03-01 08:14", actor: "Ofc. T. Ramirez", action: "Check-in inspection", item: "EVD-2024-0847", hash: "sha256:a3f8..." },
  { time: "2025-02-28 14:22", actor: "Det. M. Chen", action: "Removed for lab analysis", item: "EVD-2024-0391", hash: "sha256:b7e4..." },
  { time: "2025-02-28 16:45", actor: "Det. M. Chen", action: "Returned from lab", item: "EVD-2024-0391", hash: "sha256:c2d5..." },
  { time: "2025-02-27 09:30", actor: "Chief R. Davis", action: "Audit inspection", item: "All items", hash: "sha256:d9f1..." },
];

const SCIF_ZONES = [
  {
    id: "ZONE-TS-01",
    name: "Top Secret / SCI Zone",
    classification: "TS/SCI",
    color: "oklch(0.50 0.22 25)",
    faraday: "ACTIVE",
    emShielding: "98.7 dB",
    rfAnomaly: false,
    occupants: 0,
    lastEntry: "2025-02-28 11:30",
    lastExit: "2025-02-28 12:15",
    tempC: 20.1,
    humidity: 42.3,
    status: "Secure",
  },
  {
    id: "ZONE-S-01",
    name: "Secret Zone",
    classification: "SECRET",
    color: "oklch(0.55 0.18 75)",
    faraday: "ACTIVE",
    emShielding: "95.2 dB",
    rfAnomaly: false,
    occupants: 1,
    lastEntry: "2025-03-01 09:45",
    lastExit: "—",
    tempC: 20.4,
    humidity: 43.1,
    status: "Occupied",
  },
  {
    id: "ZONE-CUI-01",
    name: "CUI Processing Room",
    classification: "CUI",
    color: "oklch(0.40 0.18 240)",
    faraday: "PASSIVE",
    emShielding: "72.1 dB",
    rfAnomaly: true,
    occupants: 0,
    lastEntry: "2025-03-01 07:22",
    lastExit: "2025-03-01 08:05",
    tempC: 21.2,
    humidity: 45.8,
    status: "RF Alert",
  },
];

const SCIF_ACCESS_LOG = [
  { time: "2025-03-01 09:45", name: "Chief R. Davis", zone: "Secret Zone", method: "Iris + PIN", result: "Granted" },
  { time: "2025-03-01 07:22", name: "Sgt. L. Martinez", zone: "CUI Processing Room", method: "Fingerprint + PIN", result: "Granted" },
  { time: "2025-02-28 11:30", name: "Det. M. Chen", zone: "TS/SCI Zone", method: "Iris + Fingerprint + PIN", result: "Granted" },
  { time: "2025-02-28 09:12", name: "Unknown", zone: "TS/SCI Zone", method: "Fingerprint", result: "DENIED" },
];

const CELLS = [
  { id: "CELL-A1", occupant: "Booking #2024-1847", status: "Occupied", lastCheck: "2025-03-01 14:15", nextCheck: "2025-03-01 14:45", officer: "Ofc. K. Williams", wellness: "OK", notes: "Awaiting arraignment" },
  { id: "CELL-A2", occupant: "Booking #2024-1851", status: "Occupied", lastCheck: "2025-03-01 14:10", nextCheck: "2025-03-01 14:40", officer: "Ofc. T. Ramirez", wellness: "Medical Requested", notes: "Medical staff notified" },
  { id: "CELL-B1", occupant: "—", status: "Vacant", lastCheck: "2025-03-01 13:00", nextCheck: "—", officer: "—", wellness: "—", notes: "Cleaned and inspected" },
  { id: "CELL-B2", occupant: "Booking #2024-1839", status: "Occupied", lastCheck: "2025-03-01 14:00", nextCheck: "2025-03-01 14:30", officer: "Ofc. B. Johnson", wellness: "OK", notes: "Transfer pending" },
];

const WELLNESS_LOG = [
  { time: "2025-03-01 14:15", officer: "Ofc. K. Williams", cell: "CELL-A1", result: "OK", notes: "Sleeping" },
  { time: "2025-03-01 14:10", officer: "Ofc. T. Ramirez", cell: "CELL-A2", result: "Medical", notes: "Complained of chest pain — medical notified" },
  { time: "2025-03-01 14:00", officer: "Ofc. B. Johnson", cell: "CELL-B2", result: "OK", notes: "Awake, cooperative" },
  { time: "2025-03-01 13:45", officer: "Ofc. K. Williams", cell: "CELL-A1", result: "OK", notes: "Eating" },
  { time: "2025-03-01 13:30", officer: "Ofc. T. Ramirez", cell: "CELL-A2", result: "OK", notes: "Resting" },
];

export default function SecureModules() {
  const [activeModule, setActiveModule] = useState("evidence");

  return (
    <SecureAuthGate
      moduleName="Secure Modules — Evidence, SCIF & Detention"
      classificationLevel="SECRET"
      requiredRole="Law Enforcement / City Administrator"
    >
    <DashboardLayout title="Secure Modules">
      <div className="p-6 space-y-6">
        {/* Module selector */}
        <div className="flex gap-2">
          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeModule === m.id ? `${m.color.replace(")", " / 15%)")}` : "oklch(1 0 0)",
                border: `1px solid ${activeModule === m.id ? m.color.replace(")", " / 40%)") : "oklch(0 0 0 / 8%)"}`,
                color: activeModule === m.id ? m.color : "oklch(0.45 0.012 250)",
              }}
            >
              <m.icon className="w-4 h-4" />
              {m.label}
            </button>
          ))}
        </div>

        {/* Evidence Room */}
        {activeModule === "evidence" && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active Items", value: "4", color: "oklch(0.40 0.18 240)" },
                { label: "Pending Disposition", value: "1", color: "oklch(0.55 0.18 75)" },
                { label: "Released to Court", value: "1", color: "oklch(0.45 0.18 145)" },
                { label: "Chain Integrity", value: "100%", color: "oklch(0.45 0.18 145)" },
              ].map((s) => (
                <div key={s.label} className="data-card">
                  <div className="metric-value text-2xl" style={{ color: s.color }}>{s.value}</div>
                  <div className="section-label mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Environmental status */}
            <div className="p-4 rounded-lg flex items-center gap-4" style={{ background: "oklch(0.65 0.18 145 / 8%)", border: "1px solid oklch(0.65 0.18 145 / 20%)" }}>
              <Thermometer className="w-4 h-4" style={{ color: "oklch(0.45 0.18 145)" }} />
              <span className="text-sm" style={{ color: "oklch(0.42 0.18 145)" }}>
                <strong>Environmental OK:</strong> Avg temp 68.1°F (target 65–72°F) · Avg humidity 44.4% RH (target 30–50%) · DOGE Sentinel Node online
              </span>
              <span className="badge-success ml-auto">NOMINAL</span>
            </div>

            {/* Evidence items */}
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid oklch(0 0 0 / 8%)" }}>
              <div className="px-4 py-3 border-b" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="text-sm font-semibold" style={{ color: "oklch(0.88 0.008 240)" }}>Evidence Inventory</div>
              </div>
              {EVIDENCE_ITEMS.map((item) => (
                <div key={item.id} className="flex items-start gap-4 px-4 py-3 border-b last:border-b-0" style={{ background: "oklch(0.985 0.003 240)", borderColor: "oklch(0 0 0 / 6%)" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono font-bold" style={{ color: "oklch(0.45 0.20 240)" }}>{item.id}</span>
                      <span className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>Case {item.case}</span>
                    </div>
                    <div className="text-sm font-medium" style={{ color: "oklch(0.22 0.018 250)" }}>{item.description}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>
                      Collected {item.collected} by {item.officer} · {item.location}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge-${item.status === "Active" ? "info" : item.status === "Released to Court" ? "success" : "warning"}`}>
                      {item.status}
                    </span>
                    <div className="text-[10px] mt-1 font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{item.chain} custody events</div>
                    <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.48 0.012 250)" }}>{item.temp}°F · {item.humidity}% RH</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chain of custody log */}
            <div>
              <div className="section-label mb-3">Blockchain Chain of Custody — Recent Events</div>
              <div className="space-y-1.5">
                {CHAIN_OF_CUSTODY.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 6%)" }}>
                    <span className="text-[9px] font-mono w-36 flex-shrink-0" style={{ color: "oklch(0.48 0.012 250)" }}>{log.time}</span>
                    <span className="text-xs flex-1" style={{ color: "oklch(0.65 0.010 250)" }}>{log.action}</span>
                    <span className="text-[10px]" style={{ color: "oklch(0.48 0.012 250)" }}>{log.actor}</span>
                    <span className="text-[9px] font-mono" style={{ color: "oklch(0.48 0.012 250)" }}>{log.hash}</span>
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "oklch(0.45 0.18 145)" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SCIF Management */}
        {activeModule === "scif" && (
          <div className="space-y-4">
            {/* RF Alert */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: "oklch(0.62 0.22 25 / 10%)", border: "1px solid oklch(0.62 0.22 25 / 25%)" }}>
              <Radio className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.50 0.22 25)" }} />
              <span className="text-sm" style={{ color: "oklch(0.50 0.22 25)" }}>
                <strong>RF Anomaly Detected:</strong> CUI Processing Room — 2.4GHz signal detected at 07:22. Sweep initiated. Security officer notified.
              </span>
              <span className="badge-critical ml-auto flex-shrink-0">ACTIVE ALERT</span>
            </div>

            {/* Zone cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SCIF_ZONES.map((zone) => (
                <div key={zone.id} className="p-4 rounded-xl" style={{ background: "oklch(1 0 0)", border: `1px solid ${zone.rfAnomaly ? "oklch(0.50 0.22 25 / 22%)" : zone.color.replace(")", " / 20%)")}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span
                        className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wider"
                        style={{ background: `${zone.color.replace(")", " / 15%)")}`, color: zone.color, border: `1px solid ${zone.color.replace(")", " / 25%)")}` }}
                      >
                        {zone.classification}
                      </span>
                      <div className="text-sm font-bold mt-2" style={{ color: "oklch(0.88 0.008 240)", fontFamily: "'Syne', sans-serif" }}>{zone.name}</div>
                    </div>
                    <span className={`status-dot ${zone.rfAnomaly ? "red" : zone.occupants > 0 ? "amber" : "green"}`} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 rounded" style={{ background: "oklch(0.965 0.005 240)" }}>
                      <div className="section-label mb-0.5">Faraday Cage</div>
                      <div className="text-xs font-mono font-bold" style={{ color: "oklch(0.45 0.18 145)" }}>{zone.faraday}</div>
                    </div>
                    <div className="p-2 rounded" style={{ background: "oklch(0.965 0.005 240)" }}>
                      <div className="section-label mb-0.5">EM Shielding</div>
                      <div className="text-xs font-mono font-bold" style={{ color: "oklch(0.40 0.18 240)" }}>{zone.emShielding}</div>
                    </div>
                    <div className="p-2 rounded" style={{ background: "oklch(0.965 0.005 240)" }}>
                      <div className="section-label mb-0.5">RF Anomaly</div>
                      <div className="text-xs font-mono font-bold" style={{ color: zone.rfAnomaly ? "oklch(0.50 0.22 25)" : "oklch(0.45 0.18 145)" }}>
                        {zone.rfAnomaly ? "DETECTED" : "CLEAR"}
                      </div>
                    </div>
                    <div className="p-2 rounded" style={{ background: "oklch(0.965 0.005 240)" }}>
                      <div className="section-label mb-0.5">Occupants</div>
                      <div className="text-xs font-mono font-bold" style={{ color: zone.occupants > 0 ? "oklch(0.55 0.18 75)" : "oklch(0.48 0.012 250)" }}>
                        {zone.occupants}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] space-y-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>
                    <div>Temp: {zone.tempC}°C · Humidity: {zone.humidity}%</div>
                    <div>Last entry: {zone.lastEntry}</div>
                    <div>Last exit: {zone.lastExit}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Access log */}
            <div>
              <div className="section-label mb-3">Biometric Access Log</div>
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid oklch(0 0 0 / 8%)" }}>
                {SCIF_ACCESS_LOG.map((log, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-2.5 border-b last:border-b-0" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 6%)" }}>
                    <span className="text-[9px] font-mono w-36 flex-shrink-0" style={{ color: "oklch(0.48 0.012 250)" }}>{log.time}</span>
                    <span className="text-xs flex-1" style={{ color: "oklch(0.70 0.010 250)" }}>{log.name}</span>
                    <span className="text-xs" style={{ color: "oklch(0.45 0.012 250)" }}>{log.zone}</span>
                    <span className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>{log.method}</span>
                    <span className={`badge-${log.result === "Granted" ? "success" : "critical"}`}>{log.result}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detention Center */}
        {activeModule === "detention" && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Occupied Cells", value: "3/4", color: "oklch(0.55 0.18 75)" },
                { label: "Medical Alerts", value: "1", color: "oklch(0.50 0.22 25)" },
                { label: "Checks Today", value: "47", color: "oklch(0.40 0.18 240)" },
                { label: "Missed Checks", value: "0", color: "oklch(0.45 0.18 145)" },
              ].map((s) => (
                <div key={s.label} className="data-card">
                  <div className="metric-value text-2xl" style={{ color: s.color }}>{s.value}</div>
                  <div className="section-label mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Medical alert */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: "oklch(0.62 0.22 25 / 10%)", border: "1px solid oklch(0.62 0.22 25 / 25%)" }}>
              <Activity className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.50 0.22 25)" }} />
              <span className="text-sm" style={{ color: "oklch(0.50 0.22 25)" }}>
                <strong>Medical Alert — CELL-A2:</strong> Booking #2024-1851 reported chest pain at 14:10. Medical staff en route. Ofc. Ramirez on scene.
              </span>
              <span className="badge-critical ml-auto flex-shrink-0">ACTIVE</span>
            </div>

            {/* Cell status board */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CELLS.map((cell) => (
                <div
                  key={cell.id}
                  className="p-4 rounded-lg"
                  style={{
                    background: "oklch(1 0 0)",
                    border: `1px solid ${cell.wellness === "Medical Requested" ? "oklch(0.50 0.22 25 / 22%)" : cell.status === "Vacant" ? "oklch(0 0 0 / 6%)" : "oklch(0.75 0.18 75 / 20%)"}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold" style={{ color: "oklch(0.88 0.008 240)", fontFamily: "'Syne', sans-serif" }}>{cell.id}</div>
                      <div className="text-xs mt-0.5" style={{ color: "oklch(0.45 0.012 250)" }}>{cell.occupant}</div>
                    </div>
                    <span className={`badge-${cell.status === "Vacant" ? "info" : cell.wellness === "Medical Requested" ? "critical" : "warning"}`}>
                      {cell.status === "Vacant" ? "VACANT" : cell.wellness === "Medical Requested" ? "MEDICAL" : "OCCUPIED"}
                    </span>
                  </div>
                  {cell.status !== "Vacant" && (
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between">
                        <span style={{ color: "oklch(0.52 0.010 250)" }}>Last check:</span>
                        <span className="font-mono" style={{ color: "oklch(0.60 0.010 250)" }}>{cell.lastCheck}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "oklch(0.52 0.010 250)" }}>Next check:</span>
                        <span className="font-mono" style={{ color: "oklch(0.60 0.010 250)" }}>{cell.nextCheck}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "oklch(0.52 0.010 250)" }}>Officer:</span>
                        <span style={{ color: "oklch(0.60 0.010 250)" }}>{cell.officer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "oklch(0.52 0.010 250)" }}>Notes:</span>
                        <span style={{ color: cell.wellness === "Medical Requested" ? "oklch(0.50 0.22 25)" : "oklch(0.60 0.010 250)" }}>{cell.notes}</span>
                      </div>
                    </div>
                  )}
                  {cell.status !== "Vacant" && (
                    <button
                      onClick={() => toast.success(`Wellness check logged for ${cell.id} at ${new Date().toLocaleTimeString()}`)}
                      className="mt-3 w-full py-1.5 rounded text-xs font-semibold"
                      style={{ background: "oklch(0.55 0.18 75 / 12%)", border: "1px solid oklch(0.75 0.18 75 / 25%)", color: "oklch(0.50 0.18 75)" }}
                    >
                      Log Wellness Check
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Wellness log */}
            <div>
              <div className="section-label mb-3">Wellness Check Log — Today</div>
              <div className="space-y-1.5">
                {WELLNESS_LOG.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 6%)" }}>
                    <span className="text-[9px] font-mono w-36 flex-shrink-0" style={{ color: "oklch(0.48 0.012 250)" }}>{log.time}</span>
                    <span className="text-[10px] w-20 flex-shrink-0 font-mono" style={{ color: "oklch(0.45 0.012 250)" }}>{log.cell}</span>
                    <span className="text-xs flex-1" style={{ color: "oklch(0.65 0.010 250)" }}>{log.notes}</span>
                    <span className="text-[10px]" style={{ color: "oklch(0.48 0.012 250)" }}>{log.officer}</span>
                    <span className={`badge-${log.result === "OK" ? "success" : "critical"}`}>{log.result}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
    </SecureAuthGate>
  );
}
