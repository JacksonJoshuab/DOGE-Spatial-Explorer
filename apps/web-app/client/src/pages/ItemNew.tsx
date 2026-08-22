// DOGE Spatial Explorer — New Item Page
// Uses tRPC for persistent backend storage

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ItemForm from "@/components/ItemForm";
import InlineAlert from "@/components/InlineAlert";
import { trpc } from "@/lib/trpc";

export default function ItemNew() {
  const [, navigate] = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const createMutation = trpc.items.create.useMutation({
    onSuccess: (item) => {
      toast.success("Record created", { description: `"${item.name}" has been saved.` });
      utils.items.list.invalidate();
      utils.items.stats.invalidate();
      navigate(`/app/items/${item.slug}`);
    },
    onError: (err) => {
      setServerError(err.message);
    },
  });

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
            onSubmit={(values) => {
              setServerError(null);
              createMutation.mutate(values as { name: string; status: "draft" | "active" | "archived" });
            }}
            onCancel={() => navigate("/app/items")}
            isSubmitting={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
