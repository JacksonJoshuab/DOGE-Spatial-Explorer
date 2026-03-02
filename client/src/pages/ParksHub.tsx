/**
 * ParksHub — Civic Intelligence Light
 * Parks & Recreation operations: facility reservations, IrriSmart soil sensors,
 * TrailCam wildlife/safety alerts, and maintenance work orders for
 * Wildcat Park and West Liberty Community Center.
 */
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Trees, Calendar, Droplets, Camera, Wrench, MapPin,
  AlertTriangle, CheckCircle2, Clock, Leaf, Thermometer,
  Wind, Sun, CloudRain, Users, Building2, Plus, Eye
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// ── IrriSmart soil sensor data ──────────────────────────────────────────────
const SOIL_SENSORS = [
  {
    id: "IS-001", zone: "Wildcat Park — Baseball Diamond", status: "optimal",
    moisture: 62, temp: 68, ph: 6.8, nitrogen: 42, lastReading: "4 min ago",
    recommendation: "No irrigation needed", nextSchedule: "Tomorrow 6:00 AM",
    coords: "41.5748°N 91.2641°W",
  },
  {
    id: "IS-002", zone: "Wildcat Park — Soccer Field A", status: "dry",
    moisture: 28, temp: 71, ph: 6.5, nitrogen: 38, lastReading: "4 min ago",
    recommendation: "Irrigate 0.5 in — soil moisture below 30% threshold",
    nextSchedule: "Today 8:00 PM (triggered)", coords: "41.5752°N 91.2638°W",
  },
  {
    id: "IS-003", zone: "Wildcat Park — Soccer Field B", status: "optimal",
    moisture: 55, temp: 69, ph: 6.9, nitrogen: 45, lastReading: "5 min ago",
    recommendation: "No irrigation needed", nextSchedule: "Tomorrow 6:00 AM",
    coords: "41.5755°N 91.2635°W",
  },
  {
    id: "IS-004", zone: "Community Center — Front Lawn", status: "saturated",
    moisture: 88, temp: 66, ph: 7.1, nitrogen: 51, lastReading: "3 min ago",
    recommendation: "Skip irrigation — soil saturated from recent rain",
    nextSchedule: "Paused 48 hrs", coords: "41.5739°N 91.2629°W",
  },
  {
    id: "IS-005", zone: "Community Center — Courtyard", status: "optimal",
    moisture: 58, temp: 67, ph: 6.7, nitrogen: 44, lastReading: "4 min ago",
    recommendation: "No irrigation needed", nextSchedule: "Tomorrow 6:00 AM",
    coords: "41.5737°N 91.2631°W",
  },
  {
    id: "IS-006", zone: "Wildcat Park — Playground Buffer", status: "dry",
    moisture: 24, temp: 73, ph: 6.4, nitrogen: 35, lastReading: "6 min ago",
    recommendation: "Irrigate 0.75 in — critical dry threshold reached",
    nextSchedule: "Today 7:30 PM (triggered)", coords: "41.5745°N 91.2644°W",
  },
];

const MOISTURE_TREND = [
  { time: "6AM", IS001: 58, IS002: 45, IS003: 52 },
  { time: "9AM", IS001: 60, IS002: 38, IS003: 54 },
  { time: "12PM", IS001: 63, IS002: 32, IS003: 56 },
  { time: "3PM", IS001: 61, IS002: 29, IS003: 55 },
  { time: "6PM", IS001: 62, IS002: 28, IS003: 55 },
];

