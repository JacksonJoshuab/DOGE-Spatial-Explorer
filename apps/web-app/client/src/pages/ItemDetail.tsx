// DOGE Spatial Explorer — Item Detail Page
// Uses tRPC for persistent backend storage

import React, { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

function formatDateTime(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ItemDetail() {
  const { id: slug } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [showDelete, setShowDelete] = useState(false);
  const utils = trpc.useUtils();

  const { data: item, isLoading, error } = trpc.items.get.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  const deleteMutation = trpc.items.delete.useMutation({
    onSuccess: () => {
      toast.success("Record deleted");
      utils.items.list.invalidate();
      utils.items.stats.invalidate();
      navigate("/app/items");
    },
    onError: (err) => {
      toast.error("Delete failed", { description: err.message });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Record not found</p>
            <p className="text-xs text-muted-foreground mt-1">{error?.message}</p>
          </div>
          <Link href="/app/items">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Records
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Back nav */}
      <Link href="/app/items">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Records
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={item.status} />
            <span className="text-xs text-muted-foreground font-mono">{item.slug}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight break-words">
            {item.name}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/app/items/${item.slug}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </Link>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Details card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Record Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-0">
          {[
            { label: "Record ID", value: item.slug, mono: true },
            { label: "Name", value: item.name },
            { label: "Status", value: <StatusBadge status={item.status} /> },
            { label: "Owner ID", value: item.ownerId, mono: true },
            { label: "Created", value: formatDateTime(item.createdAt), mono: true },
            { label: "Last Updated", value: formatDateTime(item.updatedAt), mono: true },
          ].map((field, i) => (
            <React.Fragment key={field.label}>
              {i > 0 && <Separator className="my-0 opacity-50" />}
              <div className="flex items-start justify-between py-3 gap-4">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-32 flex-shrink-0">
                  {field.label}
                </span>
                <span className={`text-sm text-foreground text-right ${field.mono ? "font-mono" : ""}`}>
                  {field.value}
                </span>
              </div>
            </React.Fragment>
          ))}
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <ConfirmDialog
        open={showDelete}
        title="Delete Record"
        description={`Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate({ slug: item.slug })}
        onCancel={() => setShowDelete(false)}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
