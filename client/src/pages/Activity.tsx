// DOGE Spatial Explorer — Activity Page
// Audit log and recent system activity feed
// Design: Spatial Intelligence Command Center

import React from "react";
import { Activity as ActivityIcon, Clock, Database, Pencil, Trash2, Plus, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ActivityEntry = {
  id: string;
  action: "create" | "update" | "delete" | "login" | "view";
  resource: string;
  resourceId: string;
  user: string;
  timestamp: string;
};

const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: "a1", action: "login", resource: "Session", resourceId: "sess-001", user: "analyst@doge.gov", timestamp: "2026-04-02T10:00:00Z" },
  { id: "a2", action: "create", resource: "Record", resourceId: "i10", user: "analyst@doge.gov", timestamp: "2026-04-01T10:00:00Z" },
  { id: "a3", action: "update", resource: "Record", resourceId: "i5", user: "analyst@doge.gov", timestamp: "2026-03-30T09:00:00Z" },
  { id: "a4", action: "view", resource: "Record", resourceId: "i3", user: "analyst@doge.gov", timestamp: "2026-03-29T14:30:00Z" },
  { id: "a5", action: "delete", resource: "Record", resourceId: "i-old", user: "analyst@doge.gov", timestamp: "2026-03-28T11:15:00Z" },
  { id: "a6", action: "update", resource: "Record", resourceId: "i7", user: "analyst@doge.gov", timestamp: "2026-03-25T13:20:00Z" },
  { id: "a7", action: "create", resource: "Record", resourceId: "i9", user: "analyst@doge.gov", timestamp: "2026-03-31T08:45:00Z" },
  { id: "a8", action: "view", resource: "Record", resourceId: "i1", user: "analyst@doge.gov", timestamp: "2026-03-22T09:00:00Z" },
];

const ACTION_CONFIG: Record<ActivityEntry["action"], {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bg: string;
}> = {
  create: { icon: Plus, label: "Created", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  update: { icon: Pencil, label: "Updated", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  delete: { icon: Trash2, label: "Deleted", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
  login: { icon: LogIn, label: "Signed In", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  view: { icon: Database, label: "Viewed", color: "text-muted-foreground", bg: "bg-muted border-border" },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Activity() {
  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Audit trail of all system actions and events
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: MOCK_ACTIVITY.length, color: "text-foreground" },
          { label: "Creates", value: MOCK_ACTIVITY.filter(a => a.action === "create").length, color: "text-emerald-400" },
          { label: "Updates", value: MOCK_ACTIVITY.filter(a => a.action === "update").length, color: "text-primary" },
          { label: "Deletes", value: MOCK_ACTIVITY.filter(a => a.action === "delete").length, color: "text-destructive" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity feed */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Recent Events</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" aria-hidden="true" />

            <div className="space-y-0">
              {MOCK_ACTIVITY.map((entry, idx) => {
                const config = ACTION_CONFIG[entry.action];
                const Icon = config.icon;
                return (
                  <div key={entry.id} className="relative flex items-start gap-4 pl-12 py-3">
                    {/* Icon bubble */}
                    <div
                      className={`absolute left-2.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${config.bg}`}
                      aria-hidden="true"
                    >
                      <Icon className={`w-2.5 h-2.5 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0 border ${config.bg} ${config.color}`}
                        >
                          {config.label}
                        </Badge>
                        <span className="text-sm font-medium text-foreground">{entry.resource}</span>
                        <code className="text-xs font-mono text-muted-foreground">{entry.resourceId}</code>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground font-mono">{entry.user}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
