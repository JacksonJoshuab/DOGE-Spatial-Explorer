/**
 * Records Management — Civic Intelligence Dark
 * Dual-control: blockchain audit trail + IoT physical location monitoring
 * Iowa Code Chapter 22 compliant
 */
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { FileText, Lock, Thermometer, Wifi, CheckCircle2, AlertTriangle, Clock, Download, Eye, Shield } from "lucide-react";
import { toast } from "sonner";

const RECORDS = [
  { id: "REC-2024-001", title: "FY2024 Annual Financial Report", dept: "Finance", classification: "Public", size: "4.2 MB", created: "2024-11-15", accessed: "2025-02-28", location: "City Hall Node", hash: "sha256:a3f8c2d1...", status: "Active", retention: "Permanent" },
  { id: "REC-2024-002", title: "Water Main Replacement Contract — Phase 1", dept: "Public Works", classification: "Public", size: "12.8 MB", created: "2024-03-22", accessed: "2025-01-14", location: "Public Works Node", hash: "sha256:b7e4a9f2...", status: "Active", retention: "10 years" },
  { id: "REC-2024-003", title: "TIF District #3 Increment Calculation", dept: "Finance", classification: "Confidential", size: "1.1 MB", created: "2024-07-01", accessed: "2025-02-15", location: "City Hall Node", hash: "sha256:c2d5b8e1...", status: "Active", retention: "Permanent" },
  { id: "REC-2024-004", title: "Police Department Use of Force Reports", dept: "Police", classification: "Restricted", size: "8.7 MB", created: "2024-01-01", accessed: "2025-02-20", location: "Police Station Node", hash: "sha256:d9f1c4a7...", status: "Active", retention: "7 years" },
  { id: "REC-2024-005", title: "Community Development Grant Applications", dept: "Community Dev", classification: "Public", size: "22.4 MB", created: "2024-05-15", accessed: "2025-02-10", location: "City Hall Node", hash: "sha256:e6b3d2c8...", status: "Active", retention: "5 years" },
  { id: "REC-2024-006", title: "Personnel Files — FY2024 Evaluations", dept: "HR", classification: "Restricted", size: "5.3 MB", created: "2024-12-31", accessed: "2025-01-08", location: "City Hall Node", hash: "sha256:f4a7e1b9...", status: "Active", retention: "Permanent" },
  { id: "REC-2024-007", title: "Parks Master Plan 2025–2035", dept: "Parks & Rec", classification: "Public", size: "18.6 MB", created: "2024-09-30", accessed: "2025-02-25", location: "City Hall Node", hash: "sha256:g8c2f5d3...", status: "Active", retention: "Permanent" },
  { id: "REC-2024-008", title: "Wastewater NPDES Permit Compliance", dept: "Utilities", classification: "Public", size: "3.9 MB", created: "2024-04-01", accessed: "2025-02-18", location: "Public Works Node", hash: "sha256:h1e9b4a6...", status: "Active", retention: "10 years" },
];

const AUDIT_LOG = [
  { timestamp: "2025-03-01 14:23:11", user: "M. Muckler", action: "VIEW", record: "FY2024 Annual Financial Report", ip: "192.168.1.45", hash: "sha256:a3f8c2d1..." },
  { timestamp: "2025-03-01 11:07:44", user: "J. Smith (Finance)", action: "DOWNLOAD", record: "TIF District #3 Increment Calculation", ip: "192.168.1.62", hash: "sha256:c2d5b8e1..." },
  { timestamp: "2025-02-28 16:42:09", user: "Chief R. Davis", action: "VIEW", record: "Police Department Use of Force Reports", ip: "192.168.2.11", hash: "sha256:d9f1c4a7..." },
  { timestamp: "2025-02-28 09:15:33", user: "System (Backup)", action: "BACKUP", record: "All Records", ip: "10.0.0.1", hash: "sha256:multi..." },
  { timestamp: "2025-02-27 13:58:22", user: "K. Johnson (HR)", action: "EDIT", record: "Personnel Files — FY2024 Evaluations", ip: "192.168.1.78", hash: "sha256:f4a7e1b9..." },
];

const PHYSICAL_LOCATIONS = [
  { id: "LOC-001", name: "City Hall Records Room", node: "NODE-WL-01", temp: 68.2, humidity: 45.1, lastAccess: "2025-03-01 14:23", status: "normal", items: 847 },
  { id: "LOC-002", name: "Police Station Vault", node: "NODE-WL-06", temp: 67.8, humidity: 43.8, lastAccess: "2025-02-28 16:42", status: "normal", items: 312 },
  { id: "LOC-003", name: "Public Works Archive", node: "NODE-WL-02", temp: 71.4, humidity: 52.3, lastAccess: "2025-02-25 09:11", status: "warning", items: 1204 },
  { id: "LOC-004", name: "Finance Department Safe", node: "NODE-WL-01", temp: 68.0, humidity: 44.9, lastAccess: "2025-03-01 11:07", status: "normal", items: 156 },
];

