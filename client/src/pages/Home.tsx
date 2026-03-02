/**
 * Home Page — Civic Intelligence Light
 * Hero with dark overlay (image is dark), all other sections light
 * Prefilled with City of West Liberty, IA FY2024 data
 */
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Building2, Cpu, DollarSign, Server, Shield, FileText,
  Wifi, TrendingDown, BarChart3, MapPin, AlertTriangle, CheckCircle2,
  ChevronRight, Zap, Lock, LayoutDashboard
} from "lucide-react";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/116029439/ZyKC8HNSGdSzNP3yqHmgR7/hero-dashboard_2d1ed3e1.png";
const IOT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/116029439/ZyKC8HNSGdSzNP3yqHmgR7/hero-iot_0086da13.png";
const DC_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/116029439/ZyKC8HNSGdSzNP3yqHmgR7/hero-datacenter_d0bf0abc.png";
const SECURE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/116029439/ZyKC8HNSGdSzNP3yqHmgR7/hero-secure_5c5599c0.png";

function AnimatedCounter({ target, prefix = "", suffix = "", decimals = 0 }: {
  target: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const duration = 1200;
        const step = (timestamp: number) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(parseFloat((eased * target).toFixed(decimals)));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, decimals]);
  return (
    <span ref={ref} className="font-mono">
      {prefix}{decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString()}{suffix}
    </span>
  );
}

const MODULES = [
  {
    icon: BarChart3,
    label: "Executive Dashboard",
    desc: "Real-time budget vs. actual across all 9 departments. FY2024 surplus tracking, audit queue, and critical alerts.",
    href: "/dashboard",
    color: "oklch(0.40 0.18 240)",
    badge: "LIVE",
  },
  {
    icon: Cpu,
    label: "IoT Hardware Marketplace",
    desc: "12 patentable IoT devices for utility valves, LE sensors, public works, and parks. Full procurement catalog.",
    href: "/hardware",
    color: "oklch(0.50 0.18 75)",
    badge: "NEW",
  },
  {
    icon: Server,
    label: "Distributed Data Center",
    desc: "Municipal edge network. Residents lease computing capacity and receive direct monthly ACH payments.",
    href: "/data-center",
    color: "oklch(0.38 0.18 145)",
    badge: "EARN",
  },
  {
    icon: DollarSign,
    label: "Capital Hub",
    desc: "Revenue bonds, TIF financing, and investor portal. $3.375M active raise across 3 instruments.",
    href: "/capital-hub",
    color: "oklch(0.38 0.18 145)",
    badge: "RAISE",
  },
  {
    icon: FileText,
    label: "Records Management",
    desc: "Blockchain-anchored audit trail. IoT physical location monitoring. Iowa Code Ch. 22 compliant.",
    href: "/records",
    color: "oklch(0.40 0.18 240)",
    badge: "SECURE",
  },
  {
    icon: Lock,
    label: "Secure Modules",
    desc: "Evidence room chain of custody, SCIF management with Faraday cage monitoring, detention center wellness.",
    href: "/secure",
    color: "oklch(0.45 0.22 25)",
    badge: "TS/SCI",
  },
];

const STATS = [
  { label: "FY2024 Revenue", value: 17.5, suffix: "M", prefix: "$", decimals: 1, color: "oklch(0.38 0.18 145)" },
  { label: "Total Expenditures", value: 17.3, suffix: "M", prefix: "$", decimals: 1, color: "oklch(0.40 0.18 240)" },
  { label: "Population Served", value: 3858, suffix: "", prefix: "", decimals: 0, color: "oklch(0.50 0.18 75)" },
  { label: "IoT Nodes Online", value: 47, suffix: "", prefix: "", decimals: 0, color: "oklch(0.38 0.18 145)" },
  { label: "Departments Monitored", value: 9, suffix: "", prefix: "", decimals: 0, color: "oklch(0.40 0.18 240)" },
  { label: "Audit Findings", value: 6, suffix: "", prefix: "", decimals: 0, color: "oklch(0.50 0.18 75)" },
];

