/**
 * StaffDirectory — West Liberty, IA Staff Directory
 * Department contacts, roles, certifications, and direct dispatch links.
 * Design: Civic Intelligence Light — white cards, institutional blue accents, DM Sans body
 */
import { useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Users, Search, Phone, Mail, Shield, Wrench, Droplets,
  Trees, HardHat, Building2, BarChart3, ChevronRight,
  MapPin, Clock, CheckCircle2, AlertTriangle, Zap
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  title: string;
  department: string;
  deptColor: string;
  phone: string;
  email: string;
  certifications: string[];
  status: "on-duty" | "off-duty" | "on-call" | "leave";
  dispatchHref?: string;
  location?: string;
  yearsService?: number;
}

const STAFF: StaffMember[] = [
  // Administration
  {
    id: "s-001", name: "Matt Muckler", title: "City Administrator", department: "Administration",
    deptColor: "oklch(0.45 0.20 240)",
    phone: "(319) 627-2418", email: "mmuckler@westlibertyia.gov",
    certifications: ["ICMA-CM", "Iowa City Management"],
    status: "on-duty", location: "City Hall — 111 W 7th St",
    yearsService: 12,
  },
  {
    id: "s-002", name: "Linda Dykstra", title: "City Clerk", department: "Administration",
    deptColor: "oklch(0.45 0.20 240)",
    phone: "(319) 627-2418 x101", email: "ldykstra@westlibertyia.gov",
    certifications: ["Iowa Certified Municipal Clerk"],
    status: "on-duty", location: "City Hall — 111 W 7th St",
    yearsService: 8,
  },
  {
    id: "s-003", name: "Sarah Hernandez", title: "Finance Director", department: "Finance",
    deptColor: "oklch(0.45 0.18 145)",
    phone: "(319) 627-2418 x102", email: "shernandez@westlibertyia.gov",
    certifications: ["CPA", "GFOA Certificate of Achievement"],
    status: "on-duty", location: "City Hall — 111 W 7th St",
    yearsService: 6,
  },
  // Police
  {
    id: "s-004", name: "Chief David Trull", title: "Chief of Police", department: "Police",
    deptColor: "oklch(0.35 0.18 260)",
    phone: "(319) 627-2622", email: "dtrull@westlibertyia.gov",
    certifications: ["Iowa Law Enforcement Academy", "ILEA Command Leadership"],
    status: "on-duty", location: "Police Dept — 115 E 3rd St",
    dispatchHref: "/le-hub", yearsService: 18,
  },
  {
    id: "s-005", name: "Sgt. Maria Gonzalez", title: "Patrol Sergeant", department: "Police",
    deptColor: "oklch(0.35 0.18 260)",
    phone: "(319) 627-2622 x201", email: "mgonzalez@westlibertyia.gov",
    certifications: ["ILEA", "Crisis Intervention", "Field Training Officer"],
    status: "on-duty", location: "Patrol — Zone 2",
    dispatchHref: "/le-hub", yearsService: 9,
  },
  {
    id: "s-006", name: "Officer James Carter", title: "Patrol Officer", department: "Police",
    deptColor: "oklch(0.35 0.18 260)",
    phone: "(319) 627-2622 x202", email: "jcarter@westlibertyia.gov",
    certifications: ["ILEA", "Accident Reconstruction"],
    status: "on-call", location: "Off-duty / On-call",
    dispatchHref: "/le-hub", yearsService: 4,
  },
  {
    id: "s-007", name: "Officer Ana Reyes", title: "Patrol Officer", department: "Police",
    deptColor: "oklch(0.35 0.18 260)",
    phone: "(319) 627-2622 x203", email: "areyes@westlibertyia.gov",
    certifications: ["ILEA", "Bilingual (Spanish/English)"],
    status: "on-duty", location: "Patrol — Zone 1",
    dispatchHref: "/le-hub", yearsService: 3,
  },
  // Public Works
  {
    id: "s-008", name: "Tom Wilson", title: "Public Works Director", department: "Public Works",
    deptColor: "oklch(0.50 0.18 55)",
    phone: "(319) 627-2418 x301", email: "twilson@westlibertyia.gov",
    certifications: ["Iowa Licensed Engineer", "APWA Certified Public Works Manager"],
    status: "on-duty", location: "Public Works — 200 Industrial Dr",
    dispatchHref: "/operations", yearsService: 14,
  },
  {
    id: "s-009", name: "Jose Martinez", title: "Water/Sewer Operator", department: "Public Works",
    deptColor: "oklch(0.50 0.18 55)",
    phone: "(319) 627-2418 x302", email: "jmartinez@westlibertyia.gov",
    certifications: ["Iowa Grade 3 Water", "Iowa Grade 2 Wastewater"],
    status: "on-duty", location: "Active — Calhoun St Water Main",
    dispatchHref: "/operations", yearsService: 7,
  },
  {
    id: "s-010", name: "Rachel Chen", title: "Utilities Technician", department: "Public Works",
    deptColor: "oklch(0.50 0.18 55)",
    phone: "(319) 627-2418 x303", email: "rchen@westlibertyia.gov",
    certifications: ["Iowa Grade 2 Water", "SCADA Operations"],
    status: "on-duty", location: "Lift Station — Industrial Dr",
    dispatchHref: "/utilities", yearsService: 5,
  },
  {
    id: "s-011", name: "Derek Johnson", title: "Street Maintenance Lead", department: "Public Works",
    deptColor: "oklch(0.50 0.18 55)",
    phone: "(319) 627-2418 x304", email: "djohnson@westlibertyia.gov",
    certifications: ["Iowa CDL Class A", "APWA Road Scholar"],
    status: "on-duty", location: "Active — Elm St Pothole Repair",
    dispatchHref: "/operations", yearsService: 11,
  },
  // Parks & Recreation
  {
    id: "s-012", name: "Kim Nakamura", title: "Parks & Recreation Director", department: "Parks & Rec",
    deptColor: "oklch(0.42 0.18 145)",
    phone: "(319) 627-2418 x401", email: "knakamura@westlibertyia.gov",
    certifications: ["CPRP (Certified Park & Rec Professional)", "Iowa Recreation"],
    status: "on-duty", location: "Community Center — 405 W 3rd St",
    dispatchHref: "/parks", yearsService: 9,
  },
  {
    id: "s-013", name: "Luis Ramirez", title: "Parks Maintenance Technician", department: "Parks & Rec",
    deptColor: "oklch(0.42 0.18 145)",
    phone: "(319) 627-2418 x402", email: "lramirez@westlibertyia.gov",
    certifications: ["Iowa Pesticide Applicator", "Irrigation Technician"],
    status: "on-duty", location: "Wildcat Park",
    dispatchHref: "/parks", yearsService: 6,
  },
  // Community Development
  {
    id: "s-014", name: "Patricia Ochoa", title: "Community Development Director", department: "Community Dev",
    deptColor: "oklch(0.50 0.22 25)",
    phone: "(319) 627-2418 x501", email: "pochoa@westlibertyia.gov",
    certifications: ["AICP (American Institute of Certified Planners)", "Iowa Zoning"],
    status: "on-duty", location: "City Hall — 111 W 7th St",
    dispatchHref: "/community-dev", yearsService: 5,
  },
  {
    id: "s-015", name: "Ben Foster", title: "Building Inspector", department: "Community Dev",
    deptColor: "oklch(0.50 0.22 25)",
    phone: "(319) 627-2418 x502", email: "bfoster@westlibertyia.gov",
    certifications: ["ICC Certified Building Inspector", "Iowa Building Code"],
    status: "on-duty", location: "Field — 218 E 3rd St Inspection",
    dispatchHref: "/community-dev", yearsService: 8,
  },
  // Library
  {
    id: "s-016", name: "Susan Park", title: "Library Director", department: "Library",
    deptColor: "oklch(0.48 0.18 300)",
    phone: "(319) 627-4540", email: "spark@westlibertyia.gov",
    certifications: ["MLS — University of Iowa", "Iowa Library Association"],
    status: "on-duty", location: "West Liberty Public Library — 400 N Calhoun St",
    yearsService: 15,
  },
];

