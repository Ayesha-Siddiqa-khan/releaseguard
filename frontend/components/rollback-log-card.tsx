import { RollbackLog } from "@/types";
import { StatusBadge } from "./status-badge";
import { formatDate } from "@/lib/utils";
import { RotateCcw, User, ArrowRight } from "lucide-react";

interface RollbackLogCardProps {
  log: RollbackLog;
}

export function RollbackLogCard({ log }: RollbackLogCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10">
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">{log.previous_version}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="text-sm font-mono">{log.target_version}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={log.status} />
      </div>

      <p className="text-sm text-muted-foreground">{log.reason}</p>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="w-3 h-3" />
          {log.logged_by}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(log.created_at)}
        </span>
      </div>
    </div>
  );
}
