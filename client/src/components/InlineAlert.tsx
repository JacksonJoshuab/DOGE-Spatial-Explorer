// DOGE Spatial Explorer — InlineAlert
// Inline success/error/warning/info messaging

import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "success" | "error" | "warning" | "info";

type InlineAlertProps = {
  variant: AlertVariant;
  title: string;
  description?: string;
  onDismiss?: () => void;
  className?: string;
};

const VARIANT_CONFIG: Record<AlertVariant, {
  icon: React.ComponentType<{ className?: string }>;
  classes: string;
}> = {
  success: {
    icon: CheckCircle2,
    classes: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  },
  error: {
    icon: AlertCircle,
    classes: "bg-destructive/10 border-destructive/30 text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    classes: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  },
  info: {
    icon: Info,
    classes: "bg-primary/10 border-primary/30 text-primary",
  },
};

export default function InlineAlert({
  variant,
  title,
  description,
  onDismiss,
  className,
}: InlineAlertProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-lg border text-sm",
        config.classes,
        className
      )}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-xs opacity-80 mt-0.5">{description}</p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
