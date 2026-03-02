/**
 * OperationsCenter — Civic Intelligence Light
 * Work order management with West Liberty-specific tasks.
 * Merges static seed orders with live Postgres-backed orders from IoT alerts.
 */
import DashboardLayout from "@/components/DashboardLayout";
import { Wrench, AlertTriangle, CheckCircle2, Clock, MapPin, User, Plus, RefreshCw, Database, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

// ─── Static seed orders (legacy / demo data) ─────────────────────────────────
const SEED_ORDERS = [
  { id: "WO-2025-0312", title: "Water Main Break — 3rd Ave & Elm St", dept: "Water Utility", priority: "emergency", status: "in_progress", assignee: "Dave Kline", location: "3rd Ave & Elm St", created: "2025-03-01 06:14", iotAlert: "SmartValve Node #07 — pressure drop 42 PSI", sensorId: null },
  { id: "WO-2025-0311", title: "Lift Station #3 Pump Failure", dept: "Sewer/Wastewater", priority: "emergency", status: "in_progress", assignee: "Tom Ruiz", location: "Industrial Park Rd", created: "2025-02-28 22:47", iotAlert: "GasPulse Node #03 — pump offline 4h 12m", sensorId: null },
  { id: "WO-2025-0310", title: "Pothole Repair — Highway 6 Corridor", dept: "Public Works", priority: "high", status: "open", assignee: "Mike Hanson", location: "US-6 (Liberty Dr to Elm)", created: "2025-02-27 09:00", iotAlert: "RoadSense Node #14 — IRI score 8.2 (threshold: 7.0)", sensorId: null },
  { id: "WO-2025-0309", title: "Storm Drain Blockage — City Park", dept: "Public Works", priority: "high", status: "open", assignee: "Unassigned", location: "City Park (N entrance)", created: "2025-02-26 14:22", iotAlert: "StormNet Node #02 — 87% capacity", sensorId: null },
  { id: "WO-2025-0308", title: "Park Irrigation System Calibration", dept: "Parks & Recreation", priority: "normal", status: "open", assignee: "Sarah Chen", location: "Wapsi Park", created: "2025-02-25 08:00", iotAlert: "IrriSmart Node #05 — soil moisture 18% (target: 35%)", sensorId: null },
  { id: "WO-2025-0307", title: "Street Light Outage — Mulberry St", dept: "Public Works", priority: "normal", status: "open", assignee: "Unassigned", location: "Mulberry St (4th–7th)", created: "2025-02-24 19:45", iotAlert: null, sensorId: null },
  { id: "WO-2025-0306", title: "Bridge Inspection — Railroad Overpass", dept: "Public Works", priority: "normal", status: "open", assignee: "Mike Hanson", location: "Railroad Ave overpass", created: "2025-02-23 10:00", iotAlert: "BridgeWatch Node #01 — vibration anomaly detected", sensorId: null },
  { id: "WO-2025-0304", title: "Annual Fire Hydrant Flushing", dept: "Water Utility", priority: "low", status: "resolved", assignee: "Dave Kline", location: "Citywide (47 hydrants)", created: "2025-02-15 07:00", iotAlert: null, sensorId: null },
  { id: "WO-2025-0303", title: "City Hall HVAC Filter Replacement", dept: "General Government", priority: "low", status: "resolved", assignee: "Jim Torres", location: "City Hall, 111 W 7th St", created: "2025-02-10 09:00", iotAlert: null, sensorId: null },
];

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical:  { color: "oklch(0.50 0.22 25)",  label: "Critical" },
  emergency: { color: "oklch(0.50 0.22 25)",  label: "Emergency" },
  high:      { color: "oklch(0.55 0.18 75)",  label: "High" },
  normal:    { color: "oklch(0.40 0.18 240)", label: "Normal" },
  medium:    { color: "oklch(0.40 0.18 240)", label: "Medium" },
  low:       { color: "oklch(0.45 0.18 145)", label: "Low" },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  in_progress: { color: "oklch(0.55 0.18 75)",  label: "In Progress" },
  "in-progress": { color: "oklch(0.55 0.18 75)", label: "In Progress" },
  open:        { color: "oklch(0.50 0.22 25)",  label: "Open" },
  scheduled:   { color: "oklch(0.40 0.18 240)", label: "Scheduled" },
  resolved:    { color: "oklch(0.45 0.18 145)", label: "Resolved" },
  complete:    { color: "oklch(0.45 0.18 145)", label: "Complete" },
  cancelled:   { color: "oklch(0.52 0.010 250)", label: "Cancelled" },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  open:        ["in_progress", "cancelled"],
  in_progress: ["resolved", "open"],
  in_progress_dash: ["resolved", "open"],
  scheduled:   ["in_progress", "open"],
  resolved:    [],
  complete:    [],
  cancelled:   [],
};

