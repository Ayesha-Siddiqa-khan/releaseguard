import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Ban,
} from "lucide-react";

const statusConfig = {
  success: {
    label: "Success",
    icon: CheckCircle2,
    classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    classes: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  running: {
    label: "Running",
    icon: Clock,
    classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    classes: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
  rollback_logged: {
    label: "Rollback Logged",
    icon: AlertTriangle,
    classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  healthy: {
    label: "Healthy",
    icon: CheckCircle2,
    classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  degraded: {
    label: "Degraded",
    icon: AlertTriangle,
    classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  unknown: {
    label: "Unknown",
    icon: AlertTriangle,
    classes: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
} as const;

type StatusKey = keyof typeof statusConfig;

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status as StatusKey] || statusConfig.unknown;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.classes
      )}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {config.label}
    </span>
  );
}
