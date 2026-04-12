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
  getLogs: (id: string) =>
    request<WebhookLog[]>(`/webhook-endpoints/${id}/logs`),
  getEvents: () => request<string[]>("/webhook-endpoints/events"),
};
