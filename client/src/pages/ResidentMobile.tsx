/**
 * ResidentMobile — Mobile-optimized Resident Portal Landing
 * Simplified /resident/m view for phone screens — designed to be printed on
 * utility bills and posted in City Hall. Large CTA + QR code + tier cards.
 * City of West Liberty, IA · DOGE Municipal Platform
 */
import { useState } from "react";
import { Link } from "wouter";
import {
  Wifi, DollarSign, Zap, CheckCircle2, ChevronRight,
  Smartphone, Star, Users, ArrowRight
} from "lucide-react";

const TIERS = [
  {
    id: "starter",
    name: "Starter",
    price: 15,
    monthly: 15,
    cores: 2,
    ram: "4 GB",
    storage: "50 GB",
    uptime: "99.5%",
    color: "oklch(0.45 0.20 240)",
    bg: "oklch(0.45 0.20 240 / 10%)",
    border: "oklch(0.45 0.20 240 / 30%)",
    popular: false,
  },
  {
    id: "standard",
    name: "Standard",
    price: 45,
    monthly: 45,
    cores: 8,
    ram: "16 GB",
    storage: "200 GB",
    uptime: "99.9%",
    color: "oklch(0.42 0.18 145)",
    bg: "oklch(0.42 0.18 145 / 10%)",
    border: "oklch(0.42 0.18 145 / 35%)",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 120,
    monthly: 120,
    cores: 24,
    ram: "64 GB",
    storage: "1 TB",
    uptime: "99.99%",
    color: "oklch(0.55 0.18 75)",
    bg: "oklch(0.55 0.18 75 / 10%)",
    border: "oklch(0.55 0.18 75 / 35%)",
    popular: false,
  },
];

const EARNERS = [
  { name: "Maria G.",   tier: "Standard", monthly: "$47.20", since: "Jan 2025" },
  { name: "Tom K.",     tier: "Pro",      monthly: "$124.80", since: "Dec 2024" },
  { name: "Anh N.",     tier: "Starter",  monthly: "$16.40", since: "Feb 2025" },
  { name: "Carlos R.",  tier: "Standard", monthly: "$45.90", since: "Jan 2025" },
];

// Simple SVG QR code placeholder (in production, use a real QR library)
function QRCodeSVG({ url }: { url: string }) {
  // Generate a deterministic-looking QR pattern from the URL
  const seed = url.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells = Array.from({ length: 21 }, (_, row) =>
    Array.from({ length: 21 }, (_, col) => {
      // Finder patterns (corners)
      const inFinder = (
        (row < 8 && col < 8) ||
        (row < 8 && col > 12) ||
        (row > 12 && col < 8)
      );
      if (inFinder) {
        const r = Math.min(row, 7 - row, row > 12 ? row - 13 : 99);
        const c = Math.min(col, 7 - col, col > 12 ? col - 13 : 99);
        return (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
      }
      // Data cells — pseudo-random from seed
      return ((seed * (row * 21 + col + 1) * 2654435761) & 0xFFFFFFFF) % 3 === 0;
    })
  );

  return (
    <svg viewBox="0 0 21 21" width="160" height="160" style={{ imageRendering: "pixelated" }}>
      <rect width="21" height="21" fill="white" />
      {cells.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="oklch(0.12 0.018 250)" /> : null
        )
      )}
    </svg>
  );
}

