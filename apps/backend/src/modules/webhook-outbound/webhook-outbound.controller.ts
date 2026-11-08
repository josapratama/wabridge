import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { WebhookOutboundService } from "./webhook-outbound.service";
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WEBHOOK_EVENTS,
} from "./dto/create-webhook.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("webhook-endpoints")
@UseGuards(JwtAuthGuard)
export class WebhookOutboundController {
  constructor(private readonly service: WebhookOutboundService) {}

  @Get("events")
  getAvailableEvents() {
    return WEBHOOK_EVENTS;
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateWebhookDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  list(@Request() req: any) {
    return this.service.list(req.user.id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Request() req: any,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param("id") id: string, @Request() req: any) {
    return this.service.delete(id, req.user.id);
  }

  @Post(":id/test")
  testEndpoint(@Param("id") id: string, @Request() req: any) {
    return this.service.testEndpoint(id, req.user.id);
  }

  @Get("logs/all")
  getAllLogs(@Request() req: any) {
    return this.service.getAllLogs(req.user.id);
  }

  @Post("logs/:logId/retry")
  retryLog(@Param("logId") logId: string, @Request() req: any) {
    return this.service.retry(logId, req.user.id);
  }

  @Get(":id/logs")
  getLogs(@Param("id") id: string, @Request() req: any) {
    return this.service.getLogs(id, req.user.id);
  }
}
