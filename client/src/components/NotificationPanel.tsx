/**
 * NotificationPanel — Slide-out triage panel
 * Shows unacknowledged IoT alerts and overdue work orders.
 * Triggered by the bell icon in the Navbar.
 * Uses a shared context so Navbar badge and panel share state.
 */
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, X, AlertTriangle, Wrench, Droplets, Zap, Leaf,
  CheckCircle2, ArrowRight, Clock, ChevronRight, RefreshCw
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type NotifSeverity = "critical" | "high" | "medium" | "info";

interface Notification {
  id: string;
  type: "iot-alert" | "work-order";
  severity: NotifSeverity;
  title: string;
  description: string;
  time: string;
  href: string;
  acknowledged: boolean;
  icon: typeof AlertTriangle;
}

// ── Initial notifications (seeded with West Liberty data) ─────────────────────
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n-001", type: "iot-alert", severity: "critical",
    title: "Water Tower Pressure Low",
    description: "Node WL-WT-01 · 58 PSI — threshold 65 PSI. Possible main leak on Calhoun St.",
    time: "2 min ago", href: "/map", acknowledged: false, icon: AlertTriangle,
  },
  {
    id: "n-002", type: "iot-alert", severity: "high",
    title: "Lift Station High Level",
    description: "Node WL-LS-01 · Industrial Dr · 87% capacity. Pump cycle anomaly detected.",
    time: "8 min ago", href: "/map", acknowledged: false, icon: Droplets,
  },
  {
    id: "n-003", type: "work-order", severity: "critical",
    title: "WO-2024-0847 Overdue",
    description: "Water Main Break — Calhoun St & 3rd Ave. Assigned J. Martinez. 4 hrs overdue.",
    time: "4 hrs ago", href: "/operations", acknowledged: false, icon: Wrench,
  },
  {
    id: "n-004", type: "iot-alert", severity: "medium",
    title: "Park Soil Moisture Low",
    description: "IrriSmart WL-PK-01 · Wildcat Park Zone 3 · 18% moisture. Irrigation needed.",
    time: "22 min ago", href: "/parks", acknowledged: false, icon: Leaf,
  },
  {
    id: "n-005", type: "work-order", severity: "high",
    title: "WO-2024-0851 Overdue",
    description: "Street Light Outage — Hwy 6 & Columbus Junction Rd. 3 lights. 2 hrs overdue.",
    time: "2 hrs ago", href: "/operations", acknowledged: false, icon: Zap,
  },
  {
    id: "n-006", type: "iot-alert", severity: "medium",
    title: "Gas Regulator Pressure Variance",
    description: "GasPulse WL-GS-02 · Oak St Station · ±8% variance. Within tolerance but trending.",
    time: "35 min ago", href: "/utilities", acknowledged: false, icon: AlertTriangle,
  },
  {
    id: "n-007", type: "work-order", severity: "medium",
    title: "WO-2024-0849 Due Today",
    description: "Lift Station Maintenance — Industrial Dr. Assigned R. Chen. Due by 5:00 PM.",
    time: "1 hr ago", href: "/operations", acknowledged: false, icon: Wrench,
  },
];

// ── Context ───────────────────────────────────────────────────────────────────
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
  acknowledge: (id: string) => void;
  acknowledgeAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [panelOpen, setPanelOpen] = useState(false);

  // Simulate a new IoT alert arriving every 45 seconds
  useEffect(() => {
    const LIVE_ALERTS = [
      { id: "live-1", type: "iot-alert" as const, severity: "high" as const, title: "Bridge Sensor Vibration Spike", description: "BridgeWatch WL-BR-01 · Main St Bridge · 2.4g peak. Inspect recommended.", time: "just now", href: "/map", acknowledged: false, icon: AlertTriangle },
      { id: "live-2", type: "iot-alert" as const, severity: "medium" as const, title: "Storm Drain Flow Elevated", description: "StormNet WL-SD-03 · Elm & 4th · 340% of baseline. Monitor for blockage.", time: "just now", href: "/utilities", acknowledged: false, icon: Droplets },
      { id: "live-3", type: "iot-alert" as const, severity: "info" as const, title: "TrailCam Motion Detected", description: "TrailCam WL-PK-02 · Wildcat Park Trail B · Non-wildlife motion at 11:42 PM.", time: "just now", href: "/parks", acknowledged: false, icon: Leaf },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      const alert = { ...LIVE_ALERTS[idx % LIVE_ALERTS.length], id: `live-${Date.now()}`, time: "just now" };
      setNotifications(prev => [alert, ...prev].slice(0, 20));
      idx++;
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.acknowledged).length;

  const acknowledge = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, acknowledged: true } : n));
  }, []);

  const acknowledgeAll = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, acknowledged: true })));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, panelOpen, setPanelOpen, acknowledge, acknowledgeAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

