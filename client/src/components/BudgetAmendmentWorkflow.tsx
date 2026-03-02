/**
 * BudgetAmendmentWorkflow — Budget amendment request and approval routing
 * Used inside CommunityDevHub to close the loop on the FY2024 115% overrun audit finding.
 */
import { useState } from "react";
import {
  CheckCircle2, Clock, DollarSign, Users, Pencil, Plus, Send, GitBranch
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const statusColor: Record<string, string> = {
  active: "oklch(0.45 0.18 145)",
  completed: "oklch(0.50 0.010 250)",
  "pending-award": "oklch(0.65 0.20 55)",
  approved: "oklch(0.45 0.18 145)",
  "under-review": "oklch(0.45 0.20 240)",
  pending: "oklch(0.65 0.20 55)",
  denied: "oklch(0.55 0.22 25)",
};

function StatusBadge({ status }: { status: string }) {
  const color = statusColor[status] ?? "oklch(0.50 0.010 250)";
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {status.replace(/-/g, " ")}
    </span>
  );
}

const AMENDMENT_STEPS = [
  { id: 1, label: "Director Submits",     role: "Community Dev Director", icon: Pencil },
  { id: 2, label: "Finance Review",       role: "Finance Director",       icon: DollarSign },
  { id: 3, label: "City Administrator",   role: "City Administrator",     icon: Users },
  { id: 4, label: "City Council Vote",    role: "City Council",           icon: CheckCircle2 },
];

const EXISTING_AMENDMENTS = [
  {
    id: "BA-2024-001",
    title: "Community Development FY2024 Supplemental Appropriation",
    amount: 187100,
    justification:
      "Unanticipated TIF district legal fees ($62,400), CDBG grant match requirement ($58,700), and accelerated downtown façade program ($66,000) drove expenditures 36.7% above the approved FY2024 appropriation of $510,000. This amendment formalizes the supplemental appropriation in accordance with Iowa Code § 384.18.",
    submittedBy: "Patricia Ochoa",
    submittedDate: "2024-07-15",
    currentStep: 3,
    status: "under-review" as const,
    approvals: [
      { step: 1, approver: "Patricia Ochoa",    date: "2024-07-15", note: "Submitted with supporting invoices" },
      { step: 2, approver: "Sarah Hernandez",   date: "2024-07-18", note: "Verified against GL — confirmed $187,100 variance" },
    ],
  },
];

