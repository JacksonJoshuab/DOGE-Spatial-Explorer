/**
 * DailyBrief.tsx — All American Concrete Daily Operations Brief
 *
 * Calls agents.dailyBrief tRPC mutation to generate a structured morning
 * brief synthesized from job sites, fleet, workforce, alerts, materials,
 * and live NWS weather data.
 */

import { useState } from "react";
import {
  FileText, RefreshCw, CheckCircle2, AlertTriangle, Clock,
  Truck, Users, Package, CloudSun, Building2, Zap, Bell,
  Download, ChevronDown, ChevronUp,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Markdown renderer (lightweight) ─────────────────────────────────────────
function renderMarkdown(md: string): string {
  return md
    // H3
    .replace(/^### (.+)$/gm, '<h3 class="brief-h3">$1</h3>')
    // H2
    .replace(/^## (.+)$/gm, '<h2 class="brief-h2">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered list items (handle nested *)
    .replace(/^\s{4}\*\s+(.+)$/gm, '<li class="brief-li-nested">$1</li>')
    .replace(/^\*\s+(.+)$/gm, '<li class="brief-li">$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="brief-hr" />')
    // Paragraph breaks
    .replace(/\n\n/g, '</p><p class="brief-p">')
    // Wrap in paragraph
    .replace(/^(?!<[hlu])(.+)$/gm, (line) => {
      if (line.startsWith('<')) return line;
      return `<span>${line}</span>`;
    });
}

// ─── Summary stat card ────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  alert,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  alert?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{
        background: alert ? "oklch(0.98 0.015 25)" : "oklch(0.985 0.003 240)",
        border: `1px solid ${alert ? "oklch(0.88 0.08 25)" : "oklch(0.92 0.005 240)"}`,
      }}
    >
      <div
        className="rounded-lg p-2 flex-shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "oklch(0.52 0.010 250)" }}>
          {label}
        </div>
        <div className="text-xl font-bold font-mono mt-0.5" style={{ color: alert ? "oklch(0.50 0.22 25)" : "oklch(0.18 0.018 250)" }}>
          {value}
        </div>
        {sub && (
          <div className="text-[10px] mt-0.5" style={{ color: alert ? "oklch(0.55 0.18 25)" : "oklch(0.52 0.010 250)" }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Alert badge ──────────────────────────────────────────────────────────────
function AlertBadge({ severity, text }: { severity: "warning" | "info"; text: string }) {
  const isWarn = severity === "warning";
  return (
    <div
      className="flex items-start gap-2 rounded-lg p-3"
      style={{
        background: isWarn ? "oklch(0.98 0.015 75)" : "oklch(0.985 0.005 240)",
        border: `1px solid ${isWarn ? "oklch(0.88 0.08 75)" : "oklch(0.90 0.005 240)"}`,
      }}
    >
      {isWarn
        ? <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.55 0.18 75)" }} />
        : <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.55 0.15 240)" }} />}
      <span className="text-xs" style={{ color: "oklch(0.22 0.018 250)" }}>{text}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DailyBrief() {
  const [briefResult, setBriefResult] = useState<{
    title: string;
    brief: string;
    generatedAt: string;
    notificationDelivered: boolean;
    dataSummary: {
      activeJobSites: number;
      totalFleetUnits: number;
      unitsInMaintenance: number;
      unitsInAlert: number;
      employeesOnSite: number;
      activeAlerts: number;
      lowStockMaterials: string[];
    };
  } | null>(null);
  const [expanded, setExpanded] = useState(true);

  const generateMutation = trpc.agents.dailyBrief.useMutation({
    onSuccess: (data) => {
      setBriefResult(data);
      toast.success("Daily brief generated successfully");
    },
    onError: (err) => {
      toast.error(`Brief generation failed: ${err.message}`);
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleDownload = () => {
    if (!briefResult) return;
    const blob = new Blob([`# ${briefResult.title}\n\n${briefResult.brief}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aac-daily-brief-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "America/Chicago",
  });

  return (
    <DashboardLayout title="Daily Operations Brief">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5" style={{ color: "oklch(0.45 0.20 240)" }} />
              <h1 className="text-xl font-bold" style={{ color: "oklch(0.14 0.018 250)" }}>
                Daily Operations Brief
              </h1>
            </div>
            <p className="text-sm" style={{ color: "oklch(0.52 0.010 250)" }}>
              {today} · All American Concrete · West Liberty, IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            {briefResult && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: "oklch(0.97 0.003 240)",
                  border: "1px solid oklch(0.88 0.005 240)",
                  color: "oklch(0.35 0.018 250)",
                }}
              >
                <Download className="w-3.5 h-3.5" />
                Download .md
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: generateMutation.isPending
                  ? "oklch(0.75 0.10 240)"
                  : "oklch(0.45 0.20 240)",
                color: "white",
                cursor: generateMutation.isPending ? "not-allowed" : "pointer",
                boxShadow: generateMutation.isPending ? "none" : "0 2px 8px oklch(0.45 0.20 240 / 30%)",
              }}
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {briefResult ? "Regenerate Brief" : "Generate Brief"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Loading state ── */}
        {generateMutation.isPending && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "oklch(0.985 0.003 240)", border: "1px solid oklch(0.92 0.005 240)" }}
          >
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: "oklch(0.55 0.18 240)" }} />
            <div className="text-sm font-medium" style={{ color: "oklch(0.22 0.018 250)" }}>
              Synthesizing operational data…
            </div>
            <div className="text-xs mt-1" style={{ color: "oklch(0.52 0.010 250)" }}>
              Pulling job sites, fleet status, workforce assignments, material inventory, and live weather
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {briefResult && !generateMutation.isPending && (
          <>
            {/* Data summary cards */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "oklch(0.45 0.010 250)" }}>
                Operational Snapshot — {briefResult.generatedAt}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <StatCard
                  icon={Building2}
                  label="Active Job Sites"
                  value={briefResult.dataSummary.activeJobSites}
                  sub="Pours scheduled today"
                  color="oklch(0.45 0.20 240)"
                />
                <StatCard
                  icon={Truck}
                  label="Fleet Units"
                  value={briefResult.dataSummary.totalFleetUnits}
                  sub={`${briefResult.dataSummary.unitsInMaintenance} in maintenance`}
                  color="oklch(0.45 0.18 145)"
                  alert={briefResult.dataSummary.unitsInAlert > 0}
                />
                <StatCard
                  icon={Users}
                  label="Crew On-Site"
                  value={briefResult.dataSummary.employeesOnSite}
                  sub="Including en-route"
                  color="oklch(0.45 0.18 270)"
                />
                <StatCard
                  icon={AlertTriangle}
                  label="Active Alerts"
                  value={briefResult.dataSummary.activeAlerts}
                  sub="Require attention"
                  color="oklch(0.55 0.18 75)"
                  alert={briefResult.dataSummary.activeAlerts > 0}
                />
              </div>
            </div>

            {/* Low stock warnings */}
            {briefResult.dataSummary.lowStockMaterials.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "oklch(0.45 0.010 250)" }}>
                  Low Stock — Reorder Required
                </div>
                <div className="flex flex-wrap gap-2">
                  {briefResult.dataSummary.lowStockMaterials.map((mat) => (
                    <div
                      key={mat}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        background: "oklch(0.98 0.015 25)",
                        border: "1px solid oklch(0.88 0.08 25)",
                        color: "oklch(0.45 0.20 25)",
                      }}
                    >
                      <Package className="w-3 h-3" />
                      {mat}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notification status */}
            <div className="flex items-center gap-2">
              {briefResult.notificationDelivered ? (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.45 0.18 145)" }}>
                  <Bell className="w-3.5 h-3.5" />
                  Owner notification delivered
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.52 0.010 250)" }}>
                  <Bell className="w-3.5 h-3.5" />
                  Notification service not configured in this environment
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.45 0.18 145)" }}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Brief generated at {briefResult.generatedAt}
              </div>
            </div>

            {/* Brief content */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid oklch(0.92 0.005 240)" }}
            >
              {/* Brief header */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                style={{ background: "oklch(0.97 0.005 240)" }}
                onClick={() => setExpanded(!expanded)}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: "oklch(0.45 0.20 240)" }} />
                  <span className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>
                    {briefResult.title}
                  </span>
                </div>
                {expanded
                  ? <ChevronUp className="w-4 h-4" style={{ color: "oklch(0.52 0.010 250)" }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: "oklch(0.52 0.010 250)" }} />}
              </div>

              {/* Brief body */}
              {expanded && (
                <div
                  className="px-5 py-5"
                  style={{ background: "white" }}
                >
                  <style>{`
                    .brief-h2 {
                      font-size: 1rem;
                      font-weight: 700;
                      color: oklch(0.14 0.018 250);
                      margin: 1.5rem 0 0.5rem;
                      padding-bottom: 0.35rem;
                      border-bottom: 2px solid oklch(0.92 0.005 240);
                    }
                    .brief-h3 {
                      font-size: 0.875rem;
                      font-weight: 600;
                      color: oklch(0.22 0.018 250);
                      margin: 1rem 0 0.35rem;
                    }
                    .brief-p {
                      font-size: 0.8125rem;
                      color: oklch(0.30 0.012 250);
                      line-height: 1.65;
                      margin: 0.5rem 0;
                    }
                    .brief-li {
                      font-size: 0.8125rem;
                      color: oklch(0.30 0.012 250);
                      line-height: 1.65;
                      margin: 0.25rem 0;
                      padding-left: 1rem;
                      list-style: disc;
                    }
                    .brief-li-nested {
                      font-size: 0.8125rem;
                      color: oklch(0.38 0.012 250);
                      line-height: 1.65;
                      margin: 0.15rem 0;
                      padding-left: 2rem;
                      list-style: circle;
                    }
                    .brief-hr {
                      border: none;
                      border-top: 1px solid oklch(0.92 0.005 240);
                      margin: 1rem 0;
                    }
                  `}</style>
                  <div
                    className="brief-content prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: `<p class="brief-p">${renderMarkdown(briefResult.brief)}</p>`,
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {!briefResult && !generateMutation.isPending && (
          <div
            className="rounded-xl p-12 text-center"
            style={{ background: "oklch(0.985 0.003 240)", border: "2px dashed oklch(0.88 0.005 240)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "oklch(0.97 0.008 240)" }}
            >
              <FileText className="w-8 h-8" style={{ color: "oklch(0.55 0.18 240)" }} />
            </div>
            <div className="text-base font-semibold mb-2" style={{ color: "oklch(0.22 0.018 250)" }}>
              No brief generated yet
            </div>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "oklch(0.52 0.010 250)" }}>
              Click <strong>Generate Brief</strong> to synthesize today's job site schedules, fleet status,
              crew assignments, material inventory, active alerts, and live weather into a structured
              morning report for the 6 AM crew meeting.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
              {[
                { icon: Building2, label: "4 Job Sites", sub: "JS-001 through JS-004" },
                { icon: Truck, label: "12 Fleet Units", sub: "Mixers, pumps, screeds" },
                { icon: Users, label: "15 Employees", sub: "Assignments & shifts" },
                { icon: AlertTriangle, label: "Active Alerts", sub: "Warnings & info items" },
                { icon: Package, label: "10 Materials", sub: "Inventory & reorder flags" },
                { icon: CloudSun, label: "Live Weather", sub: "NWS — West Liberty, IA" },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="rounded-lg p-3 flex items-start gap-2"
                  style={{ background: "oklch(0.975 0.003 240)", border: "1px solid oklch(0.92 0.005 240)" }}
                >
                  <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.55 0.15 240)" }} />
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "oklch(0.22 0.018 250)" }}>{label}</div>
                    <div className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>{sub}</div>
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
