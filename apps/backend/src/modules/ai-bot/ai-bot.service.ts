import { Injectable, Inject, Optional, OnModuleInit, NotFoundException } from "@nestjs/common";
import { AppLogger } from "../../common/logger/app.logger";
import { MessageRepository, SessionRepository } from "../../repositories/interfaces";
import { DRIZZLE_CLIENT } from "../../common/database/database.module";
import * as schema from "../../common/database/drizzle/schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";

export interface AiBotProfile {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  provider: "gemini" | "openai" | "openrouter" | "deepseek" | "grok";
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
  senderFilterMode?: "all" | "whitelist" | "blacklist"; // default: "all"
  whitelistNumbers?: string[]; // e.g. ["628123456789"]
  blacklistNumbers?: string[]; // e.g. ["628111222333"]
  ignoreGroups?: boolean; // default: true (AI only answers private DMs)
  createdAt: string;
  updatedAt: string;
}

export type AiBotConfig = AiBotProfile;

export type AiBotProfileResponse = Omit<AiBotProfile, "apiKey"> & {
  apiKeyMasked: string;
  hasKey: boolean;
  sessionCount?: number;
};

export type AiBotConfigResponse = AiBotProfileResponse;

const DEFAULT_PROFILE_TEMPLATE: Omit<AiBotProfile, "id" | "name" | "createdAt" | "updatedAt"> = {
  description: "Asisten otomatis WhatsApp",
  isEnabled: false,
  provider: "gemini",
  apiKey: "",
  model: "gemini-3.6-flash",
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
  senderFilterMode: "all",
  whitelistNumbers: [],
  blacklistNumbers: [],
  ignoreGroups: true,
};

@Injectable()
export class AiBotService implements OnModuleInit {
  private profilesDir = path.join(process.cwd(), "data", "ai_bot_profiles");
  private legacyConfigsDir = path.join(process.cwd(), "data", "ai_bot_configs");
  private legacyConfigPath = path.join(process.cwd(), "ai_bot_config.json");
  private profiles = new Map<string, AiBotProfile>();
  // userId -> Map(fromJid -> pausedUntil)
  private pausedJids = new Map<string, Map<string, number>>();
  private statsByUserId = new Map<string, { repliesSentToday: number; lastResetDate: string }>();

  constructor(
    private readonly logger: AppLogger,
    @Optional()
    @Inject(MessageRepository)
    private readonly messageRepo?: MessageRepository,
    @Optional()
    @Inject(SessionRepository)
    private readonly sessionRepo?: SessionRepository,
    @Optional()
    @Inject(DRIZZLE_CLIENT)
    private readonly db?: NodePgDatabase<typeof schema>,
  ) {
    this.ensureDir();
  }

  private ensureDir() {
    try {
      if (!fs.existsSync(this.profilesDir)) {
        fs.mkdirSync(this.profilesDir, { recursive: true });
      }
    } catch (e) {
      this.logger.warn(`Could not create ai_bot_profiles dir: ${e}`, "AiBotService");
    }
  }

  async onModuleInit() {
    this.ensureDir();
    await this.loadAllProfiles();
  }