export default function BudgetAmendmentWorkflow() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", category: "", justification: "", attachments: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Existing amendment */}
      {EXISTING_AMENDMENTS.map(amend => (
        <div key={amend.id} className="rounded-xl border overflow-hidden" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
          {/* Header */}
          <div className="p-4 border-b flex items-start justify-between gap-4 flex-wrap" style={{ borderColor: "oklch(0 0 0 / 8%)", background: "oklch(0.55 0.22 25 / 6%)" }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono" style={{ color: "oklch(0.55 0.22 25)" }}>{amend.id}</span>
                <StatusBadge status={amend.status} />
              </div>
              <div className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>{amend.title}</div>
              <div className="text-[12px] mt-0.5" style={{ color: "oklch(0.50 0.010 250)" }}>Submitted by {amend.submittedBy} · {amend.submittedDate}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.55 0.22 25)" }}>{fmt(amend.amount)}</div>
              <div className="text-[11px]" style={{ color: "oklch(0.60 0.010 250)" }}>Supplemental request</div>
            </div>
          </div>

          {/* Approval pipeline */}
          <div className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "oklch(0.60 0.010 250)" }}>Approval Routing</div>
            <div className="flex items-center gap-0 mb-4 overflow-x-auto pb-2">
              {AMENDMENT_STEPS.map((step, i) => {
                const isComplete = step.id < amend.currentStep;
                const isCurrent = step.id === amend.currentStep;
                const StepIcon = step.icon;
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center min-w-[90px]">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center mb-1.5"
                        style={{
                          background: isComplete ? "oklch(0.42 0.18 145)" : isCurrent ? "oklch(0.55 0.22 25)" : "oklch(0.93 0.004 250)",
                          border: isCurrent ? "2px solid oklch(0.55 0.22 25)" : "2px solid transparent",
                          boxShadow: isCurrent ? "0 0 0 3px oklch(0.55 0.22 25 / 20%)" : "none",
                        }}
                      >
                        <StepIcon className="w-4 h-4" style={{ color: isComplete || isCurrent ? "white" : "oklch(0.60 0.010 250)" }} />
                      </div>
                      <div className="text-[10px] font-medium text-center leading-tight" style={{ color: isCurrent ? "oklch(0.55 0.22 25)" : isComplete ? "oklch(0.42 0.18 145)" : "oklch(0.60 0.010 250)" }}>
                        {step.label}
                      </div>
                      <div className="text-[9px] text-center" style={{ color: "oklch(0.65 0.010 250)" }}>{step.role}</div>
                    </div>
                    {i < AMENDMENT_STEPS.length - 1 && (
                      <div className="h-0.5 w-6 mx-1 flex-shrink-0" style={{ background: isComplete ? "oklch(0.42 0.18 145)" : "oklch(0.88 0.004 250)" }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Justification */}
            <div className="p-3 rounded-lg mb-3" style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 6%)" }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.60 0.010 250)" }}>Justification</div>
              <p className="text-[12px] leading-relaxed" style={{ color: "oklch(0.35 0.014 250)" }}>{amend.justification}</p>
            </div>

            {/* Approval log */}
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "oklch(0.60 0.010 250)" }}>Approval Log</div>
              {amend.approvals.map(a => (
                <div key={a.step} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: "oklch(0.42 0.18 145 / 8%)", border: "1px solid oklch(0.42 0.18 145 / 20%)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.42 0.18 145)" }} />
                  <div>
                    <div className="text-[12px] font-medium" style={{ color: "oklch(0.25 0.014 250)" }}>
                      {a.approver} · <span className="font-normal" style={{ color: "oklch(0.55 0.010 250)" }}>{a.date}</span>
                    </div>
                    <div className="text-[11px]" style={{ color: "oklch(0.50 0.010 250)" }}>{a.note}</div>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: "oklch(0.55 0.22 25 / 8%)", border: "1px solid oklch(0.55 0.22 25 / 20%)" }}>
                <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.55 0.22 25)" }} />
                <div>
                  <div className="text-[12px] font-medium" style={{ color: "oklch(0.25 0.014 250)" }}>Matt Muckler (City Administrator) · Awaiting review</div>
                  <div className="text-[11px]" style={{ color: "oklch(0.50 0.010 250)" }}>Pending approval — Step 3 of 4</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Success state */}
      {submitted && (
        <div className="rounded-xl p-5 text-center" style={{ background: "oklch(0.42 0.18 145 / 8%)", border: "1px solid oklch(0.42 0.18 145 / 25%)" }}>
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: "oklch(0.42 0.18 145)" }} />
          <div className="font-semibold mb-1" style={{ color: "oklch(0.25 0.014 250)" }}>Amendment Request Submitted</div>
          <div className="text-[12px]" style={{ color: "oklch(0.50 0.010 250)" }}>
            Your request has been routed to the Finance Director for review. You will be notified when each approval step is completed.
          </div>
        </div>
      )}

      {/* New amendment button */}
      {!showForm && !submitted && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{ background: "oklch(0.45 0.20 240 / 10%)", color: "oklch(0.38 0.18 240)", border: "1px solid oklch(0.45 0.20 240 / 25%)" }}
        >
          <Plus className="w-4 h-4" />
          Submit New Budget Amendment Request
        </button>
      )}

      {/* New amendment form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border p-5 space-y-4" style={{ background: "oklch(1 0 0)", borderColor: "oklch(0 0 0 / 8%)" }}>
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4" style={{ color: "oklch(0.45 0.20 240)" }} />
            <div className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>New Budget Amendment Request</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.55 0.010 250)" }}>Amendment Title *</label>
              <input
                required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. FY2025 Community Dev Supplemental Appropriation"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.55 0.010 250)" }}>Requested Amount ($) *</label>
              <input
                required type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 50000"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.55 0.010 250)" }}>Budget Category *</label>
              <select
                required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "var(--foreground)" }}
              >
                <option value="">Select category…</option>
                <option value="personnel">Personnel Services</option>
                <option value="operations">Operations & Maintenance</option>
                <option value="capital">Capital Outlay</option>
                <option value="legal">Legal & Professional</option>
                <option value="grants">Grant Match</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.55 0.010 250)" }}>Justification *</label>
              <textarea
                required rows={4} value={form.justification} onChange={e => setForm(f => ({ ...f, justification: e.target.value }))}
                placeholder="Describe the specific circumstances requiring this amendment, including supporting events, contracts, or mandates…"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "var(--foreground)" }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(0.55 0.010 250)" }}>Supporting Documents</label>
              <input
                value={form.attachments} onChange={e => setForm(f => ({ ...f, attachments: e.target.value }))}
                placeholder="List document names or reference numbers (e.g. Invoice #2024-0892, Contract #CD-44)"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 10%)", color: "var(--foreground)" }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "oklch(0.45 0.20 240)", color: "white" }}
            >
              <Send className="w-3.5 h-3.5" />
              Submit for Approval
            </button>
            <button
              type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ color: "oklch(0.55 0.010 250)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
