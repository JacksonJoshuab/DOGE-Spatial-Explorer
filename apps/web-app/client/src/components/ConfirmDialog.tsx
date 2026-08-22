// DOGE Spatial Explorer — ConfirmDialog
// Accessible destructive confirmation dialog
// WAI-ARIA modal: focus trap, Escape closes, focus returns to invoker

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  variant?: "destructive" | "default";
};

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isLoading,
  variant = "destructive",
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o && onCancel) onCancel(); }}>
      <AlertDialogContent className="bg-card border-border max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {variant === "destructive" && (
              <div className="w-9 h-9 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
            )}
            <AlertDialogTitle className="text-foreground">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground text-sm">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            disabled={isLoading}
            className="border-border"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
