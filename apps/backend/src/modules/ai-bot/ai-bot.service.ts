import { Injectable, Inject, Optional } from "@nestjs/common";
import { AppLogger } from "../../common/logger/app.logger";
import { MessageRepository } from "../../repositories/interfaces";
import * as fs from "fs";
import * as path from "path";

export interface AiBotConfig {
  isEnabled: boolean;
  provider: "gemini" | "openai" | "openrouter";
  apiKey: string;
  model: string;
  systemPrompt: string;
  knowledgeBase?: string;
  handoverKeywords?: string[];
  handoverMessage?: string;
}

@Injectable()
export class AiBotService {
  private configPath = path.join(process.cwd(), "ai_bot_config.json");
  private pausedJids = new Map<string, number>();

  private config: AiBotConfig = {
    isEnabled: false,
    provider: "gemini",
    apiKey: "",
    model: "gemini-1.5-flash",
    systemPrompt:
      "Anda adalah asisten virtual WhatsApp yang ramah, profesional, dan membantu. Jawab pertanyaan pengguna dengan jelas, sopan, dan ringkas dalam Bahasa Indonesia.",
    knowledgeBase: "",
    handoverKeywords: ["cs", "admin", "human", "manusia", "bantuan", "operator"],
    handoverMessage:
      "Baik kak, pesan Anda telah dialihkan ke Tim Customer Service (Manusia). Mohon tunggu sebentar ya kak.",
  };

  constructor(
    private readonly logger: AppLogger,
    @Optional()
    @Inject(MessageRepository)
    private readonly messageRepo?: MessageRepository,
  ) {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, "utf-8");
        this.config = { ...this.config, ...JSON.parse(raw) };
      }
    } catch (e) {
      this.logger.warn("Could not load AI bot config file", "AiBotService");
    }
  }

  private saveConfig() {
    try {
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        "utf-8",
      );
    } catch (e) {
      this.logger.error(
        "Could not save AI bot config file",
        undefined,
        "AiBotService",
      );
    }
  }

  getConfig(): Omit<AiBotConfig, "apiKey"> & {
    apiKeyMasked: string;
    hasKey: boolean;
  } {
    const hasKey = !!this.config.apiKey;
    const apiKeyMasked = hasKey
      ? `${this.config.apiKey.slice(0, 4)}...${this.config.apiKey.slice(-4)}`
      : "";
    return {
      isEnabled: this.config.isEnabled,
      provider: this.config.provider,
      model: this.config.model,
      systemPrompt: this.config.systemPrompt,
      knowledgeBase: this.config.knowledgeBase ?? "",
      handoverKeywords: this.config.handoverKeywords ?? [],
      handoverMessage: this.config.handoverMessage ?? "",
      apiKeyMasked,
      hasKey,
    };
  }

  updateConfig(update: Partial<AiBotConfig>): void {
    if (update.isEnabled !== undefined) this.config.isEnabled = update.isEnabled;
    if (update.provider !== undefined) this.config.provider = update.provider;
    if (update.model !== undefined) this.config.model = update.model;
    if (update.systemPrompt !== undefined)
      this.config.systemPrompt = update.systemPrompt;
    if (update.knowledgeBase !== undefined)
      this.config.knowledgeBase = update.knowledgeBase;
    if (update.handoverKeywords !== undefined)
      this.config.handoverKeywords = update.handoverKeywords;
    if (update.handoverMessage !== undefined)
      this.config.handoverMessage = update.handoverMessage;
    if (update.apiKey && update.apiKey.trim() !== "") {
      this.config.apiKey = update.apiKey.trim();
    }
    this.saveConfig();
  }

  async generateReply(
    userMessage: string,
    fromJid?: string,
  ): Promise<string | null> {
    if (!this.config.isEnabled || !this.config.apiKey) {
      return null;
    }

    // Check if this contact has requested human handover
    if (fromJid) {
      const pausedUntil = this.pausedJids.get(fromJid);
      if (pausedUntil && Date.now() < pausedUntil) {
        return null;
      }

      // Check keywords for handover
      const lower = userMessage.toLowerCase();
      const keywords = this.config.handoverKeywords || [];
      const isHandover = keywords.some(
        (kw) => kw && lower.includes(kw.toLowerCase().trim()),
      );

      if (isHandover) {
        // Pause bot for this user for 2 hours
        this.pausedJids.set(fromJid, Date.now() + 2 * 60 * 60 * 1000);
        this.logger.log(
          `Human handover requested by ${fromJid}. Bot paused for 2 hours.`,
          "AiBotService",
        );
        return (
          this.config.handoverMessage ||
          "Pesan Anda telah diteruskan ke Customer Service. Mohon ditunggu ya."
        );
      }
    }

    try {
      this.logger.log(
        `Generating AI reply using provider ${this.config.provider} (${this.config.model})`,
        "AiBotService",
      );

      let effectiveSystemPrompt = this.config.systemPrompt;
      if (this.config.knowledgeBase && this.config.knowledgeBase.trim() !== "") {
        effectiveSystemPrompt += `\n\nKNOWLEDGE BASE & INFORMASI BISNIS/FAQ:\n${this.config.knowledgeBase}\n\nJawablah berdasarkan pengetahuan di atas jika relevan.`;
      }

      // Fetch recent conversation history for multi-turn context
      let history: Array<{ role: "user" | "assistant"; content: string }> = [];
      if (this.messageRepo && fromJid) {
        try {
          const recent = await this.messageRepo.findRecentByJid(fromJid, 8);
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

      if (this.config.provider === "gemini") {
        return await this.callGemini(userMessage, effectiveSystemPrompt, history);
      } else {
        return await this.callOpenAiCompatible(
          userMessage,
          effectiveSystemPrompt,
          history,
        );
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `AI generation error: ${errMsg}`,
        undefined,
        "AiBotService",
      );
      return null;
    }
  }

  private async callGemini(
    userMessage: string,
    systemPrompt: string,
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model || "gemini-1.5-flash"}:generateContent?key=${this.config.apiKey}`;

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
    userMessage: string,
    systemPrompt: string,
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
  ): Promise<string> {
    const baseUrl =
      this.config.provider === "openrouter"
        ? "https://openrouter.ai/api/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || "gpt-4o-mini",
        messages,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LLM API error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const text = data?.choices?.[0]?.message?.content;
    return text?.trim() || "Maaf, saya sedang tidak dapat merespons saat ini.";
  }
}
