/**
 * DashboardLayout — Civic Intelligence Light
 * Dark sidebar (standard gov dashboard pattern) + light main content area
 * Mobile: hamburger-triggered slide-out drawer overlay
 */
import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import {
  LayoutDashboard, Map, Shield, Wrench, FileText, Lock,
  Building2, Wifi, AlertTriangle, ChevronRight, ShieldCheck, Droplets,
  Menu, X, Trees, HardHat
} from "lucide-react";

const SIDEBAR_SECTIONS = [
  {
    label: "Operations",
    links: [
      { href: "/dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
      { href: "/audit", label: "Audit Studio", icon: Shield },
      { href: "/operations", label: "Operations Center", icon: Wrench },
      { href: "/map", label: "Spatial Map", icon: Map },
    ],
  },
  {
    label: "Department Hubs",
    links: [
      { href: "/le-hub", label: "LE Hub", icon: ShieldCheck },
      { href: "/utilities", label: "Utilities Hub", icon: Droplets },
      { href: "/parks", label: "Parks & Rec Hub", icon: Trees },
      { href: "/community-dev", label: "Community Dev", icon: HardHat },
    ],
  },
  {
    label: "Compliance",
    links: [
      { href: "/records", label: "Records Management", icon: FileText },
      { href: "/secure", label: "Secure Modules", icon: Lock },
    ],
  },
];

const ALERTS = [
  { text: "Community Dev 115% over budget", severity: "red" },
  { text: "TIF variance $47K", severity: "amber" },
  { text: "IoT Node #12 offline", severity: "amber" },
];

interface Props {
  children: ReactNode;
  title?: string;
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const [location] = useLocation();
  return (
    <div className="flex flex-col h-full">
      {/* City context */}
      <div className="p-4 border-b" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.45 0.20 240 / 20%)", border: "1px solid oklch(0.55 0.20 240 / 30%)" }}
          >
            <Building2 className="w-4 h-4" style={{ color: "oklch(0.70 0.18 240)" }} />
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: "oklch(0.92 0.008 240)", fontFamily: "'Syne', sans-serif" }}>
              West Liberty, IA
            </div>
            <div className="text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>
              Muscatine County · Pop. 3,858
            </div>
          </div>
        </div>
        {/* Live status */}
        <div className="mt-3 flex items-center gap-1.5">
          <Wifi className="w-3 h-3" style={{ color: "oklch(0.65 0.18 145)" }} />
          <span className="text-[10px] font-mono" style={{ color: "oklch(0.65 0.18 145)" }}>
            47 IoT nodes · LIVE
          </span>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="section-label px-2 mb-1.5" style={{ color: "oklch(0.45 0.010 250)" }}>{section.label}</div>
            <div className="space-y-0.5">
              {section.links.map((link) => {
                const active = location === link.href || location.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onLinkClick}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded text-[13px] transition-all no-underline group"
                    style={{
                      background: active ? "oklch(0.45 0.20 240 / 20%)" : "transparent",
                      color: active ? "oklch(0.75 0.18 240)" : "oklch(0.60 0.010 250)",
                      fontWeight: active ? "500" : "400",
                      borderLeft: active ? "2px solid oklch(0.58 0.20 240)" : "2px solid transparent",
                    }}
                  >
                    <link.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {link.label}
                    {active && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Alerts */}
      <div className="p-3 border-t" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
        <div className="section-label mb-2 flex items-center gap-1.5" style={{ color: "oklch(0.45 0.010 250)" }}>
          <AlertTriangle className="w-3 h-3" style={{ color: "oklch(0.75 0.18 75)" }} />
          Active Alerts
        </div>
        <div className="space-y-1.5">
          {ALERTS.map((alert, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`status-dot ${alert.severity} mt-1.5 flex-shrink-0`} />
              <span className="text-[10px] leading-tight" style={{ color: "oklch(0.55 0.010 250)" }}>
                {alert.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FY2024 mini stats */}
      <div className="p-3 border-t" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
        <div className="section-label mb-2" style={{ color: "oklch(0.45 0.010 250)" }}>FY2024 Budget</div>
        <div className="space-y-1">
          {[
            { label: "Revenue", value: "$17.5M", color: "oklch(0.65 0.18 145)" },
            { label: "Expenses", value: "$17.3M", color: "oklch(0.65 0.18 240)" },
            { label: "Surplus", value: "+$172K", color: "oklch(0.65 0.18 145)" },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>{stat.label}</span>
              <span className="text-[11px] font-mono font-semibold" style={{ color: stat.color }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children, title }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [location] = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.965 0.005 240)" }}>
      <Navbar />

      {/* Mobile top bar with hamburger */}
      <div
        className="md:hidden flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: "oklch(0.18 0.020 250)", borderColor: "oklch(1 0 0 / 8%)" }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 rounded transition-colors"
          style={{ color: "oklch(0.75 0.010 250)" }}
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4" style={{ color: "oklch(0.70 0.18 240)" }} />
          <span className="text-sm font-semibold" style={{ color: "oklch(0.90 0.008 240)", fontFamily: "'Syne', sans-serif" }}>
            West Liberty, IA
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Wifi className="w-3 h-3" style={{ color: "oklch(0.65 0.18 145)" }} />
          <span className="text-[10px] font-mono" style={{ color: "oklch(0.65 0.18 145)" }}>47 nodes · LIVE</span>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "oklch(0 0 0 / 55%)" }}
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <div
            className="relative z-10 w-64 h-full flex flex-col overflow-hidden"
            style={{ background: "oklch(0.18 0.020 250)" }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
              <span className="text-sm font-semibold" style={{ color: "oklch(0.90 0.008 240)", fontFamily: "'Syne', sans-serif" }}>
                Navigation
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded transition-colors"
                style={{ color: "oklch(0.60 0.010 250)" }}
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent onLinkClick={() => setDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar — hidden on mobile */}
        <aside
          className="hidden md:flex flex-col w-56 flex-shrink-0 border-r overflow-y-auto"
          style={{
            background: "oklch(0.18 0.020 250)",
            borderColor: "oklch(1 0 0 / 8%)",
          }}
        >
          <SidebarContent />
        </aside>

        {/* Main content — light */}
        <main className="flex-1 min-w-0 overflow-auto" style={{ background: "oklch(0.965 0.005 240)" }}>
          {title && (
            <div className="px-4 md:px-6 py-4 border-b" style={{ borderColor: "oklch(0 0 0 / 8%)", background: "oklch(1 0 0)" }}>
              <h1 className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                {title}
              </h1>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
