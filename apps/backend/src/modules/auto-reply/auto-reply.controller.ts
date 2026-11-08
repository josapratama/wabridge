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
import { AutoReplyService } from "./auto-reply.service";
import { CreateAutoReplyDto, UpdateAutoReplyDto } from "./dto/auto-reply.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("auto-reply-rules")
@UseGuards(JwtAuthGuard)
export class AutoReplyController {
  constructor(private readonly service: AutoReplyService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateAutoReplyDto) {
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
    @Body() dto: UpdateAutoReplyDto,
  ) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param("id") id: string, @Request() req: any) {
    return this.service.delete(id, req.user.id);
  }
}