// ── Bell button (used in Navbar) ──────────────────────────────────────────────
export function NotificationBell() {
  const { unreadCount, panelOpen, setPanelOpen } = useNotifications();

  return (
    <button
      onClick={() => setPanelOpen(!panelOpen)}
      className="relative p-1.5 rounded transition-all"
      title="Notifications"
      style={{
        background: panelOpen ? "oklch(0.45 0.20 240 / 12%)" : "oklch(0 0 0 / 5%)",
        border: "1px solid oklch(0 0 0 / 8%)",
        color: panelOpen ? "oklch(0.40 0.18 240)" : "oklch(0.45 0.014 250)",
      }}
    >
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
          style={{ background: "oklch(0.50 0.22 25)", color: "white" }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}

// ── Severity helpers ──────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<NotifSeverity, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "oklch(0.50 0.22 25)", bg: "oklch(0.50 0.22 25 / 10%)" },
  high:     { label: "High",     color: "oklch(0.55 0.20 55)", bg: "oklch(0.55 0.20 55 / 10%)" },
  medium:   { label: "Medium",   color: "oklch(0.50 0.18 200)", bg: "oklch(0.50 0.18 200 / 10%)" },
  info:     { label: "Info",     color: "oklch(0.45 0.20 240)", bg: "oklch(0.45 0.20 240 / 10%)" },
};

// ── Slide-out panel ───────────────────────────────────────────────────────────
export function NotificationPanel() {
  const { notifications, unreadCount, panelOpen, setPanelOpen, acknowledge, acknowledgeAll } = useNotifications();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"all" | "iot-alert" | "work-order">("all");

  const filtered = notifications.filter(n => filter === "all" || n.type === filter);
  const unacknowledged = filtered.filter(n => !n.acknowledged);
  const acknowledged = filtered.filter(n => n.acknowledged);

  const handleNavigate = (href: string, id: string) => {
    acknowledge(id);
    navigate(href);
    setPanelOpen(false);
  };

  return (
    <AnimatePresence>
      {panelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
            style={{ background: "oklch(0 0 0 / 20%)" }}
            onClick={() => setPanelOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[70] flex flex-col"
            style={{
              width: "min(420px, 100vw)",
              background: "var(--background)",
              borderLeft: "1px solid oklch(0 0 0 / 10%)",
              boxShadow: "-8px 0 32px oklch(0 0 0 / 12%)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
              style={{ borderColor: "oklch(0 0 0 / 8%)" }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" style={{ color: "oklch(0.45 0.20 240)" }} />
                  <span className="font-semibold text-sm" style={{ fontFamily: "'Syne', sans-serif", color: "var(--foreground)" }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: "oklch(0.50 0.22 25)", color: "white" }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
                  West Liberty, IA · Live feed
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={acknowledgeAll}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all"
                    style={{ background: "oklch(0.45 0.20 240 / 10%)", color: "oklch(0.38 0.18 240)", border: "1px solid oklch(0.45 0.20 240 / 20%)" }}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1.5 rounded transition-all"
                  style={{ color: "oklch(0.55 0.010 250)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div
              className="flex gap-1 px-4 py-2 border-b flex-shrink-0"
              style={{ borderColor: "oklch(0 0 0 / 8%)", background: "oklch(0.975 0.004 240)" }}
            >
              {(["all", "iot-alert", "work-order"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1 rounded text-[11px] font-medium transition-all"
                  style={{
                    background: filter === f ? "oklch(0.45 0.20 240)" : "transparent",
                    color: filter === f ? "white" : "oklch(0.50 0.010 250)",
                  }}
                >
                  {f === "all" ? "All" : f === "iot-alert" ? "IoT Alerts" : "Work Orders"}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: "oklch(0.60 0.010 250)" }}>
                <RefreshCw className="w-3 h-3" />
                Live
              </div>
            </div>

            {/* Notifications list */}
            <div className="flex-1 overflow-y-auto">
              {/* Unacknowledged */}
              {unacknowledged.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "oklch(0.60 0.010 250)" }}>
                    Needs Attention ({unacknowledged.length})
                  </div>
                  {unacknowledged.map(notif => {
                    const sev = SEVERITY_CONFIG[notif.severity];
                    return (
                      <div
                        key={notif.id}
                        className="mx-3 mb-2 rounded-lg overflow-hidden"
                        style={{ border: `1px solid ${sev.color}30`, background: sev.bg }}
                      >
                        <div className="p-3">
                          <div className="flex items-start gap-2.5">
                            <div
                              className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: sev.color + "20" }}
                            >
                              <notif.icon className="w-3.5 h-3.5" style={{ color: sev.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>
                                  {notif.title}
                                </span>
                                <span
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                                  style={{ background: sev.color, color: "white" }}
                                >
                                  {sev.label}
                                </span>
                              </div>
                              <div className="text-[11px] leading-relaxed mb-2" style={{ color: "oklch(0.45 0.010 250)" }}>
                                {notif.description}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-[10px]" style={{ color: "oklch(0.60 0.010 250)" }}>
                                  <Clock className="w-3 h-3" />
                                  {notif.time}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => acknowledge(notif.id)}
                                    className="px-2 py-0.5 rounded text-[10px] font-medium transition-all"
                                    style={{ background: "oklch(0 0 0 / 8%)", color: "oklch(0.50 0.010 250)" }}
                                  >
                                    Dismiss
                                  </button>
                                  <button
                                    onClick={() => handleNavigate(notif.href, notif.id)}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all"
                                    style={{ background: sev.color, color: "white" }}
                                  >
                                    {notif.type === "work-order" ? "View WO" : "Dispatch"}
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Acknowledged */}
              {acknowledged.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "oklch(0.70 0.010 250)" }}>
                    Acknowledged ({acknowledged.length})
                  </div>
                  {acknowledged.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => handleNavigate(notif.href, notif.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                      style={{ opacity: 0.6 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.965 0.005 240)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <notif.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.65 0.010 250)" }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium truncate" style={{ color: "oklch(0.50 0.010 250)" }}>
                          {notif.title}
                        </div>
                        <div className="text-[10px]" style={{ color: "oklch(0.65 0.010 250)" }}>
                          {notif.time}
                        </div>
                      </div>
                      <ArrowRight className="w-3 h-3 flex-shrink-0 opacity-40" />
                    </button>
                  ))}
                </div>
              )}

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <CheckCircle2 className="w-10 h-10 mb-3" style={{ color: "oklch(0.55 0.18 145)" }} />
                  <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>All clear</div>
                  <div className="text-[12px] mt-1" style={{ color: "oklch(0.60 0.010 250)" }}>
                    No unacknowledged alerts or overdue work orders
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-4 py-3 border-t flex-shrink-0"
              style={{ borderColor: "oklch(0 0 0 / 8%)", background: "oklch(0.975 0.004 240)" }}
            >
              <button
                onClick={() => { navigate("/operations"); setPanelOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded text-[12px] font-medium transition-all"
                style={{ background: "oklch(0.45 0.20 240 / 10%)", color: "oklch(0.38 0.18 240)", border: "1px solid oklch(0.45 0.20 240 / 20%)" }}
              >
                View All Work Orders
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
