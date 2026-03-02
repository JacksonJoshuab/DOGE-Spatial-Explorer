/**
 * UtilityBillQRGenerator — Civic Intelligence Platform
 * Admin tool for generating printable utility bill inserts with QR codes
 * pointing to the /resident/m mobile enrollment page.
 * City Hall staff can customize and print bulk mailing inserts.
 */
import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Printer, Download, QrCode, Users, DollarSign, MapPin, Phone, Mail, RefreshCw, Eye, Settings2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const ENROLLMENT_URL = "https://dogemuni-zykc8hns.manus.space/resident/m";

interface InsertConfig {
  headline: string;
  subheadline: string;
  bodyText: string;
  ctaText: string;
  showStats: boolean;
  showAddress: boolean;
  colorScheme: "blue" | "green" | "navy";
  includePhone: boolean;
}

const DEFAULT_CONFIG: InsertConfig = {
  headline: "Earn Money from Your Internet Connection",
  subheadline: "West Liberty's Distributed Data Network — Powered by Residents",
  bodyText: "The City of West Liberty is building a distributed computing network. Residents can lease unused internet capacity and earn monthly payments directly to their bank account. No equipment to buy. No technical knowledge required.",
  ctaText: "Scan to Enroll in 3 Minutes",
  showStats: true,
  showAddress: true,
  colorScheme: "blue",
  includePhone: true,
};

// Simulated resident account list for bulk preview
const SAMPLE_ACCOUNTS = [
  { id: "WL-001", name: "James & Carol Peterson", address: "412 N Elm St", account: "WL-2024-00412" },
  { id: "WL-002", name: "Maria Rodriguez", address: "218 W 4th St", account: "WL-2024-00218" },
  { id: "WL-003", name: "Robert & Linda Chen", address: "805 Calhoun St", account: "WL-2024-00805" },
  { id: "WL-004", name: "David Thompson", address: "134 N Iowa Ave", account: "WL-2024-00134" },
  { id: "WL-005", name: "Sarah & Mike Johnson", address: "627 W 6th St", account: "WL-2024-00627" },
  { id: "WL-006", name: "Tom & Nancy Williams", address: "319 Mulberry Ave", account: "WL-2024-00319" },
];

const COLOR_SCHEMES = {
  blue: { primary: "oklch(0.40 0.18 240)", light: "oklch(0.40 0.18 240 / 8%)", border: "oklch(0.40 0.18 240 / 20%)", label: "City Blue" },
  green: { primary: "oklch(0.40 0.18 145)", light: "oklch(0.40 0.18 145 / 8%)", border: "oklch(0.40 0.18 145 / 20%)", label: "Civic Green" },
  navy: { primary: "oklch(0.28 0.12 260)", light: "oklch(0.28 0.12 260 / 8%)", border: "oklch(0.28 0.12 260 / 20%)", label: "Official Navy" },
};

