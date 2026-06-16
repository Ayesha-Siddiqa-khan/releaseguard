import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

interface HealthIndicatorProps {
  status: string;
  label: string;
  showLabel?: boolean;
}

const statusColors: Record<string, string> = {
  healthy: "text-emerald-400",
  connected: "text-emerald-400",
  degraded: "text-amber-400",
  unhealthy: "text-red-400",
  disconnected: "text-red-400",
  unknown: "text-zinc-400",
};

export function HealthIndicator({
  status,
  label,
  showLabel = true,
}: HealthIndicatorProps) {
  const colorClass = statusColors[status] || statusColors.unknown;

  return (
    <div className="flex items-center gap-2">
      <Circle
        className={cn("w-2 h-2 fill-current", colorClass)}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {label}: <span className="text-foreground capitalize">{status}</span>
        </span>
      )}
    </div>
  );
}
