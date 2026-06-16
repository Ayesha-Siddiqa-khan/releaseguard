import { EnvironmentStatus } from "@/types";
import { HealthIndicator } from "./health-indicator";
import { formatDate } from "@/lib/utils";
import { Server, Clock } from "lucide-react";

interface EnvironmentCardProps {
  env: EnvironmentStatus;
}

export function EnvironmentCard({ env }: EnvironmentCardProps) {
  const overallHealth =
    env.frontend_status === "healthy" &&
    env.backend_status === "healthy" &&
    env.database_status === "healthy"
      ? "healthy"
      : env.frontend_status === "unknown" &&
        env.backend_status === "unknown" &&
        env.database_status === "unknown"
      ? "unknown"
      : "degraded";

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 transition-all hover:border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Server className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold capitalize">{env.environment}</h3>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              {env.current_version}
            </p>
          </div>
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            overallHealth === "healthy"
              ? "bg-emerald-400"
              : overallHealth === "degraded"
              ? "bg-amber-400"
              : "bg-zinc-400"
          }`}
        />
      </div>

      <div className="space-y-2.5 pl-1">
        <HealthIndicator status={env.frontend_status} label="Frontend" />
        <HealthIndicator status={env.backend_status} label="Backend" />
        <HealthIndicator status={env.database_status} label="Database" />
      </div>

      <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground">
          {formatDate(env.last_checked_at)}
        </p>
      </div>
    </div>
  );
}
