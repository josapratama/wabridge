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
import { MessageTemplatesService } from "./message-templates.service";
import { CreateTemplateDto, RenderTemplateDto } from "./dto/template.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("message-templates")
@UseGuards(JwtAuthGuard)
export class MessageTemplatesController {
  constructor(private readonly service: MessageTemplatesService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateTemplateDto) {
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
    @Body() dto: Partial<CreateTemplateDto>,
  ) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param("id") id: string, @Request() req: any) {
    return this.service.delete(id, req.user.id);
  }

  @Post(":id/render")
  render(
    @Param("id") id: string,
    @Request() req: any,
    @Body() dto: RenderTemplateDto,
  ) {
    return this.service.renderById(id, req.user.id, dto.variables);
  }
}
