/**
 * CommandPalette — Global Cmd+K search
 * Searches across work orders, permits, audit findings, IoT alerts, and grant records.
 * Opens on Cmd+K (Mac) or Ctrl+K (Windows/Linux) from any page.
 * Uses a shared context so Navbar button and AppShell keyboard listener share the same state.
 */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useLocation } from "wouter";
import {
  Search, LayoutDashboard, Shield, Wrench, Map, FileText,
  ShieldCheck, Droplets, Trees, HardHat, BarChart3, Cpu,
  Building2, Users, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, Zap, Lock, Leaf, Activity
} from "lucide-react";

// ── Context ───────────────────────────────────────────────────────────────────
interface CommandPaletteContextType {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}

// ── Search index ──────────────────────────────────────────────────────────────
const SEARCH_ITEMS = [
  // Pages
  { id: "nav-dashboard", type: "page", label: "Executive Dashboard", description: "FY2024 budget scorecards, 9 departments", href: "/dashboard", icon: LayoutDashboard, tags: ["dashboard", "budget", "overview"] },
  { id: "nav-audit", type: "page", label: "Audit Studio", description: "FY2024 audit findings & compliance", href: "/audit", icon: Shield, tags: ["audit", "compliance", "findings"] },
  { id: "nav-operations", type: "page", label: "Operations Center", description: "Work orders, dispatch, field crew", href: "/operations", icon: Wrench, tags: ["work orders", "dispatch", "operations"] },
  { id: "nav-map", type: "page", label: "Spatial Map", description: "IoT sensor map, live alerts, West Liberty", href: "/map", icon: Map, tags: ["map", "sensors", "iot", "gis"] },
  { id: "nav-le", type: "page", label: "Law Enforcement Hub", description: "CAD, fleet, body cameras, evidence", href: "/le-hub", icon: ShieldCheck, tags: ["police", "law enforcement", "cad", "evidence"] },
  { id: "nav-utilities", type: "page", label: "Utilities Hub", description: "Water, sewer, gas, electric management", href: "/utilities", icon: Droplets, tags: ["water", "sewer", "utilities", "iot"] },
  { id: "nav-parks", type: "page", label: "Parks & Recreation Hub", description: "Facilities, IrriSmart, TrailCam, Wildcat Park", href: "/parks", icon: Trees, tags: ["parks", "recreation", "irrigation", "wildcat"] },
  { id: "nav-community", type: "page", label: "Community Development Hub", description: "TIF districts, permits, grants, budget overrun", href: "/community-dev", icon: HardHat, tags: ["community development", "tif", "permits", "grants"] },
  { id: "nav-records", type: "page", label: "Records Management", description: "Blockchain audit log, physical control", href: "/records", icon: FileText, tags: ["records", "documents", "audit", "blockchain"] },
  { id: "nav-secure", type: "page", label: "Secure Modules", description: "Evidence room, SCIF, detention center", href: "/secure", icon: Lock, tags: ["evidence", "scif", "detention", "secure"] },
  { id: "nav-hardware", type: "page", label: "IoT Hardware Marketplace", description: "12 patentable devices, procurement cart", href: "/hardware", icon: Cpu, tags: ["iot", "hardware", "sensors", "procurement"] },
  { id: "nav-capital", type: "page", label: "Capital Hub", description: "Revenue bonds, municipal IP funding", href: "/capital-hub", icon: BarChart3, tags: ["capital", "bonds", "funding", "finance"] },
  { id: "nav-datacenter", type: "page", label: "Data Center Marketplace", description: "Distributed compute, resident revenue sharing", href: "/data-center", icon: Activity, tags: ["data center", "compute", "residents", "revenue"] },
  { id: "nav-resident", type: "page", label: "Resident Portal", description: "Sign up to lease compute capacity, earn monthly", href: "/resident", icon: Users, tags: ["resident", "compute", "earnings", "portal"] },
  { id: "nav-council", type: "page", label: "City Council Report", description: "Print-ready monthly packet for Council meetings", href: "/council-report", icon: Building2, tags: ["council", "report", "print", "packet"] },
  { id: "nav-platform", type: "page", label: "Platform Architecture", description: "Azure, Entra ID, SCADA, GIS, AI stack", href: "/platform", icon: Zap, tags: ["platform", "architecture", "azure", "ai"] },
  { id: "nav-solutions", type: "page", label: "Solutions", description: "Department-specific solution cards", href: "/solutions", icon: CheckCircle2, tags: ["solutions", "departments"] },
  { id: "nav-roi", type: "page", label: "ROI Calculator", description: "West Liberty prefilled ROI projections", href: "/roi", icon: BarChart3, tags: ["roi", "calculator", "savings"] },
  { id: "nav-contact", type: "page", label: "Request Demo", description: "Schedule a platform demonstration", href: "/contact", icon: ArrowRight, tags: ["demo", "contact", "sales"] },
  // Work orders
  { id: "wo-001", type: "work-order", label: "WO-2024-0847 — Water Main Break", description: "Calhoun St & 3rd Ave · Critical · J. Martinez", href: "/operations", icon: AlertTriangle, tags: ["water main", "break", "critical", "calhoun"] },
  { id: "wo-002", type: "work-order", label: "WO-2024-0848 — Pothole Repair", description: "Elm St between 2nd & 3rd · In Progress · T. Wilson", href: "/operations", icon: Wrench, tags: ["pothole", "road", "repair", "elm"] },
  { id: "wo-003", type: "work-order", label: "WO-2024-0849 — Lift Station Maintenance", description: "Industrial Dr · Scheduled · R. Chen", href: "/operations", icon: Droplets, tags: ["lift station", "sewer", "maintenance"] },
  { id: "wo-004", type: "work-order", label: "WO-2024-0850 — Park Irrigation Repair", description: "Wildcat Park Zone 3 · Pending · IrriSmart alert", href: "/parks", icon: Leaf, tags: ["irrigation", "wildcat park", "repair"] },
  { id: "wo-005", type: "work-order", label: "WO-2024-0851 — Street Light Outage", description: "Hwy 6 & Columbus Junction Rd · Open · 3 lights", href: "/operations", icon: Zap, tags: ["street light", "outage", "highway 6"] },
  // Audit findings
  { id: "af-001", type: "audit", label: "AF-2024-001 — Community Dev Budget Overrun", description: "Critical · $187,100 overrun · 115% of appropriation", href: "/audit", icon: AlertTriangle, tags: ["community development", "overrun", "budget", "critical"] },
  { id: "af-002", type: "audit", label: "AF-2024-002 — TIF District Revenue Shortfall", description: "High · $47,000 shortfall · Downtown Urban Renewal TIF-1", href: "/audit", icon: AlertTriangle, tags: ["tif", "revenue", "shortfall", "downtown"] },
  { id: "af-003", type: "audit", label: "AF-2024-003 — Intergovernmental Revenue Variance", description: "High · $124,000 below projection · State allocation", href: "/audit", icon: AlertTriangle, tags: ["intergovernmental", "revenue", "state", "variance"] },
  { id: "af-004", type: "audit", label: "AF-2024-004 — Water Main Capital Carryover", description: "Medium · $310,000 carryover · Calhoun St Phase 2", href: "/audit", icon: Clock, tags: ["water main", "capital", "carryover", "calhoun"] },
  // Permits
  { id: "pm-001", type: "permit", label: "BP-2024-0312 — Commercial Renovation", description: "218 E 3rd St · Under Review · Hy-Vee Inc.", href: "/community-dev", icon: HardHat, tags: ["permit", "commercial", "renovation", "hyvee"] },
  { id: "pm-002", type: "permit", label: "BP-2024-0313 — Residential Addition", description: "445 Maple Dr · Approved · R. Hernandez", href: "/community-dev", icon: HardHat, tags: ["permit", "residential", "addition"] },
  { id: "pm-003", type: "permit", label: "BP-2024-0314 — New Construction", description: "TIF-2 Industrial Park · Pending · Grain Processing Corp", href: "/community-dev", icon: HardHat, tags: ["permit", "new construction", "industrial", "tif"] },
  // Grants
  { id: "gr-001", type: "grant", label: "CDBG-2024-WL01 — Community Dev Block Grant", description: "$450,000 · Active · Infrastructure improvements", href: "/community-dev", icon: CheckCircle2, tags: ["grant", "cdbg", "community", "infrastructure"] },
  { id: "gr-002", type: "grant", label: "IEDA-2024-WL02 — Iowa Economic Dev Grant", description: "$125,000 · Pending · Downtown revitalization", href: "/community-dev", icon: Clock, tags: ["grant", "ieda", "economic", "downtown"] },
  // IoT alerts
  { id: "iot-001", type: "iot-alert", label: "ALERT: Water Tower Pressure Low", description: "Node WL-WT-01 · 58 PSI (threshold: 65) · Auto-dispatched", href: "/map", icon: AlertTriangle, tags: ["water tower", "pressure", "alert", "iot"] },
  { id: "iot-002", type: "iot-alert", label: "ALERT: Lift Station High Level", description: "Node WL-LS-01 · Industrial Dr · 87% capacity", href: "/map", icon: AlertTriangle, tags: ["lift station", "level", "alert", "sewer"] },
  { id: "iot-003", type: "iot-alert", label: "ALERT: Park Soil Moisture Low", description: "IrriSmart WL-PK-01 · Wildcat Park Zone 3 · 18% moisture", href: "/parks", icon: Leaf, tags: ["soil", "moisture", "irrigation", "wildcat park"] },
];

