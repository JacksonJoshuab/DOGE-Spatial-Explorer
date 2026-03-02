/**
 * IP Management Pipeline — Civic Intelligence Dark
 * Patent portfolio, licensing deals, royalty tracking
 * West Liberty IoT IP from invention to royalty
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, TrendingUp, DollarSign, CheckCircle2, Clock, ArrowRight, Shield } from "lucide-react";
import { toast } from "sonner";

const PIPELINE_STAGES = [
  { id: 1, name: "Invention Disclosure", count: 3, color: "oklch(0.65 0.18 145)" },
  { id: 2, name: "Prior Art Search", count: 2, color: "oklch(0.70 0.18 240)" },
  { id: 3, name: "Patent Drafting", count: 4, color: "oklch(0.75 0.18 75)" },
  { id: 4, name: "USPTO Filed", count: 7, color: "oklch(0.58 0.20 240)" },
  { id: 5, name: "Office Action", count: 2, color: "oklch(0.75 0.18 25)" },
  { id: 6, name: "Granted", count: 0, color: "oklch(0.65 0.18 145)" },
  { id: 7, name: "Licensed", count: 0, color: "oklch(0.65 0.18 145)" },
];

const PATENTS = [
  { id: "US2024/0183421", name: "SmartValve Pro", stage: "USPTO Filed", filed: "2024-09-15", class: "G01F 1/00", royaltyRate: "3.5%", projectedRevenue: 84000 },
  { id: "US2024/0219847", name: "AquaSentinel Node", stage: "USPTO Filed", filed: "2024-10-02", class: "G01N 33/18", royaltyRate: "4.0%", projectedRevenue: 112000 },
  { id: "US2024/0251093", name: "GasPulse Monitor", stage: "USPTO Filed", filed: "2024-10-28", class: "G01M 3/28", royaltyRate: "3.0%", projectedRevenue: 67000 },
  { id: "US2024/0298156", name: "DOGE Sentinel Node", stage: "USPTO Filed", filed: "2024-11-14", class: "G08B 21/00", royaltyRate: "4.5%", projectedRevenue: 156000 },
  { id: "US2024/0312847", name: "SecureEntry Biometric Panel", stage: "USPTO Filed", filed: "2024-11-30", class: "G07C 9/00", royaltyRate: "5.0%", projectedRevenue: 245000 },
  { id: "US2024/0334521", name: "PatrolMesh Hub", stage: "Patent Drafting", filed: "—", class: "H04N 7/18", royaltyRate: "3.5%", projectedRevenue: 98000 },
  { id: "US2024/0356892", name: "RoadSense Pavement Monitor", stage: "USPTO Filed", filed: "2024-12-18", class: "E01C 23/00", royaltyRate: "3.0%", projectedRevenue: 54000 },
  { id: "US2024/0378234", name: "StormNet Drain Sensor", stage: "USPTO Filed", filed: "2025-01-08", class: "E03F 5/00", royaltyRate: "2.5%", projectedRevenue: 38000 },
  { id: "US2024/0401567", name: "BridgeWatch Monitor", stage: "Patent Drafting", filed: "—", class: "E01D 22/00", royaltyRate: "4.0%", projectedRevenue: 187000 },
  { id: "US2024/0423891", name: "ParkPulse Occupancy Node", stage: "USPTO Filed", filed: "2025-01-22", class: "G06V 20/52", royaltyRate: "2.5%", projectedRevenue: 29000 },
  { id: "US2024/0445123", name: "IrriSmart Soil Sensor", stage: "Prior Art Search", filed: "—", class: "A01G 25/16", royaltyRate: "2.0%", projectedRevenue: 22000 },
  { id: "US2024/0467345", name: "TrailCam Safety Node", stage: "Patent Drafting", filed: "—", class: "G06V 40/10", royaltyRate: "3.0%", projectedRevenue: 45000 },
];

const LICENSING_PROSPECTS = [
  { city: "Iowa City, IA", pop: 74000, devices: ["SmartValve Pro", "AquaSentinel Node"], status: "In Negotiation", value: 127000 },
  { city: "Coralville, IA", pop: 22000, devices: ["StormNet Drain Sensor", "RoadSense"], status: "LOI Signed", value: 48000 },
  { city: "Cedar Rapids, IA", pop: 137000, devices: ["SmartValve Pro", "DOGE Sentinel Node", "PatrolMesh Hub"], status: "Proposal Sent", value: 312000 },
  { city: "Dubuque, IA", pop: 59000, devices: ["BridgeWatch Monitor", "RoadSense"], status: "Initial Contact", value: 89000 },
  { city: "Davenport, IA", pop: 101000, devices: ["SecureEntry Biometric Panel", "DOGE Sentinel Node"], status: "Proposal Sent", value: 198000 },
];

const totalProjected = PATENTS.reduce((s, p) => s + p.projectedRevenue, 0);

export default function IPPipeline() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.11 0.012 250)" }}>
      <Navbar />

      {/* Header */}
      <section className="py-14 border-b" style={{ background: "oklch(0.13 0.013 250)", borderColor: "oklch(1 0 0 / 8%)" }}>
        <div className="container">
          <div className="flex items-center gap-2 mb-4">
            <span className="badge-info">12 PATENTS IN PIPELINE</span>
            <span className="badge-success">${(totalProjected / 1000000).toFixed(1)}M PROJECTED ROYALTIES</span>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.95 0.008 240)" }}>
            IP Management<br />
            <span style={{ color: "oklch(0.70 0.18 240)" }}>Pipeline</span>
          </h1>
          <p className="text-sm max-w-xl" style={{ color: "oklch(0.60 0.010 250)" }}>
            Track West Liberty's 12 patentable IoT devices from invention disclosure through USPTO filing,
            licensing negotiation, and royalty collection. Municipal IP as a revenue stream.
          </p>
        </div>
      </section>

      {/* Pipeline stages */}
      <section className="py-10 border-b" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
        <div className="container">
          <div className="section-label mb-4">Pipeline Overview</div>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={stage.id} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center px-4 py-3 rounded-lg" style={{ background: "oklch(0.16 0.014 250)", border: `1px solid ${stage.color.replace(")", " / 20%)")}`, minWidth: 120 }}>
                  <div className="metric-value text-2xl" style={{ color: stage.color }}>{stage.count}</div>
                  <div className="text-[10px] text-center mt-1" style={{ color: "oklch(0.50 0.010 250)" }}>{stage.name}</div>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className="w-4 h-4 mx-1 flex-shrink-0" style={{ color: "oklch(0.35 0.008 250)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Patent table */}
      <section className="py-12">
        <div className="container space-y-8">
          <div>
            <div className="section-label mb-4">Patent Portfolio</div>
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid oklch(1 0 0 / 8%)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "oklch(0.16 0.014 250)", borderBottom: "1px solid oklch(1 0 0 / 8%)" }}>
                      {["Application No.", "Device", "Stage", "Filed", "IPC Class", "Royalty Rate", "5-Yr Projected Revenue"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left section-label">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PATENTS.map((p) => (
                      <tr key={p.id} className="border-b" style={{ background: "oklch(0.14 0.014 250)", borderColor: "oklch(1 0 0 / 6%)" }}>
                        <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>{p.id}</td>
                        <td className="px-3 py-2.5 font-medium" style={{ color: "oklch(0.80 0.008 240)" }}>{p.name}</td>
                        <td className="px-3 py-2.5">
                          <span className={`badge-${p.stage === "USPTO Filed" ? "info" : p.stage === "Patent Drafting" ? "warning" : "success"}`}>
                            {p.stage}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: "oklch(0.50 0.010 250)" }}>{p.filed}</td>
                        <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: "oklch(0.50 0.010 250)" }}>{p.class}</td>
                        <td className="px-3 py-2.5 font-mono font-bold" style={{ color: "oklch(0.65 0.18 145)" }}>{p.royaltyRate}</td>
                        <td className="px-3 py-2.5 font-mono font-bold" style={{ color: "oklch(0.70 0.18 240)" }}>${p.projectedRevenue.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "oklch(0.16 0.014 250)", borderTop: "1px solid oklch(1 0 0 / 12%)" }}>
                      <td colSpan={6} className="px-3 py-2.5 text-right text-xs font-bold" style={{ color: "oklch(0.65 0.010 250)" }}>Total 5-Year Projected Royalties</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-sm" style={{ color: "oklch(0.65 0.18 145)" }}>${totalProjected.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Licensing prospects */}
          <div>
            <div className="section-label mb-4">Licensing Prospects — Iowa Municipalities</div>
            <div className="space-y-3">
              {LICENSING_PROSPECTS.map((p) => (
                <div key={p.city} className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "oklch(0.16 0.014 250)", border: "1px solid oklch(1 0 0 / 8%)" }}>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: "oklch(0.85 0.008 240)" }}>{p.city}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.45 0.008 250)" }}>
                      Pop. {p.pop.toLocaleString()} · Devices: {p.devices.join(", ")}
                    </div>
                  </div>
                  <span className={`badge-${p.status === "LOI Signed" ? "success" : p.status === "In Negotiation" ? "warning" : "info"}`}>
                    {p.status}
                  </span>
                  <div className="text-sm font-mono font-bold" style={{ color: "oklch(0.65 0.18 145)" }}>
                    ${p.value.toLocaleString()}
                  </div>
                  <button
                    onClick={() => toast.success(`Opening deal file for ${p.city}`)}
                    className="px-3 py-1.5 rounded text-xs font-semibold"
                    style={{ background: "oklch(0.58 0.20 240 / 15%)", border: "1px solid oklch(0.58 0.20 240 / 25%)", color: "oklch(0.70 0.18 240)" }}
                  >
                    View Deal
                  </button>
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
