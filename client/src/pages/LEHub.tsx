/**
 * LEHub — /le-hub (dashboard)
 * Expanded Law Enforcement section for West Liberty Police Department
 * Covers: CAD/Dispatch, Body Camera Management, Evidence Chain of Custody,
 *         Fleet Tracking, Incident Analytics, Officer Wellness, SCIF Access
 * Design: Civic Intelligence Light — white/light-grey backgrounds, dark text, blue/red accents
 */
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Shield, Radio, Camera, FileText, Car, Activity, Users, Lock,
  AlertTriangle, CheckCircle2, Clock, ChevronRight, MapPin,
  Zap, Eye, Send, TrendingUp, TrendingDown, BarChart3, Phone,
  Fingerprint, Video, Package, Star, ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";

// ─── West Liberty PD Data ─────────────────────────────────────────────────────
const PD_STATS = [
  { label: "Officers on Duty", value: "4", sub: "of 8 total", icon: Users, color: "oklch(0.40 0.18 240)", trend: null },
  { label: "Active Calls", value: "2", sub: "1 priority, 1 routine", icon: Radio, color: "oklch(0.58 0.22 25)", trend: null },
  { label: "Open Cases", value: "14", sub: "3 felony, 11 misdemeanor", icon: FileText, color: "oklch(0.50 0.22 75)", trend: "down" },
  { label: "Evidence Items", value: "47", sub: "All chain-of-custody verified", icon: Package, color: "oklch(0.38 0.18 145)", trend: null },
  { label: "Fleet Vehicles", value: "6", sub: "5 in service, 1 maintenance", icon: Car, color: "oklch(0.45 0.20 280)", trend: null },
  { label: "Body Cams Active", value: "4", sub: "12hr battery remaining avg", icon: Camera, color: "oklch(0.40 0.18 240)", trend: null },
];

const ACTIVE_CALLS = [
  {
    id: "CAD-2026-0847",
    priority: "P1",
    type: "Disturbance",
    address: "312 E 3rd St, West Liberty",
    time: "14:32",
    unit: "Unit 2 — Ofc. Martinez",
    status: "on-scene",
    notes: "Domestic disturbance. Unit on scene. No weapons reported.",
  },
  {
    id: "CAD-2026-0848",
    priority: "P3",
    type: "Traffic Stop",
    address: "N Calhoun St & W 7th St",
    time: "14:41",
    unit: "Unit 4 — Ofc. Chen",
    status: "active",
    notes: "Routine traffic stop. License plate check in progress.",
  },
];

const RECENT_INCIDENTS = [
  { id: "WL-2026-0312", type: "Theft", address: "Hy-Vee, 1100 N Calhoun St", date: "Mar 1", status: "open", officer: "Sgt. Williams" },
  { id: "WL-2026-0311", type: "Vandalism", address: "City Park, W 4th St", date: "Feb 28", status: "closed", officer: "Ofc. Martinez" },
  { id: "WL-2026-0310", type: "DUI Arrest", address: "US-6 & N Calhoun St", date: "Feb 28", status: "closed", officer: "Ofc. Chen" },
  { id: "WL-2026-0309", type: "Burglary", address: "418 E 5th St", date: "Feb 27", status: "open", officer: "Sgt. Williams" },
  { id: "WL-2026-0308", type: "Welfare Check", address: "201 W 3rd St", date: "Feb 27", status: "closed", officer: "Ofc. Davis" },
  { id: "WL-2026-0307", type: "Noise Complaint", address: "512 N Elm St", date: "Feb 26", status: "closed", officer: "Ofc. Chen" },
];

