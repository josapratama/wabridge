import { Controller, Get, Param, UseGuards, Request, Inject } from "@nestjs/common";
import { EventsService } from "./events.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SessionRepository } from "../../repositories/interfaces";

@Controller("events")
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(
    private readonly service: EventsService,
    @Inject(SessionRepository)
    private readonly sessionRepo: SessionRepository,
  ) {}

  @Get()
  async findAll(@Request() req: any) {
    const userSessions = await this.sessionRepo.findAllByUserId(req.user.id);
    const sessionIds = userSessions.map((s) => s.id);
    return this.service.findAll(sessionIds);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.service.findById(id);
  }
}
