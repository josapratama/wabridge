import { request } from "./base";

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
