"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  GitBranch,
  GitCommit,
  Clock,
  User,
  FileText,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Deployment } from "@/types";
import { StatusBadge } from "@/components/status-badge";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/error-state";
import { formatDate, formatDuration } from "@/lib/utils";

export default function DeploymentDetailPage() {
  const params = useParams();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDeployment = async () => {
      try {
        const data = await api.deployments.get(params.id as string);
        setDeployment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load deployment");
      } finally {
        setLoading(false);
      }
    };
    fetchDeployment();
  }, [params.id]);

  const copyId = () => {
    if (deployment) {
      navigator.clipboard.writeText(deployment.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <LoadingSkeleton className="h-96 m-6" />;
  if (error) return <ErrorState message={error} />;
  if (!deployment) return <ErrorState message="Deployment not found" />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/deployments"
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Deployment Details
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground font-mono">{deployment.id}</p>
            <button
              onClick={copyId}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
        <StatusBadge status={deployment.status} size="md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold">Overview</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Environment</span>
              <span className="text-sm font-medium capitalize px-2.5 py-1 rounded-md bg-muted/50">
                {deployment.environment}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Application</span>
              <span className="text-sm font-medium">{deployment.app_name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="text-sm font-mono tabular-nums">
                {formatDuration(deployment.duration_seconds)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Triggered By</span>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm">{deployment.triggered_by}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold">Source</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GitBranch className="w-4 h-4" />
                Branch
              </div>
              <span className="text-sm font-mono">{deployment.branch || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GitCommit className="w-4 h-4" />
                Commit
              </div>
              <span className="text-sm font-mono bg-muted/50 px-2 py-0.5 rounded">
                {deployment.commit_sha || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="w-4 h-4" />
                GitHub Run
              </div>
              <span className="text-sm font-mono">
                {deployment.github_run_id || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">App Name</span>
              <span className="text-sm font-medium">{deployment.app_name}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Release Notes</h2>
          </div>
          {deployment.release_note ? (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/20 rounded-lg p-4">
              {deployment.release_note}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic bg-muted/20 rounded-lg p-4">
              No release notes provided
            </p>
          )}
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Timeline</h2>
          </div>
          <div className="relative pl-4 space-y-0">
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
            <div className="relative flex items-start gap-4 pb-6">
              <div className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-primary bg-background" />
              <div>
                <p className="text-sm font-medium">Deployment created</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(deployment.created_at)}
                </p>
              </div>
            </div>
            <div className="relative flex items-start gap-4">
              <div className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-muted-foreground bg-background" />
              <div>
                <p className="text-sm font-medium">Last updated</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(deployment.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
