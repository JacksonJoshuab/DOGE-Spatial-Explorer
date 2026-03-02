/**
 * ROI Calculator — Civic Intelligence Dark
 * Interactive slider-based calculator prefilled with West Liberty data
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { DollarSign, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function ROICalculator() {
  const [budget, setBudget] = useState(17.5); // $M
  const [population, setPopulation] = useState(3858);
  const [departments, setDepartments] = useState(9);
  const [iotNodes, setIotNodes] = useState(47);

  // ROI calculations
  const platformCost = Math.max(24000, budget * 1000 * 0.0018); // 0.18% of budget, min $24K
  const adminSavings = budget * 1000000 * 0.018; // 1.8% admin overhead reduction
  const waterSavings = iotNodes * 600; // $600/node/year in water/energy savings
  const auditSavings = departments * 8500; // $8,500/dept audit time reduction
  const iotRoyalties = iotNodes * 1200; // $1,200/node/year royalty potential
  const dataCenterRevenue = Math.floor(population / 100) * 180; // $180/100 residents
  const totalAnnualBenefit = adminSavings + waterSavings + auditSavings + iotRoyalties + dataCenterRevenue;
  const netAnnualROI = totalAnnualBenefit - platformCost;
  const roiPercent = Math.round((netAnnualROI / platformCost) * 100);
  const paybackMonths = Math.round((platformCost / totalAnnualBenefit) * 12);

  const fmt = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(2)}M` : `$${Math.round(n).toLocaleString()}`;

  const BENEFITS = [
    { label: "Admin Overhead Reduction", value: adminSavings, color: "oklch(0.45 0.18 145)" },
    { label: "IoT Operational Savings", value: waterSavings, color: "oklch(0.40 0.18 240)" },
    { label: "Audit Time Reduction", value: auditSavings, color: "oklch(0.55 0.18 75)" },
    { label: "IoT Patent Royalties", value: iotRoyalties, color: "oklch(0.50 0.22 25)" },
    { label: "Data Center Revenue Share", value: dataCenterRevenue, color: "oklch(0.40 0.18 240)" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.975 0.004 240)" }}>
      <Navbar />

      <section className="py-16 border-b" style={{ background: "oklch(0.965 0.005 240)", borderColor: "oklch(0 0 0 / 8%)" }}>
        <div className="container">
          <div className="section-label mb-3">ROI Calculator</div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.95 0.008 240)" }}>
            Calculate Your<br />
            <span style={{ color: "oklch(0.40 0.18 240)" }}>Municipal ROI</span>
          </h1>
          <p className="text-sm max-w-xl" style={{ color: "oklch(0.60 0.010 250)" }}>
            Prefilled with City of West Liberty, IA FY2024 data. Adjust the sliders to model your city's projected return on investment.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="section-label">City Parameters</div>

            {[
              { label: "Annual Budget", value: budget, min: 1, max: 500, step: 0.5, unit: "$M", display: `$${budget}M`, setter: setBudget },
              { label: "Population", value: population, min: 500, max: 500000, step: 100, unit: "", display: population.toLocaleString(), setter: setPopulation },
              { label: "Departments", value: departments, min: 2, max: 30, step: 1, unit: "", display: departments.toString(), setter: setDepartments },
              { label: "IoT Nodes Deployed", value: iotNodes, min: 5, max: 500, step: 5, unit: "", display: iotNodes.toString(), setter: setIotNodes },
            ].map((slider) => (
              <div key={slider.label}>
                <div className="flex justify-between mb-2">
                  <label className="text-xs" style={{ color: "oklch(0.60 0.010 250)" }}>{slider.label}</label>
                  <span className="text-xs font-mono font-bold" style={{ color: "oklch(0.40 0.18 240)" }}>{slider.display}</span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={slider.value}
                  onChange={(e) => slider.setter(Number(e.target.value) as any)}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, oklch(0.45 0.20 240) ${((slider.value - slider.min) / (slider.max - slider.min)) * 100}%, oklch(0 0 0 / 10%) 0%)`, accentColor: "oklch(0.45 0.20 240)" }}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[9px]" style={{ color: "oklch(0.45 0.012 250)" }}>{slider.min}{slider.unit}</span>
                  <span className="text-[9px]" style={{ color: "oklch(0.45 0.012 250)" }}>{slider.max.toLocaleString()}{slider.unit}</span>
                </div>
              </div>
            ))}

            {/* Benefit breakdown */}
            <div>
              <div className="section-label mb-3">Annual Benefit Breakdown</div>
              <div className="space-y-2">
                {BENEFITS.map((b) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs" style={{ color: "oklch(0.45 0.012 250)" }}>{b.label}</span>
                        <span className="text-xs font-mono font-bold" style={{ color: b.color }}>{fmt(b.value)}</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: "oklch(0 0 0 / 8%)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (b.value / totalAnnualBenefit) * 100)}%`, background: b.color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="section-label">Projected Returns</div>

            {/* Big ROI number */}
            <div className="p-6 rounded-xl text-center" style={{ background: "oklch(0.45 0.20 240 / 8%)", border: "1px solid oklch(0.58 0.20 240 / 25%)" }}>
              <div className="text-5xl font-bold font-mono mb-1" style={{ color: "oklch(0.40 0.18 240)", fontFamily: "'Syne', sans-serif" }}>
                {roiPercent}%
              </div>
              <div className="text-xs" style={{ color: "oklch(0.45 0.012 250)" }}>Annual Return on Investment</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Platform Cost", value: fmt(platformCost), icon: DollarSign, color: "oklch(0.50 0.22 25)" },
                { label: "Total Annual Benefit", value: fmt(totalAnnualBenefit), icon: TrendingUp, color: "oklch(0.45 0.18 145)" },
                { label: "Net Annual ROI", value: fmt(netAnnualROI), icon: DollarSign, color: "oklch(0.45 0.18 145)" },
                { label: "Payback Period", value: `${paybackMonths} months`, icon: Clock, color: "oklch(0.40 0.18 240)" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-lg" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                  <stat.icon className="w-4 h-4 mb-2" style={{ color: stat.color }} />
                  <div className="text-lg font-mono font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
              <div className="section-label mb-2">5-Year Cumulative Benefit</div>
              <div className="text-2xl font-mono font-bold" style={{ color: "oklch(0.45 0.18 145)", fontFamily: "'Syne', sans-serif" }}>
                {fmt(totalAnnualBenefit * 5 - platformCost)}
              </div>
              <div className="text-xs mt-1" style={{ color: "oklch(0.52 0.010 250)" }}>
                After platform cost, over 5 years
              </div>
            </div>

            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 w-full py-3 rounded font-semibold no-underline"
              style={{ background: "oklch(0.45 0.20 240)", color: "oklch(0.18 0.018 250)" }}
            >
              Get a Custom ROI Analysis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
