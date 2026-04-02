// DOGE Spatial Explorer — StatusBadge
// Color-coded status indicators for Item records

import React from "react";
import type { ItemStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: ItemStatus;
  className?: string;
};

const STATUS_CONFIG: Record<ItemStatus, { label: string; classes: string; dot: string }> = {
  active: {
    label: "Active",
    classes: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  draft: {
    label: "Draft",
    classes: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    dot: "bg-amber-400",
  },
  archived: {
    label: "Archived",
    classes: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
    dot: "bg-slate-400",
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        config.classes,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dot)} aria-hidden="true" />
      {config.label}
    </span>
  );
}
