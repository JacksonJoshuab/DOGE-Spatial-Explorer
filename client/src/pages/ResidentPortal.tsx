/**
 * Resident Portal — /resident
 * Public page for West Liberty residents to sign up for the Data Center Marketplace
 * and track their monthly earnings in real time.
 * Design: Civic Intelligence Light — white/light-grey backgrounds, dark text, blue/green accents
 */
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Server, DollarSign, Zap, CheckCircle2, ArrowRight, TrendingUp,
  Wifi, BarChart3, User, Mail, MapPin, Phone, ChevronRight,
  Clock, Activity, CreditCard, Shield, AlertCircle, Download, X, Inbox
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Tier definitions ────────────────────────────────────────────────────────
const TIERS = [
  {
    id: "micro",
    name: "Resident Micro",
    price: 25,
    earnMin: 4,
    earnMax: 8,
    storage: "500 GB",
    bandwidth: "100 Mbps",
    nodes: 1,
    description: "Perfect for homeowners with a spare device. Minimal setup, passive income.",
    color: "oklch(0.40 0.18 240)",
    bgColor: "oklch(0.40 0.18 240 / 8%)",
    borderColor: "oklch(0.40 0.18 240 / 20%)",
    features: ["1 compute node", "500 GB storage contribution", "100 Mbps uplink", "Monthly ACH payment", "City dashboard access"],
  },
  {
    id: "standard",
    name: "Business Standard",
    price: 149,
    earnMin: 28,
    earnMax: 45,
    storage: "4 TB",
    bandwidth: "1 Gbps",
    nodes: 3,
    description: "For small businesses and home offices. Higher throughput, larger payouts.",
    color: "oklch(0.38 0.18 145)",
    bgColor: "oklch(0.38 0.18 145 / 8%)",
    borderColor: "oklch(0.38 0.18 145 / 20%)",
    popular: true,
    features: ["3 compute nodes", "4 TB storage contribution", "1 Gbps uplink", "Priority ACH payment", "Advanced analytics", "Dedicated support"],
  },
  {
    id: "enterprise",
    name: "Enterprise Node",
    price: 895,
    earnMin: 180,
    earnMax: 280,
    storage: "20 TB",
    bandwidth: "10 Gbps",
    nodes: 10,
    description: "For commercial properties and large facilities. Maximum revenue share.",
    color: "oklch(0.50 0.18 75)",
    bgColor: "oklch(0.50 0.18 75 / 8%)",
    borderColor: "oklch(0.50 0.18 75 / 20%)",
    features: ["10 compute nodes", "20 TB storage contribution", "10 Gbps uplink", "Same-day ACH payment", "Custom SLA", "On-site installation", "Revenue guarantee"],
  },
];

// ─── Simulated live participants ─────────────────────────────────────────────
const PARTICIPANTS = [
  { name: "Sarah M.", address: "300 E 3rd St", tier: "Resident Micro", earned: 7.42, thisMonth: 7.42, joined: "Jan 2025", status: "active" },
  { name: "West Liberty Diner", address: "119 N Calhoun St", tier: "Business Standard", earned: 312.80, thisMonth: 38.60, joined: "Nov 2024", status: "active" },
  { name: "J. Hernandez", address: "512 W 6th St", tier: "Resident Micro", earned: 44.16, thisMonth: 6.90, joined: "Sep 2024", status: "active" },
  { name: "Muscatine Co. Realty", address: "202 N Calhoun St", tier: "Enterprise Node", earned: 1840.00, thisMonth: 245.00, joined: "Aug 2024", status: "active" },
  { name: "T. Nguyen", address: "408 E 5th St", tier: "Resident Micro", earned: 29.76, thisMonth: 5.60, joined: "Oct 2024", status: "active" },
  { name: "Liberty Auto Parts", address: "701 W 7th St", tier: "Business Standard", earned: 198.40, thisMonth: 41.20, joined: "Oct 2024", status: "active" },
];