const DEPARTMENTS = ["All", "Administration", "Finance", "Police", "Public Works", "Parks & Rec", "Community Dev", "Library"];

const STATUS_CONFIG = {
  "on-duty":  { label: "On Duty",  color: "oklch(0.42 0.18 145)", bg: "oklch(0.42 0.18 145 / 12%)" },
  "off-duty": { label: "Off Duty", color: "oklch(0.60 0.010 250)", bg: "oklch(0.60 0.010 250 / 10%)" },
  "on-call":  { label: "On Call",  color: "oklch(0.55 0.20 55)",  bg: "oklch(0.55 0.20 55 / 12%)" },
  "leave":    { label: "On Leave", color: "oklch(0.50 0.22 25)",  bg: "oklch(0.50 0.22 25 / 10%)" },
};

const DEPT_ICONS: Record<string, typeof Users> = {
  "Administration": Building2, "Finance": BarChart3, "Police": Shield,
  "Public Works": Wrench, "Parks & Rec": Trees, "Community Dev": HardHat,
  "Library": Users,
};

export default function StaffDirectory() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const filtered = STAFF.filter(s => {
    const matchesDept = dept === "All" || s.department === dept;
    const q = search.toLowerCase();
    const matchesSearch = !q || s.name.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) || s.department.toLowerCase().includes(q) ||
      s.certifications.some(c => c.toLowerCase().includes(q));
    return matchesDept && matchesSearch;
  });

  const onDutyCount = STAFF.filter(s => s.status === "on-duty").length;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: "oklch(0.45 0.20 240 / 12%)" }}>
                <Users className="w-4 h-4" style={{ color: "oklch(0.40 0.18 240)" }} />
              </div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                Staff Directory
              </h1>
            </div>
            <p className="text-sm" style={{ color: "oklch(0.50 0.010 250)" }}>
              City of West Liberty, IA — {STAFF.length} staff members · {onDutyCount} on duty
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.42 0.18 145)" }}>
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium">{onDutyCount} on duty now</span>
          </div>
        </div>

        {/* Search & filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[200px]"
            style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 8%)" }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.55 0.010 250)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, title, certification…"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--foreground)", fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {DEPARTMENTS.map(d => (
              <button
                key={d}
                onClick={() => setDept(d)}
                className="px-3 py-1.5 rounded text-[12px] font-medium transition-all"
                style={{
                  background: dept === d ? "oklch(0.45 0.20 240)" : "oklch(0.975 0.004 240)",
                  color: dept === d ? "white" : "oklch(0.45 0.014 250)",
                  border: "1px solid oklch(0 0 0 / 8%)",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Staff cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(staff => {
              const status = STATUS_CONFIG[staff.status];
              const DeptIcon = DEPT_ICONS[staff.department] || Users;
              const isSelected = selectedStaff?.id === staff.id;
              return (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaff(isSelected ? null : staff)}
                  className="text-left p-4 rounded-xl transition-all"
                  style={{
                    background: isSelected ? "oklch(0.45 0.20 240 / 8%)" : "oklch(1 0 0)",
                    border: isSelected
                      ? "1px solid oklch(0.45 0.20 240 / 40%)"
                      : "1px solid oklch(0 0 0 / 8%)",
                    boxShadow: isSelected ? "0 0 0 2px oklch(0.45 0.20 240 / 20%)" : "0 1px 4px oklch(0 0 0 / 6%)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ background: `${staff.deptColor}18`, color: staff.deptColor, fontFamily: "'Syne', sans-serif" }}
                    >
                      {staff.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-semibold truncate" style={{ color: "oklch(0.18 0.018 250)", fontFamily: "'Syne', sans-serif" }}>
                          {staff.name}
                        </span>
                      </div>
                      <div className="text-[11px] mb-1.5 truncate" style={{ color: "oklch(0.50 0.010 250)" }}>
                        {staff.title}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{ background: `${staff.deptColor}15`, color: staff.deptColor }}
                        >
                          <DeptIcon className="w-2.5 h-2.5" />
                          {staff.department}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{ background: status.bg, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 flex-shrink-0 mt-1 transition-transform"
                      style={{ color: "oklch(0.65 0.010 250)", transform: isSelected ? "rotate(90deg)" : "none" }}
                    />
                  </div>

                  {/* Location */}
                  {staff.location && (
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
                      <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "oklch(0.60 0.010 250)" }} />
                      <span className="text-[11px] truncate" style={{ color: "oklch(0.55 0.010 250)" }}>{staff.location}</span>
                    </div>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-2 py-12 text-center" style={{ color: "oklch(0.60 0.010 250)" }}>
                No staff found matching your search.
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-1">
            {selectedStaff ? (
              <div
                className="rounded-xl p-5 sticky top-20"
                style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 8%)", boxShadow: "0 2px 12px oklch(0 0 0 / 8%)" }}
              >
                {/* Avatar & name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                    style={{ background: `${selectedStaff.deptColor}18`, color: selectedStaff.deptColor, fontFamily: "'Syne', sans-serif" }}
                  >
                    {selectedStaff.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-base" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                      {selectedStaff.name}
                    </div>
                    <div className="text-[12px]" style={{ color: "oklch(0.50 0.010 250)" }}>{selectedStaff.title}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: STATUS_CONFIG[selectedStaff.status].bg, color: STATUS_CONFIG[selectedStaff.status].color }}
                      >
                        {STATUS_CONFIG[selectedStaff.status].label}
                      </span>
                      {selectedStaff.yearsService && (
                        <span className="text-[10px]" style={{ color: "oklch(0.60 0.010 250)" }}>
                          {selectedStaff.yearsService} yrs service
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-2 mb-4">
                  <a
                    href={`tel:${selectedStaff.phone}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg transition-all no-underline"
                    style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 6%)" }}
                  >
                    <Phone className="w-3.5 h-3.5" style={{ color: "oklch(0.45 0.20 240)" }} />
                    <span className="text-[13px]" style={{ color: "oklch(0.30 0.014 250)" }}>{selectedStaff.phone}</span>
                  </a>
                  <a
                    href={`mailto:${selectedStaff.email}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg transition-all no-underline"
                    style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 6%)" }}
                  >
                    <Mail className="w-3.5 h-3.5" style={{ color: "oklch(0.45 0.20 240)" }} />
                    <span className="text-[12px] truncate" style={{ color: "oklch(0.30 0.014 250)" }}>{selectedStaff.email}</span>
                  </a>
                  {selectedStaff.location && (
                    <div
                      className="flex items-center gap-2.5 p-2.5 rounded-lg"
                      style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 6%)" }}
                    >
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.45 0.20 240)" }} />
                      <span className="text-[12px]" style={{ color: "oklch(0.40 0.010 250)" }}>{selectedStaff.location}</span>
                    </div>
                  )}
                </div>

                {/* Certifications */}
                <div className="mb-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.60 0.010 250)" }}>
                    Certifications
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStaff.certifications.map(cert => (
                      <span
                        key={cert}
                        className="px-2 py-1 rounded text-[10px] font-medium"
                        style={{ background: `${selectedStaff.deptColor}12`, color: selectedStaff.deptColor, border: `1px solid ${selectedStaff.deptColor}25` }}
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {selectedStaff.dispatchHref && (
                    <Link
                      href={selectedStaff.dispatchHref}
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-[13px] font-medium no-underline transition-all"
                      style={{ background: "oklch(0.45 0.20 240)", color: "white" }}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Dispatch / View Hub
                    </Link>
                  )}
                  <a
                    href={`tel:${selectedStaff.phone}`}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-[13px] font-medium no-underline transition-all"
                    style={{ background: "oklch(0.42 0.18 145 / 10%)", color: "oklch(0.32 0.18 145)", border: "1px solid oklch(0.42 0.18 145 / 25%)" }}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Now
                  </a>
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl p-8 text-center sticky top-20"
                style={{ background: "oklch(0.975 0.004 240)", border: "1px dashed oklch(0 0 0 / 12%)" }}
              >
                <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "oklch(0.70 0.010 250)" }} />
                <div className="text-sm font-medium mb-1" style={{ color: "oklch(0.45 0.010 250)" }}>Select a staff member</div>
                <div className="text-[12px]" style={{ color: "oklch(0.60 0.010 250)" }}>
                  Click any card to view contact details, certifications, and dispatch options.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Department summary */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {DEPARTMENTS.filter(d => d !== "All").map(d => {
            const deptStaff = STAFF.filter(s => s.department === d);
            const onDuty = deptStaff.filter(s => s.status === "on-duty").length;
            const DeptIcon = DEPT_ICONS[d] || Users;
            const color = deptStaff[0]?.deptColor || "oklch(0.45 0.20 240)";
            return (
              <button
                key={d}
                onClick={() => setDept(d === dept ? "All" : d)}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  background: dept === d ? `${color}12` : "oklch(1 0 0)",
                  border: dept === d ? `1px solid ${color}35` : "1px solid oklch(0 0 0 / 8%)",
                }}
              >
                <DeptIcon className="w-4 h-4 mb-2" style={{ color }} />
                <div className="text-[11px] font-semibold leading-tight mb-1" style={{ color: "oklch(0.25 0.014 250)" }}>{d}</div>
                <div className="text-[10px]" style={{ color: "oklch(0.55 0.010 250)" }}>
                  {deptStaff.length} staff · {onDuty} on duty
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
