"use client";

import { Settings, ExternalLink, Github, Shield, Server } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Settings"
        description="Project configuration and system information"
        icon={Settings}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Repository</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Repository</span>
              <span className="text-sm font-mono">releaseguard</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Default Branch</span>
              <span className="text-sm font-mono">main</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CI/CD</span>
              <span className="text-sm">GitHub Actions</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Infrastructure</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cloud Provider</span>
              <span className="text-sm">AWS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Compute</span>
              <span className="text-sm">ECS Fargate</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Registry</span>
              <span className="text-sm">ECR</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">IaC</span>
              <span className="text-sm">Terraform</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Security</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Auth Method</span>
              <span className="text-sm">GitHub OIDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Secrets</span>
              <span className="text-sm">GitHub Secrets</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CORS</span>
              <span className="text-sm">Configured</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Links</h2>
          </div>
          <div className="space-y-3">
            <a
              href="/docs"
              className="flex items-center justify-between text-sm hover:text-primary transition-colors"
            >
              Documentation
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="/api/docs"
              className="flex items-center justify-between text-sm hover:text-primary transition-colors"
            >
              API Docs (Swagger)
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="/health"
              className="flex items-center justify-between text-sm hover:text-primary transition-colors"
            >
              Health Endpoint
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