// ── TrailCam events ──────────────────────────────────────────────────────────
const TRAILCAM_EVENTS = [
  {
    id: "TC-2847", camera: "TC-North Trail", location: "Wildcat Park N. Entrance",
    time: "Today 5:42 PM", type: "wildlife", severity: "info",
    description: "White-tailed deer — 2 adults, 1 fawn detected on north trail",
    action: "Logged", imageRef: "Frame #4821",
  },
  {
    id: "TC-2846", camera: "TC-Parking Lot A", location: "Wildcat Park Main Lot",
    time: "Today 3:17 PM", type: "safety", severity: "warning",
    description: "Unattended vehicle parked in fire lane — 45+ minutes",
    action: "Dispatch notified", imageRef: "Frame #4819",
  },
  {
    id: "TC-2845", camera: "TC-Shelter House", location: "Wildcat Park Pavilion",
    time: "Today 1:05 PM", type: "safety", severity: "info",
    description: "Pavilion reservation confirmed — Hernandez family reunion (47 guests)",
    action: "Logged", imageRef: "Frame #4816",
  },
  {
    id: "TC-2844", camera: "TC-Community Ctr Rear", location: "Community Center Back",
    time: "Today 11:22 AM", type: "safety", severity: "critical",
    description: "Unauthorized access attempt — rear service door after hours",
    action: "PD alerted — Officer Ramirez responded", imageRef: "Frame #4814",
  },
  {
    id: "TC-2843", camera: "TC-Pond Trail", location: "Wildcat Park Pond Loop",
    time: "Today 7:15 AM", type: "wildlife", severity: "info",
    description: "Great blue heron nesting activity — conservation note logged",
    action: "Logged", imageRef: "Frame #4812",
  },
  {
    id: "TC-2842", camera: "TC-Playground", location: "Wildcat Park Playground",
    time: "Yesterday 6:48 PM", type: "safety", severity: "warning",
    description: "Vandalism detected — graffiti on east fence panel",
    action: "Work order WO-2024-0891 created", imageRef: "Frame #4810",
  },
];

// ── Facility reservations ────────────────────────────────────────────────────
const RESERVATIONS = [
  {
    id: "RES-0441", facility: "Wildcat Park — Pavilion A", date: "Mar 8, 2026",
    time: "10:00 AM – 4:00 PM", group: "Hernandez Family Reunion", guests: 47,
    status: "confirmed", deposit: "$75", contact: "Maria Hernandez",
  },
  {
    id: "RES-0442", facility: "Community Center — Main Hall", date: "Mar 10, 2026",
    time: "6:00 PM – 9:00 PM", group: "West Liberty Lions Club", guests: 85,
    status: "confirmed", deposit: "$150", contact: "Tom Kessler",
  },
  {
    id: "RES-0443", facility: "Wildcat Park — Baseball Diamond", date: "Mar 12, 2026",
    time: "5:30 PM – 8:00 PM", group: "WLHS JV Baseball Practice", guests: 22,
    status: "pending", deposit: "Waived (school)", contact: "Coach Alvarez",
  },
  {
    id: "RES-0444", facility: "Community Center — Meeting Room B", date: "Mar 14, 2026",
    time: "9:00 AM – 12:00 PM", group: "Muscatine County Extension", guests: 18,
    status: "confirmed", deposit: "$50", contact: "Jane Stoll",
  },
  {
    id: "RES-0445", facility: "Wildcat Park — Soccer Field A", date: "Mar 15, 2026",
    time: "1:00 PM – 5:00 PM", group: "West Liberty Youth Soccer", guests: 60,
    status: "confirmed", deposit: "Waived (youth)", contact: "Diego Morales",
  },
  {
    id: "RES-0446", facility: "Wildcat Park — Pavilion B", date: "Mar 22, 2026",
    time: "11:00 AM – 3:00 PM", group: "WL Elementary Field Day", guests: 120,
    status: "pending", deposit: "Waived (school)", contact: "Principal Nguyen",
  },
];

