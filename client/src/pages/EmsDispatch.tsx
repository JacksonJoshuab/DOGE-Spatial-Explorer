/**
 * EMS / Fire Dispatch Board — West Liberty, IA
 * Live incident queue with unit assignment, status workflow, and real-time updates
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle, Ambulance, Flame, Car, Zap, Shield, RefreshCw,
  Plus, ChevronRight, Clock, MapPin, User, Radio, CheckCircle2,
  Activity, Phone, FileText
} from "lucide-react";
import { toast } from "sonner";

const PRIORITY_CONFIG = {
  P1: { label: "P1 — Critical", color: "bg-red-600 text-white", border: "border-red-500" },
  P2: { label: "P2 — Urgent", color: "bg-orange-500 text-white", border: "border-orange-400" },
  P3: { label: "P3 — Non-Urgent", color: "bg-yellow-500 text-black", border: "border-yellow-400" },
  P4: { label: "P4 — Routine", color: "bg-blue-500 text-white", border: "border-blue-400" },
};

const STATUS_FLOW: Record<string, string[]> = {
  pending: ["dispatched", "cancelled"],
  dispatched: ["on_scene", "cancelled"],
  on_scene: ["transporting", "resolved"],
  transporting: ["resolved"],
  resolved: [],
  cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  dispatched: "Dispatched",
  on_scene: "On Scene",
  transporting: "Transporting",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-600",
  dispatched: "bg-blue-600",
  on_scene: "bg-orange-500",
  transporting: "bg-purple-600",
  resolved: "bg-green-600",
  cancelled: "bg-gray-400",
};

const INCIDENT_ICONS: Record<string, React.ElementType> = {
  medical: Ambulance,
  fire: Flame,
  mva: Car,
  hazmat: AlertTriangle,
  rescue: Shield,
  mutual_aid: Radio,
  public_assist: User,
  false_alarm: AlertTriangle,
};

function elapsed(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function EmsDispatch() {
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("active");

  const { data: incidents, refetch: refetchIncidents } = trpc.ems.listIncidents.useQuery(
    { limit: 50, status: filterStatus === "active" ? undefined : filterStatus },
    { refetchInterval: autoRefresh ? 8000 : false }
  );
  const { data: units, refetch: refetchUnits } = trpc.ems.listUnits.useQuery(undefined, {
    refetchInterval: autoRefresh ? 8000 : false,
  });

  const updateStatus = trpc.ems.updateIncidentStatus.useMutation({
    onSuccess: () => { refetchIncidents(); refetchUnits(); },
  });
  const updateUnitStatus = trpc.ems.updateUnitStatus.useMutation({
    onSuccess: () => refetchUnits(),
  });
  const createIncident = trpc.ems.createIncident.useMutation({
    onSuccess: () => { refetchIncidents(); setShowNewIncident(false); toast.success("Incident created"); },
  });

  // Filter active incidents (not resolved/cancelled)
  const displayedIncidents = (incidents ?? []).filter(inc => {
    if (filterStatus === "active") return !["resolved", "cancelled"].includes(inc.status);
    return true;
  });

  const activeCount = (incidents ?? []).filter(i => !["resolved", "cancelled"].includes(i.status)).length;
  const availableUnits = (units ?? []).filter(u => u.status === "available").length;
  const dispatchedUnits = (units ?? []).filter(u => ["dispatched", "on_scene", "transporting"].includes(u.status)).length;

  // New incident form state
  const [form, setForm] = useState({
    incidentType: "medical" as const,
    priority: "P2" as const,
    address: "",
    patientName: "",
    patientInsurance: "",
    dispatchedUnits: "",
    narrative: "",
    nemsisCode: "",
    nfirsCode: "",
  });

  function handleCreate() {
    const num = `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    createIncident.mutate({ ...form, incidentNumber: num, city: "West Liberty", state: "IA" });
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Radio className="w-6 h-6 text-red-500" />
              EMS / Fire Dispatch Board
            </h1>
            <p className="text-muted-foreground text-sm mt-1">West Liberty Fire & EMS — Real-time incident management</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(v => !v)}
              className={autoRefresh ? "border-green-500 text-green-400" : ""}
            >
              <Activity className="w-4 h-4 mr-1" />
              {autoRefresh ? "LIVE" : "PAUSED"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { refetchIncidents(); refetchUnits(); }}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => setShowNewIncident(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Incident
            </Button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-red-500/30 bg-red-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-red-400">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active Incidents</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">{availableUnits}</p>
                <p className="text-xs text-muted-foreground">Units Available</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-500/30 bg-orange-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Ambulance className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-orange-400">{dispatchedUnits}</p>
                <p className="text-xs text-muted-foreground">Units Deployed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/30 bg-blue-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Radio className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">{(units ?? []).length}</p>
                <p className="text-xs text-muted-foreground">Total Units</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incident Queue */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Incident Queue</h2>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="all">All Incidents</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="on_scene">On Scene</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {displayedIncidents.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No active incidents</p>
                </CardContent>
              </Card>
            )}

            {displayedIncidents.map(inc => {
              const Icon = INCIDENT_ICONS[inc.incidentType] ?? AlertTriangle;
              const pCfg = PRIORITY_CONFIG[inc.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.P2;
              const nextStatuses = STATUS_FLOW[inc.status] ?? [];
              return (
                <Card key={inc.id} className={`border ${pCfg.border}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${pCfg.color} flex-shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">{inc.incidentNumber}</span>
                            <Badge className={`text-xs ${pCfg.color}`}>{pCfg.label}</Badge>
                            <Badge className={`text-xs ${STATUS_COLORS[inc.status]} text-white`}>
                              {STATUS_LABELS[inc.status]}
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize">{inc.incidentType.replace("_", " ")}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{inc.address}, {inc.city}</span>
                          </div>
                          {inc.patientName && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <User className="w-3 h-3" />
                              <span>{inc.patientName}</span>
                              {inc.patientInsurance && <span className="ml-1 text-blue-400">· {inc.patientInsurance}</span>}
                            </div>
                          )}
                          {inc.dispatchedUnits && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Radio className="w-3 h-3" />
                              <span>Units: {inc.dispatchedUnits}</span>
                            </div>
                          )}
                          {inc.narrative && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{inc.narrative}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Dispatched {elapsed(inc.dispatchedAt)}</span>
                            {inc.onSceneAt && <span>On scene {formatTime(inc.onSceneAt)}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {nextStatuses.map(ns => (
                          <Button
                            key={ns}
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: inc.id, status: ns as any })}
                          >
                            <ChevronRight className="w-3 h-3 mr-1" />
                            {STATUS_LABELS[ns]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Unit Status Panel */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Unit Status</h2>
            {(units ?? []).map(unit => (
              <Card key={unit.unitId} className="text-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{unit.callSign}</span>
                    <Badge className={`text-xs ${STATUS_COLORS[unit.status] ?? "bg-gray-500"} text-white`}>
                      {unit.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{unit.unitType.replace("_", " ")} · {unit.vehicle}</p>
                  {unit.crew && <p className="text-xs text-muted-foreground mt-0.5">Crew: {unit.crew}</p>}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {["available", "standby", "out_of_service"].map(s => (
                      <Button
                        key={s}
                        size="sm"
                        variant={unit.status === s ? "default" : "outline"}
                        className="text-xs h-6 px-2"
                        disabled={updateUnitStatus.isPending}
                        onClick={() => updateUnitStatus.mutate({ unitId: unit.unitId, status: s as any })}
                      >
                        {s.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* New Incident Dialog */}
      <Dialog open={showNewIncident} onOpenChange={setShowNewIncident}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Create New Incident
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Incident Type</Label>
                <Select value={form.incidentType} onValueChange={v => setForm(f => ({ ...f, incidentType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["medical", "fire", "mva", "hazmat", "rescue", "mutual_aid", "public_assist", "false_alarm"].map(t => (
                      <SelectItem key={t} value={t}>{t.replace("_", " ").toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["P1", "P2", "P3", "P4"].map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, West Liberty, IA" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Patient Name (if known)</Label>
                <Input value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} placeholder="Unknown" />
              </div>
              <div>
                <Label>Insurance</Label>
                <Input value={form.patientInsurance} onChange={e => setForm(f => ({ ...f, patientInsurance: e.target.value }))} placeholder="Wellmark, Medicare…" />
              </div>
            </div>
            <div>
              <Label>Dispatched Units</Label>
              <Input value={form.dispatchedUnits} onChange={e => setForm(f => ({ ...f, dispatchedUnits: e.target.value }))} placeholder="AMB-1, ENG-1" />
            </div>
            <div>
              <Label>Narrative</Label>
              <Textarea value={form.narrative} onChange={e => setForm(f => ({ ...f, narrative: e.target.value }))} rows={3} placeholder="Initial call details…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewIncident(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleCreate} disabled={createIncident.isPending || !form.address}>
              {createIncident.isPending ? "Creating…" : "Create Incident"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
