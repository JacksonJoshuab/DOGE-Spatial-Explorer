// DOGE Spatial Explorer — Items List Page
// Full CRUD table with search, status filter, pagination, and delete confirmation
// Design: Spatial Intelligence Command Center

import React, { useState, useEffect, useCallback } from "react";
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
import { apiGetItems, apiDeleteItem } from "@/lib/mockData";
import type { Item, ItemStatus } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ItemsList() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "">("");
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const PAGE_SIZE = 8;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetItems({ page, pageSize: PAGE_SIZE, query, status: statusFilter });
      setItems(res.data);
      setTotal(res.total);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? "Failed to load items.");
    } finally {
      setLoading(false);
    }
  }, [page, query, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiDeleteItem(deleteTarget.id);
      toast.success("Record deleted", { description: `"${deleteTarget.name}" has been removed.` });
      setDeleteTarget(null);
      fetchItems();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error("Delete failed", { description: err?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Item>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div>
          <Link href={`/app/items/${row.id}`}>
            <a className="font-medium text-foreground hover:text-primary transition-colors">
              {row.name}
            </a>
          </Link>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{row.id}</p>
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
            onClick={() => navigate(`/app/items/${row.id}`)}
            aria-label={`View ${row.name}`}
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-primary"
            onClick={() => navigate(`/app/items/${row.id}/edit`)}
            aria-label={`Edit ${row.name}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteTarget(row)}
            aria-label={`Delete ${row.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
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
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-card border-border"
            aria-label="Search records"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => setStatusFilter(v === "all" ? "" : (v as ItemStatus))}
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
        rows={items}
        loading={loading}
        error={error}
        onRetry={fetchItems}
        rowKey={(row) => row.id}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total,
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
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