const FLEET = [
  { unit: "Unit 1", vehicle: "2022 Ford Explorer", officer: "Chief Thompson", status: "in-service", mileage: "48,221", fuel: 78, location: "City Hall" },
  { unit: "Unit 2", vehicle: "2021 Ford Explorer", officer: "Ofc. Martinez", status: "on-call", mileage: "61,445", fuel: 52, location: "312 E 3rd St" },
  { unit: "Unit 3", vehicle: "2023 Chevy Tahoe", officer: "Sgt. Williams", status: "in-service", mileage: "22,108", fuel: 91, location: "N Calhoun St" },
  { unit: "Unit 4", vehicle: "2020 Ford Explorer", officer: "Ofc. Chen", status: "on-call", mileage: "74,882", fuel: 44, location: "N Calhoun & W 7th" },
  { unit: "Unit 5", vehicle: "2022 Ford F-150", officer: "Unassigned", status: "in-service", mileage: "31,667", fuel: 85, location: "PD Garage" },
  { unit: "Unit 6", vehicle: "2019 Ford Explorer", officer: "Unassigned", status: "maintenance", mileage: "92,441", fuel: 20, location: "Midas Auto, Iowa City" },
];

const BODY_CAMS = [
  { officer: "Chief Thompson", unit: "CAM-001", status: "recording", battery: 88, storage: "14.2 GB used", lastSync: "2 min ago", footage: 3 },
  { officer: "Sgt. Williams", unit: "CAM-002", status: "recording", battery: 72, storage: "9.8 GB used", lastSync: "1 min ago", footage: 2 },
  { officer: "Ofc. Martinez", unit: "CAM-003", status: "recording", battery: 65, storage: "18.1 GB used", lastSync: "just now", footage: 5 },
  { officer: "Ofc. Chen", unit: "CAM-004", status: "recording", battery: 81, storage: "11.4 GB used", lastSync: "3 min ago", footage: 2 },
  { officer: "Ofc. Davis", unit: "CAM-005", status: "standby", battery: 100, storage: "0.2 GB used", lastSync: "8 min ago", footage: 0 },
  { officer: "Ofc. Rodriguez", unit: "CAM-006", status: "off-duty", battery: 100, storage: "0.0 GB used", lastSync: "6 hrs ago", footage: 0 },
];

const EVIDENCE_ITEMS = [
  { id: "EV-2026-0089", case: "WL-2026-0312", desc: "Surveillance footage — Hy-Vee theft", type: "Digital", status: "secured", custodian: "Sgt. Williams", temp: "68°F", humidity: "42%" },
  { id: "EV-2026-0088", case: "WL-2026-0309", desc: "Pry bar — burglary tool", type: "Physical", status: "secured", custodian: "Chief Thompson", temp: "68°F", humidity: "42%" },
  { id: "EV-2026-0087", case: "WL-2026-0309", desc: "Fingerprint lifts (3)", type: "Physical", status: "lab-pending", custodian: "Sgt. Williams", temp: "68°F", humidity: "42%" },
  { id: "EV-2026-0086", case: "WL-2026-0310", desc: "BAC test result — 0.19%", type: "Digital", status: "secured", custodian: "Ofc. Chen", temp: "68°F", humidity: "42%" },
  { id: "EV-2026-0085", case: "WL-2026-0308", desc: "Body cam footage — welfare check", type: "Digital", status: "secured", custodian: "Ofc. Davis", temp: "68°F", humidity: "42%" },
];

