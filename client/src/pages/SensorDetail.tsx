/**
 * SensorDetail — /map/sensor/:id
 * IoT sensor drill-down page with 24-hour telemetry sparkline,
 * audit log history filtered by sensor ID, and a pre-filled work order form.
 *
 * Design: Civic Intelligence Light
 */
import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowLeft, Activity, AlertTriangle, CheckCircle2, Clock, Wifi,
  WifiOff, MapPin, Cpu, Wrench, FileText, ChevronRight, RefreshCw,
  Thermometer, Droplets, Gauge, Zap, Shield, Layers, Database
} from "lucide-react";
import { useIoTSensors, SensorReading } from "@/hooks/useIoTSensors";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

// ─── Generate synthetic 24-hour telemetry history ────────────────────────────
function generateTelemetryHistory(sensor: SensorReading) {
  const now = Date.now();
  const points: { time: string; value: number; status: string }[] = [];
  for (let i = 23; i >= 0; i--) {
    const ts = new Date(now - i * 3600 * 1000);
    const hour = ts.getHours();
    const label = ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    let base = 0;
    let range = 5;
    let statusThresholdWarn = 0;
    let statusThresholdAlert = 0;

    switch (sensor.type) {
      case "water":
        base = sensor.id.includes("VALVE") ? 70 : 45;
        range = 8;
        statusThresholdWarn = 60;
        statusThresholdAlert = 50;
        break;
      case "sewer":
        base = sensor.id.includes("GAS") ? 18 : 40;
        range = sensor.id.includes("GAS") ? 2 : 12;
        statusThresholdWarn = sensor.id.includes("GAS") ? 22 : 65;
        statusThresholdAlert = sensor.id.includes("GAS") ? 25 : 80;
        break;
      case "roads":
        base = sensor.id.includes("STORM") ? 25 : 0.006;
        range = sensor.id.includes("STORM") ? 20 : 0.002;
        statusThresholdWarn = sensor.id.includes("STORM") ? 60 : 0.007;
        statusThresholdAlert = sensor.id.includes("STORM") ? 75 : 0.009;
        break;
      case "parks":
        base = sensor.id.includes("PARK-001") ? 15 : 35;
        range = sensor.id.includes("PARK-001") ? 10 : 8;
        statusThresholdWarn = 0;
        statusThresholdAlert = 0;
        break;
      case "le":
        base = 68;
        range = 2;
        statusThresholdWarn = 75;
        statusThresholdAlert = 80;
        break;
    }

    // Simulate a spike event between hours 6-10 (morning rush)
    const isMorningRush = hour >= 6 && hour <= 10;
    const spikeMultiplier = isMorningRush ? 1.2 : 1.0;
    const noise = (Math.random() - 0.5) * range * 2 * spikeMultiplier;
    const value = parseFloat((base + noise).toFixed(3));

    let status = "online";
    if (statusThresholdAlert > 0 && value >= statusThresholdAlert) status = "alert";
    else if (statusThresholdWarn > 0 && value >= statusThresholdWarn) status = "warning";

    points.push({ time: label, value, status });
  }
  return points;
}

// ─── Sensor type metadata ─────────────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; unit: string; icon: React.ElementType; color: string }> = {
  water:  { label: "Water Infrastructure", unit: "PSI",  icon: Droplets,    color: "#2563eb" },
  sewer:  { label: "Sewer / Gas",          unit: "PSI",  icon: Gauge,       color: "#7c3aed" },
  roads:  { label: "Roads & Drainage",     unit: "%",    icon: Layers,      color: "#059669" },
  parks:  { label: "Parks & Recreation",   unit: "dB",   icon: Thermometer, color: "#16a34a" },
  le:     { label: "Law Enforcement",      unit: "°F",   icon: Shield,      color: "#dc2626" },
};

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  online:  { bg: "oklch(0.42 0.18 145 / 12%)", text: "oklch(0.38 0.18 145)", border: "oklch(0.42 0.18 145 / 30%)", label: "ONLINE" },
  warning: { bg: "oklch(0.55 0.18 75 / 12%)",  text: "oklch(0.50 0.18 75)",  border: "oklch(0.55 0.18 75 / 30%)",  label: "WARNING" },
  alert:   { bg: "oklch(0.55 0.22 25 / 12%)",  text: "oklch(0.48 0.22 25)",  border: "oklch(0.55 0.22 25 / 30%)",  label: "ALERT" },
  offline: { bg: "oklch(0 0 0 / 6%)",           text: "oklch(0.52 0.010 250)", border: "oklch(0 0 0 / 12%)",         label: "OFFLINE" },
};

