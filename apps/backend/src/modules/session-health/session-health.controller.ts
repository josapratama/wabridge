import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { SessionHealthService } from "./session-health.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("session-health")
@UseGuards(JwtAuthGuard)
export class SessionHealthController {
  constructor(private readonly service: SessionHealthService) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Get(":sessionId")
  getForSession(@Param("sessionId") sessionId: string) {
    return this.service.getForSession(sessionId);
  }
}
