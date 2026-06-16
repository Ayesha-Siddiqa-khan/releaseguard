export interface Deployment {
  id: string;
  app_name: string;
  environment: "staging" | "production" | "development";
  status: "success" | "failed" | "running" | "cancelled" | "rollback_logged";
  commit_sha: string | null;
  branch: string | null;
  github_run_id: string | null;
  triggered_by: string;
  release_note: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface RollbackLog {
  id: string;
  deployment_id: string;
  previous_version: string;
  target_version: string;
  reason: string;
  logged_by: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

export interface EnvironmentStatus {
  id: string;
  environment: string;
  frontend_status: string;
  backend_status: string;
  database_status: string;
  current_version: string;
  last_checked_at: string;
}

export interface StatusSummary {
  total_deployments: number;
  successful_deployments: number;
  failed_deployments: number;
  running_deployments: number;
  latest_deployment: {
    id: string;
    status: string;
    environment: string;
    created_at: string;
  } | null;
  current_production_version: string | null;
  current_staging_version: string | null;
  environments: {
    environment: string;
    frontend_status: string;
    backend_status: string;
    database_status: string;
    current_version: string;
    last_checked_at: string;
  }[];
}

export interface HealthResponse {
  status: string;
  service: string;
  database: string;
  version: string;
  timestamp: string;
}
