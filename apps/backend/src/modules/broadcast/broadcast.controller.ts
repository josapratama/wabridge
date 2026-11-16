import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { BroadcastService } from "./broadcast.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

class CreateBroadcastDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() sessionId!: string;
  @IsString() @IsNotEmpty() content!: string;
  @IsArray() @IsString({ each: true }) recipients!: string[];
  @IsOptional() @IsInt() @Min(500) @Max(30000) delayMs?: number;
}

@Controller("broadcasts")
@UseGuards(JwtAuthGuard)
export class BroadcastController {
  constructor(private readonly service: BroadcastService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateBroadcastDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  list(@Request() req: any) {
    return this.service.list(req.user.id);
  }

  @Post(":id/start")
  start(@Param("id") id: string, @Request() req: any) {
    return this.service.start(id, req.user.id);
  }

  @Post(":id/resume")
  resume(@Param("id") id: string, @Request() req: any) {
    return this.service.resume(id, req.user.id);
  }

  @Delete(":id")
  cancel(@Param("id") id: string, @Request() req: any) {
    return this.service.cancel(id, req.user.id);
  }
}