const DEPT_BUDGETS = [
  { dept: "General Government", budget: 1420000, actual: 1398000, pct: 98.5, status: "green" },
  { dept: "Public Safety", budget: 2180000, actual: 2038000, pct: 93.5, status: "green" },
  { dept: "Public Works", budget: 3250000, actual: 3189000, pct: 98.1, status: "green" },
  { dept: "Community Development", budget: 505000, actual: 581000, pct: 115.0, status: "red" },
  { dept: "Parks & Recreation", budget: 890000, actual: 799000, pct: 89.8, status: "green" },
  { dept: "Utilities — Water", budget: 4200000, actual: 4156000, pct: 99.0, status: "green" },
  { dept: "Utilities — Sewer", budget: 2800000, actual: 2743000, pct: 97.9, status: "green" },
  { dept: "Debt Service", budget: 1823964, actual: 1823964, pct: 100.0, status: "amber" },
  { dept: "Capital Projects", budget: 265129, actual: 605129, pct: 128.3, status: "red" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.975 0.004 240)" }}>
      <Navbar />

      {/* ===== HERO — dark overlay on dark image, white text ===== */}
      <section className="relative overflow-hidden" style={{ minHeight: "88vh" }}>
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="West Liberty aerial night view"
            className="w-full h-full object-cover"
            style={{ opacity: 0.5 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, oklch(0.12 0.015 250 / 92%) 0%, oklch(0.14 0.015 250 / 75%) 50%, oklch(0.12 0.015 250 / 88%) 100%)"
            }}
          />
          <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0 0 0 / 3%) 2px, oklch(0 0 0 / 3%) 4px)" }} />
        </div>

        <div className="relative container flex flex-col justify-center" style={{ minHeight: "88vh", paddingTop: "5rem", paddingBottom: "5rem" }}>
          <div className="max-w-3xl">
            {/* Tag line */}
            <div className="flex items-center gap-2 mb-6 animate-fade-up">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  background: "oklch(0.55 0.20 240 / 20%)",
                  border: "1px solid oklch(0.65 0.20 240 / 40%)",
                  color: "oklch(0.80 0.15 240)",
                }}
              >
                <span className="status-dot blue" />
                West Liberty, IA · FY2024 Live Data
              </div>
              <div
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  background: "oklch(0.65 0.18 75 / 20%)",
                  border: "1px solid oklch(0.75 0.18 75 / 40%)",
                  color: "oklch(0.82 0.15 75)",
                }}
              >
                Muscatine County
              </div>
            </div>

            {/* Headline — white text on dark hero */}
            <h1
              className="mb-6 leading-[1.05] animate-fade-up"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                color: "oklch(0.96 0.006 240)",
                animationDelay: "60ms",
              }}
            >
              Municipal Efficiency<br />
              <span style={{ color: "oklch(0.72 0.18 240)" }}>Intelligence Platform</span>
            </h1>

            <p
              className="text-base leading-relaxed mb-8 max-w-xl animate-fade-up"
              style={{ color: "oklch(0.75 0.008 240)", animationDelay: "120ms" }}
            >
              AI-powered civic operations for West Liberty, Iowa. Real-time budget monitoring,
              IoT infrastructure sensors, distributed edge computing with resident revenue sharing,
              and classified-grade records management — all in one platform.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: "180ms" }}>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm no-underline transition-all"
                style={{ background: "oklch(0.50 0.20 240)", color: "oklch(0.98 0.005 240)" }}
              >
                <LayoutDashboard className="w-4 h-4" />
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm no-underline transition-all"
                style={{
                  background: "oklch(1 0 0 / 10%)",
                  border: "1px solid oklch(1 0 0 / 25%)",
                  color: "oklch(0.92 0.006 240)",
                }}
              >
                Request Demo
              </Link>
            </div>

            {/* Live alert */}
            <div
              className="mt-8 inline-flex items-center gap-2.5 px-3 py-2 rounded animate-fade-up"
              style={{
                background: "oklch(0.55 0.22 25 / 15%)",
                border: "1px solid oklch(0.65 0.22 25 / 30%)",
                animationDelay: "240ms",
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.20 25)" }} />
              <span className="text-xs" style={{ color: "oklch(0.85 0.10 25)" }}>
                <strong>Critical Alert:</strong> Community Development 115% over FY2024 budget — $76K overrun
              </span>
            </div>
          </div>

          {/* Floating stats panel — dark glass on dark hero */}
          <div
            className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:block w-64 rounded-lg p-4 animate-fade-up"
            style={{
              background: "oklch(0.14 0.014 250 / 85%)",
              border: "1px solid oklch(1 0 0 / 12%)",
              backdropFilter: "blur(12px)",
              animationDelay: "300ms",
            }}
          >
            <div className="section-label mb-3" style={{ color: "oklch(0.50 0.010 250)" }}>Live Budget Monitor</div>
            <div className="space-y-2">
              {DEPT_BUDGETS.slice(0, 5).map((d) => (
                <div key={d.dept}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] truncate" style={{ color: "oklch(0.62 0.008 240)", maxWidth: "140px" }}>{d.dept}</span>
                    <span
                      className="text-[10px] font-mono font-semibold"
                      style={{ color: d.status === "red" ? "oklch(0.72 0.20 25)" : d.status === "amber" ? "oklch(0.72 0.18 75)" : "oklch(0.65 0.18 145)" }}
                    >
                      {d.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "oklch(1 0 0 / 10%)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(d.pct, 100)}%`,
                        background: d.status === "red" ? "oklch(0.62 0.22 25)" : d.status === "amber" ? "oklch(0.65 0.18 75)" : "oklch(0.55 0.20 240)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard"
              className="mt-3 flex items-center gap-1 text-[10px] no-underline"
              style={{ color: "oklch(0.70 0.18 240)" }}
            >
              View all departments <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR — light ===== */}
      <section
        className="border-y py-8"
        style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}
      >
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="metric-value" style={{ color: stat.color }}>
                  <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
                </div>
                <div className="section-label mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MODULES GRID — light ===== */}
      <section className="py-20" style={{ background: "oklch(0.975 0.004 240)" }}>
        <div className="container">
          <div className="mb-12">
            <div className="section-label mb-3">Platform Modules</div>
            <h2
              className="text-3xl md:text-4xl font-bold leading-tight"
              style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}
            >
              Every system your city needs,<br />
              <span style={{ color: "oklch(0.40 0.18 240)" }}>unified in one platform.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {MODULES.map((mod) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="group no-underline animate-fade-up block rounded-lg p-5 transition-all"
                style={{
                  background: "oklch(1 0 0)",
                  border: "1px solid oklch(0 0 0 / 8%)",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded flex items-center justify-center"
                    style={{
                      background: `${mod.color.replace(")", " / 12%)")}`,
                      border: `1px solid ${mod.color.replace(")", " / 22%)")}`,
                    }}
                  >
                    <mod.icon className="w-4 h-4" style={{ color: mod.color }} />
                  </div>
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wider"
                    style={{
                      background: `${mod.color.replace(")", " / 12%)")}`,
                      color: mod.color,
                      border: `1px solid ${mod.color.replace(")", " / 22%)")}`,
                    }}
                  >
                    {mod.badge}
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: "oklch(0.18 0.018 250)" }}>
                  {mod.label}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "oklch(0.45 0.012 250)" }}>
                  {mod.desc}
                </p>
                <div
                  className="mt-3 flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: mod.color }}
                >
                  Open module <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BUDGET OVERVIEW — light ===== */}
      <section
        className="py-20 border-y"
        style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}
      >
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="section-label mb-3">FY2024 Budget Intelligence</div>
              <h2
                className="text-3xl font-bold mb-4"
                style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}
              >
                West Liberty Budget<br />
                <span style={{ color: "oklch(0.50 0.18 75)" }}>at a Glance</span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "oklch(0.42 0.012 250)" }}>
                Real-time monitoring of all 9 city departments against FY2024 appropriations.
                Total budget of $17.5M with a $172K surplus — except for two critical overruns
                in Community Development and Capital Projects.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Revenue", value: "$17,505,461", color: "oklch(0.38 0.18 145)", icon: TrendingDown },
                  { label: "Total Expenses", value: "$17,333,093", color: "oklch(0.40 0.18 240)", icon: BarChart3 },
                  { label: "Net Surplus", value: "+$172,368", color: "oklch(0.38 0.18 145)", icon: CheckCircle2 },
                  { label: "Debt Outstanding", value: "$1,823,964", color: "oklch(0.50 0.18 75)", icon: AlertTriangle },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-3 rounded-lg"
                    style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 8%)" }}
                  >
                    <item.icon className="w-4 h-4 mb-2" style={{ color: item.color }} />
                    <div className="metric-value text-base" style={{ color: item.color }}>{item.value}</div>
                    <div className="section-label mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department table */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid oklch(0 0 0 / 8%)" }}
            >
              <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{ background: "oklch(0.975 0.004 240)", borderColor: "oklch(0 0 0 / 8%)" }}
              >
                <span className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>
                  Department Budget vs. Actual
                </span>
                <Link href="/dashboard" className="text-xs no-underline" style={{ color: "oklch(0.40 0.18 240)" }}>
                  Full dashboard →
                </Link>
              </div>
              <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
                {DEPT_BUDGETS.map((d) => (
                  <div
                    key={d.dept}
                    className="px-4 py-2.5 flex items-center gap-3"
                    style={{ background: "oklch(1 0 0)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "oklch(0.25 0.018 250)" }}>{d.dept}</div>
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: "oklch(0.50 0.010 250)" }}>
                        ${(d.actual / 1000000).toFixed(2)}M / ${(d.budget / 1000000).toFixed(2)}M
                      </div>
                    </div>
                    <div className="w-24">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[10px] font-mono" style={{
                          color: d.status === "red" ? "oklch(0.45 0.22 25)" : d.status === "amber" ? "oklch(0.45 0.18 75)" : "oklch(0.38 0.18 145)"
                        }}>
                          {d.pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "oklch(0 0 0 / 8%)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(d.pct, 100)}%`,
                            background: d.status === "red" ? "oklch(0.50 0.22 25)" : d.status === "amber" ? "oklch(0.55 0.18 75)" : "oklch(0.45 0.20 240)",
                          }}
                        />
                      </div>
                    </div>
                    <span className={`badge-${d.status === "red" ? "critical" : d.status === "amber" ? "warning" : "success"}`}>
                      {d.status === "red" ? "OVER" : d.status === "amber" ? "WATCH" : "OK"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== IOT + DATA CENTER SPLIT — light ===== */}
      <section className="py-20" style={{ background: "oklch(0.975 0.004 240)" }}>
        <div className="container space-y-16">
          {/* IoT Hardware */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <img src={IOT_IMG} alt="IoT Hardware" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to right, oklch(0.12 0.015 250 / 25%) 0%, transparent 100%)" }} />
              <div
                className="absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-mono font-bold tracking-wider"
                style={{ background: "oklch(0.55 0.18 75 / 20%)", border: "1px solid oklch(0.55 0.18 75 / 40%)", color: "oklch(0.92 0.12 75)" }}
              >
                12 PATENTABLE DEVICES
              </div>
            </div>
            <div>
              <div className="section-label mb-3">IoT Hardware Marketplace</div>
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                Purpose-built IoT devices for<br />
                <span style={{ color: "oklch(0.50 0.18 75)" }}>every city department</span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "oklch(0.42 0.012 250)" }}>
                From SmartValve Pro water pressure monitors to PatrolMesh body camera hubs,
                every device is designed for municipal procurement with full patent claim documentation.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {["Utility Valves & Sensors", "Law Enforcement Housing", "Public Works Monitoring", "Parks & Recreation"].map((cat) => (
                  <div key={cat} className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.35 0.014 250)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.38 0.18 145)" }} />
                    {cat}
                  </div>
                ))}
              </div>
              <Link href="/hardware" className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold no-underline" style={{ background: "oklch(0.50 0.18 75 / 12%)", border: "1px solid oklch(0.55 0.18 75 / 30%)", color: "oklch(0.45 0.18 75)" }}>
                Browse Hardware Catalog <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Data Center */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <div className="section-label mb-3">Distributed Data Center</div>
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                Residents earn money from<br />
                <span style={{ color: "oklch(0.38 0.18 145)" }}>city computing capacity</span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "oklch(0.42 0.012 250)" }}>
                West Liberty's 5-node municipal edge network lets residents and businesses lease
                computing capacity. Monthly ACH payments go directly to participants — turning
                city infrastructure into a community revenue stream.
              </p>
              <div className="space-y-2 mb-6">
                {[
                  { tier: "Resident Micro", earn: "up to $8/mo", price: "$25/mo" },
                  { tier: "Business Standard", earn: "up to $45/mo", price: "$149/mo" },
                  { tier: "Enterprise Node", earn: "up to $280/mo", price: "$895/mo" },
                ].map((tier) => (
                  <div key={tier.tier} className="flex items-center justify-between px-3 py-2 rounded" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                    <span className="text-xs font-medium" style={{ color: "oklch(0.25 0.018 250)" }}>{tier.tier}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono" style={{ color: "oklch(0.38 0.18 145)" }}>Earn {tier.earn}</span>
                      <span className="text-xs font-mono" style={{ color: "oklch(0.45 0.012 250)" }}>{tier.price}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/data-center" className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold no-underline" style={{ background: "oklch(0.38 0.18 145 / 12%)", border: "1px solid oklch(0.45 0.18 145 / 30%)", color: "oklch(0.35 0.18 145)" }}>
                Explore Data Center <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="order-1 lg:order-2 relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <img src={DC_IMG} alt="Distributed Data Center" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to left, oklch(0.12 0.015 250 / 25%) 0%, transparent 100%)" }} />
              <div
                className="absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-mono font-bold tracking-wider"
                style={{ background: "oklch(0.45 0.18 145 / 20%)", border: "1px solid oklch(0.45 0.18 145 / 40%)", color: "oklch(0.92 0.12 145)" }}
              >
                5 NODES · 99.97% UPTIME
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECURE MODULES TEASER — dark section (image is dark, keep dark) ===== */}
      <section
        className="py-20 border-y relative overflow-hidden"
        style={{ background: "oklch(0.14 0.015 250)", borderColor: "oklch(1 0 0 / 8%)" }}
      >
        <div className="absolute inset-0">
          <img src={SECURE_IMG} alt="Secure modules" className="w-full h-full object-cover" style={{ opacity: 0.15 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, oklch(0.14 0.015 250 / 95%) 40%, oklch(0.14 0.015 250 / 70%) 100%)" }} />
        </div>
        <div className="relative container">
          <div className="max-w-xl">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-4"
              style={{ background: "oklch(0.62 0.22 25 / 15%)", border: "1px solid oklch(0.62 0.22 25 / 30%)", color: "oklch(0.72 0.20 25)" }}
            >
              <Lock className="w-3 h-3" />
              CLASSIFIED MODULES
            </div>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.94 0.006 240)" }}>
              Evidence rooms. SCIF facilities.<br />
              <span style={{ color: "oklch(0.72 0.20 25)" }}>Detention center monitoring.</span>
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "oklch(0.65 0.008 240)" }}>
              Modular add-ins for law enforcement. Blockchain chain of custody for evidence,
              Faraday cage integrity monitoring for SCIFs, and automated wellness check logging
              for detention facilities.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Evidence Room", desc: "Chain of custody + IoT environmental monitoring" },
                { label: "SCIF Management", desc: "TS/SCI zones + EM shielding + RF anomaly detection" },
                { label: "Detention Center", desc: "Cell status board + wellness check automation" },
              ].map((mod) => (
                <div key={mod.label} className="p-3 rounded-lg" style={{ background: "oklch(1 0 0 / 6%)", border: "1px solid oklch(0.62 0.22 25 / 20%)" }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: "oklch(0.72 0.20 25)" }}>{mod.label}</div>
                  <div className="text-[10px] leading-tight" style={{ color: "oklch(0.60 0.008 240)" }}>{mod.desc}</div>
                </div>
              ))}
            </div>
            <Link href="/secure" className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold no-underline" style={{ background: "oklch(0.62 0.22 25 / 15%)", border: "1px solid oklch(0.62 0.22 25 / 30%)", color: "oklch(0.72 0.20 25)" }}>
              <Lock className="w-4 h-4" />
              Access Secure Modules
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CTA — light ===== */}
      <section className="py-20" style={{ background: "oklch(0.975 0.004 240)" }}>
        <div className="container text-center">
          <div className="section-label mb-4">Get Started</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
            Ready to modernize<br />
            <span style={{ color: "oklch(0.40 0.18 240)" }}>West Liberty's operations?</span>
          </h2>
          <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "oklch(0.42 0.012 250)" }}>
            Schedule a demo with City Administrator Matt Muckler's team or explore the live dashboard now.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded font-semibold no-underline" style={{ background: "oklch(0.45 0.20 240)", color: "oklch(0.98 0.005 240)" }}>
              <LayoutDashboard className="w-4 h-4" />
              Open Dashboard
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded font-semibold no-underline" style={{ background: "oklch(0 0 0 / 5%)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.25 0.018 250)" }}>
              Request Demo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
