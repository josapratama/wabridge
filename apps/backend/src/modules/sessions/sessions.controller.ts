import { Body, Controller, Get, Param, Patch, Post, UseGuards, Request } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { Session } from "../../common/types";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("sessions")
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateSessionDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.id);
  }

  @Get(":id")
  findById(@Param("id") id: string, @Request() req: any) {
    return this.service.findById(id, req.user.id);
  }

  @Patch(":id/activate")
  activate(@Param("id") id: string, @Request() req: any) {
    return this.service.activate(id, req.user.id);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string, @Request() req: any) {
    return this.service.deactivate(id, req.user.id);
  }

  @Get(":id/groups")
  getGroups(@Param("id") id: string, @Request() req: any) {
    return this.service.getGroups(id, req.user.id);
  }
}
