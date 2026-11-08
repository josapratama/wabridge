import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiKeysService } from "./api-keys.service";
import { CreateApiKeyDto } from "./dto/create-api-key.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("api-keys")
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * POST /api-keys
   * Create a new API key. Returns the plain key ONCE.
   */
  @Post()
  async create(@Request() req: any, @Body() dto: CreateApiKeyDto) {
    const { apiKey, plainKey } = await this.apiKeysService.create(
      req.user.id,
      dto,
    );
    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      key: plainKey, // shown only once
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * GET /api-keys
   * List all API keys for the current user (no plain keys).
   */
  @Get()
  async list(@Request() req: any) {
    const keys = await this.apiKeysService.listByUser(req.user.id);
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
    }));
  }

  /**
   * DELETE /api-keys/:id
   * Revoke an API key.
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@Param("id") id: string, @Request() req: any) {
    await this.apiKeysService.revoke(id, req.user.id);
  }
}
