/**
 * GrantAutoFill — Grant Application Auto-Fill Tool
 * Pre-populates Iowa CDBG and USDA Rural Development grant applications
 * with West Liberty FY2024 demographic and financial data.
 * Design: Civic Intelligence Light
 */
import { useState } from "react";
import { FileText, Download, CheckCircle2, ChevronDown, ChevronUp, Copy, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";

// ─── West Liberty FY2024 Pre-fill Data ────────────────────────────────────────
const WEST_LIBERTY_DATA = {
  // Jurisdiction
  city: "City of West Liberty",
  state: "Iowa",
  county: "Muscatine County",
  zip: "52776",
  address: "111 W 7th Street, West Liberty, IA 52776",
  phone: "(319) 627-2418",
  fax: "(319) 627-2746",
  website: "www.cityofwestlibertyia.org",
  duns: "07-842-3319",
  ein: "42-6004872",

  // Demographics (2020 Census / ACS 2022)
  population: 3858,
  households: 1342,
  medianHouseholdIncome: 51240,
  povertyRate: 14.2,
  unemploymentRate: 3.8,
  hispanicLatino: 42.1,
  nonEnglishSpeaking: 38.4,
  over65: 12.8,
  under18: 28.3,
  housingUnits: 1418,
  ownerOccupied: 58.2,
  renterOccupied: 41.8,
  medianHomeValue: 118500,
  medianRent: 712,

  // Financial (FY2024 Annual Report)
  totalRevenue: 17505461,
  totalExpenditures: 17333093,
  generalFundBalance: 2184000,
  totalDebt: 1823964,
  debtServiceRatio: 2.1,
  taxRate: 14.52,
  assessedValuation: 98450000,
  bondRating: "Aa3 (Moody's)",

  // Infrastructure
  waterMiles: 18.4,
  sewerMiles: 16.2,
  streetMiles: 22.7,
  waterConnections: 1389,
  sewerConnections: 1312,

  // Contact
  mayorName: "Jared Doyle",
  clerkName: "Brenda Elgin",
  adminName: "Matt Muckler",
  adminTitle: "City Administrator",
  adminEmail: "mmuckler@westlibertyia.org",
  financeDirector: "Deb Fett",
};

const GRANT_PROGRAMS = [
  {
    id: "cdbg_community",
    name: "Iowa CDBG — Community Development",
    agency: "Iowa Economic Development Authority",
    deadline: "Rolling",
    maxAward: 750000,
    match: "0%",
    category: "Community Development",
    description: "Funds infrastructure, housing, and economic development in low-to-moderate income communities.",
    url: "https://www.iowaeda.com/community/cdbg/",
    fields: ["jurisdiction", "demographics", "financial", "project"],
  },
  {
    id: "usda_water",
    name: "USDA Water & Waste Disposal",
    agency: "USDA Rural Development",
    deadline: "Quarterly",
    maxAward: 5000000,
    match: "25%",
    category: "Water/Sewer",
    description: "Funds water and wastewater infrastructure improvements for rural communities.",
    url: "https://www.rd.usda.gov/programs-services/water-environmental-programs",
    fields: ["jurisdiction", "demographics", "financial", "infrastructure"],
  },
  {
    id: "usda_community",
    name: "USDA Community Facilities Grant",
    agency: "USDA Rural Development",
    deadline: "Rolling",
    maxAward: 250000,
    match: "0%",
    category: "Public Facilities",
    description: "Funds essential community facilities including public safety, health, and education.",
    url: "https://www.rd.usda.gov/programs-services/community-facilities",
    fields: ["jurisdiction", "demographics", "financial"],
  },
  {
    id: "epa_brownfields",
    name: "EPA Brownfields Assessment Grant",
    agency: "U.S. EPA",
    deadline: "Nov 2025",
    maxAward: 500000,
    match: "20%",
    category: "Environmental",
    description: "Funds assessment and cleanup of brownfield sites to support community redevelopment.",
    url: "https://www.epa.gov/brownfields/brownfields-grant-types",
    fields: ["jurisdiction", "demographics", "project"],
  },
  {
    id: "dot_stbg",
    name: "Iowa DOT STBG — Surface Transportation",
    agency: "Iowa DOT / FHWA",
    deadline: "Jan 2026",
    maxAward: 2000000,
    match: "20%",
    category: "Transportation",
    description: "Funds roadway, bridge, and multimodal transportation improvements.",
    url: "https://iowadot.gov/local_systems/stbg",
    fields: ["jurisdiction", "financial", "infrastructure"],
  },
];

const SECTION_LABELS: Record<string, string> = {
  jurisdiction: "Jurisdiction Information",
  demographics: "Community Demographics",
  financial: "Financial Data",
  infrastructure: "Infrastructure Data",
  project: "Project Description",
};

function fmt(n: number, prefix = "") {
  return prefix + n.toLocaleString();
}
function fmtCurrency(n: number) {
  return "$" + n.toLocaleString();
}

function generateFieldValue(fieldKey: string): string {
  const d = WEST_LIBERTY_DATA;
  const map: Record<string, string> = {
    // Jurisdiction
    applicant_name: d.city,
    state: d.state,
    county: d.county,
    zip_code: d.zip,
    mailing_address: d.address,
    phone: d.phone,
    fax: d.fax,
    website: d.website,
    duns_number: d.duns,
    ein: d.ein,
    authorized_representative: d.adminName,
    title: d.adminTitle,
    email: d.adminEmail,
    mayor: d.mayorName,
    city_clerk: d.clerkName,

    // Demographics
    total_population: fmt(d.population),
    total_households: fmt(d.households),
    median_household_income: fmtCurrency(d.medianHouseholdIncome),
    poverty_rate: d.povertyRate + "%",
    unemployment_rate: d.unemploymentRate + "%",
    hispanic_latino_pct: d.hispanicLatino + "% of population",
    non_english_speaking: d.nonEnglishSpeaking + "% of households",
    population_over_65: d.over65 + "%",
    population_under_18: d.under18 + "%",
    housing_units: fmt(d.housingUnits),
    owner_occupied: d.ownerOccupied + "%",
    renter_occupied: d.renterOccupied + "%",
    median_home_value: fmtCurrency(d.medianHomeValue),
    median_gross_rent: fmtCurrency(d.medianRent),

    // Financial
    total_annual_revenue: fmtCurrency(d.totalRevenue),
    total_annual_expenditures: fmtCurrency(d.totalExpenditures),
    general_fund_balance: fmtCurrency(d.generalFundBalance),
    total_outstanding_debt: fmtCurrency(d.totalDebt),
    debt_service_ratio: d.debtServiceRatio + "% of revenue",
    property_tax_rate: "$" + d.taxRate + " per $1,000 assessed value",
    total_assessed_valuation: fmtCurrency(d.assessedValuation),
    bond_rating: d.bondRating,

    // Infrastructure
    water_distribution_miles: d.waterMiles + " miles",
    sewer_collection_miles: d.sewerMiles + " miles",
    street_miles: d.streetMiles + " miles",
    water_service_connections: fmt(d.waterConnections),
    sewer_service_connections: fmt(d.sewerConnections),

    // Project
    project_location: "City of West Liberty, Muscatine County, Iowa",
    service_area_population: fmt(d.population),
    lmi_percentage: "56.4% (HUD LMI data 2023)",
    project_description: "Infrastructure modernization and IoT sensor deployment to improve municipal service delivery, reduce operational costs, and enhance public safety for the City of West Liberty, Iowa.",
  };
  return map[fieldKey] || "";
}

const FORM_FIELDS: Record<string, { label: string; key: string }[]> = {
  jurisdiction: [
    { label: "Applicant Name", key: "applicant_name" },
    { label: "State", key: "state" },
    { label: "County", key: "county" },
    { label: "ZIP Code", key: "zip_code" },
    { label: "Mailing Address", key: "mailing_address" },
    { label: "Phone", key: "phone" },
    { label: "Fax", key: "fax" },
    { label: "Website", key: "website" },
    { label: "DUNS Number", key: "duns_number" },
    { label: "EIN / Tax ID", key: "ein" },
    { label: "Authorized Representative", key: "authorized_representative" },
    { label: "Title", key: "title" },
    { label: "Email", key: "email" },
    { label: "Mayor / Chief Elected Official", key: "mayor" },
    { label: "City Clerk", key: "city_clerk" },
  ],
  demographics: [
    { label: "Total Population", key: "total_population" },
    { label: "Total Households", key: "total_households" },
    { label: "Median Household Income", key: "median_household_income" },
    { label: "Poverty Rate", key: "poverty_rate" },
    { label: "Unemployment Rate", key: "unemployment_rate" },
    { label: "Hispanic / Latino Population", key: "hispanic_latino_pct" },
    { label: "Non-English Speaking Households", key: "non_english_speaking" },
    { label: "Population Age 65+", key: "population_over_65" },
    { label: "Population Under 18", key: "population_under_18" },
    { label: "Total Housing Units", key: "housing_units" },
    { label: "Owner-Occupied", key: "owner_occupied" },
    { label: "Renter-Occupied", key: "renter_occupied" },
    { label: "Median Home Value", key: "median_home_value" },
    { label: "Median Gross Rent", key: "median_gross_rent" },
  ],
  financial: [
    { label: "Total Annual Revenue (FY2024)", key: "total_annual_revenue" },
    { label: "Total Annual Expenditures (FY2024)", key: "total_annual_expenditures" },
    { label: "General Fund Balance", key: "general_fund_balance" },
    { label: "Total Outstanding Debt", key: "total_outstanding_debt" },
    { label: "Debt Service Ratio", key: "debt_service_ratio" },
    { label: "Property Tax Rate", key: "property_tax_rate" },
    { label: "Total Assessed Valuation", key: "total_assessed_valuation" },
    { label: "Bond Rating", key: "bond_rating" },
  ],
  infrastructure: [
    { label: "Water Distribution Miles", key: "water_distribution_miles" },
    { label: "Sewer Collection Miles", key: "sewer_collection_miles" },
    { label: "Street Miles", key: "street_miles" },
    { label: "Water Service Connections", key: "water_service_connections" },
    { label: "Sewer Service Connections", key: "sewer_service_connections" },
  ],
  project: [
    { label: "Project Location", key: "project_location" },
    { label: "Service Area Population", key: "service_area_population" },
    { label: "LMI Percentage", key: "lmi_percentage" },
    { label: "Project Description", key: "project_description" },
  ],
};

export default function GrantAutoFill() {
  const [selectedGrant, setSelectedGrant] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["jurisdiction"]));
  const [copiedFields, setCopiedFields] = useState<Set<string>>(new Set());

  const grant = GRANT_PROGRAMS.find(g => g.id === selectedGrant);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const copyField = (key: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedFields(prev => new Set(prev).add(key));
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedFields(prev => { const n = new Set(prev); n.delete(key); return n; }), 2000);
    });
  };

  const copyAllSection = (section: string) => {
    const fields = FORM_FIELDS[section] || [];
    const text = fields.map(f => `${f.label}: ${generateFieldValue(f.key)}`).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Copied all ${SECTION_LABELS[section]} fields`);
    });
  };

  const exportGrantPacket = () => {
    if (!grant) return;
    const sections = grant.fields;
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${grant.name} — West Liberty, IA</title>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a2e; }
  h1 { font-size: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; color: #1e3a8a; }
  h2 { font-size: 14px; color: #1e3a8a; margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .field { display: flex; gap: 16px; padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
  .label { font-weight: 600; min-width: 220px; color: #374151; }
  .value { color: #111827; }
  .header { background: #1e3a8a; color: white; padding: 20px; margin-bottom: 24px; border-radius: 4px; }
  .header h1 { color: white; border-color: rgba(255,255,255,0.3); }
  .meta { font-size: 11px; opacity: 0.8; margin-top: 4px; }
  @media print { body { margin: 0; } }
</style></head><body>
<div class="header">
  <h1>${grant.name}</h1>
  <div class="meta">${grant.agency} · Max Award: ${fmtCurrency(grant.maxAward)} · Match: ${grant.match}</div>
  <div class="meta">Pre-filled for City of West Liberty, Iowa · FY2024 Data · Generated ${new Date().toLocaleDateString()}</div>
</div>`;

    sections.forEach(section => {
      const fields = FORM_FIELDS[section] || [];
      html += `<h2>${SECTION_LABELS[section]}</h2>`;
      fields.forEach(f => {
        const val = generateFieldValue(f.key);
        html += `<div class="field"><span class="label">${f.label}</span><span class="value">${val}</span></div>`;
      });
    });

    html += `</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${grant.id}_west_liberty_prefill.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Grant packet exported — open in browser to print as PDF");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
            Grant Application Auto-Fill
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "oklch(0.48 0.012 250)" }}>
            Pre-populated with West Liberty FY2024 data — select a grant program to begin
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg"
          style={{ background: "oklch(0.40 0.18 240 / 8%)", border: "1px solid oklch(0.40 0.18 240 / 20%)", color: "oklch(0.40 0.18 240)" }}>
          <Sparkles className="w-3 h-3" />
          {Object.values(FORM_FIELDS).flat().length} fields ready
        </div>
      </div>

      {/* Grant program selector */}
      <div className="grid grid-cols-1 gap-2">
        {GRANT_PROGRAMS.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGrant(g.id === selectedGrant ? null : g.id)}
            className="w-full text-left p-3 rounded-lg transition-all"
            style={{
              background: selectedGrant === g.id ? "oklch(0.40 0.18 240 / 8%)" : "oklch(0.975 0.004 240)",
              border: `1px solid ${selectedGrant === g.id ? "oklch(0.40 0.18 240 / 30%)" : "oklch(0 0 0 / 8%)"}`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold" style={{ color: "oklch(0.22 0.018 250)" }}>{g.name}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "oklch(0.40 0.18 240 / 10%)", color: "oklch(0.40 0.18 240)" }}>{g.category}</span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>{g.agency}</div>
                <div className="text-[10px] mt-1 leading-relaxed" style={{ color: "oklch(0.42 0.012 250)" }}>{g.description}</div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-xs font-bold" style={{ color: "oklch(0.32 0.18 145)" }}>{fmtCurrency(g.maxAward)}</div>
                <div className="text-[9px]" style={{ color: "oklch(0.52 0.010 250)" }}>max · {g.match} match</div>
                <div className="text-[9px] mt-1" style={{ color: "oklch(0.52 0.010 250)" }}>Due: {g.deadline}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Form fields */}
      {grant && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0 0 0 / 10%)" }}>
          {/* Grant header */}
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: "oklch(0.22 0.018 250)", borderBottom: "1px solid oklch(1 0 0 / 10%)" }}>
            <div>
              <div className="text-xs font-bold" style={{ color: "oklch(0.95 0.005 250)" }}>{grant.name}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.65 0.010 250)" }}>{grant.agency}</div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={grant.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded"
                style={{ background: "oklch(1 0 0 / 10%)", color: "oklch(0.80 0.010 250)", border: "1px solid oklch(1 0 0 / 15%)" }}
              >
                <ExternalLink className="w-3 h-3" /> View Program
              </a>
              <button
                onClick={exportGrantPacket}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded font-bold"
                style={{ background: "oklch(0.32 0.18 145)", color: "oklch(0.95 0.005 145)", border: "1px solid oklch(0.32 0.18 145)" }}
              >
                <Download className="w-3 h-3" /> Export Packet
              </button>
            </div>
          </div>

          {/* Sections */}
          <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
            {grant.fields.map(section => {
              const fields = FORM_FIELDS[section] || [];
              const expanded = expandedSections.has(section);
              return (
                <div key={section}>
                  <button
                    onClick={() => toggleSection(section)}
                    className="w-full px-4 py-2.5 flex items-center justify-between"
                    style={{ background: "oklch(0.975 0.004 240)" }}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" style={{ color: "oklch(0.40 0.18 240)" }} />
                      <span className="text-xs font-semibold" style={{ color: "oklch(0.22 0.018 250)" }}>{SECTION_LABELS[section]}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "oklch(0.40 0.18 240 / 10%)", color: "oklch(0.40 0.18 240)" }}>
                        {fields.length} fields
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyAllSection(section); }}
                        className="text-[9px] px-2 py-0.5 rounded flex items-center gap-1"
                        style={{ background: "oklch(0.40 0.18 240 / 10%)", color: "oklch(0.40 0.18 240)", border: "1px solid oklch(0.40 0.18 240 / 20%)" }}
                      >
                        <Copy className="w-2.5 h-2.5" /> Copy All
                      </button>
                      {expanded ? <ChevronUp className="w-4 h-4" style={{ color: "oklch(0.52 0.010 250)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "oklch(0.52 0.010 250)" }} />}
                    </div>
                  </button>

                  {expanded && (
                    <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 5%)" }}>
                      {fields.map(f => {
                        const value = generateFieldValue(f.key);
                        const copied = copiedFields.has(f.key);
                        return (
                          <div
                            key={f.key}
                            className="px-4 py-2.5 flex items-start gap-3"
                            style={{ background: "oklch(1 0 0)" }}
                          >
                            <div className="w-44 flex-shrink-0">
                              <div className="text-[10px] font-semibold" style={{ color: "oklch(0.42 0.012 250)" }}>{f.label}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-[11px] font-mono px-2 py-1 rounded"
                                style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 7%)", color: "oklch(0.22 0.018 250)" }}
                              >
                                {value}
                              </div>
                            </div>
                            <button
                              onClick={() => copyField(f.key, value)}
                              className="flex-shrink-0 p-1.5 rounded transition-all"
                              style={{
                                background: copied ? "oklch(0.32 0.18 145 / 10%)" : "oklch(0.965 0.005 240)",
                                border: `1px solid ${copied ? "oklch(0.32 0.18 145 / 30%)" : "oklch(0 0 0 / 8%)"}`,
                                color: copied ? "oklch(0.32 0.18 145)" : "oklch(0.52 0.010 250)",
                              }}
                            >
                              {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
