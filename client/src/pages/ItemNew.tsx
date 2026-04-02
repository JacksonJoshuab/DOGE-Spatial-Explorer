// DOGE Spatial Explorer — New Item Page
// Create a new record with form validation
// Design: Spatial Intelligence Command Center

import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ItemForm from "@/components/ItemForm";
import InlineAlert from "@/components/InlineAlert";
import { apiCreateItem } from "@/lib/mockData";
import type { ItemStatus } from "@/lib/types";

export default function ItemNew() {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (values: { name: string; status: ItemStatus }) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const item = await apiCreateItem(values);
      toast.success("Record created", { description: `"${item.name}" has been added.` });
      navigate(`/app/items/${item.id}`);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setServerError(err?.message ?? "Failed to create record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-xl">
      {/* Back nav */}
      <Link href="/app/items">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Records
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">New Record</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Add a new intelligence record to the system
        </p>
      </div>

      {serverError && (
        <InlineAlert
          variant="error"
          title="Creation failed"
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
            mode="create"
            onSubmit={handleSubmit}
            onCancel={() => navigate("/app/items")}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
