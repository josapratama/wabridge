import { Module } from "@nestjs/common";
import { ApiKeysService } from "./api-keys.service";
import { ApiKeysController } from "./api-keys.controller";
import { ApiKeyGuard } from "./guards/api-key.guard";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { RateLimitModule } from "../rate-limit/rate-limit.module";
import { IpWhitelistModule } from "../ip-whitelist/ip-whitelist.module";

@Module({
  imports: [RepositoriesModule, RateLimitModule, IpWhitelistModule],
  providers: [ApiKeysService, ApiKeyGuard],
  controllers: [ApiKeysController],
  exports: [ApiKeysService, ApiKeyGuard],
})
export class ApiKeysModule {}
