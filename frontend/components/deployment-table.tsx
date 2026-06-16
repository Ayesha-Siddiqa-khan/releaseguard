"use client";

import Link from "next/link";
import { Deployment } from "@/types";
import { StatusBadge } from "./status-badge";
import { formatDate, formatDuration } from "@/lib/utils";
import { GitBranch, ExternalLink } from "lucide-react";

interface DeploymentTableProps {
  deployments: Deployment[];
}

export function DeploymentTable({ deployments }: DeploymentTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                Status
              </th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                Environment
              </th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                Branch
              </th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                Commit
              </th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                Triggered By
              </th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                Duration
              </th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                Date
              </th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((deployment) => (
              <tr
                key={deployment.id}
                className="border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3.5">
                  <StatusBadge status={deployment.status} />
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm capitalize font-medium">{deployment.environment}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-sm font-mono truncate max-w-[120px]">
                      {deployment.branch || "—"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    {deployment.commit_sha
                      ? deployment.commit_sha.slice(0, 7)
                      : "—"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-muted-foreground">{deployment.triggered_by}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-mono tabular-nums">
                    {formatDuration(deployment.duration_seconds)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(deployment.created_at)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    href={`/deployments/${deployment.id}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