const RETENTION_SCHEDULE = [
  { category: "Financial Records", retention: "Permanent", authority: "Iowa Code §372.13", count: 234 },
  { category: "Personnel Files", retention: "Permanent", authority: "Iowa Code §70A.9", count: 89 },
  { category: "Meeting Minutes", retention: "Permanent", authority: "Iowa Code §21.3", count: 412 },
  { category: "Contracts", retention: "10 years", authority: "Iowa Code §384.24", count: 167 },
  { category: "Police Reports", retention: "7 years", authority: "Iowa Code §22.7", count: 1847 },
  { category: "Building Permits", retention: "5 years", authority: "Iowa Code §331.604", count: 523 },
  { category: "Correspondence", retention: "3 years", authority: "Iowa Code §22.1", count: 2341 },
];

export default function RecordsManagement() {
  const [activeTab, setActiveTab] = useState<"digital" | "physical" | "retention">("digital");
  const [search, setSearch] = useState("");

  const filtered = RECORDS.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.dept.toLowerCase().includes(search.toLowerCase())
  );

  const handleAccess = (record: typeof RECORDS[0]) => {
    toast.success(`Access logged for "${record.title}" — blockchain hash recorded`);
  };

  return (
    <DashboardLayout title="Records Management">
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Records", value: "7,175", color: "oklch(0.40 0.18 240)" },
            { label: "Blockchain Verified", value: "100%", color: "oklch(0.45 0.18 145)" },
            { label: "Physical Locations", value: "4", color: "oklch(0.55 0.18 75)" },
            { label: "Pending Destruction", value: "23", color: "oklch(0.55 0.18 75)" },
          ].map((s) => (
            <div key={s.label} className="data-card">
              <div className="metric-value text-2xl" style={{ color: s.color }}>{s.value}</div>
              <div className="section-label mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Blockchain integrity banner */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: "oklch(0.65 0.18 145 / 10%)", border: "1px solid oklch(0.65 0.18 145 / 25%)" }}>
          <Shield className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.45 0.18 145)" }} />
          <span className="text-sm" style={{ color: "oklch(0.42 0.18 145)" }}>
            <strong>Blockchain Integrity:</strong> All 7,175 records cryptographically anchored. Last verification: 2025-03-01 00:00:00 UTC. Chain intact — 0 tampering events detected.
          </span>
          <span className="badge-success ml-auto flex-shrink-0">VERIFIED</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
          {[
            { id: "digital", label: "Digital Records & Audit Log" },
            { id: "physical", label: "Physical Location Monitoring" },
            { id: "retention", label: "Retention Schedule" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-all"
              style={{
                borderColor: activeTab === tab.id ? "oklch(0.45 0.20 240)" : "transparent",
                color: activeTab === tab.id ? "oklch(0.40 0.18 240)" : "oklch(0.48 0.012 250)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Digital records tab */}
        {activeTab === "digital" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-3 py-2 rounded text-sm"
                style={{ background: "oklch(1 0 0)", border: "1px solid oklch(1 0 0 / 12%)", color: "oklch(0.25 0.018 250)", outline: "none" }}
              />
            </div>

            {/* Records table */}
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid oklch(0 0 0 / 8%)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "oklch(1 0 0)", borderBottom: "1px solid oklch(0 0 0 / 8%)" }}>
                      {["Record ID", "Title", "Department", "Classification", "Location", "Blockchain Hash", "Retention", "Actions"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left section-label">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((rec) => (
                      <tr key={rec.id} className="border-b" style={{ background: "oklch(0.985 0.003 240)", borderColor: "oklch(0 0 0 / 6%)" }}>
                        <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: "oklch(0.45 0.012 250)" }}>{rec.id}</td>
                        <td className="px-3 py-2.5 max-w-[200px]">
                          <div className="truncate font-medium" style={{ color: "oklch(0.22 0.018 250)" }}>{rec.title}</div>
                          <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.48 0.012 250)" }}>{rec.size} · {rec.created}</div>
                        </td>
                        <td className="px-3 py-2.5" style={{ color: "oklch(0.60 0.010 250)" }}>{rec.dept}</td>
                        <td className="px-3 py-2.5">
                          <span className={`badge-${rec.classification === "Restricted" ? "critical" : rec.classification === "Confidential" ? "warning" : "info"}`}>
                            {rec.classification}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[10px]" style={{ color: "oklch(0.48 0.012 250)" }}>{rec.location}</td>
                        <td className="px-3 py-2.5 font-mono text-[9px]" style={{ color: "oklch(0.52 0.010 250)" }}>{rec.hash}</td>
                        <td className="px-3 py-2.5 text-[10px]" style={{ color: "oklch(0.48 0.012 250)" }}>{rec.retention}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1">
                            <button onClick={() => handleAccess(rec)} className="p-1 rounded" style={{ background: "oklch(0.45 0.20 240 / 12%)", color: "oklch(0.40 0.18 240)" }}>
                              <Eye className="w-3 h-3" />
                            </button>
                            <button onClick={() => toast.info("Download logged to blockchain")} className="p-1 rounded" style={{ background: "oklch(0 0 0 / 8%)", color: "oklch(0.45 0.012 250)" }}>
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit log */}
            <div>
              <div className="section-label mb-3">Blockchain Audit Log — Recent Events</div>
              <div className="space-y-1.5">
                {AUDIT_LOG.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 6%)" }}>
                    <span className="text-[9px] font-mono w-36 flex-shrink-0" style={{ color: "oklch(0.48 0.012 250)" }}>{log.timestamp}</span>
                    <span
                      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded w-20 text-center flex-shrink-0"
                      style={{
                        background: log.action === "EDIT" ? "oklch(0.55 0.18 75 / 12%)" : log.action === "DOWNLOAD" ? "oklch(0.45 0.20 240 / 12%)" : "oklch(0.45 0.18 145 / 12%)",
                        color: log.action === "EDIT" ? "oklch(0.50 0.18 75)" : log.action === "DOWNLOAD" ? "oklch(0.40 0.18 240)" : "oklch(0.42 0.18 145)",
                      }}
                    >
                      {log.action}
                    </span>
                    <span className="text-xs flex-1 truncate" style={{ color: "oklch(0.65 0.010 250)" }}>{log.record}</span>
                    <span className="text-[10px]" style={{ color: "oklch(0.48 0.012 250)" }}>{log.user}</span>
                    <span className="text-[9px] font-mono" style={{ color: "oklch(0.48 0.012 250)" }}>{log.ip}</span>
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "oklch(0.45 0.18 145)" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Physical locations tab */}
        {activeTab === "physical" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PHYSICAL_LOCATIONS.map((loc) => (
                <div key={loc.id} className="p-4 rounded-lg" style={{ background: "oklch(1 0 0)", border: `1px solid ${loc.status === "warning" ? "oklch(0.75 0.18 75 / 30%)" : "oklch(0 0 0 / 8%)"}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>{loc.name}</div>
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>{loc.node} · {loc.items} items</div>
                    </div>
                    <span className={`status-dot ${loc.status === "warning" ? "amber" : "green"}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded" style={{ background: "oklch(0.965 0.005 240)" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Thermometer className="w-3 h-3" style={{ color: "oklch(0.40 0.18 240)" }} />
                        <span className="section-label">Temperature</span>
                      </div>
                      <div className="metric-value text-lg" style={{ color: loc.temp > 72 ? "oklch(0.55 0.18 75)" : "oklch(0.45 0.18 145)" }}>
                        {loc.temp}°F
                      </div>
                      <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.48 0.012 250)" }}>Target: 65–72°F</div>
                    </div>
                    <div className="p-2.5 rounded" style={{ background: "oklch(0.965 0.005 240)" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Wifi className="w-3 h-3" style={{ color: "oklch(0.40 0.18 240)" }} />
                        <span className="section-label">Humidity</span>
                      </div>
                      <div className="metric-value text-lg" style={{ color: loc.humidity > 50 ? "oklch(0.55 0.18 75)" : "oklch(0.45 0.18 145)" }}>
                        {loc.humidity}%
                      </div>
                      <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.48 0.012 250)" }}>Target: 30–50% RH</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px]" style={{ color: "oklch(0.52 0.010 250)" }}>
                    Last access: {loc.lastAccess}
                    {loc.status === "warning" && (
                      <span className="ml-2" style={{ color: "oklch(0.50 0.18 75)" }}>⚠ Humidity above target</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retention schedule tab */}
        {activeTab === "retention" && (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid oklch(0 0 0 / 8%)" }}>
            <div className="px-4 py-3 border-b" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.018 250)" }}>Iowa Code Retention Schedule</div>
              <div className="text-xs mt-0.5" style={{ color: "oklch(0.48 0.012 250)" }}>Chapter 22 Open Records compliance</div>
            </div>
            {RETENTION_SCHEDULE.map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0" style={{ background: "oklch(0.985 0.003 240)", borderColor: "oklch(0 0 0 / 6%)" }}>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: "oklch(0.22 0.018 250)" }}>{item.category}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>{item.authority}</div>
                </div>
                <div className="text-sm font-mono font-semibold" style={{ color: item.retention === "Permanent" ? "oklch(0.45 0.18 145)" : "oklch(0.40 0.18 240)" }}>
                  {item.retention}
                </div>
                <div className="text-sm font-mono" style={{ color: "oklch(0.45 0.012 250)" }}>
                  {item.count.toLocaleString()} records
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
