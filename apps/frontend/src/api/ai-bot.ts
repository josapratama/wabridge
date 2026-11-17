import { request } from "./base";

export interface AiBotConfig {
  isEnabled: boolean;
  provider: "gemini" | "openai" | "openrouter" | "deepseek";
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
}

export const aiBotApi = {
  getConfig: () => request<AiBotConfig>("/ai-bot/config"),
  updateConfig: (body: {
    isEnabled?: boolean;
    provider?: "gemini" | "openai" | "openrouter" | "deepseek";
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
};
