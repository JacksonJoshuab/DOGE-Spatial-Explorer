// DOGE Spatial Explorer — Items List Page
// Full CRUD table with search, status filter, pagination, and delete confirmation
// Uses tRPC for persistent backend storage

import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Search, Trash2, Pencil, Eye, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

type ItemRow = {
  id: number;
  slug: string;
  name: string;
  status: "draft" | "active" | "archived";
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ItemsList() {
  const [, navigate] = useLocation();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"draft" | "active" | "archived" | "">("");
  const [deleteTarget, setDeleteTarget] = useState<ItemRow | null>(null);

  const PAGE_SIZE = 8;
  const utils = trpc.useUtils();

  const { data, isLoading, error, refetch } = trpc.items.list.useQuery({
    page,
    pageSize: PAGE_SIZE,
    query,
    status: statusFilter,
  });

  const deleteMutation = trpc.items.delete.useMutation({
    onSuccess: () => {
      toast.success("Record deleted", {
        description: `"${deleteTarget?.name}" has been removed.`,
      });
      setDeleteTarget(null);
      utils.items.list.invalidate();
      utils.items.stats.invalidate();
    },
    onError: (err) => {
      toast.error("Delete failed", { description: err.message });
    },
  });

  const columns: Column<ItemRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div>
          <Link href={`/app/items/${row.slug}`}>
            <span className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
              {row.name}
            </span>
          </Link>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{row.slug}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
      className: "w-28",
    },
    {
      key: "updatedAt",
      header: "Last Updated",
      render: (row) => (
        <span className="text-sm text-muted-foreground font-mono">{formatDate(row.updatedAt)}</span>
      ),
      className: "w-36 hidden sm:table-cell",
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => (
        <span className="text-sm text-muted-foreground font-mono">{formatDate(row.createdAt)}</span>
      ),
      className: "w-36 hidden lg:table-cell",
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(`/app/items/${row.slug}`)}
            aria-label={`View ${row.name}`}
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-primary"
            onClick={() => navigate(`/app/items/${row.slug}/edit`)}
            aria-label={`Edit ${row.name}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteTarget(row)}
              aria-label={`Delete ${row.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
      className: "w-28",
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Records</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and track all intelligence records
          </p>
        </div>
        <Link href="/app/items/new">
          <Button size="sm" className="flex items-center gap-2 flex-shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Record</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search records…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-card border-border"
            aria-label="Search records"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => {
              setStatusFilter(v === "all" ? "" : (v as "draft" | "active" | "archived"));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36 bg-card border-border" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        cols={columns}
        rows={(data?.data ?? []) as ItemRow[]}
        loading={isLoading}
        error={error?.message ?? null}
        onRetry={() => refetch()}
        rowKey={(row) => row.slug}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onPageChange: setPage,
        }}
        emptyMessage="No records found"
        emptyDescription={
          query || statusFilter
            ? "Try clearing your search or filter."
            : "Create your first record to get started."
        }
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Record"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate({ slug: deleteTarget.slug }); }}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
