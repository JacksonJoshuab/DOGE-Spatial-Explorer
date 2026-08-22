import { Activity, CheckCircle2, CircleDashed, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Provider = { id: string; label: string; configured: boolean; category: string };

export function ProviderHealthStrip({ health }: { health?: { configuredCount: number; total: number; state: string; providers: Provider[] } }) {
  if (!health) {
    return <div className="h-16 animate-pulse rounded-xl border border-border bg-muted/20" aria-label="Loading provider health" />;
  }

  const stateLabel = health.state === "ready" ? "Ready" : health.state === "partial" ? "Partial" : "Staged";
  const StateIcon = health.state === "ready" ? CheckCircle2 : health.state === "partial" ? Activity : CircleDashed;

  return (
    <section className="rounded-xl border border-primary/20 bg-card/70 px-4 py-3 shadow-sm" aria-label="Provider health strip">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/15 p-2"><ShieldCheck className="h-4 w-4 text-primary" /></div>
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">Core provider health</p>
            <p className="text-sm font-semibold text-foreground">{health.configuredCount}/{health.total} surfaces configured</p>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary"><StateIcon className="mr-1 h-3.5 w-3.5" />{stateLabel}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {health.providers.map(provider => (
            <span key={provider.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-2.5 py-1 text-xs text-muted-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${provider.configured ? "bg-emerald-400" : "bg-muted-foreground/50"}`} />
              {provider.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
