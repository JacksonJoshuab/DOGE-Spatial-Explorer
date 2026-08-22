import { useMemo, useState } from "react";
import { Activity, Apple, Bot, BrainCircuit, CheckCircle2, ChevronRight, CircleAlert, Cpu, Download, FileCheck2, Globe2, Loader2, MapPinned, Microscope, Orbit, Radar, Send, ShieldCheck, Sparkles, Target, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProviderHealthStrip } from "@/components/ProviderHealthStrip";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type AiProvider = "openai" | "nvidia";
type SpatialTarget = "apple" | "meta";
type Priority = "routine" | "priority" | "critical";

const categoryClass = {
  AI: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  Spatial: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  Identity: "border-amber-400/30 bg-amber-400/10 text-amber-200",
};

const priorityClass: Record<Priority, string> = {
  routine: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  priority: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  critical: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

function downloadTimeline(rows: Array<{ id: string; type: string; title: string; detail: string; priority: string; timestamp: string }>) {
  const csv = ["id,type,title,detail,priority,timestamp", ...rows.map(row => [row.id, row.type, row.title, row.detail, row.priority, row.timestamp].map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ecosystem-activity.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Ecosystem() {
  const snapshot = trpc.commandCenter.snapshot.useQuery(undefined, { refetchInterval: 30_000 });
  const [timelineType, setTimelineType] = useState("");
  const [timelinePriority, setTimelinePriority] = useState<Priority | "">("");
  const timeline = trpc.commandCenter.timeline.useQuery({ type: timelineType, priority: timelinePriority });
  const [analysisProvider, setAnalysisProvider] = useState<AiProvider>("openai");
  const [diagnosticProvider, setDiagnosticProvider] = useState<AiProvider>("openai");
  const [diagnosticPrompt, setDiagnosticPrompt] = useState("Summarize the operational implications of the current vessel activity.");
  const [analysisResult, setAnalysisResult] = useState<{ provider: string; model: string; text: string } | null>(null);
  const [brief, setBrief] = useState({ objective: "Coordinate a spatial review of the active operating picture.", area: "Harbor and offshore transfer corridor", priority: "priority" as Priority });
  const [briefResult, setBriefResult] = useState<{ provider: string; model: string; text: string } | null>(null);
  const [manifestInput, setManifestInput] = useState({ target: "apple" as SpatialTarget, sessionName: "Corridor review", sceneRef: "scene://coastal-corridor", classification: "internal" as "internal" | "restricted" });
  const [manifestResult, setManifestResult] = useState<{ manifestId: string; state: string; safeguards: string[]; expiresAt: Date } | null>(null);

  const analyze = trpc.ecosystem.analyze.useMutation({ onSuccess: setAnalysisResult, onError: error => toast.error("Provider request unavailable", { description: error.message }) });
  const composeBrief = trpc.commandCenter.composeBrief.useMutation({ onSuccess: setBriefResult, onError: error => toast.error("Mission brief unavailable", { description: error.message }) });
  const buildManifest = trpc.commandCenter.buildManifest.useMutation({ onSuccess: result => setManifestResult(result), onError: error => toast.error("Manifest could not be staged", { description: error.message }) });

  const configuredProviders = useMemo(() => snapshot.data?.health.providers.filter(provider => provider.configured).map(provider => provider.id) ?? [], [snapshot.data]);
  const submitDiagnostic = () => { setAnalysisResult(null); analyze.mutate({ provider: diagnosticProvider, prompt: diagnosticPrompt }); };
  const submitBrief = () => { setBriefResult(null); composeBrief.mutate({ provider: analysisProvider, ...brief }); };
  const submitManifest = () => { setManifestResult(null); buildManifest.mutate(manifestInput); };

  if (snapshot.isError) {
    return <div className="p-6"><Card className="border-destructive/40"><CardContent className="flex items-center gap-3 p-6 text-sm"><CircleAlert className="h-5 w-5 text-destructive" />The command-center workspace could not load. Refresh the page to retry.</CardContent></Card></div>;
  }

  const data = snapshot.data;
  return (
    <div className="max-w-[1440px] space-y-6 p-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-primary"><Orbit className="h-4 w-4" /> Cross-platform control plane</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Ecosystem Command Center</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">A secure operating surface for provider health, spatial handoff preparation, digital-twin overlays, and enterprise rollout readiness.</p>
        </div>
        <Badge variant="outline" className="w-fit border-primary/30 bg-primary/10 px-3 py-1.5 font-mono text-primary"><Activity className="mr-2 h-4 w-4" />Refreshed every 30 seconds</Badge>
      </header>

      <ProviderHealthStrip health={data?.health} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" aria-label="Provider readiness">
        {snapshot.isLoading && Array.from({ length: 5 }).map((_, index) => <Card key={index} className="h-52 animate-pulse bg-muted/25" />)}
        {data?.health.providers.map(provider => (
          <Card key={provider.id} className="border-border bg-card/80">
            <CardHeader className="pb-3"><div className="flex items-center justify-between"><Badge variant="outline" className={categoryClass[provider.category as keyof typeof categoryClass]}>{provider.category}</Badge><span className={`h-2 w-2 rounded-full ${provider.configured ? "bg-emerald-400" : "bg-muted-foreground/40"}`} /></div><CardTitle className="pt-3 text-base">{provider.label}</CardTitle><CardDescription>{provider.configured ? "Configuration recognized by server runtime." : "Configuration remains staged."}</CardDescription></CardHeader>
            <CardContent><Badge variant="outline" className={provider.configured ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-muted-foreground/30 text-muted-foreground"}>{provider.configured ? "Ready" : "Needs setup"}</Badge></CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-5">
        <Card className="xl:col-span-3 border-border bg-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Microscope className="h-5 w-5 text-primary" />Feature 3 · Provider diagnostics</CardTitle><CardDescription>Run a bounded analysis request only through a configured server-side provider.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">{(["openai", "nvidia"] as AiProvider[]).map(provider => <Button key={provider} size="sm" variant={diagnosticProvider === provider ? "default" : "outline"} onClick={() => setDiagnosticProvider(provider)}>{provider === "openai" ? "OpenAI" : "NVIDIA NIM"}{configuredProviders.includes(provider) ? <CheckCircle2 className="ml-1.5 h-3.5 w-3.5" /> : null}</Button>)}</div>
            <Textarea value={diagnosticPrompt} onChange={event => setDiagnosticPrompt(event.target.value)} className="min-h-28 bg-background" maxLength={6000} aria-label="Diagnostic prompt" />
            <div className="flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">{diagnosticPrompt.length}/6000 · server mediated</span><Button onClick={submitDiagnostic} disabled={!diagnosticPrompt.trim() || analyze.isPending}>{analyze.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Run diagnostic</Button></div>
            {data?.diagnostics.map(item => <div key={item.provider} className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-xs"><span className="font-medium text-foreground">{item.label}</span><span className="text-muted-foreground">{item.state}{item.latencyMs !== null ? ` · ${item.latencyMs}ms` : ""}</span></div>)}
            {analysisResult ? <div className="rounded-lg border border-primary/30 bg-primary/5 p-4"><p className="mb-2 font-mono text-xs text-primary">{analysisResult.provider} · {analysisResult.model}</p><p className="whitespace-pre-wrap text-sm leading-6">{analysisResult.text}</p></div> : null}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-border bg-card"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-300" />Feature 10 · Secure posture</CardTitle><CardDescription>Auditable, key-free configuration posture.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex items-end justify-between"><p className="font-mono text-4xl font-bold text-foreground">{data?.posture.score ?? 0}<span className="text-base text-muted-foreground">/100</span></p><Badge variant="outline" className="border-primary/30 text-primary">{data?.posture.checks.filter(check => check.passed).length ?? 0} controls passing</Badge></div>{data?.posture.checks.map(check => <div key={check.id} className="rounded-lg border border-border bg-background/60 p-3"><div className="flex gap-2"><CheckCircle2 className={`mt-0.5 h-4 w-4 ${check.passed ? "text-emerald-400" : "text-muted-foreground"}`} /><div><p className="text-xs font-medium text-foreground">{check.label}</p><p className="mt-1 text-xs text-muted-foreground">{check.detail}</p></div></div></div>)}</CardContent></Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="border-border bg-card"><CardHeader><CardTitle className="flex items-center gap-2"><Workflow className="h-5 w-5 text-cyan-300" />Feature 2 · Session manifest</CardTitle><CardDescription>Stage a short-lived, device-safe spatial handoff manifest.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-2"><select value={manifestInput.target} onChange={event => setManifestInput(current => ({ ...current, target: event.target.value as SpatialTarget }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="apple">Apple spatial</option><option value="meta">Meta Horizon</option></select><select value={manifestInput.classification} onChange={event => setManifestInput(current => ({ ...current, classification: event.target.value as "internal" | "restricted" }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="internal">Internal</option><option value="restricted">Restricted</option></select></div><Input value={manifestInput.sessionName} onChange={event => setManifestInput(current => ({ ...current, sessionName: event.target.value }))} aria-label="Spatial session name" /><Input value={manifestInput.sceneRef} onChange={event => setManifestInput(current => ({ ...current, sceneRef: event.target.value }))} aria-label="Scene reference" /><Button className="w-full" onClick={submitManifest} disabled={buildManifest.isPending}>{buildManifest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}Stage manifest</Button>{manifestResult ? <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/5 p-3 text-xs"><p className="font-mono text-cyan-200">{manifestResult.manifestId}</p><p className="mt-1 text-foreground">{manifestResult.state}</p><p className="mt-2 text-muted-foreground">{manifestResult.safeguards.join(" · ")}</p></div> : null}</CardContent></Card>

        <Card className="border-border bg-card"><CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-violet-300" />Feature 4 · Mission brief</CardTitle><CardDescription>Compose a structured operator brief using an approved AI provider.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex gap-2">{(["openai", "nvidia"] as AiProvider[]).map(provider => <Button key={provider} size="sm" variant={analysisProvider === provider ? "default" : "outline"} onClick={() => setAnalysisProvider(provider)}>{provider === "openai" ? "OpenAI" : "NVIDIA"}</Button>)}</div><Textarea value={brief.objective} onChange={event => setBrief(current => ({ ...current, objective: event.target.value }))} aria-label="Mission objective" className="min-h-20 bg-background" /><Input value={brief.area} onChange={event => setBrief(current => ({ ...current, area: event.target.value }))} aria-label="Operating area" /><select value={brief.priority} onChange={event => setBrief(current => ({ ...current, priority: event.target.value as Priority }))} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="routine">Routine</option><option value="priority">Priority</option><option value="critical">Critical</option></select><Button className="w-full" onClick={submitBrief} disabled={composeBrief.isPending}>{composeBrief.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}Compose brief</Button>{briefResult ? <div className="rounded-lg border border-violet-400/30 bg-violet-400/5 p-3 text-xs"><p className="font-mono text-violet-200">{briefResult.provider} · {briefResult.model}</p><p className="mt-2 whitespace-pre-wrap leading-5 text-foreground">{briefResult.text}</p></div> : null}</CardContent></Card>

        <Card className="border-border bg-card"><CardHeader><CardTitle className="flex items-center gap-2"><MapPinned className="h-5 w-5 text-amber-300" />Feature 5 · Live overlay board</CardTitle><CardDescription>Operational markers prepared for the digital-twin viewport.</CardDescription></CardHeader><CardContent><div className="relative h-56 overflow-hidden rounded-xl border border-border bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_32%),linear-gradient(135deg,rgba(14,116,144,0.2),rgba(2,6,23,0.7))]">{data?.overlays.map(overlay => <div key={overlay.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${overlay.x}%`, top: `${overlay.y}%` }}><span className={`block h-3 w-3 rounded-full ring-4 ring-background/50 ${overlay.priority === "critical" ? "bg-rose-400" : overlay.priority === "priority" ? "bg-amber-400" : "bg-cyan-300"}`} /><div className="mt-1 w-28 rounded bg-background/90 p-1.5 text-[10px] shadow"><p className="font-medium text-foreground">{overlay.label}</p><p className="text-muted-foreground">{overlay.detail}</p></div></div>)}<div className="absolute inset-x-3 bottom-3 flex gap-2"><Badge variant="outline" className="border-rose-400/30 text-rose-200">Critical</Badge><Badge variant="outline" className="border-amber-400/30 text-amber-200">Priority</Badge><Badge variant="outline" className="border-cyan-400/30 text-cyan-200">Routine</Badge></div></div></CardContent></Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="border-border bg-card"><CardHeader><CardTitle className="flex items-center gap-2"><Apple className="h-5 w-5 text-slate-200" />Feature 6 · Apple association inspector</CardTitle><CardDescription>Inspect the server-hosted Universal Link association contract.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="rounded-lg border border-border bg-background/60 p-3 text-xs"><p className="font-mono text-primary">{data?.apple.associationPath}</p><p className="mt-2 text-muted-foreground">{data?.apple.configured ? "Associated domain and app ID are configured." : "Add an Apple app ID and associated domain to activate native handoff."}</p></div><div className="flex flex-wrap gap-1.5">{data?.apple.appIds.length ? data.apple.appIds.map(id => <code key={id} className="rounded bg-muted px-2 py-1 text-xs">{id}</code>) : <span className="text-xs text-muted-foreground">No app identifier has been supplied.</span>}</div><a href="/.well-known/apple-app-site-association" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><ChevronRight className="h-3.5 w-3.5" />Open association response</a></CardContent></Card>
        <Card className="border-border bg-card"><CardHeader><CardTitle className="flex items-center gap-2"><Radar className="h-5 w-5 text-cyan-300" />Feature 7 · Meta handoff console</CardTitle><CardDescription>Prepare a Quest session handoff without exposing context in the URL.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="rounded-lg border border-border bg-background/60 p-3"><p className="text-sm font-medium text-foreground">{data?.meta.state}</p><p className="mt-1 text-xs text-muted-foreground">The receiving client must validate the staged manifest before opening spatial content.</p></div><Badge variant="outline" className={data?.meta.configured ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-muted-foreground/30 text-muted-foreground"}>{data?.meta.configured ? "App target registered" : "App ID required"}</Badge></CardContent></Card>
        <Card className="border-border bg-card"><CardHeader><CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5 text-blue-300" />Feature 8 · Entra readiness</CardTitle><CardDescription>Keep the current authentication path active until enterprise rollout is complete.</CardDescription></CardHeader><CardContent className="space-y-2">{data?.entra.checklist.map(item => <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border bg-background/60 p-2.5 text-xs"><CheckCircle2 className={`h-4 w-4 ${item.complete ? "text-emerald-400" : "text-muted-foreground"}`} /><span className={item.complete ? "text-foreground" : "text-muted-foreground"}>{item.label}</span></div>)}<p className="pt-1 text-xs text-muted-foreground">{data?.entra.completeCount}/4 readiness checks complete</p></CardContent></Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-border bg-card"><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Feature 9 · Ecosystem activity</CardTitle><CardDescription>Filter operational records and export the visible view as CSV.</CardDescription></div><Button size="sm" variant="outline" onClick={() => { if (timeline.data) { downloadTimeline(timeline.data); toast.success("CSV export prepared"); } }} disabled={!timeline.data?.length}><Download className="mr-2 h-4 w-4" />Export CSV</Button></div></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2"><select value={timelineType} onChange={event => setTimelineType(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">All activity</option><option value="security">Security</option><option value="spatial">Spatial</option><option value="overlay">Overlay</option><option value="identity">Identity</option></select><select value={timelinePriority} onChange={event => setTimelinePriority(event.target.value as Priority | "")} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">All priorities</option><option value="critical">Critical</option><option value="priority">Priority</option><option value="routine">Routine</option></select></div>{timeline.data?.map(entry => <div key={entry.id} className="flex gap-3 rounded-lg border border-border bg-background/60 p-3"><FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-foreground">{entry.title}</p><Badge variant="outline" className={priorityClass[entry.priority]}>{entry.priority}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{entry.detail}</p></div><time className="hidden whitespace-nowrap font-mono text-[10px] text-muted-foreground sm:block">{new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>)}{timeline.data?.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No activity matches these filters.</p> : null}</CardContent></Card>
        <Card className="border-border bg-card"><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Core upgrade summary</CardTitle><CardDescription>Shared resilience improvements used across the new feature set.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><div className="rounded-lg border border-border bg-background/60 p-3"><p className="font-medium text-foreground">Accessible navigation</p><p className="mt-1 text-xs text-muted-foreground">Provider health, clear status labels, and keyboard-reachable controls remain visible across the workspace.</p></div><div className="rounded-lg border border-border bg-background/60 p-3"><p className="font-medium text-foreground">Safe loading and error states</p><p className="mt-1 text-xs text-muted-foreground">Core queries provide loading, staged, and retry-safe states without exposing a provider credential.</p></div><div className="rounded-lg border border-border bg-background/60 p-3"><p className="font-medium text-foreground">Security by default</p><p className="mt-1 text-xs text-muted-foreground">Spatial manifests are short-lived and provider access remains server mediated.</p></div></CardContent></Card>
      </section>
    </div>
  );
}
