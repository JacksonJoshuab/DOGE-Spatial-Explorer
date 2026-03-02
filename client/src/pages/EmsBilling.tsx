/**
 * EMS Billing Dashboard — West Liberty, IA
 * Insurance claim submission, Medicare/Medicaid billing, revenue analytics
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, FileText, Clock, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Plus, TrendingUp, ChevronRight, Building2, Shield
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-gray-400", bg: "bg-gray-600" },
  submitted: { label: "Submitted", color: "text-blue-400", bg: "bg-blue-600" },
  pending: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-600" },
  approved: { label: "Approved", color: "text-green-400", bg: "bg-green-600" },
  denied: { label: "Denied", color: "text-red-400", bg: "bg-red-600" },
  appealed: { label: "Appealed", color: "text-purple-400", bg: "bg-purple-600" },
  paid: { label: "Paid", color: "text-emerald-400", bg: "bg-emerald-600" },
  written_off: { label: "Written Off", color: "text-gray-400", bg: "bg-gray-500" },
};

const BILLING_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  insurance: { label: "Private Insurance", icon: Shield, color: "text-blue-400" },
  medicare: { label: "Medicare", icon: Building2, color: "text-red-400" },
  medicaid: { label: "Medicaid", icon: Building2, color: "text-orange-400" },
  self_pay: { label: "Self Pay", icon: DollarSign, color: "text-green-400" },
  government: { label: "Government", icon: Building2, color: "text-purple-400" },
  workers_comp: { label: "Workers Comp", icon: Shield, color: "text-yellow-400" },
};

const TRANSPORT_CODES = [
  { code: "A0425", desc: "Ground mileage per statute mile" },
  { code: "A0426", desc: "ALS, non-emergency transport" },
  { code: "A0427", desc: "ALS, emergency transport, BLS" },
  { code: "A0428", desc: "BLS, non-emergency transport" },
  { code: "A0429", desc: "BLS, emergency transport" },
  { code: "A0433", desc: "ALS, level 2 emergency transport" },
];

function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const COLORS = ["#3b82f6", "#ef4444", "#f97316", "#22c55e", "#8b5cf6", "#06b6d4"];

export default function EmsBillingPage() {
  const [showNewBill, setShowNewBill] = useState(false);
  const [tab, setTab] = useState("claims");

  const { data: billing, refetch } = trpc.ems.listBilling.useQuery({ limit: 100 });
  const { data: incidents } = trpc.ems.listIncidents.useQuery({ limit: 100 });

  const updateStatus = trpc.ems.updateBillingStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("Billing status updated"); },
  });
  const createBilling = trpc.ems.createBilling.useMutation({
    onSuccess: () => { refetch(); setShowNewBill(false); toast.success("Bill created"); },
  });

  const [form, setForm] = useState({
    incidentId: "",
    incidentNumber: "",
    patientName: "",
    billingType: "insurance" as const,
    insurerName: "",
    policyNumber: "",
    icd10Code: "",
    transportCode: "A0429",
    billedAmountCents: "145000",
  });

  function handleCreate() {
    const num = `BILL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 900) + 100)}`;
    createBilling.mutate({
      ...form,
      billNumber: num,
      incidentId: parseInt(form.incidentId) || 1,
      billedAmountCents: parseInt(form.billedAmountCents) || 145000,
    });
  }

  // Analytics
  const totalBilled = (billing ?? []).reduce((s, b) => s + (b.billedAmountCents ?? 0), 0);
  const totalPaid = (billing ?? []).reduce((s, b) => s + (b.paidAmountCents ?? 0), 0);
  const totalPending = (billing ?? []).filter(b => ["submitted", "pending", "approved"].includes(b.status)).reduce((s, b) => s + (b.billedAmountCents ?? 0), 0);
  const totalDenied = (billing ?? []).filter(b => b.status === "denied").reduce((s, b) => s + (b.billedAmountCents ?? 0), 0);
  const collectionRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : "0.0";

  // By billing type pie
  const byType = Object.entries(BILLING_TYPE_CONFIG).map(([type, cfg]) => ({
    name: cfg.label,
    value: (billing ?? []).filter(b => b.billingType === type).reduce((s, b) => s + (b.billedAmountCents ?? 0), 0) / 100,
  })).filter(d => d.value > 0);

  // By status bar
  const byStatus = Object.entries(STATUS_CONFIG).map(([status, cfg]) => ({
    name: cfg.label,
    count: (billing ?? []).filter(b => b.status === status).length,
    amount: (billing ?? []).filter(b => b.status === status).reduce((s, b) => s + (b.billedAmountCents ?? 0), 0) / 100,
  })).filter(d => d.count > 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-500" />
              EMS Billing Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Insurance claims, Medicare/Medicaid billing, revenue analytics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setShowNewBill(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Bill
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Billed</p>
              <p className="text-2xl font-bold text-blue-400">{formatCents(totalBilled)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Collected</p>
              <p className="text-2xl font-bold text-green-400">{formatCents(totalPaid)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Pending Claims</p>
              <p className="text-2xl font-bold text-yellow-400">{formatCents(totalPending)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Collection Rate</p>
              <p className="text-2xl font-bold text-emerald-400">{collectionRate}%</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="claims">Claims ({(billing ?? []).length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="codes">Billing Codes</TabsTrigger>
          </TabsList>

          {/* Claims Table */}
          <TabsContent value="claims" className="mt-4">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left p-3">Bill #</th>
                      <th className="text-left p-3">Incident</th>
                      <th className="text-left p-3">Patient</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Insurer</th>
                      <th className="text-right p-3">Billed</th>
                      <th className="text-right p-3">Allowed</th>
                      <th className="text-right p-3">Paid</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(billing ?? []).map(bill => {
                      const typeCfg = BILLING_TYPE_CONFIG[bill.billingType] ?? BILLING_TYPE_CONFIG.insurance;
                      const statusCfg = STATUS_CONFIG[bill.status] ?? STATUS_CONFIG.draft;
                      const Icon = typeCfg.icon;
                      const nextStatuses: string[] = {
                        draft: ["submitted"],
                        submitted: ["pending", "denied"],
                        pending: ["approved", "denied"],
                        approved: ["paid"],
                        denied: ["appealed", "written_off"],
                        appealed: ["approved", "written_off"],
                        paid: [],
                        written_off: [],
                      }[bill.status] ?? [];
                      return (
                        <tr key={bill.id} className="border-b hover:bg-accent/30 transition-colors">
                          <td className="p-3 font-mono text-xs">{bill.billNumber}</td>
                          <td className="p-3 text-xs text-muted-foreground">{bill.incidentNumber}</td>
                          <td className="p-3">{bill.patientName ?? "—"}</td>
                          <td className="p-3">
                            <span className={`flex items-center gap-1 text-xs ${typeCfg.color}`}>
                              <Icon className="w-3 h-3" />
                              {typeCfg.label}
                            </span>
                          </td>
                          <td className="p-3 text-xs">{bill.insurerName ?? "—"}</td>
                          <td className="p-3 text-right font-mono text-xs">{formatCents(bill.billedAmountCents)}</td>
                          <td className="p-3 text-right font-mono text-xs text-muted-foreground">{formatCents(bill.allowedAmountCents)}</td>
                          <td className="p-3 text-right font-mono text-xs text-green-400">{formatCents(bill.paidAmountCents)}</td>
                          <td className="p-3">
                            <Badge className={`text-xs ${statusCfg.bg} text-white`}>{statusCfg.label}</Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {nextStatuses.map(ns => (
                                <Button
                                  key={ns}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-6 px-2"
                                  disabled={updateStatus.isPending}
                                  onClick={() => updateStatus.mutate({ id: bill.id, status: ns as any })}
                                >
                                  {STATUS_CONFIG[ns]?.label ?? ns}
                                </Button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(billing ?? []).length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-muted-foreground">No billing records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Billing by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Claims by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={byStatus} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Government Billing Summary */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">Government Billing Summary (Medicare / Medicaid)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["medicare", "medicaid"].map(type => {
                      const typeBills = (billing ?? []).filter(b => b.billingType === type);
                      const billed = typeBills.reduce((s, b) => s + (b.billedAmountCents ?? 0), 0);
                      const paid = typeBills.reduce((s, b) => s + (b.paidAmountCents ?? 0), 0);
                      const rate = billed > 0 ? ((paid / billed) * 100).toFixed(1) : "0.0";
                      return (
                        <div key={type} className="p-3 rounded-lg border">
                          <p className="text-xs text-muted-foreground capitalize">{type}</p>
                          <p className="text-lg font-bold">{formatCents(billed)}</p>
                          <p className="text-xs text-green-400">Collected: {formatCents(paid)}</p>
                          <p className="text-xs text-muted-foreground">Rate: {rate}%</p>
                          <p className="text-xs text-muted-foreground">{typeBills.length} claims</p>
                        </div>
                      );
                    })}
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">Iowa Medicaid</p>
                      <p className="text-sm text-muted-foreground mt-1">DHS Provider #: WL-EMS-2024</p>
                      <p className="text-xs text-muted-foreground">NPI: 1234567890</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">CMS Compliance</p>
                      <p className="text-sm text-green-400 mt-1">✓ Active Enrollment</p>
                      <p className="text-xs text-muted-foreground">Renewal: Dec 2024</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing Codes Reference */}
          <TabsContent value="codes" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">HCPCS Transport Codes (CMS)</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b">
                        <th className="text-left pb-2">Code</th>
                        <th className="text-left pb-2">Description</th>
                        <th className="text-right pb-2">Medicare Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TRANSPORT_CODES.map(c => (
                        <tr key={c.code} className="border-b text-xs">
                          <td className="py-2 font-mono text-blue-400">{c.code}</td>
                          <td className="py-2">{c.desc}</td>
                          <td className="py-2 text-right text-muted-foreground">See CMS fee schedule</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Common ICD-10 Codes</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b">
                        <th className="text-left pb-2">Code</th>
                        <th className="text-left pb-2">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { code: "I21.9", desc: "Acute MI, unspecified" },
                        { code: "I63.9", desc: "Cerebral infarction, unspecified" },
                        { code: "J96.00", desc: "Acute respiratory failure" },
                        { code: "S09.90XA", desc: "Unspecified injury of head, initial" },
                        { code: "T39.1X1A", desc: "Poisoning by 4-Aminophenol derivatives" },
                        { code: "E11.9", desc: "Type 2 diabetes mellitus w/o complications" },
                        { code: "R55", desc: "Syncope and collapse" },
                        { code: "R00.1", desc: "Bradycardia, unspecified" },
                      ].map(c => (
                        <tr key={c.code} className="border-b text-xs">
                          <td className="py-2 font-mono text-orange-400">{c.code}</td>
                          <td className="py-2">{c.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">UB-04 Claim Form Reference</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {[
                      { field: "FL 1", desc: "Provider Name: West Liberty Fire & EMS" },
                      { field: "FL 5", desc: "Federal Tax ID: 42-XXXXXXX" },
                      { field: "FL 6", desc: "Statement Covers Period" },
                      { field: "FL 8", desc: "Patient Name" },
                      { field: "FL 14", desc: "Admission Date" },
                      { field: "FL 42", desc: "Revenue Code (0540 = Ambulance)" },
                      { field: "FL 44", desc: "HCPCS/Rate (A0427, A0429)" },
                      { field: "FL 67", desc: "Principal Diagnosis (ICD-10)" },
                    ].map(f => (
                      <div key={f.field} className="p-2 rounded border">
                        <span className="font-mono text-blue-400">{f.field}</span>
                        <p className="text-muted-foreground mt-0.5">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Bill Dialog */}
      <Dialog open={showNewBill} onOpenChange={setShowNewBill}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Create New Bill
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Incident ID</Label>
                <Select value={form.incidentId} onValueChange={v => {
                  const inc = (incidents ?? []).find(i => String(i.id) === v);
                  setForm(f => ({ ...f, incidentId: v, incidentNumber: inc?.incidentNumber ?? "" }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Select incident" /></SelectTrigger>
                  <SelectContent>
                    {(incidents ?? []).map(i => (
                      <SelectItem key={i.id} value={String(i.id)}>{i.incidentNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Billing Type</Label>
                <Select value={form.billingType} onValueChange={v => setForm(f => ({ ...f, billingType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(BILLING_TYPE_CONFIG).map(([type, cfg]) => (
                      <SelectItem key={type} value={type}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Patient Name</Label>
              <Input value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} placeholder="John Doe" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Insurer Name</Label>
                <Input value={form.insurerName} onChange={e => setForm(f => ({ ...f, insurerName: e.target.value }))} placeholder="Wellmark BCBS" />
              </div>
              <div>
                <Label>Policy Number</Label>
                <Input value={form.policyNumber} onChange={e => setForm(f => ({ ...f, policyNumber: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ICD-10 Code</Label>
                <Input value={form.icd10Code} onChange={e => setForm(f => ({ ...f, icd10Code: e.target.value }))} placeholder="I21.9" />
              </div>
              <div>
                <Label>Transport Code</Label>
                <Select value={form.transportCode} onValueChange={v => setForm(f => ({ ...f, transportCode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRANSPORT_CODES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Billed Amount (cents)</Label>
              <Input
                type="number"
                value={form.billedAmountCents}
                onChange={e => setForm(f => ({ ...f, billedAmountCents: e.target.value }))}
                placeholder="145000 = $1,450.00"
              />
              <p className="text-xs text-muted-foreground mt-1">= {formatCents(parseInt(form.billedAmountCents) || 0)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBill(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreate} disabled={createBilling.isPending || !form.incidentId}>
              {createBilling.isPending ? "Creating…" : "Create Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
