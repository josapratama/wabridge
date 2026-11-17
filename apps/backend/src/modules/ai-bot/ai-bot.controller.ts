import { Controller, Get, Post, Body, Req, UseGuards } from "@nestjs/common";
import { AiBotService, AiBotConfig } from "./ai-bot.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("ai-bot")
@UseGuards(JwtAuthGuard)
export class AiBotController {
  constructor(private readonly service: AiBotService) {}

  @Get("config")
  getConfig(@Req() req: any) {
    const userId = req.user?.id || "default";
    return this.service.getConfig(userId);
  }

  @Post("config")
  updateConfig(@Req() req: any, @Body() body: Partial<AiBotConfig>) {
    const userId = req.user?.id || "default";
    this.service.updateConfig(userId, body);
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
  getJidStatus(@Req() req: any, @Req() request: any) {
    const userId = req.user?.id || "default";
    const jid = request.query?.jid;
    if (!jid) return { isPaused: false, pausedUntil: null };
    return this.service.getJidStatus(userId, jid);
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
}
