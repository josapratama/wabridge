import { request } from "./base";

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
