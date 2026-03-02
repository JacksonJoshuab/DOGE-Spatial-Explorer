/**
 * Roadmap — Civic Intelligence Dark
 * Platform development timeline and upcoming features
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, Clock, Zap, ArrowRight } from "lucide-react";

const PHASES = [
  {
    phase: "Phase 1",
    title: "Foundation",
    period: "Q1–Q2 2024",
    status: "complete",
    color: "oklch(0.65 0.18 145)",
    items: [
      { name: "Executive Dashboard (budget vs. actual)", done: true },
      { name: "9-department data model", done: true },
      { name: "FY2024 financial data integration", done: true },
      { name: "Audit Studio — finding management", done: true },
      { name: "Basic IoT node status monitoring", done: true },
    ],
  },
  {
    phase: "Phase 2",
    title: "IoT & Operations",
    period: "Q3–Q4 2024",
    status: "complete",
    color: "oklch(0.65 0.18 145)",
    items: [
      { name: "SmartValve Pro deployment (12 nodes)", done: true },
      { name: "AquaSentinel water quality network", done: true },
      { name: "Operations Center work order management", done: true },
      { name: "Spatial Map with asset overlays", done: true },
      { name: "SCADA integration (water/sewer)", done: true },
    ],
  },
  {
    phase: "Phase 3",
    title: "Compliance & Security",
    period: "Q1 2025",
    status: "complete",
    color: "oklch(0.65 0.18 145)",
    items: [
      { name: "Records Management (Iowa Code §22)", done: true },
      { name: "Blockchain audit trail", done: true },
      { name: "Evidence Room monitoring", done: true },
      { name: "SCIF management module", done: true },
      { name: "Detention Center wellness tracking", done: true },
    ],
  },
  {
    phase: "Phase 4",
    title: "IP & Capital Markets",
    period: "Q2 2025",
    status: "active",
    color: "oklch(0.70 0.18 240)",
    items: [
      { name: "IoT Hardware Marketplace launch", done: true },
      { name: "USPTO patent filing (7 of 12)", done: true },
      { name: "Capital Hub — bond offering portal", done: true },
      { name: "IP licensing pipeline tracker", done: true },
      { name: "Distributed Data Center marketplace", done: false },
    ],
  },
  {
    phase: "Phase 5",
    title: "AI & Predictive",
    period: "Q3–Q4 2025",
    status: "planned",
    color: "oklch(0.75 0.18 75)",
    items: [
      { name: "Predictive maintenance ML models", done: false },
      { name: "Budget anomaly detection AI", done: false },
      { name: "Natural language query interface", done: false },
      { name: "Automated CAFR report generation", done: false },
      { name: "AI-assisted grant writing", done: false },
    ],
  },
  {
    phase: "Phase 6",
    title: "Multi-City Network",
    period: "Q1 2026",
    status: "planned",
    color: "oklch(0.62 0.22 25)",
    items: [
      { name: "Iowa municipal network (50+ cities)", done: false },
      { name: "Cross-city IP licensing exchange", done: false },
      { name: "Statewide distributed data center", done: false },
      { name: "Iowa DAS integration (state reporting)", done: false },
      { name: "Federal grant automation (BRIC, ARPA)", done: false },
    ],
  },
];

export default function Roadmap() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.11 0.012 250)" }}>
      <Navbar />

      <section className="py-16 border-b" style={{ background: "oklch(0.13 0.013 250)", borderColor: "oklch(1 0 0 / 8%)" }}>
        <div className="container">
          <div className="section-label mb-3">Product Roadmap</div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.95 0.008 240)" }}>
            Platform Roadmap
          </h1>
          <p className="text-sm max-w-xl" style={{ color: "oklch(0.60 0.010 250)" }}>
            Six phases from foundation to a statewide Iowa municipal intelligence network.
            Phases 1–3 complete. Phase 4 active.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: "oklch(1 0 0 / 10%)" }} />

            <div className="space-y-8 pl-12">
              {PHASES.map((phase) => (
                <div key={phase.phase} className="relative">
                  {/* Timeline dot */}
                  <div
                    className="absolute -left-12 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: `${phase.color.replace(")", " / 15%)")}`,
                      border: `2px solid ${phase.color}`,
                      top: "4px",
                    }}
                  >
                    {phase.status === "complete" ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: phase.color }} />
                    ) : phase.status === "active" ? (
                      <Zap className="w-4 h-4" style={{ color: phase.color }} />
                    ) : (
                      <Clock className="w-4 h-4" style={{ color: phase.color }} />
                    )}
                  </div>

                  <div className="p-5 rounded-xl" style={{ background: "oklch(0.16 0.014 250)", border: `1px solid ${phase.color.replace(")", " / 20%)")}` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-[10px] font-mono mb-0.5" style={{ color: phase.color }}>{phase.phase} · {phase.period}</div>
                        <h3 className="text-lg font-bold" style={{ color: "oklch(0.88 0.008 240)", fontFamily: "'Syne', sans-serif" }}>{phase.title}</h3>
                      </div>
                      <span className={`badge-${phase.status === "complete" ? "success" : phase.status === "active" ? "info" : "warning"}`}>
                        {phase.status === "complete" ? "Complete" : phase.status === "active" ? "In Progress" : "Planned"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {phase.items.map((item) => (
                        <div key={item.name} className="flex items-center gap-2 text-xs" style={{ color: item.done ? "oklch(0.65 0.010 250)" : "oklch(0.45 0.008 250)" }}>
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: item.done ? phase.color : "oklch(0.35 0.008 250)" }} />
                          {item.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