// ── Maintenance work orders ──────────────────────────────────────────────────
const WORK_ORDERS = [
  {
    id: "WO-2024-0891", priority: "high", facility: "Wildcat Park — East Fence",
    issue: "Graffiti removal — east fence panel (TrailCam TC-2842)",
    assigned: "Parks Crew B", status: "in-progress", created: "Yesterday",
    due: "Mar 5, 2026", iot: "TrailCam TC-Playground",
  },
  {
    id: "WO-2024-0887", priority: "medium", facility: "Community Center — HVAC",
    issue: "Zone 3 HVAC filter replacement — ParkPulse CO₂ elevated",
    assigned: "Facilities Mgmt", status: "scheduled", created: "Feb 28",
    due: "Mar 6, 2026", iot: "ParkPulse PP-CC-01",
  },
  {
    id: "WO-2024-0882", priority: "high", facility: "Wildcat Park — Irrigation Zone 2",
    issue: "IrriSmart IS-002 soil moisture critically low — valve inspection needed",
    assigned: "Parks Crew A", status: "open", created: "Today",
    due: "Today", iot: "IrriSmart IS-002",
  },
  {
    id: "WO-2024-0879", priority: "low", facility: "Wildcat Park — Playground",
    issue: "Swing set chain replacement — routine inspection finding",
    assigned: "Parks Crew A", status: "open", created: "Feb 27",
    due: "Mar 10, 2026", iot: null,
  },
  {
    id: "WO-2024-0875", priority: "medium", facility: "Community Center — Parking Lot",
    issue: "Pothole repair — 3 locations near main entrance",
    assigned: "Public Works", status: "completed", created: "Feb 24",
    due: "Mar 1, 2026", iot: null,
  },
];

// ── Occupancy data (ParkPulse) ───────────────────────────────────────────────
const OCCUPANCY_DATA = [
  { hour: "6AM", wildcat: 12, commCenter: 5 },
  { hour: "8AM", wildcat: 28, commCenter: 42 },
  { hour: "10AM", wildcat: 65, commCenter: 88 },
  { hour: "12PM", wildcat: 112, commCenter: 95 },
  { hour: "2PM", wildcat: 89, commCenter: 72 },
  { hour: "4PM", wildcat: 134, commCenter: 61 },
  { hour: "6PM", wildcat: 178, commCenter: 48 },
  { hour: "8PM", wildcat: 95, commCenter: 22 },
];

const statusColor: Record<string, string> = {
  optimal: "oklch(0.45 0.18 145)",
  dry: "oklch(0.65 0.20 55)",
  saturated: "oklch(0.45 0.20 240)",
  warning: "oklch(0.65 0.20 55)",
  critical: "oklch(0.55 0.22 25)",
  info: "oklch(0.45 0.18 145)",
  confirmed: "oklch(0.45 0.18 145)",
  pending: "oklch(0.65 0.20 55)",
  "in-progress": "oklch(0.45 0.20 240)",
  open: "oklch(0.65 0.20 55)",
  completed: "oklch(0.45 0.18 145)",
  scheduled: "oklch(0.45 0.20 240)",
  high: "oklch(0.55 0.22 25)",
  medium: "oklch(0.65 0.20 55)",
  low: "oklch(0.45 0.18 145)",
};

function StatusBadge({ status }: { status: string }) {
  const color = statusColor[status] ?? "oklch(0.50 0.010 250)";
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {status}
    </span>
  );
}