function InsertPreview({ config, account }: { config: InsertConfig; account?: typeof SAMPLE_ACCOUNTS[0] }) {
  const scheme = COLOR_SCHEMES[config.colorScheme];

  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{ border: `2px solid ${scheme.border}`, background: "white", fontFamily: "Georgia, serif", maxWidth: 480 }}
    >
      {/* Header bar */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ background: scheme.primary }}>
        <div>
          <div className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
            City of West Liberty, Iowa
          </div>
          <div className="text-white/70 text-[10px]">Official Utility Billing Insert · {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
        </div>
        <div className="text-right">
          <div className="text-white/80 text-[9px]">Account</div>
          <div className="text-white font-mono text-[11px]">{account?.account || "WL-2024-XXXXX"}</div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex gap-4">
        {/* Left: text content */}
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-[15px] leading-tight mb-1.5" style={{ color: scheme.primary, fontFamily: "'Syne', sans-serif" }}>
            {config.headline}
          </h2>
          <p className="text-[11px] font-semibold mb-2" style={{ color: "oklch(0.40 0.012 250)" }}>
            {config.subheadline}
          </p>
          <p className="text-[10px] leading-relaxed mb-3" style={{ color: "oklch(0.45 0.010 250)" }}>
            {config.bodyText}
          </p>

          {config.showStats && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: "Avg Monthly", value: "$45" },
                { label: "Top Earner", value: "$120" },
                { label: "Enrolled", value: "47" },
              ].map(stat => (
                <div key={stat.label} className="text-center p-1.5 rounded" style={{ background: scheme.light, border: `1px solid ${scheme.border}` }}>
                  <div className="font-bold text-sm" style={{ color: scheme.primary }}>{stat.value}</div>
                  <div className="text-[8px]" style={{ color: "oklch(0.55 0.010 250)" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {config.showAddress && (
            <div className="text-[9px] space-y-0.5" style={{ color: "oklch(0.55 0.010 250)" }}>
              <div className="flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                <span>111 W 7th St, West Liberty, IA 52776</span>
              </div>
              {config.includePhone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-2.5 h-2.5" />
                  <span>(319) 627-2418</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Mail className="w-2.5 h-2.5" />
                <span>city@westlibertyia.gov</span>
              </div>
            </div>
          )}

          {account && (
            <div className="mt-3 pt-2 border-t text-[9px]" style={{ borderColor: "oklch(0 0 0 / 8%)", color: "oklch(0.50 0.010 250)" }}>
              Addressed to: <strong>{account.name}</strong><br />
              {account.address}, West Liberty, IA 52776
            </div>
          )}
        </div>

        {/* Right: QR code */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <div className="p-2 rounded-lg" style={{ border: `2px solid ${scheme.border}`, background: "white" }}>
            <QRCodeSVG
              value={ENROLLMENT_URL}
              size={96}
              fgColor={scheme.primary}
              bgColor="white"
              level="H"
              includeMargin={false}
            />
          </div>
          <div className="text-center">
            <div className="text-[9px] font-bold" style={{ color: scheme.primary }}>{config.ctaText}</div>
            <div className="text-[8px]" style={{ color: "oklch(0.60 0.010 250)" }}>westlibertyia.gov/resident</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-2 text-[8px] text-center" style={{ background: "oklch(0.975 0.004 240)", borderTop: "1px solid oklch(0 0 0 / 6%)", color: "oklch(0.60 0.010 250)" }}>
        This insert is included with your monthly utility bill. Questions? Contact City Hall at (319) 627-2418.
        Payments processed via ACH. Program administered by City of West Liberty Finance Department.
      </div>
    </div>
  );
}

export default function UtilityBillQR() {
  const [config, setConfig] = useState<InsertConfig>(DEFAULT_CONFIG);
  const [previewAccount, setPreviewAccount] = useState<typeof SAMPLE_ACCOUNTS[0] | undefined>(SAMPLE_ACCOUNTS[0]);
  const [activeTab, setActiveTab] = useState<"design" | "accounts" | "stats">("design");
  const [printed, setPrinted] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened — select your printer or Save as PDF");
  };

  const handleMarkPrinted = (id: string) => {
    setPrinted(prev => prev.includes(id) ? prev : [...prev, id]);
    toast.success("Marked as printed");
  };

  const handleMarkAll = () => {
    setPrinted(SAMPLE_ACCOUNTS.map(a => a.id));
    toast.success(`Marked all ${SAMPLE_ACCOUNTS.length} accounts as printed`);
  };

  const scheme = COLOR_SCHEMES[config.colorScheme];

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.975 0.004 240)" }}>
      <Navbar />

      <div className="container py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="section-label mb-1">Admin Tool</div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
              Utility Bill QR Insert Generator
            </h1>
            <p className="text-sm mt-1" style={{ color: "oklch(0.55 0.010 250)" }}>
              Generate and print personalized enrollment inserts for all West Liberty utility accounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]" style={{ background: "oklch(0.42 0.18 145 / 10%)", border: "1px solid oklch(0.42 0.18 145 / 25%)", color: "oklch(0.35 0.18 145)" }}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{printed.length}/{SAMPLE_ACCOUNTS.length} printed</span>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "oklch(0.40 0.18 240)", color: "white" }}
            >
              <Printer className="w-4 h-4" />
              Print Current Insert
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Accounts", value: "1,247", icon: Users, color: "oklch(0.40 0.18 240)" },
            { label: "Enrolled", value: "47", icon: CheckCircle2, color: "oklch(0.42 0.18 145)" },
            { label: "Monthly Payout", value: "$2,115", icon: DollarSign, color: "oklch(0.55 0.18 75)" },
            { label: "QR Scans (30d)", value: "312", icon: QrCode, color: "oklch(0.50 0.22 25)" },
          ].map(stat => (
            <div key={stat.label} className="p-4 rounded-xl" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                <span className="section-label">{stat.label}</span>
              </div>
              <div className="metric-value" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Configuration panel */}
          <div className="rounded-xl overflow-hidden" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)" }}>
            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
              {([
                { id: "design", label: "Design", icon: Settings2 },
                { id: "accounts", label: "Accounts", icon: Users },
                { id: "stats", label: "QR Stats", icon: QrCode },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-3 text-[12px] font-medium transition-all border-b-2"
                  style={{
                    borderBottomColor: activeTab === tab.id ? "oklch(0.40 0.18 240)" : "transparent",
                    color: activeTab === tab.id ? "oklch(0.40 0.18 240)" : "oklch(0.55 0.010 250)",
                    background: activeTab === tab.id ? "oklch(0.40 0.18 240 / 5%)" : "transparent",
                  }}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Design tab */}
            {activeTab === "design" && (
              <div className="p-5 space-y-4">
                <div>
                  <label className="section-label mb-1.5 block">Headline</label>
                  <input
                    value={config.headline}
                    onChange={e => setConfig(c => ({ ...c, headline: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.22 0.014 250)" }}
                  />
                </div>
                <div>
                  <label className="section-label mb-1.5 block">Subheadline</label>
                  <input
                    value={config.subheadline}
                    onChange={e => setConfig(c => ({ ...c, subheadline: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.22 0.014 250)" }}
                  />
                </div>
                <div>
                  <label className="section-label mb-1.5 block">Body Text</label>
                  <textarea
                    value={config.bodyText}
                    onChange={e => setConfig(c => ({ ...c, bodyText: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.22 0.014 250)" }}
                  />
                </div>
                <div>
                  <label className="section-label mb-1.5 block">QR Call-to-Action</label>
                  <input
                    value={config.ctaText}
                    onChange={e => setConfig(c => ({ ...c, ctaText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.22 0.014 250)" }}
                  />
                </div>
                <div>
                  <label className="section-label mb-2 block">Color Scheme</label>
                  <div className="flex gap-2">
                    {(Object.entries(COLOR_SCHEMES) as [keyof typeof COLOR_SCHEMES, typeof COLOR_SCHEMES[keyof typeof COLOR_SCHEMES]][]).map(([key, s]) => (
                      <button
                        key={key}
                        onClick={() => setConfig(c => ({ ...c, colorScheme: key }))}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                        style={{
                          background: config.colorScheme === key ? s.light : "oklch(0.975 0.004 240)",
                          border: `1px solid ${config.colorScheme === key ? s.border : "oklch(0 0 0 / 10%)"}`,
                          color: config.colorScheme === key ? s.primary : "oklch(0.55 0.010 250)",
                        }}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ background: s.primary }} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: "showStats", label: "Show earnings stats" },
                    { key: "showAddress", label: "Show city address" },
                    { key: "includePhone", label: "Include phone number" },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config[opt.key as keyof InsertConfig] as boolean}
                        onChange={e => setConfig(c => ({ ...c, [opt.key]: e.target.checked }))}
                        className="w-3.5 h-3.5 rounded"
                      />
                      <span className="text-[12px]" style={{ color: "oklch(0.40 0.012 250)" }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => setConfig(DEFAULT_CONFIG)}
                  className="flex items-center gap-1.5 text-[11px] transition-all"
                  style={{ color: "oklch(0.55 0.010 250)" }}
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset to defaults
                </button>
              </div>
            )}

            {/* Accounts tab */}
            {activeTab === "accounts" && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="section-label">Sample Accounts ({SAMPLE_ACCOUNTS.length})</div>
                  <button
                    onClick={handleMarkAll}
                    className="text-[11px] px-2.5 py-1 rounded transition-all"
                    style={{ background: "oklch(0.42 0.18 145 / 10%)", color: "oklch(0.38 0.18 145)", border: "1px solid oklch(0.42 0.18 145 / 25%)" }}
                  >
                    Mark All Printed
                  </button>
                </div>
                <div className="space-y-2">
                  {SAMPLE_ACCOUNTS.map(account => (
                    <div
                      key={account.id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                      style={{
                        background: previewAccount?.id === account.id ? scheme.light : "oklch(0.975 0.004 240)",
                        border: `1px solid ${previewAccount?.id === account.id ? scheme.border : "oklch(0 0 0 / 6%)"}`,
                      }}
                      onClick={() => setPreviewAccount(account)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium" style={{ color: "oklch(0.25 0.014 250)" }}>{account.name}</div>
                        <div className="text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>{account.address} · {account.account}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {printed.includes(account.id) ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "oklch(0.42 0.18 145 / 12%)", color: "oklch(0.38 0.18 145)" }}>Printed</span>
                        ) : (
                          <button
                            onClick={e => { e.stopPropagation(); handleMarkPrinted(account.id); }}
                            className="text-[9px] px-1.5 py-0.5 rounded transition-all"
                            style={{ background: "oklch(0.975 0.004 240)", color: "oklch(0.55 0.010 250)", border: "1px solid oklch(0 0 0 / 10%)" }}
                          >
                            Mark Printed
                          </button>
                        )}
                        <Eye className="w-3.5 h-3.5" style={{ color: previewAccount?.id === account.id ? scheme.primary : "oklch(0.65 0.010 250)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Stats tab */}
            {activeTab === "stats" && (
              <div className="p-5 space-y-4">
                <div className="section-label mb-2">QR Code Scan Analytics (Last 30 Days)</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total Scans", value: "312", delta: "+47 vs last month" },
                    { label: "Unique Visitors", value: "284", delta: "+38 vs last month" },
                    { label: "Enrollments", value: "23", delta: "+8 vs last month" },
                    { label: "Conversion Rate", value: "8.1%", delta: "+1.2pp vs last month" },
                  ].map(stat => (
                    <div key={stat.label} className="p-3 rounded-lg" style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                      <div className="section-label mb-0.5">{stat.label}</div>
                      <div className="text-lg font-bold" style={{ color: "oklch(0.22 0.014 250)", fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
                      <div className="text-[9px]" style={{ color: "oklch(0.42 0.18 145)" }}>{stat.delta}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="section-label mb-2">Top Scan Sources</div>
                  {[
                    { source: "Utility Bill Insert", pct: 68 },
                    { source: "City Website", pct: 18 },
                    { source: "Direct Link", pct: 9 },
                    { source: "Other", pct: 5 },
                  ].map(row => (
                    <div key={row.source} className="flex items-center gap-3 mb-2">
                      <span className="text-[11px] w-36 flex-shrink-0" style={{ color: "oklch(0.40 0.012 250)" }}>{row.source}</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: "oklch(0 0 0 / 8%)" }}>
                        <div className="h-2 rounded-full" style={{ width: `${row.pct}%`, background: scheme.primary }} />
                      </div>
                      <span className="text-[11px] font-mono w-8 text-right" style={{ color: "oklch(0.50 0.010 250)" }}>{row.pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg" style={{ background: scheme.light, border: `1px solid ${scheme.border}` }}>
                  <div className="text-[11px] font-semibold mb-1" style={{ color: scheme.primary }}>QR Code URL</div>
                  <div className="text-[10px] font-mono break-all" style={{ color: "oklch(0.40 0.012 250)" }}>{ENROLLMENT_URL}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="section-label">Live Preview</div>
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: "oklch(0.55 0.010 250)" }}>
                  {previewAccount ? `Showing: ${previewAccount.name}` : "Generic preview"}
                </span>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                  style={{ background: "oklch(0.40 0.18 240)", color: "white" }}
                >
                  <Download className="w-3 h-3" />
                  Print / Save PDF
                </button>
              </div>
            </div>

            {/* Print-ready area */}
            <div ref={printRef} className="print-area">
              <InsertPreview config={config} account={previewAccount} />
            </div>

            {/* Bulk print note */}
            <div className="mt-4 p-3 rounded-lg" style={{ background: "oklch(0.55 0.18 75 / 8%)", border: "1px solid oklch(0.55 0.18 75 / 20%)" }}>
              <div className="text-[11px] font-semibold mb-1" style={{ color: "oklch(0.45 0.18 75)" }}>Bulk Mailing Instructions</div>
              <ol className="text-[10px] space-y-0.5 list-decimal list-inside" style={{ color: "oklch(0.45 0.012 250)" }}>
                <li>Select each account in the Accounts tab to preview their personalized insert</li>
                <li>Click "Print / Save PDF" to generate a print-ready PDF for each account</li>
                <li>Mark accounts as printed to track your mailing progress</li>
                <li>For bulk printing, contact City Hall IT to run the batch export script</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
