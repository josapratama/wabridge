import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { AiBotService, AiBotConfig } from "./ai-bot.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("ai-bot")
@UseGuards(JwtAuthGuard)
export class AiBotController {
  constructor(private readonly service: AiBotService) {}

  @Get("config")
  getConfig() {
    return this.service.getConfig();
  }

  @Post("config")
  updateConfig(@Body() body: Partial<AiBotConfig>) {
    this.service.updateConfig(body);
    return { success: true, message: "AI Bot configuration updated" };
  }

  @Post("test")
  async testPrompt(@Body("message") message: string) {
    const reply = await this.service.generateReply(message || "Halo, apa saja layanan yang tersedia?");
    return { success: true, reply };
  }
}
