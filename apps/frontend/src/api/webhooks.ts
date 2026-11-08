import { request } from "./base";

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
  test: (id: string) =>
    request<{
      success: boolean;
      statusCode?: number;
      latencyMs: number;
      error?: string;
    }>(`/webhook-endpoints/${id}/test`, { method: "POST" }),
  getLogs: (id: string) =>
    request<WebhookLog[]>(`/webhook-endpoints/${id}/logs`),
  getAllLogs: () => request<WebhookLog[]>("/webhook-endpoints/logs/all"),
  retryLog: (logId: string) =>
    request<{ success: boolean; message: string }>(
      `/webhook-endpoints/logs/${logId}/retry`,
      { method: "POST" },
    ),
  getEvents: () => request<string[]>("/webhook-endpoints/events"),
};
