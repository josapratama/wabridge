import { request } from "./base";

export interface AnalyticsSummary {
  totalSent: number;
  totalReceived: number;
  successRate: number;
  dailyStats: Array<{
    date: string;
    sent: number;
    received: number;
    failed: number;
  }>;
  statusBreakdown: Record<string, number>;
}

export interface UsageRecord {
  messagesSent: number;
  messagesReceived: number;
  quotaLimit: number;
  month: string;
}

export const analyticsApi = {
  summary: () => request<AnalyticsSummary>("/analytics/summary"),
  usage: () => request<UsageRecord>("/analytics/usage"),
};

// ── Team ──────────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  memberId: string;
  role: "admin" | "operator" | "viewer";
  invitedAt: string;
  acceptedAt?: string;
  memberEmail?: string;
  memberName?: string;
}

export const teamApi = {
  list: () => request<TeamMember[]>("/team"),
  invite: (email: string, role: string) =>
    request<TeamMember>("/team/invite", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),
  updateRole: (id: string, role: string) =>
    request<void>(`/team/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  remove: (id: string) => request<void>(`/team/${id}`, { method: "DELETE" }),
};

// ── Session Health ────────────────────────────────────────────────────────────

export interface SessionHealthLog {
  id: string;
  sessionId: string;
  status: "connected" | "disconnected" | "reconnecting";
  latencyMs?: number;
  messagesSentToday: number;
  messagesReceivedToday: number;
  checkedAt: string;
}

export const sessionHealthApi = {
  all: () => request<SessionHealthLog[]>("/session-health"),
  forSession: (sessionId: string) =>
    request<SessionHealthLog>(`/session-health/${sessionId}`),
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
