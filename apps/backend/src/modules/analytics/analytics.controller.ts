import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get("summary")
  getSummary(@Request() req: any) {
    return this.service.getSummary(req.user.id);
  }

  @Get("usage")
  getUsage(@Request() req: any) {
    return this.service.getUsage(req.user.id);
  }
}
