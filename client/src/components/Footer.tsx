/**
 * Footer — Civic Intelligence Dark
 * Dark footer with city contact info and platform links
 */
import { Link } from "wouter";
import { Building2, MapPin, Phone, Mail } from "lucide-react";

const PLATFORM_LINKS = [
  { href: "/platform", label: "Platform Overview" },
  { href: "/solutions", label: "Solutions" },
  { href: "/hardware", label: "IoT Hardware" },
  { href: "/data-center", label: "Data Center" },
  { href: "/capital-hub", label: "Capital Hub" },
  { href: "/roadmap", label: "Roadmap" },
];

const DASHBOARD_LINKS = [
  { href: "/dashboard", label: "Executive Dashboard" },
  { href: "/audit", label: "Audit Studio" },
  { href: "/operations", label: "Operations Center" },
  { href: "/map", label: "Spatial Map" },
  { href: "/records", label: "Records Management" },
  { href: "/secure", label: "Secure Modules" },
];

export default function Footer() {
  return (
    <footer
      className="border-t mt-auto"
      style={{
        background: "oklch(0.18 0.020 250)",
        borderColor: "oklch(0 0 0 / 8%)",
      }}
    >
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{ background: "oklch(0.45 0.20 240 / 15%)", border: "1px solid oklch(0.58 0.20 240 / 30%)" }}
              >
                <Building2 className="w-3.5 h-3.5" style={{ color: "oklch(0.40 0.18 240)" }} />
              </div>
              <div>
                <div className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  DOGE & Associates
                </div>
                <div className="text-[9px] uppercase tracking-[0.18em]" style={{ color: "oklch(0.50 0.012 250)" }}>
                  Municipal Platform
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: "oklch(0.48 0.012 250)" }}>
              AI-powered municipal efficiency platform. Serving West Liberty, IA — Population 3,858.
            </p>
            {/* City contact */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.48 0.012 250)" }}>
                <MapPin className="w-3 h-3 flex-shrink-0" />
                111 W 7th St, West Liberty, IA 52776
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.48 0.012 250)" }}>
                <Phone className="w-3 h-3 flex-shrink-0" />
                (319) 627-2418
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.48 0.012 250)" }}>
                <Mail className="w-3 h-3 flex-shrink-0" />
                cityhall@westlibertyia.gov
              </div>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <div className="section-label mb-3">Platform</div>
            <ul className="space-y-2">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs transition-colors no-underline"
                    style={{ color: "oklch(0.48 0.012 250)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dashboard links */}
          <div>
            <div className="section-label mb-3">Dashboard</div>
            <ul className="space-y-2">
              {DASHBOARD_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs transition-colors no-underline"
                    style={{ color: "oklch(0.48 0.012 250)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Status */}
          <div>
            <div className="section-label mb-3">System Status</div>
            <div className="space-y-2">
              {[
                { label: "Platform API", status: "green", text: "Operational" },
                { label: "IoT Network", status: "green", text: "47 nodes online" },
                { label: "Data Center", status: "green", text: "99.97% uptime" },
                { label: "Secure Modules", status: "amber", text: "Maintenance 03:00" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "oklch(0.48 0.012 250)" }}>{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`status-dot ${item.status}`} />
                    <span className="text-[10px] font-mono" style={{ color: "oklch(0.45 0.012 250)" }}>{item.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="section-label mb-2">FY2024 Snapshot</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: "oklch(0.48 0.012 250)" }}>Total Revenue</span>
                  <span className="font-mono" style={{ color: "oklch(0.45 0.18 145)" }}>$17.5M</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "oklch(0.48 0.012 250)" }}>Expenditures</span>
                  <span className="font-mono" style={{ color: "oklch(0.40 0.18 240)" }}>$17.3M</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "oklch(0.48 0.012 250)" }}>Surplus</span>
                  <span className="font-mono" style={{ color: "oklch(0.45 0.18 145)" }}>+$172K</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
          <p className="text-xs" style={{ color: "oklch(0.48 0.012 250)" }}>
            © 2025 DOGE & Associates. All rights reserved. City of West Liberty, IA — Muscatine County.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-xs no-underline" style={{ color: "oklch(0.48 0.012 250)" }}>Privacy</Link>
            <Link href="/contact" className="text-xs no-underline" style={{ color: "oklch(0.48 0.012 250)" }}>Terms</Link>
            <Link href="/contact" className="text-xs no-underline" style={{ color: "oklch(0.48 0.012 250)" }}>Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
