/**
 * Distributed Data Center Marketplace — Civic Intelligence Dark
 * Municipal edge network with resident/business computing lease
 * Direct ACH payments to participants
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Server, Wifi, DollarSign, Users, Zap, Shield, MapPin, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const DC_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/116029439/ZyKC8HNSGdSzNP3yqHmgR7/hero-datacenter-hDbNtKaVb2WoyFgS2qeWAA.webp";

const NODES = [
  { id: "NODE-WL-01", name: "City Hall Node", location: "111 W 7th St", capacity: "48 vCPU / 192GB RAM / 20TB", utilization: 72, status: "online", uptime: "99.98%", participants: 14 },
  { id: "NODE-WL-02", name: "Water Tower Node", location: "Water Treatment Facility", capacity: "32 vCPU / 128GB RAM / 10TB", utilization: 58, status: "online", uptime: "99.95%", participants: 9 },
  { id: "NODE-WL-03", name: "Public Works Node", location: "Public Works Garage", capacity: "64 vCPU / 256GB RAM / 40TB", utilization: 84, status: "online", uptime: "99.99%", participants: 22 },
  { id: "NODE-WL-04", name: "Fire Station Node", location: "West Liberty Fire Dept", capacity: "24 vCPU / 96GB RAM / 8TB", utilization: 45, status: "online", uptime: "99.97%", participants: 7 },
  { id: "NODE-WL-05", name: "Library Node", location: "West Liberty Public Library", capacity: "16 vCPU / 64GB RAM / 5TB", utilization: 31, status: "maintenance", uptime: "99.91%", participants: 5 },
];

const TIERS = [
  {
    id: "micro",
    name: "Resident Micro",
    icon: Users,
    price: 25,
    earn: 8,
    earnMax: 8,
    color: "oklch(0.65 0.18 145)",
    description: "For West Liberty residents. Lease a small slice of city computing capacity and receive monthly ACH payments.",
    features: [
      "0.5 vCPU dedicated allocation",
      "2GB RAM guaranteed",
      "500GB storage",
      "Monthly ACH payment direct to bank",
      "Real-time earnings dashboard",
      "No technical setup required",
    ],
    target: "Residents",
  },
  {
    id: "standard",
    name: "Business Standard",
    icon: Server,
    price: 149,
    earn: 45,
    earnMax: 45,
    color: "oklch(0.58 0.20 240)",
    description: "For West Liberty businesses. Larger compute allocation with priority scheduling and higher revenue share.",
    features: [
      "4 vCPU dedicated allocation",
      "16GB RAM guaranteed",
      "2TB storage",
      "Priority job scheduling",
      "Monthly ACH + quarterly bonus",
      "Business tax documentation",
      "SLA: 99.9% uptime guarantee",
    ],
    target: "Businesses",
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise Node",
    icon: Zap,
    price: 895,
    earn: 280,
    earnMax: 280,
    color: "oklch(0.75 0.18 75)",
    description: "For organizations hosting a full node. Maximum revenue share with dedicated hardware and direct peering.",
    features: [
      "Full node co-location",
      "Dedicated hardware allocation",
      "10TB+ storage",
      "Direct network peering",
      "Weekly ACH payments",
      "Custom SLA negotiation",
      "White-label options available",
    ],
    target: "Organizations",
  },
];

const LEADERBOARD = [
  { name: "Maria G.", type: "Resident", tier: "Micro", earned: 94.50, months: 12 },
  { name: "West Liberty Grain Co.", type: "Business", tier: "Standard", earned: 1847.25, months: 14 },
  { name: "Muscatine County Credit Union", type: "Business", tier: "Enterprise", earned: 8420.00, months: 10 },
  { name: "Tom & Linda H.", type: "Resident", tier: "Micro", earned: 78.00, months: 10 },
  { name: "Liberty Auto Service", type: "Business", tier: "Standard", earned: 634.50, months: 5 },
];

const USE_CASES = [
  { title: "AI Model Training", desc: "Regional ag-tech companies train crop yield prediction models on West Liberty's distributed GPU capacity.", icon: Zap },
  { title: "Government Data Processing", desc: "Iowa state agencies process census and GIS data using the municipal edge network at lower cost.", icon: Shield },
  { title: "Research Computing", desc: "University of Iowa researchers run environmental simulations using spare city compute cycles.", icon: Server },
  { title: "Media Rendering", desc: "Local production companies render video and 3D content overnight when city utilization is low.", icon: TrendingUp },
];

export default function DataCenter() {
  const [selectedTier, setSelectedTier] = useState("standard");
  const [leaseMonths, setLeaseMonths] = useState(12);

  const tier = TIERS.find(t => t.id === selectedTier)!;
  const totalEarned = tier.earn * leaseMonths;
  const totalPaid = tier.price * leaseMonths;
  const netCost = totalPaid - totalEarned;

  const handleSignup = () => {
    toast.success(`Application submitted for ${tier.name} tier. West Liberty Finance will process your ACH setup within 3 business days.`);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.11 0.012 250)" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: "45vh" }}>
        <div className="absolute inset-0">
          <img src={DC_IMG} alt="Distributed Data Center" className="w-full h-full object-cover" style={{ opacity: 0.35 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.09 0.012 250 / 95%) 0%, oklch(0.09 0.012 250 / 70%) 100%)" }} />
        </div>
        <div className="relative container flex flex-col justify-center py-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="badge-success">5 NODES ONLINE</span>
            <span className="badge-info">57 ACTIVE PARTICIPANTS</span>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.95 0.008 240)" }}>
            West Liberty<br />
            <span style={{ color: "oklch(0.65 0.18 145)" }}>Distributed Data Center</span>
          </h1>
          <p className="text-sm max-w-xl mb-6" style={{ color: "oklch(0.60 0.010 250)" }}>
            The city's idle computing capacity earns money for residents and businesses.
            Lease a slice of the municipal edge network and receive direct monthly ACH payments —
            turning public infrastructure into a community revenue stream.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
            {[
              { label: "Total Nodes", value: "5", color: "oklch(0.65 0.18 145)" },
              { label: "Active Participants", value: "57", color: "oklch(0.70 0.18 240)" },
              { label: "Avg Monthly Payout", value: "$187", color: "oklch(0.65 0.18 145)" },
              { label: "Network Uptime", value: "99.97%", color: "oklch(0.75 0.18 75)" },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-lg" style={{ background: "oklch(0.14 0.014 250 / 80%)", border: "1px solid oklch(1 0 0 / 10%)" }}>
                <div className="metric-value text-xl" style={{ color: stat.color }}>{stat.value}</div>
                <div className="section-label mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Node map */}
      <section className="py-12 border-y" style={{ background: "oklch(0.13 0.013 250)", borderColor: "oklch(1 0 0 / 8%)" }}>
        <div className="container">
          <div className="section-label mb-4">Network Nodes — West Liberty, IA</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {NODES.map((node) => (
              <div key={node.id} className="p-4 rounded-lg" style={{ background: "oklch(0.16 0.014 250)", border: "1px solid oklch(1 0 0 / 8%)" }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "oklch(0.88 0.008 240)" }}>{node.name}</div>
                    <div className="flex items-center gap-1 text-[10px] mt-0.5" style={{ color: "oklch(0.45 0.008 250)" }}>
                      <MapPin className="w-3 h-3" />
                      {node.location}
                    </div>
                  </div>
                  <span className={`status-dot ${node.status === "online" ? "green" : "amber"}`} />
                </div>
                <div className="text-[10px] font-mono mb-2" style={{ color: "oklch(0.50 0.010 250)" }}>{node.capacity}</div>
                <div className="mb-1">
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span style={{ color: "oklch(0.45 0.008 250)" }}>Utilization</span>
                    <span className="font-mono" style={{ color: node.utilization > 80 ? "oklch(0.75 0.18 75)" : "oklch(0.65 0.18 145)" }}>{node.utilization}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(1 0 0 / 8%)" }}>
                    <div className="h-full rounded-full" style={{ width: `${node.utilization}%`, background: node.utilization > 80 ? "oklch(0.75 0.18 75)" : "oklch(0.58 0.20 240)" }} />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] mt-2">
                  <span style={{ color: "oklch(0.45 0.008 250)" }}>Uptime: <span className="font-mono" style={{ color: "oklch(0.65 0.18 145)" }}>{node.uptime}</span></span>
                  <span style={{ color: "oklch(0.45 0.008 250)" }}><span className="font-mono" style={{ color: "oklch(0.70 0.18 240)" }}>{node.participants}</span> participants</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-10">
            <div className="section-label mb-3">Participation Tiers</div>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.92 0.008 240)" }}>
              Choose your capacity level
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {TIERS.map((t) => (
              <div
                key={t.id}
                className="rounded-xl overflow-hidden cursor-pointer transition-all"
                style={{
                  background: t.featured ? "oklch(0.18 0.016 250)" : "oklch(0.16 0.014 250)",
                  border: `1px solid ${selectedTier === t.id ? t.color.replace(")", " / 40%)") : t.featured ? "oklch(0.58 0.20 240 / 20%)" : "oklch(1 0 0 / 8%)"}`,
                  boxShadow: selectedTier === t.id ? `0 0 20px ${t.color.replace(")", " / 15%)")}` : "none",
                }}
                onClick={() => setSelectedTier(t.id)}
              >
                {t.featured && (
                  <div className="px-4 py-1.5 text-center text-[10px] font-bold tracking-wider" style={{ background: "oklch(0.58 0.20 240 / 20%)", color: "oklch(0.70 0.18 240)" }}>
                    MOST POPULAR
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${t.color.replace(")", " / 15%)")}`, border: `1px solid ${t.color.replace(")", " / 25%)")}` }}>
                      <t.icon className="w-4 h-4" style={{ color: t.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "oklch(0.88 0.008 240)" }}>{t.name}</div>
                      <div className="text-[10px]" style={{ color: "oklch(0.45 0.008 250)" }}>For {t.target}</div>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: "oklch(0.50 0.010 250)" }}>{t.description}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="metric-value text-2xl" style={{ color: t.color }}>${t.price}</span>
                    <span className="text-xs mb-1" style={{ color: "oklch(0.45 0.008 250)" }}>/month</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-4">
                    <DollarSign className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 145)" }} />
                    <span className="text-xs font-semibold" style={{ color: "oklch(0.65 0.18 145)" }}>Earn up to ${t.earn}/month</span>
                  </div>
                  <div className="space-y-1.5">
                    {t.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: t.color }} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Calculator */}
          <div className="max-w-2xl mx-auto p-6 rounded-xl" style={{ background: "oklch(0.16 0.014 250)", border: "1px solid oklch(1 0 0 / 10%)" }}>
            <div className="section-label mb-4">Earnings Calculator — {tier.name}</div>
            <div className="mb-4">
              <label className="text-xs mb-2 block" style={{ color: "oklch(0.60 0.010 250)" }}>
                Lease duration: <span className="font-mono font-bold" style={{ color: "oklch(0.70 0.18 240)" }}>{leaseMonths} months</span>
              </label>
              <input
                type="range" min={1} max={36} value={leaseMonths}
                onChange={(e) => setLeaseMonths(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-lg text-center" style={{ background: "oklch(0.13 0.013 250)" }}>
                <div className="metric-value text-lg" style={{ color: "oklch(0.62 0.22 25)" }}>${totalPaid.toLocaleString()}</div>
                <div className="section-label mt-1">Total Paid</div>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: "oklch(0.13 0.013 250)" }}>
                <div className="metric-value text-lg" style={{ color: "oklch(0.65 0.18 145)" }}>${totalEarned.toLocaleString()}</div>
                <div className="section-label mt-1">Total Earned</div>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: "oklch(0.13 0.013 250)" }}>
                <div className="metric-value text-lg" style={{ color: netCost > 0 ? "oklch(0.75 0.18 75)" : "oklch(0.65 0.18 145)" }}>
                  ${Math.abs(netCost).toLocaleString()}
                </div>
                <div className="section-label mt-1">{netCost > 0 ? "Net Cost" : "Net Profit"}</div>
              </div>
            </div>
            <button
              onClick={handleSignup}
              className="w-full py-2.5 rounded font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: tier.color, color: "oklch(0.10 0.010 250)" }}
            >
              Apply for {tier.name} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-12 border-y" style={{ background: "oklch(0.13 0.013 250)", borderColor: "oklch(1 0 0 / 8%)" }}>
        <div className="container">
          <div className="section-label mb-4">Top Earners — West Liberty Participants</div>
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid oklch(1 0 0 / 8%)" }}>
            {LEADERBOARD.map((p, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0" style={{ background: "oklch(0.16 0.014 250)", borderColor: "oklch(1 0 0 / 6%)" }}>
                <span className="text-sm font-mono font-bold w-6 text-center" style={{ color: "oklch(0.45 0.008 250)" }}>#{i + 1}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: "oklch(0.80 0.008 240)" }}>{p.name}</div>
                  <div className="text-[10px]" style={{ color: "oklch(0.45 0.008 250)" }}>{p.type} · {p.tier} · {p.months} months</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold" style={{ color: "oklch(0.65 0.18 145)" }}>${p.earned.toLocaleString()}</div>
                  <div className="text-[10px]" style={{ color: "oklch(0.45 0.008 250)" }}>total earned</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-12">
        <div className="container">
          <div className="section-label mb-6">Who Uses West Liberty's Compute Capacity</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {USE_CASES.map((uc) => (
              <div key={uc.title} className="p-4 rounded-lg" style={{ background: "oklch(0.16 0.014 250)", border: "1px solid oklch(1 0 0 / 8%)" }}>
                <uc.icon className="w-5 h-5 mb-3" style={{ color: "oklch(0.70 0.18 240)" }} />
                <div className="text-sm font-semibold mb-1.5" style={{ color: "oklch(0.85 0.008 240)" }}>{uc.title}</div>
                <p className="text-xs leading-relaxed" style={{ color: "oklch(0.50 0.010 250)" }}>{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
