import { Injectable, Inject, Optional } from "@nestjs/common";
import { AppLogger } from "../../common/logger/app.logger";
import { MessageRepository } from "../../repositories/interfaces";
import * as fs from "fs";
import * as path from "path";

export interface AiBotConfig {
  isEnabled: boolean;
  provider: "gemini" | "openai" | "openrouter" | "deepseek";
  apiKey: string;
  model: string;
  systemPrompt: string;
  knowledgeBase?: string;
  handoverKeywords?: string[];
  handoverMessage?: string;
  handoverDurationMinutes?: number; // default: 120
  targetSessionIds?: string[]; // empty array or undefined = all sessions
  scheduleMode?: "always" | "after_hours";
  workHoursStart?: string; // e.g. "08:00"
  workHoursEnd?: string; // e.g. "17:00"
  workDays?: number[]; // [1,2,3,4,5] (1=Monday ... 7=Sunday)
  temperature?: number; // 0.1 - 1.0 (default: 0.7)
  maxTokens?: number; // default: 500
  contextWindow?: number; // default: 8
}

export type AiBotConfigResponse = Omit<AiBotConfig, "apiKey"> & {
  apiKeyMasked: string;
  hasKey: boolean;
};

const DEFAULT_CONFIG: AiBotConfig = {
  isEnabled: false,
  provider: "gemini",
  apiKey: "",
  model: "gemini-2.0-flash",
  systemPrompt:
    "Anda adalah asisten virtual WhatsApp yang ramah, profesional, dan membantu. Jawab pertanyaan pengguna dengan jelas, sopan, dan ringkas dalam Bahasa Indonesia.",
  knowledgeBase: "",
  handoverKeywords: ["cs", "admin", "human", "manusia", "bantuan", "operator"],
  handoverMessage:
    "Baik kak, pesan Anda telah dialihkan ke Tim Customer Service (Manusia). Mohon tunggu sebentar ya kak.",
  handoverDurationMinutes: 120,
  targetSessionIds: [],
  scheduleMode: "always",
  workHoursStart: "08:00",
  workHoursEnd: "17:00",
  workDays: [1, 2, 3, 4, 5],
  temperature: 0.7,
  maxTokens: 500,
  contextWindow: 8,
};

@Injectable()
export class AiBotService {
  private configsDir = path.join(process.cwd(), "data", "ai_bot_configs");
  private legacyConfigPath = path.join(process.cwd(), "ai_bot_config.json");
  private userConfigs = new Map<string, AiBotConfig>();
  // userId -> Map(fromJid -> pausedUntil)
  private pausedJids = new Map<string, Map<string, number>>();

  constructor(
    private readonly logger: AppLogger,
    @Optional()
    @Inject(MessageRepository)
    private readonly messageRepo?: MessageRepository,
  ) {
    this.ensureDir();
  }

  private ensureDir() {
    try {
      if (!fs.existsSync(this.configsDir)) {
        fs.mkdirSync(this.configsDir, { recursive: true });
      }
    } catch (e) {
      this.logger.warn(`Could not create configs dir: ${e}`, "AiBotService");
    }
  }

  private getUserConfigPath(userId: string = "default"): string {
    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
    return path.join(this.configsDir, `${safeUserId}.json`);
  }

