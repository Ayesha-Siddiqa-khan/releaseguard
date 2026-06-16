"use client";

import { useEffect, useState } from "react";
import { Server } from "lucide-react";
import { api } from "@/lib/api";
import { EnvironmentStatus } from "@/types";
import { EnvironmentCard } from "@/components/environment-card";
import { PageHeader } from "@/components/page-header";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";

export default function EnvironmentsPage() {
  const [environments, setEnvironments] = useState<EnvironmentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvironments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.environments.list();
      setEnvironments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load environments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironments();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Environment Status"
        description="Monitor health across all deployment environments"
        icon={Server}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-56" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEnvironments} />
      ) : environments.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No environments configured"
          description="Environment status will appear here once deployments are recorded."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {environments.map((env) => (
            <EnvironmentCard key={env.id} env={env} />
          ))}
        </div>
      )}
    </div>
  );
}