export default function ParksHub() {
  const [activeTab, setActiveTab] = useState("sensors");
  const [newWorkOrder, setNewWorkOrder] = useState(false);

  const dryCount = SOIL_SENSORS.filter(s => s.status === "dry").length;
  const alertCount = TRAILCAM_EVENTS.filter(e => e.severity !== "info").length;
  const openWOs = WORK_ORDERS.filter(w => w.status === "open" || w.status === "in-progress").length;
  const todayReservations = RESERVATIONS.filter(r => r.date.includes("Mar 8")).length;

  return (
    <DashboardLayout title="Parks & Recreation Hub">
      <div className="p-6 space-y-6">

        {/* Header KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "IrriSmart Zones", value: "6", sub: `${dryCount} need irrigation`, icon: Droplets, color: "oklch(0.45 0.20 240)" },
            { label: "TrailCam Alerts", value: String(alertCount), sub: "Since midnight", icon: Camera, color: "oklch(0.65 0.20 55)" },
            { label: "Open Work Orders", value: String(openWOs), sub: "Parks & facilities", icon: Wrench, color: dryCount > 0 ? "oklch(0.55 0.22 25)" : "oklch(0.45 0.18 145)" },
            { label: "Today's Reservations", value: String(todayReservations), sub: "Wildcat Park", icon: Calendar, color: "oklch(0.45 0.18 145)" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                  <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: kpi.color, fontFamily: "'JetBrains Mono', monospace" }}>{kpi.value}</div>
              <div className="text-[11px] font-medium mt-0.5" style={{ color: "oklch(0.35 0.014 250)" }}>{kpi.label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Occupancy chart */}
        <div className="rounded-xl border p-5" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                Today's Occupancy — ParkPulse Nodes
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                Real-time visitor counts via ParkPulse occupancy sensors
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full inline-block" style={{ background: "oklch(0.45 0.20 240)" }} /> Wildcat Park</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full inline-block" style={{ background: "oklch(0.45 0.18 145)" }} /> Community Center</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={OCCUPANCY_DATA} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 6%)" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "oklch(0.50 0.010 250)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.50 0.010 250)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 10%)", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="wildcat" name="Wildcat Park" fill="oklch(0.45 0.20 240)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="commCenter" name="Community Center" fill="oklch(0.45 0.18 145)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Main tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="sensors">
              <Droplets className="w-3.5 h-3.5 mr-1.5" />IrriSmart
            </TabsTrigger>
            <TabsTrigger value="trailcam">
              <Camera className="w-3.5 h-3.5 mr-1.5" />TrailCam
              {alertCount > 0 && (
                <span className="ml-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: "oklch(0.65 0.20 55)", color: "white" }}>{alertCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reservations">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />Reservations
            </TabsTrigger>
            <TabsTrigger value="workorders">
              <Wrench className="w-3.5 h-3.5 mr-1.5" />Work Orders
            </TabsTrigger>
          </TabsList>

          {/* IrriSmart Sensors */}
          <TabsContent value="sensors" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  IrriSmart Soil Sensor Network
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                  6 sensors across Wildcat Park and Community Center grounds
                </p>
              </div>
              <div className="text-[11px] font-mono px-2 py-1 rounded" style={{ background: "oklch(0.45 0.18 145 / 10%)", color: "oklch(0.35 0.18 145)" }}>
                Last sync: 4 min ago
              </div>
            </div>

            {/* Moisture trend */}
            <div className="rounded-xl border p-4" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="text-[12px] font-medium mb-3" style={{ color: "oklch(0.35 0.014 250)" }}>Soil Moisture Trend — Today (IS-001, IS-002, IS-003)</div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={MOISTURE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 6%)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "oklch(0.50 0.010 250)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "oklch(0.50 0.010 250)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 10%)", borderRadius: "8px", fontSize: "11px" }} />
                  <Line type="monotone" dataKey="IS001" name="IS-001 Baseball" stroke="oklch(0.45 0.18 145)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="IS002" name="IS-002 Soccer A" stroke="oklch(0.65 0.20 55)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="IS003" name="IS-003 Soccer B" stroke="oklch(0.45 0.20 240)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SOIL_SENSORS.map((sensor) => (
                <div key={sensor.id} className="rounded-xl border p-4" style={{ background: "oklch(1 0 0)", borderColor: sensor.status === "dry" ? "oklch(0.65 0.20 55 / 30%)" : sensor.status === "saturated" ? "oklch(0.45 0.20 240 / 30%)" : "oklch(0 0 0 / 8%)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold" style={{ color: "oklch(0.45 0.010 250)" }}>{sensor.id}</span>
                        <StatusBadge status={sensor.status} />
                      </div>
                      <div className="text-[13px] font-medium mt-0.5" style={{ color: "oklch(0.22 0.018 250)" }}>{sensor.zone}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>
                      <MapPin className="w-3 h-3" />
                      {sensor.coords}
                    </div>
                  </div>

                  {/* Sensor readings */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: "Moisture", value: `${sensor.moisture}%`, icon: Droplets, color: sensor.moisture < 30 ? "oklch(0.65 0.20 55)" : sensor.moisture > 80 ? "oklch(0.45 0.20 240)" : "oklch(0.45 0.18 145)" },
                      { label: "Temp", value: `${sensor.temp}°F`, icon: Thermometer, color: "oklch(0.50 0.010 250)" },
                      { label: "pH", value: String(sensor.ph), icon: Leaf, color: "oklch(0.45 0.18 145)" },
                      { label: "N (ppm)", value: String(sensor.nitrogen), icon: Wind, color: "oklch(0.50 0.010 250)" },
                    ].map((reading) => (
                      <div key={reading.label} className="text-center p-2 rounded-lg" style={{ background: "oklch(0.965 0.005 240)" }}>
                        <reading.icon className="w-3 h-3 mx-auto mb-0.5" style={{ color: reading.color }} />
                        <div className="text-[13px] font-mono font-semibold" style={{ color: reading.color }}>{reading.value}</div>
                        <div className="text-[9px]" style={{ color: "oklch(0.55 0.010 250)" }}>{reading.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Moisture bar */}
                  <div className="mb-2">
                    <Progress
                      value={sensor.moisture}
                      className="h-1.5"
                      style={{ background: "oklch(0.92 0.004 286)" }}
                    />
                  </div>

                  <div className="text-[11px] p-2 rounded-lg" style={{ background: sensor.status === "dry" ? "oklch(0.65 0.20 55 / 8%)" : sensor.status === "saturated" ? "oklch(0.45 0.20 240 / 8%)" : "oklch(0.45 0.18 145 / 8%)", color: statusColor[sensor.status] }}>
                    <strong>Recommendation:</strong> {sensor.recommendation}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>Next: {sensor.nextSchedule}</span>
                    <span className="text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>{sensor.lastReading}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TrailCam Events */}
          <TabsContent value="trailcam" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  TrailCam Wildlife & Safety Events
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                  6 cameras across Wildcat Park and Community Center — last 24 hours
                </p>
              </div>
              <div className="flex gap-2">
                <div className="text-[11px] px-2 py-1 rounded" style={{ background: "oklch(0.55 0.22 25 / 10%)", color: "oklch(0.45 0.22 25)" }}>
                  1 Critical
                </div>
                <div className="text-[11px] px-2 py-1 rounded" style={{ background: "oklch(0.65 0.20 55 / 10%)", color: "oklch(0.50 0.20 55)" }}>
                  2 Warnings
                </div>
              </div>
            </div>

            {TRAILCAM_EVENTS.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border p-4 flex gap-4"
                style={{
                  background: "oklch(1 0 0)",
                  borderColor: event.severity === "critical" ? "oklch(0.55 0.22 25 / 40%)" : event.severity === "warning" ? "oklch(0.65 0.20 55 / 30%)" : "oklch(0 0 0 / 8%)",
                }}
              >
                <div className="flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: event.type === "wildlife" ? "oklch(0.45 0.18 145 / 12%)" : "oklch(0.55 0.22 25 / 12%)" }}
                  >
                    {event.type === "wildlife"
                      ? <Trees className="w-5 h-5" style={{ color: "oklch(0.40 0.18 145)" }} />
                      : <AlertTriangle className="w-5 h-5" style={{ color: event.severity === "critical" ? "oklch(0.50 0.22 25)" : "oklch(0.55 0.20 55)" }} />
                    }
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-semibold" style={{ color: "oklch(0.45 0.010 250)" }}>{event.id}</span>
                    <StatusBadge status={event.severity} />
                    <span className="text-[11px] px-2 py-0.5 rounded capitalize" style={{ background: "oklch(0.965 0.005 240)", color: "oklch(0.50 0.010 250)" }}>{event.type}</span>
                    <span className="text-[11px]" style={{ color: "oklch(0.55 0.010 250)" }}>{event.time}</span>
                  </div>
                  <div className="text-[13px] font-medium mt-1" style={{ color: "oklch(0.22 0.018 250)" }}>{event.description}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                    <span className="flex items-center gap-1" style={{ color: "oklch(0.50 0.010 250)" }}>
                      <Camera className="w-3 h-3" />{event.camera}
                    </span>
                    <span className="flex items-center gap-1" style={{ color: "oklch(0.50 0.010 250)" }}>
                      <MapPin className="w-3 h-3" />{event.location}
                    </span>
                    <span style={{ color: "oklch(0.45 0.18 145)" }}>
                      Action: {event.action}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-1.5">
                  <Button variant="outline" size="sm" className="text-[11px] h-7">
                    <Eye className="w-3 h-3 mr-1" />View
                  </Button>
                  {event.severity !== "info" && (
                    <Button size="sm" className="text-[11px] h-7" style={{ background: "oklch(0.45 0.20 240)", color: "white" }}>
                      Dispatch
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Reservations */}
          <TabsContent value="reservations" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Facility Reservations
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                  Wildcat Park and West Liberty Community Center — upcoming bookings
                </p>
              </div>
              <Button size="sm" style={{ background: "oklch(0.45 0.20 240)", color: "white" }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />New Reservation
              </Button>
            </div>

            {/* Facility summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Wildcat Park", capacity: 500, upcoming: 4, revenue: "$75", icon: Trees, color: "oklch(0.40 0.18 145)" },
                { name: "Community Center", capacity: 250, upcoming: 2, revenue: "$200", icon: Building2, color: "oklch(0.45 0.20 240)" },
              ].map((facility) => (
                <div key={facility.name} className="rounded-xl border p-4 flex items-center gap-4" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${facility.color}15` }}>
                    <facility.icon className="w-6 h-6" style={{ color: facility.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: "oklch(0.22 0.018 250)" }}>{facility.name}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                      {facility.upcoming} upcoming reservations · Capacity {facility.capacity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-semibold" style={{ color: "oklch(0.45 0.18 145)" }}>{facility.revenue}</div>
                    <div className="text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>deposits collected</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ background: "oklch(0.965 0.005 240)", borderBottom: "1px solid oklch(0 0 0 / 8%)" }}>
                    {["ID", "Facility", "Date & Time", "Group", "Guests", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium" style={{ color: "oklch(0.45 0.010 250)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RESERVATIONS.map((res, i) => (
                    <tr key={res.id} style={{ background: i % 2 === 0 ? "oklch(1 0 0)" : "oklch(0.985 0.003 240)", borderBottom: "1px solid oklch(0 0 0 / 5%)" }}>
                      <td className="px-4 py-2.5 font-mono" style={{ color: "oklch(0.45 0.010 250)" }}>{res.id}</td>
                      <td className="px-4 py-2.5 font-medium" style={{ color: "oklch(0.22 0.018 250)" }}>{res.facility}</td>
                      <td className="px-4 py-2.5" style={{ color: "oklch(0.40 0.010 250)" }}>
                        <div>{res.date}</div>
                        <div className="text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>{res.time}</div>
                      </td>
                      <td className="px-4 py-2.5" style={{ color: "oklch(0.40 0.010 250)" }}>
                        <div>{res.group}</div>
                        <div className="text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>{res.contact}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1" style={{ color: "oklch(0.40 0.010 250)" }}>
                          <Users className="w-3 h-3" />{res.guests}
                        </div>
                      </td>
                      <td className="px-4 py-2.5"><StatusBadge status={res.status} /></td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">View</Button>
                          {res.status === "pending" && (
                            <Button size="sm" className="h-6 text-[10px] px-2" style={{ background: "oklch(0.45 0.18 145)", color: "white" }}>Approve</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Work Orders */}
          <TabsContent value="workorders" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Parks Maintenance Work Orders
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                  IoT-triggered and manual work orders for all parks facilities
                </p>
              </div>
              <Button size="sm" onClick={() => setNewWorkOrder(!newWorkOrder)} style={{ background: "oklch(0.45 0.20 240)", color: "white" }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />New Work Order
              </Button>
            </div>

            {newWorkOrder && (
              <div className="rounded-xl border p-4" style={{ background: "oklch(0.45 0.20 240 / 5%)", borderColor: "oklch(0.45 0.20 240 / 30%)" }}>
                <div className="text-[12px] font-medium mb-3" style={{ color: "oklch(0.35 0.018 250)" }}>New Work Order</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium block mb-1" style={{ color: "oklch(0.45 0.010 250)" }}>Facility</label>
                    <select className="w-full text-[12px] border rounded-lg px-3 py-1.5" style={{ borderColor: "oklch(0 0 0 / 15%)", color: "oklch(0.30 0.014 250)" }}>
                      <option>Wildcat Park — Baseball Diamond</option>
                      <option>Wildcat Park — Soccer Fields</option>
                      <option>Wildcat Park — Playground</option>
                      <option>Wildcat Park — Pavilion</option>
                      <option>Community Center — Main Hall</option>
                      <option>Community Center — HVAC</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium block mb-1" style={{ color: "oklch(0.45 0.010 250)" }}>Priority</label>
                    <select className="w-full text-[12px] border rounded-lg px-3 py-1.5" style={{ borderColor: "oklch(0 0 0 / 15%)", color: "oklch(0.30 0.014 250)" }}>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] font-medium block mb-1" style={{ color: "oklch(0.45 0.010 250)" }}>Issue Description</label>
                    <textarea className="w-full text-[12px] border rounded-lg px-3 py-1.5 h-16 resize-none" style={{ borderColor: "oklch(0 0 0 / 15%)", color: "oklch(0.30 0.014 250)" }} placeholder="Describe the maintenance issue..." />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" style={{ background: "oklch(0.45 0.20 240)", color: "white" }}>Submit Work Order</Button>
                  <Button variant="outline" size="sm" onClick={() => setNewWorkOrder(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {WORK_ORDERS.map((wo) => (
                <div
                  key={wo.id}
                  className="rounded-xl border p-4"
                  style={{
                    background: "oklch(1 0 0)",
                    borderColor: wo.priority === "high" && wo.status !== "completed" ? "oklch(0.55 0.22 25 / 30%)" : "oklch(0 0 0 / 8%)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-semibold" style={{ color: "oklch(0.45 0.010 250)" }}>{wo.id}</span>
                        <StatusBadge status={wo.priority} />
                        <StatusBadge status={wo.status} />
                        {wo.iot && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "oklch(0.45 0.20 240 / 10%)", color: "oklch(0.38 0.18 240)" }}>
                            IoT: {wo.iot}
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] font-medium mt-1" style={{ color: "oklch(0.22 0.018 250)" }}>{wo.issue}</div>
                      <div className="flex items-center gap-4 mt-1.5 text-[11px]" style={{ color: "oklch(0.50 0.010 250)" }}>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{wo.facility}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{wo.assigned}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Due: {wo.due}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {wo.status === "completed"
                        ? <CheckCircle2 className="w-5 h-5" style={{ color: "oklch(0.45 0.18 145)" }} />
                        : <Button size="sm" className="text-[11px] h-7" style={{ background: "oklch(0.45 0.20 240)", color: "white" }}>Update</Button>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer note */}
        <div className="text-[11px] text-center py-2" style={{ color: "oklch(0.60 0.010 250)" }}>
          Parks & Recreation Hub — City of West Liberty, IA · IrriSmart + ParkPulse + TrailCam IoT Network · FY2026
        </div>
      </div>
    </DashboardLayout>
  );
}
