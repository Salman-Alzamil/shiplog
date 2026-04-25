const BASE = import.meta.env.VITE_API_URL ?? "";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...options.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface Project {
  id: number;
  repo_owner: string;
  repo_name: string;
  slug: string;
  webhook_url: string;
  webhook_secret: string;
}

export interface Entry {
  id: number;
  pr_number: number | null;
  pr_url: string | null;
  generated_title: string | null;
  generated_summary: string | null;
  category: "feature" | "fix" | "improvement";
  is_published: boolean;
  published_at: string | null;
}

export interface PublicChangelog {
  repo_owner: string;
  repo_name: string;
  entries: Entry[];
}

export interface BillingStatus {
  subscription_status: string;
  trial_days_remaining: number;
  is_active: boolean;
}

export const api = {
  projects: {
    list: () => request<Project[]>("/api/projects/"),
    create: (repo_owner: string, repo_name: string) =>
      request<Project>("/api/projects/", {
        method: "POST",
        body: JSON.stringify({ repo_owner, repo_name }),
      }),
    delete: (id: number) => request<void>(`/api/projects/${id}`, { method: "DELETE" }),
  },
  entries: {
    list: (projectId: number) => request<Entry[]>(`/api/projects/${projectId}/entries`),
    update: (id: number, patch: Partial<Entry>) =>
      request<Entry>(`/api/entries/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    delete: (id: number) => request<void>(`/api/entries/${id}`, { method: "DELETE" }),
  },
  public: {
    changelog: (slug: string) => request<PublicChangelog>(`/public/${slug}`),
  },
  billing: {
    status: () => request<BillingStatus>("/api/billing/status"),
    checkout: async () => {
      const { url } = await request<{ url: string }>("/api/billing/checkout", { method: "POST" });
      window.location.href = url;
    },
    portal: async () => {
      const { url } = await request<{ url: string }>("/api/billing/portal", { method: "POST" });
      window.location.href = url;
    },
  },
};
