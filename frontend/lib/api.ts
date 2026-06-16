const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  health: () => fetchAPI<import("@/types").HealthResponse>("/health"),

  summary: () => fetchAPI<import("@/types").StatusSummary>("/api/status/summary"),

  deployments: {
    list: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return fetchAPI<{ deployments: import("@/types").Deployment[]; total: number }>(
        `/api/deployments${query}`
      );
    },
    get: (id: string) =>
      fetchAPI<import("@/types").Deployment>(`/api/deployments/${id}`),
    create: (data: Record<string, unknown>) =>
      fetchAPI<import("@/types").Deployment>("/api/deployments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      fetchAPI<import("@/types").Deployment>(`/api/deployments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  environments: {
    list: () =>
      fetchAPI<import("@/types").EnvironmentStatus[]>("/api/environments"),
    get: (env: string) =>
      fetchAPI<import("@/types").EnvironmentStatus>(`/api/environments/${env}`),
  },

  rollbackLogs: {
    list: () =>
      fetchAPI<{ rollback_logs: import("@/types").RollbackLog[]; total: number }>(
        "/api/rollback-logs"
      ),
    create: (data: Record<string, unknown>) =>
      fetchAPI<import("@/types").RollbackLog>("/api/rollback-logs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  seed: () =>
    fetchAPI<{ message: string }>("/api/seed", { method: "POST" }),
};