// ─── Work Order form ──────────────────────────────────────────────────────────
interface WorkOrderForm {
  title: string;
  priority: "low" | "normal" | "high" | "critical";
  assignee: string;
  description: string;
  estimatedHours: string;
}

export default function SensorDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { sensors, wsStatus } = useIoTSensors();
  const { auditLog, actorName } = useAuth();

  const sensor = useMemo(() => sensors.find(s => s.id === id), [sensors, id]);

  // Fetch real 24h readings from Postgres; fall back to synthetic if empty
  const { data: dbReadings, isLoading: readingsLoading } = trpc.sensorReadings.getLast24h.useQuery(
    { sensorId: id ?? "" },
    { enabled: !!id, refetchInterval: 30_000 }
  );

  const telemetry = useMemo(() => {
    if (dbReadings && dbReadings.length >= 5) {
      // DB readings are newest-first; reverse for chart (oldest → newest)
      return [...dbReadings].reverse().map(r => ({
        time: new Date(r.ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        value: parseFloat(r.value) || 0,
        status: r.status,
      }));
    }
    return sensor ? generateTelemetryHistory(sensor) : [];
  }, [dbReadings, sensor?.id]);

  const telemetrySource = dbReadings && dbReadings.length >= 5 ? "live" : "simulated";

  // Filter audit log for this sensor
  const sensorAuditHistory = useMemo(() =>
    auditLog.filter(e =>
      e.category === "iot" &&
      (e.target.includes(id ?? "") || e.target.toLowerCase().includes(sensor?.name?.toLowerCase() ?? "____"))
    ).slice(0, 20),
    [auditLog, id, sensor?.name]
  );

  // Work order form state
  const [showWorkOrder, setShowWorkOrder] = useState(false);
  const [workOrder, setWorkOrder] = useState<WorkOrderForm>({
    title: "",
    priority: "normal",
    assignee: "Marcus Webb (Public Works)",
    description: "",
    estimatedHours: "2",
  });
  const [workOrderSubmitted, setWorkOrderSubmitted] = useState(false);
  const [submittedWoNumber, setSubmittedWoNumber] = useState<string | null>(null);

  const createWorkOrderMutation = trpc.workOrders.create.useMutation({
    onSuccess: (data) => {
      setSubmittedWoNumber(data.woNumber);
      setWorkOrderSubmitted(true);
      setShowWorkOrder(false);
      toast.success(`Work order ${data.woNumber} created and assigned to ${workOrder.assignee}`);
    },
    onError: (err) => {
      toast.error(`Failed to create work order: ${err.message}`);
    },
  });

  // Fetch existing work orders for this sensor
  const { data: sensorWorkOrders } = trpc.workOrders.bySensor.useQuery(
    { sensorId: id ?? "" },
    { enabled: !!id }
  );

  // Pre-fill work order when sensor loads
  useEffect(() => {
    if (sensor) {
      const priority: WorkOrderForm["priority"] =
        sensor.status === "alert" ? "critical" :
        sensor.status === "warning" ? "high" : "normal";
      setWorkOrder(prev => ({
        ...prev,
        title: sensor.alert
          ? `[${sensor.status.toUpperCase()}] ${sensor.name} — ${sensor.alert.slice(0, 60)}`
          : `Inspection: ${sensor.name}`,
        priority,
        description: sensor.alert
          ? `Automated work order from IoT alert.\n\nSensor: ${sensor.id}\nLocation: ${sensor.address}\nDevice: ${sensor.device}\nCurrent reading: ${sensor.reading}\nAlert: ${sensor.alert}`
          : `Routine inspection for ${sensor.name}.\n\nSensor: ${sensor.id}\nLocation: ${sensor.address}\nDevice: ${sensor.device}\nCurrent reading: ${sensor.reading}`,
      }));
    }
  }, [sensor?.id, sensor?.status]);

  const submitWorkOrder = () => {
    if (!workOrder.title.trim()) { toast.error("Work order title is required"); return; }
    createWorkOrderMutation.mutate({
      title: workOrder.title,
      priority: workOrder.priority,
      sensorId: sensor?.id,
      sensorName: sensor?.name,
      assignee: workOrder.assignee,
      description: workOrder.description,
      estimatedHours: workOrder.estimatedHours,
      createdBy: actorName ?? "System",
    });
  };

  if (!sensor) {
    return (
      <DashboardLayout title="Sensor Not Found">
        <div className="p-6 flex flex-col items-center justify-center h-64 gap-4">
          <WifiOff className="w-10 h-10" style={{ color: "oklch(0.52 0.010 250)" }} />
          <div className="text-sm font-semibold" style={{ color: "oklch(0.35 0.018 250)" }}>
            Sensor <span className="font-mono">{id}</span> not found
          </div>
          <button
            onClick={() => navigate("/map")}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold"
            style={{ background: "oklch(0.45 0.20 240)", color: "oklch(1 0 0)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Spatial Map
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const meta = TYPE_META[sensor.type] ?? TYPE_META.water;
  const statusStyle = STATUS_STYLE[sensor.status] ?? STATUS_STYLE.online;
  const TypeIcon = meta.icon;

  // Sparkline color based on status
  const sparkColor = sensor.status === "alert" ? "#dc2626" : sensor.status === "warning" ? "#d97706" : "#2563eb";

  return (
    <DashboardLayout title={`Sensor — ${sensor.name}`}>
      <div className="p-6 space-y-5">

        {/* Back nav */}
        <button
          onClick={() => navigate("/map")}
          className="flex items-center gap-1.5 text-xs font-medium transition-all"
          style={{ color: "oklch(0.45 0.20 240)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Spatial Map
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TypeIcon className="w-4 h-4" style={{ color: meta.color }} />
              <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: meta.color, fontFamily: "'JetBrains Mono', monospace" }}>
                {meta.label}
              </span>
            </div>
            <h1 className="text-2xl font-black" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
              {sensor.name}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="font-mono text-[11px]" style={{ color: "oklch(0.52 0.010 250)" }}>{sensor.id}</span>
              <span className="text-[10px]" style={{ color: "oklch(0.65 0.010 250)" }}>·</span>
              <MapPin className="w-3 h-3" style={{ color: "oklch(0.52 0.010 250)" }} />
              <span className="text-[11px]" style={{ color: "oklch(0.52 0.010 250)" }}>{sensor.address}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold"
              style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}
            >
              {sensor.status === "online" ? <CheckCircle2 className="w-3 h-3" /> :
               sensor.status === "offline" ? <WifiOff className="w-3 h-3" /> :
               <AlertTriangle className="w-3 h-3" />}
              {statusStyle.label}
            </span>
            <span
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono"
              style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)", color: "oklch(0.52 0.010 250)" }}
            >
              <Wifi className="w-2.5 h-2.5" />
              {wsStatus === "connected" ? "WS LIVE" : wsStatus === "simulation" ? "SIM" : wsStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Alert banner */}
        {sensor.alert && (
          <div
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{
              background: sensor.status === "alert" ? "oklch(0.55 0.22 25 / 8%)" : "oklch(0.55 0.18 75 / 8%)",
              border: `1px solid ${sensor.status === "alert" ? "oklch(0.55 0.22 25 / 25%)" : "oklch(0.55 0.18 75 / 25%)"}`,
            }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: sensor.status === "alert" ? "oklch(0.48 0.22 25)" : "oklch(0.50 0.18 75)" }} />
            <div>
              <div className="text-xs font-bold mb-0.5" style={{ color: sensor.status === "alert" ? "oklch(0.48 0.22 25)" : "oklch(0.50 0.18 75)" }}>
                Active Alert
              </div>
              <div className="text-[11px]" style={{ color: "oklch(0.35 0.018 250)" }}>{sensor.alert}</div>
            </div>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Current Reading", value: sensor.reading.split("|")[0].trim(), icon: Activity, color: meta.color },
            { label: "Device", value: sensor.device, icon: Cpu, color: "oklch(0.45 0.20 240)" },
            { label: "Last Seen", value: sensor.lastSeen, icon: Clock, color: "oklch(0.55 0.18 75)" },
            { label: "Coordinates", value: `${sensor.lat.toFixed(4)}, ${sensor.lng.toFixed(4)}`, icon: MapPin, color: "oklch(0.42 0.18 145)" },
          ].map(kpi => (
            <div key={kpi.label} className="p-3 rounded-xl" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
              <kpi.icon className="w-3.5 h-3.5 mb-1.5" style={{ color: kpi.color }} />
              <div className="text-[10px] font-mono truncate" style={{ color: "oklch(0.18 0.018 250)" }}>{kpi.value}</div>
              <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* 24-hour telemetry sparkline */}
        <div className="rounded-xl p-4" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" style={{ color: sparkColor }} />
              <h2 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                24-Hour Telemetry
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "oklch(0.965 0.005 240)", color: "oklch(0.52 0.010 250)" }}>
              {meta.unit} · {telemetrySource === "live" ? (
                <span className="inline-flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" /> Live DB
                </span>
              ) : "Simulated history"}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={telemetry} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sparkColor} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={sparkColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 5%)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: "oklch(0.55 0.010 250)" }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "oklch(0.55 0.010 250)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid oklch(0 0 0 / 10%)" }}
                labelStyle={{ color: "oklch(0.35 0.018 250)", fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={sparkColor}
                strokeWidth={2}
                fill="url(#sparkGrad)"
                dot={false}
                activeDot={{ r: 4, fill: sparkColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Audit history */}
          <div className="rounded-xl p-4" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-3.5 h-3.5" style={{ color: "oklch(0.45 0.20 240)" }} />
              <h2 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                Alert History
              </h2>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "oklch(0.45 0.20 240 / 10%)", color: "oklch(0.40 0.18 240)", border: "1px solid oklch(0.45 0.20 240 / 20%)" }}>
                {sensorAuditHistory.length} entries
              </span>
            </div>
            {sensorAuditHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-28 gap-2">
                <CheckCircle2 className="w-6 h-6" style={{ color: "oklch(0.42 0.18 145)" }} />
                <span className="text-[11px]" style={{ color: "oklch(0.52 0.010 250)" }}>No alerts recorded for this sensor</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {sensorAuditHistory.map(entry => {
                  const sev = entry.severity;
                  const sevColor = sev === "critical" ? "oklch(0.48 0.22 25)" : sev === "warning" ? "oklch(0.50 0.18 75)" : "oklch(0.42 0.18 145)";
                  return (
                    <div key={entry.id} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 5%)" }}>
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: sevColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold truncate" style={{ color: "oklch(0.18 0.018 250)" }}>{entry.action}</div>
                        <div className="text-[9px] truncate" style={{ color: "oklch(0.52 0.010 250)" }}>{entry.detail}</div>
                        <div className="text-[9px] font-mono mt-0.5" style={{ color: "oklch(0.60 0.010 250)" }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Work order panel */}
          <div className="rounded-xl p-4" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.18 75)" }} />
                <h2 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Create Work Order
                </h2>
              </div>
              {workOrderSubmitted && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "oklch(0.42 0.18 145 / 12%)", color: "oklch(0.38 0.18 145)", border: "1px solid oklch(0.42 0.18 145 / 30%)" }}>
                  <CheckCircle2 className="w-3 h-3" /> Submitted
                </span>
              )}
            </div>

            {!showWorkOrder && !workOrderSubmitted ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <Wrench className="w-8 h-8" style={{ color: "oklch(0.65 0.010 250)" }} />
                <p className="text-[11px] text-center" style={{ color: "oklch(0.52 0.010 250)" }}>
                  {sensor.alert
                    ? "This sensor has an active alert. Create a work order to dispatch a crew."
                    : "Schedule a routine inspection or maintenance task for this sensor."}
                </p>
                <button
                  onClick={() => setShowWorkOrder(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: sensor.status === "alert" ? "oklch(0.55 0.22 25)" : "oklch(0.45 0.20 240)",
                    color: "oklch(1 0 0)",
                  }}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  {sensor.alert ? "Create Alert Work Order" : "Create Work Order"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : workOrderSubmitted ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <CheckCircle2 className="w-8 h-8" style={{ color: "oklch(0.42 0.18 145)" }} />
                <p className="text-[11px] text-center" style={{ color: "oklch(0.52 0.010 250)" }}>
                  Work order {submittedWoNumber} created and assigned to {workOrder.assignee}.
                </p>
                <button
                  onClick={() => { setWorkOrderSubmitted(false); setShowWorkOrder(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
                  style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)", color: "oklch(0.45 0.010 250)" }}
                >
                  <RefreshCw className="w-3 h-3" /> New Work Order
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Title */}
                <div>
                  <label className="text-[10px] font-bold mb-1 block" style={{ color: "oklch(0.35 0.018 250)" }}>Title</label>
                  <input
                    value={workOrder.title}
                    onChange={e => setWorkOrder(p => ({ ...p, title: e.target.value }))}
                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg outline-none"
                    style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.18 0.018 250)" }}
                  />
                </div>
                {/* Priority + Assignee */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold mb-1 block" style={{ color: "oklch(0.35 0.018 250)" }}>Priority</label>
                    <select
                      value={workOrder.priority}
                      onChange={e => setWorkOrder(p => ({ ...p, priority: e.target.value as WorkOrderForm["priority"] }))}
                      className="w-full text-[11px] px-2 py-1.5 rounded-lg outline-none"
                      style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.18 0.018 250)" }}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold mb-1 block" style={{ color: "oklch(0.35 0.018 250)" }}>Est. Hours</label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={workOrder.estimatedHours}
                      onChange={e => setWorkOrder(p => ({ ...p, estimatedHours: e.target.value }))}
                      className="w-full text-[11px] px-2.5 py-1.5 rounded-lg outline-none"
                      style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.18 0.018 250)" }}
                    />
                  </div>
                </div>
                {/* Assignee */}
                <div>
                  <label className="text-[10px] font-bold mb-1 block" style={{ color: "oklch(0.35 0.018 250)" }}>Assign To</label>
                  <select
                    value={workOrder.assignee}
                    onChange={e => setWorkOrder(p => ({ ...p, assignee: e.target.value }))}
                    className="w-full text-[11px] px-2 py-1.5 rounded-lg outline-none"
                    style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.18 0.018 250)" }}
                  >
                    <option>Marcus Webb (Public Works)</option>
                    <option>Priya Nair (IT)</option>
                    <option>Tom Harrington (Parks)</option>
                    <option>Chief James Doyle (Police)</option>
                    <option>Leigh Ann Erickson (Admin)</option>
                  </select>
                </div>
                {/* Description */}
                <div>
                  <label className="text-[10px] font-bold mb-1 block" style={{ color: "oklch(0.35 0.018 250)" }}>Description</label>
                  <textarea
                    value={workOrder.description}
                    onChange={e => setWorkOrder(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full text-[11px] px-2.5 py-1.5 rounded-lg outline-none resize-none"
                    style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.18 0.018 250)" }}
                  />
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowWorkOrder(false)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)", color: "oklch(0.45 0.010 250)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitWorkOrder}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                    style={{ background: "oklch(0.45 0.20 240)", color: "oklch(1 0 0)" }}
                  >
                    <Zap className="w-3 h-3" /> Submit Work Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-[11px] text-center py-2" style={{ color: "oklch(0.60 0.010 250)" }}>
          IoT Sensor Detail — City of West Liberty, IA · {sensor.id} · {sensor.device}
        </div>
      </div>
    </DashboardLayout>
  );
}