const STAFF_ROSTER = [
  "Mayor Jill Dodds",
  "City Admin Mark Stutzman",
  "Finance Director Lisa Yoder",
  "Police Chief Dan Striegel",
  "Public Works Dir. Tom Ruiz",
  "Parks Director Sarah Chen",
  "City Clerk Maria Gonzalez",
  "IT Director James Park",
  "Dave Kline",
  "Mike Hanson",
  "Jim Torres",
  "Unassigned",
];

export default function OperationsCenter() {
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // Fetch live DB work orders
  const { data: dbOrders, refetch } = trpc.workOrders.list.useQuery({ limit: 200 }, { refetchInterval: 30_000 });
  const updateStatusMutation = trpc.workOrders.updateStatus.useMutation({
    onSuccess: () => { refetch(); },
    onError: (err) => toast.error(`Update failed: ${err.message}`),
    onSettled: () => setUpdatingId(null),
  });
  const updateAssigneeMutation = trpc.workOrders.updateAssignee.useMutation({
    onSuccess: () => { refetch(); toast.success("Assignee updated"); },
    onError: (err) => toast.error(`Reassign failed: ${err.message}`),
    onSettled: () => setAssigningId(null),
  });

  // Merge DB orders (shown first, tagged with source) with seed orders
  const allOrders = useMemo(() => {
    const db = (dbOrders ?? []).map(o => ({
      id: o.woNumber,
      title: o.title,
      dept: o.sensorName ? `IoT — ${o.sensorName}` : "Operations",
      priority: o.priority,
      status: o.status,
      assignee: o.assignee,
      location: o.sensorName ?? "West Liberty, IA",
      created: new Date(o.createdAt).toLocaleString(),
      iotAlert: o.description ? o.description.slice(0, 80) : null,
      sensorId: o.sensorId,
      isLive: true,
    }));
    const seed = SEED_ORDERS.map(o => ({ ...o, isLive: false }));
    return [...db, ...seed];
  }, [dbOrders]);

  const filtered = useMemo(() => {
    if (filter === "all") return allOrders;
    return allOrders.filter(w =>
      w.status === filter ||
      w.status === filter.replace("-", "_") ||
      w.priority === filter
    );
  }, [allOrders, filter]);

  const criticalCount = allOrders.filter(w => (w.priority === "critical" || w.priority === "emergency") && w.status !== "resolved" && w.status !== "complete").length;
  const openCount = allOrders.filter(w => w.status === "open").length;
  const iotCount = allOrders.filter(w => w.iotAlert && w.status !== "resolved" && w.status !== "complete").length;
  const resolvedCount = allOrders.filter(w => w.status === "resolved" || w.status === "complete").length;
  const liveCount = (dbOrders ?? []).length;

  return (
    <DashboardLayout title="Operations Center">
      <div className="p-6 space-y-5">

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Critical / Emergency", value: criticalCount, color: "oklch(0.50 0.22 25)", icon: AlertTriangle },
            { label: "Open (Unassigned)", value: openCount, color: "oklch(0.55 0.18 75)", icon: Clock },
            { label: "IoT-Triggered", value: iotCount, color: "oklch(0.40 0.18 240)", icon: Wrench },
            { label: "Resolved (All Time)", value: resolvedCount, color: "oklch(0.45 0.18 145)", icon: CheckCircle2 },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-lg" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
              <stat.icon className="w-4 h-4 mb-2" style={{ color: stat.color }} />
              <div className="text-2xl font-black" style={{ color: stat.color, fontFamily: "'Syne', sans-serif" }}>{stat.value}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Live DB badge + filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {liveCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded"
              style={{ background: "oklch(0.42 0.18 145 / 12%)", color: "oklch(0.38 0.18 145)", border: "1px solid oklch(0.42 0.18 145 / 30%)" }}>
              <Database className="w-3 h-3" /> {liveCount} Live DB Orders
            </span>
          )}
          {["all", "critical", "open", "in_progress", "resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 rounded text-xs font-medium capitalize transition-all"
              style={{
                background: filter === f ? "oklch(0.45 0.20 240 / 15%)" : "oklch(1 0 0)",
                border: `1px solid ${filter === f ? "oklch(0.45 0.20 240 / 30%)" : "oklch(0 0 0 / 8%)"}`,
                color: filter === f ? "oklch(0.40 0.18 240)" : "oklch(0.45 0.012 250)",
              }}
            >
              {f.replace("_", " ")}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
            style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)", color: "oklch(0.45 0.010 250)" }}
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <Link href="/map">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
              style={{ background: "oklch(0.45 0.20 240)", color: "oklch(1 0 0)" }}
            >
              <Plus className="w-3.5 h-3.5" /> New from Sensor
            </button>
          </Link>
        </div>

        {/* Work orders table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0 0 0 / 8%)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "oklch(0.97 0.003 240)", borderBottom: "1px solid oklch(0 0 0 / 8%)" }}>
                  {["", "ID", "Title", "Priority", "Status", "Assignee", "IoT Alert", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold tracking-widest uppercase" style={{ color: "oklch(0.52 0.010 250)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-xs" style={{ color: "oklch(0.52 0.010 250)" }}>
                      No work orders match this filter.
                    </td>
                  </tr>
                )}
                {filtered.map((wo) => {
                  const pri = PRIORITY_CONFIG[wo.priority] ?? PRIORITY_CONFIG.normal;
                  const sta = STATUS_CONFIG[wo.status] ?? STATUS_CONFIG.open;
                  const transitions = STATUS_TRANSITIONS[wo.status] ?? STATUS_TRANSITIONS[wo.status.replace("-", "_")] ?? [];
                  const isUpdating = updatingId === wo.id;

                  return (
                    <tr key={wo.id} className="border-b transition-colors hover:bg-[oklch(0.975_0.003_240)]"
                      style={{ background: wo.isLive ? "oklch(0.42 0.18 145 / 3%)" : "oklch(0.985 0.003 240)", borderColor: "oklch(0 0 0 / 6%)" }}>

                      {/* Source indicator */}
                      <td className="px-2 py-2.5 w-6">
                        {wo.isLive && (
                          <span title="Live DB order" style={{ color: "oklch(0.42 0.18 145)" }}>
                            <Database className="w-3 h-3" />
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: "oklch(0.48 0.012 250)" }}>{wo.id}</td>

                      <td className="px-3 py-2.5 max-w-[200px]">
                        <div className="font-medium text-xs truncate" style={{ color: "oklch(0.22 0.018 250)" }}>{wo.title}</div>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] truncate" style={{ color: "oklch(0.48 0.012 250)" }}>
                          <MapPin className="w-2.5 h-2.5 shrink-0" />{wo.location}
                        </div>
                        {wo.sensorId && (
                          <Link href={`/map/sensor/${wo.sensorId}`}>
                            <span className="text-[9px] underline cursor-pointer" style={{ color: "oklch(0.45 0.20 240)" }}>
                              View Sensor →
                            </span>
                          </Link>
                        )}
                      </td>

                      <td className="px-3 py-2.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                          style={{ background: `${pri.color} / 12%`.replace(" / 12%", "").replace("oklch(", "oklch(").replace(")", " / 12%)"), color: pri.color }}>
                          {pri.label}
                        </span>
                      </td>

                      <td className="px-3 py-2.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                          style={{ background: `${sta.color.replace(")", " / 12%)")}`, color: sta.color }}>
                          {sta.label}
                        </span>
                      </td>

                      <td className="px-3 py-2.5">
                        {wo.isLive ? (
                          <div className="flex items-center gap-1">
                            <User className="w-2.5 h-2.5 shrink-0" style={{ color: wo.assignee === "Unassigned" ? "oklch(0.50 0.22 25)" : "oklch(0.45 0.012 250)" }} />
                            <select
                              value={wo.assignee}
                              disabled={assigningId === wo.id}
                              onChange={(e) => {
                                setAssigningId(wo.id);
                                updateAssigneeMutation.mutate({ woNumber: wo.id, assignee: e.target.value });
                              }}
                              className="text-[9px] rounded border px-1 py-0.5 cursor-pointer"
                              style={{
                                background: "oklch(0.97 0.003 240)",
                                border: "1px solid oklch(0 0 0 / 12%)",
                                color: wo.assignee === "Unassigned" ? "oklch(0.50 0.22 25)" : "oklch(0.30 0.012 250)",
                                maxWidth: "120px",
                              }}
                            >
                              {STAFF_ROSTER.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px]"
                            style={{ color: wo.assignee === "Unassigned" ? "oklch(0.50 0.22 25)" : "oklch(0.45 0.012 250)" }}>
                            <User className="w-2.5 h-2.5" />{wo.assignee}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-2.5 max-w-[160px]">
                        {wo.iotAlert && (
                          <div className="text-[9px] leading-tight line-clamp-2" style={{ color: "oklch(0.40 0.18 240)" }}>
                            {wo.iotAlert}
                          </div>
                        )}
                      </td>

                      {/* Status update actions (only for live DB orders) */}
                      <td className="px-3 py-2.5">
                        {wo.isLive && transitions.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            {transitions.map(next => {
                              const nextCfg = STATUS_CONFIG[next] ?? STATUS_CONFIG.open;
                              return (
                                <button
                                  key={next}
                                  disabled={isUpdating}
                                  onClick={() => {
                                    setUpdatingId(wo.id);
                                    updateStatusMutation.mutate({
                                      woNumber: wo.id,
                                      status: next as "open" | "in_progress" | "resolved" | "cancelled",
                                    });
                                    toast.success(`Work order ${wo.id} → ${nextCfg.label}`);
                                  }}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all disabled:opacity-50"
                                  style={{ background: `${nextCfg.color.replace(")", " / 12%)")}`, color: nextCfg.color, border: `1px solid ${nextCfg.color.replace(")", " / 25%)")}` }}
                                >
                                  {isUpdating ? "…" : `→ ${nextCfg.label}`}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <button
                            onClick={() => toast.info(`Work order ${wo.id} — ${wo.isLive ? "status is final" : "static seed order"}`)}
                            className="px-2 py-1 rounded text-[10px] font-semibold"
                            style={{ background: "oklch(0.45 0.20 240 / 12%)", color: "oklch(0.40 0.18 240)", border: "1px solid oklch(0.58 0.20 240 / 25%)" }}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-[11px] text-center py-1" style={{ color: "oklch(0.60 0.010 250)" }}>
          Operations Center — City of West Liberty, IA · <Database className="inline w-3 h-3" /> Live orders from Postgres · Static seed orders shown below
        </div>
      </div>
    </DashboardLayout>
  );
}
