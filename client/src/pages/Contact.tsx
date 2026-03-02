/**
 * Contact — Civic Intelligence Dark
 * Demo request form prefilled with West Liberty contact info
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Building2, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({
    name: "Matt Muckler",
    title: "City Administrator",
    city: "West Liberty",
    state: "IA",
    population: "3,858",
    email: "mmuckler@westlibertyia.gov",
    phone: "(319) 627-2418",
    departments: [] as string[],
    message: "",
  });

  const DEPTS = ["General Government", "Public Safety", "Public Works", "Community Development", "Parks & Recreation", "Water Utility", "Sewer/Wastewater", "Finance", "Human Resources"];

  const toggleDept = (d: string) => {
    setForm(prev => ({
      ...prev,
      departments: prev.departments.includes(d) ? prev.departments.filter(x => x !== d) : [...prev.departments, d],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Demo request submitted! A DOGE & Associates representative will contact you within 1 business day.");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.975 0.004 240)" }}>
      <Navbar />

      <section className="py-16 border-b" style={{ background: "oklch(0.965 0.005 240)", borderColor: "oklch(0 0 0 / 8%)" }}>
        <div className="container">
          <div className="section-label mb-3">Request a Demo</div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.95 0.008 240)" }}>
            See the Platform<br />
            <span style={{ color: "oklch(0.40 0.18 240)" }}>in Action</span>
          </h1>
          <p className="text-sm max-w-xl" style={{ color: "oklch(0.60 0.010 250)" }}>
            Schedule a live demo with your city's real data. We'll show you exactly how the platform
            would look for your municipality — prefilled, configured, and ready to deploy.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", key: "name", type: "text" },
                  { label: "Title", key: "title", type: "text" },
                  { label: "City", key: "city", type: "text" },
                  { label: "State", key: "state", type: "text" },
                  { label: "Population", key: "population", type: "text" },
                  { label: "Email", key: "email", type: "email" },
                  { label: "Phone", key: "phone", type: "tel" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs mb-1.5" style={{ color: "oklch(0.60 0.010 250)" }}>{field.label}</label>
                    <input
                      type={field.type}
                      value={(form as any)[field.key]}
                      onChange={(e) => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded text-sm"
                      style={{ background: "oklch(1 0 0)", border: "1px solid oklch(1 0 0 / 12%)", color: "oklch(0.25 0.018 250)", outline: "none" }}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs mb-2" style={{ color: "oklch(0.60 0.010 250)" }}>Departments of Interest</label>
                <div className="flex flex-wrap gap-2">
                  {DEPTS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDept(d)}
                      className="px-2.5 py-1 rounded text-xs transition-all"
                      style={{
                        background: form.departments.includes(d) ? "oklch(0.45 0.20 240 / 15%)" : "oklch(1 0 0)",
                        border: `1px solid ${form.departments.includes(d) ? "oklch(0.45 0.20 240 / 30%)" : "oklch(0 0 0 / 10%)"}`,
                        color: form.departments.includes(d) ? "oklch(0.40 0.18 240)" : "oklch(0.45 0.012 250)",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "oklch(0.60 0.010 250)" }}>Message (optional)</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Tell us about your city's specific challenges..."
                  className="w-full px-3 py-2 rounded text-sm resize-none"
                  style={{ background: "oklch(1 0 0)", border: "1px solid oklch(1 0 0 / 12%)", color: "oklch(0.25 0.018 250)", outline: "none" }}
                />
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded font-semibold"
                style={{ background: "oklch(0.45 0.20 240)", color: "oklch(0.18 0.018 250)" }}
              >
                Request Demo <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            <div className="p-5 rounded-xl" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
              <div className="section-label mb-3">Example Contact</div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "oklch(0.45 0.20 240 / 12%)", border: "1px solid oklch(0.58 0.20 240 / 25%)" }}>
                  <Building2 className="w-5 h-5" style={{ color: "oklch(0.40 0.18 240)" }} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>Matt Muckler</div>
                  <div className="text-xs" style={{ color: "oklch(0.48 0.012 250)" }}>City Administrator, West Liberty</div>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: MapPin, text: "111 W 7th St, West Liberty, IA 52776" },
                  { icon: Phone, text: "(319) 627-2418" },
                  { icon: Mail, text: "mmuckler@westlibertyia.gov" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs" style={{ color: "oklch(0.60 0.010 250)" }}>
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.48 0.012 250)" }} />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
              <div className="section-label mb-3">What to Expect</div>
              <div className="space-y-2 text-xs" style={{ color: "oklch(0.60 0.010 250)" }}>
                <div>1. 30-minute discovery call to understand your city's needs</div>
                <div>2. Custom demo prefilled with your city's data</div>
                <div>3. Proposal with ROI projections and implementation timeline</div>
                <div>4. 90-day pilot program available for qualifying cities</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