// ─── Simulated live earnings events ──────────────────────────────────────────
const LIVE_EVENTS = [
  { addr: "300 E 3rd St", amount: 0.18, type: "compute", ago: "2s ago" },
  { addr: "119 N Calhoun St", amount: 0.94, type: "storage", ago: "11s ago" },
  { addr: "512 W 6th St", amount: 0.12, type: "compute", ago: "28s ago" },
  { addr: "202 N Calhoun St", amount: 5.60, type: "bandwidth", ago: "45s ago" },
  { addr: "408 E 5th St", amount: 0.09, type: "compute", ago: "1m ago" },
  { addr: "701 W 7th St", amount: 0.87, type: "storage", ago: "2m ago" },
];

function AnimatedCounter({ target, prefix = "", suffix = "", decimals = 2 }: {
  target: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const duration = 1400;
        const step = (ts: number) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / duration, 1);
          const e = 1 - Math.pow(1 - p, 3);
          setValue(parseFloat((e * target).toFixed(decimals)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, decimals]);
  return <span ref={ref}>{prefix}{decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString()}{suffix}</span>;
}

export default function ResidentPortal() {
  const [selectedTier, setSelectedTier] = useState("standard");
  const [step, setStep] = useState<"tiers" | "signup" | "confirmed">("tiers");
  const [form, setForm] = useState({ name: "", email: "", address: "", phone: "", tier: "standard" });
  const [liveEvents, setLiveEvents] = useState(LIVE_EVENTS);
  const [networkTotal, setNetworkTotal] = useState(2425.58);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Simulate live earnings ticking up
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkTotal(prev => parseFloat((prev + Math.random() * 0.8 + 0.1).toFixed(2)));
      setLiveEvents(prev => {
        const newEvent = {
          addr: PARTICIPANTS[Math.floor(Math.random() * PARTICIPANTS.length)].address,
          amount: parseFloat((Math.random() * 2 + 0.05).toFixed(2)),
          type: ["compute", "storage", "bandwidth"][Math.floor(Math.random() * 3)],
          ago: "just now",
        };
        return [newEvent, ...prev.slice(0, 5)];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const tier = TIERS.find(t => t.id === selectedTier) || TIERS[1];

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.address) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setStep("confirmed");
    setShowEmailModal(true);
    toast.success("Application submitted! Check your welcome email preview.");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.975 0.004 240)" }}>
      <Navbar />

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="py-16 border-b"
        style={{ background: "linear-gradient(135deg, oklch(0.97 0.005 240) 0%, oklch(0.96 0.008 145) 100%)", borderColor: "oklch(0 0 0 / 8%)" }}
      >
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-5"
                style={{ background: "oklch(0.38 0.18 145 / 10%)", border: "1px solid oklch(0.38 0.18 145 / 25%)", color: "oklch(0.32 0.18 145)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                West Liberty Distributed Data Center — Open Enrollment
              </div>
              <h1
                className="mb-4 leading-tight"
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "oklch(0.12 0.018 250)" }}
              >
                Earn money from<br />
                <span style={{ color: "oklch(0.32 0.18 145)" }}>your internet connection.</span>
              </h1>
              <p className="text-sm leading-relaxed mb-6 max-w-lg" style={{ color: "oklch(0.38 0.012 250)" }}>
                West Liberty residents and businesses can lease unused computing capacity to the city's
                distributed edge network. Monthly ACH payments land directly in your bank account —
                no crypto, no complexity.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setStep("tiers")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm transition-all"
                  style={{ background: "oklch(0.38 0.18 145)", color: "oklch(0.98 0.004 145)" }}
                >
                  <DollarSign className="w-4 h-4" />
                  Start Earning
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#leaderboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm no-underline"
                  style={{ background: "oklch(0 0 0 / 5%)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.25 0.018 250)" }}
                >
                  See who's earning
                </a>
              </div>
            </div>

            {/* Live stats panel */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Active Participants", value: "6", suffix: "", color: "oklch(0.40 0.18 240)", icon: User },
                { label: "Network Total Earned", value: networkTotal.toFixed(2), prefix: "$", color: "oklch(0.32 0.18 145)", icon: DollarSign },
                { label: "Network Uptime", value: "99.97", suffix: "%", color: "oklch(0.38 0.18 145)", icon: Activity },
                { label: "Active Nodes", value: "47", suffix: "", color: "oklch(0.50 0.18 75)", icon: Server },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-lg"
                  style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}
                >
                  <stat.icon className="w-4 h-4 mb-2" style={{ color: stat.color }} />
                  <div
                    className="text-2xl font-mono font-bold mb-0.5"
                    style={{ color: stat.color }}
                  >
                    {stat.prefix || ""}{stat.value}{stat.suffix || ""}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "oklch(0.52 0.010 250)" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Live Earnings Feed ────────────────────────────────────────────── */}
      <section className="py-3 border-b overflow-hidden" style={{ background: "oklch(0.32 0.18 145)", borderColor: "oklch(0 0 0 / 15%)" }}>
        <div className="container flex items-center gap-4">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-green-200">LIVE EARNINGS</span>
          </div>
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
            {liveEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-1.5 flex-shrink-0 text-[11px]">
                <span className="text-green-200 font-mono font-semibold">+${ev.amount.toFixed(2)}</span>
                <span className="text-green-300/70">{ev.addr}</span>
                <span className="text-green-300/50 font-mono text-[9px]">{ev.type} · {ev.ago}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tier Selection / Sign-up / Confirmed ─────────────────────────── */}
      <section className="py-16" id="signup">
        <div className="container">
          {step === "tiers" && (
            <>
              <div className="text-center mb-10">
                <div className="section-label mb-3">Choose Your Plan</div>
                <h2 className="text-3xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>
                  Pick the tier that fits your setup
                </h2>
                <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: "oklch(0.42 0.012 250)" }}>
                  All tiers pay out via monthly ACH. No equipment purchase required — just a stable internet connection.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {TIERS.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTier(t.id)}
                    className="relative rounded-xl p-6 cursor-pointer transition-all"
                    style={{
                      background: selectedTier === t.id ? t.bgColor : "oklch(1 0 0)",
                      border: `2px solid ${selectedTier === t.id ? t.color : "oklch(0 0 0 / 8%)"}`,
                    }}
                  >
                    {t.popular && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: t.color, color: "oklch(0.98 0.004 145)" }}
                      >
                        Most Popular
                      </div>
                    )}
                    <div className="mb-4">
                      <div className="text-sm font-bold mb-0.5" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                        {t.name}
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "oklch(0.45 0.012 250)" }}>{t.description}</p>
                    </div>
                    <div className="mb-4">
                      <div className="text-xs" style={{ color: "oklch(0.50 0.010 250)" }}>Monthly cost</div>
                      <div className="text-2xl font-mono font-bold" style={{ color: "oklch(0.18 0.018 250)" }}>
                        ${t.price}<span className="text-sm font-normal">/mo</span>
                      </div>
                      <div className="text-xs mt-1 font-semibold" style={{ color: t.color }}>
                        Earn ${t.earnMin}–${t.earnMax}/mo back
                      </div>
                    </div>
                    <ul className="space-y-1.5 mb-5">
                      {t.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.35 0.014 250)" }}>
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: t.color }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => { setSelectedTier(t.id); setForm(f => ({ ...f, tier: t.id })); setStep("signup"); }}
                      className="w-full py-2 rounded text-sm font-semibold transition-all"
                      style={{
                        background: selectedTier === t.id ? t.color : "oklch(0 0 0 / 5%)",
                        color: selectedTier === t.id ? "oklch(0.98 0.004 145)" : "oklch(0.25 0.018 250)",
                        border: selectedTier === t.id ? "none" : "1px solid oklch(0 0 0 / 10%)",
                      }}
                    >
                      Select {t.name}
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-xs" style={{ color: "oklch(0.52 0.010 250)" }}>
                  Questions? Contact City Hall at <a href="tel:+13196272418" className="no-underline" style={{ color: "oklch(0.40 0.18 240)" }}>(319) 627-2418</a> or{" "}
                  <a href="mailto:cityhall@westlibertyia.gov" className="no-underline" style={{ color: "oklch(0.40 0.18 240)" }}>cityhall@westlibertyia.gov</a>
                </p>
              </div>
            </>
          )}

          {step === "signup" && (
            <div className="max-w-xl mx-auto">
              <button
                onClick={() => setStep("tiers")}
                className="flex items-center gap-1.5 text-xs mb-6 transition-colors"
                style={{ color: "oklch(0.40 0.18 240)", background: "none", border: "none", cursor: "pointer" }}
              >
                ← Back to plans
              </button>
              <div
                className="rounded-xl p-6"
                style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}
              >
                <div className="mb-5">
                  <div className="section-label mb-1">Application</div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>
                    Join the Data Center Network
                  </h2>
                  <div
                    className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold"
                    style={{ background: tier.bgColor, border: `1px solid ${tier.borderColor}`, color: tier.color }}
                  >
                    <Server className="w-3.5 h-3.5" />
                    {tier.name} — ${tier.price}/mo · Earn ${tier.earnMin}–${tier.earnMax}/mo
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(0.30 0.018 250)" }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Jane Smith"
                        className="w-full px-3 py-2 rounded text-sm outline-none transition-all"
                        style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 12%)", color: "oklch(0.18 0.018 250)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(0.30 0.018 250)" }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="jane@example.com"
                        className="w-full px-3 py-2 rounded text-sm outline-none transition-all"
                        style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 12%)", color: "oklch(0.18 0.018 250)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(0.30 0.018 250)" }}>
                      West Liberty Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="123 Main St, West Liberty, IA 52776"
                      className="w-full px-3 py-2 rounded text-sm outline-none transition-all"
                      style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 12%)", color: "oklch(0.18 0.018 250)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(0.30 0.018 250)" }}>
                      Phone Number (optional)
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="(319) 555-0100"
                      className="w-full px-3 py-2 rounded text-sm outline-none transition-all"
                      style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 12%)", color: "oklch(0.18 0.018 250)" }}
                    />
                  </div>

                  <div
                    className="flex items-start gap-2.5 p-3 rounded text-xs"
                    style={{ background: "oklch(0.38 0.18 145 / 8%)", border: "1px solid oklch(0.38 0.18 145 / 20%)" }}
                  >
                    <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.32 0.18 145)" }} />
                    <span style={{ color: "oklch(0.32 0.18 145)" }}>
                      Your data is handled under Iowa Code Chapter 22. ACH bank details are collected separately via a secure Plaid link after approval.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded font-semibold text-sm transition-all"
                    style={{ background: "oklch(0.38 0.18 145)", color: "oklch(0.98 0.004 145)" }}
                  >
                    Submit Application
                  </button>
                </form>
              </div>
            </div>
          )}

          {step === "confirmed" && (
            <div className="max-w-lg mx-auto text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "oklch(0.38 0.18 145 / 12%)", border: "2px solid oklch(0.38 0.18 145 / 30%)" }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: "oklch(0.32 0.18 145)" }} />
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>
                Application Received!
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "oklch(0.42 0.012 250)" }}>
                Thank you, <strong>{form.name || "resident"}</strong>. Your <strong>{TIERS.find(t => t.id === form.tier)?.name}</strong> application
                has been submitted. You'll receive an email at <strong>{form.email}</strong> within 24 hours
                with your ACH setup link and node configuration guide.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { step: "1", label: "Application Review", time: "Within 24 hrs" },
                  { step: "2", label: "ACH Bank Link", time: "Day 2–3" },
                  { step: "3", label: "First Payment", time: "End of month" },
                ].map((s) => (
                  <div key={s.step} className="p-3 rounded-lg text-center" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                    <div className="text-lg font-mono font-bold mb-1" style={{ color: "oklch(0.38 0.18 145)" }}>{s.step}</div>
                    <div className="text-xs font-semibold mb-0.5" style={{ color: "oklch(0.22 0.018 250)" }}>{s.label}</div>
                    <div className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>{s.time}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setStep("tiers"); setForm({ name: "", email: "", address: "", phone: "", tier: "standard" }); }}
                  className="px-4 py-2 rounded text-sm font-semibold"
                  style={{ background: "oklch(0 0 0 / 5%)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.25 0.018 250)" }}
                >
                  Back to Plans
                </button>
                <Link href="/data-center" className="px-4 py-2 rounded text-sm font-semibold no-underline" style={{ background: "oklch(0.38 0.18 145)", color: "oklch(0.98 0.004 145)" }}>
                  View Data Center
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Earnings Leaderboard ─────────────────────────────────────────── */}
      <section
        className="py-16 border-t"
        id="leaderboard"
        style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}
      >
        <div className="container">
          <div className="mb-8">
            <div className="section-label mb-2">Community Earnings</div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>
              West Liberty participants — live earnings
            </h2>
            <p className="text-sm mt-1" style={{ color: "oklch(0.42 0.012 250)" }}>
              Real-time earnings for the 6 active participants in the West Liberty network.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0 0 0 / 8%)" }}>
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ background: "oklch(0.975 0.004 240)", borderColor: "oklch(0 0 0 / 8%)" }}
            >
              <span className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>Participant Earnings</span>
              <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: "oklch(0.32 0.18 145)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                LIVE
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
              {PARTICIPANTS.map((p, i) => (
                <div
                  key={p.name}
                  className="px-4 py-3 flex items-center gap-4"
                  style={{ background: "oklch(1 0 0)" }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0"
                    style={{ background: "oklch(0.40 0.18 240 / 10%)", color: "oklch(0.40 0.18 240)" }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>{p.name}</div>
                    <div className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>{p.address} · {p.tier}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold" style={{ color: "oklch(0.32 0.18 145)" }}>
                      +${p.thisMonth.toFixed(2)}<span className="text-[10px] font-normal ml-0.5">this mo.</span>
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>
                      ${p.earned.toFixed(2)} total
                    </div>
                  </div>
                  <div
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{ background: "oklch(0.38 0.18 145 / 10%)", color: "oklch(0.32 0.18 145)", border: "1px solid oklch(0.38 0.18 145 / 20%)" }}
                  >
                    ACTIVE
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-16 border-t" style={{ background: "oklch(0.975 0.004 240)", borderColor: "oklch(0 0 0 / 8%)" }}>
        <div className="container">
          <div className="text-center mb-10">
            <div className="section-label mb-2">How It Works</div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.12 0.018 250)" }}>
              Three steps to passive income
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "01", icon: User, title: "Apply Online", desc: "Fill out the form above. City staff reviews your application within 24 hours.", color: "oklch(0.40 0.18 240)" },
              { n: "02", icon: Wifi, title: "Connect Your Node", desc: "We send you a configuration guide. Your existing hardware is all you need.", color: "oklch(0.38 0.18 145)" },
              { n: "03", icon: CreditCard, title: "Get Paid Monthly", desc: "ACH payment hits your bank account at the end of every month. No minimums.", color: "oklch(0.50 0.18 75)" },
            ].map((step) => (
              <div
                key={step.n}
                className="p-6 rounded-xl"
                style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded flex items-center justify-center"
                    style={{ background: `${step.color.replace(")", " / 10%)")}`, border: `1px solid ${step.color.replace(")", " / 22%)")}` }}
                  >
                    <step.icon className="w-4 h-4" style={{ color: step.color }} />
                  </div>
                  <span className="text-2xl font-mono font-bold" style={{ color: "oklch(0.88 0.006 240)" }}>{step.n}</span>
                </div>
                <h3 className="text-sm font-bold mb-2" style={{ color: "oklch(0.18 0.018 250)" }}>{step.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "oklch(0.42 0.012 250)" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* ─── Email Confirmation Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "oklch(0 0 0 / 55%)" }}
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: "oklch(1 0 0)", boxShadow: "0 24px 64px oklch(0 0 0 / 28%)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "oklch(0.38 0.18 145 / 12%)" }}>
                    <Inbox className="w-4 h-4" style={{ color: "oklch(0.32 0.18 145)" }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "oklch(0.18 0.018 250)" }}>Welcome Email Preview</div>
                    <div className="text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>Sent to {form.email || "your email"}</div>
                  </div>
                </div>
                <button onClick={() => setShowEmailModal(false)} className="p-1.5 rounded transition-colors" style={{ color: "oklch(0.52 0.010 250)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Simulated email client chrome */}
              <div className="px-5 py-3 border-b" style={{ background: "oklch(0.975 0.004 240)", borderColor: "oklch(0 0 0 / 8%)" }}>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
                  <span style={{ color: "oklch(0.52 0.010 250)" }}>From:</span>
                  <span style={{ color: "oklch(0.25 0.018 250)" }}>West Liberty Data Center &lt;datacenter@westlibertyia.gov&gt;</span>
                  <span style={{ color: "oklch(0.52 0.010 250)" }}>To:</span>
                  <span style={{ color: "oklch(0.25 0.018 250)" }}>{form.email || "resident@example.com"}</span>
                  <span style={{ color: "oklch(0.52 0.010 250)" }}>Subject:</span>
                  <span className="font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>Welcome to the West Liberty Distributed Data Center — Next Steps</span>
                </div>
              </div>

              {/* Email body */}
              <div className="px-5 py-5 space-y-4 text-[13px]" style={{ color: "oklch(0.28 0.014 250)", maxHeight: "360px", overflowY: "auto" }}>
                <p>Hi <strong>{form.name || "Resident"}</strong>,</p>
                <p>
                  Thank you for enrolling in the <strong>West Liberty Distributed Data Center</strong> program
                  under the <strong>{TIERS.find(t => t.id === form.tier)?.name}</strong> tier.
                  Your application has been received and is under review by City Hall staff.
                </p>

                {/* Plan summary box */}
                <div className="rounded-lg p-4" style={{ background: "oklch(0.38 0.18 145 / 8%)", border: "1px solid oklch(0.38 0.18 145 / 20%)" }}>
                  <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "oklch(0.32 0.18 145)" }}>Your Plan Summary</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "Plan", value: TIERS.find(t => t.id === form.tier)?.name || "" },
                      { label: "Monthly Cost", value: `$${TIERS.find(t => t.id === form.tier)?.price}/mo` },
                      { label: "Est. Earnings", value: `$${TIERS.find(t => t.id === form.tier)?.earnMin}–$${TIERS.find(t => t.id === form.tier)?.earnMax}/mo` },
                      { label: "Storage", value: TIERS.find(t => t.id === form.tier)?.storage || "" },
                      { label: "Bandwidth", value: TIERS.find(t => t.id === form.tier)?.bandwidth || "" },
                      { label: "Address", value: form.address || "On file" },
                    ].map(row => (
                      <div key={row.label}>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: "oklch(0.45 0.010 250)" }}>{row.label}</div>
                        <div className="font-semibold" style={{ color: "oklch(0.22 0.018 250)" }}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <p><strong>What happens next:</strong></p>
                <ol className="space-y-2 pl-4 list-decimal">
                  <li><strong>Within 24 hours:</strong> A City Hall staff member will review your application and send you an approval notice.</li>
                  <li><strong>Day 2–3:</strong> You'll receive a secure Plaid link to connect your bank account for ACH payments. No account numbers are stored by the city.</li>
                  <li><strong>Day 3–5:</strong> Our technical team will email you a node configuration guide specific to your hardware and internet provider.</li>
                  <li><strong>End of month:</strong> Your first ACH payment will be deposited directly into your bank account.</li>
                </ol>

                <div className="rounded-lg p-3" style={{ background: "oklch(0.40 0.18 240 / 8%)", border: "1px solid oklch(0.40 0.18 240 / 18%)" }}>
                  <p className="text-xs" style={{ color: "oklch(0.35 0.018 250)" }}>
                    <strong>Questions?</strong> Contact the West Liberty Data Center team at{" "}
                    <span style={{ color: "oklch(0.40 0.18 240)" }}>datacenter@westlibertyia.gov</span> or call City Hall at{" "}
                    <span style={{ color: "oklch(0.40 0.18 240)" }}>(319) 627-2418</span>.
                  </p>
                </div>

                <p>Thank you for helping build West Liberty's digital infrastructure.</p>
                <p style={{ color: "oklch(0.42 0.012 250)" }}>
                  — Matt Muckler, City Administrator<br />
                  City of West Liberty, Iowa<br />
                  111 W 7th St · West Liberty, IA 52776
                </p>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: "oklch(0 0 0 / 8%)", background: "oklch(0.975 0.004 240)" }}>
                <p className="text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>This is a preview of the email that will be sent to {form.email || "your inbox"}</p>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-1.5 rounded text-xs font-semibold transition-all"
                  style={{ background: "oklch(0.38 0.18 145)", color: "oklch(0.98 0.004 145)" }}
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
