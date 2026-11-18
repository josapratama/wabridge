import { request } from "./base";

export interface AiBotConfig {
  isEnabled: boolean;
  provider: "gemini" | "openai" | "openrouter" | "deepseek" | "grok";
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
}

export const aiBotApi = {
  getConfig: () => request<AiBotConfig>("/ai-bot/config"),
  updateConfig: (body: {
    isEnabled?: boolean;
    provider?: "gemini" | "openai" | "openrouter" | "deepseek" | "grok";
    apiKey?: string;
    model?: string;
    systemPrompt?: string;
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
  }) =>
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
    request<{ isPaused: boolean; pausedUntil: number | null }>(`/ai-bot/status?jid=${encodeURIComponent(jid)}`),
  getStats: () =>
    request<{ totalReplies: number; lastReplyAt: string | null; isEnabled: boolean; provider: string; model: string }>("/ai-bot/stats"),
  parseDocument: (base64: string, filename: string) =>
    request<{ success: boolean; text: string; filename: string; length: number }>("/ai-bot/parse-document", {
      method: "POST",
      body: JSON.stringify({ base64, filename }),
    }),
};
