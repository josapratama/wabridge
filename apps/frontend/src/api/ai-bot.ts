import { request } from "./base";

export interface AiBotProfile {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  provider: "gemini" | "openai" | "openrouter" | "deepseek" | "grok";
  apiKey?: string;
  apiKeyMasked: string;
  hasKey: boolean;
  model: string;
  systemPrompt: string;
  knowledgeBase?: string;
  handoverKeywords?: string[];
  handoverMessage?: string;
  handoverDurationMinutes?: number;
  targetSessionIds?: string[];
  scheduleMode?: "always" | "after_hours";
  workHoursStart?: string;
  workHoursEnd?: string;
  workDays?: number[];
  temperature?: number;
  maxTokens?: number;
  contextWindow?: number;
  senderFilterMode?: "all" | "whitelist" | "blacklist";
  whitelistNumbers?: string[];
  blacklistNumbers?: string[];
  ignoreGroups?: boolean;
  sessionCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AiBotConfig = AiBotProfile;

export const aiBotApi = {
  // Profiles
  listProfiles: () => request<AiBotProfile[]>("/ai-bot/profiles"),
  getProfile: (id: string) => request<AiBotProfile>(`/ai-bot/profiles/${id}`),
  createProfile: (body: Partial<AiBotProfile>) =>
    request<AiBotProfile>("/ai-bot/profiles", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateProfile: (id: string, body: Partial<AiBotProfile>) =>
    request<AiBotProfile>(`/ai-bot/profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteProfile: (id: string) =>
    request<{ success: boolean }>(`/ai-bot/profiles/${id}`, {
      method: "DELETE",
    }),
  duplicateProfile: (id: string) =>
    request<AiBotProfile>(`/ai-bot/profiles/${id}/duplicate`, {
      method: "POST",
    }),
  toggleProfile: (id: string) =>
    request<AiBotProfile>(`/ai-bot/profiles/${id}/toggle`, {
      method: "PATCH",
    }),
  testProfile: (id: string, message: string) =>
    request<{ reply: string }>(`/ai-bot/profiles/${id}/test`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  // Legacy compatibility
  getConfig: () => request<AiBotConfig>("/ai-bot/config"),
  updateConfig: (body: Partial<AiBotProfile>) =>
    request<{ success: boolean; message: string }>("/ai-bot/config", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  testPrompt: (message: string) =>
    request<{ success: boolean; reply: string }>("/ai-bot/test", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  draftReply: (jid: string, message?: string) =>
    request<{ success: boolean; reply: string }>("/ai-bot/draft-reply", {
      method: "POST",
      body: JSON.stringify({ jid, message }),
    }),
  pauseJid: (jid: string, durationMinutes?: number) =>
    request<{ success: boolean; pausedUntil: number }>("/ai-bot/pause", {
      method: "POST",
      body: JSON.stringify({ jid, durationMinutes }),
    }),
  resumeJid: (jid: string) =>
    request<{ success: boolean; resumed: boolean }>("/ai-bot/resume", {
      method: "POST",
      body: JSON.stringify({ jid }),
    }),
  getJidStatus: (jid: string) =>
    request<{ isPaused: boolean; pausedUntil: number | null }>(
      `/ai-bot/status?jid=${encodeURIComponent(jid)}`,
    ),
  getStats: () =>
    request<{ totalReplies: number; lastReplyAt: string | null; isEnabled: boolean; provider: string; model: string }>(
      "/ai-bot/stats",
    ),
  parseDocument: (base64: string, filename: string) =>
    request<{ success: boolean; text: string; filename: string; length: number }>(
      "/ai-bot/parse-document",
      {
        method: "POST",
        body: JSON.stringify({ base64, filename }),
      },
    ),
};