export default function ResidentMobile() {
  const [selected, setSelected] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    setEnrolled(true);
  };

  const portalUrl = "https://dogemuni-zykc8hns.manus.space/resident";

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.975 0.004 240)" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 shadow-sm" style={{ background: "oklch(1 0 0)", borderBottom: "1px solid oklch(0 0 0 / 8%)" }}>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "oklch(0.45 0.20 240)" }}>City of West Liberty, IA</div>
          <div className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>Resident Compute Portal</div>
        </div>
        <Link href="/resident">
          <button className="text-[11px] px-3 py-1.5 rounded-lg font-medium" style={{ background: "oklch(0.45 0.20 240 / 10%)", color: "oklch(0.38 0.18 240)", border: "1px solid oklch(0.45 0.20 240 / 25%)" }}>
            Full View
          </button>
        </Link>
      </div>

      {enrolled ? (
        /* ── Success screen ── */
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "oklch(0.42 0.18 145 / 15%)" }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: "oklch(0.42 0.18 145)" }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
            You're enrolled, {name.split(" ")[0]}!
          </h2>
          <p className="text-sm mb-6" style={{ color: "oklch(0.50 0.010 250)" }}>
            Your compute node will be active within 24 hours. Earnings are deposited monthly to your West Liberty utility account.
          </p>
          <div className="rounded-2xl p-5 w-full max-w-xs text-left space-y-3" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "oklch(0.55 0.010 250)" }}>What Happens Next</div>
            {[
              "City IT installs your compute node (free)",
              "Node goes live within 24 hours",
              "Monthly earnings deposited to utility account",
              "Track earnings at dogemuni-zykc8hns.manus.space/resident",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white mt-0.5" style={{ background: "oklch(0.42 0.18 145)" }}>{i + 1}</div>
                <span className="text-[12px]" style={{ color: "oklch(0.35 0.014 250)" }}>{step}</span>
              </div>
            ))}
          </div>
          <Link href="/resident">
            <button className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm" style={{ background: "oklch(0.45 0.20 240)", color: "white" }}>
              View Your Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      ) : (
        <div className="px-4 pb-12 space-y-6 pt-5">
          {/* Hero */}
          <div className="rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg, oklch(0.45 0.20 240) 0%, oklch(0.38 0.18 240) 100%)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Earn from Your Internet
            </h1>
            <p className="text-sm text-white/80 mb-4">
              West Liberty residents lease unused computing capacity to the city's distributed data center — and get paid directly every month.
            </p>
            <div className="flex justify-center gap-4">
              {[
                { icon: DollarSign, label: "$15–$120/mo" },
                { icon: Zap, label: "City installs free" },
                { icon: Users, label: "47 residents enrolled" },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] text-white/80 font-medium">{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier selector */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "oklch(0.55 0.010 250)" }}>Choose Your Tier</div>
            <div className="space-y-3">
              {TIERS.map(tier => (
                <button
                  key={tier.id}
                  onClick={() => setSelected(tier.id)}
                  className="w-full rounded-xl p-4 text-left transition-all"
                  style={{
                    background: selected === tier.id ? tier.bg : "oklch(1 0 0)",
                    border: `2px solid ${selected === tier.id ? tier.color : "oklch(0 0 0 / 8%)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: tier.color }}>{tier.name}</span>
                      {tier.popular && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: tier.color, color: "white" }}>
                          POPULAR
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.18 0.018 250)" }}>${tier.price}</span>
                      <span className="text-[11px]" style={{ color: "oklch(0.55 0.010 250)" }}>/mo</span>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { label: `${tier.cores} vCPU` },
                      { label: tier.ram + " RAM" },
                      { label: tier.storage },
                      { label: tier.uptime + " uptime" },
                    ].map(spec => (
                      <span key={spec.label} className="text-[10px] px-2 py-0.5 rounded" style={{ background: "oklch(0.975 0.004 240)", color: "oklch(0.45 0.010 250)" }}>
                        {spec.label}
                      </span>
                    ))}
                  </div>
                  {selected === tier.id && (
                    <div className="flex items-center gap-1 mt-2">
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: tier.color }} />
                      <span className="text-[11px] font-medium" style={{ color: tier.color }}>Selected</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Enroll form */}
          {selected && (
            <form onSubmit={handleEnroll} className="rounded-2xl p-5 space-y-4" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
              <div className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                Enroll — {TIERS.find(t => t.id === selected)?.name} Tier
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.55 0.010 250)" }}>Full Name</label>
                <input
                  required value={name} onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.55 0.010 250)" }}>West Liberty Address</label>
                <input
                  required value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="123 Main St, West Liberty, IA 52776"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "var(--foreground)" }}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: TIERS.find(t => t.id === selected)?.color ?? "oklch(0.45 0.20 240)", color: "white" }}
              >
                Enroll Now — {TIERS.find(t => t.id === selected)?.name} <ChevronRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-center" style={{ color: "oklch(0.65 0.010 250)" }}>
                No upfront cost · City installs hardware free · Cancel anytime
              </p>
            </form>
          )}

          {/* Live earners */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "oklch(0.55 0.010 250)" }}>
              West Liberty Residents Earning Now
            </div>
            <div className="space-y-2">
              {EARNERS.map(e => (
                <div key={e.name} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "oklch(0.45 0.20 240 / 15%)", color: "oklch(0.38 0.18 240)" }}>
                      {e.name[0]}
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold" style={{ color: "oklch(0.25 0.014 250)" }}>{e.name}</div>
                      <div className="text-[10px]" style={{ color: "oklch(0.60 0.010 250)" }}>{e.tier} · since {e.since}</div>
                    </div>
                  </div>
                  <div className="text-[13px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.42 0.18 145)" }}>{e.monthly}</div>
                </div>
              ))}
            </div>
          </div>

          {/* QR code section */}
          <div className="rounded-2xl p-5 text-center" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.55 0.010 250)" }}>Share This Page</div>
            <p className="text-[12px] mb-4" style={{ color: "oklch(0.50 0.010 250)" }}>
              Scan to open the Resident Portal on any device
            </p>
            <div className="flex justify-center mb-3">
              <div className="p-3 rounded-xl" style={{ background: "white", border: "1px solid oklch(0 0 0 / 10%)" }}>
                <QRCodeSVG url={portalUrl} />
              </div>
            </div>
            <div className="text-[11px] font-mono" style={{ color: "oklch(0.45 0.20 240)" }}>{portalUrl}</div>
            <div className="mt-3 flex items-center justify-center gap-1 text-[10px]" style={{ color: "oklch(0.65 0.010 250)" }}>
              <Smartphone className="w-3 h-3" />
              Works on iPhone, Android, and any browser
            </div>
          </div>

          {/* Stats footer */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Enrolled", value: "47" },
              { label: "Avg Monthly", value: "$52" },
              { label: "Total Paid Out", value: "$6.2K" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                <div className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.18 0.018 250)" }}>{s.value}</div>
                <div className="text-[10px]" style={{ color: "oklch(0.60 0.010 250)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="text-center text-[10px] pb-4" style={{ color: "oklch(0.65 0.010 250)" }}>
            City of West Liberty, IA · DOGE Municipal Platform · (319) 627-2418
          </div>
        </div>
      )}
    </div>
  );
}
