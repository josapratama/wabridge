import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("authhub/config")
  getAuthHubConfig() {
    return this.authService.getAuthHubConfig();
  }

  @Post("authhub/callback")
  async authHubCallback(@Body() body: { code: string }) {
    return this.authService.handleAuthHubCallback(body?.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Request() req: any) {
    return req.user;
  }
}
