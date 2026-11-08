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
import { TeamService } from "./team.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { IsEmail, IsIn, IsString } from "class-validator";

class InviteDto {
  @IsEmail() email!: string;
  @IsIn(["admin", "operator", "viewer"]) role!: "admin" | "operator" | "viewer";
}

class UpdateRoleDto {
  @IsIn(["admin", "operator", "viewer"]) role!: "admin" | "operator" | "viewer";
}

@Controller("team")
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private readonly service: TeamService) {}

  @Post("invite")
  invite(@Request() req: any, @Body() dto: InviteDto) {
    return this.service.invite(req.user.id, dto.email, dto.role);
  }

  @Get()
  list(@Request() req: any) {
    return this.service.list(req.user.id);
  }

  @Patch(":id/role")
  updateRole(@Param("id") id: string, @Body() dto: UpdateRoleDto) {
    return this.service.updateRole(id, dto.role);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
