import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ContactsService } from "./contacts.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { IsArray, IsOptional, IsString, MinLength } from "class-validator";

class CreateContactDto {
  @IsString() @MinLength(1) name!: string;
  @IsString() @MinLength(7) phone!: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() notes?: string;
}

@Controller("contacts")
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateContactDto) {
    return this.service.create(req.user.id, dto);
  }

  @Post("sync")
  sync(@Request() req: any, @Body() body: { sessionId?: string }) {
    return this.service.syncFromWhatsApp(req.user.id, body?.sessionId);
  }

  @Get()
  list(@Request() req: any, @Query("tag") tag?: string) {
    if (tag) return this.service.getByTag(req.user.id, tag);
    return this.service.list(req.user.id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Request() req: any,
    @Body() dto: Partial<CreateContactDto>,
  ) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param("id") id: string, @Request() req: any) {
    return this.service.delete(id, req.user.id);
  }
}
