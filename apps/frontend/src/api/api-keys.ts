import { request } from "./base";

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

export interface IpWhitelist {
  id: string;
  apiKeyId: string;
  cidr: string;
  label?: string;
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

export const ipWhitelistApi = {
  list: (apiKeyId: string) =>
    request<IpWhitelist[]>(`/api-keys/${apiKeyId}/ip-whitelist`),
  add: (apiKeyId: string, cidr: string, label?: string) =>
    request<IpWhitelist>(`/api-keys/${apiKeyId}/ip-whitelist`, {
      method: "POST",
      body: JSON.stringify({ cidr, label }),
    }),
  remove: (apiKeyId: string, id: string) =>
    request<void>(`/api-keys/${apiKeyId}/ip-whitelist/${id}`, {
      method: "DELETE",
    }),
};

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
