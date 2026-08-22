// DOGE Spatial Explorer — ItemForm
// Create/edit item with Zod validation and accessible form UX
// Design: Spatial Intelligence Command Center

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Item, ItemStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const itemSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or less"),
  status: z.enum(["draft", "active", "archived"] as const),
});

type ItemFormValues = z.infer<typeof itemSchema>;

type ItemFormProps = {
  mode: "create" | "edit";
  initial?: Partial<Item>;
  onSubmit: (values: ItemFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
};

export default function ItemForm({
  mode,
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: ItemFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setFocus,
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: initial?.name ?? "",
      status: (initial?.status as ItemStatus) ?? "draft",
    },
  });

  const statusValue = watch("status");

  // Focus first field on mount (accessibility)
  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={handleFormSubmit} noValidate className="space-y-5">
      {/* Name field */}
      <div className="space-y-1.5">
        <Label htmlFor="item-name" className="text-sm font-medium text-foreground">
          Name <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="item-name"
          placeholder="Enter item name…"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "item-name-error" : undefined}
          className="bg-input/50 border-border focus:border-primary"
          {...register("name")}
        />
        {errors.name && (
          <p id="item-name-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
            <span aria-hidden="true">⚠</span> {errors.name.message}
          </p>
        )}
      </div>

      {/* Status field */}
      <div className="space-y-1.5">
        <Label htmlFor="item-status" className="text-sm font-medium text-foreground">
          Status <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Select
          value={statusValue}
          onValueChange={(val) => setValue("status", val as ItemStatus, { shouldValidate: true })}
        >
          <SelectTrigger
            id="item-status"
            aria-required="true"
            className="bg-input/50 border-border"
          >
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && (
          <p role="alert" className="text-xs text-destructive">
            {errors.status.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 sm:flex-none"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {mode === "create" ? "Create Item" : "Save Changes"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
