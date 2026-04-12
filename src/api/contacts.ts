import { request } from "./base";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const contactsApi = {
  list: (tag?: string) =>
    request<Contact[]>(`/contacts${tag ? `?tag=${tag}` : ""}`),
  create: (body: {
    name: string;
    phone: string;
    tags?: string[];
    notes?: string;
  }) =>
    request<Contact>("/contacts", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<Contact>) =>
    request<Contact>(`/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<void>(`/contacts/${id}`, { method: "DELETE" }),
};

// ── Broadcast ─────────────────────────────────────────────────────────────────

export interface BroadcastJob {
  id: string;
  name: string;
  sessionId: string;
  content: string;
  recipients: string[];
  delayMs: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  totalCount: number;
  sentCount: number;
  failedCount: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export const broadcastApi = {
  list: () => request<BroadcastJob[]>("/broadcasts"),
  create: (body: {
    name: string;
    sessionId: string;
    content: string;
    recipients: string[];
    delayMs?: number;
  }) =>
    request<BroadcastJob>("/broadcasts", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  start: (id: string) =>
    request<BroadcastJob>(`/broadcasts/${id}/start`, { method: "POST" }),
  cancel: (id: string) =>
    request<BroadcastJob>(`/broadcasts/${id}`, { method: "DELETE" }),
};
