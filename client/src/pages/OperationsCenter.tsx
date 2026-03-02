/**
 * OperationsCenter — Civic Intelligence Dark
 * Work order management with West Liberty-specific tasks
 */
import DashboardLayout from "@/components/DashboardLayout";
import { Wrench, AlertTriangle, CheckCircle2, Clock, MapPin, User, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const WORK_ORDERS = [
  { id: "WO-2025-0312", title: "Water Main Break — 3rd Ave & Elm St", dept: "Water Utility", priority: "emergency", status: "in-progress", assignee: "Dave Kline", location: "3rd Ave & Elm St", created: "2025-03-01 06:14", iotAlert: "SmartValve Node #07 — pressure drop 42 PSI" },
  { id: "WO-2025-0311", title: "Lift Station #3 Pump Failure", dept: "Sewer/Wastewater", priority: "emergency", status: "in-progress", assignee: "Tom Ruiz", location: "Industrial Park Rd", created: "2025-02-28 22:47", iotAlert: "GasPulse Node #03 — pump offline 4h 12m" },
  { id: "WO-2025-0310", title: "Pothole Repair — Highway 6 Corridor", dept: "Public Works", priority: "high", status: "scheduled", assignee: "Mike Hanson", location: "US-6 (Liberty Dr to Elm)", created: "2025-02-27 09:00", iotAlert: "RoadSense Node #14 — IRI score 8.2 (threshold: 7.0)" },
  { id: "WO-2025-0309", title: "Storm Drain Blockage — City Park", dept: "Public Works", priority: "high", status: "open", assignee: "Unassigned", location: "City Park (N entrance)", created: "2025-02-26 14:22", iotAlert: "StormNet Node #02 — 87% capacity" },
  { id: "WO-2025-0308", title: "Park Irrigation System Calibration", dept: "Parks & Recreation", priority: "medium", status: "scheduled", assignee: "Sarah Chen", location: "Wapsi Park", created: "2025-02-25 08:00", iotAlert: "IrriSmart Node #05 — soil moisture 18% (target: 35%)" },
  { id: "WO-2025-0307", title: "Street Light Outage — Mulberry St", dept: "Public Works", priority: "medium", status: "open", assignee: "Unassigned", location: "Mulberry St (4th–7th)", created: "2025-02-24 19:45", iotAlert: null },
  { id: "WO-2025-0306", title: "Bridge Inspection — Railroad Overpass", dept: "Public Works", priority: "medium", status: "scheduled", assignee: "Mike Hanson", location: "Railroad Ave overpass", created: "2025-02-23 10:00", iotAlert: "BridgeWatch Node #01 — vibration anomaly detected" },
  { id: "WO-2025-0305", title: "Trail Camera Replacement — Wapsi Trail", dept: "Parks & Recreation", priority: "low", status: "open", assignee: "Unassigned", location: "Wapsi Trail Mile 2.3", created: "2025-02-22 11:30", iotAlert: "TrailCam Node #08 — offline 72h" },
  { id: "WO-2025-0304", title: "Annual Fire Hydrant Flushing", dept: "Water Utility", priority: "low", status: "complete", assignee: "Dave Kline", location: "Citywide (47 hydrants)", created: "2025-02-15 07:00", iotAlert: null },
  { id: "WO-2025-0303", title: "City Hall HVAC Filter Replacement", dept: "General Government", priority: "low", status: "complete", assignee: "Jim Torres", location: "City Hall, 111 W 7th St", created: "2025-02-10 09:00", iotAlert: null },
];

const PRIORITY_CONFIG = {
  emergency: { color: "oklch(0.62 0.22 25)", label: "Emergency" },
  high: { color: "oklch(0.75 0.18 75)", label: "High" },
  medium: { color: "oklch(0.70 0.18 240)", label: "Medium" },
  low: { color: "oklch(0.65 0.18 145)", label: "Low" },
};

const STATUS_CONFIG = {
  "in-progress": { color: "oklch(0.75 0.18 75)", label: "In Progress" },
  open: { color: "oklch(0.62 0.22 25)", label: "Open" },
  scheduled: { color: "oklch(0.70 0.18 240)", label: "Scheduled" },
  complete: { color: "oklch(0.65 0.18 145)", label: "Complete" },
};

export default function OperationsCenter() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? WORK_ORDERS : WORK_ORDERS.filter(w => w.status === filter || w.priority === filter);

  const emergencyCount = WORK_ORDERS.filter(w => w.priority === "emergency" && w.status !== "complete").length;
  const openCount = WORK_ORDERS.filter(w => w.status === "open").length;
  const iotAlerts = WORK_ORDERS.filter(w => w.iotAlert && w.status !== "complete").length;

  return (
    <DashboardLayout title="Operations Center">
      <div className="p-6 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Emergency Orders", value: emergencyCount, color: "oklch(0.62 0.22 25)", icon: AlertTriangle },
            { label: "Open (Unassigned)", value: openCount, color: "oklch(0.75 0.18 75)", icon: Clock },
            { label: "IoT-Triggered Alerts", value: iotAlerts, color: "oklch(0.70 0.18 240)", icon: Wrench },
            { label: "Completed (30d)", value: WORK_ORDERS.filter(w => w.status === "complete").length, color: "oklch(0.65 0.18 145)", icon: CheckCircle2 },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-lg" style={{ background: "oklch(0.16 0.014 250)", border: "1px solid oklch(1 0 0 / 8%)" }}>
              <stat.icon className="w-4 h-4 mb-2" style={{ color: stat.color }} />
              <div className="metric-value text-2xl" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.45 0.008 250)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter + New button */}
        <div className="flex flex-wrap items-center gap-2">
          {["all", "emergency", "open", "in-progress", "scheduled", "complete"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 rounded text-xs font-medium capitalize transition-all"
              style={{
                background: filter === f ? "oklch(0.58 0.20 240 / 20%)" : "oklch(0.16 0.014 250)",
                border: `1px solid ${filter === f ? "oklch(0.58 0.20 240 / 40%)" : "oklch(1 0 0 / 8%)"}`,
                color: filter === f ? "oklch(0.70 0.18 240)" : "oklch(0.55 0.010 250)",
              }}
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => toast.success("New work order form opened")}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
            style={{ background: "oklch(0.58 0.20 240)", color: "oklch(0.98 0.005 240)" }}
          >
            <Plus className="w-3.5 h-3.5" /> New Work Order
          </button>
        </div>

        {/* Work orders table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(1 0 0 / 8%)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "oklch(0.16 0.014 250)", borderBottom: "1px solid oklch(1 0 0 / 8%)" }}>
                  {["ID", "Title", "Department", "Priority", "Status", "Assignee", "IoT Alert", ""].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left section-label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((wo) => {
                  const pri = PRIORITY_CONFIG[wo.priority as keyof typeof PRIORITY_CONFIG];
                  const sta = STATUS_CONFIG[wo.status as keyof typeof STATUS_CONFIG];
                  return (
                    <tr key={wo.id} className="border-b" style={{ background: "oklch(0.14 0.014 250)", borderColor: "oklch(1 0 0 / 6%)" }}>
                      <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: "oklch(0.50 0.010 250)" }}>{wo.id}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-xs" style={{ color: "oklch(0.80 0.008 240)" }}>{wo.title}</div>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px]" style={{ color: "oklch(0.40 0.008 250)" }}>
                          <MapPin className="w-2.5 h-2.5" />{wo.location}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[10px]" style={{ color: "oklch(0.50 0.010 250)" }}>{wo.dept}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: `${pri.color.replace(")", " / 12%)")}`, color: pri.color }}>{pri.label}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: `${sta.color.replace(")", " / 12%)")}`, color: sta.color }}>{sta.label}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1 text-[10px]" style={{ color: wo.assignee === "Unassigned" ? "oklch(0.62 0.22 25)" : "oklch(0.55 0.010 250)" }}>
                          <User className="w-2.5 h-2.5" />{wo.assignee}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 max-w-[180px]">
                        {wo.iotAlert && (
                          <div className="text-[9px] leading-tight" style={{ color: "oklch(0.70 0.18 240)" }}>
                            {wo.iotAlert}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => toast.success(`Opening work order ${wo.id}`)}
                          className="px-2 py-1 rounded text-[10px] font-semibold"
                          style={{ background: "oklch(0.58 0.20 240 / 15%)", color: "oklch(0.70 0.18 240)", border: "1px solid oklch(0.58 0.20 240 / 25%)" }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