const OFFICER_WELLNESS = [
  { name: "Chief Thompson", badge: "WL-001", shift: "Days", hoursThisWeek: 38, stressIndex: "Low", lastBreak: "1.2 hrs ago", heartRate: 68 },
  { name: "Sgt. Williams", badge: "WL-002", shift: "Days", hoursThisWeek: 42, stressIndex: "Moderate", lastBreak: "2.8 hrs ago", heartRate: 82 },
  { name: "Ofc. Martinez", badge: "WL-003", shift: "Days", hoursThisWeek: 40, stressIndex: "Elevated", lastBreak: "3.5 hrs ago", heartRate: 94 },
  { name: "Ofc. Chen", badge: "WL-004", shift: "Days", hoursThisWeek: 36, stressIndex: "Low", lastBreak: "0.8 hrs ago", heartRate: 72 },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    "on-scene": { bg: "oklch(0.58 0.22 25 / 12%)", text: "oklch(0.45 0.22 25)", label: "ON SCENE" },
    "active": { bg: "oklch(0.40 0.18 240 / 12%)", text: "oklch(0.40 0.18 240)", label: "ACTIVE" },
    "in-service": { bg: "oklch(0.38 0.18 145 / 12%)", text: "oklch(0.32 0.18 145)", label: "IN SERVICE" },
    "on-call": { bg: "oklch(0.40 0.18 240 / 12%)", text: "oklch(0.40 0.18 240)", label: "ON CALL" },
    "maintenance": { bg: "oklch(0.58 0.22 25 / 12%)", text: "oklch(0.45 0.22 25)", label: "MAINTENANCE" },
    "recording": { bg: "oklch(0.58 0.22 25 / 12%)", text: "oklch(0.45 0.22 25)", label: "● REC" },
    "standby": { bg: "oklch(0.50 0.18 75 / 12%)", text: "oklch(0.45 0.18 75)", label: "STANDBY" },
    "off-duty": { bg: "oklch(0 0 0 / 6%)", text: "oklch(0.52 0.010 250)", label: "OFF DUTY" },
    "secured": { bg: "oklch(0.38 0.18 145 / 12%)", text: "oklch(0.32 0.18 145)", label: "SECURED" },
    "lab-pending": { bg: "oklch(0.50 0.18 75 / 12%)", text: "oklch(0.45 0.18 75)", label: "LAB PENDING" },
    "open": { bg: "oklch(0.58 0.22 25 / 12%)", text: "oklch(0.45 0.22 25)", label: "OPEN" },
    "closed": { bg: "oklch(0.38 0.18 145 / 12%)", text: "oklch(0.32 0.18 145)", label: "CLOSED" },
    "Low": { bg: "oklch(0.38 0.18 145 / 12%)", text: "oklch(0.32 0.18 145)", label: "LOW" },
    "Moderate": { bg: "oklch(0.50 0.18 75 / 12%)", text: "oklch(0.45 0.18 75)", label: "MODERATE" },
    "Elevated": { bg: "oklch(0.58 0.22 25 / 12%)", text: "oklch(0.45 0.22 25)", label: "ELEVATED" },
  };
  const s = map[status] || { bg: "oklch(0 0 0 / 6%)", text: "oklch(0.52 0.010 250)", label: status.toUpperCase() };
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