  private loadUserConfig(userId: string = "default"): AiBotConfig {
    if (this.userConfigs.has(userId)) {
      return this.userConfigs.get(userId)!;
    }

    const filePath = this.getUserConfigPath(userId);
    let cfg: AiBotConfig = { ...DEFAULT_CONFIG };

    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        cfg = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      } else if (userId === "default" && fs.existsSync(this.legacyConfigPath)) {
        const raw = fs.readFileSync(this.legacyConfigPath, "utf-8");
        cfg = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      }
    } catch (e) {
      this.logger.warn(
        `Could not load AI bot config for user ${userId}`,
        "AiBotService",
      );
    }

    this.userConfigs.set(userId, cfg);
    return cfg;
  }

  private saveUserConfig(userId: string = "default"): void {
    const cfg = this.userConfigs.get(userId);
    if (!cfg) return;

    this.ensureDir();
    const filePath = this.getUserConfigPath(userId);

    try {
      fs.writeFileSync(filePath, JSON.stringify(cfg, null, 2), "utf-8");
    } catch (e) {
      this.logger.error(
        `Could not save AI bot config for user ${userId}`,
        undefined,
        "AiBotService",
      );
    }
  }

  getConfig(userId: string = "default"): AiBotConfigResponse {
    const cfg = this.loadUserConfig(userId);
    const hasKey = !!cfg.apiKey && cfg.apiKey.trim().length > 0;
    const apiKeyMasked = hasKey
      ? `${cfg.apiKey.slice(0, 4)}...${cfg.apiKey.slice(-4)}`
      : "";

    return {
      isEnabled: cfg.isEnabled,
      provider: cfg.provider,
      model: cfg.model,
      systemPrompt: cfg.systemPrompt,
      knowledgeBase: cfg.knowledgeBase ?? "",
      handoverKeywords: cfg.handoverKeywords ?? [],
      handoverMessage: cfg.handoverMessage ?? "",
      handoverDurationMinutes: cfg.handoverDurationMinutes ?? 120,
      targetSessionIds: cfg.targetSessionIds ?? [],
      scheduleMode: cfg.scheduleMode ?? "always",
      workHoursStart: cfg.workHoursStart ?? "08:00",
      workHoursEnd: cfg.workHoursEnd ?? "17:00",
      workDays: cfg.workDays ?? [1, 2, 3, 4, 5],
      temperature: cfg.temperature ?? 0.7,
      maxTokens: cfg.maxTokens ?? 500,
      contextWindow: cfg.contextWindow ?? 8,
      apiKeyMasked,
      hasKey,
    };
  }

  updateConfig(userId: string = "default", update: Partial<AiBotConfig>): void {
    const cfg = this.loadUserConfig(userId);

    if (update.isEnabled !== undefined) cfg.isEnabled = update.isEnabled;
    if (update.provider !== undefined) cfg.provider = update.provider;
    if (update.model !== undefined) cfg.model = update.model;
    if (update.systemPrompt !== undefined) cfg.systemPrompt = update.systemPrompt;
    if (update.knowledgeBase !== undefined) cfg.knowledgeBase = update.knowledgeBase;
    if (update.handoverKeywords !== undefined) cfg.handoverKeywords = update.handoverKeywords;
    if (update.handoverMessage !== undefined) cfg.handoverMessage = update.handoverMessage;
    if (update.handoverDurationMinutes !== undefined) cfg.handoverDurationMinutes = update.handoverDurationMinutes;
    if (update.targetSessionIds !== undefined) cfg.targetSessionIds = update.targetSessionIds;
    if (update.scheduleMode !== undefined) cfg.scheduleMode = update.scheduleMode;
    if (update.workHoursStart !== undefined) cfg.workHoursStart = update.workHoursStart;
    if (update.workHoursEnd !== undefined) cfg.workHoursEnd = update.workHoursEnd;
    if (update.workDays !== undefined) cfg.workDays = update.workDays;
    if (update.temperature !== undefined) cfg.temperature = update.temperature;
    if (update.maxTokens !== undefined) cfg.maxTokens = update.maxTokens;
    if (update.contextWindow !== undefined) cfg.contextWindow = update.contextWindow;

    if (update.apiKey && update.apiKey.trim() !== "") {
      cfg.apiKey = update.apiKey.trim();
    }

    this.userConfigs.set(userId, cfg);
    this.saveUserConfig(userId);
  }

  async draftReply(
    jid: string,
    lastUserMessage?: string,
    userId: string = "default",
  ): Promise<string> {
    const cfg = this.loadUserConfig(userId);
    if (!cfg.apiKey) {
      throw new Error("API Key belum dikonfigurasi pada menu AI Assistant.");
    }

    let history: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (this.messageRepo && jid) {
      try {
        const recent = await this.messageRepo.findRecentByJid(
          jid,
          cfg.contextWindow || 8,
        );
        history = recent
          .filter((m) => m.content && !m.content.startsWith("["))
          .map((m) => ({
            role: (m.direction === "inbound" ? "user" : "assistant") as
              | "user"
              | "assistant",
            content: m.content,
          }));
      } catch {
        // ignore history lookup failure
      }
    }

    let userMsg = lastUserMessage;
    if (!userMsg && history.length > 0) {
      const lastInbound = [...history].reverse().find((h) => h.role === "user");
      userMsg = lastInbound?.content;
    }
    if (!userMsg) userMsg = "Halo kak";

    let draftPrompt =
      "Anda adalah asisten AI yang bertugas membantu agen Customer Service manusia menyusun draf balasan pesan WhatsApp yang ramah, sopan, akurat, dan ringkas dalam Bahasa Indonesia.\n" +
      (cfg.systemPrompt || "");

    if (cfg.knowledgeBase && cfg.knowledgeBase.trim() !== "") {
      draftPrompt += `\n\nKNOWLEDGE BASE & FAQ:\n${cfg.knowledgeBase}\n\nJawablah berdasarkan pengetahuan di atas jika relevan.`;
    }

    if (cfg.provider === "gemini") {
      return await this.callGemini(cfg, userMsg, draftPrompt, history);
    } else {
      return await this.callOpenAiCompatible(cfg, userMsg, draftPrompt, history);
    }
  }

  private isWithinWorkHours(
    startStr?: string,
    endStr?: string,
    workDays?: number[],
  ): boolean {
    if (!startStr || !endStr) return true;
    const now = new Date();
    // JavaScript getDay(): 0=Sun, 1=Mon, ..., 6=Sat. Normalize to 1=Mon..7=Sun
    const currentDay = now.getDay() === 0 ? 7 : now.getDay();

    if (workDays && workDays.length > 0 && !workDays.includes(currentDay)) {
      return false; // Not a working day -> after hours!
    }

    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  async generateReply(
    userMessage: string,
    fromJid?: string,
    userId: string = "default",
    sessionId?: string,
  ): Promise<string | null> {
    const cfg = this.loadUserConfig(userId);

    if (!cfg.isEnabled || !cfg.apiKey) {
      return null;
    }

    // 1. Session Binding check: if configured, only reply on targeted sessions
    if (
      sessionId &&
      cfg.targetSessionIds &&
      cfg.targetSessionIds.length > 0 &&
      !cfg.targetSessionIds.includes(sessionId)
    ) {
      return null;
    }

    // 2. Schedule Mode check: if "after_hours", only reply when OUTSIDE work hours
    if (cfg.scheduleMode === "after_hours") {
      const isWorkHours = this.isWithinWorkHours(
        cfg.workHoursStart,
        cfg.workHoursEnd,
        cfg.workDays,
      );
      if (isWorkHours) {
        // During working hours, human CS is active, so AI does not auto-reply
        return null;
      }
    }

    // 3. Human Handover check for this contact
    if (fromJid) {
      let userPausedMap = this.pausedJids.get(userId);
      if (!userPausedMap) {
        userPausedMap = new Map<string, number>();
        this.pausedJids.set(userId, userPausedMap);
      }

      const pausedUntil = userPausedMap.get(fromJid);
      if (pausedUntil && Date.now() < pausedUntil) {
        return null;
      }

      // Check keywords for handover
      const lower = userMessage.toLowerCase();
      const keywords = cfg.handoverKeywords || [];
      const isHandover = keywords.some(
        (kw) => kw && lower.includes(kw.toLowerCase().trim()),
      );

      if (isHandover) {
        const pauseMinutes = cfg.handoverDurationMinutes || 120;
        userPausedMap.set(fromJid, Date.now() + pauseMinutes * 60 * 1000);
        this.logger.log(
          `Human handover triggered for ${fromJid} (User: ${userId}). AI paused for ${pauseMinutes}m.`,
          "AiBotService",
        );
        return (
          cfg.handoverMessage ||
          "Baik kak, pesan Anda telah dialihkan ke Tim Customer Service (Manusia). Mohon tunggu sebentar ya kak."
        );
      }
    }

    try {
      this.logger.log(
        `Generating AI reply for User ${userId} via ${cfg.provider} (${cfg.model})`,
        "AiBotService",
      );

      let effectiveSystemPrompt = cfg.systemPrompt;
      if (cfg.knowledgeBase && cfg.knowledgeBase.trim() !== "") {
        effectiveSystemPrompt += `\n\nKNOWLEDGE BASE & INFORMASI BISNIS/FAQ:\n${cfg.knowledgeBase}\n\nJawablah berdasarkan pengetahuan di atas jika relevan.`;
      }

      // Fetch recent conversation history for multi-turn context
      let history: Array<{ role: "user" | "assistant"; content: string }> = [];
      if (this.messageRepo && fromJid) {
        try {
          const recent = await this.messageRepo.findRecentByJid(
            fromJid,
            cfg.contextWindow || 8,
          );
          history = recent
            .filter((m) => m.content && !m.content.startsWith("["))
            .map((m) => ({
              role: (m.direction === "inbound" ? "user" : "assistant") as
                | "user"
                | "assistant",
              content: m.content,
            }));
        } catch {
          // ignore history lookup failure
        }
      }

      if (cfg.provider === "gemini") {
        return await this.callGemini(cfg, userMessage, effectiveSystemPrompt, history);
      } else {
        return await this.callOpenAiCompatible(
          cfg,
          userMessage,
          effectiveSystemPrompt,
          history,
        );
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `AI generation error (User: ${userId}): ${errMsg}`,
        undefined,
        "AiBotService",
      );
      return null;
    }
  }

  private async callGemini(
    cfg: AiBotConfig,
    userMessage: string,
    systemPrompt: string,
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
  ): Promise<string> {
    const model = cfg.model || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.apiKey}`;

    const contents: any[] = [];
    for (const h of history) {
      contents.push({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      });
    }
    // Ensure current message is at the end
    if (
      contents.length === 0 ||
      contents[contents.length - 1].parts[0]?.text !== userMessage
    ) {
      contents.push({
        role: "user",
        parts: [{ text: userMessage }],
      });
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: cfg.temperature ?? 0.7,
          maxOutputTokens: cfg.maxTokens ?? 500,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return (
      text?.trim() ||
      "Maaf, saya tidak dapat memahami permintaan Anda saat ini."
    );
  }

  private async callOpenAiCompatible(
    cfg: AiBotConfig,
    userMessage: string,
    systemPrompt: string,
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
  ): Promise<string> {
    let baseUrl = "https://api.openai.com/v1/chat/completions";
    let defaultModel = "gpt-4o-mini";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    };

    if (cfg.provider === "openrouter") {
      baseUrl = "https://openrouter.ai/api/v1/chat/completions";
      defaultModel = "anthropic/claude-3.5-sonnet";
      headers["HTTP-Referer"] = "https://wabridge.josapratama.com";
      headers["X-Title"] = "WaBridge AI Assistant";
    } else if (cfg.provider === "deepseek") {
      baseUrl = "https://api.deepseek.com/chat/completions";
      defaultModel = "deepseek-chat";
    }

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];
    for (const h of history) {
      messages.push({ role: h.role, content: h.content });
    }
    if (
      messages.length === 1 ||
      messages[messages.length - 1].content !== userMessage
    ) {
      messages.push({ role: "user", content: userMessage });
    }

    const res = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: cfg.model || defaultModel,
        messages,
        temperature: cfg.temperature ?? 0.7,
        max_tokens: cfg.maxTokens ?? 500,
      }),
      signal: AbortSignal.timeout(18000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${cfg.provider.toUpperCase()} API error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const text = data?.choices?.[0]?.message?.content;
    return text?.trim() || "Maaf, saya sedang tidak dapat merespons saat ini.";
  }
}
