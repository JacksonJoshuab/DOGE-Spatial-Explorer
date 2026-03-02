/**
 * DashboardLayout — Civic Intelligence Dark
 * Persistent sidebar for all operational dashboard pages
 * Dark sidebar with glowing active states
 */
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import {
  LayoutDashboard, Map, Shield, Wrench, FileText, Lock,
  Building2, Wifi, AlertTriangle, ChevronRight
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

export default function DashboardLayout({ children, title }: Props) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.11 0.012 250)" }}>
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className="hidden md:flex flex-col w-56 flex-shrink-0 border-r overflow-y-auto"
          style={{
            background: "oklch(0.13 0.013 250)",
            borderColor: "oklch(1 0 0 / 8%)",
          }}
        >
          {/* City context */}
          <div className="p-4 border-b" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.58 0.20 240 / 15%)", border: "1px solid oklch(0.58 0.20 240 / 25%)" }}
              >
                <Building2 className="w-4 h-4" style={{ color: "oklch(0.70 0.18 240)" }} />
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: "oklch(0.88 0.008 240)", fontFamily: "'Syne', sans-serif" }}>
                  West Liberty, IA
                </div>
                <div className="text-[10px]" style={{ color: "oklch(0.50 0.010 250)" }}>
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
          <nav className="flex-1 p-3 space-y-4">
            {SIDEBAR_SECTIONS.map((section) => (
              <div key={section.label}>
                <div className="section-label px-2 mb-1.5">{section.label}</div>
                <div className="space-y-0.5">
                  {section.links.map((link) => {
                    const active = location === link.href || location.startsWith(link.href + "/");
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded text-[13px] transition-all no-underline group"
                        style={{
                          background: active ? "oklch(0.58 0.20 240 / 15%)" : "transparent",
                          color: active ? "oklch(0.72 0.18 240)" : "oklch(0.55 0.010 250)",
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
            <div className="section-label mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" style={{ color: "oklch(0.75 0.18 75)" }} />
              Active Alerts
            </div>
            <div className="space-y-1.5">
              {ALERTS.map((alert, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`status-dot ${alert.severity} mt-1.5 flex-shrink-0`} />
                  <span className="text-[10px] leading-tight" style={{ color: "oklch(0.50 0.010 250)" }}>
                    {alert.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* FY2024 mini stats */}
          <div className="p-3 border-t" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
            <div className="section-label mb-2">FY2024 Budget</div>
            <div className="space-y-1">
              {[
                { label: "Revenue", value: "$17.5M", color: "oklch(0.65 0.18 145)" },
                { label: "Expenses", value: "$17.3M", color: "oklch(0.70 0.18 240)" },
                { label: "Surplus", value: "+$172K", color: "oklch(0.65 0.18 145)" },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between items-center">
                  <span className="text-[10px]" style={{ color: "oklch(0.45 0.008 250)" }}>{stat.label}</span>
                  <span className="text-[11px] font-mono font-semibold" style={{ color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-auto">
          {title && (
            <div className="px-6 py-4 border-b" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
              <h1 className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.88 0.008 240)" }}>
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
