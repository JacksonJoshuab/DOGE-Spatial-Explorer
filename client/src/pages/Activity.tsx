// DOGE Spatial Explorer — Activity Log Page
// Displays the persistent audit trail from the database

import { useState } from "react";
import { Activity as ActivityIcon, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, RefreshCw, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";

type ActionFilter = "create" | "update" | "delete" | "all";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  update: "bg-primary/15 text-primary border-primary/30",
  delete: "bg-destructive/15 text-destructive border-destructive/30",
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="w-3 h-3" />,
  update: <Pencil className="w-3 h-3" />,
  delete: <Trash2 className="w-3 h-3" />,
};

const ACTION_LABELS: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
};

function parseChanges(changesJson: string | null): React.ReactNode {
  if (!changesJson) return null;
  try {
    const changes = JSON.parse(changesJson) as Record<string, { from: unknown; to: unknown }>;
    const entries = Object.entries(changes).filter(([, v]) => v.from !== null || v.to !== null);
    if (entries.length === 0) return null;
    return (
      <div className="mt-1 space-y-0.5">
        {entries.map(([field, { from, to }]) => (
          <div key={field} className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-muted-foreground">{field}:</span>
            {from !== null && (
              <>
                <span className="text-destructive/70 line-through">{String(from)}</span>
                <span className="text-muted-foreground">→</span>
              </>
            )}
            {to !== null && <span className="text-emerald-400">{String(to)}</span>}
          </div>
        ))}
      </div>
    );
  } catch {
    return null;
  }
}

export default function Activity() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const PAGE_SIZE = 20;

  const { data, isLoading, refetch, isFetching } = trpc.activity.list.useQuery(
    { page, pageSize: PAGE_SIZE, action: actionFilter === "all" ? "" : actionFilter },
    { refetchInterval: 30_000 } // auto-refresh every 30s
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const entries = data?.data ?? [];

  const creates = entries.filter((e) => e.action === "create").length;
  const updates = entries.filter((e) => e.action === "update").length;
  const deletes = entries.filter((e) => e.action === "delete").length;

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Activity Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Persistent audit trail of all create, update, and delete actions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: data?.total ?? "—", color: "text-foreground" },
          { label: "Creates", value: creates, color: "text-emerald-400" },
          { label: "Updates", value: updates, color: "text-primary" },
          { label: "Deletes", value: deletes, color: "text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <Select
          value={actionFilter}
          onValueChange={(v) => {
            setActionFilter(v as ActionFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
        {actionFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => {
              setActionFilter("all");
              setPage(1);
            }}
          >
            Clear filter
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Auto-refreshes every 30s
        </span>
      </div>

      {/* Audit log entries */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-primary" />
            Audit Trail
            {data && (
              <Badge variant="outline" className="ml-auto text-xs font-mono">
                {data.total} events
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Loading audit log...
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center">
              <ActivityIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Create, edit, or delete a record to see entries here.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[2.35rem] top-0 bottom-0 w-px bg-border" aria-hidden="true" />
              <div className="divide-y divide-border">
                {entries.map((entry) => (
                  <div key={entry.id} className="relative flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    {/* Action icon bubble */}
                    <div
                      className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border z-10 ${ACTION_COLORS[entry.action] ?? "bg-muted border-border text-muted-foreground"}`}
                    >
                      {ACTION_ICONS[entry.action] ?? <ActivityIcon className="w-3 h-3" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pl-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0 ${ACTION_COLORS[entry.action] ?? ""}`}
                        >
                          {ACTION_LABELS[entry.action] ?? entry.action}
                        </Badge>
                        <span className="text-sm font-medium text-foreground truncate">
                          {entry.resourceName ?? entry.resourceId}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          [{entry.resourceType}/{entry.resourceId}]
                        </span>
                      </div>

                      {/* Actor + context */}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by{" "}
                        <span className="text-foreground/80 font-medium">
                          {entry.actorName ?? entry.actorId}
                        </span>
                        {entry.context && (
                          <>
                            {" "}
                            ·{" "}
                            <span className="italic">{entry.context}</span>
                          </>
                        )}
                      </p>

                      {/* Changed fields */}
                      {parseChanges(entry.changes)}
                    </div>

                    {/* Timestamp */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-muted-foreground/50 font-mono mt-0.5">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
