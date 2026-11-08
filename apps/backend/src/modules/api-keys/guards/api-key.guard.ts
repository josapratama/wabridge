import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { ApiKeysService } from "../api-keys.service";
import { RateLimitService } from "../../rate-limit/rate-limit.service";
import { IpWhitelistService } from "../../ip-whitelist/ip-whitelist.service";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly rateLimitService: RateLimitService,
    private readonly ipWhitelistService: IpWhitelistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const header: string | undefined =
      request.headers["x-api-key"] ??
      (request.headers["authorization"] as string | undefined)
        ?.replace(/^Bearer\s+/i, "")
        .trim();

    if (!header) throw new UnauthorizedException("API key required");

    const apiKey = await this.apiKeysService.validate(header);
    if (!apiKey) throw new UnauthorizedException("Invalid or expired API key");

    // IP whitelist check
    const clientIp =
      request.ip ?? request.headers["x-forwarded-for"] ?? "unknown";
    const allowed = await this.ipWhitelistService.isAllowed(
      apiKey.id,
      clientIp,
    );
    if (!allowed) throw new ForbiddenException("IP address not whitelisted");

    // Rate limit check
    await this.rateLimitService.check(apiKey.id);

    request.apiKey = apiKey;
    request.userId = apiKey.userId;
    return true;
  }
}
