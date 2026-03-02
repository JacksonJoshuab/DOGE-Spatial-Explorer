/**
 * Platform — Civic Intelligence Dark
 * Technical architecture overview: Azure, Entra ID, SCADA, GIS, AI
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Server, Shield, Cpu, Map, Wifi, Database, Lock, Cloud, ArrowRight, CheckCircle2 } from "lucide-react";

const LAYERS = [
  {
    id: "data",
    name: "Data Collection Layer",
    icon: Wifi,
    color: "oklch(0.65 0.18 145)",
    description: "12 patented IoT device families deployed across all city departments. LoRaWAN, NB-IoT, and LTE-M connectivity with edge preprocessing.",
    components: ["SmartValve Pro sensors", "DOGE Sentinel Nodes", "RoadSense pavement monitors", "ParkPulse occupancy nodes", "SCADA integration (water/sewer)", "BACnet building automation"],
  },
  {
    id: "transport",
    name: "Transport & Security Layer",
    icon: Lock,
    color: "oklch(0.58 0.20 240)",
    description: "End-to-end encrypted data transport with zero-trust network architecture. All device communications authenticated via X.509 certificates.",
    components: ["Azure IoT Hub", "TLS 1.3 encryption", "X.509 device certificates", "Azure Private Link", "VPN gateway (city network)", "FIPS 140-2 key management"],
  },
  {
    id: "platform",
    name: "Platform Core",
    icon: Cloud,
    color: "oklch(0.70 0.18 240)",
    description: "Azure-hosted platform with multi-tenant isolation, automatic scaling, and 99.99% SLA. West Liberty data never leaves Iowa-region Azure datacenters.",
    components: ["Azure Government Cloud", "Kubernetes orchestration", "PostgreSQL (Azure Managed)", "Redis cache layer", "Azure Service Bus", "Event-driven microservices"],
  },
  {
    id: "intelligence",
    name: "Intelligence Layer",
    icon: Cpu,
    color: "oklch(0.75 0.18 75)",
    description: "AI/ML models trained on municipal data for predictive maintenance, budget anomaly detection, and operational optimization.",
    components: ["Azure OpenAI (GPT-4o)", "Budget anomaly detection ML", "Predictive maintenance models", "Spatial analysis (Azure Maps)", "Natural language query interface", "Automated audit flagging"],
  },
  {
    id: "identity",
    name: "Identity & Access",
    icon: Shield,
    color: "oklch(0.62 0.22 25)",
    description: "Microsoft Entra ID integration with role-based access control mapped to municipal org chart. MFA enforced for all privileged access.",
    components: ["Microsoft Entra ID (Azure AD)", "RBAC — 8 municipal roles", "MFA enforced (FIDO2/TOTP)", "Conditional access policies", "Privileged Identity Management", "SCIF biometric integration"],
  },
  {
    id: "ui",
    name: "Presentation Layer",
    icon: Map,
    color: "oklch(0.70 0.18 240)",
    description: "Responsive web application with real-time dashboards, spatial mapping, and AI-assisted workflows. Accessible on any device.",
    components: ["React 19 + TypeScript", "Real-time WebSocket updates", "Google Maps / Azure Maps GIS", "Recharts analytics", "Mobile-responsive design", "WCAG 2.1 AA accessibility"],
  },
];

const INTEGRATIONS = [
  { name: "Tyler Technologies", category: "ERP/Finance", status: "Certified" },
  { name: "Motorola Solutions", category: "Public Safety CAD", status: "Certified" },
  { name: "Esri ArcGIS", category: "GIS Platform", status: "Certified" },
  { name: "Sensus / Xylem", category: "AMI Water Meters", status: "Certified" },
  { name: "Wonderware SCADA", category: "Industrial Control", status: "In Progress" },
  { name: "Iowa DAS", category: "State Reporting", status: "Certified" },
  { name: "FEMA BRIC", category: "Grant Management", status: "In Progress" },
  { name: "Stripe", category: "Payment Processing", status: "Certified" },
];

const COMPLIANCE = [
  "CJIS Security Policy v5.9",
  "NIST SP 800-53 Rev. 5",
  "Iowa Code Chapter 22 (Open Records)",
  "HIPAA (if health data present)",
  "FedRAMP Moderate (in progress)",
  "SOC 2 Type II",
  "FISMA Moderate",
  "PCI DSS Level 2",
];

export default function Platform() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.11 0.012 250)" }}>
      <Navbar />

      {/* Header */}
      <section className="py-16 border-b" style={{ background: "oklch(0.13 0.013 250)", borderColor: "oklch(1 0 0 / 8%)" }}>
        <div className="container">
          <div className="flex items-center gap-2 mb-4">
            <span className="badge-info">AZURE GOVERNMENT</span>
            <span className="badge-success">SOC 2 TYPE II</span>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.95 0.008 240)" }}>
            Platform Architecture
          </h1>
          <p className="text-sm max-w-xl" style={{ color: "oklch(0.60 0.010 250)" }}>
            A six-layer architecture purpose-built for municipal government.
            Azure Government Cloud, Microsoft Entra ID, SCADA integration,
            and AI-powered analytics — all in a single platform.
          </p>
        </div>
      </section>

      {/* Architecture layers */}
      <section className="py-14">
        <div className="container">
          <div className="section-label mb-6">Architecture Layers (Bottom to Top)</div>
          <div className="space-y-3">
            {LAYERS.map((layer, i) => (
              <div
                key={layer.id}
                className="p-5 rounded-xl"
                style={{
                  background: "oklch(0.16 0.014 250)",
                  border: `1px solid ${layer.color.replace(")", " / 20%)")}`,
                  borderLeft: `3px solid ${layer.color}`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${layer.color.replace(")", " / 12%)")}`, border: `1px solid ${layer.color.replace(")", " / 25%)")}` }}
                  >
                    <layer.icon className="w-5 h-5" style={{ color: layer.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-sm font-bold" style={{ color: "oklch(0.88 0.008 240)", fontFamily: "'Syne', sans-serif" }}>
                        Layer {i + 1}: {layer.name}
                      </h3>
                    </div>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "oklch(0.55 0.010 250)" }}>{layer.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {layer.components.map((c) => (
                        <span
                          key={c}
                          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded"
                          style={{ background: `${layer.color.replace(")", " / 8%)")}`, color: "oklch(0.60 0.010 250)", border: `1px solid ${layer.color.replace(")", " / 15%)")}` }}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" style={{ color: layer.color }} />
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations + Compliance */}
      <section className="py-12 border-t" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="section-label mb-4">Certified Integrations</div>
            <div className="space-y-2">
              {INTEGRATIONS.map((int) => (
                <div key={int.name} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "oklch(0.16 0.014 250)", border: "1px solid oklch(1 0 0 / 8%)" }}>
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: "oklch(0.80 0.008 240)" }}>{int.name}</div>
                    <div className="text-[10px]" style={{ color: "oklch(0.45 0.008 250)" }}>{int.category}</div>
                  </div>
                  <span className={`badge-${int.status === "Certified" ? "success" : "warning"}`}>{int.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="section-label mb-4">Compliance & Certifications</div>
            <div className="space-y-2">
              {COMPLIANCE.map((c) => (
                <div key={c} className="flex items-center gap-2.5 p-3 rounded-lg" style={{ background: "oklch(0.16 0.014 250)", border: "1px solid oklch(1 0 0 / 8%)" }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.65 0.18 145)" }} />
                  <span className="text-sm" style={{ color: "oklch(0.70 0.010 250)" }}>{c}</span>
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
