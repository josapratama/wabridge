const BASE = "http://localhost:3000";

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
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};

  // Convert Headers object to plain object if needed
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only set Content-Type if there's a body
  if (options?.body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return res.json() as Promise<ApiResponse<T>>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export const authApi = {
  login: (body: any) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body: any) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  profile: () => request<User>("/auth/profile"),
};

// ── Provider Configs ──────────────────────────────────────────────────────────

export interface ProviderConfig {
  id: string;
  providerType: "meta-cloud" | "bsp" | "baileys";
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

export interface QrCodeResponse {
  qrCode?: string;
}

export interface PairingCodeResponse {
  pairingCode?: string;
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
  getQrCode: (id: string) =>
    request<QrCodeResponse>(`/provider-configs/${id}/qr`),
  requestPairingCode: (id: string, phoneNumber: string) =>
    request<PairingCodeResponse>(`/provider-configs/${id}/pairing-code`, {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    }),
};

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  name: string;
  providerType: "meta-cloud" | "bsp" | "baileys";
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
  providerType: "meta-cloud" | "bsp" | "baileys";
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

// ── Webhook Endpoints ─────────────────────────────────────────────────────────

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  webhookEndpointId: string;
  eventType: string;
  payload: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: string;
  durationMs?: number;
  attempt: number;
  success: boolean;
  createdAt: string;
}

export const webhookEndpointsApi = {
  list: () => request<WebhookEndpoint[]>("/webhook-endpoints"),
  create: (body: {
    name: string;
    url: string;
    secret?: string;
    events: string[];
  }) =>
    request<WebhookEndpoint>("/webhook-endpoints", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<WebhookEndpoint>) =>
    request<WebhookEndpoint>(`/webhook-endpoints/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<void>(`/webhook-endpoints/${id}`, { method: "DELETE" }),
  getLogs: (id: string) =>
    request<WebhookLog[]>(`/webhook-endpoints/${id}/logs`),
  getEvents: () => request<string[]>("/webhook-endpoints/events"),
};

// ── Message Templates ─────────────────────────────────────────────────────────

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export const messageTemplatesApi = {
  list: () => request<MessageTemplate[]>("/message-templates"),
  create: (body: { name: string; content: string }) =>
    request<MessageTemplate>("/message-templates", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<{ name: string; content: string }>) =>
    request<MessageTemplate>(`/message-templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<void>(`/message-templates/${id}`, { method: "DELETE" }),
  render: (id: string, variables: Record<string, string>) =>
    request<string>(`/message-templates/${id}/render`, {
      method: "POST",
      body: JSON.stringify({ variables }),
    }),
};

// ── Scheduled Messages ────────────────────────────────────────────────────────

export interface ScheduledMessage {
  id: string;
  sessionId: string;
  to: string;
  content: string;
  scheduledAt: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  messageId?: string;
  errorMessage?: string;
  createdAt: string;
}

export const scheduledMessagesApi = {
  list: () => request<ScheduledMessage[]>("/scheduled-messages"),
  create: (body: {
    sessionId: string;
    to: string;
    content: string;
    scheduledAt: string;
  }) =>
    request<ScheduledMessage>("/scheduled-messages", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  cancel: (id: string) =>
    request<ScheduledMessage>(`/scheduled-messages/${id}`, {
      method: "DELETE",
    }),
};

// ── Auto-reply Rules ──────────────────────────────────────────────────────────

export interface AutoReplyRule {
  id: string;
  sessionId?: string;
  name: string;
  matchType: "contains" | "exact" | "starts_with" | "regex";
  matchValue: string;
  replyContent: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export const autoReplyApi = {
  list: () => request<AutoReplyRule[]>("/auto-reply-rules"),
  create: (body: Omit<AutoReplyRule, "id" | "createdAt" | "updatedAt">) =>
    request<AutoReplyRule>("/auto-reply-rules", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<AutoReplyRule>) =>
    request<AutoReplyRule>(`/auto-reply-rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<void>(`/auto-reply-rules/${id}`, { method: "DELETE" }),
};

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  key?: string; // only present on creation
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export const apiKeysApi = {
  list: () => request<ApiKey[]>("/api-keys"),
  create: (body: { name: string; expiresAt?: string }) =>
    request<ApiKey>("/api-keys", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  revoke: (id: string) =>
    request<void>(`/api-keys/${id}`, { method: "DELETE" }),
};