export default function LEHub() {
  const [activeTab, setActiveTab] = useState<"cad" | "fleet" | "cameras" | "evidence" | "wellness">("cad");
  const [callCount, setCallCount] = useState(2);

  // Simulate occasional new call
  useEffect(() => {
    const t = setTimeout(() => {
      toast("New CAD event: Noise complaint — 714 N Maple St", {
        icon: <Radio className="w-4 h-4 text-blue-600" />,
        duration: 5000,
      });
      setCallCount(3);
    }, 18000);
    return () => clearTimeout(t);
  }, []);

  const TABS = [
    { id: "cad", label: "CAD / Dispatch", icon: Radio },
    { id: "fleet", label: "Fleet", icon: Car },
    { id: "cameras", label: "Body Cameras", icon: Camera },
    { id: "evidence", label: "Evidence", icon: Package },
    { id: "wellness", label: "Officer Wellness", icon: Activity },
  ] as const;

  return (
    <DashboardLayout title="Law Enforcement Hub — West Liberty PD">
      <div className="p-6 space-y-6" style={{ background: "oklch(0.975 0.004 240)", minHeight: "100vh" }}>

        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5" style={{ color: "oklch(0.40 0.18 240)" }} />
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>
                Law Enforcement Hub
              </h1>
            </div>
            <p className="text-sm" style={{ color: "oklch(0.45 0.012 250)" }}>
              West Liberty Police Department · Chief Thompson · (319) 627-2418 ext. 3
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold" style={{ background: "oklch(0.58 0.22 25 / 10%)", border: "1px solid oklch(0.58 0.22 25 / 25%)", color: "oklch(0.45 0.22 25)" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "oklch(0.58 0.22 25)" }} />
              {callCount} ACTIVE CALL{callCount !== 1 ? "S" : ""}
            </div>
            <Link href="/secure-modules">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold" style={{ background: "oklch(0.40 0.18 240 / 10%)", border: "1px solid oklch(0.40 0.18 240 / 25%)", color: "oklch(0.40 0.18 240)" }}>
                <Lock className="w-3.5 h-3.5" />
                Secure Modules
              </button>
            </Link>
          </div>
        </div>

        {/* ─── Stats Row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PD_STATS.map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)", boxShadow: "0 1px 4px oklch(0 0 0 / 5%)" }}>
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                {stat.trend === "down" && <TrendingDown className="w-3 h-3" style={{ color: "oklch(0.38 0.18 145)" }} />}
              </div>
              <div className="text-xl font-mono font-bold" style={{ color: "oklch(0.12 0.018 250)" }}>{stat.value}</div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: "oklch(0.35 0.018 250)" }}>{stat.label}</div>
              <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ─── Tab Navigation ─────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "oklch(0 0 0 / 5%)" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
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

        {/* ─── CAD / Dispatch Tab ─────────────────────────────────────────── */}
        {activeTab === "cad" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Active Calls */}
            <div className="rounded-xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)", boxShadow: "0 1px 4px oklch(0 0 0 / 5%)" }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 7%)" }}>
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4" style={{ color: "oklch(0.58 0.22 25)" }} />
                  <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>Active CAD Calls</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: "oklch(0.58 0.22 25 / 10%)", color: "oklch(0.45 0.22 25)" }}>
                  {ACTIVE_CALLS.length} ACTIVE
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
                {ACTIVE_CALLS.map((call) => (
                  <div key={call.id} className="px-5 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: call.priority === "P1" ? "oklch(0.58 0.22 25)" : "oklch(0.50 0.18 75 / 15%)", color: call.priority === "P1" ? "oklch(0.98 0.004 25)" : "oklch(0.45 0.18 75)" }}>
                          {call.priority}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>{call.type}</span>
                      </div>
                      <StatusBadge status={call.status} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "oklch(0.42 0.012 250)" }}>
                      <MapPin className="w-3 h-3" />
                      {call.address}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: "oklch(0.42 0.012 250)" }}>
                      <Users className="w-3 h-3" />
                      {call.unit}
                      <span className="ml-2 font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{call.time}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "oklch(0.48 0.012 250)" }}>{call.notes}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => toast.success(`Backup dispatched to ${call.address}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
                        style={{ background: "oklch(0.40 0.18 240 / 10%)", border: "1px solid oklch(0.40 0.18 240 / 25%)", color: "oklch(0.40 0.18 240)" }}
                      >
                        <Send className="w-3 h-3" />
                        Dispatch Backup
                      </button>
                      <button
                        onClick={() => toast.success(`Call ${call.id} marked as closed`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
                        style={{ background: "oklch(0.38 0.18 145 / 10%)", border: "1px solid oklch(0.38 0.18 145 / 25%)", color: "oklch(0.32 0.18 145)" }}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Close Call
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Incidents */}
            <div className="rounded-xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)", boxShadow: "0 1px 4px oklch(0 0 0 / 5%)" }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 7%)" }}>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: "oklch(0.40 0.18 240)" }} />
                  <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>Recent Incidents</span>
                </div>
                <button
                  onClick={() => toast.info("Full incident log — feature coming soon")}
                  className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: "oklch(0.40 0.18 240)", background: "none", border: "none", cursor: "pointer" }}
                >
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
                {RECENT_INCIDENTS.map((inc) => (
                  <div key={inc.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "oklch(0.40 0.18 240 / 8%)" }}>
                        <FileText className="w-3.5 h-3.5" style={{ color: "oklch(0.40 0.18 240)" }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>{inc.type}</span>
                          <StatusBadge status={inc.status} />
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.48 0.012 250)" }}>{inc.address}</div>
                        <div className="text-[9px] mt-0.5 font-mono" style={{ color: "oklch(0.58 0.010 250)" }}>{inc.id} · {inc.officer} · {inc.date}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toast.info(`Opening case ${inc.id}`)}
                      style={{ color: "oklch(0.52 0.010 250)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Fleet Tab ──────────────────────────────────────────────────── */}
        {activeTab === "fleet" && (
          <div className="rounded-xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)", boxShadow: "0 1px 4px oklch(0 0 0 / 5%)" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 7%)" }}>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" style={{ color: "oklch(0.45 0.20 280)" }} />
                <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>Fleet Status — 6 Vehicles</span>
              </div>
              <button
                onClick={() => toast.info("Fleet maintenance scheduler — coming soon")}
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: "oklch(0.40 0.18 240)", background: "none", border: "none", cursor: "pointer" }}
              >
                Schedule Maintenance <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
              {FLEET.map((v) => (
                <div key={v.unit} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: v.status === "maintenance" ? "oklch(0.58 0.22 25 / 10%)" : "oklch(0.40 0.18 240 / 8%)" }}>
                    <Car className="w-5 h-5" style={{ color: v.status === "maintenance" ? "oklch(0.45 0.22 25)" : "oklch(0.40 0.18 240)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold" style={{ color: "oklch(0.18 0.018 250)" }}>{v.unit}</span>
                      <StatusBadge status={v.status} />
                    </div>
                    <div className="text-xs" style={{ color: "oklch(0.42 0.012 250)" }}>{v.vehicle} · {v.officer}</div>
                    <div className="flex items-center gap-1.5 text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>
                      <MapPin className="w-3 h-3" />
                      {v.location}
                      <span className="mx-1">·</span>
                      <span className="font-mono">{v.mileage} mi</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] mb-1" style={{ color: "oklch(0.52 0.010 250)" }}>Fuel</div>
                    <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: "oklch(0 0 0 / 8%)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${v.fuel}%`,
                          background: v.fuel > 50 ? "oklch(0.38 0.18 145)" : v.fuel > 25 ? "oklch(0.50 0.18 75)" : "oklch(0.58 0.22 25)",
                        }}
                      />
                    </div>
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: "oklch(0.42 0.012 250)" }}>{v.fuel}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Body Cameras Tab ───────────────────────────────────────────── */}
        {activeTab === "cameras" && (
          <div className="rounded-xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)", boxShadow: "0 1px 4px oklch(0 0 0 / 5%)" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 7%)" }}>
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" style={{ color: "oklch(0.40 0.18 240)" }} />
                <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>Body Camera Management — PatrolMesh Hub</span>
              </div>
              <div className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: "oklch(0.58 0.22 25 / 10%)", color: "oklch(0.45 0.22 25)" }}>
                4 RECORDING
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
              {BODY_CAMS.map((cam) => (
                <div key={cam.unit} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cam.status === "recording" ? "oklch(0.58 0.22 25 / 10%)" : "oklch(0 0 0 / 5%)" }}>
                    <Video className="w-5 h-5" style={{ color: cam.status === "recording" ? "oklch(0.45 0.22 25)" : "oklch(0.55 0.010 250)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>{cam.officer}</span>
                      <StatusBadge status={cam.status} />
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{cam.unit} · {cam.storage} · {cam.footage} clips</div>
                    <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.58 0.010 250)" }}>Last sync: {cam.lastSync}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] mb-1" style={{ color: "oklch(0.52 0.010 250)" }}>Battery</div>
                    <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: "oklch(0 0 0 / 8%)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${cam.battery}%`,
                          background: cam.battery > 50 ? "oklch(0.38 0.18 145)" : cam.battery > 25 ? "oklch(0.50 0.18 75)" : "oklch(0.58 0.22 25)",
                        }}
                      />
                    </div>
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: "oklch(0.42 0.012 250)" }}>{cam.battery}%</div>
                  </div>
                  {cam.footage > 0 && (
                    <button
                      onClick={() => toast.success(`Syncing ${cam.footage} clips from ${cam.officer} to evidence server`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-semibold flex-shrink-0"
                      style={{ background: "oklch(0.40 0.18 240 / 10%)", border: "1px solid oklch(0.40 0.18 240 / 25%)", color: "oklch(0.40 0.18 240)" }}
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      Sync
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Evidence Tab ───────────────────────────────────────────────── */}
        {activeTab === "evidence" && (
          <div className="space-y-4">
            {/* Evidence room status */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Room Temp", value: "68°F", icon: Activity, ok: true },
                { label: "Humidity", value: "42% RH", icon: Zap, ok: true },
                { label: "Last Access", value: "2h 14m ago", icon: Clock, ok: true },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-xl flex items-center gap-3" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)" }}>
                  <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: "oklch(0.38 0.18 145 / 10%)" }}>
                    <s.icon className="w-4 h-4" style={{ color: "oklch(0.32 0.18 145)" }} />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold" style={{ color: "oklch(0.18 0.018 250)" }}>{s.value}</div>
                    <div className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>{s.label}</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 ml-auto" style={{ color: "oklch(0.32 0.18 145)" }} />
                </div>
              ))}
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)", boxShadow: "0 1px 4px oklch(0 0 0 / 5%)" }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 7%)" }}>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" style={{ color: "oklch(0.38 0.18 145)" }} />
                  <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>Evidence Chain of Custody</span>
                </div>
                <Link href="/secure-modules">
                  <button className="text-xs font-semibold flex items-center gap-1" style={{ color: "oklch(0.40 0.18 240)", background: "none", border: "none", cursor: "pointer" }}>
                    Full Evidence Room <ChevronRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
                {EVIDENCE_ITEMS.map((ev) => (
                  <div key={ev.id} className="px-5 py-4">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>{ev.desc}</span>
                        <StatusBadge status={ev.status} />
                      </div>
                      <span className="text-[9px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>{ev.id}</span>
                    </div>
                    <div className="text-[10px]" style={{ color: "oklch(0.48 0.012 250)" }}>
                      Case: {ev.case} · Type: {ev.type} · Custodian: {ev.custodian}
                    </div>
                    <div className="text-[9px] mt-0.5 font-mono" style={{ color: "oklch(0.58 0.010 250)" }}>
                      Env: {ev.temp} · {ev.humidity} · DOGE Sentinel Node monitoring
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Officer Wellness Tab ───────────────────────────────────────── */}
        {activeTab === "wellness" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: "oklch(0.40 0.18 240 / 6%)", border: "1px solid oklch(0.40 0.18 240 / 18%)" }}>
              <p className="text-xs" style={{ color: "oklch(0.35 0.018 250)" }}>
                <strong>PatrolMesh Hub</strong> continuously monitors officer biometrics via body camera hardware. Heart rate and stress index are derived from wrist-worn sensors integrated with the PatrolMesh Hub (IoT device WL-PATROL-MESH-1). Data is used only for officer safety and is not included in performance evaluations.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OFFICER_WELLNESS.map((o) => (
                <div key={o.badge} className="p-5 rounded-xl" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 7%)", boxShadow: "0 1px 4px oklch(0 0 0 / 5%)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "oklch(0.40 0.18 240 / 10%)" }}>
                        <Users className="w-5 h-5" style={{ color: "oklch(0.40 0.18 240)" }} />
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: "oklch(0.18 0.018 250)" }}>{o.name}</div>
                        <div className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>Badge {o.badge} · {o.shift} Shift</div>
                      </div>
                    </div>
                    <StatusBadge status={o.stressIndex} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Hours This Week", value: `${o.hoursThisWeek}h`, color: o.hoursThisWeek > 40 ? "oklch(0.50 0.18 75)" : "oklch(0.38 0.18 145)" },
                      { label: "Heart Rate", value: `${o.heartRate} bpm`, color: o.heartRate > 90 ? "oklch(0.58 0.22 25)" : "oklch(0.38 0.18 145)" },
                      { label: "Last Break", value: o.lastBreak, color: "oklch(0.40 0.18 240)" },
                    ].map((m) => (
                      <div key={m.label} className="p-2.5 rounded-lg text-center" style={{ background: "oklch(0.975 0.004 240)" }}>
                        <div className="text-sm font-mono font-bold" style={{ color: m.color }}>{m.value}</div>
                        <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
