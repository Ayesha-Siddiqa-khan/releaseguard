"use client";

import { useCallback, useEffect, useState } from "react";
import { GitBranch } from "lucide-react";
import { api } from "@/lib/api";
import { Deployment } from "@/types";
import { DeploymentTable } from "@/components/deployment-table";
import { PageHeader } from "@/components/page-header";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({ environment: "", status: "" });

  const fetchDeployments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filter.environment) params.environment = filter.environment;
      if (filter.status) params.status = filter.status;
      const data = await api.deployments.list(params);
      setDeployments(data.deployments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deployments");
    } finally {
      setLoading(false);
    }
  }, [filter.environment, filter.status]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Deployment History"
        description="Track all deployments across environments"
        icon={GitBranch}
      />

      <div className="flex items-center gap-3">
        <select
          value={filter.environment}
          onChange={(e) => setFilter({ ...filter, environment: e.target.value })}
          className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Environments</option>
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="development">Development</option>
        </select>

        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
          <option value="cancelled">Cancelled</option>
          <option value="rollback_logged">Rollback Logged</option>
        </select>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-96" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDeployments} />
      ) : deployments.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No deployments found"
          description="Deployments will appear here once they are triggered through GitHub Actions or created manually."
        />
      ) : (
        <DeploymentTable deployments={deployments} />
      )}
    </div>
  );
}
