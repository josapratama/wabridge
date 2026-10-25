import { request } from "./base";

export interface AiBotConfig {
  isEnabled: boolean;
  provider: "gemini" | "openai" | "openrouter";
  apiKeyMasked: string;
  hasKey: boolean;
  model: string;
  systemPrompt: string;
  knowledgeBase?: string;
  handoverKeywords?: string[];
  handoverMessage?: string;
}

export const aiBotApi = {
  getConfig: () => request<AiBotConfig>("/ai-bot/config"),
  updateConfig: (body: {
    isEnabled?: boolean;
    provider?: "gemini" | "openai" | "openrouter";
    apiKey?: string;
    model?: string;
    systemPrompt?: string;
    knowledgeBase?: string;
    handoverKeywords?: string[];
    handoverMessage?: string;
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
};
