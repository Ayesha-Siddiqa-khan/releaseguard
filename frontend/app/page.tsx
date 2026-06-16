"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  GitBranch,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { StatusSummary, HealthResponse } from "@/types";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { EnvironmentCard } from "@/components/environment-card";
import { HealthIndicator } from "@/components/health-indicator";
import { PageHeader } from "@/components/page-header";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
import { formatRelativeTime } from "@/lib/utils";

export default function DashboardPage() {
  const [summary, setSummary] = useState<StatusSummary | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, healthData] = await Promise.all([
        api.summary(),
        api.health(),
      ]);
      setSummary(summaryData);
      setHealth(healthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const successRate =
    summary && summary.total_deployments > 0
      ? Math.round(
          (summary.successful_deployments / summary.total_deployments) * 100
        )
      : 0;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Command Center"
        description="Real-time deployment and service health overview"
        icon={LayoutDashboard}
        actions={
          health && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-border bg-card/80 backdrop-blur-sm">
              <HealthIndicator status={health.status} label="API" />
              <div className="w-px h-4 bg-border" />
              <HealthIndicator status={health.database} label="DB" />
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Deployments"
          value={summary?.total_deployments ?? 0}
          icon={GitBranch}
          accent="default"
        />
        <MetricCard
          title="Successful"
          value={summary?.successful_deployments ?? 0}
          icon={CheckCircle2}
          subtitle={`${successRate}% success rate`}
          accent="success"
        />
        <MetricCard
          title="Failed"
          value={summary?.failed_deployments ?? 0}
          icon={XCircle}
          subtitle="Requires attention"
          accent="danger"
        />
        <MetricCard
          title="Running"
          value={summary?.running_deployments ?? 0}
          icon={Clock}
          subtitle="In progress"
          accent="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Latest Deployment</h2>
          </div>
          {summary?.latest_deployment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={summary.latest_deployment.status} size="md" />
                <span className="text-xs text-muted-foreground capitalize px-2.5 py-1 rounded-md bg-muted/50">
                  {summary.latest_deployment.environment}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="font-mono">ID: {summary.latest_deployment.id.slice(0, 8)}...</span>
                <span>{formatRelativeTime(summary.latest_deployment.created_at)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No deployments yet</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Current Versions</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted-foreground">Production</span>
              </div>
              <span className="text-sm font-mono font-medium">
                {summary?.current_production_version ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs text-muted-foreground">Staging</span>
              </div>
              <span className="text-sm font-mono font-medium">
                {summary?.current_staging_version ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Environments</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary?.environments.map((env) => (
            <EnvironmentCard
              key={env.environment}
              env={{
                id: env.environment,
                ...env,
                last_checked_at: env.last_checked_at,
              }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">System Health</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">API Status</p>
            <StatusBadge status={health?.status ?? "unknown"} size="md" />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Database</p>
            <StatusBadge
              status={health?.database === "connected" ? "healthy" : "failed"}
              size="md"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Version</p>
            <span className="text-sm font-mono font-medium">{health?.version ?? "—"}</span>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Checked</p>
            <span className="text-sm">
              {health?.timestamp ? formatRelativeTime(health.timestamp) : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
