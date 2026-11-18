import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AiBotService, AiBotProfile } from "./ai-bot.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("ai-bot")
@UseGuards(JwtAuthGuard)
export class AiBotController {
  constructor(private readonly service: AiBotService) {}

  // ── AI Connections (Koneksi Provider AI) ──────────────────────────────────

  @Get("connections")
  async listConnections(@Req() req: any) {
    const userId = req.user?.id || "default";
    return this.service.listConnections(userId);
  }

  @Post("connections")
  async createConnection(@Req() req: any, @Body() body: any) {
    const userId = req.user?.id || "default";
    return this.service.createConnection(userId, body);
  }

  @Put("connections/:id")
  async updateConnection(
    @Param("id") id: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    const userId = req.user?.id || "default";
    return this.service.updateConnection(id, userId, body);
  }

  @Delete("connections/:id")
  async deleteConnection(@Param("id") id: string) {
    return this.service.deleteConnection(id);
  }

  @Post("connections/test")
  async testConnection(@Body() body: any) {
    return this.service.testConnection(body);
  }

  // ── Multi-Profile Endpoints ───────────────────────────────────────────────

  @Get("profiles")
  async listProfiles(@Req() req: any) {
    const userId = req.user?.id || "default";
    return this.service.listProfiles(userId);
  }

  @Post("profiles")
  async createProfile(@Req() req: any, @Body() body: Partial<AiBotProfile>) {
    const userId = req.user?.id || "default";
    return this.service.createProfile(userId, body);
  }

  @Get("profiles/:id")
  async getProfile(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || "default";
    return this.service.getProfile(id, userId);
  }

  @Put("profiles/:id")
  async updateProfile(
    @Param("id") id: string,
    @Req() req: any,
    @Body() body: Partial<AiBotProfile>,
  ) {
    const userId = req.user?.id || "default";
    return this.service.updateProfile(id, userId, body);
  }

  @Delete("profiles/:id")
  async deleteProfile(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || "default";
    return this.service.deleteProfile(id, userId);
  }

  @Post("profiles/:id/duplicate")
  async duplicateProfile(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || "default";
    return this.service.duplicateProfile(id, userId);
  }

  @Patch("profiles/:id/toggle")
  async toggleProfile(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id || "default";
    return this.service.toggleProfile(id, userId);
  }

  @Post("profiles/:id/test")
  async testProfile(
    @Param("id") id: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    const userId = req.user?.id || "default";
    const message = typeof body === "string" ? body : body?.message || "Halo";
    const draft = body?.draft;
    return this.service.testProfile(id, message, userId, draft);
  }

  // ── Legacy Single-Config Compatibility Endpoints ──────────────────────────

  @Get("config")
  getConfig(@Req() req: any) {
    const userId = req.user?.id || "default";
    return this.service.getConfig(userId);
  }

  @Post("config")
  async updateConfig(@Req() req: any, @Body() body: Partial<AiBotProfile>) {
    const userId = req.user?.id || "default";
    await this.service.updateConfig(userId, body);
    return { success: true, message: "AI Bot configuration updated" };
  }

  @Post("test")
  async testPrompt(@Req() req: any, @Body("message") message: string) {
    const userId = req.user?.id || "default";
    const reply = await this.service.generateReply(
      message || "Halo, apa saja layanan yang tersedia?",
      undefined,
      userId,
    );
    return { success: true, reply };
  }

  @Post("draft-reply")
  async draftReply(
    @Req() req: any,
    @Body("jid") jid: string,
    @Body("message") message?: string,
  ) {
    const userId = req.user?.id || "default";
    const reply = await this.service.draftReply(jid, message, userId);
    return { success: true, reply };
  }

  @Post("pause")
  pauseJid(
    @Req() req: any,
    @Body("jid") jid: string,
    @Body("durationMinutes") durationMinutes?: number,
  ) {
    const userId = req.user?.id || "default";
    const res = this.service.pauseForJid(userId, jid, durationMinutes || 120);
    return { success: true, ...res };
  }

  @Post("resume")
  resumeJid(@Req() req: any, @Body("jid") jid: string) {
    const userId = req.user?.id || "default";
    const res = this.service.resumeForJid(userId, jid);
    return { success: true, ...res };
  }

  @Get("status")
  getJidStatus(@Req() req: any, @Query("jid") jid: string) {
    const userId = req.user?.id || "default";
    const isPaused = this.service.isPaused(userId, jid);
    return { isPaused, pausedUntil: null };
  }

  @Get("stats")
  getStats(@Req() req: any) {
    const userId = req.user?.id || "default";
    return this.service.getStats(userId);
  }

  @Post("parse-document")
  async parseDocument(
    @Body("base64") base64: string,
    @Body("filename") filename: string,
  ) {
    return this.service.parseDocument(base64, filename);
  }

  @Post("scrape-url")
  async scrapeUrl(@Body("url") url: string) {
    return this.service.scrapeUrl(url);
  }
}
