/**
 * EMS / Fire Compliance Tracker — West Liberty, IA
 * HIPAA, NEMSIS, NFIRS, certifications, equipment checks, CMS audits
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck, AlertTriangle, Clock, CheckCircle2, RefreshCw,
  FileText, User, Calendar, ClipboardList, Activity, XCircle
} from "lucide-react";
import { toast } from "sonner";

const COMPLIANCE_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  nemsis: { label: "NEMSIS", icon: FileText, color: "text-blue-400" },
  nfirs: { label: "NFIRS", icon: FileText, color: "text-orange-400" },
  hipaa: { label: "HIPAA", icon: ShieldCheck, color: "text-purple-400" },
  certification: { label: "Certification", icon: User, color: "text-green-400" },
  equipment_check: { label: "Equipment Check", icon: Activity, color: "text-yellow-400" },
  cms_audit: { label: "CMS Audit", icon: ClipboardList, color: "text-red-400" },
  training: { label: "Training", icon: User, color: "text-cyan-400" },
  pcr: { label: "PCR Quality", icon: FileText, color: "text-pink-400" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  compliant: { label: "Compliant", color: "text-green-400", bg: "bg-green-600", icon: CheckCircle2 },
  due: { label: "Due", color: "text-yellow-400", bg: "bg-yellow-600", icon: Clock },
  overdue: { label: "Overdue", color: "text-red-400", bg: "bg-red-600", icon: AlertTriangle },
  in_review: { label: "In Review", color: "text-blue-400", bg: "bg-blue-600", icon: Activity },
  waived: { label: "Waived", color: "text-gray-400", bg: "bg-gray-600", icon: XCircle },
};

function daysUntil(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  return `${diff}d remaining`;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function EmsCompliancePage() {
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>("compliant");
  const [updateNotes, setUpdateNotes] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: compliance, refetch } = trpc.ems.listCompliance.useQuery();
  const updateMutation = trpc.ems.updateComplianceStatus.useMutation({
    onSuccess: () => {
      refetch();
      setUpdateDialog(false);
      toast.success("Compliance status updated");
    },
  });

  const items = (compliance ?? []).filter(item => {
    if (filterType !== "all" && item.complianceType !== filterType) return false;
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    return true;
  });

  const compliantCount = (compliance ?? []).filter(i => i.status === "compliant").length;
  const dueCount = (compliance ?? []).filter(i => i.status === "due").length;
  const overdueCount = (compliance ?? []).filter(i => i.status === "overdue").length;
  const inReviewCount = (compliance ?? []).filter(i => i.status === "in_review").length;

  function openUpdate(id: number, currentStatus: string, currentNotes: string | null) {
    setSelectedItem(id);
    setUpdateStatus(currentStatus);
    setUpdateNotes(currentNotes ?? "");
    setUpdateDialog(true);
  }

  function handleUpdate() {
    if (!selectedItem) return;
    updateMutation.mutate({ id: selectedItem, status: updateStatus as any, notes: updateNotes });
  }

  // Group by type for the overview tab
  const byType = Object.entries(COMPLIANCE_TYPE_CONFIG).map(([type, cfg]) => {
    const typeItems = (compliance ?? []).filter(i => i.complianceType === type);
    return { type, cfg, items: typeItems };
  }).filter(g => g.items.length > 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-500" />
              EMS / Fire Compliance Tracker
            </h1>
            <p className="text-muted-foreground text-sm mt-1">HIPAA · NEMSIS · NFIRS · Certifications · Equipment · CMS Audits</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-500/30 bg-green-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">{compliantCount}</p>
                <p className="text-xs text-muted-foreground">Compliant</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-yellow-400">{dueCount}</p>
                <p className="text-xs text-muted-foreground">Due Soon</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-red-400">{overdueCount}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/30 bg-blue-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">{inReviewCount}</p>
                <p className="text-xs text-muted-foreground">In Review</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">All Items ({(compliance ?? []).length})</TabsTrigger>
            <TabsTrigger value="overview">By Category</TabsTrigger>
            <TabsTrigger value="hipaa">HIPAA Audit Log</TabsTrigger>
          </TabsList>

          {/* List View */}
          <TabsContent value="list" className="mt-4">
            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-44 h-8 text-sm">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(COMPLIANCE_TYPE_CONFIG).map(([type, cfg]) => (
                    <SelectItem key={type} value={type}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                    <SelectItem key={status} value={status}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {items.map(item => {
                const typeCfg = COMPLIANCE_TYPE_CONFIG[item.complianceType] ?? COMPLIANCE_TYPE_CONFIG.certification;
                const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.due;
                const TypeIcon = typeCfg.icon;
                const StatusIcon = statusCfg.icon;
                return (
                  <Card key={item.id} className={`border ${item.status === "overdue" ? "border-red-500/50" : item.status === "due" ? "border-yellow-500/30" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg bg-accent flex-shrink-0`}>
                            <TypeIcon className={`w-5 h-5 ${typeCfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{item.title}</span>
                              <Badge className={`text-xs ${statusCfg.bg} text-white`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusCfg.label}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${typeCfg.color}`}>
                                {typeCfg.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              {item.assignedTo && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" /> {item.assignedTo}
                                </span>
                              )}
                              {item.dueDate && (
                                <span className={`flex items-center gap-1 ${item.status === "overdue" ? "text-red-400" : item.status === "due" ? "text-yellow-400" : ""}`}>
                                  <Calendar className="w-3 h-3" /> Due: {formatDate(item.dueDate)} · {daysUntil(item.dueDate)}
                                </span>
                              )}
                              {item.completedAt && (
                                <span className="flex items-center gap-1 text-green-400">
                                  <CheckCircle2 className="w-3 h-3" /> Completed: {formatDate(item.completedAt)}
                                </span>
                              )}
                            </div>
                            {item.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 flex-shrink-0"
                          onClick={() => openUpdate(item.id, item.status, item.notes ?? null)}
                        >
                          Update
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {items.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No compliance items match the selected filters</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* By Category */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {byType.map(({ type, cfg, items: typeItems }) => {
                const Icon = cfg.icon;
                const compliant = typeItems.filter(i => i.status === "compliant").length;
                const total = typeItems.length;
                const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;
                return (
                  <Card key={type}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        {cfg.label}
                        <span className="ml-auto text-xs text-muted-foreground">{compliant}/{total} compliant ({pct}%)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {typeItems.map(item => {
                        const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.due;
                        const StatusIcon = statusCfg.icon;
                        return (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <span className="truncate flex-1">{item.title}</span>
                            <Badge className={`text-xs ml-2 ${statusCfg.bg} text-white flex-shrink-0`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusCfg.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* HIPAA Audit Log */}
          <TabsContent value="hipaa" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  HIPAA Compliance Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: "2024-03-01", action: "PCR Access", user: "J. Rivera", patient: "J. Doe (INC-20240301-0001)", result: "Authorized" },
                    { date: "2024-03-01", action: "PCR Export", user: "S. Patel", patient: "M. Smith (INC-20240302-0001)", result: "Authorized" },
                    { date: "2024-03-02", action: "Billing Record Access", user: "Finance Director", patient: "J. Doe (BILL-20240301-001)", result: "Authorized" },
                    { date: "2024-03-02", action: "Annual Training", user: "All EMS Staff", patient: "N/A", result: "Pending" },
                    { date: "2024-02-15", action: "Data Breach Assessment", user: "IT Director", patient: "N/A", result: "No breach detected" },
                    { date: "2024-01-31", action: "BAA Review", user: "City Administrator", patient: "N/A", result: "Compliant" },
                  ].map((entry, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border text-xs">
                      <div className="flex-shrink-0 text-muted-foreground">{entry.date}</div>
                      <div className="flex-1">
                        <span className="font-medium">{entry.action}</span>
                        <span className="text-muted-foreground"> · {entry.user}</span>
                        {entry.patient !== "N/A" && <span className="text-muted-foreground"> · Patient: {entry.patient}</span>}
                      </div>
                      <Badge
                        className={`text-xs flex-shrink-0 ${entry.result === "Authorized" || entry.result === "Compliant" || entry.result === "No breach detected" ? "bg-green-600" : entry.result === "Pending" ? "bg-yellow-600" : "bg-gray-600"} text-white`}
                      >
                        {entry.result}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  All EMS patient records are protected under HIPAA Privacy Rule (45 CFR Part 164). Access is restricted to authorized personnel with a need-to-know basis. Iowa Code § 147A.8 governs EMS patient record confidentiality.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Update Dialog */}
      <Dialog open={updateDialog} onOpenChange={setUpdateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Compliance Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>New Status</Label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                    <SelectItem key={status} value={status}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={updateNotes}
                onChange={e => setUpdateNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about this compliance update…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