  private async loadAllProfiles() {
    // 1. Load profiles from disk
    try {
      if (fs.existsSync(this.profilesDir)) {
        const files = fs.readdirSync(this.profilesDir);
        for (const file of files) {
          if (file.endsWith(".json")) {
            const raw = fs.readFileSync(path.join(this.profilesDir, file), "utf-8");
            const parsed = JSON.parse(raw) as AiBotProfile;
            if (parsed.id) {
              this.profiles.set(parsed.id, parsed);
            }
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Error reading profiles from disk: ${err}`, "AiBotService");
    }

    // 2. Preload/sync from DB table AiBotConfig
    if (this.db) {
      try {
        const rows = await this.db.select().from(schema.aiBotConfigs);
        for (const row of rows) {
          const existing = this.profiles.get(row.id);
          const now = new Date().toISOString();
          const p: AiBotProfile = {
            id: row.id,
            userId: row.userId || undefined,
            name: existing?.name || (row as any).name || "Default Assistant",
            description: existing?.description || (row as any).description || "Asisten WhatsApp",
            isEnabled: row.isEnabled,
            provider: (row.provider as any) || existing?.provider || "gemini",
            apiKey: row.apiKey || existing?.apiKey || "",
            model: row.model || existing?.model || "gemini-3.6-flash",
            systemPrompt: row.systemPrompt || existing?.systemPrompt || DEFAULT_PROFILE_TEMPLATE.systemPrompt,
            knowledgeBase: row.knowledgeBase ?? existing?.knowledgeBase ?? "",
            handoverKeywords:
              (row.handoverKeywords as string[]) ??
              existing?.handoverKeywords ??
              DEFAULT_PROFILE_TEMPLATE.handoverKeywords,
            handoverMessage:
              row.handoverMessage ??
              existing?.handoverMessage ??
              DEFAULT_PROFILE_TEMPLATE.handoverMessage,
            handoverDurationMinutes:
              existing?.handoverDurationMinutes ?? DEFAULT_PROFILE_TEMPLATE.handoverDurationMinutes,
            targetSessionIds: existing?.targetSessionIds ?? [],
            scheduleMode: existing?.scheduleMode ?? "always",
            workHoursStart: existing?.workHoursStart ?? "08:00",
            workHoursEnd: existing?.workHoursEnd ?? "17:00",
            workDays: existing?.workDays ?? [1, 2, 3, 4, 5],
            temperature: existing?.temperature ?? 0.7,
            maxTokens: existing?.maxTokens ?? 500,
            contextWindow: existing?.contextWindow ?? 8,
            senderFilterMode: existing?.senderFilterMode ?? "all",
            whitelistNumbers: existing?.whitelistNumbers ?? [],
            blacklistNumbers: existing?.blacklistNumbers ?? [],
            ignoreGroups: existing?.ignoreGroups ?? true,
            createdAt: existing?.createdAt || now,
            updatedAt: row.updatedAt?.toISOString() || now,
          };
          this.profiles.set(p.id, p);
          this.saveProfileToDisk(p);
        }
      } catch (err) {
        this.logger.warn(`Could not preload AiBotConfig from DB: ${err}`, "AiBotService");
      }
    }

    // 3. If no profile exists yet, migrate legacy config or create initial default
    if (this.profiles.size === 0) {
      const now = new Date().toISOString();
      let migrated: Partial<AiBotProfile> = {};

      if (fs.existsSync(this.legacyConfigPath)) {
        try {
          migrated = JSON.parse(fs.readFileSync(this.legacyConfigPath, "utf-8"));
        } catch {}
      } else if (fs.existsSync(this.legacyConfigsDir)) {
        try {
          const files = fs.readdirSync(this.legacyConfigsDir);
          if (files.length > 0 && files[0].endsWith(".json")) {
            migrated = JSON.parse(
              fs.readFileSync(path.join(this.legacyConfigsDir, files[0]), "utf-8"),
            );
          }
        } catch {}
      }

      const defaultProfile: AiBotProfile = {
        id: "default-assistant",
        name: "Default Assistant",
        description: "Asisten WhatsApp Utama",
        ...DEFAULT_PROFILE_TEMPLATE,
        ...migrated,
        createdAt: now,
        updatedAt: now,
      };

      this.profiles.set(defaultProfile.id, defaultProfile);
      this.saveProfileToDisk(defaultProfile);
      void this.saveProfileToDb(defaultProfile);
    }
  }

  private saveProfileToDisk(p: AiBotProfile): void {
    this.ensureDir();
    const filePath = path.join(this.profilesDir, `${p.id}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(p, null, 2), "utf-8");
    } catch (e) {
      this.logger.error(`Could not save profile ${p.id} to disk: ${e}`, undefined, "AiBotService");
    }
  }

  private async saveProfileToDb(p: AiBotProfile): Promise<void> {
    if (!this.db) return;
    try {
      let targetUserId = p.userId || null;
      if (!targetUserId) {
        const anyUser = await this.db.select({ id: schema.users.id }).from(schema.users).limit(1);
        if (anyUser.length > 0) targetUserId = anyUser[0].id;
      }

      const existing = await this.db
        .select()
        .from(schema.aiBotConfigs)
        .where(eq(schema.aiBotConfigs.id, p.id))
        .limit(1);

      if (existing.length > 0) {
        await this.db
          .update(schema.aiBotConfigs)
          .set({
            isEnabled: p.isEnabled,
            provider: p.provider,
            apiKey: p.apiKey,
            model: p.model,
            systemPrompt: p.systemPrompt,
            knowledgeBase: p.knowledgeBase ?? null,
            handoverKeywords: p.handoverKeywords ?? null,
            handoverMessage: p.handoverMessage ?? null,
            updatedAt: new Date(),
          })
          .where(eq(schema.aiBotConfigs.id, p.id));
      } else {
        await this.db.insert(schema.aiBotConfigs).values({
          id: p.id,
          userId: targetUserId,
          isEnabled: p.isEnabled,
          provider: p.provider,
          apiKey: p.apiKey,
          model: p.model,
          systemPrompt: p.systemPrompt,
          knowledgeBase: p.knowledgeBase ?? null,
          handoverKeywords: p.handoverKeywords ?? null,
          handoverMessage: p.handoverMessage ?? null,
          updatedAt: new Date(),
        });
      }
    } catch (e) {
      this.logger.warn(`Could not sync profile ${p.id} to database: ${e}`, "AiBotService");
    }
  }

  private toResponse(p: AiBotProfile, sessionCount: number = 0): AiBotProfileResponse {
    const hasKey = !!p.apiKey && p.apiKey.trim().length > 0;
    const apiKeyMasked = hasKey ? `${p.apiKey.slice(0, 4)}...${p.apiKey.slice(-4)}` : "";
    const { apiKey, ...safe } = p;
    return {
      ...safe,
      apiKeyMasked,
      hasKey,
      sessionCount,
    };
  }

  // ── Profile CRUD ───────────────────────────────────────────────────────────

  async listProfiles(userId?: string): Promise<AiBotProfileResponse[]> {
    // Count connected sessions per profile
    const sessionCountMap = new Map<string, number>();
    if (this.sessionRepo) {
      try {
        const sessions = await this.sessionRepo.findAll();
        for (const s of sessions) {
          const profileId = (s.metadata?.aiProfileId as string) || (s.metadata?.aiBotConfigId as string);
          if (profileId) {
            sessionCountMap.set(profileId, (sessionCountMap.get(profileId) || 0) + 1);
          }
        }
      } catch {}
    }

    const result: AiBotProfileResponse[] = [];
    for (const p of this.profiles.values()) {
      if (userId && p.userId && p.userId !== userId) continue;
      const explicitCount = sessionCountMap.get(p.id) || 0;
      const targetCount = (p.targetSessionIds || []).length;
      result.push(this.toResponse(p, Math.max(explicitCount, targetCount)));
    }

    // Sort by name or creation
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  getProfile(profileId: string, userId?: string): AiBotProfileResponse {
    const p = this.profiles.get(profileId);
    if (!p) throw new NotFoundException(`AI Profile ${profileId} not found`);
    return this.toResponse(p);
  }

  async createProfile(userId: string, data: Partial<AiBotProfile>): Promise<AiBotProfileResponse> {
    const now = new Date().toISOString();
    const id = uuidv4();
    const p: AiBotProfile = {
      ...DEFAULT_PROFILE_TEMPLATE,
      ...data,
      id,
      userId,
      name: data.name?.trim() || "Profil AI Baru",
      description: data.description?.trim() || "",
      isEnabled: data.isEnabled ?? false,
      createdAt: now,
      updatedAt: now,
    };

    this.profiles.set(id, p);
    this.saveProfileToDisk(p);
    await this.saveProfileToDb(p);
    this.logger.log(`Created AI Profile "${p.name}" (${p.id})`, "AiBotService");
    return this.toResponse(p, 0);
  }

  async updateProfile(
    profileId: string,
    userId: string,
    update: Partial<AiBotProfile>,
  ): Promise<AiBotProfileResponse> {
    let p = this.profiles.get(profileId);
    if (!p) throw new NotFoundException(`AI Profile ${profileId} not found`);

    const now = new Date().toISOString();
    // Keep existing apiKey if not provided or empty
    const apiKey =
      update.apiKey !== undefined && update.apiKey.trim() !== "" ? update.apiKey : p.apiKey;

    p = {
      ...p,
      ...update,
      apiKey,
      id: profileId,
      updatedAt: now,
    };

    this.profiles.set(profileId, p);
    this.saveProfileToDisk(p);
    await this.saveProfileToDb(p);
    this.logger.log(`Updated AI Profile "${p.name}" (${p.id})`, "AiBotService");
    return this.toResponse(p);
  }

  async deleteProfile(profileId: string, userId?: string): Promise<{ success: boolean }> {
    const p = this.profiles.get(profileId);
    if (!p) throw new NotFoundException(`AI Profile ${profileId} not found`);

    this.profiles.delete(profileId);

    // Delete disk file
    const filePath = path.join(this.profilesDir, `${profileId}.json`);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}

    // Delete DB record
    if (this.db) {
      try {
        await this.db.delete(schema.aiBotConfigs).where(eq(schema.aiBotConfigs.id, profileId));
      } catch {}
    }

    // Clean up session associations
    if (this.sessionRepo) {
      try {
        const sessions = await this.sessionRepo.findAll();
        for (const s of sessions) {
          if (s.metadata?.aiProfileId === profileId || s.metadata?.aiBotConfigId === profileId) {
            const metadata = { ...s.metadata, aiProfileId: null, aiBotConfigId: null };
            await this.sessionRepo.update(s.id, { metadata });
          }
        }
      } catch {}
    }

    this.logger.log(`Deleted AI Profile ${profileId}`, "AiBotService");
    return { success: true };
  }

  async duplicateProfile(profileId: string, userId: string): Promise<AiBotProfileResponse> {
    const orig = this.profiles.get(profileId);
    if (!orig) throw new NotFoundException(`AI Profile ${profileId} not found`);

    const copyData: Partial<AiBotProfile> = {
      ...orig,
      name: `${orig.name} (Salinan)`,
      targetSessionIds: [], // Start unbound
      isEnabled: false, // Start paused
    };

    return this.createProfile(userId, copyData);
  }

  async toggleProfile(profileId: string, userId: string): Promise<AiBotProfileResponse> {
    const p = this.profiles.get(profileId);
    if (!p) throw new NotFoundException(`AI Profile ${profileId} not found`);
    return this.updateProfile(profileId, userId, { isEnabled: !p.isEnabled });
  }

  // ── Backward Compatible / Legacy Single-Config Endpoints ───────────────────

  getConfig(userId: string = "default"): AiBotConfigResponse {
    // Return first profile or default
    const first = Array.from(this.profiles.values())[0];
    if (first) return this.toResponse(first);
    return this.toResponse({
      id: "default-assistant",
      name: "Default Assistant",
      ...DEFAULT_PROFILE_TEMPLATE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async updateConfig(userId: string = "default", update: Partial<AiBotConfig>): Promise<void> {
    const first = Array.from(this.profiles.values())[0];
    if (first) {
      await this.updateProfile(first.id, userId, update);
    } else {
      await this.createProfile(userId, { name: "Default Assistant", ...update });
    }
  }

  // ── Handover & JID Pause Helpers ───────────────────────────────────────────

  pauseForJid(
    userId: string,
    jid: string,
    durationMinutes: number = 120,
  ): { paused: boolean; pausedUntil: number } {
    let userPaused = this.pausedJids.get(userId);
    if (!userPaused) {
      userPaused = new Map<string, number>();
      this.pausedJids.set(userId, userPaused);
    }
    const pausedUntil = Date.now() + durationMinutes * 60 * 1000;
    userPaused.set(jid, pausedUntil);
    this.logger.log(`AI manually paused for ${jid} until ${new Date(pausedUntil).toISOString()}`);
    return { paused: true, pausedUntil };
  }

  resumeForJid(userId: string, jid: string): { resumed: boolean } {
    const userPaused = this.pausedJids.get(userId);
    if (userPaused) {
      userPaused.delete(jid);
    }
    this.logger.log(`AI manually resumed for ${jid}`);
    return { resumed: true };
  }

  isPaused(userId: string, jid: string): boolean {
    const userPaused = this.pausedJids.get(userId);
    if (!userPaused) return false;
    const pausedUntil = userPaused.get(jid);
    if (!pausedUntil) return false;
    return Date.now() < pausedUntil;
  }

  private recordReplyStat(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const existing = this.statsByUserId.get(userId);
    if (!existing || existing.lastResetDate !== today) {
      this.statsByUserId.set(userId, { repliesSentToday: 1, lastResetDate: today });
    } else {
      existing.repliesSentToday += 1;
    }
  }

  getStats(userId: string = "default"): { repliesSentToday: number } {
    const today = new Date().toISOString().slice(0, 10);
    const existing = this.statsByUserId.get(userId);
    if (!existing || existing.lastResetDate !== today) return { repliesSentToday: 0 };
    return { repliesSentToday: existing.repliesSentToday };
  }

  private isWithinWorkHours(startStr?: string, endStr?: string, workDays?: number[]): boolean {
    if (!startStr || !endStr) return true;
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 7 : now.getDay();
    if (workDays && workDays.length > 0 && !workDays.includes(currentDay)) return false;

    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  // ── Multi-Session Resolution & Reply Generation ────────────────────────────

  private async resolveProfileForSession(sessionId?: string): Promise<AiBotProfile | null> {
    if (!sessionId) {
      // Return first enabled profile
      for (const p of this.profiles.values()) {
        if (p.isEnabled) return p;
      }
      return null;
    }

    // 1. Check if session has explicit metadata.aiProfileId
    if (this.sessionRepo) {
      try {
        const session = await this.sessionRepo.findById(sessionId);
        const explicitId =
          (session?.metadata?.aiProfileId as string) || (session?.metadata?.aiBotConfigId as string);
        if (explicitId) {
          const profile = this.profiles.get(explicitId);
          if (profile) return profile;
        }
      } catch {}
    }

    // 2. Check if any profile has targetSessionIds containing this sessionId
    for (const p of this.profiles.values()) {
      if (p.targetSessionIds && p.targetSessionIds.includes(sessionId)) {
        return p;
      }
    }

    // 3. Fallback: check if there is an active profile configured for all sessions (empty targetSessionIds)
    for (const p of this.profiles.values()) {
      if (p.isEnabled && (!p.targetSessionIds || p.targetSessionIds.length === 0)) {
        return p;
      }
    }

    return null;
  }

  async generateReply(
    userMessage: string,
    fromJid?: string,
    userId: string = "default",
    sessionId?: string,
  ): Promise<string | null> {
    const profile = await this.resolveProfileForSession(sessionId);
    if (!profile || !profile.isEnabled || !profile.apiKey) {
      return null;
    }

    // 0. Group chat filter: ignore group messages if ignoreGroups is true
    const isGroup = fromJid?.includes("@g.us");
    if (isGroup && (profile.ignoreGroups ?? true)) {
      return null;
    }

    // 1. Sender Phone Number Filter (Whitelist / Blacklist)
    if (fromJid) {
      const senderPhone = fromJid.split("@")[0].replace(/\D/g, "");
      if (senderPhone) {
        if (profile.senderFilterMode === "whitelist") {
          const allowed = profile.whitelistNumbers || [];
          if (allowed.length > 0) {
            const matches = allowed.some((num) => {
              const clean = num.replace(/\D/g, "");
              if (!clean) return false;
              return (
                senderPhone === clean ||
                senderPhone.endsWith(clean) ||
                clean.endsWith(senderPhone)
              );
            });
            if (!matches) return null;
          }
        } else if (profile.senderFilterMode === "blacklist") {
          const blocked = profile.blacklistNumbers || [];
          if (blocked.length > 0) {
            const matches = blocked.some((num) => {
              const clean = num.replace(/\D/g, "");
              if (!clean) return false;
              return (
                senderPhone === clean ||
                senderPhone.endsWith(clean) ||
                clean.endsWith(senderPhone)
              );
            });
            if (matches) return null;
          }
        }
      }
    }

    // 2. Schedule Mode check: if "after_hours", only reply outside work hours
    if (profile.scheduleMode === "after_hours") {
      const isWorkHours = this.isWithinWorkHours(
        profile.workHoursStart,
        profile.workHoursEnd,
        profile.workDays,
      );
      if (isWorkHours) return null;
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
      const keywords = profile.handoverKeywords || [];
      const isHandover = keywords.some(
        (kw) => kw && lower.includes(kw.toLowerCase().trim()),
      );

      if (isHandover) {
        const pauseMinutes = profile.handoverDurationMinutes || 120;
        userPausedMap.set(fromJid, Date.now() + pauseMinutes * 60 * 1000);
        this.logger.log(
          `Human handover triggered for ${fromJid} (Profile: "${profile.name}"). AI paused for ${pauseMinutes}m.`,
          "AiBotService",
        );
        return (
          profile.handoverMessage ||
          "Baik kak, pesan Anda telah dialihkan ke Tim Customer Service (Manusia). Mohon tunggu sebentar ya kak."
        );
      }
    }

    try {
      this.logger.log(
        `Generating AI reply via profile "${profile.name}" (${profile.provider}/${profile.model})`,
        "AiBotService",
      );

      let effectiveSystemPrompt = profile.systemPrompt;
      if (profile.knowledgeBase && profile.knowledgeBase.trim() !== "") {
        effectiveSystemPrompt += `\n\nKNOWLEDGE BASE & INFORMASI BISNIS/FAQ:\n${profile.knowledgeBase}\n\nJawablah berdasarkan pengetahuan di atas jika relevan.`;
      }

      // Fetch recent conversation history for multi-turn context
      let history: Array<{ role: "user" | "assistant"; content: string }> = [];
      if (this.messageRepo && fromJid) {
        try {
          const recent = await this.messageRepo.findRecentByJid(
            fromJid,
            profile.contextWindow || 8,
          );
          history = recent
            .filter((m) => m.content && !m.content.startsWith("["))
            .map((m) => ({
              role: (m.direction === "inbound" ? "user" : "assistant") as "user" | "assistant",
              content: m.content,
            }));
        } catch {}
      }

      let reply: string | null = null;
      if (profile.provider === "gemini") {
        reply = await this.callGemini(profile, userMessage, effectiveSystemPrompt, history);
      } else {
        reply = await this.callOpenAiCompatible(
          profile,
          userMessage,
          effectiveSystemPrompt,
          history,
        );
      }
      if (reply) {
        this.recordReplyStat(userId);
      }
      return reply;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `AI generation error (Profile: "${profile.name}"): ${errMsg}`,
        undefined,
        "AiBotService",
      );
      return null;
    }
  }

  // ── Simulator Test per Profile ─────────────────────────────────────────────

  async testProfile(
    profileId: string,
    message: string,
    userId: string = "default",
  ): Promise<{ reply: string }> {
    const profile = this.profiles.get(profileId);
    if (!profile) throw new NotFoundException(`AI Profile ${profileId} not found`);
    if (!profile.apiKey) throw new Error("API Key belum diisi pada profil ini.");

    let effectiveSystemPrompt = profile.systemPrompt;
    if (profile.knowledgeBase && profile.knowledgeBase.trim() !== "") {
      effectiveSystemPrompt += `\n\nKNOWLEDGE BASE & INFORMASI BISNIS/FAQ:\n${profile.knowledgeBase}`;
    }

    let reply = "";
    if (profile.provider === "gemini") {
      reply = await this.callGemini(profile, message, effectiveSystemPrompt, []);
    } else {
      reply = await this.callOpenAiCompatible(profile, message, effectiveSystemPrompt, []);
    }

    return { reply };
  }

  async draftReply(jid: string, message?: string, userId: string = "default"): Promise<string> {
    const first = Array.from(this.profiles.values())[0];
    if (!first || !first.apiKey) return "AI Bot belum terkonfigurasi.";
    const userMsg = message || "Bantu buatkan draf balasan untuk pelanggan ini.";
    return (await this.testProfile(first.id, userMsg, userId)).reply;
  }

  // ── LLM HTTP Callers ───────────────────────────────────────────────────────

  private async callGemini(
    cfg: AiBotProfile,
    userMessage: string,
    systemPrompt: string,
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
  ): Promise<string> {
    const model = cfg.model || "gemini-3.6-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.apiKey}`;

    const contents: any[] = [];
    for (const h of history) {
      contents.push({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      });
    }
    if (contents.length === 0 || contents[contents.length - 1].parts[0]?.text !== userMessage) {
      contents.push({
        role: "user",
        parts: [{ text: userMessage }],
      });
    }

    const generationConfig: Record<string, any> = {
      maxOutputTokens: cfg.maxTokens ?? 500,
    };
    if (cfg.temperature !== undefined && !model.includes("gemini-3")) {
      generationConfig.temperature = cfg.temperature;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || "Maaf, saya tidak dapat memahami permintaan Anda saat ini.";
  }

  private async callOpenAiCompatible(
    cfg: AiBotProfile,
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
    } else if (cfg.provider === "grok") {
      baseUrl = "https://api.x.ai/v1/chat/completions";
      defaultModel = "grok-2-latest";
    }

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];
    for (const h of history) {
      messages.push({ role: h.role, content: h.content });
    }
    if (messages.length === 1 || messages[messages.length - 1].content !== userMessage) {
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

  async parseDocument(
    base64: string,
    filename: string,
  ): Promise<{ text: string; filename: string; length: number }> {
    const cleanBase64 = (base64 || "").replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const lowerName = (filename || "").toLowerCase();

    let extractedText = "";
    if (lowerName.endsWith(".pdf")) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfParse = require("pdf-parse");
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text || "";
      } catch (err: any) {
        this.logger.error(`Failed to parse PDF ${filename}: ${err?.message}`);
        throw new Error(`Gagal membaca file PDF: ${err?.message || "Format tidak valid"}`);
      }
    } else {
      extractedText = buffer.toString("utf-8");
    }

    extractedText = extractedText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (extractedText.length > 50000) {
      extractedText =
        extractedText.slice(0, 50000) +
        "\n\n[...Konten dokumen dipotong hingga 50.000 karakter...]";
    }

    return { text: extractedText, filename, length: extractedText.length };
  }
}
