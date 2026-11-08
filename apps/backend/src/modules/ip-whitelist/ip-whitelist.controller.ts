import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { IpWhitelistService } from "./ip-whitelist.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { IsOptional, IsString } from "class-validator";

class AddIpDto {
  @IsString() cidr!: string;
  @IsOptional() @IsString() label?: string;
}

@Controller("api-keys/:apiKeyId/ip-whitelist")
@UseGuards(JwtAuthGuard)
export class IpWhitelistController {
  constructor(private readonly service: IpWhitelistService) {}

  @Get()
  list(@Param("apiKeyId") apiKeyId: string) {
    return this.service.list(apiKeyId);
  }

  @Post()
  add(@Param("apiKeyId") apiKeyId: string, @Body() dto: AddIpDto) {
    return this.service.add(apiKeyId, dto.cidr, dto.label);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
