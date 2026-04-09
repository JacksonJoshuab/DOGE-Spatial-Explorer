// DOGE Spatial Explorer — Edit Item Page
// Uses tRPC for persistent backend storage

import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ItemForm from "@/components/ItemForm";
import InlineAlert from "@/components/InlineAlert";
import { trpc } from "@/lib/trpc";

export default function ItemEdit() {
  const { id: slug } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: item, isLoading, error: loadError } = trpc.items.get.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  const updateMutation = trpc.items.update.useMutation({
    onSuccess: (updated) => {
      toast.success("Record updated", { description: `"${updated.name}" has been saved.` });
      utils.items.list.invalidate();
      utils.items.get.invalidate({ slug: updated.slug });
      navigate(`/app/items/${updated.slug}`);
    },
    onError: (err) => {
      setServerError(err.message);
    },
  });

  if (isLoading) {
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
            <p className="text-xs text-muted-foreground mt-1">{loadError?.message}</p>
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
      <Link href={`/app/items/${item.slug}`}>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> {item.name}
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Edit Record</h1>
        <p className="text-sm text-muted-foreground mt-0.5 font-mono">{item.slug}</p>
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
            initial={{ name: item.name, status: item.status }}
            onSubmit={(values) => {
              setServerError(null);
              updateMutation.mutate({
                slug: item.slug,
                ...values as { name: string; status: "draft" | "active" | "archived" },
              });
            }}
            onCancel={() => navigate(`/app/items/${item.slug}`)}
            isSubmitting={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
