"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { RollbackLog } from "@/types";
import { RollbackLogCard } from "@/components/rollback-log-card";
import { PageHeader } from "@/components/page-header";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";

export default function RollbackPage() {
  const [logs, setLogs] = useState<RollbackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.rollbackLogs.list();
      setLogs(data.rollback_logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rollback logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Rollback Log"
        description="Documented rollback decisions and version changes"
        icon={RotateCcw}
      />

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-36" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No rollback logs"
          description="Rollback logs will appear here when deployments are rolled back."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {logs.map((log) => (
            <RollbackLogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
