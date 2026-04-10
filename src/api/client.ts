const BASE = "/api";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  error: { code: string; details: unknown } | null;
  timestamp: string;
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  return res.json() as Promise<ApiResponse<T>>;
}

// ── Provider Configs ──────────────────────────────────────────────────────────

export interface ProviderConfig {
  id: string;
  providerType: "meta-cloud" | "bsp";
  name: string;
  baseUrl?: string;
  apiVersion?: string;
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
  verifyToken?: string;
  webhookSecret?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const providerConfigsApi = {
  list: () => request<ProviderConfig[]>("/provider-configs"),
  get: (id: string) => request<ProviderConfig>(`/provider-configs/${id}`),
  create: (body: Partial<ProviderConfig>) =>
    request<ProviderConfig>("/provider-configs", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<ProviderConfig>) =>
    request<ProviderConfig>(`/provider-configs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  activate: (id: string) =>
    request<ProviderConfig>(`/provider-configs/${id}/activate`, {
      method: "PATCH",
    }),
  deactivate: (id: string) =>
    request<ProviderConfig>(`/provider-configs/${id}/deactivate`, {
      method: "PATCH",
    }),
};

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  name: string;
  providerType: "meta-cloud" | "bsp";
  providerConfigId: string;
  status: "active" | "inactive";
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const sessionsApi = {
  list: () => request<Session[]>("/sessions"),
  get: (id: string) => request<Session>(`/sessions/${id}`),
  create: (body: { name: string; providerConfigId: string }) =>
    request<Session>("/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  activate: (id: string) =>
    request<Session>(`/sessions/${id}/activate`, { method: "PATCH" }),
  deactivate: (id: string) =>
    request<Session>(`/sessions/${id}/deactivate`, { method: "PATCH" }),
};

// ── Messages ──────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  sessionId: string;
  externalMessageId?: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  type: "text";
  content: string;
  status: "queued" | "sent" | "delivered" | "read" | "failed" | "received";
  createdAt: string;
  updatedAt: string;
}

export const messagesApi = {
  list: () => request<Message[]>("/messages"),
  get: (id: string) => request<Message>(`/messages/${id}`),
  send: (body: { sessionId: string; to: string; message: string }) =>
    request<Message>("/messages/send", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ── Events ────────────────────────────────────────────────────────────────────

export interface ProviderEvent {
  id: string;
  sessionId?: string;
  providerType: "meta-cloud" | "bsp";
  eventType: string;
  payload: Record<string, unknown>;
  processed: boolean;
  createdAt: string;
}

export const eventsApi = {
  list: () => request<ProviderEvent[]>("/events"),
  get: (id: string) => request<ProviderEvent>(`/events/${id}`),
};

// ── Health ────────────────────────────────────────────────────────────────────

export interface HealthResult {
  status: "ok" | "degraded";
  uptime: number;
  providers: Array<{
    healthy: boolean;
    providerType: string;
    message: string;
    latencyMs?: number;
  }>;
}

export const healthApi = {
  check: () => request<HealthResult>("/health"),
};
