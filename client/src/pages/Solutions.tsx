/**
 * Solutions — Civic Intelligence Dark
 * Department-specific solution cards for all 9 West Liberty departments
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Building2, Shield, Wrench, TreePine, Droplets, DollarSign, Users, Zap, Map, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const SOLUTIONS = [
  {
    dept: "General Government",
    icon: Building2,
    color: "oklch(0.40 0.18 240)",
    budget: "$1.4M",
    headcount: 12,
    challenge: "Manual budget tracking, paper-based approvals, no real-time visibility into departmental spending.",
    capabilities: ["Real-time budget vs. actual monitoring", "AI-assisted agenda preparation", "Digital records management (Iowa Code §22)", "Automated financial reporting", "Council dashboard & public transparency portal"],
    iotDevices: [],
    roi: "Estimated 18% reduction in administrative overhead",
  },
  {
    dept: "Public Safety",
    icon: Shield,
    color: "oklch(0.50 0.22 25)",
    budget: "$2.2M",
    headcount: 18,
    challenge: "Evidence chain-of-custody gaps, manual wellness checks, no integrated body camera management.",
    capabilities: ["DOGE Sentinel Node evidence room monitoring", "Blockchain chain of custody", "PatrolMesh body camera hub", "SecureEntry biometric access control", "Detention wellness check automation", "SCIF management for sensitive ops"],
    iotDevices: ["DOGE Sentinel Node", "SecureEntry Biometric Panel", "PatrolMesh Hub"],
    roi: "Estimated 40% reduction in evidence handling time",
  },
  {
    dept: "Public Works",
    icon: Wrench,
    color: "oklch(0.55 0.18 75)",
    budget: "$3.25M",
    headcount: 24,
    challenge: "Reactive maintenance, no pavement condition data, manual work order dispatch.",
    capabilities: ["RoadSense pavement health monitoring", "StormNet drain blockage prediction", "BridgeWatch structural monitoring", "Predictive maintenance scheduling", "Work order automation & GPS dispatch", "Asset lifecycle management"],
    iotDevices: ["RoadSense Pavement Monitor", "StormNet Drain Sensor", "BridgeWatch Monitor"],
    roi: "Estimated 25% reduction in emergency repair costs",
  },
  {
    dept: "Community Development",
    icon: Map,
    color: "oklch(0.50 0.22 25)",
    budget: "$505K",
    headcount: 6,
    challenge: "FY2024 budget overrun of 115% ($76K over). Grant tracking in spreadsheets, no spatial planning tools.",
    capabilities: ["Budget alert system (prevents overruns)", "GIS-integrated permit tracking", "TIF district performance monitoring", "Grant application management", "Spatial planning & zoning tools", "Community engagement portal"],
    iotDevices: [],
    roi: "Prevent recurrence of $76K FY2024 overrun",
    alert: true,
  },
  {
    dept: "Parks & Recreation",
    icon: TreePine,
    color: "oklch(0.45 0.18 145)",
    budget: "$890K",
    headcount: 14,
    challenge: "Manual irrigation scheduling, no occupancy data for facility planning, reactive trail maintenance.",
    capabilities: ["ParkPulse occupancy analytics", "IrriSmart precision irrigation (30% water savings)", "TrailCam safety monitoring", "Facility utilization reporting", "Program registration & scheduling", "Maintenance work order integration"],
    iotDevices: ["ParkPulse Occupancy Node", "IrriSmart Soil Sensor", "TrailCam Safety Node"],
    roi: "Estimated $28K annual water savings",
  },
  {
    dept: "Water Utility",
    icon: Droplets,
    color: "oklch(0.45 0.20 240)",
    budget: "$4.2M",
    headcount: 8,
    challenge: "Aging distribution infrastructure, manual meter reading, no real-time leak detection.",
    capabilities: ["SmartValve Pro pressure/flow/leak detection", "AquaSentinel water quality monitoring", "SCADA integration (existing systems)", "AMI meter data management", "EPA compliance reporting automation", "Revenue bond performance tracking"],
    iotDevices: ["SmartValve Pro", "AquaSentinel Node"],
    roi: "Estimated 12% reduction in non-revenue water loss",
  },
  {
    dept: "Sewer / Wastewater",
    icon: Zap,
    color: "oklch(0.40 0.18 240)",
    budget: "$2.8M",
    headcount: 7,
    challenge: "Manual lift station monitoring, NPDES compliance reporting is labor-intensive.",
    capabilities: ["GasPulse methane monitoring at lift stations", "Automated NPDES compliance reporting", "SCADA integration", "Predictive pump maintenance", "Inflow/infiltration detection", "Capital project tracking"],
    iotDevices: ["GasPulse Monitor"],
    roi: "Estimated 20% reduction in compliance reporting time",
  },
  {
    dept: "Finance",
    icon: DollarSign,
    color: "oklch(0.45 0.18 145)",
    budget: "Cross-dept",
    headcount: 5,
    challenge: "Manual audit processes, TIF variance tracking in spreadsheets, no real-time budget alerts.",
    capabilities: ["Real-time budget monitoring across all 9 depts", "Automated audit flagging (AI-powered)", "TIF district performance tracking", "Capital Hub bond management", "IP royalty revenue tracking", "Iowa CAFR report automation"],
    iotDevices: [],
    roi: "Estimated 60% reduction in audit preparation time",
  },
  {
    dept: "Human Resources",
    icon: Users,
    color: "oklch(0.40 0.18 240)",
    budget: "Cross-dept",
    headcount: 3,
    challenge: "Personnel records in paper files, no digital onboarding, manual FMLA tracking.",
    capabilities: ["Digital personnel records (Iowa Code §70A.9)", "Automated retention scheduling", "Onboarding workflow automation", "FMLA & leave tracking", "Performance evaluation management", "Training compliance tracking"],
    iotDevices: [],
    roi: "Estimated 35% reduction in HR administrative time",
  },
];

export default function Solutions() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.975 0.004 240)" }}>
      <Navbar />

      {/* Header */}
      <section className="py-16 border-b" style={{ background: "oklch(0.965 0.005 240)", borderColor: "oklch(0 0 0 / 8%)" }}>
        <div className="container">
          <div className="section-label mb-3">Department Solutions</div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.95 0.008 240)" }}>
            Built for Every<br />
            <span style={{ color: "oklch(0.40 0.18 240)" }}>City Department</span>
          </h1>
          <p className="text-sm max-w-xl" style={{ color: "oklch(0.60 0.010 250)" }}>
            Purpose-built capabilities for all 9 West Liberty departments.
            Each solution addresses real operational challenges identified in the FY2024 annual report.
          </p>
        </div>
      </section>

      {/* Solutions grid */}
      <section className="py-14">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {SOLUTIONS.map((sol) => (
              <div
                key={sol.dept}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "oklch(1 0 0)",
                  border: `1px solid ${sol.alert ? "oklch(0.50 0.22 25 / 22%)" : sol.color.replace(")", " / 15%)")}`,
                }}
              >
                {sol.alert && (
                  <div className="px-4 py-1.5 text-[10px] font-bold tracking-wider" style={{ background: "oklch(0.62 0.22 25 / 15%)", color: "oklch(0.50 0.22 25)" }}>
                    ⚠ FY2024 BUDGET OVERRUN — PRIORITY DEPARTMENT
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${sol.color.replace(")", " / 12%)")}`, border: `1px solid ${sol.color.replace(")", " / 25%)")}` }}
                    >
                      <sol.icon className="w-5 h-5" style={{ color: sol.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold" style={{ color: "oklch(0.18 0.018 250)", fontFamily: "'Syne', sans-serif" }}>{sol.dept}</h3>
                      <div className="flex gap-3 text-[10px] mt-0.5">
                        <span style={{ color: "oklch(0.52 0.010 250)" }}>Budget: <span className="font-mono" style={{ color: sol.color }}>{sol.budget}</span></span>
                        <span style={{ color: "oklch(0.52 0.010 250)" }}>Staff: <span className="font-mono" style={{ color: "oklch(0.60 0.010 250)" }}>{sol.headcount}</span></span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed mb-3 italic" style={{ color: "oklch(0.48 0.012 250)" }}>
                    Challenge: {sol.challenge}
                  </p>

                  <div className="mb-3">
                    <div className="section-label mb-2">Platform Capabilities</div>
                    <div className="space-y-1">
                      {sol.capabilities.map((cap) => (
                        <div key={cap} className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.65 0.010 250)" }}>
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: sol.color }} />
                          {cap}
                        </div>
                      ))}
                    </div>
                  </div>

                  {sol.iotDevices.length > 0 && (
                    <div className="mb-3">
                      <div className="section-label mb-1.5">IoT Devices</div>
                      <div className="flex flex-wrap gap-1.5">
                        {sol.iotDevices.map((d) => (
                          <span key={d} className="text-[10px] px-2 py-0.5 rounded" style={{ background: `${sol.color.replace(")", " / 10%)")}`, color: sol.color, border: `1px solid ${sol.color.replace(")", " / 20%)")}` }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
                    <span className="text-[10px] italic" style={{ color: "oklch(0.45 0.18 145)" }}>{sol.roi}</span>
                    <Link href="/contact" className="flex items-center gap-1 text-xs no-underline" style={{ color: sol.color }}>
                      Learn more <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
