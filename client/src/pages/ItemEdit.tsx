// DOGE Spatial Explorer — Edit Item Page
// Edit an existing record with pre-populated form
// Design: Spatial Intelligence Command Center

import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ItemForm from "@/components/ItemForm";
import InlineAlert from "@/components/InlineAlert";
import { apiGetItem, apiUpdateItem } from "@/lib/mockData";
import type { Item, ItemStatus } from "@/lib/types";

export default function ItemEdit() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    setLoadError(null);
    apiGetItem(params.id)
      .then(setItem)
      .catch((e: { message?: string }) => setLoadError(e?.message ?? "Record not found."))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (values: { name: string; status: ItemStatus }) => {
    if (!item) return;
    setIsSubmitting(true);
    setServerError(null);
    try {
      const updated = await apiUpdateItem(item.id, values);
      toast.success("Record updated", { description: `"${updated.name}" has been saved.` });
      navigate(`/app/items/${item.id}`);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setServerError(err?.message ?? "Failed to update record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (loadError || !item) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Record not found</p>
            <p className="text-xs text-muted-foreground mt-1">{loadError}</p>
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
    <div className="p-6 space-y-5 max-w-xl">
      {/* Back nav */}
      <Link href={`/app/items/${item.id}`}>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> {item.name}
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Edit Record</h1>
        <p className="text-sm text-muted-foreground mt-0.5 font-mono">{item.id}</p>
      </div>

      {serverError && (
        <InlineAlert
          variant="error"
          title="Update failed"
          description={serverError}
          onDismiss={() => setServerError(null)}
        />
      )}

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Record Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ItemForm
            mode="edit"
            initial={item}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/app/items/${item.id}`)}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