type SearchItem = typeof SEARCH_ITEMS[number];

const TYPE_LABELS: Record<string, string> = {
  page: "Pages",
  "work-order": "Work Orders",
  audit: "Audit Findings",
  permit: "Permits",
  grant: "Grants",
  "iot-alert": "IoT Alerts",
};

const TYPE_COLORS: Record<string, string> = {
  page: "oklch(0.45 0.20 240)",
  "work-order": "oklch(0.50 0.20 35)",
  audit: "oklch(0.50 0.22 25)",
  permit: "oklch(0.45 0.18 145)",
  grant: "oklch(0.45 0.18 145)",
  "iot-alert": "oklch(0.55 0.20 55)",
};

// ── Palette UI ────────────────────────────────────────────────────────────────
export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setOpen]);

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const filtered = query.trim() === ""
    ? SEARCH_ITEMS.slice(0, 12)
    : SEARCH_ITEMS.filter(item => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some(t => t.includes(q))
        );
      });

  const grouped = filtered.reduce<Record<string, SearchItem[]>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  const handleSelect = useCallback((href: string) => {
    navigate(href);
    setOpen(false);
  }, [navigate, setOpen]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      style={{ background: "oklch(0 0 0 / 40%)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="w-full max-w-xl mx-4 rounded-xl overflow-hidden"
        style={{
          background: "var(--background)",
          border: "1px solid oklch(0 0 0 / 10%)",
          boxShadow: "0 24px 64px oklch(0 0 0 / 20%)",
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.55 0.010 250)" }} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search work orders, permits, audit findings, IoT alerts…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--foreground)", fontFamily: "'DM Sans', sans-serif" }}
          />
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "oklch(0.93 0.004 250)", color: "oklch(0.50 0.010 250)", border: "1px solid oklch(0 0 0 / 12%)" }}>ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: "oklch(0.55 0.010 250)" }}>
              No results for "<span style={{ color: "var(--foreground)" }}>{query}</span>"
            </div>
          ) : (
            Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "oklch(0.60 0.010 250)" }}>
                  {TYPE_LABELS[type] || type}
                </div>
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.href)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                    style={{ background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.965 0.005 240)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: `${TYPE_COLORS[item.type]}18` }}
                    >
                      <item.icon className="w-3.5 h-3.5" style={{ color: TYPE_COLORS[item.type] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: "var(--foreground)" }}>
                        {item.label}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: "oklch(0.55 0.010 250)" }}>
                        {item.description}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 opacity-30" />
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 8%)", background: "oklch(0.975 0.004 240)" }}>
          <div className="flex items-center gap-3 text-[10px]" style={{ color: "oklch(0.60 0.010 250)" }}>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: "oklch(0.93 0.004 250)", border: "1px solid oklch(0 0 0 / 12%)" }}>↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: "oklch(0.93 0.004 250)", border: "1px solid oklch(0 0 0 / 12%)" }}>↵</kbd>
              open
            </span>
          </div>
          <div className="text-[10px]" style={{ color: "oklch(0.65 0.010 250)" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
