/**
 * Navbar — Civic Intelligence Light
 * Sticky top nav with platform branding, main nav links, and dashboard CTA
 * White background with institutional blue accents
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Building2, Menu, X, ChevronDown, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "/platform", label: "Platform" },
  { href: "/solutions", label: "Solutions" },
  { href: "/hardware", label: "IoT Hardware" },
  { href: "/data-center", label: "Data Center" },
  { href: "/capital-hub", label: "Capital Hub" },
  { href: "/roadmap", label: "Roadmap" },
];

const DROPDOWN_LINKS = [
  { href: "/dashboard", label: "Executive Dashboard" },
  { href: "/audit", label: "Audit Studio" },
  { href: "/operations", label: "Operations Center" },
  { href: "/map", label: "Spatial Map" },
  { href: "/records", label: "Records Management" },
  { href: "/secure", label: "Secure Modules" },
];

const PUBLIC_PORTAL_LINKS = [
  { href: "/resident", label: "Resident Portal" },
  { href: "/roi", label: "ROI Calculator" },
  { href: "/contact", label: "Request Demo" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dashOpen, setDashOpen] = useState(false);
  const [location] = useLocation();

  const isDashboard = location.startsWith("/dashboard") || location.startsWith("/audit") ||
    location.startsWith("/operations") || location.startsWith("/map") ||
    location.startsWith("/records") || location.startsWith("/secure");

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "oklch(1 0 0 / 96%)",
        borderColor: "oklch(0 0 0 / 8%)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="container flex items-center justify-between h-14 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline flex-shrink-0 group">
          <div
            className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.45 0.20 240 / 12%)", border: "1px solid oklch(0.45 0.20 240 / 25%)" }}
          >
            <Building2 className="w-3.5 h-3.5" style={{ color: "oklch(0.40 0.18 240)" }} />
          </div>
          <div className="hidden sm:block">
            <div
              className="text-sm font-bold leading-none tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}
            >
              DOGE & Associates
            </div>
            <div className="text-[9px] uppercase tracking-[0.18em] mt-0.5" style={{ color: "oklch(0.50 0.012 250)" }}>
              Municipal Platform
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-[13px] rounded transition-all no-underline"
              style={{
                color: location === link.href ? "oklch(0.38 0.18 240)" : "oklch(0.35 0.014 250)",
                background: location === link.href ? "oklch(0.45 0.20 240 / 10%)" : "transparent",
                fontWeight: location === link.href ? "500" : "400",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Dashboard dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setDashOpen(!dashOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[13px] font-medium transition-all"
              style={{
                background: isDashboard ? "oklch(0.45 0.20 240 / 14%)" : "oklch(0.45 0.20 240 / 8%)",
                color: "oklch(0.38 0.18 240)",
                border: "1px solid oklch(0.45 0.20 240 / 20%)",
              }}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
              <ChevronDown className={`w-3 h-3 transition-transform ${dashOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {dashOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 w-52 rounded-lg overflow-hidden z-50"
                  style={{
                    background: "oklch(1 0 0)",
                    border: "1px solid oklch(0 0 0 / 10%)",
                    boxShadow: "0 8px 32px oklch(0 0 0 / 12%)",
                  }}
                >
                  <div className="p-1">
                    {DROPDOWN_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setDashOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded text-[13px] transition-all no-underline"
                        style={{
                          color: location === link.href ? "oklch(0.38 0.18 240)" : "oklch(0.35 0.014 250)",
                          background: location === link.href ? "oklch(0.45 0.20 240 / 10%)" : "transparent",
                        }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/resident"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded text-[13px] font-medium no-underline transition-all"
            style={{
              background: "oklch(0.45 0.18 145 / 12%)",
              color: "oklch(0.32 0.18 145)",
              border: "1px solid oklch(0.45 0.18 145 / 25%)",
            }}
          >
            Resident Portal
          </Link>

          <Link
            href="/contact"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded text-[13px] font-semibold no-underline transition-all"
            style={{
              background: "oklch(0.45 0.20 240)",
              color: "oklch(0.18 0.018 250)",
            }}
          >
            Request Demo
          </Link>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-1.5 rounded transition-colors"
            style={{ color: "oklch(0.35 0.014 250)" }}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t overflow-hidden"
            style={{ borderColor: "oklch(0 0 0 / 8%)", background: "oklch(0.975 0.004 240)" }}
          >
            <div className="container py-3 space-y-0.5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded text-sm transition-all no-underline"
                  style={{ color: "oklch(0.35 0.014 250)" }}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t pt-2 mt-2" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
                <Link
                  href="/resident"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded text-sm font-medium no-underline mb-1"
                  style={{ color: "oklch(0.32 0.18 145)", background: "oklch(0.45 0.18 145 / 8%)" }}
                >
                  Resident Portal
                </Link>
              </div>
              <div className="border-t pt-2 mt-2" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="section-label px-3 mb-1">Dashboard</div>
                {DROPDOWN_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded text-sm transition-all no-underline"
                    style={{ color: "oklch(0.38 0.18 240)" }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="block mt-2 px-3 py-2 rounded text-sm font-semibold text-center no-underline"
                style={{ background: "oklch(0.45 0.20 240)", color: "oklch(0.18 0.018 250)" }}
              >
                Request Demo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
