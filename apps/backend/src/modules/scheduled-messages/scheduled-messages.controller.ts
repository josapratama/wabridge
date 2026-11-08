import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ScheduledMessagesService } from "./scheduled-messages.service";
import { CreateScheduledMessageDto } from "./dto/scheduled-message.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("scheduled-messages")
@UseGuards(JwtAuthGuard)
export class ScheduledMessagesController {
  constructor(private readonly service: ScheduledMessagesService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateScheduledMessageDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  list(@Request() req: any) {
    return this.service.list(req.user.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  cancel(@Param("id") id: string, @Request() req: any) {
    return this.service.cancel(id, req.user.id);
  }
}
